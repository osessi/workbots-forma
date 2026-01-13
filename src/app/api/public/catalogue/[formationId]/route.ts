// ===========================================
// API DÉTAIL FORMATION - GET /api/public/catalogue/[formationId]
// ===========================================
// Qualiopi Indicateur 1 : Information détaillée et vérifiable
// Retourne le détail complet d'une formation pour le catalogue public

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Désactive le cache - toujours récupérer les données fraîches

// Helper pour parser les tarifs (format "1500 € HT", "1 500 €", "1500" ou nombre)
function parseTarif(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Supprimer tous les espaces (normaux et insécables) et caractères non-numériques sauf , et .
    const cleanValue = value.replace(/[\s\u00A0]/g, '').replace(/[€HTTTC]/gi, '');
    const match = cleanValue.match(/(\d+(?:[.,]\d+)?)/);
    if (match) return parseFloat(match[1].replace(',', '.'));
  }
  return null;
}

// Helper pour parser la durée (format "21 heures (3 jours)" ou objet)
function parseDuree(value: unknown): { heures: number | null; jours: number | null } {
  if (!value) return { heures: null, jours: null };
  if (typeof value === 'number') return { heures: value, jours: Math.ceil(value / 7) };
  if (typeof value === 'string') {
    const heuresMatch = value.match(/(\d+)\s*h/i);
    const joursMatch = value.match(/(\d+)\s*j/i);
    return {
      heures: heuresMatch ? parseInt(heuresMatch[1]) : null,
      jours: joursMatch ? parseInt(joursMatch[1]) : null,
    };
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return {
      heures: obj.heures ? Number(obj.heures) : null,
      jours: obj.jours ? Number(obj.jours) : null,
    };
  }
  return { heures: null, jours: null };
}

// Helper pour convertir une URL Supabase en URL proxy
function proxySupabaseUrl(url: string | null): string | null {
  if (!url) return null;
  // Si c'est déjà une URL proxy ou une URL externe, ne pas modifier
  if (!url.includes('supabase')) return url;

  // Extraire le chemin depuis l'URL Supabase
  // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (match) {
    return `/api/public/files/${match[1]}`;
  }
  return url;
}

// Helper pour parser le contenu des modules (format texte multi-lignes ou array)
function parseContenuModules(value: unknown): Array<{ titre: string; items: string[] }> {
  if (!value) return [];

  // Si c'est un tableau d'objets
  if (Array.isArray(value)) {
    return value.map((m, idx) => ({
      titre: m.titre || `Module ${idx + 1}`,
      items: Array.isArray(m.contenu) ? m.contenu :
             Array.isArray(m.items) ? m.items :
             Array.isArray(m.sousModules) ? m.sousModules.map((s: { titre?: string }) => s.titre || '') : [],
    }));
  }

  // Si c'est une chaîne (format "Module 1 - Titre\n• item1\n• item2\n\nModule 2 - ...")
  if (typeof value === 'string') {
    const modules: Array<{ titre: string; items: string[] }> = [];
    const moduleBlocks = value.split(/\n\n+/);

    for (const block of moduleBlocks) {
      const lines = block.split('\n').filter(l => l.trim());
      if (lines.length === 0) continue;

      const titre = lines[0].replace(/^Module\s+\d+\s*[-:]\s*/i, '').trim();
      const items = lines.slice(1).map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);

      if (titre) {
        modules.push({ titre, items });
      }
    }
    return modules;
  }

  return [];
}

