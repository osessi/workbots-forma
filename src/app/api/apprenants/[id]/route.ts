// ===========================================
// API APPRENANT DETAIL - GET /api/apprenants/[id]
// ===========================================
// Récupère les détails complets d'un apprenant avec ses relations

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Récupérer un apprenant avec tous ses détails
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    console.log("[API APPRENANT] Fetching apprenant:", id);
    console.log("[API APPRENANT] User:", user?.id, "Org:", user?.organizationId);

    if (!user || !user.organizationId) {
      console.log("[API APPRENANT] Non autorisé - pas d'utilisateur");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const apprenant = await prisma.apprenant.findUnique({
      where: { id },
      include: {
        // Entreprise rattachée (si salarié)
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
            siret: true,
            adresse: true,
            codePostal: true,
            ville: true,
            contactEmail: true,
            contactTelephone: true,
          },
        },
        // Pré-inscriptions liées
        preInscriptions: {
          orderBy: { createdAt: "desc" },
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
                tarifAffiche: true,
              },
            },
          },
        },
        // Participations aux sessions (nouveau système)
        // Structure: SessionParticipantNew -> client (SessionClientNew) -> session (Session)
        sessionParticipationsNew: {
          orderBy: { createdAt: "desc" },
          include: {
            client: {
              include: {
                session: {
                  select: {
                    id: true,
                    reference: true,
                    nom: true,
                    status: true,
                    formation: {
                      select: {
                        id: true,
                        titre: true,
                      },
                    },
                    // Inclure les journées pour calculer les dates
                    journees: {
                      select: {
                        date: true,
                      },
                      orderBy: { date: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
        // Inscriptions LMS
        lmsInscriptions: {
          orderBy: { createdAt: "desc" },
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
        // Compter les documents liés à l'apprenant
        _count: {
          select: {
            documents: true,
          },
        },
        // Organisation
        organization: {
          select: {
            id: true,
            name: true,
            nomCommercial: true,
          },
        },
      },
    });

    if (!apprenant) {
      console.log("[API APPRENANT] Apprenant non trouvé avec id:", id);
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    console.log("[API APPRENANT] Apprenant trouvé:", apprenant.nom, apprenant.prenom, "Org:", apprenant.organizationId);

    // Vérifier que l'apprenant appartient à l'organisation
    if (apprenant.organizationId !== user.organizationId) {
      console.log("[API APPRENANT] Accès refusé - org différente. User org:", user.organizationId, "Apprenant org:", apprenant.organizationId);
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Calculer des statistiques
    const stats = {
      totalPreInscriptions: apprenant.preInscriptions.length,
      preInscriptionsAcceptees: apprenant.preInscriptions.filter(
        (p) => p.statut === "ACCEPTEE"
      ).length,
      totalSessions: apprenant.sessionParticipationsNew.length,
      sessionsEnCours: apprenant.sessionParticipationsNew.filter(
        (p) => p.client.session.status === "EN_COURS"
      ).length,
      sessionsTerminees: apprenant.sessionParticipationsNew.filter(
        (p) => p.client.session.status === "TERMINEE"
      ).length,
      totalFormationsLMS: apprenant.lmsInscriptions.length,
      totalDocuments: apprenant._count.documents,
    };

    return NextResponse.json({
      apprenant,
      stats,
    });
  } catch (error) {
    console.error("[API APPRENANT] Erreur GET apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération", details: String(error) },
      { status: 500 }
    );
  }
}
