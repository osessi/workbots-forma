// ===========================================
// API VEILLE - Scraping automatique des sources
// Récupère les articles depuis les flux RSS et pages web
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";
import { VeilleType } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

// Interface pour les articles parsés
interface ParsedArticle {
  titre: string;
  resume: string;
  url: string;
  imageUrl?: string;
  auteur?: string;
  datePublication: Date;
  tags?: string[];
}

// Headers HTTP réalistes pour éviter les blocages
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/rss+xml, application/xml, application/atom+xml, text/xml, text/html, */*",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
};

// Parser un flux RSS
async function parseRssFeed(url: string): Promise<ParsedArticle[]> {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    // Parser le XML de manière simple (sans dépendance externe)
    const articles: ParsedArticle[] = [];

    // Trouver tous les items (RSS 2.0) ou entries (Atom)
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;

    let items = [...text.matchAll(itemRegex), ...text.matchAll(entryRegex)];

    // Si aucun item trouvé, essayer d'autres formats (RDF, RSS 1.0)
    if (items.length === 0) {
      const rdfItemRegex = /<rdf:item[^>]*>([\s\S]*?)<\/rdf:item>/gi;
      items = [...text.matchAll(rdfItemRegex)];
    }

    console.log(`RSS Parser: Trouvé ${items.length} items dans le flux`);

    for (const match of items.slice(0, 50)) { // Limiter à 50 articles les plus récents
      const itemContent = match[1];

      // Extraire les champs avec plusieurs fallbacks
      const titre = extractXmlValue(itemContent, "title");

      // Pour le lien, essayer plusieurs méthodes
      // Méthode 1: <link>URL</link> (RSS 2.0 classique)
      let link = extractXmlValue(itemContent, "link");

      // Méthode 2: <link href="URL" /> (Atom)
      if (!link || link.trim() === "") {
        link = extractXmlAttr(itemContent, "link", "href");
      }

      // Méthode 3: Regex plus flexible pour Atom
      if (!link || link.trim() === "") {
        const linkMatch = itemContent.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
        if (linkMatch) link = linkMatch[1];
      }

      // Méthode 4: guid comme fallback (souvent contient l'URL)
      if (!link || link.trim() === "") {
        const guid = extractXmlValue(itemContent, "guid");
        if (guid && (guid.startsWith("http://") || guid.startsWith("https://"))) {
          link = guid;
        }
      }

      // Méthode 5: Rechercher tout ce qui ressemble à une URL dans l'item
      if (!link || link.trim() === "") {
        const urlMatch = itemContent.match(/https?:\/\/[^\s<>"']+/i);
        if (urlMatch) link = urlMatch[0];
      }

      const description = extractXmlValue(itemContent, "description") ||
        extractXmlValue(itemContent, "summary") ||
        extractXmlValue(itemContent, "content") ||
        extractXmlValue(itemContent, "content:encoded");

      const pubDate = extractXmlValue(itemContent, "pubDate") ||
        extractXmlValue(itemContent, "published") ||
        extractXmlValue(itemContent, "updated") ||
        extractXmlValue(itemContent, "dc:date");

      const author = extractXmlValue(itemContent, "author") ||
        extractXmlValue(itemContent, "dc:creator") ||
        extractXmlAttr(itemContent, "author", "name");

      const image = extractXmlAttr(itemContent, "media:content", "url") ||
        extractXmlAttr(itemContent, "enclosure", "url") ||
        extractXmlAttr(itemContent, "media:thumbnail", "url");

      // Debug logging
      console.log(`RSS Item: titre="${titre?.slice(0, 50)}...", link="${link?.slice(0, 80)}..."`);

      if (titre && link) {
        // Valider et parser la date
        let datePubli = new Date();
        if (pubDate) {
          const parsedDate = new Date(pubDate);
          if (!isNaN(parsedDate.getTime())) {
            datePubli = parsedDate;
          }
        }

        articles.push({
          titre: cleanHtml(titre),
          resume: cleanHtml(description || "").slice(0, 500),
          url: link.trim(),
          imageUrl: image || undefined,
          auteur: author ? cleanHtml(author) : undefined,
          datePublication: datePubli,
        });
      } else {
        console.log(`RSS Item SKIPPED: titre=${!!titre}, link=${!!link}`);
      }
    }

    console.log(`RSS Parser: ${articles.length} articles extraits avec succès`);
    return articles;
  } catch (error) {
    console.error("Erreur parsing RSS:", error);
    throw error;
  }
}

// Scraper une page web avec sélecteur CSS (utilise l'IA pour extraire le contenu)
async function scrapeWebPage(url: string, selector?: string): Promise<ParsedArticle[]> {
  try {
    const response = await fetch(url, {
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Utiliser Claude pour extraire les articles de la page
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = `Tu es un extracteur d'articles de presse spécialisé dans la formation professionnelle et la réglementation Qualiopi.
Analyse le HTML fourni et extrait les articles présents sur la page.

Pour chaque article, retourne un objet JSON avec:
- titre: Le titre de l'article
- resume: Un résumé ou extrait (max 500 caractères)
- url: L'URL de l'article (complète si relative)
- datePublication: La date au format ISO (ou date du jour si non trouvée)
- auteur: L'auteur si disponible

Retourne un tableau JSON d'articles (max 10).
${selector ? `Focus sur les éléments correspondant au sélecteur CSS: ${selector}` : ""}

IMPORTANT: Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

    const response_ai = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `URL de base: ${url}\n\nHTML (tronqué à 50000 caractères):\n${html.slice(0, 50000)}`,
        },
      ],
    });

    const content = response_ai.content[0];
    if (content.type !== "text") {
      return [];
    }

    try {
      const articles = JSON.parse(content.text);
      return articles.map((a: Record<string, unknown>) => ({
        titre: String(a.titre || ""),
        resume: String(a.resume || "").slice(0, 500),
        url: String(a.url || ""),
        auteur: a.auteur ? String(a.auteur) : undefined,
        datePublication: a.datePublication ? new Date(String(a.datePublication)) : new Date(),
      }));
    } catch {
      console.error("Erreur parsing JSON de l'IA");
      return [];
    }
  } catch (error) {
    console.error("Erreur scraping web:", error);
    throw error;
  }
}

// Générer un résumé IA et les points clés
async function generateAISummary(
  article: { titre: string; resume: string; url: string },
  type: VeilleType
): Promise<{ resumeIA: string; pointsCles: string[]; impactQualiopi: string }> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const typeLabels = {
      LEGALE: "légale et réglementaire",
      METIER: "métiers et compétences",
      INNOVATION: "innovation pédagogique",
      HANDICAP: "handicap et accessibilité",
    };

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Tu es un expert en veille ${typeLabels[type]} pour les organismes de formation certifiés Qualiopi.
Analyse l'article suivant et fournis:
1. Un résumé concis en français (2-3 phrases)
2. 3 points clés à retenir
3. L'impact potentiel sur la conformité Qualiopi (1-2 phrases)

Retourne au format JSON:
{
  "resumeIA": "...",
  "pointsCles": ["...", "...", "..."],
  "impactQualiopi": "..."
}`,
      messages: [
        {
          role: "user",
          content: `Titre: ${article.titre}\n\nRésumé: ${article.resume}\n\nURL: ${article.url}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return { resumeIA: "", pointsCles: [], impactQualiopi: "" };
    }

    return JSON.parse(content.text);
  } catch (error) {
    console.error("Erreur génération résumé IA:", error);
    return { resumeIA: "", pointsCles: [], impactQualiopi: "" };
  }
}

// Fonctions utilitaires pour parser le XML
function extractXmlValue(xml: string, tag: string, attr?: string): string | null {
  if (attr) {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  // Support CDATA: <tag><![CDATA[content]]></tag> ou <tag>content</tag>
  // Les crochets doivent être doublement échappés dans RegExp avec template string
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const match = xml.match(regex);
  if (match) {
    let value = match[1].trim();
    // Nettoyer les restes de CDATA si présents
    value = value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
    return value || null;
  }
  return null;
}

function extractXmlAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*\/?>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// POST - Rafraîchir les sources (scraping)
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, type, forceRefresh } = body;

    // Construire la requête pour les sources à rafraîchir
    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    if (sourceId) {
      whereClause.id = sourceId;
    } else if (type) {
      whereClause.type = type;
    }

    // Ne pas rafraîchir si le dernier refresh est récent (sauf si forcé)
    if (!forceRefresh) {
      whereClause.OR = [
        { lastRefresh: null },
        {
          nextRefresh: {
            lte: new Date(),
          },
        },
      ];
    }

    // Récupérer les sources à rafraîchir (globales + celles de l'organisation)
    if (!user.isSuperAdmin && user.organizationId) {
      const orClause = whereClause.OR;
      whereClause.AND = [
        {
          OR: [
            { organizationId: null },
            { organizationId: user.organizationId },
          ],
        },
      ];
      if (orClause) {
        (whereClause.AND as Record<string, unknown>[]).push({ OR: orClause });
        delete whereClause.OR;
      }
    }

    const sources = await prisma.veilleSource.findMany({
      where: whereClause,
      take: 10, // Limiter pour éviter les timeouts
    });

    const results = {
      success: 0,
      failed: 0,
      articlesCreated: 0,
      errors: [] as string[],
    };

    for (const source of sources) {
      try {
        console.log(`Scraping source: ${source.nom} (${source.url})`);

        // Récupérer les articles
        let articles: ParsedArticle[];
        if (source.isRss) {
          articles = await parseRssFeed(source.url);
        } else {
          articles = await scrapeWebPage(source.url, source.scrapeSelector || undefined);
        }

        // Sauvegarder les nouveaux articles
        for (const article of articles) {
          try {
            // Vérifier si l'article existe déjà
            const existing = await prisma.veilleArticle.findFirst({
              where: {
                sourceId: source.id,
                url: article.url,
              },
            });

            if (!existing) {
              // Générer le résumé IA (en batch pour économiser les appels API)
              const aiData = await generateAISummary(article, source.type);

              await prisma.veilleArticle.create({
                data: {
                  sourceId: source.id,
                  type: source.type,
                  titre: article.titre,
                  resume: article.resume,
                  url: article.url,
                  imageUrl: article.imageUrl,
                  auteur: article.auteur,
                  datePublication: article.datePublication,
                  tags: article.tags || [],
                  resumeIA: aiData.resumeIA,
                  pointsCles: aiData.pointsCles,
                  impactQualiopi: aiData.impactQualiopi,
                },
              });

              results.articlesCreated++;
            }
          } catch (articleError) {
            console.error(`Erreur sauvegarde article: ${article.titre}`, articleError);
          }
        }

        // Mettre à jour la source
        await prisma.veilleSource.update({
          where: { id: source.id },
          data: {
            lastRefresh: new Date(),
            nextRefresh: new Date(Date.now() + source.refreshInterval * 60 * 1000),
            errorCount: 0,
            lastError: null,
          },
        });

        results.success++;
      } catch (sourceError) {
        console.error(`Erreur scraping source ${source.nom}:`, sourceError);

        // Incrémenter le compteur d'erreurs
        await prisma.veilleSource.update({
          where: { id: source.id },
          data: {
            errorCount: source.errorCount + 1,
            lastError: sourceError instanceof Error ? sourceError.message : "Erreur inconnue",
            // Désactiver si trop d'erreurs
            isActive: source.errorCount + 1 < 5,
          },
        });

        results.failed++;
        results.errors.push(`${source.nom}: ${sourceError instanceof Error ? sourceError.message : "Erreur"}`);
      }
    }

    return NextResponse.json({
      message: `Scraping terminé: ${results.success} sources OK, ${results.failed} échouées, ${results.articlesCreated} nouveaux articles`,
      ...results,
    });
  } catch (error) {
    console.error("Erreur scraping veille:", error);
    return NextResponse.json(
      { error: "Erreur lors du scraping" },
      { status: 500 }
    );
  }
}
