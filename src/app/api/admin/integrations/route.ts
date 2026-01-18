import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Récupérer toutes les configurations d'intégration
export async function GET() {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.isSuperAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer les configurations depuis GlobalConfig
    const configs = await prisma.globalConfig.findMany({
      where: {
        key: { startsWith: "integration_" },
      },
    });

    // Parser les configurations
    const parsedConfigs: Record<string, Record<string, string>> = {};
    for (const config of configs) {
      const integrationId = config.key.replace("integration_", "");
      try {
        parsedConfigs[integrationId] = JSON.parse(config.value as string);
      } catch {
        parsedConfigs[integrationId] = {};
      }
    }

    return NextResponse.json({ configs: parsedConfigs });
  } catch (error) {
    console.error("Erreur récupération intégrations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PUT - Sauvegarder une configuration d'intégration
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.isSuperAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { integrationId, config } = await request.json();

    if (!integrationId) {
      return NextResponse.json(
        { error: "integrationId requis" },
        { status: 400 }
      );
    }

    const key = `integration_${integrationId}`;

    // Upsert la configuration
    await prisma.globalConfig.upsert({
      where: { key },
      update: {
        value: JSON.stringify(config),
        updatedAt: new Date(),
      },
      create: {
        key,
        value: JSON.stringify(config),
      },
    });

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_INTEGRATION",
        entity: "Integration",
        entityId: integrationId,
        userId: user.id,
        details: { integrationId, fieldsUpdated: Object.keys(config) },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur sauvegarde intégration:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une configuration d'intégration
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
    const integrationId = searchParams.get("integrationId");

    if (!integrationId) {
      return NextResponse.json(
        { error: "integrationId requis" },
        { status: 400 }
      );
    }

    const key = `integration_${integrationId}`;

    await prisma.globalConfig.delete({
      where: { key },
    });

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: "DELETE_INTEGRATION",
        entity: "Integration",
        entityId: integrationId,
        userId: user.id,
        details: { integrationId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression intégration:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
