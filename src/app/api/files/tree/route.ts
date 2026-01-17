// ===========================================
// API FILES TREE - Structure hiérarchique des fichiers
// ===========================================
// GET /api/files/tree - Arborescence Formation > Entreprise > Apprenants > Documents

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { authenticateUser } from "@/lib/auth";

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

    // Récupérer toutes les formations avec TOUTES les sources de sessions et d'apprenants
    const formations = await prisma.formation.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        titre: true,
        status: true,
        // Legacy: sessions classiques (FormationSession avec Participant)
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
        // Legacy: documentSessions (DocumentSession avec Apprenant via clients)
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
        // NOUVEAU: trainingSessions (Session avec SessionClientNew et SessionParticipantNew)
        trainingSessions: {
          select: {
            id: true,
            reference: true,
            nom: true,
            status: true,
            modalite: true,
            createdAt: true,
            journees: {
              select: {
                id: true,
                date: true,
                feuillesEmargement: {
                  select: {
                    id: true,
                    token: true,
                    pdfUrl: true,
                  },
                },
              },
            },
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
            // Documents générés par le nouveau système
            documentsGeneres: {
              select: {
                id: true,
                type: true,
                titre: true,
                content: true,
                fileUrl: true,
                isGenerated: true,
                generatedAt: true,
                clientId: true,
                participantId: true,
                createdAt: true,
              },
            },
          },
        },
        folder: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les documents de signature (ancien système)
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

    // Récupérer les documents de session (ancien système - DocumentSession/SessionDocument)
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

      // Type pour les sous-dossiers créés par l'utilisateur
      type UserSubFolderType = {
        id: string;
        name: string;
        filesCount: number;
        childrenCount: number;
        files: {
          id: string;
          name: string;
          originalName: string;
          mimeType: string;
          size: number;
          category: string;
          storagePath: string;
          publicUrl: string | null;
          createdAt: string;
        }[];
        children: UserSubFolderType[];
      };

      const subfolders: SubfolderType[] = [];
      const userSubFolders: UserSubFolderType[] = [];

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
          } else if (!child.entrepriseId && !child.apprenantId) {
            // Sous-dossier créé par l'utilisateur (sans entreprise ni apprenant)
            const formatFiles = (files: typeof child.files) => files.map((f) => ({
              id: f.id,
              name: f.name,
              originalName: f.originalName,
              mimeType: f.mimeType,
              size: f.size,
              category: f.category,
              storagePath: f.storagePath,
              publicUrl: f.publicUrl,
              createdAt: f.createdAt.toISOString(),
            }));

            const formatChildren = (children: typeof child.children): UserSubFolderType[] => {
              if (!children) return [];
              return children
                .filter(c => !c.apprenantId) // Exclure les dossiers d'apprenants
                .map((c) => ({
                  id: c.id,
                  name: c.name,
                  filesCount: c.files.length,
                  childrenCount: 0,
                  files: formatFiles(c.files),
                  children: [],
                }));
            };

            userSubFolders.push({
              id: child.id,
              name: child.name,
              filesCount: child.files.length,
              childrenCount: child.children?.filter(c => !c.apprenantId).length || 0,
              files: formatFiles(child.files),
              children: formatChildren(child.children),
            });
          }
        });
      }

      // Collecter tous les apprenants uniques depuis TOUTES les sources
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

      // Source 1: Legacy sessions classiques (FormationSession avec Participant)
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

      // Source 2: Legacy documentSessions (DocumentSession avec Apprenant via clients)
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

      // Source 3: NOUVEAU trainingSessions (Session avec SessionClientNew et SessionParticipantNew)
      formation.trainingSessions.forEach((ts) => {
        ts.clients.forEach((client) => {
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

        // Ajouter les documents générés du nouveau système aux apprenants
        ts.documentsGeneres.forEach((doc) => {
          // Nettoyer le titre (supprimer .html si présent)
          let titre = doc.titre;
          titre = titre.replace(/\.html$/i, "");

          if (doc.participantId) {
            // Document lié à un participant spécifique
            ts.clients.forEach((client) => {
              const participant = client.participants.find(p => p.id === doc.participantId);
              if (participant) {
                const apprenant = apprenantMap.get(participant.apprenant.id);
                if (apprenant) {
                  apprenant.documents.push({
                    id: doc.id,
                    titre,
                    type: doc.type,
                    status: doc.isGenerated ? "GENERATED" : "PENDING",
                    isSigned: false,
                    signedAt: null,
                    createdAt: doc.createdAt.toISOString(),
                    fileUrl: doc.fileUrl,
                    mimeType: doc.fileUrl?.endsWith(".pdf") ? "application/pdf" : "text/html",
                  });
                }
              }
            });
          } else if (doc.clientId) {
            // Document lié au client (convention, contrat) - le dupliquer pour tous les apprenants du client
            const client = ts.clients.find(c => c.id === doc.clientId);
            if (client) {
              client.participants.forEach((p) => {
                const apprenant = apprenantMap.get(p.apprenant.id);
                if (apprenant) {
                  // ID unique pour ce document dupliqué (éviter doublons)
                  const uniqueDocId = `${doc.id}-${p.apprenant.id}`;

                  // Vérifier si le document n'est pas déjà présent
                  const alreadyAdded = apprenant.documents.some(
                    d => d.id === doc.id || d.id === uniqueDocId
                  );

                  if (!alreadyAdded) {
                    apprenant.documents.push({
                      id: uniqueDocId,
                      titre,
                      type: doc.type,
                      status: doc.isGenerated ? "GENERATED" : "PENDING",
                      isSigned: false,
                      signedAt: null,
                      createdAt: doc.createdAt.toISOString(),
                      fileUrl: doc.fileUrl,
                      mimeType: doc.fileUrl?.endsWith(".pdf") ? "application/pdf" : "text/html",
                    });
                  }
                }
              });
            }
          }
        });

        // Ajouter les feuilles d'émargement à CHAQUE apprenant de la session
        ts.journees.forEach((journee) => {
          journee.feuillesEmargement.forEach((feuille) => {
            // Dupliquer la feuille d'émargement dans le dossier de chaque apprenant
            ts.clients.forEach((client) => {
              client.participants.forEach((p) => {
                const apprenant = apprenantMap.get(p.apprenant.id);
                if (apprenant && feuille.pdfUrl) {
                  // Vérifier si la feuille n'est pas déjà ajoutée
                  const alreadyAdded = apprenant.documents.some(
                    d => d.id === `emargement-${feuille.id}-${p.apprenant.id}`
                  );
                  if (!alreadyAdded) {
                    apprenant.documents.push({
                      id: `emargement-${feuille.id}-${p.apprenant.id}`,
                      titre: `Feuille d'émargement - ${new Date(journee.date).toLocaleDateString("fr-FR")}`,
                      type: "EMARGEMENT",
                      status: "GENERATED",
                      isSigned: false,
                      signedAt: null,
                      createdAt: journee.date.toISOString(),
                      fileUrl: feuille.pdfUrl,
                      mimeType: "application/pdf",
                    });
                  }
                }
              });
            });
          });
        });
      });

      // Ajouter les documents de signature (ancien système) aux apprenants
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

      // Ajouter les documents de session générés (ancien système) aux apprenants
      sessionDocumentsGenerated.forEach((doc) => {
        // Vérifier que le document appartient à cette formation
        if (doc.session.formationId !== formation.id) return;

        // Nettoyer le nom du fichier (retirer .html)
        let titre = doc.fileName || doc.type;
        titre = titre.replace(/\.html$/i, "");

        // Mapper le statut
        let displayStatus = "GENERATED";
        if (doc.status === "sent") displayStatus = "SENT";
        else if (doc.status === "generated") displayStatus = "GENERATED";
        else if (doc.status === "pending") displayStatus = "PENDING";

        const hasContent = doc.content && typeof doc.content === "object" && (doc.content as { html?: string }).html;

        if (doc.apprenantId) {
          // Document lié à un apprenant spécifique
          const apprenant = apprenantMap.get(doc.apprenantId);
          if (apprenant) {
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
        } else if (doc.clientId) {
          // Document lié au client (convention, contrat) - le dupliquer pour tous les apprenants du client
          // Chercher le client dans les documentSessions
          formation.documentSessions.forEach((ds) => {
            const client = ds.clients.find(c => c.id === doc.clientId);
            if (client) {
              client.participants.forEach((p) => {
                const apprenant = apprenantMap.get(p.apprenant.id);
                if (apprenant) {
                  // ID unique pour ce document dupliqué
                  const uniqueDocId = `${doc.id}-${p.apprenant.id}`;

                  // Vérifier si le document n'est pas déjà présent
                  const alreadyAdded = apprenant.documents.some(
                    d => d.id === doc.id || d.id === uniqueDocId
                  );

                  if (!alreadyAdded) {
                    apprenant.documents.push({
                      id: uniqueDocId,
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
            }
          });
        }
      });

      // Ajouter les fichiers des dossiers aux apprenants
      subfolders.forEach((subfolder) => {
        if (subfolder.type === "apprenant" && subfolder.apprenantId) {
          const apprenant = apprenantMap.get(subfolder.apprenantId);
          if (apprenant) {
            subfolder.files.forEach((file) => {
              // Éviter les doublons par ID
              if (!apprenant.documents.some(d => d.id === file.id)) {
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
              }
            });
          }
        } else if (subfolder.type === "entreprise") {
          subfolder.children.forEach((child) => {
            if (child.apprenantId) {
              const apprenant = apprenantMap.get(child.apprenantId);
              if (apprenant) {
                child.files.forEach((file) => {
                  // Éviter les doublons par ID
                  if (!apprenant.documents.some(d => d.id === file.id)) {
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
                  }
                });
              }
            }
          });
        }
      });

      // Dédupliquer les documents de chaque apprenant (par ID et par titre+type)
      apprenantMap.forEach((apprenant) => {
        const uniqueDocs = new Map<string, typeof apprenant.documents[0]>();
        apprenant.documents.forEach((doc) => {
          // Clé unique basée sur l'ID
          if (!uniqueDocs.has(doc.id)) {
            // Vérifier aussi par titre+type pour éviter les doublons sémantiques
            const titleKey = `${doc.titre}-${doc.type}`;
            const existingByTitle = Array.from(uniqueDocs.values()).find(
              d => `${d.titre}-${d.type}` === titleKey
            );
            if (!existingByTitle) {
              uniqueDocs.set(doc.id, doc);
            }
          }
        });
        apprenant.documents = Array.from(uniqueDocs.values());
      });

      // Compter tous les documents (pour la stat de la formation)
      const allApprenantDocs = Array.from(apprenantMap.values()).flatMap(a => a.documents);

      const allFiles = [
        ...directFiles,
        ...formationOrphanFiles,
        ...subfolders.flatMap((s) => [
          ...s.files,
          ...s.children.flatMap((c) => c.files),
        ]),
      ];

      // Documents de session (émargements) - liés à la formation (legacy)
      const sessionDocuments = formation.documentSessions.map((doc) => ({
        id: doc.id,
        titre: `Session ${doc.modalite} - ${doc.journees.length} journée(s)`,
        type: "EMARGEMENT",
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        sessionId: doc.id,
      }));

      // Ajouter les sessions du nouveau système
      const trainingSessionDocs = formation.trainingSessions.map((ts) => ({
        id: ts.id,
        titre: ts.nom || `Session ${ts.reference}`,
        type: "SESSION",
        status: ts.status,
        createdAt: ts.createdAt.toISOString(),
        sessionId: ts.id,
      }));

      // Compter le total de documents (fichiers + documents apprenants)
      const totalDocsCount = allFiles.length + allApprenantDocs.length;

      return {
        id: formation.id,
        titre: formation.titre,
        status: formation.status,
        folderId: formationFolder?.id || null,
        apprenants: Array.from(apprenantMap.values()),
        apprenantsCount: apprenantMap.size,
        sessionsCount: formation.sessions.length + formation.documentSessions.length + formation.trainingSessions.length,
        documentsCount: totalDocsCount,
        sessionDocuments: [...sessionDocuments, ...trainingSessionDocs],
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
        subFolders: userSubFolders, // Sous-dossiers créés par l'utilisateur (orange)
      };
    });

    // Stats globales
    const allApprenantIds = new Set<string>();
    tree.forEach((f) => f.apprenants.forEach((a) => allApprenantIds.add(a.id)));

    // Compter tous les documents signés et en attente
    let totalSignedDocs = signatureDocuments.filter((d) => d.status === "SIGNED").length;
    let totalPendingDocs = signatureDocuments.filter((d) => d.status === "PENDING_SIGNATURE").length;

    // Ajouter les stats des apprenants
    tree.forEach((f) => {
      f.apprenants.forEach((a) => {
        totalSignedDocs += a.signedDocuments;
        totalPendingDocs += a.pendingDocuments;
      });
    });

    // Récupérer les dossiers racine indépendants (sans formation et sans parent)
    const independentFolders = await prisma.folder.findMany({
      where: {
        organizationId: user.organizationId,
        formationId: null,
        parentId: null,
        apprenantId: null,
        entrepriseId: null,
      },
      include: {
        files: {
          orderBy: { createdAt: "desc" },
        },
        children: {
          include: {
            files: true,
            children: {
              include: {
                files: true,
              },
            },
          },
        },
        _count: {
          select: { files: true, children: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Formater les dossiers indépendants
    const rootFolders = independentFolders.map((folder) => {
      // Compter tous les fichiers dans le dossier et ses sous-dossiers
      const countFilesRecursive = (f: typeof folder): number => {
        let count = f.files.length;
        if ('children' in f && f.children) {
          f.children.forEach((child) => {
            count += child.files.length;
            if ('children' in child && Array.isArray(child.children)) {
              child.children.forEach((grandchild) => {
                count += grandchild.files.length;
              });
            }
          });
        }
        return count;
      };

      return {
        id: folder.id,
        name: folder.name,
        type: "folder" as const,
        filesCount: countFilesRecursive(folder),
        childrenCount: folder._count.children,
        createdAt: folder.createdAt.toISOString(),
        files: folder.files.map((f) => ({
          id: f.id,
          name: f.name,
          originalName: f.originalName,
          mimeType: f.mimeType,
          size: f.size,
          category: f.category,
          storagePath: f.storagePath,
          publicUrl: f.publicUrl,
          createdAt: f.createdAt.toISOString(),
        })),
        children: folder.children.map((child) => ({
          id: child.id,
          name: child.name,
          filesCount: child.files.length + (child.children?.reduce((sum, c) => sum + c.files.length, 0) || 0),
          files: child.files.map((f) => ({
            id: f.id,
            name: f.name,
            originalName: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
            category: f.category,
            storagePath: f.storagePath,
            publicUrl: f.publicUrl,
            createdAt: f.createdAt.toISOString(),
          })),
          children: child.children?.map((grandchild) => ({
            id: grandchild.id,
            name: grandchild.name,
            filesCount: grandchild.files.length,
            files: grandchild.files.map((f) => ({
              id: f.id,
              name: f.name,
              originalName: f.originalName,
              mimeType: f.mimeType,
              size: f.size,
              category: f.category,
              storagePath: f.storagePath,
              publicUrl: f.publicUrl,
              createdAt: f.createdAt.toISOString(),
            })),
          })) || [],
        })),
      };
    });

    // Récupérer aussi les fichiers à la racine (sans dossier)
    const rootFiles = await prisma.file.findMany({
      where: {
        organizationId: user.organizationId,
        folderId: null,
        formationId: null,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedRootFiles = rootFiles.map((f) => ({
      id: f.id,
      name: f.name,
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      category: f.category,
      storagePath: f.storagePath,
      publicUrl: f.publicUrl,
      createdAt: f.createdAt.toISOString(),
    }));

    const stats = {
      totalFormations: formations.length,
      totalApprenants: allApprenantIds.size,
      totalDocuments: tree.reduce((sum, f) => sum + f.documentsCount, 0) + rootFiles.length + rootFolders.reduce((sum, f) => sum + f.filesCount, 0),
      signedDocuments: totalSignedDocs,
      pendingDocuments: totalPendingDocs,
      totalFolders: rootFolders.length,
    };

    return NextResponse.json({ tree, stats, rootFolders, rootFiles: formattedRootFiles });
  } catch (error) {
    console.error("Erreur récupération arborescence:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'arborescence" },
      { status: 500 }
    );
  }
}
