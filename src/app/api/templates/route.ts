// ===========================================
// API TEMPLATES POUR UTILISATEURS
// ===========================================
// GET /api/templates - Liste des templates disponibles pour l'utilisateur

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
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
