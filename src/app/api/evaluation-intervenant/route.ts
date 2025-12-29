// ===========================================
// API ÉVALUATION INTERVENANT - Gestion des évaluations formateur
// ===========================================
// POST /api/evaluation-intervenant - Créer une évaluation intervenant
// GET /api/evaluation-intervenant - Lister les évaluations (filtrables)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// POST - Créer une évaluation intervenant
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
    const { sessionId, intervenantId, expiresIn } = body;

    // Validation
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId est requis" }, { status: 400 });
    }

    if (!intervenantId) {
      return NextResponse.json({ error: "intervenantId est requis" }, { status: 400 });
    }

    // Vérifier que la session existe et appartient à l'organisation
    const session = await prisma.documentSession.findUnique({
      where: { id: sessionId },
      select: { organizationId: true },
    });

    if (!session || session.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Vérifier que l'intervenant existe et appartient à l'organisation
    const intervenant = await prisma.intervenant.findUnique({
      where: { id: intervenantId },
      select: { organizationId: true },
    });

    if (!intervenant || intervenant.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    // Vérifier s'il existe déjà une évaluation pour cette combinaison
    const existingEvaluation = await prisma.evaluationIntervenant.findUnique({
      where: {
        sessionId_intervenantId: {
          sessionId,
          intervenantId,
        },
      },
    });

    if (existingEvaluation) {
      // Retourner l'évaluation existante avec toutes les infos
      const evaluation = await prisma.evaluationIntervenant.findUnique({
        where: { id: existingEvaluation.id },
        include: {
          intervenant: {
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

    // Calculer l'expiration (par défaut 30 jours)
    let expiresAt: Date | null = null;
    const days = expiresIn || 30;
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Créer l'évaluation
    const evaluation = await prisma.evaluationIntervenant.create({
      data: {
        organizationId: user.organizationId,
        sessionId,
        intervenantId,
        expiresAt,
        sentAt: new Date(),
      },
      include: {
        intervenant: {
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

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error("Erreur création évaluation intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'évaluation" },
      { status: 500 }
    );
  }
}

// GET - Lister les évaluations intervenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status");
    const intervenantId = searchParams.get("intervenantId");

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

    if (status) {
      whereClause.status = status;
    }

    if (intervenantId) {
      whereClause.intervenantId = intervenantId;
    }

    // Récupérer les évaluations
    const evaluations = await prisma.evaluationIntervenant.findMany({
      where: whereClause,
      distinct: ["id"], // Éviter les doublons
      include: {
        intervenant: {
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
            satisfactionGlobale: true,
            scoreMoyen: true,
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
    };

    return NextResponse.json({ evaluations, stats });
  } catch (error) {
    console.error("Erreur récupération évaluations intervenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
