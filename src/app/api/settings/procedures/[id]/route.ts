// ===========================================
// API PROCEDURE [ID] - Détail et versions
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer une procédure avec son historique de versions
export async function GET(
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const procedure = await prisma.procedure.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
        versions: {
          orderBy: {
            version: "desc",
          },
          take: 20,
        },
      },
    });

    if (!procedure) {
      return NextResponse.json({ error: "Procédure non trouvée" }, { status: 404 });
    }

    return NextResponse.json(procedure);
  } catch (error) {
    console.error("Erreur récupération procédure:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la procédure" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une procédure
export async function PUT(
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const existing = await prisma.procedure.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Procédure non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { nom, description, content, isPublished, changeNotes } = body;

    // Sauvegarder la version actuelle si le contenu change
    if (content && existing.content) {
      await prisma.procedureVersion.create({
        data: {
          procedureId: existing.id,
          content: existing.content,
          version: existing.version,
          modifiedById: user.id,
          modifiedByName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          changeNotes: changeNotes || null,
        },
      });
    }

    const procedure = await prisma.procedure.update({
      where: { id },
      data: {
        nom: nom !== undefined ? nom : undefined,
        description: description !== undefined ? description : undefined,
        content: content !== undefined ? content : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        publishedAt: isPublished && !existing.isPublished ? new Date() : undefined,
        version: content ? existing.version + 1 : undefined,
        lastModifiedBy: user.id,
      },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json(procedure);
  } catch (error) {
    console.error("Erreur mise à jour procédure:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une procédure
export async function DELETE(
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const procedure = await prisma.procedure.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!procedure) {
      return NextResponse.json({ error: "Procédure non trouvée" }, { status: 404 });
    }

    // Soft delete
    await prisma.procedure.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression procédure:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
