// ===========================================
// API SAVE DOCUMENT TO DRIVE
// ===========================================
// POST /api/documents/save-to-drive
// Sauvegarde un document généré dans le Drive (avec création auto des dossiers)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { FileCategory } from "@prisma/client";

// Helper pour authentifier l'utilisateur
async function authenticateUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );

  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { organization: true },
  });

  return user;
}

interface SaveDocumentRequest {
  formationId: string;
  documentType: string;
  titre: string;
  content: string; // HTML content
  clientId?: string;
  entrepriseId?: string;
  apprenantId?: string;
}

// Mapper le type de document vers FileCategory
function mapToFileCategory(docType: string): FileCategory {
  const mapping: Record<string, FileCategory> = {
    convention: "DOCUMENT",
    contrat: "DOCUMENT",
    convocation: "DOCUMENT",
    attestation: "DOCUMENT",
    emargement: "DOCUMENT",
    facture: "DOCUMENT",
    fiche_pedagogique: "FICHE_PEDAGOGIQUE",
  };
  return mapping[docType] || "DOCUMENT";
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body: SaveDocumentRequest = await request.json();
    const { formationId, documentType, titre, content, entrepriseId, apprenantId } = body;

    if (!formationId || !documentType || !titre || !content) {
      return NextResponse.json(
        { error: "Données manquantes: formationId, documentType, titre et content sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que la formation appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        folder: true,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // S'assurer qu'un dossier racine existe pour la formation
    let formationFolder = formation.folder;
    if (!formationFolder) {
      formationFolder = await prisma.folder.create({
        data: {
          name: formation.titre,
          color: "#4277FF",
          organizationId: user.organizationId,
          formationId: formation.id,
          folderType: "formation",
        },
      });
    }

    // Déterminer le dossier cible
    let targetFolderId = formationFolder.id;

    // Si entrepriseId est fourni, créer/trouver le sous-dossier entreprise
    if (entrepriseId) {
      const entreprise = await prisma.entreprise.findFirst({
        where: {
          id: entrepriseId,
          organizationId: user.organizationId,
        },
      });

      if (entreprise) {
        let entrepriseFolder = await prisma.folder.findFirst({
          where: {
            parentId: formationFolder.id,
            entrepriseId: entreprise.id,
            organizationId: user.organizationId,
          },
        });

        if (!entrepriseFolder) {
          entrepriseFolder = await prisma.folder.create({
            data: {
              name: entreprise.raisonSociale,
              color: "#F59E0B",
              parentId: formationFolder.id,
              entrepriseId: entreprise.id,
              folderType: "entreprise",
              organizationId: user.organizationId,
            },
          });
        }

        targetFolderId = entrepriseFolder.id;

        // Si apprenantId est aussi fourni, créer/trouver le sous-dossier apprenant dans l'entreprise
        if (apprenantId) {
          const apprenant = await prisma.apprenant.findFirst({
            where: {
              id: apprenantId,
              organizationId: user.organizationId,
            },
          });

          if (apprenant) {
            let apprenantFolder = await prisma.folder.findFirst({
              where: {
                parentId: entrepriseFolder.id,
                apprenantId: apprenant.id,
                organizationId: user.organizationId,
              },
            });

            if (!apprenantFolder) {
              apprenantFolder = await prisma.folder.create({
                data: {
                  name: `${apprenant.prenom} ${apprenant.nom}`,
                  color: "#10B981",
                  parentId: entrepriseFolder.id,
                  apprenantId: apprenant.id,
                  folderType: "apprenant",
                  organizationId: user.organizationId,
                },
              });
            }

            targetFolderId = apprenantFolder.id;
          }
        }
      }
    } else if (apprenantId) {
      // Apprenant sans entreprise (particulier/indépendant)
      const apprenant = await prisma.apprenant.findFirst({
        where: {
          id: apprenantId,
          organizationId: user.organizationId,
        },
      });

      if (apprenant) {
        let apprenantFolder = await prisma.folder.findFirst({
          where: {
            parentId: formationFolder.id,
            apprenantId: apprenant.id,
            organizationId: user.organizationId,
          },
        });

        if (!apprenantFolder) {
          apprenantFolder = await prisma.folder.create({
            data: {
              name: `${apprenant.prenom} ${apprenant.nom}`,
              color: "#10B981",
              parentId: formationFolder.id,
              apprenantId: apprenant.id,
              folderType: "apprenant",
              organizationId: user.organizationId,
            },
          });
        }

        targetFolderId = apprenantFolder.id;
      }
    }

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedTitre = titre.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, "").substring(0, 50);
    const fileName = `${sanitizedTitre}_${timestamp}.html`;

    // Créer l'enregistrement du fichier dans la base de données
    const file = await prisma.file.create({
      data: {
        name: fileName,
        originalName: `${titre}.html`,
        mimeType: "text/html",
        size: Buffer.byteLength(content, "utf-8"),
        category: mapToFileCategory(documentType),
        storagePath: `documents/${user.organizationId}/${formationId}/${fileName}`,
        publicUrl: null, // Sera mis à jour après l'upload réel si nécessaire
        organizationId: user.organizationId,
        userId: user.id,
        formationId: formationId,
        folderId: targetFolderId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            folderType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        folderId: file.folderId,
        folder: file.folder,
      },
      message: `Document "${titre}" sauvegardé dans le Drive`,
    });
  } catch (error) {
    console.error("Erreur sauvegarde document dans Drive:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du document" },
      { status: 500 }
    );
  }
}
