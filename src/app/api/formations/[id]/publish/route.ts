import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// POST - Publier/Dépublier une formation dans le LMS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier que la formation existe et appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { publish } = body;

    // Toggle ou valeur explicite
    const newPublishedState = publish !== undefined ? publish : !formation.isPublished;

    // Quand on publie, on met aussi le status à TERMINEE
    // Quand on dépublie, on garde le status TERMINEE (la formation reste complète)
    const updatedFormation = await prisma.formation.update({
      where: { id },
      data: {
        isPublished: newPublishedState,
        publishedAt: newPublishedState ? new Date() : null,
        // Mettre le status à TERMINEE si on publie (et qu'il n'est pas déjà TERMINEE)
        ...(newPublishedState && formation.status !== "TERMINEE" ? { status: "TERMINEE" } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      isPublished: updatedFormation.isPublished,
      publishedAt: updatedFormation.publishedAt,
      status: updatedFormation.status,
    });
  } catch (error) {
    console.error("Erreur publication formation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la publication" },
      { status: 500 }
    );
  }
}
