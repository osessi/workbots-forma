// ===========================================
// API FILES TREE - Structure hiérarchique des fichiers
// ===========================================
// GET /api/files/tree - Arborescence Formation > Entreprise > Apprenants > Documents

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

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
  });

  return user;
}

// GET - Récupérer l'arborescence des fichiers par formation
export async function GET() {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer tous les dossiers avec leur hiérarchie
    const folders = await prisma.folder.findMany({
      where: { organizationId: user.organizationId },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            status: true,
          },
        },
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        files: {
          include: {
            fileContent: true,
          },
          orderBy: { createdAt: "desc" },
        },
        children: {
          include: {
            entreprise: true,
            apprenant: true,
            files: {
              include: {
                fileContent: true,
              },
            },
            children: {
              include: {
                apprenant: true,
                files: {
                  include: {
                    fileContent: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Récupérer aussi les fichiers qui ne sont pas dans des dossiers mais liés à des formations
    const orphanFiles = await prisma.file.findMany({
      where: {
        organizationId: user.organizationId,
        folderId: null,
        formationId: { not: null },
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            status: true,
          },
        },
      },
    });

    // Récupérer toutes les formations (même sans dossiers)
    const formations = await prisma.formation.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        titre: true,
        status: true,
        sessions: {
          select: {
            id: true,
            participants: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        documentSessions: {
          select: {
            id: true,
            modalite: true,
            status: true,
            createdAt: true,
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
            journees: true,
          },
        },
        folder: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les documents de signature
    const signatureDocuments = await prisma.signatureDocument.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        titre: true,
        documentType: true,
        status: true,
        createdAt: true,
        sessionId: true,
        apprenantId: true,
        signatures: {
          select: {
            id: true,
            signedAt: true,
          },
        },
      },
    });

    // Récupérer les documents de session (générés par le wizard)
    const sessionDocumentsGenerated = await prisma.sessionDocument.findMany({
      where: {
        session: {
          formation: {
            organizationId: user.organizationId,
          },
        },
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        status: true,
        content: true,
        fileUrl: true,
        apprenantId: true,
        clientId: true,
        sessionId: true,
        generatedAt: true,
        createdAt: true,
        session: {
          select: {
            formationId: true,
          },
        },
      },
    });

    // Dossiers racine (formations)
    const formationFolders = folders.filter((f) => f.formationId && !f.parentId);

    // Mapper les formations vers la structure d'arborescence
    const tree = formations.map((formation) => {
      // Trouver le dossier de la formation
      const formationFolder = formationFolders.find((f) => f.formationId === formation.id);

      // Fichiers directement dans le dossier formation
      const directFiles = formationFolder?.files || [];

      // Fichiers orphelins liés à cette formation
      const formationOrphanFiles = orphanFiles.filter((f) => f.formationId === formation.id);

      // Construire la liste des sous-dossiers (entreprises ou apprenants)
      type SubfolderType = {
        id: string;
        name: string;
        type: "entreprise" | "apprenant";
        entrepriseId?: string;
        apprenantId?: string;
        email?: string;
        files: Prisma.FileGetPayload<{ include: { fileContent: true } }>[];
        children: {
          id: string;
          name: string;
          type: "apprenant";
          apprenantId: string;
          email?: string;
          files: Prisma.FileGetPayload<{ include: { fileContent: true } }>[];
        }[];
      };

      const subfolders: SubfolderType[] = [];

      if (formationFolder?.children) {
        formationFolder.children.forEach((child) => {
          if (child.entrepriseId && child.entreprise) {
            // Sous-dossier entreprise
            const entrepriseSubfolder: SubfolderType = {
              id: child.id,
              name: child.entreprise.raisonSociale,
              type: "entreprise",
              entrepriseId: child.entrepriseId,
              files: child.files || [],
              children: [],
            };

            // Sous-dossiers apprenants dans l'entreprise
            if (child.children) {
              child.children.forEach((appChild) => {
                if (appChild.apprenantId && appChild.apprenant) {
                  entrepriseSubfolder.children.push({
                    id: appChild.id,
                    name: `${appChild.apprenant.prenom} ${appChild.apprenant.nom}`,
                    type: "apprenant",
                    apprenantId: appChild.apprenantId,
                    email: appChild.apprenant.email,
                    files: appChild.files || [],
                  });
                }
              });
            }

            subfolders.push(entrepriseSubfolder);
          } else if (child.apprenantId && child.apprenant) {
            // Apprenant directement sous la formation (sans entreprise)
            subfolders.push({
              id: child.id,
              name: `${child.apprenant.prenom} ${child.apprenant.nom}`,
              type: "apprenant",
              apprenantId: child.apprenantId,
              email: child.apprenant.email,
              files: child.files || [],
              children: [],
            });
          }
        });
      }

      // Collecter tous les apprenants uniques (depuis sessions + documentSessions)
      const apprenantMap = new Map<string, {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        documents: {
          id: string;
          titre: string;
          type: string;
          status: string;
          isSigned: boolean;
          signedAt: string | null;
          createdAt: string;
          fileUrl: string | null;
          mimeType: string;
        }[];
        signedDocuments: number;
        pendingDocuments: number;
      }>();

      // Depuis les sessions classiques (Participant)
      formation.sessions.forEach((session) => {
        session.participants.forEach((p) => {
          if (!apprenantMap.has(p.id)) {
            apprenantMap.set(p.id, {
              id: p.id,
              nom: p.lastName,
              prenom: p.firstName,
              email: p.email,
              documents: [],
              signedDocuments: 0,
              pendingDocuments: 0,
            });
          }
        });
      });

      // Depuis les documentSessions (Apprenant via clients)
      formation.documentSessions.forEach((ds) => {
        ds.clients.forEach((client) => {
          client.participants.forEach((p) => {
            const apprenant = p.apprenant;
            if (!apprenantMap.has(apprenant.id)) {
              apprenantMap.set(apprenant.id, {
                id: apprenant.id,
                nom: apprenant.nom,
                prenom: apprenant.prenom,
                email: apprenant.email,
                documents: [],
                signedDocuments: 0,
                pendingDocuments: 0,
              });
            }
          });
        });
      });

      // Ajouter les documents de signature aux apprenants
      signatureDocuments.forEach((doc) => {
        if (doc.apprenantId) {
          const apprenant = apprenantMap.get(doc.apprenantId);
          if (apprenant) {
            const isSigned = doc.signatures.some((s) => s.signedAt);
            apprenant.documents.push({
              id: doc.id,
              titre: doc.titre,
              type: doc.documentType,
              status: doc.status,
              isSigned,
              signedAt: doc.signatures.find((s) => s.signedAt)?.signedAt?.toISOString() || null,
              createdAt: doc.createdAt.toISOString(),
              fileUrl: null,
              mimeType: "application/pdf",
            });
            if (isSigned) {
              apprenant.signedDocuments++;
            } else if (doc.status === "PENDING_SIGNATURE") {
              apprenant.pendingDocuments++;
            }
          }
        }
      });

      // Ajouter les documents de session générés aux apprenants
      sessionDocumentsGenerated.forEach((doc) => {
        // Vérifier que le document appartient à cette formation
        if (doc.session.formationId !== formation.id) return;

        if (doc.apprenantId) {
          const apprenant = apprenantMap.get(doc.apprenantId);
          if (apprenant) {
            // Nettoyer le nom du fichier (retirer .html)
            let titre = doc.fileName || doc.type;
            titre = titre.replace(/\.html$/i, "");

            // Mapper le statut
            let displayStatus = "GENERATED";
            if (doc.status === "sent") displayStatus = "SENT";
            else if (doc.status === "generated") displayStatus = "GENERATED";
            else if (doc.status === "pending") displayStatus = "PENDING";

            const hasContent = doc.content && typeof doc.content === "object" && (doc.content as { html?: string }).html;

            apprenant.documents.push({
              id: doc.id,
              titre,
              type: doc.type,
              status: hasContent ? displayStatus : "PENDING",
              isSigned: false,
              signedAt: null,
              createdAt: doc.createdAt.toISOString(),
              fileUrl: doc.fileUrl,
              mimeType: "text/html",
            });
          }
        }
      });

      // Ajouter les fichiers des dossiers aux apprenants
      subfolders.forEach((subfolder) => {
        if (subfolder.type === "apprenant" && subfolder.apprenantId) {
          const apprenant = apprenantMap.get(subfolder.apprenantId);
          if (apprenant) {
            subfolder.files.forEach((file) => {
              apprenant.documents.push({
                id: file.id,
                titre: file.originalName || file.name,
                type: file.category || "DOCUMENT",
                status: "SAVED",
                isSigned: false,
                signedAt: null,
                createdAt: file.createdAt.toISOString(),
                fileUrl: file.publicUrl,
                mimeType: file.mimeType,
              });
            });
          }
        } else if (subfolder.type === "entreprise") {
          subfolder.children.forEach((child) => {
            if (child.apprenantId) {
              const apprenant = apprenantMap.get(child.apprenantId);
              if (apprenant) {
                child.files.forEach((file) => {
                  apprenant.documents.push({
                    id: file.id,
                    titre: file.originalName || file.name,
                    type: file.category || "DOCUMENT",
                    status: "SAVED",
                    isSigned: false,
                    signedAt: null,
                    createdAt: file.createdAt.toISOString(),
                    fileUrl: file.publicUrl,
                    mimeType: file.mimeType,
                  });
                });
              }
            }
          });
        }
      });

      // Compter tous les documents
      const allFiles = [
        ...directFiles,
        ...formationOrphanFiles,
        ...subfolders.flatMap((s) => [
          ...s.files,
          ...s.children.flatMap((c) => c.files),
        ]),
      ];

      // Documents de session (émargements) - liés à la formation
      const sessionDocuments = formation.documentSessions.map((doc) => ({
        id: doc.id,
        titre: `Session ${doc.modalite} - ${doc.journees.length} journée(s)`,
        type: "EMARGEMENT",
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        sessionId: doc.id,
      }));

      return {
        id: formation.id,
        titre: formation.titre,
        status: formation.status,
        folderId: formationFolder?.id || null,
        apprenants: Array.from(apprenantMap.values()),
        apprenantsCount: apprenantMap.size,
        sessionsCount: formation.sessions.length + formation.documentSessions.length,
        documentsCount: allFiles.length + sessionDocuments.length,
        sessionDocuments,
        files: [...directFiles, ...formationOrphanFiles].map((f) => ({
          id: f.id,
          name: f.name,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          category: f.category,
          storagePath: f.storagePath,
          publicUrl: f.publicUrl,
          formationId: formation.id,
          createdAt: f.createdAt.toISOString(),
        })),
        subfolders,
      };
    });

    // Stats globales
    const allApprenantIds = new Set<string>();
    tree.forEach((f) => f.apprenants.forEach((a) => allApprenantIds.add(a.id)));

    const stats = {
      totalFormations: formations.length,
      totalApprenants: allApprenantIds.size,
      totalDocuments: tree.reduce((sum, f) => sum + f.documentsCount, 0),
      signedDocuments: signatureDocuments.filter((d) => d.status === "SIGNED").length,
      pendingDocuments: signatureDocuments.filter((d) => d.status === "PENDING_SIGNATURE").length,
    };

    return NextResponse.json({ tree, stats });
  } catch (error) {
    console.error("Erreur récupération arborescence:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'arborescence" },
      { status: 500 }
    );
  }
}
