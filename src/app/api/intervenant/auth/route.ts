// ===========================================
// API INTERVENANT AUTH - GET /api/intervenant/auth
// ===========================================
// Valide le token intervenant et retourne les données de l'intervenant

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token intervenant
function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.intervenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      intervenantId: decoded.intervenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les headers ou query params
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ||
                  request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeIntervenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { intervenantId, organizationId } = decoded;

    // Récupérer l'intervenant avec ses sessions
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id: intervenantId,
        organizationId,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            nomCommercial: true,
            slug: true,
            logo: true,
            primaryColor: true,
            email: true,
            telephone: true,
            siret: true,
            adresse: true,
            siteWeb: true,
            numeroFormateur: true,
          },
        },
        // Sessions en tant que formateur principal
        sessionsFormateurNew: {
          where: {
            status: { in: ["PLANIFIEE", "EN_COURS", "TERMINEE"] },
          },
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
                image: true,
                description: true,
                fichePedagogique: true,
              },
            },
            lieu: true,
            journees: {
              orderBy: { date: "asc" },
            },
            clients: {
              include: {
                participants: {
                  include: {
                    apprenant: {
                      select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        telephone: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        // Sessions en tant que co-formateur
        sessionsCoFormateurNew: {
          include: {
            session: {
              include: {
                formation: {
                  select: {
                    id: true,
                    titre: true,
                    image: true,
                    description: true,
                    fichePedagogique: true,
                  },
                },
                lieu: true,
                journees: {
                  orderBy: { date: "asc" },
                },
                clients: {
                  include: {
                    participants: {
                      include: {
                        apprenant: {
                          select: {
                            id: true,
                            nom: true,
                            prenom: true,
                            email: true,
                          },
                        },
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

    if (!intervenant) {
      return NextResponse.json(
        { error: "Intervenant non trouvé" },
        { status: 404 }
      );
    }

    // Combiner toutes les sessions (principal + co-formateur)
    const sessionsFormateur = intervenant.sessionsFormateurNew || [];
    const sessionsCoFormateur = intervenant.sessionsCoFormateurNew
      ?.map(s => s.session)
      .filter((s): s is NonNullable<typeof s> =>
        s !== null && (s.status === "PLANIFIEE" || s.status === "EN_COURS" || s.status === "TERMINEE")
      ) || [];

    const allSessions = [...sessionsFormateur, ...sessionsCoFormateur];

    // Transformer les sessions pour le frontend
    const sessions = allSessions.map(session => {
      // Calculer le nombre d'apprenants
      const nombreApprenants = session.clients?.reduce(
        (sum, client) => sum + (client.participants?.length || 0),
        0
      ) || 0;

      // Calculer dateDebut/dateFin à partir des journées
      const journeesSorted = [...(session.journees || [])].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const dateDebut = journeesSorted[0]?.date || null;
      const dateFin = journeesSorted[journeesSorted.length - 1]?.date || null;

      // Prochaine journée
      const now = new Date();
      const prochaineJournee = session.journees?.find(j => new Date(j.date) >= now);

      // Extraire les données pédagogiques de fichePedagogique si disponible
      const fichePedagogique = session.formation.fichePedagogique as Record<string, unknown> | null;
      const dureeHeures = (fichePedagogique?.dureeHeures as number | null) || null;
      const modalite = (fichePedagogique?.modalite as string | null) || (fichePedagogique?.modalites as string | null) || null;

      // Objectifs pédagogiques - peut être dans "objectifs" ou "objectifsPedagogiques"
      const objectifsPedagogiques = (fichePedagogique?.objectifs as string[] | null)
        || (fichePedagogique?.objectifsPedagogiques as string[] | null)
        || [];

      // Public cible - peut être dans "publicVise" ou "publicCible"
      const publicCible = (fichePedagogique?.publicVise as string | null)
        || (fichePedagogique?.publicCible as string | null)
        || null;

      // Prérequis
      const prerequis = (fichePedagogique?.prerequis as string | null) || null;

      // Moyens/ressources pédagogiques
      const moyensPedagogiques = (fichePedagogique?.ressourcesPedagogiques as string | null)
        || (fichePedagogique?.moyensPedagogiques as string | null)
        || null;

      // Suivi de l'exécution et évaluation des résultats
      const suiviEvaluation = (fichePedagogique?.suiviEvaluation as string | null)
        || (fichePedagogique?.suiviExecution as string | null)
        || (fichePedagogique?.modalitesEvaluation as string | null)
        || null;

      // Délai d'accès
      const delaiAcces = (fichePedagogique?.delaiAcces as string | null)
        || (fichePedagogique?.delaisAcces as string | null)
        || null;

      // Accessibilité
      const accessibilite = (fichePedagogique?.accessibilite as string | null)
        || (fichePedagogique?.accessibilitePMR as string | null)
        || (fichePedagogique?.accessibiliteHandicap as string | null)
        || null;

      // Contenu/modules - texte libre ou tableau
      const contenu = fichePedagogique?.contenu;
      let modules: Array<{ id: string; titre: string; description?: string; ordre: number; duree?: number }> = [];

      // Si contenu est un texte, essayer de le parser en modules
      if (typeof contenu === "string" && contenu.trim()) {
        // Parser le contenu texte en modules (format "Module X – Titre\n• point1\n• point2")
        const moduleRegex = /Module\s*(\d+)\s*[–-]\s*([^\n]+)/gi;
        let match;
        let ordre = 1;
        const moduleMatches: Array<{ ordre: number; titre: string; start: number }> = [];

        while ((match = moduleRegex.exec(contenu)) !== null) {
          moduleMatches.push({
            ordre: parseInt(match[1]) || ordre,
            titre: match[2].trim(),
            start: match.index,
          });
          ordre++;
        }

        // Extraire les descriptions de chaque module
        moduleMatches.forEach((mod, idx) => {
          const nextStart = moduleMatches[idx + 1]?.start || contenu.length;
          const description = contenu
            .substring(mod.start + (contenu.substring(mod.start).indexOf("\n") + 1), nextStart)
            .trim()
            .replace(/^[•\-]\s*/gm, "• ");

          modules.push({
            id: `module-${mod.ordre}`,
            titre: mod.titre,
            description: description || undefined,
            ordre: mod.ordre,
          });
        });
      } else if (Array.isArray(contenu)) {
        // Si c'est déjà un tableau
        modules = contenu.map((m, idx) => ({
          id: m.id || `module-${idx + 1}`,
          titre: m.titre || m.title || `Module ${idx + 1}`,
          description: m.description || m.contenu || undefined,
          ordre: m.ordre || idx + 1,
          duree: m.duree || m.dureeMinutes || undefined,
        }));
      }

      return {
        id: session.id,
        reference: session.reference,
        nom: session.nom,
        dateDebut,
        dateFin,
        status: session.status,
        formation: {
          id: session.formation.id,
          titre: session.formation.titre,
          description: session.formation.description,
          image: session.formation.image,
          dureeHeures,
          modalite,
          objectifsPedagogiques,
          publicCible,
          prerequis,
          moyensPedagogiques,
          suiviEvaluation,
          delaiAcces,
          accessibilite,
          modules,
        },
        lieu: session.lieu,
        nombreApprenants,
        nombreJournees: session.journees?.length || 0,
        prochaineJournee: prochaineJournee ? {
          id: prochaineJournee.id,
          date: prochaineJournee.date,
          heureDebutMatin: prochaineJournee.heureDebutMatin,
          heureFinMatin: prochaineJournee.heureFinMatin,
          heureDebutAprem: prochaineJournee.heureDebutAprem,
          heureFinAprem: prochaineJournee.heureFinAprem,
        } : null,
        journees: session.journees?.map(j => ({
          id: j.id,
          date: j.date,
          heureDebutMatin: j.heureDebutMatin,
          heureFinMatin: j.heureFinMatin,
          heureDebutAprem: j.heureDebutAprem,
          heureFinAprem: j.heureFinAprem,
        })) || [],
      };
    });

    return NextResponse.json({
      intervenant: {
        id: intervenant.id,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        email: intervenant.email,
        telephone: intervenant.telephone,
        fonction: intervenant.fonction,
        specialites: intervenant.specialites,
        structure: intervenant.structure,
      },
      organization: {
        id: intervenant.organization.id,
        name: intervenant.organization.nomCommercial || intervenant.organization.name,
        nomCommercial: intervenant.organization.nomCommercial,
        logoUrl: intervenant.organization.logo,
        siret: intervenant.organization.siret,
        adresse: intervenant.organization.adresse,
        email: intervenant.organization.email,
        telephone: intervenant.organization.telephone,
        siteWeb: intervenant.organization.siteWeb,
        numeroFormateur: intervenant.organization.numeroFormateur,
      },
      sessions,
    });
  } catch (error) {
    console.error("Erreur API auth intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
