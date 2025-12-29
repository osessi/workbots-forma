// ===========================================
// API RECLAMATIONS - Qualiopi IND 31
// CRUD pour une réclamation spécifique
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { ReclamationStatut, ReclamationOrigine, ReclamationCategorie } from "@prisma/client";

// GET - Récupérer une réclamation par ID
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

    const reclamation = await prisma.reclamation.findFirst({
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
            description: true,
          },
        },
      },
    });

    if (!reclamation) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 });
    }

    return NextResponse.json(reclamation);
  } catch (error) {
    console.error("Erreur récupération réclamation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une réclamation
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

    // Vérifier que la réclamation existe et appartient à l'organisation
    const existing = await prisma.reclamation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 });
    }

    const body = await request.json();

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};

    // Champs modifiables
    if (body.origine) updateData.origine = body.origine as ReclamationOrigine;
    if (body.categorie) updateData.categorie = body.categorie as ReclamationCategorie;
    if (body.nomPlaignant) updateData.nomPlaignant = body.nomPlaignant;
    if (body.emailPlaignant !== undefined) updateData.emailPlaignant = body.emailPlaignant;
    if (body.telephonePlaignant !== undefined) updateData.telephonePlaignant = body.telephonePlaignant;
    if (body.typePlaignant !== undefined) updateData.typePlaignant = body.typePlaignant;
    if (body.objet) updateData.objet = body.objet;
    if (body.description) updateData.description = body.description;
    if (body.formationId !== undefined) updateData.formationId = body.formationId || null;
    if (body.sessionId !== undefined) updateData.sessionId = body.sessionId || null;
    if (body.apprenantId !== undefined) updateData.apprenantId = body.apprenantId || null;

    // Traitement
    if (body.statut) {
      const newStatut = body.statut as ReclamationStatut;
      updateData.statut = newStatut;

      // Mettre à jour les dates en fonction du statut
      if (newStatut === "EN_ANALYSE" && !existing.datePriseEnCompte) {
        updateData.datePriseEnCompte = new Date();
      }
      if (newStatut === "RESOLUE" && !existing.dateResolution) {
        updateData.dateResolution = new Date();
        // Calculer le délai de traitement
        const dateDebut = existing.datePriseEnCompte || existing.dateReclamation;
        const delai = Math.ceil(
          (new Date().getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)
        );
        updateData.delaiTraitement = delai;
      }
    }

    if (body.analyse !== undefined) updateData.analyse = body.analyse;
    if (body.actionsCorrectives !== undefined) updateData.actionsCorrectives = body.actionsCorrectives;
    if (body.retourClient !== undefined) {
      updateData.retourClient = body.retourClient;
      if (body.retourClient && !existing.dateRetourClient) {
        updateData.dateRetourClient = new Date();
      }
    }
    if (body.actionPreventive !== undefined) updateData.actionPreventive = body.actionPreventive;
    if (body.ameliorationId !== undefined) updateData.ameliorationId = body.ameliorationId || null;

    // Mettre à jour
    const reclamation = await prisma.reclamation.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json(reclamation);
  } catch (error) {
    console.error("Erreur mise à jour réclamation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une réclamation
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

    // Vérifier que la réclamation existe et appartient à l'organisation
    const existing = await prisma.reclamation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 });
    }

    await prisma.reclamation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression réclamation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
