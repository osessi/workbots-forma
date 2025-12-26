// ===========================================
// API ÉMARGEMENT - Gestion des feuilles de présence
// ===========================================
// POST /api/emargement - Créer une feuille d'émargement pour une journée
// GET /api/emargement?sessionId=xxx - Lister les feuilles d'une session

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// POST - Créer une feuille d'émargement
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
    const { journeeId, expiresIn } = body;

    if (!journeeId) {
      return NextResponse.json({ error: "journeeId est requis" }, { status: 400 });
    }

    // Vérifier que la journée existe et appartient à l'organisation
    const journee = await prisma.sessionJournee.findUnique({
      where: { id: journeeId },
      include: {
        session: {
          select: { organizationId: true },
        },
      },
    });

    if (!journee || journee.session.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Journée non trouvée" }, { status: 404 });
    }

    // Vérifier s'il existe déjà une feuille pour cette journée
    const existingFeuille = await prisma.feuilleEmargement.findFirst({
      where: {
        journeeId,
        status: "active",
      },
    });

    if (existingFeuille) {
      return NextResponse.json(existingFeuille);
    }

    // Calculer l'expiration (par défaut fin de journée ou durée spécifiée)
    let expiresAt: Date | null = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 1000); // expiresIn en minutes
    }

    // Créer la feuille d'émargement
    const feuille = await prisma.feuilleEmargement.create({
      data: {
        journeeId,
        expiresAt,
      },
      include: {
        journee: {
          include: {
            session: {
              include: {
                formation: {
                  select: { titre: true },
                },
                clients: {
                  include: {
                    participants: {
                      include: {
                        apprenant: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        signatures: true,
      },
    });

    return NextResponse.json(feuille, { status: 201 });
  } catch (error) {
    console.error("Erreur création feuille émargement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la feuille d'émargement" },
      { status: 500 }
    );
  }
}

// GET - Lister les feuilles d'émargement
// Sans sessionId: toutes les feuilles de l'organisation
// Avec sessionId: uniquement les feuilles de cette session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

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
      journee: {
        session: {
          organizationId: user.organizationId,
        },
      },
    };

    // Si sessionId fourni, filtrer par session
    if (sessionId) {
      whereClause.journee.session.id = sessionId;
    }

    // Récupérer les feuilles avec leurs signatures
    const feuilles = await prisma.feuilleEmargement.findMany({
      where: whereClause,
      include: {
        journee: {
          include: {
            session: {
              select: {
                id: true,
                formation: {
                  select: { titre: true },
                },
              },
            },
          },
        },
        _count: {
          select: { signatures: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limiter à 50 dernières feuilles
    });

    return NextResponse.json({ feuilles });
  } catch (error) {
    console.error("Erreur récupération feuilles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des feuilles" },
      { status: 500 }
    );
  }
}
