// ===========================================
// API AUTO-CREATE FOLDERS - Création automatique de sous-dossiers
// ===========================================
// POST /api/folders/auto-create - Créer les sous-dossiers entreprise/apprenant

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

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

// POST - Créer automatiquement les sous-dossiers pour une session documentaire
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { formationId, sessionId } = body;

    if (!formationId) {
      return NextResponse.json({ error: "formationId requis" }, { status: 400 });
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

    const createdFolders: { type: string; id: string; name: string }[] = [];

    // Si une session est spécifiée, créer les sous-dossiers pour ses clients et participants
    if (sessionId) {
      const session = await prisma.documentSession.findFirst({
        where: {
          id: sessionId,
          formationId: formationId,
          organizationId: user.organizationId,
        },
        include: {
          clients: {
            include: {
              entreprise: true,
              participants: {
                include: {
                  apprenant: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
      }

      // Pour chaque client de la session
      for (const client of session.clients) {
        // Si c'est une entreprise
        if (client.entreprise) {
          // Vérifier si le sous-dossier entreprise existe déjà
          let entrepriseFolder = await prisma.folder.findFirst({
            where: {
              parentId: formationFolder.id,
              entrepriseId: client.entreprise.id,
              organizationId: user.organizationId,
            },
          });

          if (!entrepriseFolder) {
            entrepriseFolder = await prisma.folder.create({
              data: {
                name: client.entreprise.raisonSociale,
                color: "#F59E0B", // Orange pour entreprises
                parentId: formationFolder.id,
                entrepriseId: client.entreprise.id,
                folderType: "entreprise",
                organizationId: user.organizationId,
              },
            });
            createdFolders.push({
              type: "entreprise",
              id: entrepriseFolder.id,
              name: client.entreprise.raisonSociale,
            });
          }

          // Créer les sous-dossiers pour les apprenants de cette entreprise
          for (const participant of client.participants) {
            const apprenant = participant.apprenant;

            // Vérifier si le sous-dossier apprenant existe déjà
            const existingApprenantFolder = await prisma.folder.findFirst({
              where: {
                parentId: entrepriseFolder.id,
                apprenantId: apprenant.id,
                organizationId: user.organizationId,
              },
            });

            if (!existingApprenantFolder) {
              const apprenantFolder = await prisma.folder.create({
                data: {
                  name: `${apprenant.prenom} ${apprenant.nom}`,
                  color: "#10B981", // Vert pour apprenants
                  parentId: entrepriseFolder.id,
                  apprenantId: apprenant.id,
                  folderType: "apprenant",
                  organizationId: user.organizationId,
                },
              });
              createdFolders.push({
                type: "apprenant",
                id: apprenantFolder.id,
                name: `${apprenant.prenom} ${apprenant.nom}`,
              });
            }
          }
        } else {
          // Client particulier ou indépendant - créer directement sous le dossier formation
          for (const participant of client.participants) {
            const apprenant = participant.apprenant;

            // Vérifier si le sous-dossier apprenant existe déjà
            const existingApprenantFolder = await prisma.folder.findFirst({
              where: {
                parentId: formationFolder.id,
                apprenantId: apprenant.id,
                organizationId: user.organizationId,
              },
            });

            if (!existingApprenantFolder) {
              const apprenantFolder = await prisma.folder.create({
                data: {
                  name: `${apprenant.prenom} ${apprenant.nom}`,
                  color: "#10B981",
                  parentId: formationFolder.id,
                  apprenantId: apprenant.id,
                  folderType: "apprenant",
                  organizationId: user.organizationId,
                },
              });
              createdFolders.push({
                type: "apprenant",
                id: apprenantFolder.id,
                name: `${apprenant.prenom} ${apprenant.nom}`,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      formationFolderId: formationFolder.id,
      createdFolders,
      message: `${createdFolders.length} dossier(s) créé(s)`,
    });
  } catch (error) {
    console.error("Erreur auto-création dossiers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création automatique des dossiers" },
      { status: 500 }
    );
  }
}
