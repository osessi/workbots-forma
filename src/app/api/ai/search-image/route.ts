// ===========================================
// API ROUTE: RECHERCHE D'IMAGE POUR FORMATION
// Supporte: Unsplash, Pexels, Pixabay (gratuit)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Schema de validation de la requete
const RequestSchema = z.object({
  query: z.string().min(2, "La requete doit contenir au moins 2 caracteres"),
  count: z.number().min(1).max(10).default(6),
  provider: z.enum(["auto", "unsplash", "pexels", "pixabay"]).optional().default("auto"),
});

// Interface pour les images Unsplash
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

// Interface pour les images Pexels
interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string | null;
  photographer: string;
  photographer_url: string;
}

// Interface pour les images Pixabay
interface PixabayHit {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  previewURL: string;
  tags: string;
  user: string;
  userImageURL: string;
}

// Interface standard pour les images retournées
interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  credit: string;
  creditUrl: string;
  source: "unsplash" | "pexels" | "pixabay" | "picsum";
}

// ===========================================
// FONCTIONS DE RECHERCHE PAR PROVIDER
// ===========================================

async function searchUnsplash(query: string, count: number): Promise<ImageResult[] | null> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashKey) return null;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashKey}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.results.map((img: UnsplashImage) => ({
      id: img.id,
      url: img.urls.regular,
      thumbnail: img.urls.small,
      alt: img.alt_description || query,
      credit: img.user.name,
      creditUrl: img.user.links.html,
      source: "unsplash" as const,
    }));
  } catch {
    return null;
  }
}

async function searchPexels(query: string, count: number): Promise<ImageResult[] | null> {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey) return null;

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: pexelsKey,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.photos.map((photo: PexelsPhoto) => ({
      id: String(photo.id),
      url: photo.src.large,
      thumbnail: photo.src.medium,
      alt: photo.alt || query,
      credit: photo.photographer,
      creditUrl: photo.photographer_url,
      source: "pexels" as const,
    }));
  } catch {
    return null;
  }
}

async function searchPixabay(query: string, count: number): Promise<ImageResult[] | null> {
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (!pixabayKey) return null;

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(query)}&per_page=${count}&image_type=photo&orientation=horizontal&safesearch=true`,
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.hits.map((hit: PixabayHit) => ({
      id: String(hit.id),
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      alt: hit.tags,
      credit: hit.user,
      creditUrl: `https://pixabay.com/users/${hit.user}/`,
      source: "pixabay" as const,
    }));
  } catch {
    return null;
  }
}

function getFallbackImages(query: string, count: number): ImageResult[] {
  // Utiliser Picsum Photos (images aleatoires sans recherche)
  return Array.from({ length: count }, (_, i) => {
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

    const { query, count, provider } = validationResult.data;

    let images: ImageResult[] | null = null;
    let usedProvider: string = "picsum";

    // Recherche selon le provider demandé ou auto
    if (provider === "unsplash" || provider === "auto") {
      images = await searchUnsplash(query, count);
      if (images && images.length > 0) usedProvider = "unsplash";
    }

    if (!images && (provider === "pexels" || provider === "auto")) {
      images = await searchPexels(query, count);
      if (images && images.length > 0) usedProvider = "pexels";
    }

    if (!images && (provider === "pixabay" || provider === "auto")) {
      images = await searchPixabay(query, count);
      if (images && images.length > 0) usedProvider = "pixabay";
    }

    // Fallback vers Picsum si aucun provider n'a fonctionné
    if (!images || images.length === 0) {
      images = getFallbackImages(query, count);
      usedProvider = "picsum";
    }

    return NextResponse.json({
      success: true,
      data: { images },
      provider: usedProvider,
      note: usedProvider === "picsum"
        ? "Images génériques - configurez UNSPLASH_ACCESS_KEY, PEXELS_API_KEY ou PIXABAY_API_KEY pour des images spécifiques"
        : undefined,
    });
  } catch (error) {
    console.error("Erreur API search-image:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche d'images" },
      { status: 500 }
    );
  }
}
