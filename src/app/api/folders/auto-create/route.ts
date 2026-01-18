// ===========================================
// API AUTO-CREATE FOLDERS - Création automatique de sous-dossiers
// ===========================================
// POST /api/folders/auto-create - Créer les sous-dossiers entreprise/apprenant/intervenant
// + Duplication des documents de formation vers les dossiers apprenants

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";
import { duplicateDocumentsToApprenantFolders } from "@/lib/services/drive-service";

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
    const apprenantFolderIds: string[] = []; // Pour la duplication des documents

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
          formateur: true, // Inclure le formateur pour créer son dossier
        },
      });

      if (!session) {
        return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
      }

      // 1. Créer le dossier de l'intervenant/formateur
      if (session.formateurId && session.formateur) {
        const existingIntervenantFolder = await prisma.folder.findFirst({
          where: {
            parentId: formationFolder.id,
            intervenantId: session.formateurId,
            organizationId: user.organizationId,
          },
        });

        if (!existingIntervenantFolder) {
          const intervenantFolder = await prisma.folder.create({
            data: {
              name: `${session.formateur.prenom} ${session.formateur.nom}`,
              color: "#8B5CF6", // Violet pour les formateurs
              parentId: formationFolder.id,
              intervenantId: session.formateurId,
              folderType: "intervenant",
              organizationId: user.organizationId,
            },
          });
          createdFolders.push({
            type: "intervenant",
            id: intervenantFolder.id,
            name: `${session.formateur.prenom} ${session.formateur.nom}`,
          });
        }
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
              apprenantFolderIds.push(apprenantFolder.id);
            } else {
              // Le dossier existe déjà, on l'ajoute quand même pour la duplication
              apprenantFolderIds.push(existingApprenantFolder.id);
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
              apprenantFolderIds.push(apprenantFolder.id);
            } else {
              // Le dossier existe déjà, on l'ajoute quand même pour la duplication
              apprenantFolderIds.push(existingApprenantFolder.id);
            }
          }
        }
      }

      // 2. Dupliquer les documents de formation vers chaque dossier apprenant
      if (apprenantFolderIds.length > 0) {
        const duplicateResult = await duplicateDocumentsToApprenantFolders(
          formationFolder.id,
          apprenantFolderIds,
          user.organizationId,
          user.id
        );

        if (duplicateResult.copiedCount > 0) {
          console.log(`[auto-create] ${duplicateResult.copiedCount} document(s) dupliqué(s) vers les dossiers apprenants`);
        }

        if (duplicateResult.errors.length > 0) {
          console.warn("[auto-create] Erreurs de duplication:", duplicateResult.errors);
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
