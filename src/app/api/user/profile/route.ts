// ===========================================
// API ROUTE - User Profile
// ===========================================
// Récupère et met à jour le profil utilisateur + organisation

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Récupérer le profil complet (user + org)
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

    // Récupérer l'utilisateur Prisma avec l'organisation complète
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
      // Organisation complète
      organization: user.organization ? {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
        siret: user.organization.siret,
        numeroFormateur: user.organization.numeroFormateur,
        adresse: user.organization.adresse,
        codePostal: user.organization.codePostal,
        ville: user.organization.ville,
        telephone: user.organization.telephone,
        logo: user.organization.logo,
        primaryColor: user.organization.primaryColor,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
}

// PUT - Alias for PATCH (for settings page)
export async function PUT(request: NextRequest) {
  return PATCH(request);
}

// PATCH - Mettre à jour le profil (user + org)
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

    const body = await request.json();
    const {
      // User fields
      firstName,
      lastName,
      phone,
      avatar,
      // Organization fields
      entreprise,
      siret,
      numeroFormateur,
      adresse,
      codePostal,
      ville,
      telephoneEntreprise,
      logo,
    } = body;

    // Récupérer l'utilisateur actuel
    const currentUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { supabaseId: supabaseUser.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
    });

    // Mettre à jour l'organisation si elle existe
    let updatedOrg = currentUser.organization;
    if (currentUser.organizationId) {
      updatedOrg = await prisma.organization.update({
        where: { id: currentUser.organizationId },
        data: {
          ...(entreprise !== undefined && { name: entreprise }),
          ...(siret !== undefined && { siret }),
          ...(numeroFormateur !== undefined && { numeroFormateur }),
          ...(adresse !== undefined && { adresse }),
          ...(codePostal !== undefined && { codePostal }),
          ...(ville !== undefined && { ville }),
          ...(telephoneEntreprise !== undefined && { telephone: telephoneEntreprise }),
          ...(logo !== undefined && { logo }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      },
      organization: updatedOrg ? {
        id: updatedOrg.id,
        name: updatedOrg.name,
        slug: updatedOrg.slug,
        siret: updatedOrg.siret,
        numeroFormateur: updatedOrg.numeroFormateur,
        adresse: updatedOrg.adresse,
        codePostal: updatedOrg.codePostal,
        ville: updatedOrg.ville,
        telephone: updatedOrg.telephone,
        logo: updatedOrg.logo,
      } : null,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
