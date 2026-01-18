// ===========================================
// API VERSION DE TEMPLATE (DETAIL)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Recuperer une version specifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Verifier que le template existe et est accessible
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [
          { isSystem: true },
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    const version = await prisma.templateVersion.findUnique({
      where: { id: versionId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!version || version.templateId !== id) {
      return NextResponse.json({ error: "Version non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error("Erreur récupération version:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la version" },
      { status: 500 }
    );
  }
}

// POST - Restaurer cette version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Verifier les droits admin
    if (!user.isSuperAdmin && user.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Verifier que le template existe
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [
          ...(user.isSuperAdmin ? [{ isSystem: true }] : []),
          ...(user.organizationId ? [{ organizationId: user.organizationId }] : []),
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    // Recuperer la version a restaurer
    const version = await prisma.templateVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.templateId !== id) {
      return NextResponse.json({ error: "Version non trouvée" }, { status: 404 });
    }

    // Sauvegarder l'etat actuel comme nouvelle version avant restauration
    const lastVersion = await prisma.templateVersion.findFirst({
      where: { templateId: id },
      orderBy: { version: "desc" },
    });

    const backupVersionNumber = (lastVersion?.version || 0) + 1;

    await prisma.templateVersion.create({
      data: {
        templateId: id,
        version: backupVersionNumber,
        content: template.content ?? {},
        headerContent: template.headerContent ?? undefined,
        footerContent: template.footerContent ?? undefined,
        changeNote: `Sauvegarde avant restauration vers v${version.version}`,
        createdById: user.id,
      },
    });

    // Restaurer le template avec le contenu de la version
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        content: version.content ?? {},
        headerContent: version.headerContent ?? undefined,
        footerContent: version.footerContent ?? undefined,
      },
    });

    // Creer une nouvelle version pour marquer la restauration
    const restoredVersionNumber = backupVersionNumber + 1;
    await prisma.templateVersion.create({
      data: {
        templateId: id,
        version: restoredVersionNumber,
        content: version.content ?? {},
        headerContent: version.headerContent ?? undefined,
        footerContent: version.footerContent ?? undefined,
        changeNote: `Restauré depuis v${version.version}`,
        createdById: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: `Template restauré à la version ${version.version}`,
    });
  } catch (error) {
    console.error("Erreur restauration version:", error);
    return NextResponse.json(
      { error: "Erreur lors de la restauration de la version" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une version
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Verifier les droits admin
    if (!user.isSuperAdmin && user.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Verifier que la version existe
    const version = await prisma.templateVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.templateId !== id) {
      return NextResponse.json({ error: "Version non trouvée" }, { status: 404 });
    }

    // Supprimer la version
    await prisma.templateVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression version:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la version" },
      { status: 500 }
    );
  }
}
