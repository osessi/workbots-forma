// ===========================================
// API INTERVENANTS - CRUD
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// POST - Créer un intervenant
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

    let body;
    try {
      body = await request.json();
      console.log("=== API Intervenants POST - Body reçu ===");
      console.log("Body:", JSON.stringify(body, null, 2));
      console.log("User organizationId:", user.organizationId);
    } catch (parseError) {
      console.error("Erreur parsing JSON:", parseError);
      return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
    }

    const {
      nom,
      prenom,
      email,
      telephone,
      fonction,
      specialites,
      structure,
      structureSiret,
      notes,
      // Nouveaux champs Qualiopi IND 17
      photoUrl,
      cv,
      biographie,
      anneesExperience,
      numeroDeclarationActivite,
    } = body;

    if (!nom || !prenom) {
      return NextResponse.json({ error: "Nom et prénom sont requis" }, { status: 400 });
    }

    // Convertir anneesExperience en nombre ou null
    let parsedAnneesExperience: number | null = null;
    if (anneesExperience !== undefined && anneesExperience !== null && anneesExperience !== "") {
      const parsed = parseInt(String(anneesExperience), 10);
      if (!isNaN(parsed)) {
        parsedAnneesExperience = parsed;
      }
    }

    const intervenant = await prisma.intervenant.create({
      data: {
        nom,
        prenom,
        email: email || null,
        telephone: telephone || null,
        fonction: fonction || null,
        specialites: specialites || [],
        structure: structure || null,
        structureSiret: structureSiret || null,
        notes: notes || null,
        // Qualiopi IND 17
        photoUrl: photoUrl || null,
        cv: cv || null,
        biographie: biographie || null,
        anneesExperience: parsedAnneesExperience,
        numeroDeclarationActivite: numeroDeclarationActivite || null,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(intervenant, { status: 201 });
  } catch (error) {
    console.error("Erreur création intervenant:", error);
    // Log plus détaillé
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Erreur lors de la création de l'intervenant", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// GET - Lister les intervenants
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

    const intervenants = await prisma.intervenant.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        OR: search ? [
          { nom: { contains: search, mode: "insensitive" } },
          { prenom: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { fonction: { contains: search, mode: "insensitive" } },
        ] : undefined,
      },
      include: {
        diplomes: true, // Inclure les diplômes pour Qualiopi IND 17
      },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    });

    return NextResponse.json(intervenants);
  } catch (error) {
    console.error("Erreur récupération intervenants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des intervenants" },
      { status: 500 }
    );
  }
}
