// ===========================================
// API: DÉCLARER/SOUMETTRE UN BPF
// POST /api/bpf/[annee]/declarer - Marquer le BPF comme soumis
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ annee: string }> }
) {
  try {
    const { annee: anneeStr } = await params;
    const annee = parseInt(anneeStr);

    if (isNaN(annee)) {
      return NextResponse.json(
        { error: "Année invalide" },
        { status: 400 }
      );
    }

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

    // Vérifier que le BPF existe
    const existingBpf = await prisma.bilanPedagogiqueFinancier.findUnique({
      where: {
        organizationId_annee: {
          organizationId: dbUser.organizationId,
          annee,
        },
      },
    });

    if (!existingBpf) {
      return NextResponse.json(
        { error: "BPF non trouvé pour cette année" },
        { status: 404 }
      );
    }

    if (existingBpf.estSoumis) {
      return NextResponse.json(
        { error: "Ce BPF a déjà été déclaré" },
        { status: 409 }
      );
    }

    // Vérifier que les données minimales sont présentes
    if (!existingBpf.nombreStagiaires && !existingBpf.nombreActions) {
      return NextResponse.json(
        {
          error: "Le BPF doit contenir au moins les données de base (stagiaires, actions). Utilisez d'abord /calculer."
        },
        { status: 400 }
      );
    }

    // Marquer comme soumis
    const bpf = await prisma.bilanPedagogiqueFinancier.update({
      where: {
        organizationId_annee: {
          organizationId: dbUser.organizationId,
          annee,
        },
      },
      data: {
        estSoumis: true,
        dateSoumission: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      bpf,
      message: `BPF ${annee} déclaré avec succès le ${new Date().toLocaleDateString("fr-FR")}`,
    });
  } catch (error) {
    console.error("[API] POST /api/bpf/[annee]/declarer error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
