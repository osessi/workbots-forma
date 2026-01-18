import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { isActive, role, isSuperAdmin } = body;

    // Vérifier qu'on ne modifie pas un super admin (sauf pour le rôle superadmin)
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { isSuperAdmin: true },
    });

    if (targetUser?.isSuperAdmin && isActive === false) {
      return NextResponse.json(
        { error: "Impossible de désactiver un super admin" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (role !== undefined) {
      updateData.role = role;
    }
    if (isSuperAdmin !== undefined) {
      updateData.isSuperAdmin = isSuperAdmin;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Vérifier qu'on ne supprime pas un super admin
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { isSuperAdmin: true },
    });

    if (targetUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: "Impossible de supprimer un super admin" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
