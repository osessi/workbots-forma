// ===========================================
// API Route: GET /api/workbots/templates
// Returns list of available Workbots Slides templates
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

const SLIDES_API_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get user's organization
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Fetch templates from Workbots Slides backend
    const response = await fetch(
      `${SLIDES_API_URL}/api/v1/ppt/template-management/summary`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch templates from backend:", response.statusText);
      // Return empty list instead of error for better UX
      return NextResponse.json({
        success: true,
        templates: [],
        builtInTemplates: ["general", "modern", "standard", "swift"],
        total: 0,
      });
    }

    const data = await response.json();

    // Transform the response
    const customTemplates = data.presentations?.map(
      (p: {
        presentation_id: string;
        layout_count: number;
        last_updated_at?: string;
        template?: { id: string; name: string; description?: string };
      }) => ({
        id: `custom-${p.presentation_id}`,
        name: p.template?.name || `Template personnalisé`,
        description: p.template?.description || `${p.layout_count} layouts disponibles`,
        layoutCount: p.layout_count,
        lastUpdatedAt: p.last_updated_at,
        type: "custom" as const,
      })
    ) || [];

    // Built-in templates
    const builtInTemplates = [
      {
        id: "general",
        name: "Général",
        description: "Template polyvalent pour tous types de présentations",
        layoutCount: 10,
        type: "builtin" as const,
      },
      {
        id: "modern",
        name: "Moderne",
        description: "Design épuré et contemporain",
        layoutCount: 8,
        type: "builtin" as const,
      },
      {
        id: "standard",
        name: "Standard",
        description: "Format classique et professionnel",
        layoutCount: 8,
        type: "builtin" as const,
      },
      {
        id: "swift",
        name: "Swift",
        description: "Design minimaliste et rapide",
        layoutCount: 6,
        type: "builtin" as const,
      },
    ];

    return NextResponse.json({
      success: true,
      templates: [...builtInTemplates, ...customTemplates],
      builtInTemplates: builtInTemplates.map((t) => t.id),
      customTemplates: customTemplates.map((t: { id: string }) => t.id),
      total: builtInTemplates.length + customTemplates.length,
    });
  } catch (error) {
    console.error("Error in /api/workbots/templates:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des templates",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
