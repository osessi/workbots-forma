// ===========================================
// API INTERVENANTS APPRENANT - GET /api/apprenant/intervenants
// ===========================================
// Récupère les intervenants liés à la session de formation de l'apprenant
// Corrections 473-476: Affichage intervenants avec photo, spécialités et contact messagerie

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

// Type intervenant pour l'API
// Correction 537: Ajout du rôle "coformateur"
interface IntervenantResponse {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  fonction: string | null;
  specialites: string[];
  structure: string | null;
  photoUrl: string | null;
  bio: string | null;
  role: "formateur" | "coformateur" | "tuteur" | "expert";
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId } = decoded;

    // Si sessionId fourni, récupérer les intervenants de la session spécifique
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          formateur: true,
          // Co-formateurs via table de jonction
          coFormateurs: {
            include: {
              intervenant: true,
            },
          },
        },
      });

      if (!session) {
        return NextResponse.json({ intervenants: [] });
      }

      const intervenants: IntervenantResponse[] = [];

      // Formateur principal
      if (session.formateur) {
        intervenants.push({
          id: session.formateur.id,
          nom: session.formateur.nom,
          prenom: session.formateur.prenom,
          email: session.formateur.email,
          telephone: session.formateur.telephone,
          fonction: session.formateur.fonction,
          specialites: session.formateur.specialites || [],
          structure: session.formateur.structure,
          photoUrl: session.formateur.photoUrl || null,
          bio: session.formateur.biographie || null,
          role: "formateur",
        });
      }

      // Co-formateurs (via table de jonction)
      if (session.coFormateurs && session.coFormateurs.length > 0) {
        for (const coFormateurRelation of session.coFormateurs) {
          const coFormateur = coFormateurRelation.intervenant;
          // Éviter les doublons
          if (!intervenants.some(i => i.id === coFormateur.id)) {
            intervenants.push({
              id: coFormateur.id,
              nom: coFormateur.nom,
              prenom: coFormateur.prenom,
              email: coFormateur.email,
              telephone: coFormateur.telephone,
              fonction: coFormateur.fonction,
              specialites: coFormateur.specialites || [],
              structure: coFormateur.structure,
              photoUrl: coFormateur.photoUrl || null,
              bio: coFormateur.biographie || null,
              role: "coformateur",
            });
          }
        }
      }

      return NextResponse.json({ intervenants });
    }

    // Fallback: comportement original si pas de sessionId
    const participation = await prisma.sessionParticipantNew.findFirst({
      where: { apprenantId },
      include: {
        client: {
          include: {
            session: {
              include: {
                formateur: true,
                coFormateurs: {
                  include: {
                    intervenant: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (participation) {
      const session = participation.client.session;
      const intervenants: IntervenantResponse[] = [];

      if (session.formateur) {
        intervenants.push({
          id: session.formateur.id,
          nom: session.formateur.nom,
          prenom: session.formateur.prenom,
          email: session.formateur.email,
          telephone: session.formateur.telephone,
          fonction: session.formateur.fonction,
          specialites: session.formateur.specialites || [],
          structure: session.formateur.structure,
          photoUrl: session.formateur.photoUrl || null,
          bio: session.formateur.biographie || null,
          role: "formateur",
        });
      }

      if (session.coFormateurs && session.coFormateurs.length > 0) {
        for (const coFormateurRelation of session.coFormateurs) {
          const coFormateur = coFormateurRelation.intervenant;
          if (!intervenants.some(i => i.id === coFormateur.id)) {
            intervenants.push({
              id: coFormateur.id,
              nom: coFormateur.nom,
              prenom: coFormateur.prenom,
              email: coFormateur.email,
              telephone: coFormateur.telephone,
              fonction: coFormateur.fonction,
              specialites: coFormateur.specialites || [],
              structure: coFormateur.structure,
              photoUrl: coFormateur.photoUrl || null,
              bio: coFormateur.biographie || null,
              role: "coformateur",
            });
          }
        }
      }

      return NextResponse.json({ intervenants });
    }

    // Fallback LMS
    const inscription = await prisma.lMSInscription.findFirst({
      where: { apprenantId },
    });

    if (!inscription) {
      return NextResponse.json({ intervenants: [] });
    }

    // Récupérer les formateurs liés aux sessions de cette formation
    const sessions = await prisma.session.findMany({
      where: {
        formationId: inscription.formationId,
        formateurId: { not: null },
      },
      include: {
        formateur: true,
        coFormateurs: {
          include: {
            intervenant: true,
          },
        },
      },
    });

    // Créer une map pour éviter les doublons
    const intervenantsMap = new Map<string, IntervenantResponse>();

    for (const session of sessions) {
      if (session.formateur && !intervenantsMap.has(session.formateur.id)) {
        intervenantsMap.set(session.formateur.id, {
          id: session.formateur.id,
          nom: session.formateur.nom,
          prenom: session.formateur.prenom,
          email: session.formateur.email,
          telephone: session.formateur.telephone,
          fonction: session.formateur.fonction,
          specialites: session.formateur.specialites || [],
          structure: session.formateur.structure,
          photoUrl: session.formateur.photoUrl || null,
          bio: session.formateur.biographie || null,
          role: "formateur",
        });
      }

      // Ajouter les co-formateurs
      if (session.coFormateurs) {
        for (const coFormateurRelation of session.coFormateurs) {
          const coFormateur = coFormateurRelation.intervenant;
          if (!intervenantsMap.has(coFormateur.id)) {
            intervenantsMap.set(coFormateur.id, {
              id: coFormateur.id,
              nom: coFormateur.nom,
              prenom: coFormateur.prenom,
              email: coFormateur.email,
              telephone: coFormateur.telephone,
              fonction: coFormateur.fonction,
              specialites: coFormateur.specialites || [],
              structure: coFormateur.structure,
              photoUrl: coFormateur.photoUrl || null,
              bio: coFormateur.biographie || null,
              role: "coformateur",
            });
          }
        }
      }
    }

    // Convertir la map en tableau
    const intervenants = Array.from(intervenantsMap.values());

    return NextResponse.json({ intervenants });
  } catch (error) {
    console.error("Erreur API intervenants apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des intervenants" },
      { status: 500 }
    );
  }
}
