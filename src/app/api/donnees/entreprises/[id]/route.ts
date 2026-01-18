// ===========================================
// API ENTREPRISE - CRUD par ID
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer une entreprise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const entreprise = await prisma.entreprise.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        apprenants: {
          where: { isActive: true },
          orderBy: { nom: "asc" },
          include: {
            // Correction 396: Inclure les pré-inscriptions de chaque apprenant
            preInscriptions: {
              orderBy: { createdAt: "desc" },
              include: {
                formation: {
                  select: {
                    id: true,
                    titre: true,
                    tarifAffiche: true,
                  },
                },
              },
            },
            // Inclure les participations aux sessions
            sessionParticipationsNew: {
              orderBy: { createdAt: "desc" },
              include: {
                client: {
                  include: {
                    session: {
                      select: {
                        id: true,
                        reference: true,
                        nom: true,
                        status: true,
                        formation: {
                          select: {
                            id: true,
                            titre: true,
                          },
                        },
                        journees: {
                          select: { date: true },
                          orderBy: { date: "asc" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!entreprise) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    // Correction 396: Agréger les statistiques
    const allPreInscriptions = entreprise.apprenants.flatMap(a => a.preInscriptions);
    const allSessions = entreprise.apprenants.flatMap(a => a.sessionParticipationsNew);

    const stats = {
      totalApprenants: entreprise.apprenants.length,
      totalPreInscriptions: allPreInscriptions.length,
      preInscriptionsAcceptees: allPreInscriptions.filter(p => p.statut === "ACCEPTEE").length,
      totalSessions: allSessions.length,
      sessionsEnCours: allSessions.filter(s => s.client.session.status === "EN_COURS").length,
      sessionsTerminees: allSessions.filter(s => s.client.session.status === "TERMINEE").length,
    };

    return NextResponse.json({
      ...entreprise,
      stats,
    });
  } catch (error) {
    console.error("Erreur récupération entreprise:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'entreprise" },
      { status: 500 }
    );
  }
}

// PUT - Modifier une entreprise
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'entreprise appartient à l'organisation
    const existing = await prisma.entreprise.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
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

    const entreprise = await prisma.entreprise.update({
      where: { id },
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
        pays,
        notes,
      },
    });

    return NextResponse.json(entreprise);
  } catch (error) {
    console.error("Erreur modification entreprise:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'entreprise" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une entreprise (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'entreprise appartient à l'organisation
    const existing = await prisma.entreprise.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    // Soft delete
    await prisma.entreprise.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression entreprise:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'entreprise" },
      { status: 500 }
    );
  }
}
