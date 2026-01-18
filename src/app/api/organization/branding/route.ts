// ===========================================
// API ROUTE - Organization Branding
// ===========================================
// Gère la personnalisation visuelle de l'organisation (couleur primaire, logo)

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les paramètres de branding
export async function GET() {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer l'organisation
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        primaryColor: true,
        logo: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      primaryColor: organization.primaryColor || "#4277FF",
      logo: organization.logo,
    });
  } catch (error) {
    console.error("Error fetching branding:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du branding" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour les paramètres de branding
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Pour le branding, on permet à tous les membres de l'organisation de modifier
    // (Peut être restreint aux admins plus tard si nécessaire)

    const body = await request.json();
    const { primaryColor, logo } = body;

    // Valider la couleur hex
    if (primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      return NextResponse.json(
        { error: "Format de couleur invalide. Utilisez le format hexadécimal (#RRGGBB)" },
        { status: 400 }
      );
    }

    // Mettre à jour l'organisation
    const updatedOrg = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        ...(primaryColor !== undefined && { primaryColor }),
        ...(logo !== undefined && { logo }),
      },
      select: {
        id: true,
        primaryColor: true,
        logo: true,
      },
    });

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        action: "BRANDING_UPDATED",
        entity: "Organization",
        entityId: user.organizationId,
        userId: user.id,
        organizationId: user.organizationId,
        details: { primaryColor, logo },
      },
    });

    return NextResponse.json({
      success: true,
      branding: updatedOrg,
    });
  } catch (error) {
    console.error("Error updating branding:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du branding" },
      { status: 500 }
    );
  }
}
