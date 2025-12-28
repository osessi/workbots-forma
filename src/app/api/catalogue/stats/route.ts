// ===========================================
// API CATALOGUE STATS - GET /api/catalogue/stats
// ===========================================
// Récupère les statistiques du catalogue pour l'admin

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Compter les formations
    const [totalFormations, formationsPubliees] = await Promise.all([
      prisma.formation.count({
        where: { organizationId: user.organizationId },
      }),
      prisma.formation.count({
        where: {
          organizationId: user.organizationId,
          estPublieCatalogue: true,
        },
      }),
    ]);

    // Compter les pré-inscriptions
    const [preInscriptionsTotal, preInscriptionsNouvelles] = await Promise.all([
      prisma.preInscription.count({
        where: { organizationId: user.organizationId },
      }),
      prisma.preInscription.count({
        where: {
          organizationId: user.organizationId,
          statut: "NOUVELLE",
        },
      }),
    ]);

    return NextResponse.json({
      totalFormations,
      formationsPubliees,
      formationsNonPubliees: totalFormations - formationsPubliees,
      preInscriptionsTotal,
      preInscriptionsNouvelles,
    });
  } catch (error) {
    console.error("Erreur GET catalogue stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
