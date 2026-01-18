// ===========================================
// API EMAILING TEMPLATES - CRUD des templates
// GET /api/emailing/templates - Liste
// POST /api/emailing/templates - Créer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Liste des templates
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const includeGlobal = searchParams.get("includeGlobal") !== "false";

    // Construire le filtre
    const where: {
      isActive: boolean;
      OR?: Array<{ organizationId?: string | null; isGlobal?: boolean }>;
      category?: string;
      AND?: Array<{ OR?: Array<{ name?: { contains: string; mode: "insensitive" }; subject?: { contains: string; mode: "insensitive" } }> }>;
    } = {
      isActive: true,
      OR: [
        // Templates de l'organisation
        { organizationId: user.organizationId },
        // Templates globaux (si demandé)
        ...(includeGlobal ? [{ isGlobal: true }] : []),
        // Si super admin, tous les templates
        ...(user.isSuperAdmin ? [{ organizationId: null }] : []),
      ],
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
          ],
        },
      ];
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: [
        { isGlobal: "desc" },
        { updatedAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        subject: true,
        category: true,
        variables: true,
        isActive: true,
        isGlobal: true,
        version: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Catégories disponibles
    const categories = await prisma.emailTemplate.groupBy({
      by: ["category"],
      where: {
        OR: [
          { organizationId: user.organizationId },
          { isGlobal: true },
        ],
        isActive: true,
      },
      _count: { id: true },
    });

    return NextResponse.json({
      templates,
      categories: categories.map((c) => ({
        id: c.category,
        count: c._count.id,
      })),
      total: templates.length,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/templates error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un template
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      subject,
      category,
      htmlContent,
      textContent,
      jsonContent,
      variables,
      isGlobal,
    } = body;

    if (!name || !subject || !category || !htmlContent) {
      return NextResponse.json(
        { error: "Champs requis: name, subject, category, htmlContent" },
        { status: 400 }
      );
    }

    // Seul un super admin peut créer des templates globaux
    const makeGlobal = isGlobal && user.isSuperAdmin;

    const template = await prisma.emailTemplate.create({
      data: {
        organizationId: makeGlobal ? null : user.organizationId,
        name,
        description,
        subject,
        category,
        htmlContent,
        textContent,
        jsonContent,
        variables: variables || [],
        isGlobal: makeGlobal,
        createdById: user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/emailing/templates error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
