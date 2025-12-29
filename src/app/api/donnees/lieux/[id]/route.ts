// ===========================================
// API LIEU - CRUD par ID
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// GET - Récupérer un lieu
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

    const lieu = await prisma.lieuFormation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!lieu) {
      return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
    }

    return NextResponse.json(lieu);
  } catch (error) {
    console.error("Erreur récupération lieu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du lieu" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un lieu
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

    const existing = await prisma.lieuFormation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
    }

    const body = await request.json();
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

    // Convertir capacite en nombre ou null
    let parsedCapacite: number | null | undefined = undefined;
    if (capacite !== undefined) {
      if (typeLieu === "PRESENTIEL" && capacite !== null && capacite !== "") {
        const parsed = parseInt(String(capacite), 10);
        parsedCapacite = !isNaN(parsed) ? parsed : null;
      } else {
        parsedCapacite = null;
      }
    }

    const lieu = await prisma.lieuFormation.update({
      where: { id },
      data: {
        nom,
        typeLieu: typeLieu || "PRESENTIEL",
        lieuFormation,
        codePostal: typeLieu === "PRESENTIEL" ? (codePostal || null) : null,
        ville: typeLieu === "PRESENTIEL" ? (ville || null) : null,
        infosPratiques: infosPratiques || null,
        capacite: parsedCapacite,
        // Checklist conformité Qualiopi IND 17
        checkSurfaceAdaptee: checkSurfaceAdaptee !== undefined ? checkSurfaceAdaptee === true : undefined,
        checkErpConforme: checkErpConforme !== undefined ? checkErpConforme === true : undefined,
        checkVentilation: checkVentilation !== undefined ? checkVentilation === true : undefined,
        checkEclairage: checkEclairage !== undefined ? checkEclairage === true : undefined,
        checkSanitaires: checkSanitaires !== undefined ? checkSanitaires === true : undefined,
        checkAccessibiliteHandicap: checkAccessibiliteHandicap !== undefined ? checkAccessibiliteHandicap === true : undefined,
        checkWifi: checkWifi !== undefined ? checkWifi === true : undefined,
        checkVideoprojecteur: checkVideoprojecteur !== undefined ? checkVideoprojecteur === true : undefined,
        checkMobilier: checkMobilier !== undefined ? checkMobilier === true : undefined,
        checkEquipements: checkEquipements !== undefined ? checkEquipements === true : undefined,
        checkFournitures: checkFournitures !== undefined ? checkFournitures === true : undefined,
        notesConformite: notesConformite !== undefined ? (notesConformite || null) : undefined,
      },
    });

    return NextResponse.json(lieu);
  } catch (error) {
    console.error("Erreur modification lieu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du lieu" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un lieu (soft delete)
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

    const existing = await prisma.lieuFormation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
    }

    await prisma.lieuFormation.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression lieu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du lieu" },
      { status: 500 }
    );
  }
}
