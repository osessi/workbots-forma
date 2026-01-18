// ===========================================
// API TEMPLATES POUR UTILISATEURS
// ===========================================
// GET /api/templates - Liste des templates disponibles pour l'utilisateur

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get("documentType");
    const category = searchParams.get("category");

    // Récupérer les templates accessibles:
    // - Templates de l'organisation
    // - Templates système (isSystem = true)
    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
        OR: [
          { organizationId: user.organizationId },
          { isSystem: true },
        ],
        ...(documentType && { documentType: documentType as never }),
        ...(category && { category: category as never }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        documentType: true,
        isSystem: true,
        organizationId: true,
        variables: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        // Priorité aux templates de l'organisation
        { organizationId: "desc" },
        { name: "asc" },
      ],
    });

    // Grouper par type de document pour faciliter l'affichage
    const groupedByType = templates.reduce((acc, template) => {
      const type = template.documentType || "AUTRE";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);

    return NextResponse.json({
      templates,
      groupedByType,
      total: templates.length,
    });
  } catch (error) {
    console.error("Erreur GET templates:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des templates" },
      { status: 500 }
    );
  }
}
