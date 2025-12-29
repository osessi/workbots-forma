
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

// POST - Authentifier un apprenant par email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, organizationSlug } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Trouver l'apprenant par email
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
        ...(organizationSlug ? {
          organization: {
            slug: organizationSlug,
          },
        } : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
          },
        },
        lmsInscriptions: {
          where: {
            formation: {
              isPublished: true,
              isArchived: false,
            },
          },
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Aucun compte apprenant trouvé avec cet email" },
        { status: 404 }
      );
    }

    // Vérifier qu'il a des inscriptions
    if (apprenant.lmsInscriptions.length === 0) {
      return NextResponse.json(
        { error: "Aucune formation disponible pour cet apprenant" },
        { status: 404 }
      );
    }

    // Générer un token d'accès
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // TODO: Dans une version production, stocker le token en base
    // Pour l'instant, on encode les infos dans le token (simplifié)
    const tokenData = {
      apprenantId: apprenant.id,
      organizationId: apprenant.organizationId,
      email: apprenant.email,
      exp: expiresAt.getTime(),
    };

    const encodedToken = Buffer.from(JSON.stringify(tokenData)).toString("base64url");

    return NextResponse.json({
      success: true,
      token: encodedToken,
      apprenant: {
        id: apprenant.id,
        nom: apprenant.nom,
        prenom: apprenant.prenom,
        email: apprenant.email,
      },
      organization: apprenant.organization,
      inscriptions: apprenant.lmsInscriptions.length,
    });
  } catch (error) {
    console.error("Erreur authentification apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'authentification" },
      { status: 500 }
    );
  }
}

// GET - Valider un token et récupérer les données de l'apprenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    console.log("[API /api/apprenant/auth GET] Token reçu:", token ? token.substring(0, 20) + "..." : "null");

    if (!token) {
      console.log("[API /api/apprenant/auth GET] Erreur: Token manquant");
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    // Décoder le token
    let tokenData;
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      tokenData = JSON.parse(decoded);
      console.log("[API /api/apprenant/auth GET] Token décodé:", {
        apprenantId: tokenData.apprenantId,
        organizationId: tokenData.organizationId,
        exp: new Date(tokenData.exp).toISOString(),
      });
    } catch (decodeError) {
      console.log("[API /api/apprenant/auth GET] Erreur décodage token:", decodeError);
      return NextResponse.json(
        { error: "Token invalide - décodage impossible" },
        { status: 401 }
      );
    }

    // Vérifier l'expiration
    if (Date.now() > tokenData.exp) {
      console.log("[API /api/apprenant/auth GET] Token expiré");
      return NextResponse.json(
        { error: "Token expiré" },
        { status: 401 }
      );
    }

    console.log("[API /api/apprenant/auth GET] Recherche apprenant...");

    // Récupérer l'apprenant avec ses inscriptions
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: tokenData.apprenantId,
        organizationId: tokenData.organizationId,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            nomCommercial: true,
            siret: true,
            adresse: true,
            email: true,
            telephone: true,
            siteWeb: true,
            numeroFormateur: true,
          },
        },
        lmsInscriptions: {
          where: {
            formation: {
              isPublished: true,
              isArchived: false,
            },
          },
          include: {
            formation: {
              select: {
                id: true,
                titre: true,
                description: true,
                image: true,
                modules: {
                  select: {
                    id: true,
                    titre: true,
                    ordre: true,
                    duree: true,
                  },
                  orderBy: { ordre: "asc" },
                },
              },
            },
            progressionModules: {
              include: {
                module: {
                  select: {
                    id: true,
                    titre: true,
                    ordre: true,
                  },
                },
              },
            },
          },
          orderBy: { dateInscription: "desc" },
        },
        scormTrackings: {
          include: {
            package: {
              select: {
                id: true,
                titre: true,
                version: true,
              },
            },
          },
        },
      },
    });

    if (!apprenant) {
      console.log("[API /api/apprenant/auth GET] Apprenant non trouvé pour:", {
        apprenantId: tokenData.apprenantId,
        organizationId: tokenData.organizationId,
      });
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    console.log("[API /api/apprenant/auth GET] Apprenant trouvé:", apprenant.email, "- Inscriptions:", apprenant.lmsInscriptions.length);

    return NextResponse.json({
      apprenant: {
        id: apprenant.id,
        nom: apprenant.nom,
        prenom: apprenant.prenom,
        email: apprenant.email,
        telephone: apprenant.telephone,
        adresse: apprenant.adresse,
        createdAt: apprenant.createdAt?.toISOString(),
      },
      organization: {
        id: apprenant.organization.id,
        name: apprenant.organization.name,
        nomCommercial: apprenant.organization.nomCommercial,
        logoUrl: apprenant.organization.logo,
        siret: apprenant.organization.siret,
        adresse: apprenant.organization.adresse,
        email: apprenant.organization.email,
        telephone: apprenant.organization.telephone,
        siteWeb: apprenant.organization.siteWeb,
        numeroFormateur: apprenant.organization.numeroFormateur,
      },
      inscriptions: apprenant.lmsInscriptions.map(insc => ({
        id: insc.id,
        progression: insc.progression,
        statut: insc.statut,
        dateInscription: insc.dateInscription,
        tempsTotal: insc.tempsTotal,
        formation: insc.formation,
        progressionModules: insc.progressionModules,
      })),
      scormTrackings: apprenant.scormTrackings,
    });
  } catch (error) {
    console.error("[API /api/apprenant/auth GET] Erreur validation token:", error);
    return NextResponse.json(
      { error: "Erreur lors de la validation", details: String(error) },
      { status: 500 }
    );
  }
}
