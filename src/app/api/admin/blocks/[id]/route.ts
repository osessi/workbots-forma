// ===========================================
// API BLOC REUTILISABLE (DETAIL)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Recuperer un bloc
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

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

    return NextResponse.json({ block });
  } catch (error) {
    console.error("Erreur récupération bloc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du bloc" },
      { status: 500 }
    );
  }
}

// PUT - Mettre a jour un bloc
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Verifier les droits admin
    if (!user.isSuperAdmin && user.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Verifier que le bloc existe et appartient a l'organisation
    const existingBlock = await prisma.reusableBlock.findFirst({
      where: {
        id,
        OR: [
          { isSystem: true, ...(user.isSuperAdmin ? {} : { id: "never" }) },
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
        ],
      },
    });

    if (!existingBlock) {
      return NextResponse.json({ error: "Bloc non trouvé ou non autorisé" }, { status: 404 });
    }

    // Ne pas permettre la modification des blocs systeme sauf pour superadmin
    if (existingBlock.isSystem && !user.isSuperAdmin) {
      return NextResponse.json({ error: "Modification des blocs système non autorisée" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, content, category, tags } = body;

    const updatedBlock = await prisma.reusableBlock.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(category && { category }),
        ...(tags && { tags }),
      },
    });

    return NextResponse.json({ block: updatedBlock });
  } catch (error) {
    console.error("Erreur mise à jour bloc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du bloc" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un bloc
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Verifier les droits admin
    if (!user.isSuperAdmin && user.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Verifier que le bloc existe
    const existingBlock = await prisma.reusableBlock.findFirst({
      where: {
        id,
        OR: [
          ...(user.isSuperAdmin ? [{ isSystem: true }] : []),
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
        ],
      },
    });

    if (!existingBlock) {
      return NextResponse.json({ error: "Bloc non trouvé" }, { status: 404 });
    }

    // Ne pas permettre la suppression des blocs systeme sauf pour superadmin
    if (existingBlock.isSystem && !user.isSuperAdmin) {
      return NextResponse.json({ error: "Suppression des blocs système non autorisée" }, { status: 403 });
    }

    // Soft delete
    await prisma.reusableBlock.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression bloc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du bloc" },
      { status: 500 }
    );
  }
}
