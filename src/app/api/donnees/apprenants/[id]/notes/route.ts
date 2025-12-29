// ===========================================
// API APPRENANT NOTES - Qualiopi IND 5
// ===========================================
// GET /api/donnees/apprenants/[id]/notes - Récupérer l'historique des notes
// POST /api/donnees/apprenants/[id]/notes - Ajouter une nouvelle note

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

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

// GET - Récupérer l'historique des notes d'un apprenant
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'apprenant existe et appartient à l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Récupérer l'historique des notes avec les infos du créateur
    const notes = await prisma.apprenantNote.findMany({
      where: { apprenantId: id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Erreur récupération notes apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notes" },
      { status: 500 }
    );
  }
}

// POST - Ajouter une nouvelle note
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validation
    if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
      return NextResponse.json(
        { error: "Le contenu de la note est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'apprenant existe et appartient à l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Créer la nouvelle note
    const note = await prisma.apprenantNote.create({
      data: {
        apprenantId: id,
        content: body.content.trim(),
        createdById: user.id,
      },
      include: {
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

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Erreur création note apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la note" },
      { status: 500 }
    );
  }
}
