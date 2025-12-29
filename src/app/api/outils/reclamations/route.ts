// ===========================================
// API RECLAMATIONS - Qualiopi IND 31
// Gestion des réclamations et difficultés rencontrées
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { ReclamationStatut, ReclamationOrigine, ReclamationCategorie } from "@prisma/client";

// GET - Récupérer les réclamations
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const statut = searchParams.get("statut") as ReclamationStatut | null;
    const categorie = searchParams.get("categorie") as ReclamationCategorie | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construire la requête
    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (statut) {
      whereClause.statut = statut;
    }

    if (categorie) {
      whereClause.categorie = categorie;
    }

    // Récupérer les réclamations
    const [reclamations, total] = await Promise.all([
      prisma.reclamation.findMany({
        where: whereClause,
        include: {
          formation: {
            select: {
              id: true,
              titre: true,
            },
          },
          session: {
            select: {
              id: true,
              reference: true,
              nom: true,
            },
          },
          apprenant: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
          amelioration: {
            select: {
              id: true,
              titre: true,
              statut: true,
            },
          },
        },
        orderBy: {
          dateReclamation: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.reclamation.count({
        where: whereClause,
      }),
    ]);

    // Statistiques
    const stats = await prisma.reclamation.groupBy({
      by: ["statut"],
      where: {
        organizationId: user.organizationId,
      },
      _count: {
        id: true,
      },
    });

    const statsFormatted = {
      total,
      parStatut: Object.fromEntries(
        stats.map(s => [s.statut, s._count.id])
      ),
    };

    return NextResponse.json({
      reclamations,
      total,
      stats: statsFormatted,
    });
  } catch (error) {
    console.error("Erreur récupération réclamations:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle réclamation
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();

    // Validation des champs obligatoires
    if (!body.nomPlaignant || !body.objet || !body.description) {
      return NextResponse.json(
        { error: "Les champs nomPlaignant, objet et description sont obligatoires" },
        { status: 400 }
      );
    }

    // Créer la réclamation
    const reclamation = await prisma.reclamation.create({
      data: {
        organizationId: user.organizationId,
        dateReclamation: body.dateReclamation ? new Date(body.dateReclamation) : new Date(),
        origine: body.origine as ReclamationOrigine || "EMAIL",
        categorie: body.categorie as ReclamationCategorie || "AUTRE",
        nomPlaignant: body.nomPlaignant,
        emailPlaignant: body.emailPlaignant || null,
        telephonePlaignant: body.telephonePlaignant || null,
        typePlaignant: body.typePlaignant || null,
        formationId: body.formationId || null,
        sessionId: body.sessionId || null,
        apprenantId: body.apprenantId || null,
        objet: body.objet,
        description: body.description,
        statut: "NOUVELLE",
        responsableId: user.id,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        session: {
          select: {
            id: true,
            reference: true,
            nom: true,
          },
        },
      },
    });

    return NextResponse.json(reclamation, { status: 201 });
  } catch (error) {
    console.error("Erreur création réclamation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
