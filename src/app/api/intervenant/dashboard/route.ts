// ===========================================
// API INTERVENANT DASHBOARD - GET /api/intervenant/dashboard
// ===========================================
// Récupère les données du tableau de bord de l'intervenant

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

    // Récupérer les IDs de toutes les sessions de l'intervenant
    const sessionIds = allSessions.map(s => s.id);

    // Récupérer les évaluations de satisfaction en attente pour les sessions de l'intervenant (Qualiopi IND 2)
    const evaluationsSatisfactionEnAttente = await prisma.evaluationSatisfaction.findMany({
      where: {
        sessionId: { in: sessionIds },
        status: { in: ["PENDING", "IN_PROGRESS"] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        session: {
          include: {
            formation: {
              select: { id: true, titre: true },
            },
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
      },
      orderBy: { createdAt: "desc" },
    });

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

      // Calculer émargements en attente
      const emargementsEnAttente = session.journees?.filter(j => {
        const journeeDate = new Date(j.date);
        return journeeDate <= now && journeeDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }).length || 0;

      return {
        id: session.id,
        reference: session.reference,
        nom: session.nom,
        dateDebut,
        dateFin,
        status: session.status,
        formation: session.formation,
        lieu: session.lieu,
        nombreApprenants,
        nombreJournees: session.journees?.length || 0,
        prochaineJournee: prochaineJournee ? {
          id: prochaineJournee.id,
          date: prochaineJournee.date,
          heureDebutMatin: prochaineJournee.heureDebutMatin,
          heureFinAprem: prochaineJournee.heureFinAprem,
        } : null,
        emargementsEnAttente,
      };
    });

    // Calculer les statistiques
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsEnCours = sessions.filter(s => s.status === "EN_COURS").length;
    const sessionsPlanifiees = sessions.filter(s => s.status === "PLANIFIEE").length;
    const sessionsTerminees = sessions.filter(s => s.status === "TERMINEE").length;
    const totalApprenants = sessions.reduce((sum, s) => sum + s.nombreApprenants, 0);
    const emargementsEnAttente = sessions.reduce((sum, s) => sum + s.emargementsEnAttente, 0);

    // Prochaines sessions (les 3 prochaines)
    const prochainesSessions = sessions
      .filter(s => (s.dateDebut && new Date(s.dateDebut) >= today) || s.status === "EN_COURS")
      .slice(0, 3);

    // Événements à venir (prochaines journées de formation)
    const evenementsAVenir = sessions
      .flatMap(session =>
        (session.prochaineJournee ? [{
          sessionId: session.id,
          sessionNom: session.nom || session.formation.titre,
          sessionReference: session.reference,
          journee: session.prochaineJournee,
          formation: session.formation,
          lieu: session.lieu,
          nombreApprenants: session.nombreApprenants,
        }] : [])
      )
      .sort((a, b) => new Date(a.journee.date).getTime() - new Date(b.journee.date).getTime())
      .slice(0, 5);

    return NextResponse.json({
      intervenant: {
        id: intervenant.id,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        email: intervenant.email,
        fonction: intervenant.fonction,
        specialites: intervenant.specialites,
      },
      organization: {
        id: intervenant.organization.id,
        name: intervenant.organization.nomCommercial || intervenant.organization.name,
        slug: intervenant.organization.slug,
        logo: intervenant.organization.logo,
        primaryColor: intervenant.organization.primaryColor,
        email: intervenant.organization.email,
        telephone: intervenant.organization.telephone,
      },
      stats: {
        sessionsEnCours,
        sessionsPlanifiees,
        sessionsTerminees,
        totalSessions: sessions.length,
        totalApprenants,
        emargementsEnAttente,
        evaluationsEnAttente: evaluationsSatisfactionEnAttente.length,
      },
      sessions,
      prochainesSessions,
      evenementsAVenir,
      // Évaluations de satisfaction en attente par session (Qualiopi IND 2)
      evaluationsSatisfaction: evaluationsSatisfactionEnAttente.map((e) => ({
        id: e.id,
        type: e.type,
        status: e.status,
        token: e.token,
        sessionId: e.sessionId,
        formationTitre: e.session?.formation?.titre || null,
        apprenant: e.apprenant ? {
          id: e.apprenant.id,
          nom: e.apprenant.nom,
          prenom: e.apprenant.prenom,
          email: e.apprenant.email,
        } : null,
        expiresAt: e.expiresAt?.toISOString() || null,
        createdAt: e.createdAt.toISOString(),
        // URL directe pour l'évaluation (pour QR code et lien)
        evaluationUrl: `/evaluation-satisfaction/${e.token}`,
      })),
    });
  } catch (error) {
    console.error("Erreur API dashboard intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
