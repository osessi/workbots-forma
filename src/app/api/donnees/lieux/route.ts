// ===========================================
// API LIEUX DE FORMATION - CRUD
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// POST - Créer un lieu
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
      console.log("=== API Lieux POST - Body reçu ===");
      console.log("Body:", JSON.stringify(body, null, 2));
      console.log("User organizationId:", user.organizationId);
    } catch (parseError) {
      console.error("Erreur parsing JSON:", parseError);
      return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
    }

    const {
      nom,
      typeLieu,
      lieuFormation,
      codePostal,
      ville,
      infosPratiques,
      capacite,
      // Checklist conformité Qualiopi IND 17
      checkSurfaceAdaptee,
      checkErpConforme,
      checkVentilation,
      checkEclairage,
      checkSanitaires,
      checkAccessibiliteHandicap,
      checkWifi,
      checkVideoprojecteur,
      checkMobilier,
      checkEquipements,
      checkFournitures,
      notesConformite,
    } = body;

    if (!nom) {
      return NextResponse.json({ error: "Le nom du lieu est requis" }, { status: 400 });
    }

    if (!lieuFormation) {
      return NextResponse.json({ error: "L'adresse ou le lien est requis" }, { status: 400 });
    }

    // Convertir capacite en nombre ou null
    let parsedCapacite: number | null = null;
    if (typeLieu === "PRESENTIEL" && capacite !== undefined && capacite !== null && capacite !== "") {
      const parsed = parseInt(String(capacite), 10);
      if (!isNaN(parsed)) {
        parsedCapacite = parsed;
      }
    }

    const lieu = await prisma.lieuFormation.create({
      data: {
        nom,
        typeLieu: typeLieu || "PRESENTIEL",
        lieuFormation,
        codePostal: typeLieu === "PRESENTIEL" ? (codePostal || null) : null,
        ville: typeLieu === "PRESENTIEL" ? (ville || null) : null,
        infosPratiques: infosPratiques || null,
        capacite: parsedCapacite,
        // Checklist conformité Qualiopi IND 17
        checkSurfaceAdaptee: checkSurfaceAdaptee === true,
        checkErpConforme: checkErpConforme === true,
        checkVentilation: checkVentilation === true,
        checkEclairage: checkEclairage === true,
        checkSanitaires: checkSanitaires === true,
        checkAccessibiliteHandicap: checkAccessibiliteHandicap === true,
        checkWifi: checkWifi === true,
        checkVideoprojecteur: checkVideoprojecteur === true,
        checkMobilier: checkMobilier === true,
        checkEquipements: checkEquipements === true,
        checkFournitures: checkFournitures === true,
        notesConformite: notesConformite || null,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(lieu, { status: 201 });
  } catch (error) {
    console.error("Erreur création lieu:", error);
    // Log plus détaillé
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du lieu", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// GET - Lister les lieux
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

    const lieux = await prisma.lieuFormation.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        OR: search ? [
          { nom: { contains: search, mode: "insensitive" } },
          { lieuFormation: { contains: search, mode: "insensitive" } },
          { ville: { contains: search, mode: "insensitive" } },
        ] : undefined,
      },
      orderBy: { nom: "asc" },
    });

    return NextResponse.json(lieux);
  } catch (error) {
    console.error("Erreur récupération lieux:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des lieux" },
      { status: 500 }
    );
  }
}
