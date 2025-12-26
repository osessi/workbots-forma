// ===========================================
// API SIGNATURE - Vérification Email
// ===========================================
// POST /api/signatures/sign/[token]/verify-email - Vérifier si l'email est autorisé

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// POST - Vérifier si l'email est autorisé à accéder au document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Récupérer le document avec ses relations
    const document = await prisma.signatureDocument.findUnique({
      where: { token },
      select: {
        id: true,
        destinataireEmail: true,
        organizationId: true,
        apprenantId: true,
        sessionId: true,
        session: {
          select: {
            formation: {
              select: {
                sessions: {
                  select: {
                    participants: {
                      select: {
                        email: true,
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

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérification 1: L'email correspond au destinataire du document
    if (emailLower === document.destinataireEmail.toLowerCase()) {
      return NextResponse.json({
        success: true,
        message: "Email vérifié",
        isDestinataire: true,
      });
    }

    // Vérification 2: L'email correspond à un apprenant de l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        email: emailLower,
        organizationId: document.organizationId,
      },
    });

    if (apprenant) {
      return NextResponse.json({
        success: true,
        message: "Email vérifié (apprenant)",
        isApprenant: true,
      });
    }

    // Vérification 3: L'email correspond à un participant de la formation
    if (document.session?.formation?.sessions) {
      for (const session of document.session.formation.sessions) {
        const participant = session.participants.find(
          (p) => p.email.toLowerCase() === emailLower
        );
        if (participant) {
          return NextResponse.json({
            success: true,
            message: "Email vérifié (participant)",
            isParticipant: true,
          });
        }
      }
    }

    // Vérification 4: L'email correspond à un utilisateur de l'organisation (formateur, admin)
    const user = await prisma.user.findFirst({
      where: {
        email: emailLower,
        organizationId: document.organizationId,
      },
    });

    if (user) {
      return NextResponse.json({
        success: true,
        message: "Email vérifié (utilisateur)",
        isUser: true,
      });
    }

    // Aucune correspondance trouvée
    return NextResponse.json(
      { error: "Cette adresse email n'est pas autorisée à accéder à ce document" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Erreur vérification email:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