type RouteParams = {
  params: Promise<{ formationId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { formationId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const orgSlug = searchParams.get("org");

    if (!formationId) {
      return NextResponse.json(
        { error: "ID de formation requis" },
        { status: 400 }
      );
    }

    // Récupérer la formation avec toutes les informations Qualiopi
    const formation = await prisma.formation.findUnique({
      where: { id: formationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            nomCommercial: true,
            slug: true,
            logo: true,
            adresse: true,
            codePostal: true,
            ville: true,
            telephone: true,
            email: true,
            siteWeb: true,
            catalogueActif: true,
            certifications: true,
            numeroFormateur: true,
            siret: true,
            primaryColor: true,
            // Nouveaux champs Qualiopi
            certificatQualiopiUrl: true,
            categorieQualiopi: true,
          },
        },
        modules: {
          select: {
            id: true,
            titre: true,
            description: true,
            duree: true,
            ordre: true,
            contenu: true,
            isModuleZero: true, // Qualiopi IND 10
          },
          where: {
            isModuleZero: false, // Exclure Module 0 du catalogue public
          },
          orderBy: { ordre: "asc" },
        },
        indicateurs: {
          select: {
            tauxSatisfaction: true,
            nombreAvis: true,
            nombreStagiaires: true,
            tauxReussite: true,
            tauxCertification: true,
            annee: true,
            dernierCalcul: true,
            // Correction 363: Taux de progression (Qualiopi IND 2)
            tauxProgression: true,
            nombreApprenantsProgression: true,
          },
        },
        // Sessions à venir (pour afficher les dates disponibles)
        trainingSessions: {
          where: {
            status: { in: ["PLANIFIEE", "EN_COURS"] },
          },
          select: {
            id: true,
            reference: true,
            nom: true,
            modalite: true,
            tarifParDefautHT: true,
            journees: {
              select: {
                date: true,
                heureDebutMatin: true,
                heureFinAprem: true,
              },
              orderBy: { date: "asc" },
            },
            lieu: {
              select: {
                nom: true,
                ville: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 5, // Limiter à 5 prochaines sessions
        },
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la formation est publiée dans le catalogue
    if (!formation.estPublieCatalogue) {
      return NextResponse.json(
        { error: "Cette formation n'est pas disponible dans le catalogue" },
        { status: 403 }
      );
    }

    // Vérifier que le catalogue est activé pour l'organisation
    if (!formation.organization.catalogueActif) {
      return NextResponse.json(
        { error: "Le catalogue n'est pas disponible pour cette organisation" },
        { status: 403 }
      );
    }

    // Vérifier que l'organisation correspond (si spécifiée)
    if (orgSlug && formation.organization.slug !== orgSlug) {
      return NextResponse.json(
        { error: "Formation non trouvée dans cette organisation" },
        { status: 404 }
      );
    }

    // Calculer la durée totale depuis les modules
    const dureeTotaleMinutes = formation.modules.reduce(
      (acc, m) => acc + (m.duree || 0),
      0
    );
    const dureeTotaleHeures = Math.round(dureeTotaleMinutes / 60);

    // Extraire les données de la fiche pédagogique
    // Format attendu depuis le wizard de création:
    // {
    //   titre, description, objectifs: string[], prerequis, publicVise, typeFormation,
    //   duree: "21 heures (3 jours)", nombreParticipants,
    //   tarifEntreprise: "1500 € HT", tarifIndependant: "1200 € HT", tarifParticulier: "1000 € TTC",
    //   accessibilite, suiviEvaluation, ressourcesPedagogiques, contenu, delaiAcces, imageUrl
    //   + données contexte: dureeHeures, dureeJours, modalite, etc.
    // }

    let objectifsPedagogiques: string[] = [];
    let publicViseFromFiche: string | null = null;
    let prerequisFromFiche: string | null = null;
    let dureeHeuresFromFiche: number | null = null;
    let dureeJoursFromFiche: number | null = null;
    let tarifParticulier: number | null = null;
    let tarifEntreprise: number | null = null;
    let tarifIndependant: number | null = null;
    let suiviEvaluation: string | null = null;
    let ressourcesPedagogiques: string | null = null;
    let delaiAccesFromFiche: string | null = null;
    let accessibiliteFromFiche: string | null = null;
    let typeFormation: string | null = null;
    let nombreParticipants: string | null = null;
    let equipePedagogique: string | null = null;
    let contenuModulesParsed: Array<{ titre: string; items: string[] }> = [];

    if (formation.fichePedagogique) {
      const fiche = formation.fichePedagogique as Record<string, unknown>;

      // Debug: log la structure de la fiche pour comprendre le format
      console.log("=== Fiche Pédagogique ===", JSON.stringify(fiche, null, 2));

      // Objectifs pédagogiques (array de strings)
      if (Array.isArray(fiche.objectifs)) {
        objectifsPedagogiques = fiche.objectifs as string[];
      } else if (Array.isArray(fiche.objectifsPedagogiques)) {
        objectifsPedagogiques = fiche.objectifsPedagogiques as string[];
      }

      // Public visé
      if (fiche.publicVise) {
        publicViseFromFiche = fiche.publicVise as string;
      } else if (fiche.publicCible) {
        publicViseFromFiche = fiche.publicCible as string;
      }

      // Prérequis
      if (fiche.prerequis) {
        prerequisFromFiche = fiche.prerequis as string;
      }

      // Type de formation / Modalité
      if (fiche.typeFormation) {
        typeFormation = fiche.typeFormation as string;
      } else if (fiche.modalite) {
        typeFormation = fiche.modalite as string;
      }

      // Nombre de participants
      if (fiche.nombreParticipants) {
        nombreParticipants = String(fiche.nombreParticipants);
      }

      // Durée - Parser depuis le format "21 heures (3 jours)" ou données contexte
      const dureeParsed = parseDuree(fiche.duree);
      dureeHeuresFromFiche = dureeParsed.heures;
      dureeJoursFromFiche = dureeParsed.jours;

      // Fallback sur les champs directs du contexte
      if (!dureeHeuresFromFiche && fiche.dureeHeures) {
        dureeHeuresFromFiche = Number(fiche.dureeHeures);
      }
      if (!dureeJoursFromFiche && fiche.dureeJours) {
        dureeJoursFromFiche = Number(fiche.dureeJours);
      }

      // Tarifs - Parser depuis le format "1500 € HT" ou nombre direct
      tarifEntreprise = parseTarif(fiche.tarifEntreprise);
      tarifParticulier = parseTarif(fiche.tarifParticulier);
      tarifIndependant = parseTarif(fiche.tarifIndependant);

      // Suivi et évaluation
      if (fiche.suiviEvaluation) {
        suiviEvaluation = fiche.suiviEvaluation as string;
      }

      // Ressources pédagogiques
      if (fiche.ressourcesPedagogiques) {
        ressourcesPedagogiques = fiche.ressourcesPedagogiques as string;
      } else if (fiche.ressourcesTechniques) {
        ressourcesPedagogiques = fiche.ressourcesTechniques as string;
      }

      // Délai d'accès
      if (fiche.delaiAcces) {
        delaiAccesFromFiche = fiche.delaiAcces as string;
      }

      // Accessibilité
      if (fiche.accessibilite) {
        accessibiliteFromFiche = fiche.accessibilite as string;
      } else if (fiche.accessibiliteHandicap) {
        accessibiliteFromFiche = fiche.accessibiliteHandicap as string;
      }

      // Équipe pédagogique
      if (fiche.equipePedagogique) {
        equipePedagogique = fiche.equipePedagogique as string;
      }

      // Contenu des modules - Parser depuis le format texte ou array
      contenuModulesParsed = parseContenuModules(fiche.contenu);
    }

    // Formater le programme (modules) avec sous-modules/items
    const programme = formation.modules.map((module) => {
      // Extraire les items du contenu (format: { items: string[] })
      let items: string[] = [];
      if (module.contenu) {
        const contenu = module.contenu as Record<string, unknown>;
        if (Array.isArray(contenu.items)) {
          // Format du wizard: { items: ["item1", "item2", ...] }
          items = contenu.items as string[];
        } else if (Array.isArray(contenu.sousModules)) {
          items = (contenu.sousModules as Array<{ titre?: string }>).map(s => s.titre || '').filter(Boolean);
        } else if (Array.isArray(contenu.sections)) {
          items = (contenu.sections as Array<{ titre?: string }>).map(s => s.titre || '').filter(Boolean);
        }
      }

      return {
        id: module.id,
        titre: module.titre,
        description: module.description,
        dureeMinutes: module.duree,
        dureeHeures: module.duree ? Math.round(module.duree / 60 * 10) / 10 : null,
        ordre: module.ordre,
        items, // Les items détaillés du module
      };
    });

    // Si aucun module en BDD, utiliser ceux parsés depuis fichePedagogique.contenu
    const programmeModules = programme.length > 0 ? programme : contenuModulesParsed.map((m, idx) => ({
      id: `module-${idx + 1}`,
      titre: m.titre,
      description: null,
      dureeMinutes: null,
      dureeHeures: null,
      ordre: idx + 1,
      items: m.items,
    }));

    // Formater les sessions disponibles
    const sessionsDisponibles = formation.trainingSessions.map((session) => {
      const premiereJournee = session.journees[0];
      const derniereJournee = session.journees[session.journees.length - 1];

      return {
        id: session.id,
        reference: session.reference,
        nom: session.nom,
        modalite: session.modalite,
        tarif: session.tarifParDefautHT,
        lieu: session.lieu ? `${session.lieu.nom}, ${session.lieu.ville}` : null,
        dateDebut: premiereJournee?.date,
        dateFin: derniereJournee?.date,
        nombreJournees: session.journees.length,
      };
    });

    // Calculer la durée finale (priorité : fiche pédagogique > modules)
    const dureeFinaleHeures = dureeHeuresFromFiche || dureeTotaleHeures || 0;
    const dureeFinaleJours = dureeJoursFromFiche || (dureeFinaleHeures > 0 ? Math.ceil(dureeFinaleHeures / 7) : 0);

    // Construire la réponse complète avec toutes les informations Qualiopi
    const response = {
      // Informations de base
      id: formation.id,
      titre: formation.titre,
      description: formation.description,
      image: formation.image,

      // ===========================================
      // INFORMATIONS QUALIOPI OBLIGATOIRES (Indicateur 1)
      // ===========================================

      // Objectifs de la formation
      objectifsPedagogiques,

      // Public visé (priorité : fiche pédagogique > champ direct)
      publicVise: publicViseFromFiche || formation.publicVise,

      // Prérequis (priorité : fiche pédagogique > champ direct)
      prerequis: prerequisFromFiche || formation.prerequis,

      // Durée (avec données fiche pédagogique)
      duree: {
        totalMinutes: dureeHeuresFromFiche ? dureeHeuresFromFiche * 60 : dureeTotaleMinutes,
        totalHeures: dureeFinaleHeures,
        totalJours: dureeFinaleJours,
        nombreModules: formation.modules.length || contenuModulesParsed.length,
      },

      // Programme détaillé avec items
      programme: programmeModules,

      // Type de formation / Modalité
      typeFormation: typeFormation,

      // Nombre maximum de participants
      nombreParticipants: nombreParticipants,

      // Suivi et évaluation
      suiviEvaluation: suiviEvaluation,

      // Ressources techniques et pédagogiques
      ressourcesPedagogiques: ressourcesPedagogiques,

      // Équipe pédagogique
      equipePedagogique: equipePedagogique,

      // Accessibilité handicap (priorité : fiche > champ direct)
      accessibiliteHandicap: accessibiliteFromFiche || formation.accessibiliteHandicap,

      // Délai d'accès (priorité : fiche > champ direct)
      delaiAcces: delaiAccesFromFiche || formation.delaiAcces,

      // Tarifs (avec distinction Particulier/Entreprise/Indépendant)
      tarif: formation.tarifAffiche,
      tarifs: {
        particulier: tarifParticulier,
        entreprise: tarifEntreprise || formation.tarifAffiche,
        independant: tarifIndependant,
      },

      // ===========================================
      // CERTIFICATION (Indicateur 3)
      // ===========================================
      certification: formation.isCertifiante
        ? {
            isCertifiante: true,
            numeroFicheRS: formation.numeroFicheRS,
            lienFranceCompetences: formation.lienFranceCompetences,
          }
        : null,

      // ===========================================
      // CPF - ÉLIGIBILITÉ
      // ===========================================
      cpf: {
        estEligible: formation.estEligibleCPF,
        codeFinancement: formation.codeFinancementCPF,
      },

      // ===========================================
      // MODALITÉS (depuis fiche pédagogique en priorité, puis sessions)
      // Correction 391: Priorité à fichePedagogique.typeFormation pour synchronisation
      // ===========================================
      modalites: (() => {
        // Priorité 1: fichePedagogique.typeFormation ou fichePedagogique.modalite
        if (formation.fichePedagogique) {
          const fiche = formation.fichePedagogique as Record<string, unknown>;
          const modaliteValue = fiche.typeFormation || fiche.modalite;
          if (modaliteValue) {
            const mod = String(modaliteValue).toUpperCase();
            if (mod === "PRESENTIEL" || mod === "DISTANCIEL" || mod === "MIXTE") {
              return [mod];
            } else if (mod.includes("MIXTE") || mod.includes("HYBRID") || mod.includes("BLENDED")) {
              return ["MIXTE"];
            } else if (mod.includes("DISTANCE") || mod.includes("DISTANCIEL") || mod.includes("ELEARNING") || mod.includes("EN LIGNE")) {
              return ["DISTANCIEL"];
            } else if (mod.includes("PRESENT") || mod.includes("SALLE") || mod.includes("INTER") || mod.includes("INTRA")) {
              return ["PRESENTIEL"];
            }
          }
        }

        // Priorité 2: déduire des sessions si pas de modalité dans fiche
        const modalitesSet = new Set(formation.trainingSessions.map((s) => s.modalite));
        const hasPresen = modalitesSet.has("PRESENTIEL");
        const hasDistan = modalitesSet.has("DISTANCIEL");
        const hasMixte = modalitesSet.has("MIXTE");

        if (hasMixte || (hasPresen && hasDistan)) {
          return ["MIXTE"];
        }
        if (modalitesSet.size > 0) {
          return [...modalitesSet];
        }

        return [];
      })(),

      // ===========================================
      // INDICATEURS DE RÉSULTATS (Indicateur 2)
      // ===========================================
      indicateurs: formation.indicateurs
        ? {
            tauxSatisfaction: formation.indicateurs.tauxSatisfaction,
            nombreAvis: formation.indicateurs.nombreAvis,
            nombreStagiaires: formation.indicateurs.nombreStagiaires,
            tauxReussite: formation.indicateurs.tauxReussite,
            tauxCertification: formation.indicateurs.tauxCertification,
            annee: formation.indicateurs.annee,
            derniereMiseAJour: formation.indicateurs.dernierCalcul,
            // Correction 363: Taux de progression des apprenants (Qualiopi IND 2)
            tauxProgression: formation.indicateurs.tauxProgression,
            nombreApprenantsProgression: formation.indicateurs.nombreApprenantsProgression,
          }
        : null,

      // ===========================================
      // SESSIONS DISPONIBLES
      // ===========================================
      sessionsDisponibles,

      // ===========================================
      // ORGANISATION
      // ===========================================
      organization: {
        id: formation.organization.id,
        name: formation.organization.nomCommercial || formation.organization.name,
        slug: formation.organization.slug,
        logo: proxySupabaseUrl(formation.organization.logo),
        adresse: formation.organization.adresse,
        codePostal: formation.organization.codePostal,
        ville: formation.organization.ville,
        telephone: formation.organization.telephone,
        email: formation.organization.email,
        siteWeb: formation.organization.siteWeb,
        certifications: formation.organization.certifications,
        numeroFormateur: formation.organization.numeroFormateur,
        siret: formation.organization.siret,
        primaryColor: formation.organization.primaryColor,
        // Nouveaux champs Qualiopi - URLs proxifiées pour masquer Supabase
        certificatQualiopiUrl: proxySupabaseUrl(formation.organization.certificatQualiopiUrl),
        categorieQualiopi: formation.organization.categorieQualiopi,
      },

      // Metadata
      createdAt: formation.createdAt,
      updatedAt: formation.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur API détail formation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la formation" },
      { status: 500 }
    );
  }
}
