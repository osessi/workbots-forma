// ===========================================
// API ROUTE: RECHERCHE D'IMAGE POUR FORMATION
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const RequestSchema = z.object({
  query: z.string().min(2, "La requete doit contenir au moins 2 caracteres"),
  count: z.number().min(1).max(10).default(6),
});

// Interface pour les images
interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    // Parser et valider la requete
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { query, count } = validationResult.data;

    // Verifier si la cle API Unsplash est configuree
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    if (unsplashKey) {
      // Utiliser l'API Unsplash
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche d'images Unsplash");
      }

      const data = await response.json();
      const images = data.results.map((img: UnsplashImage) => ({
        id: img.id,
        url: img.urls.regular,
        thumbnail: img.urls.small,
        alt: img.alt_description || query,
        credit: img.user.name,
        creditUrl: img.user.links.html,
        source: "unsplash" as const,
      }));

      return NextResponse.json({
        success: true,
        data: { images },
      });
    }

    // Fallback: utiliser Picsum Photos (images aleatoires sans recherche)
    // C'est une solution de repli gratuite qui ne necessite pas de cle API
    const images = Array.from({ length: count }, (_, i) => {
      const seed = `${query}-${i}-${Date.now()}`;
      return {
        id: `picsum-${i}`,
        url: `https://picsum.photos/seed/${seed}/800/450`,
        thumbnail: `https://picsum.photos/seed/${seed}/400/225`,
        alt: query,
        credit: "Lorem Picsum",
        creditUrl: "https://picsum.photos",
        source: "picsum" as const,
      };
    });

    return NextResponse.json({
      success: true,
      data: { images },
      note: "Images generiques - configurez UNSPLASH_ACCESS_KEY pour des images specifiques",
    });
  } catch (error) {
    console.error("Erreur API search-image:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche d'images" },
      { status: 500 }
    );
  }
}
