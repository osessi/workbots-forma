// ===========================================
// API EVALUATIONS - CRUD
// ===========================================
// POST /api/evaluations - Créer une évaluation
// GET /api/evaluations - Lister les évaluations d'une formation

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

// Types valides pour EvaluationType
const validTypes = ["POSITIONNEMENT", "FINALE", "QCM_MODULE", "ATELIER_MODULE"];

// POST - Créer une nouvelle évaluation
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      formationId,
      type,
      moduleId,
      titre,
      description,
      dureeEstimee,
      contenu,
      scoreMinimum,
      nombreQuestions,
      tempsLimite,
      melangerQuestions,
      melangerReponses,
      ordre,
    } = body;

    // Validation
    if (!formationId) {
      return NextResponse.json({ error: "L'ID de la formation est requis" }, { status: 400 });
    }

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Le type doit être l'un des suivants: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (!titre) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    if (!contenu) {
      return NextResponse.json({ error: "Le contenu est requis" }, { status: 400 });
    }

    // Vérifier que la formation existe et appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Déterminer l'ordre si non fourni
    let evaluationOrdre = ordre;
    if (evaluationOrdre === undefined || evaluationOrdre === null) {
      const lastEvaluation = await prisma.evaluation.findFirst({
        where: { formationId },
        orderBy: { ordre: "desc" },
        select: { ordre: true },
      });
      evaluationOrdre = (lastEvaluation?.ordre ?? -1) + 1;
    }

    // Créer l'évaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        formationId,
        type,
        moduleId: moduleId || null,
        titre,
        description: description || null,
        dureeEstimee: dureeEstimee ? parseInt(dureeEstimee) : null,
        contenu,
        scoreMinimum: scoreMinimum ? parseFloat(scoreMinimum) : null,
        nombreQuestions: nombreQuestions ? parseInt(nombreQuestions) : null,
        tempsLimite: tempsLimite ? parseInt(tempsLimite) : null,
        melangerQuestions: melangerQuestions ?? false,
        melangerReponses: melangerReponses ?? false,
        ordre: evaluationOrdre,
      },
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error("Erreur création évaluation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'évaluation" },
      { status: 500 }
    );
  }
}

// GET - Lister les évaluations d'une formation
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formationId = searchParams.get("formationId");
    const type = searchParams.get("type");

    if (!formationId) {
      return NextResponse.json(
        { error: "L'ID de la formation est requis" },
        { status: 400 }
      );
    }

    // Vérifier que la formation appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Construire les filtres
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      formationId,
      isActive: true,
    };

    if (type && validTypes.includes(type)) {
      where.type = type;
    }

    // Récupérer les évaluations
    const evaluations = await prisma.evaluation.findMany({
      where,
      orderBy: [
        { type: "asc" },
        { ordre: "asc" },
      ],
      include: {
        _count: {
          select: {
            resultats: true,
          },
        },
      },
    });

    // Grouper par type
    const grouped = {
      positionnement: evaluations.filter(e => e.type === "POSITIONNEMENT"),
      modules: evaluations.filter(e => e.type === "QCM_MODULE" || e.type === "ATELIER_MODULE"),
      finale: evaluations.filter(e => e.type === "FINALE"),
    };

    return NextResponse.json({
      evaluations,
      grouped,
      total: evaluations.length,
    });
  } catch (error) {
    console.error("Erreur récupération évaluations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    );
  }
}
