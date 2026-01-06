// ===========================================
// API: Custom Domain - Gestion du domaine personnalisé
// POST /api/settings/custom-domain - Enregistrer un domaine
// DELETE /api/settings/custom-domain - Supprimer le domaine
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour créer le client Supabase
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

// POST - Enregistrer un domaine personnalisé
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur et son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser?.organization) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier le rôle (admin requis)
    if (dbUser.role !== "ORG_ADMIN" && dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Vérifier le plan (Pro ou Enterprise requis)
    if (dbUser.organization.plan !== "PRO" && dbUser.organization.plan !== "ENTERPRISE") {
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
        id: { not: dbUser.organization.id },
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
      where: { id: dbUser.organization.id },
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
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur et son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser?.organization) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier le rôle (admin requis)
    if (dbUser.role !== "ORG_ADMIN" && dbUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Supprimer le domaine
    await prisma.organization.update({
      where: { id: dbUser.organization.id },
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
