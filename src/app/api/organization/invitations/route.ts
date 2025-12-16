// ===========================================
// API ROUTE - Organization Invitations
// ===========================================
// Gère les invitations des membres d'une organisation

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

// Génère un token unique pour l'invitation
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// GET - Liste des invitations de l'organisation
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

    // Récupérer les invitations de l'organisation
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des invitations" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle invitation
export async function POST(request: NextRequest) {
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
    const { email, role = "FORMATEUR" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Vérifier que le rôle est valide
    if (!["FORMATEUR", "COLLABORATEUR", "ORG_ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà dans l'organisation
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet utilisateur fait déjà partie de l'organisation" },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà une invitation en attente
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Une invitation est déjà en attente pour cet email" },
        { status: 400 }
      );
    }

    // Vérifier les limites du plan
    const membersCount = await prisma.user.count({
      where: { organizationId: user.organizationId },
    });

    const pendingInvitationsCount = await prisma.invitation.count({
      where: {
        organizationId: user.organizationId,
        status: "PENDING",
      },
    });

    const maxFormateurs = user.organization?.maxFormateurs || 1;
    if (maxFormateurs !== -1 && membersCount + pendingInvitationsCount >= maxFormateurs) {
      return NextResponse.json(
        { error: "Limite de membres atteinte pour votre plan" },
        { status: 400 }
      );
    }

    // Créer l'invitation
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role as "FORMATEUR" | "COLLABORATEUR" | "ORG_ADMIN",
        token,
        organizationId: user.organizationId,
        invitedById: user.id,
        expiresAt,
      },
    });

    // TODO: Envoyer l'email d'invitation
    // Pour l'instant, on retourne le lien d'invitation
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        inviteLink,
      },
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation" },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une invitation
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

    // Vérifier que l'utilisateur est admin
    if (user.role !== "ORG_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json(
        { error: "ID d'invitation requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'invitation appartient à l'organisation
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        organizationId: user.organizationId,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée" },
        { status: 404 }
      );
    }

    // Annuler l'invitation
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de l'invitation" },
      { status: 500 }
    );
  }
}
