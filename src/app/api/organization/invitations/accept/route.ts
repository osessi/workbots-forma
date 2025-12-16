// ===========================================
// API ROUTE - Accept Invitation
// ===========================================
// Accepte une invitation et ajoute l'utilisateur à l'organisation

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

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

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Récupérer l'invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si l'invitation est valide
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette invitation n'est plus valide" },
        { status: 400 }
      );
    }

    // Vérifier si l'invitation est expirée
    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Cette invitation a expiré" },
        { status: 400 }
      );
    }

    // Vérifier que l'email correspond
    if (invitation.email.toLowerCase() !== supabaseUser.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "Cette invitation est pour une autre adresse email" },
        { status: 403 }
      );
    }

    // Récupérer ou créer l'utilisateur Prisma
    let user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (user) {
      // Utilisateur existe - mettre à jour l'organisation
      user = await prisma.user.update({
        where: { supabaseId: supabaseUser.id },
        data: {
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });
    } else {
      // Créer l'utilisateur
      const metadata = supabaseUser.user_metadata || {};
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          email: supabaseUser.email!,
          firstName: metadata.first_name || null,
          lastName: metadata.last_name || null,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });
    }

    // Marquer l'invitation comme acceptée
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // Log de l'audit
    await prisma.auditLog.create({
      data: {
        action: "INVITATION_ACCEPTED",
        entity: "User",
        entityId: user.id,
        userId: user.id,
        organizationId: invitation.organizationId,
        details: {
          invitationId: invitation.id,
          role: invitation.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation acceptée avec succès",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de l'invitation" },
      { status: 500 }
    );
  }
}
