// ===========================================
// API EMAILING SEQUENCE [ID] - Gestion d'une séquence
// GET /api/emailing/sequences/[id] - Détails
// PATCH /api/emailing/sequences/[id] - Modifier
// DELETE /api/emailing/sequences/[id] - Supprimer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

// ===========================================
// GET - Détails d'une séquence
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;

    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
          include: {
            template: { select: { id: true, name: true } },
          },
        },
        enrollments: {
          orderBy: { enrolledAt: "desc" },
          take: 50,
          select: {
            id: true,
            contactEmail: true,
            contactName: true,
            status: true,
            currentStep: true,
            enrolledAt: true,
            completedAt: true,
            exitedAt: true,
            exitReason: true,
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
        const [sent, opened, clicked] = await Promise.all([
          prisma.emailSequenceEnrollment.count({
            where: {
              sequenceId: id,
              currentStep: { gte: step.order },
            },
          }),
          prisma.sentEmail.count({
            where: {
              metadata: {
                path: ["sequenceStepId"],
                equals: step.id,
              },
              openedAt: { not: null },
            },
          }),
          prisma.sentEmail.count({
            where: {
              metadata: {
                path: ["sequenceStepId"],
                equals: step.id,
              },
              clickedAt: { not: null },
            },
          }),
        ]);

        return {
          stepId: step.id,
          order: step.order,
          sent,
          opened,
          clicked,
          openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
          clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
        };
      })
    );

    // Stats globales
    const [activeCount, completedCount, exitedCount] = await Promise.all([
      prisma.emailSequenceEnrollment.count({
        where: { sequenceId: id, status: "ACTIVE" },
      }),
      prisma.emailSequenceEnrollment.count({
        where: { sequenceId: id, status: "COMPLETED" },
      }),
      prisma.emailSequenceEnrollment.count({
        where: { sequenceId: id, status: "EXITED" },
      }),
    ]);

    return NextResponse.json({
      sequence: {
        id: sequence.id,
        name: sequence.name,
        description: sequence.description,
        status: sequence.status,
        triggerType: sequence.triggerType,
        triggerConditions: sequence.triggerConditions,
        exitConditions: sequence.exitConditions,
        createdBy: sequence.createdBy
          ? `${sequence.createdBy.firstName} ${sequence.createdBy.lastName}`
          : null,
        createdAt: sequence.createdAt,
        updatedAt: sequence.updatedAt,
      },
      steps: sequence.steps.map((step, index) => ({
        id: step.id,
        order: step.order,
        name: step.name,
        subject: step.subject,
        content: step.content,
        templateId: step.templateId,
        templateName: step.template?.name,
        delayDays: step.delayDays,
        delayHours: step.delayHours,
        sendConditions: step.sendConditions,
        stats: stepStats[index],
      })),
      stats: {
        totalEnrollments: activeCount + completedCount + exitedCount,
        active: activeCount,
        completed: completedCount,
        exited: exitedCount,
        completionRate: (activeCount + completedCount + exitedCount) > 0
          ? Math.round((completedCount / (activeCount + completedCount + exitedCount)) * 100)
          : 0,
        totalEmailsSent: sequence.totalEmailsSent,
        totalOpened: sequence.totalOpened,
        totalClicked: sequence.totalClicked,
        overallOpenRate: sequence.totalEmailsSent > 0
          ? Math.round((sequence.totalOpened / sequence.totalEmailsSent) * 100)
          : 0,
        overallClickRate: sequence.totalOpened > 0
          ? Math.round((sequence.totalClicked / sequence.totalOpened) * 100)
          : 0,
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
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, role: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!sequence) {
      return NextResponse.json({ error: "Séquence non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      triggerType,
      triggerConditions,
      exitConditions,
      steps,
    } = body;

    // Mise à jour de la séquence
    const updated = await prisma.emailSequence.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(triggerType && { triggerType }),
        ...(triggerConditions && { triggerConditions }),
        ...(exitConditions && { exitConditions }),
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
          name: string;
          subject: string;
          content?: string;
          templateId?: string;
          delayDays?: number;
          delayHours?: number;
          sendConditions?: Record<string, unknown>;
        }, index: number) => ({
          sequenceId: id,
          order: index + 1,
          name: step.name || `Étape ${index + 1}`,
          subject: step.subject,
          content: step.content,
          templateId: step.templateId,
          delayDays: step.delayDays || 0,
          delayHours: step.delayHours || 0,
          sendConditions: step.sendConditions || {},
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
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, role: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    const sequence = await prisma.emailSequence.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
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
      where: { sequenceId: id, status: "ACTIVE" },
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
