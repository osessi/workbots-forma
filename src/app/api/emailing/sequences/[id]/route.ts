// ===========================================
// API EMAILING SEQUENCE [ID] - Gestion d'une séquence
// GET /api/emailing/sequences/[id] - Détails
// PATCH /api/emailing/sequences/[id] - Modifier
// DELETE /api/emailing/sequences/[id] - Supprimer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// ===========================================
// GET - Détails d'une séquence
// ===========================================

export async function GET(
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

    const { id } = await params;

    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          take: 50,
          select: {
            id: true,
            email: true,
            currentStep: true,
            isCompleted: true,
            isPaused: true,
            enrolledAt: true,
            completedAt: true,
          },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Séquence non trouvée" }, { status: 404 });
    }

    // Stats d'engagement par étape
    const stepStats = await Promise.all(
      sequence.steps.map(async (step) => {
        const sent = await prisma.emailSequenceEnrollment.count({
          where: {
            sequenceId: id,
            currentStep: { gte: step.order },
          },
        });

        return {
          stepId: step.id,
          order: step.order,
          sent,
          sentCount: step.sentCount,
          openedCount: step.openedCount,
          clickedCount: step.clickedCount,
          openRate: step.sentCount > 0 ? Math.round((step.openedCount / step.sentCount) * 100) : 0,
          clickRate: step.openedCount > 0 ? Math.round((step.clickedCount / step.openedCount) * 100) : 0,
        };
      })
    );

    // Stats globales
    const [activeCount, completedCount, pausedCount] = await Promise.all([
      prisma.emailSequenceEnrollment.count({
        where: { sequenceId: id, isCompleted: false, isPaused: false },
      }),
      prisma.emailSequenceEnrollment.count({
        where: { sequenceId: id, isCompleted: true },
      }),
      prisma.emailSequenceEnrollment.count({
        where: { sequenceId: id, isPaused: true },
      }),
    ]);

    return NextResponse.json({
      sequence: {
        id: sequence.id,
        name: sequence.name,
        description: sequence.description,
        isActive: sequence.isActive,
        triggerType: sequence.triggerType,
        triggerConfig: sequence.triggerConfig,
        createdBy: sequence.createdBy
          ? `${sequence.createdBy.firstName} ${sequence.createdBy.lastName}`
          : null,
        createdAt: sequence.createdAt,
        updatedAt: sequence.updatedAt,
      },
      steps: sequence.steps.map((step, index) => ({
        id: step.id,
        order: step.order,
        subject: step.subject,
        htmlContent: step.htmlContent,
        textContent: step.textContent,
        delayDays: step.delayDays,
        delayHours: step.delayHours,
        delayMinutes: step.delayMinutes,
        conditions: step.conditions,
        stats: stepStats[index],
      })),
      stats: {
        totalEnrollments: activeCount + completedCount + pausedCount,
        active: activeCount,
        completed: completedCount,
        paused: pausedCount,
        completionRate: (activeCount + completedCount + pausedCount) > 0
          ? Math.round((completedCount / (activeCount + completedCount + pausedCount)) * 100)
          : 0,
        enrolledCount: sequence.enrolledCount,
        completedCount: sequence.completedCount,
      },
      recentEnrollments: sequence.enrollments,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/sequences/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// PATCH - Modifier une séquence
// ===========================================

export async function PATCH(
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

    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Séquence non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      isActive,
      triggerType,
      triggerConfig,
      steps,
    } = body;

    // Mise à jour de la séquence
    await prisma.emailSequence.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(triggerType && { triggerType }),
        ...(triggerConfig && { triggerConfig }),
        updatedAt: new Date(),
      },
    });

    // Mise à jour des étapes si fournies
    if (steps && Array.isArray(steps)) {
      // Supprimer les anciennes étapes
      await prisma.emailSequenceStep.deleteMany({
        where: { sequenceId: id },
      });

      // Créer les nouvelles
      await prisma.emailSequenceStep.createMany({
        data: steps.map((step: {
          subject: string;
          htmlContent: string;
          textContent?: string;
          delayDays?: number;
          delayHours?: number;
          delayMinutes?: number;
          conditions?: Record<string, unknown>;
        }, index: number) => ({
          sequenceId: id,
          order: index + 1,
          subject: step.subject,
          htmlContent: step.htmlContent,
          textContent: step.textContent,
          delayDays: step.delayDays || 0,
          delayHours: step.delayHours || 0,
          delayMinutes: step.delayMinutes || 0,
          conditions: step.conditions as object | undefined,
        })),
      });
    }

    // Récupérer la séquence mise à jour
    const result = await prisma.emailSequence.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({
      success: true,
      sequence: result,
    });
  } catch (error) {
    console.error("[API] PATCH /api/emailing/sequences/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer une séquence
// ===========================================

export async function DELETE(
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

    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Séquence non trouvée" }, { status: 404 });
    }

    // Vérifier s'il y a des inscriptions actives
    const activeEnrollments = await prisma.emailSequenceEnrollment.count({
      where: { sequenceId: id, isCompleted: false, isPaused: false },
    });

    if (activeEnrollments > 0) {
      return NextResponse.json({
        error: `Cette séquence a ${activeEnrollments} inscriptions actives. Désactivez-la d'abord.`,
      }, { status: 400 });
    }

    // Supprimer les inscriptions
    await prisma.emailSequenceEnrollment.deleteMany({
      where: { sequenceId: id },
    });

    // Supprimer les étapes
    await prisma.emailSequenceStep.deleteMany({
      where: { sequenceId: id },
    });

    // Supprimer la séquence
    await prisma.emailSequence.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Séquence supprimée",
    });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/sequences/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
