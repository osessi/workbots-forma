// ===========================================
// API: DÉCLARER/SOUMETTRE UN BPF
// POST /api/bpf/[annee]/declarer - Marquer le BPF comme soumis
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

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

    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le BPF existe
    const existingBpf = await prisma.bilanPedagogiqueFinancier.findUnique({
      where: {
        organizationId_annee: {
          organizationId: user.organizationId,
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
          organizationId: user.organizationId,
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
