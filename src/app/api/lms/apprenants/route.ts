import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// GET - Récupérer tous les apprenants de l'organisation (pour inscription LMS)
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const notInFormation = searchParams.get("notInFormation"); // Exclure ceux déjà inscrits à cette formation

    // Construire les conditions de recherche
    const whereConditions: any = {
      organizationId: user.organizationId,
    };

    if (search) {
      whereConditions.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Si on veut exclure ceux déjà inscrits à une formation
    if (notInFormation) {
      whereConditions.NOT = {
        lmsInscriptions: {
          some: {
            formationId: notInFormation,
          },
        },
      };
    }

    const apprenants = await prisma.apprenant.findMany({
      where: whereConditions,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        statut: true,
        entreprise: true,
        createdAt: true,
        _count: {
          select: {
            lmsInscriptions: true,
          },
        },
        lmsInscriptions: {
          select: {
            id: true,
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
            progression: true,
            statut: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Dernières 5 inscriptions
        },
      },
      orderBy: [
        { nom: "asc" },
        { prenom: "asc" },
      ],
    });

    // Stats
    const stats = {
      total: apprenants.length,
      avecInscriptions: apprenants.filter(a => a._count.lmsInscriptions > 0).length,
      sansInscriptions: apprenants.filter(a => a._count.lmsInscriptions === 0).length,
    };

    return NextResponse.json({ apprenants, stats });
  } catch (error) {
    console.error("Erreur récupération apprenants LMS:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des apprenants" },
      { status: 500 }
    );
  }
}
