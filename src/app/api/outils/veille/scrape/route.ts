// ===========================================
// API VEILLE - Scraping automatique des sources
// Récupère les articles depuis les flux RSS et pages web
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
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

// Parser un flux RSS
async function parseRssFeed(url: string): Promise<ParsedArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "WorkbotsForma/1.0 (Formation professionnelle; veille réglementaire)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    // Parser le XML de manière simple (sans dépendance externe)
    const articles: ParsedArticle[] = [];

    // Trouver tous les items (RSS) ou entries (Atom)
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;

    const items = [...text.matchAll(itemRegex), ...text.matchAll(entryRegex)];

    for (const match of items.slice(0, 20)) { // Limiter à 20 articles
      const itemContent = match[1];

      // Extraire les champs
      const titre = extractXmlValue(itemContent, "title");
      const link = extractXmlValue(itemContent, "link") || extractXmlAttr(itemContent, "link", "href");
      const description = extractXmlValue(itemContent, "description") ||
        extractXmlValue(itemContent, "summary") ||
        extractXmlValue(itemContent, "content");
      const pubDate = extractXmlValue(itemContent, "pubDate") ||
        extractXmlValue(itemContent, "published") ||
        extractXmlValue(itemContent, "updated");
      const author = extractXmlValue(itemContent, "author") ||
        extractXmlValue(itemContent, "dc:creator");
      const image = extractXmlValue(itemContent, "media:content", "url") ||
        extractXmlValue(itemContent, "enclosure", "url");

      if (titre && link) {
        articles.push({
          titre: cleanHtml(titre),
          resume: cleanHtml(description || "").slice(0, 500),
          url: link,
          imageUrl: image || undefined,
          auteur: author ? cleanHtml(author) : undefined,
          datePublication: pubDate ? new Date(pubDate) : new Date(),
        });
      }
    }

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
      headers: {
        "User-Agent": "WorkbotsForma/1.0 (Formation professionnelle; veille réglementaire)",
        "Accept": "text/html",
      },
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

  const regex = new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
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
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
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
