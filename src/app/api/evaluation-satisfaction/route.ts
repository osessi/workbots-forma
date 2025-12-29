// ===========================================
// API ÉVALUATION SATISFACTION - Gestion des évaluations à chaud et à froid
// ===========================================
// POST /api/evaluation-satisfaction - Créer une évaluation de satisfaction
// GET /api/evaluation-satisfaction - Lister les évaluations (filtrables)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { EvaluationSatisfactionType } from "@prisma/client";

// POST - Créer une évaluation de satisfaction
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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { sessionId, apprenantId, type, expiresIn } = body;

    // Validation
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId est requis" }, { status: 400 });
    }

    if (!apprenantId) {
      return NextResponse.json({ error: "apprenantId est requis" }, { status: 400 });
    }

    if (!type || !["CHAUD", "FROID"].includes(type)) {
      return NextResponse.json({ error: "type doit être CHAUD ou FROID" }, { status: 400 });
    }

    // Vérifier que la session existe et appartient à l'organisation
    const session = await prisma.documentSession.findUnique({
      where: { id: sessionId },
      select: {
        organizationId: true,
        formateurId: true,  // Récupérer le formateur pour créer son évaluation
      },
    });

    if (!session || session.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Vérifier que l'apprenant existe et appartient à l'organisation
    const apprenant = await prisma.apprenant.findUnique({
      where: { id: apprenantId },
      select: { organizationId: true },
    });

    if (!apprenant || apprenant.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Vérifier s'il existe déjà une évaluation pour cette combinaison
    const existingEvaluation = await prisma.evaluationSatisfaction.findUnique({
      where: {
        sessionId_apprenantId_type: {
          sessionId,
          apprenantId,
          type: type as EvaluationSatisfactionType,
        },
      },
    });

    if (existingEvaluation) {
      // Retourner l'évaluation existante avec toutes les infos
      const evaluation = await prisma.evaluationSatisfaction.findUnique({
        where: { id: existingEvaluation.id },
        include: {
          apprenant: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
          session: {
            include: {
              formation: { select: { titre: true } },
            },
          },
          reponse: true,
        },
      });
      return NextResponse.json(evaluation);
    }

    // Calculer l'expiration
    let expiresAt: Date | null = null;
    if (expiresIn) {
      // expiresIn en jours
      expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
    } else {
      // Par défaut: 30 jours pour évaluation à chaud, 90 jours pour évaluation à froid
      const defaultDays = type === "CHAUD" ? 30 : 90;
      expiresAt = new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000);
    }

    // Créer l'évaluation
    const evaluation = await prisma.evaluationSatisfaction.create({
      data: {
        organizationId: user.organizationId,
        sessionId,
        apprenantId,
        type: type as EvaluationSatisfactionType,
        expiresAt,
        sentAt: new Date(),
      },
      include: {
        apprenant: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        session: {
          include: {
            formation: { select: { titre: true } },
          },
        },
        reponse: true,
      },
    });

    // Créer automatiquement une évaluation intervenant si formateur assigné et pas encore créée
    if (session.formateurId) {
      const existingIntervenantEval = await prisma.evaluationIntervenant.findUnique({
        where: {
          sessionId_intervenantId: {
            sessionId,
            intervenantId: session.formateurId,
          },
        },
      });

      if (!existingIntervenantEval) {
        await prisma.evaluationIntervenant.create({
          data: {
            organizationId: user.organizationId,
            sessionId,
            intervenantId: session.formateurId,
            expiresAt,
            sentAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error("Erreur création évaluation satisfaction:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'évaluation" },
      { status: 500 }
    );
  }
}

// GET - Lister les évaluations de satisfaction
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const formationId = searchParams.get("formationId");

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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Construire le filtre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      organizationId: user.organizationId,
    };

    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    if (type && ["CHAUD", "FROID"].includes(type)) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (formationId) {
      whereClause.session = {
        formationId,
      };
    }

    // Récupérer les évaluations
    const evaluations = await prisma.evaluationSatisfaction.findMany({
      where: whereClause,
      distinct: ["id"], // Éviter les doublons
      include: {
        apprenant: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        session: {
          include: {
            formation: { select: { id: true, titre: true } },
            journees: {
              orderBy: { date: "asc" },
              take: 1,
            },
          },
        },
        reponse: {
          select: {
            id: true,
            noteGlobale: true,
            scoreMoyen: true,
            tauxSatisfaction: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    // Calculer des statistiques
    const stats = {
      total: evaluations.length,
      pending: evaluations.filter(e => e.status === "PENDING").length,
      inProgress: evaluations.filter(e => e.status === "IN_PROGRESS").length,
      completed: evaluations.filter(e => e.status === "COMPLETED").length,
      expired: evaluations.filter(e => e.status === "EXPIRED").length,
      tauxMoyenSatisfaction: 0,
    };

    // Calculer le taux moyen de satisfaction des évaluations complétées
    const completedWithScore = evaluations.filter(
      e => e.status === "COMPLETED" && e.reponse?.tauxSatisfaction
    );
    if (completedWithScore.length > 0) {
      const totalSatisfaction = completedWithScore.reduce(
        (acc, e) => acc + (e.reponse?.tauxSatisfaction || 0),
        0
      );
      stats.tauxMoyenSatisfaction = Math.round(totalSatisfaction / completedWithScore.length);
    }

    return NextResponse.json({ evaluations, stats });
  } catch (error) {
    console.error("Erreur récupération évaluations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
