// ===========================================
// API: BILAN PÉDAGOGIQUE ET FINANCIER (BPF)
// GET /api/bpf - Liste des BPF par année
// POST /api/bpf - Créer ou initialiser un BPF
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

// ===========================================
// GET - Liste des BPF
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer tous les BPF de l'organisation
    const bpfs = await prisma.bilanPedagogiqueFinancier.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { annee: "desc" },
    });

    // Si aucun BPF, retourner les années disponibles
    const currentYear = new Date().getFullYear();
    const availableYears = [currentYear - 1, currentYear - 2, currentYear - 3];

    return NextResponse.json({
      bpfs,
      availableYears: availableYears.filter(
        (year) => !bpfs.some((bpf) => bpf.annee === year)
      ),
    });
  } catch (error) {
    console.error("[API] GET /api/bpf error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Créer/Initialiser un BPF
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { annee } = body;

    if (!annee || typeof annee !== "number") {
      return NextResponse.json(
        { error: "Année requise" },
        { status: 400 }
      );
    }

    // Vérifier si un BPF existe déjà pour cette année
    const existingBpf = await prisma.bilanPedagogiqueFinancier.findUnique({
      where: {
        organizationId_annee: {
          organizationId: dbUser.organizationId,
          annee,
        },
      },
    });

    if (existingBpf) {
      return NextResponse.json(
        { error: "Un BPF existe déjà pour cette année" },
        { status: 409 }
      );
    }

    // Créer le BPF vide
    const bpf = await prisma.bilanPedagogiqueFinancier.create({
      data: {
        organizationId: dbUser.organizationId,
        annee,
        sectionA: {},
        repartitionPublic: {},
        repartitionFinancement: {},
        repartitionDomaine: {},
      },
    });

    return NextResponse.json(bpf, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/bpf error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
