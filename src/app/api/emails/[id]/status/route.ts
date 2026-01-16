// ===========================================
// API EMAIL STATUS - Récupérer le statut d'un email envoyé
// ===========================================
// Correction 570: GET /api/emails/[id]/status - Récupérer le statut et date d'ouverture d'un email

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: emailId } = await params;

    // Authentification
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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer l'email
    const sentEmail = await prisma.sentEmail.findFirst({
      where: {
        id: emailId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        toEmail: true,
        subject: true,
      },
    });

    if (!sentEmail) {
      return NextResponse.json({ error: "Email non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      id: sentEmail.id,
      status: sentEmail.status,
      sentAt: sentEmail.sentAt?.toISOString() || null,
      deliveredAt: sentEmail.deliveredAt?.toISOString() || null,
      openedAt: sentEmail.openedAt?.toISOString() || null,
      clickedAt: sentEmail.clickedAt?.toISOString() || null,
      toEmail: sentEmail.toEmail,
      subject: sentEmail.subject,
    });
  } catch (error) {
    console.error("Erreur récupération statut email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}
