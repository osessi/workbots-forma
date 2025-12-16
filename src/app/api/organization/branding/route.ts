// ===========================================
// API ROUTE - Organization Branding
// ===========================================
// Gère la personnalisation visuelle de l'organisation (couleur primaire, logo)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les paramètres de branding
export async function GET() {
  try {
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
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur et son organisation
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      primaryColor: user.organization.primaryColor || "#4277FF",
      logo: user.organization.logo,
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
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur et vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
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
