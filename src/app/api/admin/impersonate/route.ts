import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

const IMPERSONATION_COOKIE = "impersonating_user_id";
const IMPERSONATION_MAX_AGE = 60 * 60; // 1 heure max

// Vérifier si l'utilisateur est super admin
async function checkSuperAdmin() {
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
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { id: true, isSuperAdmin: true, email: true, firstName: true, lastName: true },
  });

  return user?.isSuperAdmin ? { ...user, supabaseId: supabaseUser.id } : null;
}

// POST - Démarrer l'impersonation
export async function POST(request: NextRequest) {
  const admin = await checkSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Non autorisé - Super Admin requis" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
        organization: {
          select: { id: true, name: true }
        }
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Ne pas permettre l'impersonation d'un autre super admin
    if (targetUser.isSuperAdmin) {
      return NextResponse.json(
        { error: "Impossible d'impersonner un super admin" },
        { status: 400 }
      );
    }

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "IMPERSONATION_START",
        entity: "User",
        entityId: targetUser.id,
        userId: admin.id,
        details: {
          adminEmail: admin.email,
          adminName: `${admin.firstName || ""} ${admin.lastName || ""}`.trim(),
          targetEmail: targetUser.email,
          targetName: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim(),
          targetOrganization: targetUser.organization?.name || null,
        },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Créer le cookie d'impersonation
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: IMPERSONATION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: `Vous êtes maintenant connecté en tant que ${targetUser.firstName || ""} ${targetUser.lastName || ""} (${targetUser.email})`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        organization: targetUser.organization,
      },
    });
  } catch (error) {
    console.error("Erreur impersonation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Arrêter l'impersonation
export async function DELETE(request: NextRequest) {
  const admin = await checkSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const impersonatedUserId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

    if (impersonatedUserId) {
      // Log d'audit pour la fin de l'impersonation
      const targetUser = await prisma.user.findUnique({
        where: { id: impersonatedUserId },
        select: { email: true, firstName: true, lastName: true },
      });

      await prisma.auditLog.create({
        data: {
          action: "IMPERSONATION_END",
          entity: "User",
          entityId: impersonatedUserId,
          userId: admin.id,
          details: {
            adminEmail: admin.email,
            adminName: `${admin.firstName || ""} ${admin.lastName || ""}`.trim(),
            targetEmail: targetUser?.email || "unknown",
            targetName: `${targetUser?.firstName || ""} ${targetUser?.lastName || ""}`.trim(),
          },
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    }

    // Supprimer le cookie d'impersonation
    cookieStore.delete(IMPERSONATION_COOKIE);

    return NextResponse.json({
      success: true,
      message: "Impersonation terminée",
    });
  } catch (error) {
    console.error("Erreur arrêt impersonation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// GET - Vérifier le statut d'impersonation
export async function GET() {
  const admin = await checkSuperAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const impersonatedUserId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

    if (!impersonatedUserId) {
      return NextResponse.json({
        isImpersonating: false,
        user: null,
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: impersonatedUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      isImpersonating: true,
      user: targetUser,
    });
  } catch (error) {
    console.error("Erreur vérification impersonation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
