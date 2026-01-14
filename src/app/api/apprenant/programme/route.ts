// ===========================================
// API PROGRAMME APPRENANT - GET /api/apprenant/programme
// Correction 432: Utiliser le snapshot de la session sélectionnée
// ===========================================
// Récupère la fiche pédagogique de la formation (version "programme")
// Synchronisé avec la session active sélectionnée

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

// Types pour le snapshot de la fiche pédagogique
interface FichePedagogiqueSnapshot {
  titre?: string;
  objectifs?: string[];
  publicVise?: string;
  prerequis?: string;
  contenu?: string;
  dureeHeures?: number;
  dureeJours?: string;
  moyensPedagogiques?: string;
  methodsPedagogiques?: string[];
  supportsPedagogiques?: Array<{ nom: string; url?: string; type: string }>;
  methodesEvaluation?: string[];
  equipePedagogique?: string;
  suiviEvaluation?: string;
  ressourcesPedagogiques?: string;
  accessibiliteHandicap?: string;
  delaiAcces?: string;
  // Qualiopi
  modalitesAcces?: string;
  tauxSatisfaction?: number;
  tauxReussite?: number;
}

interface ModuleSnapshot {
  id: string;
  titre: string;
  description?: string | null;
  ordre: number;
  duree?: number | null;
  contenu?: unknown;
  objectifs?: string[];
  items?: string[];
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token et sessionId depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Si sessionId fourni, récupérer cette session spécifique
    // Sinon, récupérer la première session de l'apprenant
    // Support des deux systèmes : NOUVEAU (Session/SessionParticipantNew) et ANCIEN (DocumentSession/SessionParticipant)
    let session;

    // Variable pour distinguer le type de session (nouveau ou ancien système)
    let isNewSystem = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let oldSession: any = null;

