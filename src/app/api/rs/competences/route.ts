// ===========================================
// API ROUTE: RÉCUPÉRATION DES COMPÉTENCES RS
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// Cache des compétences RS pour éviter les requêtes répétées
const competencesCache: Map<string, { competences: RSCompetence[]; timestamp: number }> = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

interface RSCompetence {
  id: string;
  numero: number;
  intitule: string;
  description?: string;
}

interface RSFicheData {
  numeroRS: string;
  intitule: string;
  competences: RSCompetence[];
  nombreCompetences: number;
}

/**
 * Récupère les compétences RS depuis France Compétences
 * Note: France Compétences n'a pas d'API publique officielle
 * Cette fonction tente de scraper les données ou utilise un fallback avec des données simulées
 */
async function fetchRSCompetencesFromFranceCompetences(numeroRS: string): Promise<RSFicheData | null> {
  const cleanNumero = numeroRS.replace(/[^0-9]/g, '');

  try {
    // Tenter de récupérer les données depuis France Compétences
    const url = `https://www.francecompetences.fr/recherche/rs/RS${cleanNumero}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 86400 }, // Revalidate every 24 hours
    });

    if (!response.ok) {
      console.warn(`France Compétences returned ${response.status} for RS${cleanNumero}`);
      return null;
    }

    const html = await response.text();

    // Parser le HTML pour extraire les compétences
    const competences = parseCompetencesFromHTML(html, cleanNumero);

    if (competences.length > 0) {
      // Extraire le titre de la certification
      const titleMatch = html.match(/<h1[^>]*class="[^"]*certification-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
      const intitule = titleMatch
        ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
        : `Certification RS${cleanNumero}`;

      return {
        numeroRS: `RS${cleanNumero}`,
        intitule,
        competences,
        nombreCompetences: competences.length,
      };
    }

    return null;
  } catch (error) {
    console.error(`Erreur récupération RS${cleanNumero}:`, error);
    return null;
  }
}

/**
 * Parse le HTML de France Compétences pour extraire les compétences
 * Correction 367: Amélioration du parsing pour récupérer TOUTES les compétences
 */
function parseCompetencesFromHTML(html: string, numeroRS: string): RSCompetence[] {
  const competences: RSCompetence[] = [];

  // Chercher la section "Compétences attestées" dans le HTML
  // France Compétences utilise différents formats selon les fiches

  // Pattern pour trouver le bloc des compétences attestées
  const competencesBlockMatch = html.match(
    /Comp[ée]tences\s*attest[ée]es[\s\S]*?<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/i
  );

  if (competencesBlockMatch) {
    // Extraire les items de la liste
    const listItems = competencesBlockMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];

    listItems.forEach((item, index) => {
      const intitule = item
        .replace(/<[^>]+>/g, '') // Supprimer les balises HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&eacute;/g, 'é')
        .replace(/&egrave;/g, 'è')
        .replace(/&agrave;/g, 'à')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (intitule.length > 10 && !competences.some(c => c.intitule === intitule)) {
        competences.push({
          id: `RS${numeroRS}-C${competences.length + 1}`,
          numero: competences.length + 1,
          intitule,
        });
      }
    });
  }

  // Si aucune compétence trouvée, essayer d'autres patterns
  if (competences.length === 0) {
    const patterns = [
      // Pattern 1: Liste numérotée de compétences
      /<li[^>]*>\s*(?:C\d+|Compétence\s*\d+)[^<]*[:\-–]?\s*([^<]+)/gi,
      // Pattern 2: Div avec classe compétence
      /<div[^>]*class="[^"]*competence[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      // Pattern 3: Paragraphes dans section compétences
      /<p[^>]*>\s*(?:C\d+|BC\d+)[^<]*[:\-–]?\s*([^<]+)/gi,
      // Pattern 4: Tableau avec compétences
      /<td[^>]*>\s*(?:C\d+|Compétence)[^<]*<\/td>\s*<td[^>]*>([^<]+)/gi,
      // Pattern 5: Lignes de texte après "Compétences attestées"
      /Comp[ée]tences\s*attest[ée]es[\s\S]*?<p[^>]*>([^<]+)<\/p>/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const intitule = match[1]
          .replace(/<[^>]+>/g, '') // Supprimer les balises HTML
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#\d+;/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (intitule.length > 10 && !competences.some(c => c.intitule === intitule)) {
          competences.push({
            id: `RS${numeroRS}-C${competences.length + 1}`,
            numero: competences.length + 1,
            intitule,
          });
        }
      }
    }
  }

  return competences;
}

/**
 * Base de données locale des fiches RS courantes avec leurs compétences
 * Utilisée en fallback si le scraping échoue
 */
const RS_DATABASE: Record<string, RSFicheData> = {
  // Correction 367: Ajout RS6411 avec les 9 compétences exactes de France Compétences
  "6411": {
    numeroRS: "RS6411",
    intitule: "Maîtrisez l'Art des Coiffures de Prestige",
    nombreCompetences: 9,
    competences: [
      {
        id: "RS6411-C1",
        numero: 1,
        intitule: "Recueillir auprès de la cliente les informations nécessaires sur la coiffure événementielle souhaitée ainsi que sur le type d'évènement",
        description: "Analyse des besoins client, type d'événement, contraintes techniques",
      },
      {
        id: "RS6411-C2",
        numero: 2,
        intitule: "Sélectionner les produits et le matériel nécessaires à la coiffure événementielle choisie",
        description: "Choix des produits capillaires, outils et accessoires adaptés",
      },
      {
        id: "RS6411-C3",
        numero: 3,
        intitule: "Réaliser la coiffure événementielle en appliquant les techniques de coiffure spécifiques",
        description: "Mise en œuvre des techniques professionnelles de coiffure événementielle",
      },
      {
        id: "RS6411-C4",
        numero: 4,
        intitule: "Réaliser un chignon événementiel, de mariée ou sophistiqué",
        description: "Techniques de chignons élaborés pour événements et mariages",
      },
      {
        id: "RS6411-C5",
        numero: 5,
        intitule: "Procéder à une pose de bijou de tête ou d'un voile de mariée",
        description: "Intégration harmonieuse d'accessoires dans la coiffure",
      },
      {
        id: "RS6411-C6",
        numero: 6,
        intitule: "Réaliser une pose de rajouts ou d'extensions de cheveux à clip",
        description: "Techniques de pose d'extensions et rajouts temporaires",
      },
      {
        id: "RS6411-C7",
        numero: 7,
        intitule: "Réaliser un changement de coiffure au cours d'un événement",
        description: "Adaptation et transformation de la coiffure en cours d'événement",
      },
      {
        id: "RS6411-C8",
        numero: 8,
        intitule: "Évaluer le résultat de la coiffure événementielle",
        description: "Contrôle qualité et ajustements finaux de la coiffure",
      },
      {
        id: "RS6411-C9",
        numero: 9,
        intitule: "Développer sa présence sur les réseaux sociaux",
        description: "Communication digitale et promotion de son activité de coiffure événementielle",
      },
    ],
  },
  "6150": {
    numeroRS: "RS6150",
    intitule: "Marketing et communication digitale",
    nombreCompetences: 6,
    competences: [
      {
        id: "RS6150-C1",
        numero: 1,
        intitule: "Élaborer une stratégie digitale cohérente adaptée à son secteur d'activité",
        description: "Définir les objectifs marketing digitaux, analyser le marché et la concurrence, identifier les cibles et personas",
      },
      {
        id: "RS6150-C2",
        numero: 2,
        intitule: "Maîtriser les outils et techniques du webmarketing (SEO, SEA, réseaux sociaux, email marketing)",
        description: "Mettre en œuvre les leviers d'acquisition de trafic et de conversion",
      },
      {
        id: "RS6150-C3",
        numero: 3,
        intitule: "Créer et optimiser une présence en ligne performante",
        description: "Concevoir des sites web et landing pages optimisés pour la conversion",
      },
      {
        id: "RS6150-C4",
        numero: 4,
        intitule: "Analyser et mesurer la performance de ses campagnes digitales",
        description: "Utiliser les outils analytics, définir et suivre les KPIs pertinents",
      },
      {
        id: "RS6150-C5",
        numero: 5,
        intitule: "Développer un plan d'action personnalisé pour déployer ses projets digitaux",
        description: "Construire un plan marketing digital opérationnel et mesurable",
      },
      {
        id: "RS6150-C6",
        numero: 6,
        intitule: "Piloter et optimiser un budget publicitaire digital",
        description: "Gérer les investissements publicitaires et optimiser le ROI des campagnes",
      },
    ],
  },
  "6563": {
    numeroRS: "RS6563",
    intitule: "Certification en management d'équipe",
    nombreCompetences: 5,
    competences: [
      {
        id: "RS6563-C1",
        numero: 1,
        intitule: "Animer et motiver une équipe au quotidien",
        description: "Techniques de motivation, gestion des talents, développement de la cohésion",
      },
      {
        id: "RS6563-C2",
        numero: 2,
        intitule: "Communiquer efficacement avec ses collaborateurs",
        description: "Communication interpersonnelle, feedback, gestion des conflits",
      },
      {
        id: "RS6563-C3",
        numero: 3,
        intitule: "Organiser et piloter l'activité de son équipe",
        description: "Planification, délégation, suivi des objectifs",
      },
      {
        id: "RS6563-C4",
        numero: 4,
        intitule: "Accompagner le développement des compétences de ses collaborateurs",
        description: "Entretiens, formation, parcours de développement",
      },
      {
        id: "RS6563-C5",
        numero: 5,
        intitule: "Conduire le changement au sein de son équipe",
        description: "Accompagnement du changement, gestion des résistances",
      },
    ],
  },
  "5000": {
    numeroRS: "RS5000",
    intitule: "Certification bureautique avancée",
    nombreCompetences: 4,
    competences: [
      {
        id: "RS5000-C1",
        numero: 1,
        intitule: "Maîtriser les fonctions avancées des tableurs",
        description: "Formules complexes, tableaux croisés dynamiques, macros",
      },
      {
        id: "RS5000-C2",
        numero: 2,
        intitule: "Créer des présentations professionnelles impactantes",
        description: "Design, animations, storytelling visuel",
      },
      {
        id: "RS5000-C3",
        numero: 3,
        intitule: "Rédiger des documents structurés et professionnels",
        description: "Mise en forme avancée, styles, publipostage",
      },
      {
        id: "RS5000-C4",
        numero: 4,
        intitule: "Utiliser les outils collaboratifs en ligne",
        description: "Partage, co-édition, gestion des versions",
      },
    ],
  },
};

/**
 * Récupère les compétences RS (avec cache et fallback)
 */
async function getCompetencesRS(numeroRS: string): Promise<RSFicheData | null> {
  const cleanNumero = numeroRS.replace(/[^0-9]/g, '');
  const cacheKey = `RS${cleanNumero}`;

  // Vérifier le cache
  const cached = competencesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      numeroRS: cacheKey,
      intitule: RS_DATABASE[cleanNumero]?.intitule || `Certification RS${cleanNumero}`,
      competences: cached.competences,
      nombreCompetences: cached.competences.length,
    };
  }

  // Tenter de récupérer depuis France Compétences
  const fcData = await fetchRSCompetencesFromFranceCompetences(cleanNumero);
  if (fcData && fcData.competences.length > 0) {
    competencesCache.set(cacheKey, {
      competences: fcData.competences,
      timestamp: Date.now(),
    });
    return fcData;
  }

  // Fallback vers la base locale
  const localData = RS_DATABASE[cleanNumero];
  if (localData) {
    competencesCache.set(cacheKey, {
      competences: localData.competences,
      timestamp: Date.now(),
    });
    return localData;
  }

  // Si rien trouvé, générer des compétences génériques
  // (à améliorer avec une vraie API ou scraping plus robuste)
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Récupérer le numéro RS depuis les query params
    const { searchParams } = new URL(request.url);
    const numeroRS = searchParams.get('numero');

    if (!numeroRS) {
      return NextResponse.json(
        { error: "Le paramètre 'numero' est requis" },
        { status: 400 }
      );
    }

    // Récupérer les compétences
    const data = await getCompetencesRS(numeroRS);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: `Fiche RS${numeroRS.replace(/[^0-9]/g, '')} non trouvée`,
          suggestion: "Vérifiez le numéro de fiche RS ou uploadez le référentiel PDF pour extraire les compétences"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Erreur API RS competences:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
