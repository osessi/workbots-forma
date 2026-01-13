// ===========================================
// API AMELIORATIONS - Qualiopi IND 32
// Plan d'amélioration continue
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { AmeliorationStatut, AmeliorationOrigine, AmeliorationPriorite } from "@prisma/client";

// GET - Récupérer les actions d'amélioration
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
    const statut = searchParams.get("statut") as AmeliorationStatut | null;
    const origine = searchParams.get("origine") as AmeliorationOrigine | null;
    const priorite = searchParams.get("priorite") as AmeliorationPriorite | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construire la requête
    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (statut) {
      whereClause.statut = statut;
    }

    if (origine) {
      whereClause.origine = origine;
    }

    if (priorite) {
      whereClause.priorite = priorite;
    }

    // Récupérer les améliorations
    const [ameliorations, filteredTotal, totalGlobal] = await Promise.all([
      prisma.actionAmelioration.findMany({
        where: whereClause,
        include: {
          formation: {
            select: {
              id: true,
              titre: true,
            },
          },
          reclamations: {
            select: {
              id: true,
              objet: true,
              statut: true,
            },
          },
        },
        orderBy: [
          { priorite: "desc" },
          { echeance: "asc" },
          { dateCreation: "desc" },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.actionAmelioration.count({
        where: whereClause,
      }),
      // Correction 430: Total global sans filtre pour l'onglet "Toutes"
      prisma.actionAmelioration.count({
        where: {
          organizationId: user.organizationId,
        },
      }),
    ]);

    // Statistiques
    const [statsStatut, statsOrigine, statsPriorite] = await Promise.all([
      prisma.actionAmelioration.groupBy({
        by: ["statut"],
        where: { organizationId: user.organizationId },
        _count: { id: true },
      }),
      prisma.actionAmelioration.groupBy({
        by: ["origine"],
        where: { organizationId: user.organizationId },
        _count: { id: true },
      }),
      prisma.actionAmelioration.groupBy({
        by: ["priorite"],
        where: { organizationId: user.organizationId },
        _count: { id: true },
      }),
    ]);

    // Correction 430: Utiliser totalGlobal pour stats.total (onglet "Toutes")
    const stats = {
      total: totalGlobal,
      parStatut: Object.fromEntries(statsStatut.map(s => [s.statut, s._count.id])),
      parOrigine: Object.fromEntries(statsOrigine.map(s => [s.origine, s._count.id])),
      parPriorite: Object.fromEntries(statsPriorite.map(s => [s.priorite, s._count.id])),
    };

    return NextResponse.json({
      ameliorations,
      total: filteredTotal,
      stats,
    });
  } catch (error) {
    console.error("Erreur récupération améliorations:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle action d'amélioration
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
    if (!body.titre || !body.description) {
      return NextResponse.json(
        { error: "Les champs titre et description sont obligatoires" },
        { status: 400 }
      );
    }

    // Créer l'amélioration
    const amelioration = await prisma.actionAmelioration.create({
      data: {
        organizationId: user.organizationId,
        origine: body.origine as AmeliorationOrigine || "INITIATIVE",
        origineDetails: body.origineDetails || null,
        titre: body.titre,
        description: body.description,
        domaine: body.domaine || null,
        priorite: body.priorite as AmeliorationPriorite || "MOYENNE",
        responsableId: body.responsableId || user.id,
        responsableNom: body.responsableNom || null,
        echeance: body.echeance ? new Date(body.echeance) : null,
        statut: "A_FAIRE",
        formationId: body.formationId || null,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        reclamations: {
          select: {
            id: true,
            objet: true,
          },
        },
      },
    });

    // Si l'amélioration vient d'une réclamation, mettre à jour le lien
    if (body.reclamationId) {
      await prisma.reclamation.update({
        where: { id: body.reclamationId },
        data: { ameliorationId: amelioration.id },
      });
    }

    return NextResponse.json(amelioration, { status: 201 });
  } catch (error) {
    console.error("Erreur création amélioration:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
