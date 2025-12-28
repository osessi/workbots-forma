// ===========================================
// API PRÉ-INSCRIPTIONS (Admin) - GET /api/pre-inscriptions
// ===========================================
// Gestion des pré-inscriptions reçues par l'organisme de formation

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut");
    const formationId = searchParams.get("formationId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Construire le filtre
    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (statut) {
      whereClause.statut = statut;
    }

    if (formationId) {
      whereClause.formationId = formationId;
    }

    if (search) {
      whereClause.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { entreprise: { contains: search, mode: "insensitive" } },
      ];
    }

    // Compter le total
    const total = await prisma.preInscription.count({ where: whereClause });

    // Récupérer les pré-inscriptions
    const preInscriptions = await prisma.preInscription.findMany({
      where: whereClause,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Stats par statut
    const stats = await prisma.preInscription.groupBy({
      by: ["statut"],
      where: { organizationId: user.organizationId },
      _count: { id: true },
    });

    const statsMap: Record<string, number> = {
      NOUVELLE: 0,
      EN_TRAITEMENT: 0,
      ACCEPTEE: 0,
      REFUSEE: 0,
      ANNULEE: 0,
    };

    stats.forEach((s) => {
      statsMap[s.statut] = s._count.id;
    });

    return NextResponse.json({
      preInscriptions,
      stats: statsMap,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur API pré-inscriptions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des pré-inscriptions" },
      { status: 500 }
    );
  }
}
