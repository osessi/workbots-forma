// ===========================================
// API: ACTIONS CORRECTIVES D'UN INDICATEUR QUALIOPI
// POST /api/qualiopi/indicateurs/[numero]/actions - Créer une action
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour créer le client Supabase
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;
    const body = await request.json();

    const { titre, description, priorite, dateEcheance } = body;

    if (!titre) {
      return NextResponse.json(
        { error: "Titre requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'indicateur existe
    let indicateur = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
    });

    // Si l'indicateur n'existe pas, le créer
    if (!indicateur) {
      indicateur = await prisma.indicateurConformite.create({
        data: {
          organizationId,
          numeroIndicateur: numeroInt,
          status: "EN_COURS",
          score: 0,
        },
      });
    }

    // Créer l'action corrective
    const action = await prisma.actionCorrective.create({
      data: {
        indicateurId: indicateur.id,
        titre,
        description: description || null,
        priorite: priorite || "MOYENNE",
        status: "A_FAIRE",
        dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
        responsableId: dbUser.id,
      },
      include: {
        responsable: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/qualiopi/indicateurs/[numero]/actions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer les actions d'un indicateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;

    // Récupérer les actions
    const indicateur = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
      include: {
        actions: {
          orderBy: { createdAt: "desc" },
          include: {
            responsable: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(indicateur?.actions || []);
  } catch (error) {
    console.error("[API] GET /api/qualiopi/indicateurs/[numero]/actions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une action
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { actionId, status, titre, description, priorite, dateEcheance } = body;

    if (!actionId) {
      return NextResponse.json(
        { error: "ID de l'action requis" },
        { status: 400 }
      );
    }

    // Mettre à jour l'action
    const action = await prisma.actionCorrective.update({
      where: { id: actionId },
      data: {
        ...(status && { status }),
        ...(titre && { titre }),
        ...(description !== undefined && { description }),
        ...(priorite && { priorite }),
        ...(dateEcheance !== undefined && {
          dateEcheance: dateEcheance ? new Date(dateEcheance) : null
        }),
      },
      include: {
        responsable: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("[API] PATCH /api/qualiopi/indicateurs/[numero]/actions error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
