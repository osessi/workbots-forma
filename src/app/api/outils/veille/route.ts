// ===========================================
// API VEILLE - Liste des articles par type
// Qualiopi IND 23, 24, 25
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";
import { VeilleType } from "@prisma/client";

// GET - Récupérer les articles de veille
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as VeilleType | null;
    const status = searchParams.get("status"); // NON_LU, LU, IMPORTANT, ARCHIVE
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construire la requête
    const whereClause: Record<string, unknown> = {};

    if (type) {
      whereClause.type = type;
    }

    // Si on filtre par status IMPORTANT/ARCHIVE, utiliser une approche différente
    // pour récupérer directement les articles avec ce status
    if (status && status !== "NON_LU") {
      // Récupérer d'abord les IDs des articles avec le status demandé pour cette org
      const lecturesWithStatus = await prisma.veilleArticleLecture.findMany({
        where: {
          organizationId: user.organizationId,
          status: status as "LU" | "IMPORTANT" | "ARCHIVE",
        },
        select: {
          articleId: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        skip: offset,
      });

      const articleIds = lecturesWithStatus.map(l => l.articleId);

      // Récupérer les articles correspondants
      const articles = await prisma.veilleArticle.findMany({
        where: {
          id: { in: articleIds },
          ...(type ? { type } : {}),
        },
        include: {
          source: {
            select: {
              id: true,
              nom: true,
              logoUrl: true,
            },
          },
          lecturesParOrg: {
            where: {
              organizationId: user.organizationId,
            },
            select: {
              status: true,
              luAt: true,
              notes: true,
            },
          },
        },
        orderBy: {
          datePublication: "desc",
        },
      });

      // Formater la réponse
      const formattedArticles = articles.map(article => ({
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
        source: article.source,
        lecture: article.lecturesParOrg[0] || { status: "NON_LU" },
      }));

      // Compter le total pour pagination
      const total = await prisma.veilleArticleLecture.count({
        where: {
          organizationId: user.organizationId,
          status: status as "LU" | "IMPORTANT" | "ARCHIVE",
          ...(type ? { article: { type } } : {}),
        },
      });

      return NextResponse.json({
        articles: formattedArticles,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        counts: {}, // Counts will be populated by the main view
      });
    }

    // Récupérer les articles avec leur statut de lecture pour cette organisation
    const articles = await prisma.veilleArticle.findMany({
      where: whereClause,
      include: {
        source: {
          select: {
            id: true,
            nom: true,
            logoUrl: true,
          },
        },
        lecturesParOrg: {
          where: {
            organizationId: user.organizationId,
          },
          select: {
            status: true,
            luAt: true,
            notes: true,
          },
        },
      },
      orderBy: {
        datePublication: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Filtrer par statut NON_LU si demandé (les autres status sont gérés ci-dessus)
    let filteredArticles = articles;
    if (status === "NON_LU") {
      filteredArticles = articles.filter(article => {
        const lecture = article.lecturesParOrg[0];
        return !lecture || lecture.status === "NON_LU";
      });
    }

    // Formater la réponse
    const formattedArticles = filteredArticles.map(article => ({
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
      source: article.source,
      // Statut de lecture pour cette organisation
      lecture: article.lecturesParOrg[0] || { status: "NON_LU" },
    }));

    // Compter le total pour pagination
    const total = await prisma.veilleArticle.count({ where: whereClause });

    // Compter les non lus par type
    const allArticles = await prisma.veilleArticle.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        lecturesParOrg: {
          where: { organizationId: user.organizationId },
          select: { status: true },
        },
      },
    });

    const countsByType = {
      LEGALE: { total: 0, nonLus: 0 },
      METIER: { total: 0, nonLus: 0 },
      INNOVATION: { total: 0, nonLus: 0 },
      HANDICAP: { total: 0, nonLus: 0 },
    };

    allArticles.forEach(article => {
      countsByType[article.type].total++;
      const lecture = article.lecturesParOrg[0];
      if (!lecture || lecture.status === "NON_LU") {
        countsByType[article.type].nonLus++;
      }
    });

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      counts: countsByType,
    });
  } catch (error) {
    console.error("Erreur récupération veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la veille" },
      { status: 500 }
    );
  }
}

// POST - Marquer un article comme lu/important/archivé
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
    const { articleId, status, notes } = body;

    if (!articleId) {
      return NextResponse.json({ error: "articleId requis" }, { status: 400 });
    }

    // Vérifier que l'article existe
    const article = await prisma.veilleArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    // Créer ou mettre à jour le statut de lecture
    const lecture = await prisma.veilleArticleLecture.upsert({
      where: {
        articleId_organizationId: {
          articleId,
          organizationId: user.organizationId,
        },
      },
      update: {
        status: status || "LU",
        luAt: status === "LU" || !status ? new Date() : undefined,
        notes: notes !== undefined ? notes : undefined,
        userId: user.id,
      },
      create: {
        articleId,
        organizationId: user.organizationId,
        userId: user.id,
        status: status || "LU",
        luAt: new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json(lecture);
  } catch (error) {
    console.error("Erreur mise à jour lecture veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