    if (sessionId) {
      // ÉTAPE 1: Essayer le NOUVEAU système (Session/SessionParticipantNew)
      const participation = await prisma.sessionParticipantNew.findFirst({
        where: {
          apprenantId,
          client: {
            session: {
              id: sessionId,
              organizationId,
            },
          },
        },
        include: {
          client: {
            include: {
              session: {
                include: {
                  formation: {
                    include: {
                      modules: { orderBy: { ordre: "asc" } },
                    },
                  },
                  formateur: {
                    select: {
                      id: true,
                      nom: true,
                      prenom: true,
                      fonction: true,
                      specialites: true,
                      biographie: true,
                      photoUrl: true,
                    },
                  },
                  coFormateurs: {
                    include: {
                      intervenant: {
                        select: {
                          id: true,
                          nom: true,
                          prenom: true,
                          fonction: true,
                          specialites: true,
                          biographie: true,
                          photoUrl: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (participation) {
        session = participation.client.session;
      } else {
        // ÉTAPE 2: Fallback vers ANCIEN système (DocumentSession/SessionParticipant)
        const oldParticipation = await prisma.sessionParticipant.findFirst({
          where: {
            apprenantId,
            client: {
              session: {
                id: sessionId,
                organizationId,
              },
            },
          },
          include: {
            client: {
              include: {
                session: {
                  include: {
                    formation: {
                      include: {
                        modules: { orderBy: { ordre: "asc" } },
                      },
                    },
                    journees: {
                      orderBy: { date: "asc" },
                    },
                  },
                },
              },
            },
          },
        });

        if (!oldParticipation) {
          return NextResponse.json(
            { error: "Session non trouvée ou accès refusé" },
            { status: 404 }
          );
        }

        isNewSystem = false;
        oldSession = oldParticipation.client.session;
      }
    } else {
      // Récupérer la première session de l'apprenant (essayer nouveau puis ancien système)
      const participation = await prisma.sessionParticipantNew.findFirst({
        where: {
          apprenantId,
          client: {
            session: {
              organizationId,
            },
          },
        },
        include: {
          client: {
            include: {
              session: {
                include: {
                  formation: {
                    include: {
                      modules: { orderBy: { ordre: "asc" } },
                    },
                  },
                  formateur: {
                    select: {
                      id: true,
                      nom: true,
                      prenom: true,
                      fonction: true,
                      specialites: true,
                      biographie: true,
                      photoUrl: true,
                    },
                  },
                  coFormateurs: {
                    include: {
                      intervenant: {
                        select: {
                          id: true,
                          nom: true,
                          prenom: true,
                          fonction: true,
                          specialites: true,
                          biographie: true,
                          photoUrl: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (participation) {
        session = participation.client.session;
      } else {
        // Fallback vers ancien système
        const oldParticipation = await prisma.sessionParticipant.findFirst({
          where: {
            apprenantId,
            client: {
              session: {
                organizationId,
              },
            },
          },
          include: {
            client: {
              include: {
                session: {
                  include: {
                    formation: {
                      include: {
                        modules: { orderBy: { ordre: "asc" } },
                      },
                    },
                    journees: {
                      orderBy: { date: "asc" },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (!oldParticipation) {
          return NextResponse.json({
            formation: null,
            modules: [],
            equipePedagogique: [],
          });
        }

        isNewSystem = false;
        oldSession = oldParticipation.client.session;
      }
    }

    // TRAITEMENT ANCIEN SYSTÈME (DocumentSession)
    if (!isNewSystem && oldSession) {
      const formation = oldSession.formation;
      const fichePedagogique = (formation.fichePedagogique as FichePedagogiqueSnapshot) || {};

      // Formater les modules
      const formattedModules = formation.modules.map((module: { id: string; titre: string; description?: string | null; ordre: number; duree?: number | null; contenu?: unknown }) => {
        const contenu = module.contenu as { items?: string[]; description?: string } | string | null;
        let items: string[] = [];

        if (contenu && typeof contenu === "object" && contenu.items) {
          items = contenu.items;
        } else if (typeof contenu === "string") {
          items = contenu.split("\n").filter(Boolean);
        }

        return {
          id: module.id,
          titre: module.titre,
          description: module.description || null,
          ordre: module.ordre,
          dureeHeures: module.duree ? module.duree / 60 : null,
          items,
        };
      });

      // Calculer la durée totale
      const dureeHeures = formattedModules.reduce((sum: number, m: { dureeHeures: number | null }) => sum + (m.dureeHeures || 0), 0) ||
        fichePedagogique.dureeHeures ||
        0;

      // Pour l'ancien système, pas d'équipe pédagogique détaillée
      return NextResponse.json({
        session: {
          id: oldSession.id,
          reference: oldSession.reference || oldSession.id,
          nom: oldSession.nom || formation.titre,
          modalite: oldSession.modalite || "PRESENTIEL",
        },
        formation: {
          id: formation.id,
          titre: formation.titre,
          description: formation.description,
          image: formation.image,
          dureeHeures,
          dureeJours: fichePedagogique.dureeJours || null,
          objectifsPedagogiques: fichePedagogique.objectifs || [],
          publicVise: fichePedagogique.publicVise || null,
          prerequis: fichePedagogique.prerequis || null,
          moyensPedagogiques: fichePedagogique.moyensPedagogiques || null,
          methodsPedagogiques: fichePedagogique.methodsPedagogiques || [],
          supportsPedagogiques: fichePedagogique.supportsPedagogiques || [],
          methodesEvaluation: fichePedagogique.methodesEvaluation || [],
          suiviEvaluation: fichePedagogique.suiviEvaluation || null,
          ressourcesPedagogiques: fichePedagogique.ressourcesPedagogiques || null,
          accessibiliteHandicap: fichePedagogique.accessibiliteHandicap || null,
          equipePedagogiqueDescription: fichePedagogique.equipePedagogique || null,
          createdAt: formation.createdAt,
          updatedAt: formation.updatedAt,
          snapshotCreatedAt: null,
        },
        modules: formattedModules,
        equipePedagogique: [],
      });
    }

    // TRAITEMENT NOUVEAU SYSTÈME (Session)
    // À ce point, session doit être défini (sinon on aurait retourné ci-dessus)
    if (!session) {
      return NextResponse.json({
        formation: null,
        modules: [],
        equipePedagogique: [],
      });
    }

    const formation = session.formation;

    // Correction 432: Utiliser le snapshot si disponible, sinon fallback sur formation
    const hasSnapshot = session.snapshotCreatedAt !== null;

    // Titre et description
    const titre = hasSnapshot && session.snapshotFormationTitre
      ? session.snapshotFormationTitre
      : formation.titre;

    const description = hasSnapshot && session.snapshotFormationDescription
      ? session.snapshotFormationDescription
      : formation.description;

    // Fiche pédagogique (depuis snapshot ou formation)
    const fichePedagogique: FichePedagogiqueSnapshot = hasSnapshot && session.snapshotFichePedagogique
      ? (session.snapshotFichePedagogique as FichePedagogiqueSnapshot)
      : (formation.fichePedagogique as FichePedagogiqueSnapshot) || {};

    // Modules (depuis snapshot ou formation)
    const modulesSnapshot: ModuleSnapshot[] = hasSnapshot && session.snapshotModules
      ? (session.snapshotModules as unknown as ModuleSnapshot[])
      : formation.modules.map((m) => ({
          id: m.id,
          titre: m.titre,
          description: m.description,
          ordre: m.ordre,
          duree: m.duree,
          contenu: m.contenu,
          objectifs: [],
          items: [],
        }));

    // Formater les modules pour l'affichage
    const formattedModules = modulesSnapshot.map((module) => {
      // Parser le contenu du module
      const contenu = module.contenu as { items?: string[]; description?: string } | string | null;
      let items: string[] = [];

      if (module.items && module.items.length > 0) {
        items = module.items;
      } else if (contenu && typeof contenu === "object" && contenu.items) {
        items = contenu.items;
      } else if (typeof contenu === "string") {
        items = contenu.split("\n").filter(Boolean);
      }

      return {
        id: module.id,
        titre: module.titre,
        description: module.description || null,
        ordre: module.ordre,
        dureeHeures: module.duree ? module.duree / 60 : null,
        items,
      };
    });

    // Équipe pédagogique
    const equipePedagogique: Array<{
      id: string;
      nom: string;
      prenom: string;
      fonction: string | null;
      specialites: string[];
      bio: string | null;
      photoUrl: string | null;
      estFormateurPrincipal: boolean;
    }> = [];

    // Ajouter le formateur principal
    if (session.formateur) {
      equipePedagogique.push({
        id: session.formateur.id,
        nom: session.formateur.nom,
        prenom: session.formateur.prenom,
        fonction: session.formateur.fonction,
        specialites: session.formateur.specialites || [],
        bio: session.formateur.biographie,
        photoUrl: session.formateur.photoUrl,
        estFormateurPrincipal: true,
      });
    }

    // Ajouter les co-formateurs de la session (via table de jonction)
    if (session.coFormateurs && session.coFormateurs.length > 0) {
      for (const coFormateurRelation of session.coFormateurs) {
        const coFormateur = coFormateurRelation.intervenant;
        // Ne pas dupliquer le formateur principal
        if (coFormateur.id !== session.formateur?.id) {
          equipePedagogique.push({
            id: coFormateur.id,
            nom: coFormateur.nom,
            prenom: coFormateur.prenom,
            fonction: coFormateur.fonction,
            specialites: coFormateur.specialites || [],
            bio: coFormateur.biographie,
            photoUrl: coFormateur.photoUrl,
            estFormateurPrincipal: false,
          });
        }
      }
    }

    // Calculer la durée totale
    const dureeHeures = formattedModules.reduce((sum, m) => sum + (m.dureeHeures || 0), 0) ||
      fichePedagogique.dureeHeures ||
      0;

    // Retourner les données du programme (version pédagogique, sans infos commerciales)
    return NextResponse.json({
      // Informations de base
      session: {
        id: session.id,
        reference: session.reference,
        nom: session.nom,
        modalite: session.modalite,
      },
      formation: {
        id: formation.id,
        titre,
        description,
        image: formation.image,
        dureeHeures,
        dureeJours: fichePedagogique.dureeJours || null,
        // Objectifs pédagogiques
        objectifsPedagogiques: fichePedagogique.objectifs || [],
        // Profil des bénéficiaires
        publicVise: fichePedagogique.publicVise || null,
        prerequis: fichePedagogique.prerequis || null,
        // Méthodologie
        moyensPedagogiques: fichePedagogique.moyensPedagogiques || null,
        methodsPedagogiques: fichePedagogique.methodsPedagogiques || [],
        supportsPedagogiques: fichePedagogique.supportsPedagogiques || [],
        // Évaluation
        methodesEvaluation: fichePedagogique.methodesEvaluation || [],
        suiviEvaluation: fichePedagogique.suiviEvaluation || null,
        // Ressources
        ressourcesPedagogiques: fichePedagogique.ressourcesPedagogiques || null,
        // Accessibilité
        accessibiliteHandicap: fichePedagogique.accessibiliteHandicap || null,
        // Équipe pédagogique texte
        equipePedagogiqueDescription: fichePedagogique.equipePedagogique || null,
        // Dates (pour info)
        createdAt: formation.createdAt,
        updatedAt: formation.updatedAt,
        // Snapshot info
        snapshotCreatedAt: session.snapshotCreatedAt,
      },
      // Contenu de la formation (modules)
      modules: formattedModules,
      // Équipe pédagogique (intervenants)
      equipePedagogique,
    });
  } catch (error) {
    console.error("Erreur API programme apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du programme" },
      { status: 500 }
    );
  }
}
