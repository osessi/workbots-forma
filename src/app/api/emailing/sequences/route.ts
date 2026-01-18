// ===========================================
// API EMAILING SEQUENCES - Drip campaigns
// GET /api/emailing/sequences - Liste des séquences
// POST /api/emailing/sequences - Créer une séquence
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { EmailTriggerType } from "@prisma/client";

export const dynamic = "force-dynamic";

// ===========================================
// GET - Liste des séquences
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const trigger = searchParams.get("trigger") as EmailTriggerType | null;

    const where: {
      organizationId: string;
      isActive?: boolean;
      triggerType?: EmailTriggerType;
    } = {
      organizationId: user.organizationId,
    };

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (trigger) {
      where.triggerType = trigger;
    }

    const sequences = await prisma.emailSequence.findMany({
      where,
      include: {
        steps: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            subject: true,
            delayDays: true,
            delayHours: true,
            delayMinutes: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Stats par séquence
    const sequencesWithStats = await Promise.all(
      sequences.map(async (seq) => {
        const [activeEnrollments, completedEnrollments] = await Promise.all([
          prisma.emailSequenceEnrollment.count({
            where: { sequenceId: seq.id, isCompleted: false, isPaused: false },
          }),
          prisma.emailSequenceEnrollment.count({
            where: { sequenceId: seq.id, isCompleted: true },
          }),
        ]);

        return {
          id: seq.id,
          name: seq.name,
          description: seq.description,
          isActive: seq.isActive,
          triggerType: seq.triggerType,
          triggerConfig: seq.triggerConfig,
          stepsCount: seq.steps.length,
          steps: seq.steps,
          totalEnrollments: seq._count.enrollments,
          activeEnrollments,
          completedEnrollments,
          enrolledCount: seq.enrolledCount,
          completedCount: seq.completedCount,
          createdAt: seq.createdAt,
          updatedAt: seq.updatedAt,
        };
      })
    );

    return NextResponse.json({
      sequences: sequencesWithStats,
      total: sequences.length,
    });
  } catch (error) {
    console.error("[API] GET /api/emailing/sequences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Créer une séquence
// ===========================================

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      description,
      triggerType = "MANUAL",
      triggerConfig,
      steps = [],
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    // Créer la séquence avec ses étapes
    const sequence = await prisma.emailSequence.create({
      data: {
        organizationId: user.organizationId,
        name,
        description,
        triggerType: triggerType as EmailTriggerType,
        triggerConfig: triggerConfig || {},
        isActive: false,
        createdById: user.id,
        steps: {
          create: steps.map((step: {
            subject: string;
            htmlContent: string;
            textContent?: string;
            delayDays?: number;
            delayHours?: number;
            delayMinutes?: number;
            conditions?: Record<string, unknown>;
          }, index: number) => ({
            order: index + 1,
            subject: step.subject,
            htmlContent: step.htmlContent || "",
            textContent: step.textContent,
            delayDays: step.delayDays || 0,
            delayHours: step.delayHours || 0,
            delayMinutes: step.delayMinutes || 0,
            conditions: step.conditions,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sequence: {
        id: sequence.id,
        name: sequence.name,
        description: sequence.description,
        isActive: sequence.isActive,
        triggerType: sequence.triggerType,
        steps: sequence.steps,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/sequences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
