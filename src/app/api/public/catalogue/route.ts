// ===========================================
// API CATALOGUE PUBLIC - GET /api/public/catalogue
// ===========================================
// Qualiopi Indicateur 1 : Information accessible au public
// Retourne les formations publiées dans le catalogue d'une organisation

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Types pour les filtres
interface FilterAggregation {
  modalites: { value: string; count: number; label: string }[];
  locations: { value: string; count: number }[];
  certifianteCount: { oui: number; non: number };
  eligibleCPFCount: { oui: number; non: number };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgSlug = searchParams.get("org");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Nouveaux filtres
    const modaliteFilter = searchParams.get("modalite"); // PRESENTIEL, DISTANCIEL, MIXTE
    const certifianteFilter = searchParams.get("certifiante"); // true, false
    const eligibleCPFFilter = searchParams.get("eligibleCPF"); // true, false
    const lieuFilter = searchParams.get("lieu"); // Ville

    // Le slug de l'organisation est obligatoire
    if (!orgSlug) {
      return NextResponse.json(
        { error: "Le paramètre 'org' est requis" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation avec le catalogue activé
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
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
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si le catalogue est activé
    if (!organization.catalogueActif) {
      return NextResponse.json(
        { error: "Le catalogue n'est pas disponible pour cette organisation" },
        { status: 403 }
      );
    }

    // Construire la requête de recherche de base
    // On accepte toutes les formations publiées au catalogue (pas de filtre sur status)
    const baseWhereClause: Record<string, unknown> = {
      organizationId: organization.id,
      estPublieCatalogue: true,
      isArchived: false,
    };

    // Clause where avec filtres
    const whereClause: Record<string, unknown> = { ...baseWhereClause };

    // Recherche textuelle
    if (search) {
      whereClause.OR = [
        { titre: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { publicVise: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtre formation certifiante
    if (certifianteFilter && certifianteFilter !== "all") {
      whereClause.isCertifiante = certifianteFilter === "true";
    }

    // Filtre éligible CPF
    if (eligibleCPFFilter && eligibleCPFFilter !== "all") {
      whereClause.estEligibleCPF = eligibleCPFFilter === "true";
    }

    // Note: Le filtre par modalité est appliqué APRÈS récupération pour inclure fichePedagogique
    // (Correction 393 - voir filtrage post-requête plus bas)

    // Filtre par lieu (via les sessions)
    if (lieuFilter) {
      whereClause.trainingSessions = {
        some: {
          status: { in: ["PLANIFIEE", "EN_COURS"] },
          lieu: {
            ville: { contains: lieuFilter, mode: "insensitive" },
          },
        },
      };
    }

    // Compter le total
    const total = await prisma.formation.count({ where: whereClause });

    // Récupérer les formations
    const formations = await prisma.formation.findMany({
      where: whereClause,
      select: {
        id: true,
        titre: true,
        description: true,
        image: true,
        status: true,
        // Qualiopi - Informations obligatoires
        publicVise: true,
        prerequis: true,
        accessibiliteHandicap: true,
        delaiAcces: true,
        modalitesEvaluation: true,
        tarifAffiche: true,
        // Certification
        isCertifiante: true,
        numeroFicheRS: true,
        lienFranceCompetences: true,
        // CPF - Nouveau
        estEligibleCPF: true,
        codeFinancementCPF: true,
        // Fiche pédagogique pour objectifs et durée
        fichePedagogique: true,
        // Indicateurs de résultats (Qualiopi Indicateur 2)
        indicateurs: {
          select: {
            tauxSatisfaction: true,
            nombreAvis: true,
            nombreStagiaires: true,
            tauxReussite: true,
            tauxCertification: true,
          },
        },
        // Modules pour calculer la durée totale
        modules: {
          select: {
            id: true,
            titre: true,
            duree: true,
            ordre: true,
          },
          orderBy: { ordre: "asc" },
        },
        // Sessions pour les modalités et lieux
        trainingSessions: {
          where: {
            status: { in: ["PLANIFIEE", "EN_COURS"] },
          },
          select: {
            id: true,
            modalite: true,
            lieu: {
              select: {
                ville: true,
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    // Formater les formations pour l'affichage
    const formattedFormations = formations.map((formation) => {
      // Calculer la durée totale depuis les modules
      const dureeTotaleMinutes = formation.modules.reduce(
        (acc, m) => acc + (m.duree || 0),
        0
      );
      let dureeTotaleHeures = Math.round(dureeTotaleMinutes / 60);
      let dureeTotaleJours = dureeTotaleHeures > 0 ? Math.ceil(dureeTotaleHeures / 7) : 0; // 7h par jour

      // Extraire les objectifs et durée depuis la fiche pédagogique
      let objectifs: string[] = [];
      let methodesModalites: string | null = null;
      let modaliteFromFiche: string | null = null;

      if (formation.fichePedagogique) {
        const fiche = formation.fichePedagogique as Record<string, unknown>;
        if (fiche.objectifsPedagogiques) {
          objectifs = fiche.objectifsPedagogiques as string[];
        }
        if (fiche.methodesModalites) {
          methodesModalites = fiche.methodesModalites as string;
        }

        // Correction 393: Extraire la modalité depuis typeFormation OU modalite
        const modaliteValue = fiche.typeFormation || fiche.modalite;
        if (modaliteValue) {
          const mod = String(modaliteValue).toUpperCase();
          if (mod === "PRESENTIEL" || mod === "DISTANCIEL" || mod === "MIXTE") {
            modaliteFromFiche = mod;
          } else if (mod.includes("MIXTE") || mod.includes("HYBRID") || mod.includes("BLENDED")) {
            modaliteFromFiche = "MIXTE";
          } else if (mod.includes("DISTANCE") || mod.includes("DISTANCIEL") || mod.includes("ELEARNING") || mod.includes("EN LIGNE")) {
            modaliteFromFiche = "DISTANCIEL";
          } else if (mod.includes("PRESENT") || mod.includes("SALLE") || mod.includes("INTER") || mod.includes("INTRA")) {
            modaliteFromFiche = "PRESENTIEL";
          }
        }

        // Si pas de durée depuis les modules, utiliser celle de la fiche pédagogique
        if (dureeTotaleHeures === 0) {
          // Essayer de parser la durée depuis le champ "duree" (format "21 heures (3 jours)" ou nombre)
          if (fiche.dureeHeures) {
            dureeTotaleHeures = Number(fiche.dureeHeures) || 0;
          } else if (fiche.duree) {
            const dureeStr = String(fiche.duree);
            const heuresMatch = dureeStr.match(/(\d+)\s*h/i);
            if (heuresMatch) {
              dureeTotaleHeures = parseInt(heuresMatch[1]);
            } else if (!isNaN(Number(dureeStr))) {
              dureeTotaleHeures = Number(dureeStr);
            }
          }

          if (fiche.dureeJours) {
            dureeTotaleJours = Number(fiche.dureeJours) || 0;
          } else if (dureeTotaleHeures > 0) {
            dureeTotaleJours = Math.ceil(dureeTotaleHeures / 7);
          }
        }
      }

      // Extraire les modalités uniques depuis les sessions
      // LOGIQUE: Si au moins une session est MIXTE, la formation est MIXTE
      // Si sessions en présentiel ET distanciel, c'est aussi MIXTE
      const modalitesSet = new Set<string>();
      const lieuxSet = new Set<string>();
      formation.trainingSessions.forEach((session) => {
        modalitesSet.add(session.modalite);
        if (session.lieu?.ville) {
          lieuxSet.add(session.lieu.ville);
        }
      });

      // Déterminer la modalité globale de la formation
      let modalites: string[] = [];
      const hasPresen = modalitesSet.has("PRESENTIEL");
      const hasDistan = modalitesSet.has("DISTANCIEL");
      const hasMixte = modalitesSet.has("MIXTE");

      if (hasMixte || (hasPresen && hasDistan)) {
        // Si une session est mixte OU si on a les deux modalités, c'est MIXTE
        modalites = ["MIXTE"];
      } else if (modalitesSet.size > 0) {
        modalites = Array.from(modalitesSet);
      } else if (modaliteFromFiche) {
        // Fallback sur la modalité de la fiche pédagogique si pas de sessions
        modalites = [modaliteFromFiche];
      }
      const lieux = Array.from(lieuxSet);

      return {
        id: formation.id,
        titre: formation.titre,
        description: formation.description,
        image: formation.image,
        // Qualiopi - Informations obligatoires
        objectifs,
        dureeHeures: dureeTotaleHeures,
        dureeJours: dureeTotaleJours,
        publicVise: formation.publicVise,
        prerequis: formation.prerequis,
        accessibiliteHandicap: formation.accessibiliteHandicap,
        delaiAcces: formation.delaiAcces,
        modalitesEvaluation: formation.modalitesEvaluation,
        methodesModalites,
        tarif: formation.tarifAffiche,
        // Certification (Indicateur 3)
        isCertifiante: formation.isCertifiante,
        numeroFicheRS: formation.numeroFicheRS,
        lienFranceCompetences: formation.lienFranceCompetences,
        // CPF (Nouveau)
        estEligibleCPF: formation.estEligibleCPF,
        codeFinancementCPF: formation.codeFinancementCPF,
        // Modalités et lieux (depuis les sessions)
        modalites,
        lieux,
        // Indicateurs (Indicateur 2)
        indicateurs: formation.indicateurs
          ? {
              tauxSatisfaction: formation.indicateurs.tauxSatisfaction,
              nombreAvis: formation.indicateurs.nombreAvis,
              nombreStagiaires: formation.indicateurs.nombreStagiaires,
              tauxReussite: formation.indicateurs.tauxReussite,
              tauxCertification: formation.indicateurs.tauxCertification,
            }
          : null,
        // Nombre de modules
        nombreModules: formation.modules.length,
      };
    });

    // Correction 393: Filtrage post-requête pour les modalités (inclut fichePedagogique)
    let filteredFormations = formattedFormations;
    if (modaliteFilter && modaliteFilter !== "all") {
      filteredFormations = formattedFormations.filter((f) => {
        // Vérifier si la modalité recherchée est dans les modalités de la formation
        return f.modalites.includes(modaliteFilter);
      });
    }

    // Calculer les agrégations pour les filtres
    const allFormationsForAggregations = await prisma.formation.findMany({
      where: baseWhereClause,
      select: {
        isCertifiante: true,
        estEligibleCPF: true,
        fichePedagogique: true, // Correction 393: inclure fichePedagogique pour les modalités
        trainingSessions: {
          where: {
            status: { in: ["PLANIFIEE", "EN_COURS"] },
          },
          select: {
            modalite: true,
            lieu: {
              select: {
                ville: true,
              },
            },
          },
        },
      },
    });

    // Calculer les compteurs pour les filtres
    const modalitesCount: Record<string, number> = {
      PRESENTIEL: 0,
      DISTANCIEL: 0,
      MIXTE: 0,
      E_LEARNING: 0,
      SITUATION_TRAVAIL: 0,
      STAGE: 0,
    };
    const locationsCount: Record<string, number> = {};
    let certifianteOui = 0;
    let certifianteNon = 0;
    let eligibleCPFOui = 0;
    let eligibleCPFNon = 0;

    // Helper pour extraire la modalité depuis fichePedagogique
    const getModaliteFromFiche = (fichePedagogique: unknown): string | null => {
      if (!fichePedagogique) return null;
      const fiche = fichePedagogique as Record<string, unknown>;
      const modaliteValue = fiche.typeFormation || fiche.modalite;
      if (!modaliteValue) return null;
      const mod = String(modaliteValue).toUpperCase();
      if (mod === "PRESENTIEL" || mod === "DISTANCIEL" || mod === "MIXTE") return mod;
      if (mod.includes("MIXTE") || mod.includes("HYBRID") || mod.includes("BLENDED")) return "MIXTE";
      if (mod.includes("DISTANCE") || mod.includes("DISTANCIEL") || mod.includes("ELEARNING") || mod.includes("EN LIGNE")) return "DISTANCIEL";
      if (mod.includes("PRESENT") || mod.includes("SALLE") || mod.includes("INTER") || mod.includes("INTRA")) return "PRESENTIEL";
      return null;
    };

    allFormationsForAggregations.forEach((f) => {
      // Compteurs certifiante
      if (f.isCertifiante) {
        certifianteOui++;
      } else {
        certifianteNon++;
      }

      // Compteurs CPF
      if (f.estEligibleCPF) {
        eligibleCPFOui++;
      } else {
        eligibleCPFNon++;
      }

      // Correction 393: Compteurs modalités (sessions + fichePedagogique)
      const modalitesVues = new Set<string>();

      // D'abord essayer depuis fichePedagogique (priorité)
      const modaliteFiche = getModaliteFromFiche(f.fichePedagogique);
      if (modaliteFiche) {
        modalitesVues.add(modaliteFiche);
        modalitesCount[modaliteFiche] = (modalitesCount[modaliteFiche] || 0) + 1;
      }

      // Si pas de modalité dans fiche, utiliser les sessions
      if (!modaliteFiche) {
        f.trainingSessions.forEach((s) => {
          if (!modalitesVues.has(s.modalite)) {
            modalitesVues.add(s.modalite);
            modalitesCount[s.modalite] = (modalitesCount[s.modalite] || 0) + 1;
          }
        });
      }

      // Compteurs lieux (toujours depuis les sessions)
      f.trainingSessions.forEach((s) => {
        if (s.lieu?.ville) {
          locationsCount[s.lieu.ville] =
            (locationsCount[s.lieu.ville] || 0) + 1;
        }
      });
    });

    const filterAggregations: FilterAggregation = {
      modalites: [
        { value: "PRESENTIEL", count: modalitesCount.PRESENTIEL, label: "Présentiel" },
        { value: "DISTANCIEL", count: modalitesCount.DISTANCIEL, label: "Distanciel" },
        { value: "MIXTE", count: modalitesCount.MIXTE, label: "Mixte" },
        { value: "E_LEARNING", count: modalitesCount.E_LEARNING, label: "E-learning" },
        { value: "SITUATION_TRAVAIL", count: modalitesCount.SITUATION_TRAVAIL, label: "Situation de travail" },
        { value: "STAGE", count: modalitesCount.STAGE, label: "Stage" },
      ].filter((m) => m.count > 0),
      locations: Object.entries(locationsCount)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
      certifianteCount: { oui: certifianteOui, non: certifianteNon },
      eligibleCPFCount: { oui: eligibleCPFOui, non: eligibleCPFNon },
    };

    // Correction 393: Utiliser filteredFormations au lieu de formattedFormations
    // et ajuster le total si filtrage par modalité
    const finalTotal = modaliteFilter && modaliteFilter !== "all"
      ? filteredFormations.length
      : total;

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.nomCommercial || organization.name,
        slug: organization.slug,
        logo: organization.logo,
        adresse: organization.adresse,
        codePostal: organization.codePostal,
        ville: organization.ville,
        telephone: organization.telephone,
        email: organization.email,
        siteWeb: organization.siteWeb,
        certifications: organization.certifications,
        numeroFormateur: organization.numeroFormateur,
        siret: organization.siret,
        primaryColor: organization.primaryColor,
        // Nouveaux champs Qualiopi
        certificatQualiopiUrl: organization.certificatQualiopiUrl,
        categorieQualiopi: organization.categorieQualiopi,
      },
      formations: filteredFormations,
      filterAggregations,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages: Math.ceil(finalTotal / limit),
        hasMore: skip + filteredFormations.length < finalTotal,
      },
    });
  } catch (error) {
    console.error("Erreur API catalogue public:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du catalogue" },
      { status: 500 }
    );
  }
}
