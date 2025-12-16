// ===========================================
// API ROUTE - Organization Members
// ===========================================
// Gère les membres d'une organisation

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Liste des membres de l'organisation
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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Utilisateur ou organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les membres de l'organisation
    const members = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des membres" },
      { status: 500 }
    );
  }
}

// PATCH - Modifier le rôle d'un membre
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
        { error: "Utilisateur ou organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est admin
    if (user.role !== "ORG_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberId, role, isActive } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "ID du membre requis" },
        { status: 400 }
      );
    }

    // Vérifier que le membre appartient à l'organisation
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        organizationId: user.organizationId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la modification de son propre rôle
    if (memberId === user.id && role !== undefined) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      );
    }

    // Mettre à jour le membre
    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: {
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
      },
    });

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        action: "MEMBER_UPDATED",
        entity: "User",
        entityId: memberId,
        userId: user.id,
        organizationId: user.organizationId,
        details: { role, isActive },
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du membre" },
      { status: 500 }
    );
  }
}

// DELETE - Retirer un membre de l'organisation
export async function DELETE(request: NextRequest) {
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
        { error: "Utilisateur ou organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est admin
    if (user.role !== "ORG_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        { error: "ID du membre requis" },
        { status: 400 }
      );
    }

    // Empêcher la suppression de soi-même
    if (memberId === user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous retirer vous-même" },
        { status: 400 }
      );
    }

    // Vérifier que le membre appartient à l'organisation
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        organizationId: user.organizationId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Retirer le membre de l'organisation (ne pas supprimer le compte)
    await prisma.user.update({
      where: { id: memberId },
      data: {
        organizationId: null,
        role: "FORMATEUR", // Reset to default role
      },
    });

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        action: "MEMBER_REMOVED",
        entity: "User",
        entityId: memberId,
        userId: user.id,
        organizationId: user.organizationId,
        details: { memberEmail: member.email },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Erreur lors du retrait du membre" },
      { status: 500 }
    );
  }
}
