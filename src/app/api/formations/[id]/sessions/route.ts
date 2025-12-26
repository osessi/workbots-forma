// ===========================================
// API SESSIONS D'UNE FORMATION
// ===========================================
// GET /api/formations/[id]/sessions - Liste des sessions avec participants

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

// GET - Récupérer les sessions d'une formation avec participants
// Combine les données des FormationSession ET des DocumentSession (wizard)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la formation appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // 1. Récupérer les sessions classiques (FormationSession)
    const formationSessions = await prisma.formationSession.findMany({
      where: {
        formationId: id,
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        formateur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { dateDebut: "asc" },
    });

    // 2. Récupérer les sessions documentaires (DocumentSession) avec leurs participants
    const documentSessions = await prisma.documentSession.findMany({
      where: {
        formationId: id,
        organizationId: user.organizationId,
      },
      include: {
        journees: {
          orderBy: { ordre: "asc" },
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
        formateur: true,
      },
    });

    // 3. Transformer les DocumentSession au format attendu par le frontend
    const documentSessionsFormatted = documentSessions.map((ds) => {
      // Extraire tous les participants de tous les clients
      const participants = ds.clients.flatMap((client) =>
        client.participants.map((p) => ({
          id: p.apprenant.id,
          firstName: p.apprenant.prenom,
          lastName: p.apprenant.nom,
          email: p.apprenant.email,
        }))
      );

      // Calculer les dates de début/fin depuis les journées
      const sortedJournees = [...ds.journees].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const dateDebut = sortedJournees[0]?.date || new Date();
      const dateFin = sortedJournees[sortedJournees.length - 1]?.date || dateDebut;

      return {
        id: ds.id,
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
        participants,
        formateur: ds.formateur
          ? {
              id: ds.formateur.id,
              firstName: ds.formateur.prenom,
              lastName: ds.formateur.nom,
              email: ds.formateur.email,
            }
          : null,
        isDocumentSession: true,
      };
    });

    // 4. Combiner les deux types de sessions
    const allSessions = [
      ...formationSessions.map((s) => ({ ...s, isDocumentSession: false })),
      ...documentSessionsFormatted,
    ];

    return NextResponse.json({
      sessions: allSessions,
      count: allSessions.length,
    });
  } catch (error) {
    console.error("Erreur récupération sessions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sessions" },
      { status: 500 }
    );
  }
}
