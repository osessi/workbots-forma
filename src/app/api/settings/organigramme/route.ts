// ===========================================
// API ORGANIGRAMME - CRUD (Qualiopi IND 9)
// ===========================================
// GET /api/settings/organigramme - Récupérer l'organigramme complet
// POST /api/settings/organigramme - Créer un nouveau poste

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { OrganigrammePosteType } from "@prisma/client";

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

// GET - Récupérer l'organigramme complet avec structure hiérarchique
export async function GET() {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer tous les postes de l'organigramme avec les intervenants liés
    const postes = await prisma.organigrammePoste.findMany({
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

    // Récupérer aussi les infos de l'organisation pour pré-remplir le dirigeant
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        representantNom: true,
        representantPrenom: true,
        representantFonction: true,
        email: true,
        telephone: true,
      },
    });

    return NextResponse.json({
      postes,
      organization,
      organizationId: user.organizationId,
    });
  } catch (error) {
    console.error("Erreur récupération organigramme:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la récupération de l'organigramme: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau poste dans l'organigramme
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      titre,
      nom,
      prenom,
      email,
      telephone,
      photo,
      description,
      intervenantId,
      niveau,
      ordre,
      parentId,
      isVisible,
    } = body;

    // Validation
    if (!titre || !nom || !prenom) {
      return NextResponse.json(
        { error: "Le titre, nom et prénom sont requis" },
        { status: 400 }
      );
    }

    // Validation du type
    const validTypes: OrganigrammePosteType[] = [
      "DIRIGEANT",
      "REFERENT_HANDICAP",
      "REFERENT_PEDAGOGIQUE",
      "REFERENT_QUALITE",
      "FORMATEUR",
      "ADMINISTRATIF",
      "AUTRE",
    ];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type de poste invalide" },
        { status: 400 }
      );
    }

    // Vérifier l'intervenant si spécifié
    if (intervenantId) {
      const intervenant = await prisma.intervenant.findFirst({
        where: {
          id: intervenantId,
          organizationId: user.organizationId,
        },
      });
      if (!intervenant) {
        return NextResponse.json(
          { error: "Intervenant non trouvé" },
          { status: 404 }
        );
      }
    }

    // Vérifier le parent si spécifié
    if (parentId) {
      const parent = await prisma.organigrammePoste.findFirst({
        where: {
          id: parentId,
          organizationId: user.organizationId,
        },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Poste parent non trouvé" },
          { status: 404 }
        );
      }
    }

    // Calculer l'ordre automatiquement si non fourni
    let finalOrdre = ordre;
    if (finalOrdre === undefined) {
      const lastPoste = await prisma.organigrammePoste.findFirst({
        where: {
          organizationId: user.organizationId,
          niveau: niveau || 0,
          parentId: parentId || null,
        },
        orderBy: { ordre: "desc" },
      });
      finalOrdre = lastPoste ? lastPoste.ordre + 1 : 0;
    }

    const poste = await prisma.organigrammePoste.create({
      data: {
        type: type || "AUTRE",
        titre,
        nom,
        prenom,
        email,
        telephone,
        photo,
        description,
        intervenantId,
        niveau: niveau || 0,
        ordre: finalOrdre,
        parentId,
        isVisible: isVisible !== false,
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
      },
    });

    return NextResponse.json(poste, { status: 201 });
  } catch (error) {
    console.error("Erreur création poste organigramme:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la création du poste: ${errorMessage}` },
      { status: 500 }
    );
  }
}
