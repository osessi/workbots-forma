// ===========================================
// API EMAILING SEQUENCES - Drip campaigns
// GET /api/emailing/sequences - Liste des séquences
// POST /api/emailing/sequences - Créer une séquence
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
// GET - Liste des séquences
// ===========================================

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const trigger = searchParams.get("trigger");

    const sequences = await prisma.emailSequence.findMany({
      where: {
        organizationId: dbUser.organizationId,
        ...(status && { status }),
        ...(trigger && { triggerType: trigger }),
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            name: true,
            delayDays: true,
            delayHours: true,
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
            where: { sequenceId: seq.id, status: "ACTIVE" },
          }),
          prisma.emailSequenceEnrollment.count({
            where: { sequenceId: seq.id, status: "COMPLETED" },
          }),
        ]);

        return {
          id: seq.id,
          name: seq.name,
          description: seq.description,
          status: seq.status,
          triggerType: seq.triggerType,
          triggerConditions: seq.triggerConditions,
          stepsCount: seq.steps.length,
          steps: seq.steps,
          totalEnrollments: seq._count.enrollments,
          activeEnrollments,
          completedEnrollments,
          totalEmailsSent: seq.totalEmailsSent,
          totalOpened: seq.totalOpened,
          totalClicked: seq.totalClicked,
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

    const body = await request.json();
    const {
      name,
      description,
      triggerType = "MANUAL",
      triggerConditions,
      steps = [],
      exitConditions,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    // Créer la séquence avec ses étapes
    const sequence = await prisma.emailSequence.create({
      data: {
        organizationId: dbUser.organizationId,
        name,
        description,
        triggerType,
        triggerConditions: triggerConditions || {},
        exitConditions: exitConditions || {},
        status: "DRAFT",
        createdById: dbUser.id,
        steps: {
          create: steps.map((step: {
            name: string;
            subject: string;
            content?: string;
            templateId?: string;
            delayDays?: number;
            delayHours?: number;
            sendConditions?: Record<string, unknown>;
          }, index: number) => ({
            order: index + 1,
            name: step.name || `Étape ${index + 1}`,
            subject: step.subject,
            content: step.content,
            templateId: step.templateId,
            delayDays: step.delayDays || 0,
            delayHours: step.delayHours || 0,
            sendConditions: step.sendConditions || {},
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
        status: sequence.status,
        triggerType: sequence.triggerType,
        steps: sequence.steps,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/sequences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
