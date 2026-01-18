// ===========================================
// API ADMIN EMAIL TEMPLATES - CRUD des templates emails
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Récupérer tous les templates emails
export async function GET() {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.isSuperAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer tous les templates emails depuis GlobalConfig
    const configs = await prisma.globalConfig.findMany({
      where: {
        key: {
          startsWith: "email_template_",
        },
      },
    });

    // Parser les valeurs JSON
    const templates = configs.map((config) => ({
      id: config.key.replace("email_template_", ""),
      ...JSON.parse(config.value as string),
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Erreur récupération templates email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des templates" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau template email
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.isSuperAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, subject, category, content, variables, isActive } = body;

    if (!id || !name || !subject || !category || !content) {
      return NextResponse.json(
        { error: "id, name, subject, category et content sont requis" },
        { status: 400 }
      );
    }

    const templateData = {
      name,
      subject,
      category,
      content,
      variables: variables || [],
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Créer le template
    await prisma.globalConfig.create({
      data: {
        key: `email_template_${id}`,
        value: JSON.stringify(templateData),
        description: `Template email: ${name}`,
      },
    });

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: "CREATE_EMAIL_TEMPLATE",
        entity: "EmailTemplate",
        entityId: id,
        userId: user.id,
        details: { templateId: id, name, category },
      },
    });

    return NextResponse.json({ id, ...templateData }, { status: 201 });
  } catch (error) {
    console.error("Erreur création template email:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Un template avec cet ID existe déjà" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du template" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un template email
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.isSuperAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, subject, category, content, variables, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Récupérer l'existant
    const existing = await prisma.globalConfig.findUnique({
      where: { key: `email_template_${id}` },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    const existingData = JSON.parse(existing.value as string);

    const templateData = {
      ...existingData,
      name: name ?? existingData.name,
      subject: subject ?? existingData.subject,
      category: category ?? existingData.category,
      content: content ?? existingData.content,
      variables: variables ?? existingData.variables,
      isActive: isActive ?? existingData.isActive,
      updatedAt: new Date().toISOString(),
    };

    // Mettre à jour
    await prisma.globalConfig.update({
      where: { key: `email_template_${id}` },
      data: {
        value: JSON.stringify(templateData),
      },
    });

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_EMAIL_TEMPLATE",
        entity: "EmailTemplate",
        entityId: id,
        userId: user.id,
        details: { templateId: id, name: templateData.name },
      },
    });

    return NextResponse.json({ id, ...templateData });
  } catch (error) {
    console.error("Erreur mise à jour template email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du template" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un template email
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.isSuperAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Vérifier que le template existe
    const existing = await prisma.globalConfig.findUnique({
      where: { key: `email_template_${id}` },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer
    await prisma.globalConfig.delete({
      where: { key: `email_template_${id}` },
    });

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: "DELETE_EMAIL_TEMPLATE",
        entity: "EmailTemplate",
        entityId: id,
        userId: user.id,
        details: { templateId: id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression template email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du template" },
      { status: 500 }
    );
  }
}
