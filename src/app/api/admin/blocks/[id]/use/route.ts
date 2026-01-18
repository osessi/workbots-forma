// ===========================================
// API UTILISATION D'UN BLOC
// ===========================================
// Incremente le compteur d'utilisation d'un bloc

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// POST - Incrementer le compteur d'utilisation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Verifier que le bloc existe et est accessible
    const block = await prisma.reusableBlock.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { isSystem: true },
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
        ],
      },
    });

    if (!block) {
      return NextResponse.json({ error: "Bloc non trouvé" }, { status: 404 });
    }

    // Incrementer le compteur
    const updatedBlock = await prisma.reusableBlock.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ usageCount: updatedBlock.usageCount });
  } catch (error) {
    console.error("Erreur utilisation bloc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du compteur" },
      { status: 500 }
    );
  }
}
