// ===========================================
// API EMAILING SEQUENCE ACTIVATE - Activer/Désactiver
// POST /api/emailing/sequences/[id]/activate - Activer
// POST /api/emailing/sequences/[id]/activate?action=pause - Mettre en pause
// POST /api/emailing/sequences/[id]/activate?action=stop - Arrêter
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "activate";

    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        steps: true,
      },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Séquence non trouvée" }, { status: 404 });
    }

    let isActive: boolean;

    switch (action) {
      case "activate":
        // Validation avant activation
        if (sequence.steps.length === 0) {
          return NextResponse.json({
            error: "La séquence doit avoir au moins une étape pour être activée",
          }, { status: 400 });
        }

        const hasSubject = sequence.steps.every((step) => step.subject);
        if (!hasSubject) {
          return NextResponse.json({
            error: "Toutes les étapes doivent avoir un sujet",
          }, { status: 400 });
        }

        isActive = true;

        // Reprendre les inscriptions en pause
        await prisma.emailSequenceEnrollment.updateMany({
          where: {
            sequenceId: id,
            isPaused: true,
            isCompleted: false,
          },
          data: {
            isPaused: false,
          },
        });
        break;

      case "pause":
        isActive = false;

        // Mettre en pause toutes les inscriptions actives
        await prisma.emailSequenceEnrollment.updateMany({
          where: {
            sequenceId: id,
            isPaused: false,
            isCompleted: false,
          },
          data: {
            isPaused: true,
          },
        });
        break;

      case "stop":
        isActive = false;

        // Marquer toutes les inscriptions comme terminées
        await prisma.emailSequenceEnrollment.updateMany({
          where: {
            sequenceId: id,
            isCompleted: false,
          },
          data: {
            isCompleted: true,
            completedAt: new Date(),
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
    }

    // Mettre à jour le statut de la séquence
    await prisma.emailSequence.update({
      where: { id },
      data: { isActive },
    });

    const messages: Record<string, string> = {
      activate: "Séquence activée. Les emails seront envoyés selon le calendrier défini.",
      pause: "Séquence mise en pause. Aucun email ne sera envoyé jusqu'à réactivation.",
      stop: "Séquence arrêtée. Toutes les inscriptions actives ont été terminées.",
    };

    return NextResponse.json({
      success: true,
      isActive,
      message: messages[action],
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/sequences/[id]/activate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
