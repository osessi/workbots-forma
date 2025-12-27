// ===========================================
// API SESSION PARTICIPANT - Gestion d'un participant
// ===========================================
// DELETE /api/training-sessions/[id]/clients/[clientId]/participants/[participantId] - Supprimer un participant

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

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
  });

  return user;
}

// DELETE - Supprimer un participant d'une session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string; participantId: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: sessionId, clientId, participantId } = await params;

    // Vérifier que la session existe et appartient à l'organisation
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId: user.organizationId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Vérifier que le participant existe dans le bon client
    const participant = await prisma.sessionParticipantNew.findFirst({
      where: {
        id: participantId,
        clientId: clientId,
        client: {
          sessionId: sessionId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant non trouvé" }, { status: 404 });
    }

    // Supprimer le participant dans une transaction
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer le participant
      await tx.sessionParticipantNew.delete({
        where: { id: participantId },
      });

      // 2. Décrémenter le compteur de la formation
      await tx.formation.update({
        where: { id: session.formationId },
        data: {
          totalApprenants: { decrement: 1 },
        },
      });

      // 3. Supprimer le client si plus aucun participant
      const remainingParticipants = await tx.sessionParticipantNew.count({
        where: { clientId },
      });

      if (remainingParticipants === 0) {
        await tx.sessionClientNew.delete({
          where: { id: clientId },
        });
      }
    });

    return NextResponse.json({ success: true, message: "Participant supprimé" });
  } catch (error) {
    console.error("Erreur suppression participant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du participant" },
      { status: 500 }
    );
  }
}
