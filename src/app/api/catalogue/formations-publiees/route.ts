// ===========================================
// API CATALOGUE FORMATIONS PUBLIÉES
// ===========================================
// GET /api/catalogue/formations-publiees
// Récupère la liste des formations publiées dans le catalogue

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

    // Récupérer les formations publiées au catalogue
    const formations = await prisma.formation.findMany({
      where: {
        organizationId: user.organizationId,
        estPublieCatalogue: true,
        isArchived: false,
      },
      select: {
        id: true,
        titre: true,
        image: true,
        status: true,
        fichePedagogique: true,
        // Qualiopi IND 3 - Certification
        isCertifiante: true,
        numeroFicheRS: true,
        lienFranceCompetences: true,
        modules: {
          select: {
            duree: true,
          },
        },
        indicateurs: {
          select: {
            tauxCertification: true,
            tauxSatisfaction: true,
            nombreAvis: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculer la durée totale pour chaque formation
    const formattedFormations = formations.map((f) => {
      // D'abord essayer depuis les modules
      const dureeTotaleMinutes = f.modules.reduce(
        (acc, m) => acc + (m.duree || 0),
        0
      );
      let dureeHeures = Math.round(dureeTotaleMinutes / 60);

      // Fallback sur la fiche pédagogique si pas de durée depuis les modules
      if (dureeHeures === 0 && f.fichePedagogique) {
        const fiche = f.fichePedagogique as Record<string, unknown>;
        if (fiche.dureeHeures) {
          dureeHeures = Number(fiche.dureeHeures) || 0;
        } else if (fiche.duree) {
          const dureeStr = String(fiche.duree);
          const heuresMatch = dureeStr.match(/(\d+)\s*h/i);
          if (heuresMatch) {
            dureeHeures = parseInt(heuresMatch[1]);
          } else if (!isNaN(Number(dureeStr))) {
            dureeHeures = Number(dureeStr);
          }
        }
      }

      return {
        id: f.id,
        titre: f.titre,
        image: f.image,
        status: f.status,
        dureeHeures,
        // Qualiopi IND 3 - Certification
        isCertifiante: f.isCertifiante,
        numeroFicheRS: f.numeroFicheRS,
        lienFranceCompetences: f.lienFranceCompetences,
        indicateurs: f.indicateurs ? {
          tauxCertification: f.indicateurs.tauxCertification,
          tauxSatisfaction: f.indicateurs.tauxSatisfaction,
          nombreAvis: f.indicateurs.nombreAvis,
        } : null,
      };
    });

    return NextResponse.json({
      formations: formattedFormations,
    });
  } catch (error) {
    console.error("Erreur GET formations publiées:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des formations" },
      { status: 500 }
    );
  }
}
