// ===========================================
// API FORMATIONS - SINGLE FORMATION CRUD
// ===========================================
// GET /api/formations/[id] - Récupérer une formation
// PATCH /api/formations/[id] - Mettre à jour une formation
// DELETE /api/formations/[id] - Supprimer une formation

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
    include: { organization: true },
  });

  return user;
}

// GET - Récupérer une formation
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

    const formation = await prisma.formation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          orderBy: { ordre: "asc" },
        },
        documents: true,
        slideGenerations: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 1,
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
            documents: true,
            sessions: true,
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    return NextResponse.json(formation);
  } catch (error) {
    console.error("Erreur récupération formation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la formation" },
      { status: 500 }
    );
  }
}

// Helper pour parser les tarifs
function parseTarif(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/(\d+(?:[.,]\d+)?)/);
    if (match) return parseFloat(match[1].replace(',', '.'));
  }
  return null;
}

// PATCH - Mettre à jour une formation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que la formation existe et appartient à l'organisation
    const existingFormation = await prisma.formation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingFormation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};

    if (body.titre !== undefined) updateData.titre = body.titre;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.fichePedagogique !== undefined) updateData.fichePedagogique = body.fichePedagogique;
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;

    // Nouveaux champs pour la persistance du wizard
    if (body.currentStep !== undefined) updateData.currentStep = body.currentStep;
    if (body.completedSteps !== undefined) updateData.completedSteps = body.completedSteps;
    if (body.contexteData !== undefined) updateData.contexteData = body.contexteData;
    if (body.evaluationsData !== undefined) updateData.evaluationsData = body.evaluationsData;
    if (body.slidesData !== undefined) updateData.slidesData = body.slidesData;
    if (body.slidesGenerated !== undefined) updateData.slidesGenerated = body.slidesGenerated;

    // Publication catalogue public
    if (body.estPublieCatalogue !== undefined) updateData.estPublieCatalogue = body.estPublieCatalogue;

    // Qualiopi IND 3 - Formation certifiante
    if (body.isCertifiante !== undefined) updateData.isCertifiante = body.isCertifiante;
    if (body.numeroFicheRS !== undefined) updateData.numeroFicheRS = body.numeroFicheRS;
    if (body.referentielRSUrl !== undefined) updateData.referentielRSUrl = body.referentielRSUrl;
    if (body.lienFranceCompetences !== undefined) updateData.lienFranceCompetences = body.lienFranceCompetences;

    // Extraire les champs de certification depuis contexteData si présents
    if (body.contexteData) {
      const ctx = body.contexteData;
      if (ctx.isCertifiante !== undefined) updateData.isCertifiante = Boolean(ctx.isCertifiante);
      if (ctx.numeroFicheRS) updateData.numeroFicheRS = ctx.numeroFicheRS;
      if (ctx.referentielRSUrl) updateData.referentielRSUrl = ctx.referentielRSUrl;
      if (ctx.lienFranceCompetences) updateData.lienFranceCompetences = ctx.lienFranceCompetences;
      // Éligibilité CPF
      if (ctx.estEligibleCPF !== undefined) updateData.estEligibleCPF = Boolean(ctx.estEligibleCPF);
    }

    // ===========================================
    // SYNCHRONISATION fichePedagogique -> champs Formation
    // Pour que le catalogue public affiche les données à jour
    // ===========================================
    if (body.fichePedagogique) {
      const fiche = body.fichePedagogique as Record<string, unknown>;

      // Synchroniser les champs Qualiopi pour le catalogue public
      if (fiche.publicVise) updateData.publicVise = fiche.publicVise;
      if (fiche.publicCible) updateData.publicVise = fiche.publicCible;
      if (fiche.prerequis) updateData.prerequis = fiche.prerequis;
      if (fiche.accessibilite) updateData.accessibiliteHandicap = fiche.accessibilite;
      if (fiche.accessibiliteHandicap) updateData.accessibiliteHandicap = fiche.accessibiliteHandicap;
      if (fiche.delaiAcces) updateData.delaiAcces = fiche.delaiAcces;
      if (fiche.modalitesEvaluation) updateData.modalitesEvaluation = fiche.modalitesEvaluation;

      // Synchroniser le tarif affiché (priorité: tarifEntreprise > tarif existant)
      const tarifEntreprise = parseTarif(fiche.tarifEntreprise);
      if (tarifEntreprise) {
        updateData.tarifAffiche = tarifEntreprise;
      }

      // Synchroniser certification
      if (fiche.isCertifiante !== undefined) {
        updateData.isCertifiante = Boolean(fiche.isCertifiante);
      }
      if (fiche.numeroFicheRS) updateData.numeroFicheRS = fiche.numeroFicheRS;
      if (fiche.lienFranceCompetences) updateData.lienFranceCompetences = fiche.lienFranceCompetences;

      // Synchroniser CPF
      if (fiche.estEligibleCPF !== undefined) {
        updateData.estEligibleCPF = Boolean(fiche.estEligibleCPF);
      }
    }

    // ===========================================
    // MISE À JOUR DES MODULES depuis fichePedagogique
    // ===========================================
    let modulesToSync: Array<{ titre: string; ordre: number; contenu?: object; duree?: number }> | null = null;

    // Vérifier si des modules sont fournis directement ou dans fichePedagogique
    if (body.modules && Array.isArray(body.modules) && body.modules.length > 0) {
      modulesToSync = body.modules;
    } else if (body.fichePedagogique) {
      const fiche = body.fichePedagogique as Record<string, unknown>;
      // Extraire les modules depuis fichePedagogique.contenu ou fichePedagogique.modules
      if (fiche.modules && Array.isArray(fiche.modules)) {
        modulesToSync = (fiche.modules as Array<{ titre?: string; ordre?: number; contenu?: object; duree?: number }>).map((m, idx) => ({
          titre: m.titre || `Module ${idx + 1}`,
          ordre: m.ordre ?? idx + 1,
          contenu: m.contenu || {},
          duree: m.duree || undefined,
        }));
      } else if (fiche.contenu && Array.isArray(fiche.contenu)) {
        // Format alternatif: contenu est un tableau de modules
        modulesToSync = (fiche.contenu as Array<{ titre?: string; items?: string[]; sousModules?: Array<{ titre: string }> }>).map((m, idx) => ({
          titre: m.titre || `Module ${idx + 1}`,
          ordre: idx + 1,
          contenu: { items: m.items || (m.sousModules?.map(s => s.titre) || []) },
          duree: undefined,
        }));
      }
    }

    // Exécuter la mise à jour dans une transaction
    const updatedFormation = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la formation
      const formation = await tx.formation.update({
        where: { id },
        data: updateData,
      });

      // 2. Mettre à jour les modules si fournis
      if (modulesToSync && modulesToSync.length > 0) {
        // Supprimer les anciens modules (sauf Module 0)
        await tx.module.deleteMany({
          where: {
            formationId: id,
            isModuleZero: false,
          },
        });

        // Créer les nouveaux modules
        await tx.module.createMany({
          data: modulesToSync.map((m) => ({
            formationId: id,
            titre: m.titre,
            ordre: m.ordre,
            contenu: m.contenu || {},
            duree: m.duree || null,
            isModuleZero: false,
          })),
        });
      }

      // 3. Retourner la formation avec ses modules
      return tx.formation.findUnique({
        where: { id },
        include: {
          modules: {
            orderBy: { ordre: "asc" },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedFormation);
  } catch (error) {
    console.error("Erreur mise à jour formation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la formation" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une formation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la formation existe et appartient à l'organisation
    const existingFormation = await prisma.formation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingFormation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Vérifier si des sessions sont rattachées à cette formation
    const sessionsCount = await prisma.session.count({
      where: { formationId: id },
    });

    if (sessionsCount > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer cette formation : des sessions existent déjà. Vous pouvez archiver la formation à la place.",
          sessionsCount,
          suggestion: "archive"
        },
        { status: 400 }
      );
    }

    // Supprimer la formation (cascade supprimera modules, documents, etc.)
    await prisma.formation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Formation supprimée" });
  } catch (error) {
    console.error("Erreur suppression formation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la formation" },
      { status: 500 }
    );
  }
}
