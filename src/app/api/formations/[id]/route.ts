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

    const updatedFormation = await prisma.formation.update({
      where: { id },
      data: updateData,
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
