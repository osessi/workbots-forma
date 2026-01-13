// ===========================================
// API VEILLE ACTION - CRUD par ID
// Corrections 402-407 : Exploitation de la veille
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Récupérer une action
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const action = await prisma.veilleAction.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        preuves: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        veilleArticle: {
          select: {
            id: true,
            titre: true,
            url: true,
            type: true,
            source: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
    });

    if (!action) {
      return NextResponse.json({ error: "Action non trouvée" }, { status: 404 });
    }

    return NextResponse.json(action);
  } catch (error) {
    console.error("Erreur GET veille action:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Modifier une action
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Vérifier que l'action appartient à l'organisation
    const existing = await prisma.veilleAction.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Action non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      analyse,
      actionAMettreEnPlace,
      personnesConcernees,
      statut,
      dateCreation,
      dateCloture,
    } = body;

    // Si statut passe à CLOTUREE et pas de date de clôture, mettre la date du jour
    let finalDateCloture = dateCloture ? new Date(dateCloture) : existing.dateCloture;
    if (statut === "CLOTUREE" && !finalDateCloture) {
      finalDateCloture = new Date();
    }
    // Si statut n'est plus CLOTUREE, retirer la date de clôture
    if (statut && statut !== "CLOTUREE") {
      finalDateCloture = null;
    }

    const action = await prisma.veilleAction.update({
      where: { id },
      data: {
        analyse,
        actionAMettreEnPlace,
        personnesConcernees,
        statut,
        dateCreation: dateCreation ? new Date(dateCreation) : undefined,
        dateCloture: finalDateCloture,
      },
      include: {
        preuves: {
          orderBy: { createdAt: "desc" },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("Erreur PUT veille action:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une action
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Vérifier que l'action appartient à l'organisation
    const existing = await prisma.veilleAction.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Action non trouvée" }, { status: 404 });
    }

    // Supprimer l'action (les preuves seront supprimées en cascade)
    await prisma.veilleAction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE veille action:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
