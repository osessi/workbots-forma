// ===========================================
// API CRM OPPORTUNITÉS - CRUD + Pipeline
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { CRMStage } from "@prisma/client";

// GET - Récupérer les opportunités (pipeline)
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
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Si un ID est fourni, récupérer une seule opportunité
    if (id) {
      const opportunite = await prisma.cRMOpportunite.findFirst({
        where: {
          id,
          organizationId: user.organizationId,
        },
        include: {
          entreprise: {
            select: {
              id: true,
              raisonSociale: true,
              siret: true,
              contactEmail: true,
              contactTelephone: true,
            },
          },
          formation: {
            select: {
              id: true,
              titre: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              activites: true,
            },
          },
        },
      });

      if (!opportunite) {
        return NextResponse.json({ error: "Opportunité non trouvée" }, { status: 404 });
      }

      return NextResponse.json(opportunite);
    }

    // Récupérer toutes les opportunités groupées par stage
    const opportunites = await prisma.cRMOpportunite.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            activites: true,
          },
        },
      },
      orderBy: [
        { stage: "asc" },
        { ordre: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Calculer les statistiques
    const stats = {
      total: opportunites.length,
      montantTotal: opportunites.reduce((acc, o) => acc + (o.montantHT || 0), 0),
      montantPondere: opportunites.reduce((acc, o) => acc + ((o.montantHT || 0) * (o.probabilite / 100)), 0),
      parStage: {} as Record<string, { count: number; montant: number }>,
    };

    // Grouper par stage
    Object.values(CRMStage).forEach((stage) => {
      const stageOpps = opportunites.filter((o) => o.stage === stage);
      stats.parStage[stage] = {
        count: stageOpps.length,
        montant: stageOpps.reduce((acc, o) => acc + (o.montantHT || 0), 0),
      };
    });

    return NextResponse.json({
      opportunites,
      stats,
    });
  } catch (error) {
    console.error("Erreur récupération opportunités:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des opportunités" },
      { status: 500 }
    );
  }
}

// POST - Créer une opportunité
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
    const {
      titre,
      description,
      stage,
      montantHT,
      probabilite,
      source,
      contactNom,
      contactEmail,
      contactTelephone,
      contactFonction,
      entrepriseId,
      formationId,
      dateRelance,
      dateCloturePrevu,
      notes,
    } = body;

    if (!titre) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    // Trouver le prochain ordre dans la colonne
    const maxOrdre = await prisma.cRMOpportunite.aggregate({
      where: {
        organizationId: user.organizationId,
        stage: stage || "ENTRANT",
      },
      _max: {
        ordre: true,
      },
    });

    const opportunite = await prisma.cRMOpportunite.create({
      data: {
        titre,
        description,
        stage: stage || "ENTRANT",
        ordre: (maxOrdre._max.ordre || 0) + 1,
        montantHT: montantHT ? parseFloat(montantHT) : null,
        probabilite: probabilite || 50,
        source: source || "AUTRE",
        contactNom,
        contactEmail,
        contactTelephone,
        contactFonction,
        entrepriseId: entrepriseId || null,
        formationId: formationId || null,
        dateRelance: dateRelance ? new Date(dateRelance) : null,
        dateCloturePrevu: dateCloturePrevu ? new Date(dateCloturePrevu) : null,
        notes,
        organizationId: user.organizationId,
        userId: user.id,
      },
      include: {
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    return NextResponse.json(opportunite, { status: 201 });
  } catch (error) {
    console.error("Erreur création opportunité:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'opportunité" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une opportunité (drag & drop ou édition)
export async function PATCH(request: NextRequest) {
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
    const { id, stage, ordre, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Vérifier que l'opportunité appartient à l'organisation
    const existing = await prisma.cRMOpportunite.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Opportunité non trouvée" }, { status: 404 });
    }

    // Si le stage change, mettre à jour les ordres
    if (stage && stage !== existing.stage) {
      // Trouver le prochain ordre dans la nouvelle colonne
      const maxOrdre = await prisma.cRMOpportunite.aggregate({
        where: {
          organizationId: user.organizationId,
          stage,
        },
        _max: {
          ordre: true,
        },
      });

      updateData.stage = stage;
      updateData.ordre = (maxOrdre._max.ordre || 0) + 1;
    } else if (ordre !== undefined) {
      updateData.ordre = ordre;
    }

    // Nettoyer les champs de date
    if (updateData.dateRelance) {
      updateData.dateRelance = new Date(updateData.dateRelance);
    }
    if (updateData.dateCloturePrevu) {
      updateData.dateCloturePrevu = new Date(updateData.dateCloturePrevu);
    }
    if (updateData.montantHT) {
      updateData.montantHT = parseFloat(updateData.montantHT);
    }

    const opportunite = await prisma.cRMOpportunite.update({
      where: { id },
      data: updateData,
      include: {
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    return NextResponse.json(opportunite);
  } catch (error) {
    console.error("Erreur mise à jour opportunité:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'opportunité" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une opportunité
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

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

    // Vérifier que l'opportunité appartient à l'organisation
    const existing = await prisma.cRMOpportunite.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Opportunité non trouvée" }, { status: 404 });
    }

    await prisma.cRMOpportunite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression opportunité:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'opportunité" },
      { status: 500 }
    );
  }
}
