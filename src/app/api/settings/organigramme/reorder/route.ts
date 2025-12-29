// ===========================================
// API ORGANIGRAMME - Réorganisation (Qualiopi IND 9)
// ===========================================
// POST /api/settings/organigramme/reorder - Réorganiser les postes (drag & drop)

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

// POST - Réorganiser les postes
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { postes } = body;

    // postes = [{ id: "...", niveau: 0, ordre: 0, parentId: null }, ...]

    if (!postes || !Array.isArray(postes)) {
      return NextResponse.json(
        { error: "Liste des postes requise" },
        { status: 400 }
      );
    }

    const orgId = user.organizationId;

    // Mettre à jour chaque poste en transaction
    await prisma.$transaction(
      postes.map((poste: { id: string; niveau: number; ordre: number; parentId: string | null }) =>
        prisma.organigrammePoste.updateMany({
          where: {
            id: poste.id,
            organizationId: orgId,
          },
          data: {
            niveau: poste.niveau,
            ordre: poste.ordre,
            parentId: poste.parentId,
          },
        })
      )
    );

    // Récupérer l'organigramme mis à jour
    const updatedPostes = await prisma.organigrammePoste.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        intervenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            fonction: true,
          },
        },
        parent: {
          select: {
            id: true,
            titre: true,
            nom: true,
            prenom: true,
          },
        },
        children: {
          select: {
            id: true,
            titre: true,
            nom: true,
            prenom: true,
            type: true,
            niveau: true,
            ordre: true,
          },
          orderBy: { ordre: "asc" },
        },
      },
      orderBy: [{ niveau: "asc" }, { ordre: "asc" }],
    });

    return NextResponse.json({ postes: updatedPostes });
  } catch (error) {
    console.error("Erreur réorganisation organigramme:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réorganisation" },
      { status: 500 }
    );
  }
}
