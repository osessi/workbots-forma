// ===========================================
// API VEILLE - Tester un flux RSS
// Vérifie si un flux RSS est accessible et retourne des articles
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Headers HTTP réalistes pour éviter les blocages
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/rss+xml, application/xml, application/atom+xml, text/xml, text/html, */*",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
};

interface TestResult {
  success: boolean;
  url: string;
  status?: number;
  statusText?: string;
  contentType?: string;
  isRss: boolean;
  itemsFound: number;
  sampleItems: { title: string; link: string }[];
  error?: string;
  rawContentPreview?: string;
}

// Fonctions utilitaires pour parser le XML
function extractXmlValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractXmlAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*\/?>`, "i");
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

// POST - Tester un flux RSS
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
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    const result: TestResult = {
      success: false,
      url,
      isRss: false,
      itemsFound: 0,
      sampleItems: [],
    };

    try {
      // Récupérer le contenu
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000), // 15 secondes timeout
      });

      result.status = response.status;
      result.statusText = response.statusText;
      result.contentType = response.headers.get("content-type") || undefined;

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        return NextResponse.json(result);
      }

      const text = await response.text();
      result.rawContentPreview = text.slice(0, 500);

      // Détecter si c'est du RSS/Atom
      const isRss = text.includes("<rss") ||
                    text.includes("<feed") ||
                    text.includes("<channel") ||
                    text.includes("xmlns:atom");

      result.isRss = isRss;

      if (!isRss) {
        result.error = "Le contenu ne semble pas être un flux RSS/Atom valide";
        return NextResponse.json(result);
      }

      // Parser les items
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
      let items = [...text.matchAll(itemRegex), ...text.matchAll(entryRegex)];

      // Essayer RDF si aucun item
      if (items.length === 0) {
        const rdfItemRegex = /<rdf:item[^>]*>([\s\S]*?)<\/rdf:item>/gi;
        items = [...text.matchAll(rdfItemRegex)];
      }

      result.itemsFound = items.length;

      // Extraire quelques exemples
      for (const match of items.slice(0, 5)) {
        const itemContent = match[1];
        const title = extractXmlValue(itemContent, "title");

        let link = extractXmlValue(itemContent, "link");
        if (!link || link.trim() === "") {
          link = extractXmlAttr(itemContent, "link", "href");
        }
        if (!link || link.trim() === "") {
          const linkMatch = itemContent.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
          if (linkMatch) link = linkMatch[1];
        }
        if (!link || link.trim() === "") {
          link = extractXmlValue(itemContent, "guid");
        }

        if (title && link) {
          result.sampleItems.push({
            title: cleanHtml(title).slice(0, 100),
            link: link.trim(),
          });
        }
      }

      result.success = result.itemsFound > 0;

      if (result.itemsFound === 0) {
        result.error = "Aucun article trouvé dans le flux";
      }

    } catch (fetchError) {
      result.error = fetchError instanceof Error ? fetchError.message : "Erreur de connexion";
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur test flux RSS:", error);
    return NextResponse.json(
      { error: "Erreur lors du test" },
      { status: 500 }
    );
  }
}
