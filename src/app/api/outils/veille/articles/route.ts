// ===========================================
// API VEILLE ARTICLES - Ajout manuel d'articles
// Correction 409 : Ajouter un article manuellement
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";
import { VeilleType } from "@prisma/client";

// POST - Ajouter un article manuellement
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { titre, source: sourceName, url, type, datePublication } = body;

    // Validation
    if (!titre || typeof titre !== "string" || titre.trim().length === 0) {
      return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    }

    if (!sourceName || typeof sourceName !== "string" || sourceName.trim().length === 0) {
      return NextResponse.json({ error: "Source requise" }, { status: 400 });
    }

    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    // Valider l'URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    if (!type || !["LEGALE", "METIER", "INNOVATION", "HANDICAP"].includes(type)) {
      return NextResponse.json({ error: "Type de veille invalide" }, { status: 400 });
    }

    // Trouver ou créer la source "Manuel" pour cette organisation et ce type
    const manualSourceName = `Ajout manuel - ${sourceName.trim()}`;

    // Chercher une source existante avec ce nom pour cette organisation
    let veilleSource = await prisma.veilleSource.findFirst({
      where: {
        organizationId: user.organizationId,
        nom: manualSourceName,
        type: type as VeilleType,
      },
    });

    // Si pas trouvée, créer une nouvelle source
    if (!veilleSource) {
      veilleSource = await prisma.veilleSource.create({
        data: {
          organizationId: user.organizationId,
          type: type as VeilleType,
          nom: manualSourceName,
          description: `Articles ajoutés manuellement depuis ${sourceName.trim()}`,
          url: url, // On utilise l'URL de l'article comme URL de source
          isRss: false,
          isActive: true,
          refreshInterval: 0, // Pas de rafraîchissement automatique
        },
      });
    }

    // Vérifier si l'article n'existe pas déjà (même URL pour cette source)
    const existingArticle = await prisma.veilleArticle.findFirst({
      where: {
        sourceId: veilleSource.id,
        url: url.trim(),
      },
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: "Cet article existe déjà dans votre veille" },
        { status: 409 }
      );
    }

    // Créer l'article
    const article = await prisma.veilleArticle.create({
      data: {
        sourceId: veilleSource.id,
        type: type as VeilleType,
        titre: titre.trim(),
        url: url.trim(),
        datePublication: datePublication ? new Date(datePublication) : new Date(),
        resume: null,
        resumeIA: null,
        contenu: null,
        imageUrl: null,
        auteur: null,
        tags: [],
        pointsCles: [],
        impactQualiopi: null,
      },
      include: {
        source: {
          select: {
            id: true,
            nom: true,
            logoUrl: true,
          },
        },
      },
    });

    // Créer automatiquement une entrée de lecture "NON_LU" pour cette organisation
    await prisma.veilleArticleLecture.create({
      data: {
        articleId: article.id,
        organizationId: user.organizationId,
        userId: user.id,
        status: "NON_LU",
      },
    });

    // Formater la réponse
    const formattedArticle = {
      id: article.id,
      type: article.type,
      titre: article.titre,
      resume: article.resume,
      resumeIA: article.resumeIA,
      url: article.url,
      imageUrl: article.imageUrl,
      auteur: article.auteur,
      datePublication: article.datePublication,
      tags: article.tags,
      pointsCles: article.pointsCles,
      impactQualiopi: article.impactQualiopi,
      source: {
        id: article.source.id,
        nom: sourceName.trim(), // Afficher le nom de la source original (sans "Ajout manuel -")
        logoUrl: article.source.logoUrl,
      },
      lecture: { status: "NON_LU" },
    };

    return NextResponse.json(formattedArticle, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout article veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de l'article" },
      { status: 500 }
    );
  }
}
