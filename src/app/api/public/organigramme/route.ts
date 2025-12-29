// ===========================================
// API ORGANIGRAMME PUBLIC (Qualiopi IND 9)
// ===========================================
// GET /api/public/organigramme?slug=xxx - Récupérer l'organigramme public d'une organisation
// Accessible sans authentification pour l'espace apprenant

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Récupérer l'organigramme public d'une organisation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const organizationId = searchParams.get("organizationId");

    if (!slug && !organizationId) {
      return NextResponse.json(
        { error: "Le slug ou l'ID de l'organisation est requis" },
        { status: 400 }
      );
    }

    // Trouver l'organisation
    const organization = await prisma.organization.findFirst({
      where: slug ? { slug } : { id: organizationId! },
      select: {
        id: true,
        name: true,
        nomCommercial: true,
        logo: true,
        representantNom: true,
        representantPrenom: true,
        representantFonction: true,
        email: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer uniquement les postes visibles publiquement
    const postes = await prisma.organigrammePoste.findMany({
      where: {
        organizationId: organization.id,
        isVisible: true,
      },
      select: {
        id: true,
        type: true,
        titre: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        photo: true,
        description: true,
        niveau: true,
        ordre: true,
        parentId: true,
      },
      orderBy: [{ niveau: "asc" }, { ordre: "asc" }],
    });

    // Construire la structure hiérarchique
    const posteMap = new Map<string, typeof postes[0] & { children: typeof postes }>();
    postes.forEach((p) => posteMap.set(p.id, { ...p, children: [] }));

    const rootPostes: (typeof postes[0] & { children: typeof postes })[] = [];
    postes.forEach((p) => {
      const poste = posteMap.get(p.id)!;
      if (p.parentId && posteMap.has(p.parentId)) {
        posteMap.get(p.parentId)!.children.push(poste);
      } else {
        rootPostes.push(poste);
      }
    });

    return NextResponse.json({
      organization: {
        name: organization.nomCommercial || organization.name,
        logo: organization.logo,
        adresse: organization.adresse,
        codePostal: organization.codePostal,
        ville: organization.ville,
      },
      postes: rootPostes,
      flatPostes: postes, // Version plate pour faciliter le rendu
    });
  } catch (error) {
    console.error("Erreur récupération organigramme public:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'organigramme" },
      { status: 500 }
    );
  }
}
