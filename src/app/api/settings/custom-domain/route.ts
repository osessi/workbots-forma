// ===========================================
// API: Custom Domain - Gestion du domaine personnalisé
// POST /api/settings/custom-domain - Enregistrer un domaine
// DELETE /api/settings/custom-domain - Supprimer le domaine
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// POST - Enregistrer un domaine personnalisé
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer l'organisation pour vérifier le plan
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, plan: true },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier le rôle (admin requis)
    if (user.role !== "ORG_ADMIN" && !user.isSuperAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Vérifier le plan (Pro ou Enterprise requis)
    if (organization.plan !== "PRO" && organization.plan !== "ENTERPRISE") {
      return NextResponse.json(
        { error: "Le plan Pro ou Enterprise est requis pour cette fonctionnalité" },
        { status: 403 }
      );
    }

    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Domaine requis" }, { status: 400 });
    }

    // Validation du format du domaine
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Format de domaine invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le domaine n'est pas déjà utilisé
    const existingOrg = await prisma.organization.findFirst({
      where: {
        customDomain: domain.toLowerCase(),
        id: { not: organization.id },
      },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Ce domaine est déjà utilisé par une autre organisation" },
        { status: 409 }
      );
    }

    // Mettre à jour l'organisation
    const updatedOrg = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        customDomain: domain.toLowerCase(),
      },
    });

    return NextResponse.json({
      success: true,
      domain: updatedOrg.customDomain,
    });
  } catch (error) {
    console.error("[API] POST /api/settings/custom-domain error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer le domaine personnalisé
export async function DELETE() {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier le rôle (admin requis)
    if (user.role !== "ORG_ADMIN" && !user.isSuperAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Supprimer le domaine
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        customDomain: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/settings/custom-domain error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
