// ===========================================
// API ENTREPRISE APPRENANTS - /api/donnees/entreprises/[id]/apprenants
// ===========================================
// Liste des apprenants rattachés à une entreprise

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";

// GET - Liste des apprenants d'une entreprise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;

    // Vérifier que l'entreprise appartient à l'organisation
    const entreprise = await prisma.entreprise.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!entreprise) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    // Récupérer les apprenants rattachés à cette entreprise
    const apprenants = await prisma.apprenant.findMany({
      where: {
        entrepriseId: id,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
      },
      orderBy: [
        { nom: "asc" },
        { prenom: "asc" },
      ],
    });

    return NextResponse.json({
      entreprise: {
        id: entreprise.id,
        raisonSociale: entreprise.raisonSociale,
      },
      apprenants,
      total: apprenants.length,
    });
  } catch (error) {
    console.error("Erreur GET entreprise apprenants:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
