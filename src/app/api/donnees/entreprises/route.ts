// ===========================================
// API ENTREPRISES - CRUD
// ===========================================
// POST /api/donnees/entreprises - Créer une entreprise
// GET /api/donnees/entreprises - Lister les entreprises de l'organisation

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// POST - Créer une nouvelle entreprise
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
      raisonSociale,
      siret,
      tvaIntracom,
      contactCivilite,
      contactNom,
      contactPrenom,
      contactFonction,
      contactEmail,
      contactTelephone,
      adresse,
      codePostal,
      ville,
      pays,
      notes,
    } = body;

    if (!raisonSociale) {
      return NextResponse.json({ error: "La raison sociale est requise" }, { status: 400 });
    }

    const entreprise = await prisma.entreprise.create({
      data: {
        raisonSociale,
        siret,
        tvaIntracom,
        contactCivilite,
        contactNom,
        contactPrenom,
        contactFonction,
        contactEmail,
        contactTelephone,
        adresse,
        codePostal,
        ville,
        pays: pays || "France",
        notes,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(entreprise, { status: 201 });
  } catch (error) {
    console.error("Erreur création entreprise:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'entreprise" },
      { status: 500 }
    );
  }
}

// GET - Lister les entreprises
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

    const entreprises = await prisma.entreprise.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        OR: search ? [
          { raisonSociale: { contains: search, mode: "insensitive" } },
          { siret: { contains: search, mode: "insensitive" } },
          { contactNom: { contains: search, mode: "insensitive" } },
          { contactEmail: { contains: search, mode: "insensitive" } },
        ] : undefined,
      },
      include: {
        _count: {
          select: { apprenants: true },
        },
      },
      orderBy: { raisonSociale: "asc" },
    });

    return NextResponse.json(entreprises);
  } catch (error) {
    console.error("Erreur récupération entreprises:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entreprises" },
      { status: 500 }
    );
  }
}
