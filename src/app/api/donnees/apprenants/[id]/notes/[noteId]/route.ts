// ===========================================
// API APPRENANT NOTE - Suppression
// ===========================================
// DELETE /api/donnees/apprenants/[id]/notes/[noteId] - Supprimer une note

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string; noteId: string }>;
};

// DELETE - Supprimer une note
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: apprenantId, noteId } = await params;

    // Vérifier que l'apprenant existe et appartient à l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Vérifier que la note existe et appartient à cet apprenant
    const note = await prisma.apprenantNote.findFirst({
      where: {
        id: noteId,
        apprenantId,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note non trouvée" }, { status: 404 });
    }

    // Supprimer la note
    await prisma.apprenantNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression note apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la note" },
      { status: 500 }
    );
  }
}
