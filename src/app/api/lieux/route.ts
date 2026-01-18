// ===========================================
// API LIEUX - Alias vers /api/donnees/lieux
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET - Lister les lieux de formation
export async function GET(request: NextRequest) {
  try {
    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const lieux = await prisma.lieuFormation.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        OR: search ? [
          { nom: { contains: search, mode: "insensitive" } },
          { lieuFormation: { contains: search, mode: "insensitive" } },
          { ville: { contains: search, mode: "insensitive" } },
        ] : undefined,
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json(lieux);
  } catch (error) {
    console.error("Erreur récupération lieux:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des lieux" },
      { status: 500 }
    );
  }
}
