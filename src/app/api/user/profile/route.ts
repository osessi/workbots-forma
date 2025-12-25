// ===========================================
// API ROUTE - User Profile
// ===========================================
// Récupère et met à jour le profil utilisateur + organisation
// Supporte l'impersonation pour les super admins

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET - Récupérer le profil complet (user + org)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur complet avec l'organisation
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
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
      isSuperAdmin: currentUser.isSuperAdmin, // Important: utiliser la valeur de currentUser
      createdAt: user.createdAt,
      // Informations d'impersonation
      isImpersonating: currentUser.isImpersonating,
      impersonatedBy: currentUser.impersonatedBy,
      // Organisation complète
      organization: user.organization ? {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        plan: user.organization.plan,
        siret: user.organization.siret,
        numeroFormateur: user.organization.numeroFormateur,
        prefectureRegion: user.organization.prefectureRegion,
        siteWeb: user.organization.siteWeb,
        adresse: user.organization.adresse,
        codePostal: user.organization.codePostal,
        ville: user.organization.ville,
        telephone: user.organization.telephone,
        logo: user.organization.logo,
        signature: user.organization.signature,
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
// Supporte l'impersonation: met à jour l'utilisateur impersonaté si applicable
export async function PATCH(request: NextRequest) {
  try {
    // Utiliser getCurrentUser pour supporter l'impersonation
    const currentUser = await getCurrentUser();

    if (!currentUser) {
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
      prefectureRegion,
      siteWeb,
      adresse,
      codePostal,
      ville,
      telephoneEntreprise,
      logo,
    } = body;

    // Récupérer l'utilisateur complet avec organisation
    // Utiliser l'ID de currentUser (qui peut être l'utilisateur impersonaté)
    const userWithOrg = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { organization: true },
    });

    if (!userWithOrg) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour l'utilisateur (par ID, pas supabaseId, pour supporter l'impersonation)
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
    });

    // Mettre à jour l'organisation si elle existe
    let updatedOrg = userWithOrg.organization;
    if (userWithOrg.organizationId) {
      updatedOrg = await prisma.organization.update({
        where: { id: userWithOrg.organizationId },
        data: {
          ...(entreprise !== undefined && { name: entreprise }),
          ...(siret !== undefined && { siret }),
          ...(numeroFormateur !== undefined && { numeroFormateur }),
          ...(prefectureRegion !== undefined && { prefectureRegion }),
          ...(siteWeb !== undefined && { siteWeb }),
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
        prefectureRegion: updatedOrg.prefectureRegion,
        siteWeb: updatedOrg.siteWeb,
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
