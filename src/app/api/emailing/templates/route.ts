// ===========================================
// API EMAILING TEMPLATES - CRUD des templates
// GET /api/emailing/templates - Liste
// POST /api/emailing/templates - Créer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}

// GET - Liste des templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, isSuperAdmin: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const includeGlobal = searchParams.get("includeGlobal") !== "false";

    // Construire le filtre
    const where: Parameters<typeof prisma.emailTemplate.findMany>[0]["where"] = {
      isActive: true,
      OR: [
        // Templates de l'organisation
        { organizationId: dbUser.organizationId },
        // Templates globaux (si demandé)
        ...(includeGlobal ? [{ isGlobal: true }] : []),
        // Si super admin, tous les templates
        ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
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
          { organizationId: dbUser.organizationId },
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
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, isSuperAdmin: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
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
    const makeGlobal = isGlobal && dbUser.isSuperAdmin;

    const template = await prisma.emailTemplate.create({
      data: {
        organizationId: makeGlobal ? null : dbUser.organizationId,
        name,
        description,
        subject,
        category,
        htmlContent,
        textContent,
        jsonContent,
        variables: variables || [],
        isGlobal: makeGlobal,
        createdById: dbUser.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/emailing/templates error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
