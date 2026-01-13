// ===========================================
// Correction 433a: API INVITATIONS SESSION
// Gestion des invitations d'accès à l'espace apprenant
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import {
  sendEmail,
  generateInvitationApprenantWithTokenEmail,
} from "@/lib/services/email";

// Helper pour authentifier l'utilisateur
async function authenticateUser() {
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
    include: { organization: true },
  });

  return user;
}

// GET - Récupérer les statuts des invitations pour une session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // Vérifier que la session existe et appartient à l'organisation
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId: user.organizationId,
      },
      include: {
        clients: {
          include: {
            participants: {
              include: {
                apprenant: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Extraire tous les apprenants de la session
    const apprenantIds: string[] = [];
    for (const client of session.clients) {
      for (const participant of client.participants) {
        if (participant.apprenantId) {
          apprenantIds.push(participant.apprenantId);
        }
      }
    }

    // Récupérer les tokens d'invitation pour ces apprenants
    const inviteTokens = await prisma.apprenantInviteToken.findMany({
      where: {
        apprenantId: { in: apprenantIds },
      },
      orderBy: { createdAt: "desc" },
    });

    // Grouper par apprenant
    const tokensByApprenant: Record<string, typeof inviteTokens> = {};
    for (const token of inviteTokens) {
      if (!tokensByApprenant[token.apprenantId]) {
        tokensByApprenant[token.apprenantId] = [];
      }
      tokensByApprenant[token.apprenantId].push(token);
    }

    // Construire les statuts
    const now = new Date();
    const invitations = apprenantIds.map((apprenantId) => {
      const tokens = tokensByApprenant[apprenantId] || [];
      const latestToken = tokens[0];

      let status: "non_envoye" | "envoye" | "expire" | "active" = "non_envoye";

      if (latestToken) {
        if (latestToken.usedAt) {
          status = "active";
        } else if (new Date(latestToken.expiresAt) < now) {
          status = "expire";
        } else {
          status = "envoye";
        }
      }

      return {
        apprenantId,
        lastSentAt: latestToken?.createdAt?.toISOString() || null,
        expiresAt: latestToken?.expiresAt?.toISOString() || null,
        status,
        history: tokens.map((t) => ({
          sentAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
          usedAt: t.usedAt?.toISOString() || null,
        })),
      };
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Erreur récupération invitations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des invitations" },
      { status: 500 }
    );
  }
}

// POST - Envoyer une invitation à un apprenant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { apprenantId, type = "apprenant" } = body;

    if (!apprenantId) {
      return NextResponse.json(
        { error: "L'ID de l'apprenant est requis" },
        { status: 400 }
      );
    }

    // Vérifier que la session existe et appartient à l'organisation
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId: user.organizationId,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        clients: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Vérifier que l'apprenant fait partie de la session
    const isInSession = session.clients.some((client) =>
      client.participants.some((p) => p.apprenantId === apprenantId)
    );

    if (!isInSession) {
      return NextResponse.json(
        { error: "Cet apprenant ne fait pas partie de cette session" },
        { status: 400 }
      );
    }

    // Récupérer l'apprenant
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Générer un token d'invitation (valide 48h)
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 heures

    // Créer le token en base
    await prisma.apprenantInviteToken.create({
      data: {
        apprenantId,
        token: inviteToken,
        expiresAt,
      },
    });

    // Préparer les données pour l'email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.workbots.fr";
    const magicLinkUrl = `${baseUrl}/apprenant?token=${inviteToken}`;

    // Récupérer les infos de l'organisation pour personnaliser l'email
    const organization = user.organization;
    const primaryColor = "#4277FF"; // Couleur par défaut

    // Générer et envoyer l'email
    const emailContent = generateInvitationApprenantWithTokenEmail({
      prenom: apprenant.prenom,
      nom: apprenant.nom,
      email: apprenant.email,
      formationTitre: session.formation.titre,
      organizationName: organization?.name || "Votre organisme de formation",
      organizationLogo: organization?.logo || undefined,
      organizationEmail: organization?.email || undefined,
      organizationTelephone: organization?.telephone || undefined,
      primaryColor,
      magicLinkUrl,
    });

    await sendEmail(
      {
        to: apprenant.email,
        toName: `${apprenant.prenom} ${apprenant.nom}`,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        type: "INVITATION_APPRENANT",
        apprenantId: apprenant.id,
        sessionId: session.id,
        formationId: session.formation.id,
        sentByUserId: user.id,
      },
      user.organizationId
    );

    return NextResponse.json({
      success: true,
      message: "Invitation envoyée avec succès",
      sentAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Erreur envoi invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'invitation" },
      { status: 500 }
    );
  }
}
