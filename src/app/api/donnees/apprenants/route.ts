// ===========================================
// API APPRENANTS - CRUD
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// POST - Créer un apprenant
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      nom,
      prenom,
      email,
      telephone,
      raisonSociale,
      siret,
      adresse,
      codePostal,
      ville,
      pays,
      statut,
      entrepriseId,
      notes,
    } = body;

    if (!nom || !prenom || !email) {
      return NextResponse.json({ error: "Nom, prénom et email sont requis" }, { status: 400 });
    }

    // Vérifier que l'entreprise appartient à l'organisation si spécifiée
    if (entrepriseId) {
      const entreprise = await prisma.entreprise.findFirst({
        where: {
          id: entrepriseId,
          organizationId: user.organizationId,
        },
      });
      if (!entreprise) {
        return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
      }
    }

    const apprenant = await prisma.apprenant.create({
      data: {
        nom,
        prenom,
        email,
        telephone,
        raisonSociale: statut === "INDEPENDANT" ? raisonSociale : null,
        siret: statut === "INDEPENDANT" ? siret : null,
        adresse,
        codePostal,
        ville,
        pays: pays || "France",
        statut: statut || "PARTICULIER",
        entrepriseId: statut === "SALARIE" ? entrepriseId : null,
        notes,
        organizationId: user.organizationId,
      },
      include: {
        entreprise: true,
      },
    });

    return NextResponse.json(apprenant, { status: 201 });
  } catch (error) {
    console.error("Erreur création apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'apprenant" },
      { status: 500 }
    );
  }
}

// GET - Lister les apprenants
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const statut = searchParams.get("statut");
    const entrepriseId = searchParams.get("entrepriseId");

    const apprenants = await prisma.apprenant.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        ...(statut ? { statut: statut as "SALARIE" | "INDEPENDANT" | "PARTICULIER" } : {}),
        ...(entrepriseId ? { entrepriseId } : {}),
        OR: search ? [
          { nom: { contains: search, mode: "insensitive" } },
          { prenom: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ] : undefined,
      },
      include: {
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return NextResponse.json(apprenants);
  } catch (error) {
    console.error("Erreur récupération apprenants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des apprenants" },
      { status: 500 }
    );
  }
}
