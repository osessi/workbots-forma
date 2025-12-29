// ===========================================
// API SESSION PARTICIPANT - Gestion certification
// ===========================================
// PATCH /api/session-participant/[id] - Mettre à jour la certification d'un participant

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que le participant existe et appartient à l'organisation
    // On utilise SessionParticipantNew qui est lié au modèle Session (nouveau)
    const participant = await prisma.sessionParticipantNew.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            session: {
              include: {
                formation: true,
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant non trouvé" }, { status: 404 });
    }

    // Vérifier que la session appartient à l'organisation
    if (participant.client.session.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};

    // Qualiopi IND 3 - Certification
    if (body.certificationObtenue !== undefined) {
      updateData.certificationObtenue = Boolean(body.certificationObtenue);
    }
    if (body.dateCertification !== undefined) {
      updateData.dateCertification = body.dateCertification ? new Date(body.dateCertification) : null;
    }
    if (body.numeroCertificat !== undefined) {
      updateData.numeroCertificat = body.numeroCertificat || null;
    }

    // Autres champs de participation
    if (body.estConfirme !== undefined) {
      updateData.estConfirme = Boolean(body.estConfirme);
    }
    if (body.aAssiste !== undefined) {
      updateData.aAssiste = Boolean(body.aAssiste);
    }

    const updatedParticipant = await prisma.sessionParticipantNew.update({
      where: { id },
      data: updateData,
      include: {
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    // Recalculer le taux de certification pour la formation si c'est une formation certifiante
    if (body.certificationObtenue !== undefined && participant.client.session.formation?.isCertifiante) {
      await recalculerTauxCertification(participant.client.session.formation.id);
    }

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("Erreur mise à jour participant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du participant" },
      { status: 500 }
    );
  }
}

// Fonction pour recalculer le taux de certification d'une formation
async function recalculerTauxCertification(formationId: string) {
  try {
    // Récupérer toutes les sessions de la formation (nouveau modèle Session)
    const sessions = await prisma.session.findMany({
      where: { formationId },
      select: {
        id: true,
        clients: {
          select: {
            participants: {
              select: {
                aAssiste: true,
                certificationObtenue: true,
              },
            },
          },
        },
      },
    });

    // Calculer le nombre total de participants qui ont assisté et ceux qui ont obtenu la certification
    // Note: Un participant certifié est automatiquement considéré comme ayant assisté
    let totalPresentes = 0;
    let totalCertifies = 0;

    for (const session of sessions) {
      for (const client of session.clients) {
        for (const participant of client.participants) {
          // Un participant est "présenté" s'il a assisté OU s'il est certifié
          if (participant.aAssiste || participant.certificationObtenue) {
            totalPresentes++;
            if (participant.certificationObtenue) {
              totalCertifies++;
            }
          }
        }
      }
    }

    // Calculer le taux
    const tauxCertification = totalPresentes > 0
      ? (totalCertifies / totalPresentes) * 100
      : null;

    // Mettre à jour les indicateurs de la formation
    await prisma.formationIndicateurs.upsert({
      where: { formationId },
      update: {
        tauxCertification,
        dernierCalcul: new Date(),
      },
      create: {
        formationId,
        tauxCertification,
        dernierCalcul: new Date(),
      },
    });

    console.log(`Taux de certification recalculé pour formation ${formationId}: ${tauxCertification?.toFixed(1)}%`);
  } catch (error) {
    console.error("Erreur recalcul taux certification:", error);
  }
}
