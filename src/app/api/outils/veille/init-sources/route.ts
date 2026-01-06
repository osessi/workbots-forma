// ===========================================
// API VEILLE - Initialisation des sources RSS
// Réinitialise les sources avec des flux RSS fonctionnels
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { VeilleType } from "@prisma/client";

// Sources RSS TESTÉES ET FONCTIONNELLES - Janvier 2026
// Ces flux ont été vérifiés avec curl et retournent des articles
const DEFAULT_SOURCES: {
  type: VeilleType;
  nom: string;
  description: string;
  url: string;
  isRss: boolean;
}[] = [
  // === LÉGALE & RÉGLEMENTAIRE (IND 23) ===
  {
    type: "LEGALE",
    nom: "Le Monde - Économie",
    description: "Actualités économiques, emploi et droit du travail",
    url: "https://www.lemonde.fr/economie/rss_full.xml",
    isRss: true,
  },
  {
    type: "LEGALE",
    nom: "Le Figaro - Économie",
    description: "Actualités économiques et réglementaires",
    url: "https://www.lefigaro.fr/rss/figaro_economie.xml",
    isRss: true,
  },
  {
    type: "LEGALE",
    nom: "Le Monde - Politique",
    description: "Actualités politiques et législatives",
    url: "https://www.lemonde.fr/politique/rss_full.xml",
    isRss: true,
  },
  {
    type: "LEGALE",
    nom: "Les Echos - Économie",
    description: "Journal économique - Actualités réglementaires",
    url: "https://www.lesechos.fr/rss/rss_une.xml",
    isRss: true,
  },

  // === MÉTIERS & COMPÉTENCES (IND 24) ===
  {
    type: "METIER",
    nom: "Le Monde - Emploi",
    description: "Actualités emploi et marché du travail",
    url: "https://www.lemonde.fr/emploi/rss_full.xml",
    isRss: true,
  },
  {
    type: "METIER",
    nom: "Le Figaro - Emploi",
    description: "Actualités emploi et compétences",
    url: "https://www.lefigaro.fr/rss/figaro_emploi.xml",
    isRss: true,
  },
  {
    type: "METIER",
    nom: "Le Monde - Société",
    description: "Actualités société et métiers",
    url: "https://www.lemonde.fr/societe/rss_full.xml",
    isRss: true,
  },
  {
    type: "METIER",
    nom: "Ouest France - Économie",
    description: "Actualités économiques régionales",
    url: "https://www.ouest-france.fr/rss/economie",
    isRss: true,
  },

  // === INNOVATION PÉDAGOGIQUE (IND 24) ===
  {
    type: "INNOVATION",
    nom: "Le Monde - Éducation",
    description: "Actualités éducation et pédagogie",
    url: "https://www.lemonde.fr/education/rss_full.xml",
    isRss: true,
  },
  {
    type: "INNOVATION",
    nom: "Le Figaro - Étudiant",
    description: "Actualités formation et éducation",
    url: "https://www.lefigaro.fr/rss/figaro_etudiant.xml",
    isRss: true,
  },
  {
    type: "INNOVATION",
    nom: "Le Monde - Technologies",
    description: "Innovations technologiques et numériques",
    url: "https://www.lemonde.fr/pixels/rss_full.xml",
    isRss: true,
  },
  {
    type: "INNOVATION",
    nom: "01net - Tech",
    description: "Actualités tech et innovations",
    url: "https://www.01net.com/rss/info/flux-rss/flux-toutes-les-actualites/",
    isRss: true,
  },

  // === HANDICAP & ACCESSIBILITÉ (IND 25) ===
  {
    type: "HANDICAP",
    nom: "Le Monde - Santé",
    description: "Actualités santé et accessibilité",
    url: "https://www.lemonde.fr/sante/rss_full.xml",
    isRss: true,
  },
  {
    type: "HANDICAP",
    nom: "Le Figaro - Santé",
    description: "Actualités santé et handicap",
    url: "https://www.lefigaro.fr/rss/figaro_sante.xml",
    isRss: true,
  },
  {
    type: "HANDICAP",
    nom: "Faire Face - APF",
    description: "Magazine de l'APF France handicap",
    url: "https://www.faire-face.fr/feed/",
    isRss: true,
  },
  {
    type: "HANDICAP",
    nom: "Ouest France - Santé",
    description: "Actualités santé et accessibilité",
    url: "https://www.ouest-france.fr/rss/sante",
    isRss: true,
  },
];

// POST - Initialiser/réinitialiser les sources avec les flux par défaut
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

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "Super Admin requis" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { resetAll, type } = body;

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Filtrer les sources par type si spécifié
    const sourcesToCreate = type
      ? DEFAULT_SOURCES.filter(s => s.type === type)
      : DEFAULT_SOURCES;

    // Optionnel: supprimer toutes les sources globales avant de recréer
    if (resetAll) {
      await prisma.veilleSource.deleteMany({
        where: { organizationId: null },
      });
    }

    for (const sourceData of sourcesToCreate) {
      // Vérifier si la source existe déjà (par URL)
      const existing = await prisma.veilleSource.findFirst({
        where: {
          url: sourceData.url,
          organizationId: null,
        },
      });

      if (existing) {
        // Mettre à jour si resetAll
        if (resetAll) {
          await prisma.veilleSource.update({
            where: { id: existing.id },
            data: {
              ...sourceData,
              isActive: true,
              errorCount: 0,
              lastError: null,
            },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Créer la nouvelle source
        await prisma.veilleSource.create({
          data: {
            ...sourceData,
            organizationId: null, // Source globale
            refreshInterval: 1440, // 24h
            isActive: true,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      message: `Initialisation terminée: ${created} créées, ${updated} mises à jour, ${skipped} ignorées`,
      created,
      updated,
      skipped,
      total: sourcesToCreate.length,
    });
  } catch (error) {
    console.error("Erreur initialisation sources veille:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation des sources" },
      { status: 500 }
    );
  }
}

// GET - Lister les sources par défaut disponibles (pour prévisualisation)
export async function GET() {
  return NextResponse.json({
    sources: DEFAULT_SOURCES,
    counts: {
      LEGALE: DEFAULT_SOURCES.filter(s => s.type === "LEGALE").length,
      METIER: DEFAULT_SOURCES.filter(s => s.type === "METIER").length,
      INNOVATION: DEFAULT_SOURCES.filter(s => s.type === "INNOVATION").length,
      HANDICAP: DEFAULT_SOURCES.filter(s => s.type === "HANDICAP").length,
    },
  });
}
