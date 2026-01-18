// ===========================================
// API: BPF PAR ANNÉE
// GET /api/bpf/[annee] - Détails d'un BPF
// PATCH /api/bpf/[annee] - Mettre à jour un BPF
// DELETE /api/bpf/[annee] - Supprimer un BPF
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// ===========================================
// GET - Détails d'un BPF
// ===========================================

export async function GET(
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

    const bpf = await prisma.bilanPedagogiqueFinancier.findUnique({
      where: {
        organizationId_annee: {
          organizationId: user.organizationId,
          annee,
        },
      },
    });

    if (!bpf) {
      return NextResponse.json(
        { error: "BPF non trouvé pour cette année" },
        { status: 404 }
      );
    }

    return NextResponse.json(bpf);
  } catch (error) {
    console.error("[API] GET /api/bpf/[annee] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// PATCH - Mettre à jour un BPF
// ===========================================

export async function PATCH(
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

    const body = await request.json();

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
        { error: "BPF non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le BPF n'a pas été soumis
    if (existingBpf.estSoumis) {
      return NextResponse.json(
        { error: "Ce BPF a déjà été soumis et ne peut plus être modifié" },
        { status: 403 }
      );
    }

    // Mettre à jour le BPF
    const bpf = await prisma.bilanPedagogiqueFinancier.update({
      where: {
        organizationId_annee: {
          organizationId: user.organizationId,
          annee,
        },
      },
      data: {
        ...(body.sectionA !== undefined && { sectionA: body.sectionA }),
        ...(body.nombreStagiaires !== undefined && { nombreStagiaires: body.nombreStagiaires }),
        ...(body.nombreHeuresFormation !== undefined && { nombreHeuresFormation: body.nombreHeuresFormation }),
        ...(body.nombreActions !== undefined && { nombreActions: body.nombreActions }),
        ...(body.chiffreAffaires !== undefined && { chiffreAffaires: body.chiffreAffaires }),
        ...(body.chargesExploitation !== undefined && { chargesExploitation: body.chargesExploitation }),
        ...(body.resultatNet !== undefined && { resultatNet: body.resultatNet }),
        ...(body.repartitionPublic !== undefined && { repartitionPublic: body.repartitionPublic }),
        ...(body.repartitionFinancement !== undefined && { repartitionFinancement: body.repartitionFinancement }),
        ...(body.repartitionDomaine !== undefined && { repartitionDomaine: body.repartitionDomaine }),
      },
    });

    return NextResponse.json(bpf);
  } catch (error) {
    console.error("[API] PATCH /api/bpf/[annee] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer un BPF
// ===========================================

export async function DELETE(
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

    // Vérifier que le BPF existe et n'a pas été soumis
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
        { error: "BPF non trouvé" },
        { status: 404 }
      );
    }

    if (existingBpf.estSoumis) {
      return NextResponse.json(
        { error: "Un BPF soumis ne peut pas être supprimé" },
        { status: 403 }
      );
    }

    await prisma.bilanPedagogiqueFinancier.delete({
      where: {
        organizationId_annee: {
          organizationId: user.organizationId,
          annee,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/bpf/[annee] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
