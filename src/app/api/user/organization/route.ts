// ===========================================
// API GESTION ORGANISATION
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les informations de l'organisation
export async function GET() {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation complète si l'utilisateur en a une
    let organization = null;
    if (user.organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: user.organizationId },
      });
    }

    return NextResponse.json({
      organization,
    });
  } catch (error) {
    console.error("Erreur GET organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les informations de l'organisation
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nomCommercial,
      siret,
      villeRcs,
      numeroFormateur,
      prefectureRegion,
      representantNom,
      representantPrenom,
      representantFonction,
      adresse,
      codePostal,
      ville,
      email,
      telephone,
      siteWeb,
      logo,
      signature,
      cachet,
    } = body;

    let organization;

    if (user.organizationId) {
      // Mettre à jour l'organisation existante
      organization = await prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          name: name || undefined,
          nomCommercial: nomCommercial || null,
          siret: siret || null,
          villeRcs: villeRcs || null,
          numeroFormateur: numeroFormateur || null,
          prefectureRegion: prefectureRegion || null,
          representantNom: representantNom || null,
          representantPrenom: representantPrenom || null,
          representantFonction: representantFonction || null,
          adresse: adresse || null,
          codePostal: codePostal || null,
          ville: ville || null,
          email: email || null,
          telephone: telephone || null,
          siteWeb: siteWeb || null,
          logo: logo || null,
          signature: signature || null,
          cachet: cachet || null,
        },
      });
    } else {
      // Créer une nouvelle organisation
      const slug = name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || `org-${Date.now()}`;

      organization = await prisma.organization.create({
        data: {
          name: name || "Mon organisme",
          slug,
          nomCommercial: nomCommercial || null,
          siret: siret || null,
          villeRcs: villeRcs || null,
          numeroFormateur: numeroFormateur || null,
          prefectureRegion: prefectureRegion || null,
          representantNom: representantNom || null,
          representantPrenom: representantPrenom || null,
          representantFonction: representantFonction || null,
          adresse: adresse || null,
          codePostal: codePostal || null,
          ville: ville || null,
          email: email || null,
          telephone: telephone || null,
          siteWeb: siteWeb || null,
          logo: logo || null,
          signature: signature || null,
          cachet: cachet || null,
        },
      });

      // Associer l'organisation à l'utilisateur
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: organization.id },
      });
    }

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Erreur PUT organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour partielle de l'organisation (ex: toggle catalogue)
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    console.log("[PATCH organization] Body reçu:", body);
    console.log("[PATCH organization] Organization ID:", user.organizationId);

    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData: Record<string, unknown> = {};

    if (typeof body.catalogueActif === "boolean") {
      updateData.catalogueActif = body.catalogueActif;
    }

    if (typeof body.primaryColor === "string") {
      updateData.primaryColor = body.primaryColor;
    }

    // Nouveaux champs Qualiopi
    if (typeof body.certificatQualiopiUrl === "string" || body.certificatQualiopiUrl === null) {
      updateData.certificatQualiopiUrl = body.certificatQualiopiUrl;
    }

    if (typeof body.categorieQualiopi === "string" || body.categorieQualiopi === null) {
      updateData.categorieQualiopi = body.categorieQualiopi || null;
    }

    console.log("[PATCH organization] Update data:", updateData);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
    });

    console.log("[PATCH organization] Mise à jour réussie:", organization.catalogueActif);

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Erreur PATCH organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
