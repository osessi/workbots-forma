// ===========================================
// API AMELIORATIONS - Qualiopi IND 32
// CRUD pour une action d'amélioration spécifique
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { AmeliorationStatut, AmeliorationOrigine, AmeliorationPriorite } from "@prisma/client";

// GET - Récupérer une amélioration par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const amelioration = await prisma.actionAmelioration.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
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
            statut: true,
            dateReclamation: true,
            nomPlaignant: true,
          },
        },
      },
    });

    if (!amelioration) {
      return NextResponse.json({ error: "Amélioration non trouvée" }, { status: 404 });
    }

    return NextResponse.json(amelioration);
  } catch (error) {
    console.error("Erreur récupération amélioration:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une amélioration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Vérifier que l'amélioration existe et appartient à l'organisation
    const existing = await prisma.actionAmelioration.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Amélioration non trouvée" }, { status: 404 });
    }

    const body = await request.json();

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};

    // Champs modifiables
    if (body.origine) updateData.origine = body.origine as AmeliorationOrigine;
    if (body.origineDetails !== undefined) updateData.origineDetails = body.origineDetails;
    if (body.titre) updateData.titre = body.titre;
    if (body.description) updateData.description = body.description;
    if (body.domaine !== undefined) updateData.domaine = body.domaine;
    if (body.priorite) updateData.priorite = body.priorite as AmeliorationPriorite;
    if (body.responsableId !== undefined) updateData.responsableId = body.responsableId;
    if (body.responsableNom !== undefined) updateData.responsableNom = body.responsableNom;
    if (body.echeance !== undefined) {
      updateData.echeance = body.echeance ? new Date(body.echeance) : null;
    }
    if (body.formationId !== undefined) updateData.formationId = body.formationId || null;

    // Statut avec gestion des dates
    if (body.statut) {
      const newStatut = body.statut as AmeliorationStatut;
      updateData.statut = newStatut;

      if (newStatut === "EN_COURS" && !existing.dateDebut) {
        updateData.dateDebut = new Date();
      }
      if (newStatut === "TERMINEE" && !existing.dateRealisation) {
        updateData.dateRealisation = new Date();
      }
    }

    // Avancement
    if (body.avancement !== undefined) {
      updateData.avancement = Math.min(100, Math.max(0, body.avancement));
    }

    // Résultats
    if (body.resultat !== undefined) updateData.resultat = body.resultat;
    if (body.efficacite !== undefined) updateData.efficacite = body.efficacite;
    if (body.indicateurMesure !== undefined) updateData.indicateurMesure = body.indicateurMesure;
    if (body.valeurAvant !== undefined) updateData.valeurAvant = body.valeurAvant;
    if (body.valeurApres !== undefined) updateData.valeurApres = body.valeurApres;

    // Commentaires
    if (body.commentaires !== undefined) updateData.commentaires = body.commentaires;

    // Mettre à jour
    const amelioration = await prisma.actionAmelioration.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json(amelioration);
  } catch (error) {
    console.error("Erreur mise à jour amélioration:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une amélioration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Vérifier que l'amélioration existe et appartient à l'organisation
    const existing = await prisma.actionAmelioration.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Amélioration non trouvée" }, { status: 404 });
    }

    // Retirer les liens avec les réclamations avant suppression
    await prisma.reclamation.updateMany({
      where: { ameliorationId: id },
      data: { ameliorationId: null },
    });

    await prisma.actionAmelioration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression amélioration:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
