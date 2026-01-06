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

    // Built-in templates (toujours disponibles)
    const builtInTemplates = [
      {
        id: "general",
        name: "Général",
        description: "Template polyvalent pour tous types de présentations",
        layoutCount: 12,
        type: "builtin" as const,
      },
      {
        id: "modern",
        name: "Moderne",
        description: "Design sombre et épuré avec accents colorés, idéal pour pitch decks",
        layoutCount: 11,
        type: "builtin" as const,
      },
      {
        id: "standard",
        name: "Standard",
        description: "Format classique et professionnel avec mise en page structurée",
        layoutCount: 11,
        type: "builtin" as const,
      },
      {
        id: "swift",
        name: "Swift",
        description: "Style minimaliste et dynamique avec couleurs chaudes",
        layoutCount: 9,
        type: "builtin" as const,
      },
    ];

    // Essayer de récupérer les templates custom depuis le backend (optionnel)
    let customTemplates: Array<{
      id: string;
      name: string;
      description: string;
      layoutCount: number;
      lastUpdatedAt?: string;
      type: "custom";
    }> = [];

    try {
      const response = await fetch(
        `${SLIDES_API_URL}/api/v1/ppt/template-management/summary`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Timeout court pour ne pas bloquer si backend down
          signal: AbortSignal.timeout(3000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        customTemplates = data.presentations?.map(
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
      }
    } catch (backendError) {
      // Backend non disponible - ce n'est pas une erreur critique
      // Les templates built-in sont toujours disponibles
      console.log("Backend slides non disponible, utilisation des templates built-in uniquement");
    }

    return NextResponse.json({
      success: true,
      templates: [...builtInTemplates, ...customTemplates],
      builtInTemplates: builtInTemplates.map((t) => t.id),
      customTemplates: customTemplates.map((t) => t.id),
      total: builtInTemplates.length + customTemplates.length,
    });
  } catch (error) {
    console.error("Error in /api/workbots/templates:", error);
    // Même en cas d'erreur inattendue, retourner les templates par défaut
    return NextResponse.json({
      success: true,
      templates: [
        { id: "general", name: "Général", description: "Template polyvalent", layoutCount: 12, type: "builtin" },
        { id: "modern", name: "Moderne", description: "Design épuré et contemporain", layoutCount: 11, type: "builtin" },
        { id: "standard", name: "Standard", description: "Format classique et professionnel", layoutCount: 11, type: "builtin" },
        { id: "swift", name: "Swift", description: "Design minimaliste et rapide", layoutCount: 9, type: "builtin" },
      ],
      builtInTemplates: ["general", "modern", "standard", "swift"],
      customTemplates: [],
      total: 4,
    });
  }
}
