// ===========================================
// API DOCUMENTS APPRENANT - GET /api/apprenant/documents
// ===========================================
// Corrections 457-460:
// - 457: Filtrer strictement par apprenant connecté (confidentialité)
// - 458: Corriger affichage métadonnées parasites
// - 459: Séparer documents administratifs vs supports de formation
// - 460: Supports disponibles uniquement au début de session

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Labels pour les types de documents - utilisés pour le nom ET la catégorie
const DOCUMENT_LABELS: Record<string, string> = {
  FICHE_PEDAGOGIQUE: "Fiche pédagogique",
  PROGRAMME_FORMATION: "Programme de formation",
  CONVENTION: "Convention de formation",
  CONTRAT_FORMATION: "Contrat de formation",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation de présence",
  ATTESTATION_FIN: "Attestation de fin de formation",
  REGLEMENT_INTERIEUR: "Règlement intérieur",
  CONDITIONS_GENERALES_VENTE: "Conditions générales de vente",
  CERTIFICAT: "Certificat",
  EVALUATION_CHAUD: "Évaluation à chaud",
  EVALUATION_FROID: "Évaluation à froid",
  FEUILLE_EMARGEMENT: "Feuille d'émargement",
  EVALUATION_INTERVENANT: "Évaluation intervenant",
  FACTURE: "Facture",
  DEVIS: "Devis",
  AUTRE: "Autre document",
  // Supports de formation
  SLIDES: "Support de présentation",
  SUPPORT_APPRENANT: "Support apprenant",
  RESSOURCE_PEDAGOGIQUE: "Ressource pédagogique",
};

// Types de documents par client (Convention pour entreprises/indépendants, Contrat pour particuliers)
const CLIENT_DOCUMENT_TYPES = ["CONVENTION", "CONTRAT_FORMATION"];
// Types de documents individuels par participant
const PARTICIPANT_DOCUMENT_TYPES = ["CONVOCATION", "ATTESTATION_PRESENCE", "ATTESTATION_FIN", "CERTIFICAT"];
// Types de documents globaux (dupliqués pour tous - feuilles émargement, règlements)
const GLOBAL_DOCUMENT_TYPES = ["FEUILLE_EMARGEMENT", "REGLEMENT_INTERIEUR", "CONDITIONS_GENERALES_VENTE"];

// Correction 459: Types de documents administratifs vs supports
const DOCUMENTS_ADMINISTRATIFS = [
  "CONVENTION", "CONTRAT_FORMATION", "CONVOCATION", "ATTESTATION_PRESENCE",
  "ATTESTATION_FIN", "CERTIFICAT", "FEUILLE_EMARGEMENT", "REGLEMENT_INTERIEUR",
  "CONDITIONS_GENERALES_VENTE", "FACTURE", "DEVIS", "EVALUATION_CHAUD",
  "EVALUATION_FROID",
];

// Correction: Types de documents exclus pour les apprenants (ne doivent pas voir)
const EXCLUDED_DOCUMENT_TYPES = [
  "EVALUATION_INTERVENANT", // Évaluation destinée aux intervenants, pas aux apprenants
];
const SUPPORTS_FORMATION = [
  "FICHE_PEDAGOGIQUE", "PROGRAMME_FORMATION", "SLIDES",
  "SUPPORT_APPRENANT", "RESSOURCE_PEDAGOGIQUE",
];

// Helper pour formater le nom de session
function formatSessionName(reference: string | null, sessionId: string, formationTitre: string): string {
  const ref = reference || sessionId.slice(0, 8).toUpperCase();
  return `${formationTitre} (${ref})`;
}

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

interface DocumentItem {
  id: string;
  nom: string;
  description: string | null;
  type: string;
  categorie: string;
  url: string;
  taille: number | null;
  createdAt: string;
  sessionRef?: string;
  isPersonalized?: boolean;
  // Correction 459: Catégorie globale (administratif vs support)
  categorieGlobale: "administratif" | "support";
  // Correction 460: Gestion disponibilité des supports
  isAvailable: boolean;
  dateDisponibilite?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    // Correction 430: Utiliser sessionId au lieu de inscriptionId
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer l'apprenant avec ses infos
    const apprenant = await prisma.apprenant.findFirst({
      where: { id: apprenantId, organizationId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        statut: true,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    const allDocuments: DocumentItem[] = [];

    // Correction 460: Calculer la date de début de session pour la disponibilité des supports
    let sessionStartDate: Date | null = null;
    const now = new Date();

    // 1. Documents de la formation (fiche pédagogique, programme, etc.)
    // Correction 430: Utiliser sessionId pour récupérer la formation
    try {
      let formationWithDocs = null;

      if (sessionId) {
        // Récupérer la formation via la session avec les journées pour la date de début
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: {
            formation: {
              include: {
                documents: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
            journees: {
              orderBy: { date: "asc" },
              take: 1,
              select: {
                date: true,
                heureDebutMatin: true,
              },
            },
          },
        });
        if (session) {
          formationWithDocs = session.formation;
          // Correction 460: Calculer la date de début de session
          if (session.journees && session.journees.length > 0) {
            const premiereJournee = session.journees[0];
            sessionStartDate = new Date(premiereJournee.date);
            const heureDebut = premiereJournee.heureDebutMatin || "09:00";
            const [h, m] = heureDebut.split(":").map(Number);
            sessionStartDate.setHours(h, m, 0, 0);
          }
        }
      } else {
        // Fallback: récupérer depuis l'inscription LMS
        const inscription = await prisma.lMSInscription.findFirst({
          where: { apprenantId },
          include: {
            formation: {
              include: {
                documents: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        });
        if (inscription) {
          formationWithDocs = inscription.formation;
        }
      }

      if (formationWithDocs) {
        formationWithDocs.documents.forEach((doc) => {
          if (doc.fileUrl) {
            // Correction 459: Déterminer la catégorie globale
            const isSupport = SUPPORTS_FORMATION.includes(doc.type);
            // Correction 460: Les supports ne sont disponibles qu'après le début de session
            const isAvailable = isSupport ? (sessionStartDate ? now >= sessionStartDate : true) : true;

            allDocuments.push({
              id: doc.id,
              nom: doc.titre,
              description: `Formation: ${formationWithDocs!.titre}`,
              type: doc.type,
              categorie: DOCUMENT_LABELS[doc.type] || "Document",
              url: doc.fileUrl,
              taille: doc.fileSize,
              createdAt: doc.createdAt.toISOString(),
              isPersonalized: false,
              categorieGlobale: isSupport ? "support" : "administratif",
              isAvailable,
              dateDisponibilite: isSupport && sessionStartDate ? sessionStartDate.toISOString() : null,
            });
          }
        });
      }
    } catch (err) {
      console.error("Erreur récupération documents formation:", err);
    }

    // 2. Documents de session (nouveau système) - Récupérer les participations
    // Correction 430: Filtrer par sessionId si fourni
    try {
      const sessionParticipations = await prisma.sessionParticipantNew.findMany({
        where: {
          apprenantId,
          client: {
            session: {
              organizationId,
              // Correction 430: Filtrer par sessionId
              ...(sessionId ? { id: sessionId } : {}),
            },
          },
        },
        include: {
          client: {
            select: {
              id: true,
              typeClient: true,
              session: {
                select: {
                  id: true,
                  reference: true,
                  formation: {
                    select: { titre: true },
                  },
                  documentsGeneres: {
                    select: {
                      id: true,
                      type: true,
                      titre: true,
                      clientId: true,
                      participantId: true,
                      fileUrl: true,
                      content: true,
                      createdAt: true,
                    },
                  },
                  journees: {
                    select: {
                      id: true,
                      date: true,
                      feuillesEmargement: {
                        select: {
                          id: true,
                          pdfUrl: true,
                          createdAt: true,
                        },
                      },
                    },
                    orderBy: { date: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      // Traiter chaque participation
      for (const participation of sessionParticipations) {
        const session = participation.client.session;
        const clientId = participation.client.id;
        const participantId = participation.id;
        const clientType = participation.client.typeClient;
        const sessionName = formatSessionName(session.reference, session.id, session.formation.titre);

        for (const doc of session.documentsGeneres) {
          // Correction: Exclure les types de documents non destinés aux apprenants
          if (EXCLUDED_DOCUMENT_TYPES.includes(doc.type)) {
            continue;
          }

          // Vérifier si ce document est pertinent pour cet apprenant
          let isRelevant = false;
          let isPersonalized = false;

          // Documents par client (Convention pour entreprises/indépendants, Contrat pour particuliers)
          if (CLIENT_DOCUMENT_TYPES.includes(doc.type)) {
            // Convention : pour SALARIE (via entreprise) ou INDEPENDANT
            if (doc.type === "CONVENTION" && (clientType === "SALARIE" || clientType === "INDEPENDANT")) {
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            }
            // Contrat : pour PARTICULIER
            if (doc.type === "CONTRAT_FORMATION" && clientType === "PARTICULIER") {
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            }
          }
          // Documents individuels par participant
          else if (PARTICIPANT_DOCUMENT_TYPES.includes(doc.type)) {
            isRelevant = doc.participantId === participantId;
            isPersonalized = true;
          }
          // Documents globaux (dupliqués pour tous les participants)
          else if (GLOBAL_DOCUMENT_TYPES.includes(doc.type)) {
            isRelevant = doc.participantId === null && doc.clientId === null;
            isPersonalized = false;
          }
          // Correction 457: Documents "AUTRE" - DOIVENT être filtrés par apprenant
          // Un document AUTRE appartient à l'apprenant s'il est lié à son participantId OU à son clientId
          // S'il n'est lié à personne, c'est un document global de session (visible par tous)
          else if (doc.type === "AUTRE") {
            if (doc.participantId) {
              // Document nominatif pour un participant spécifique
              isRelevant = doc.participantId === participantId;
              isPersonalized = true;
            } else if (doc.clientId) {
              // Document pour un client spécifique
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            } else {
              // Document global de session sans destinataire spécifique - visible par tous
              isRelevant = true;
              isPersonalized = false;
            }
          }
          // Supports de formation - visibles par tous les participants de la session
          else if (SUPPORTS_FORMATION.includes(doc.type)) {
            isRelevant = true;
            isPersonalized = false;
          }
          // Autres types non catégorisés - vérifier s'ils ont un destinataire
          else {
            if (doc.participantId) {
              isRelevant = doc.participantId === participantId;
              isPersonalized = true;
            } else if (doc.clientId) {
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            } else {
              // Document sans destinataire - visible par tous
              isRelevant = true;
              isPersonalized = false;
            }
          }

          // Vérifier que le document a du contenu (fileUrl OU content HTML)
          const content = doc.content as { html?: string } | null;
          const hasContent = doc.fileUrl || content?.html;

          if (isRelevant && hasContent) {
            // Éviter les doublons
            if (!allDocuments.some((d) => d.id === doc.id)) {
              // Utiliser l'URL du fichier si disponible, sinon générer l'URL vers l'API PDF
              const documentUrl = doc.fileUrl || `/api/session-documents/${doc.id}/pdf?token=${token}`;

              // Nom du document : utiliser le titre si type AUTRE, sinon le label du type
              let documentName: string;
              let categorie: string;

              if (doc.type === "AUTRE" && doc.titre) {
                // Pour type AUTRE, utiliser le titre comme nom (sans ajouter le nom de l'apprenant car déjà dans le titre)
                documentName = doc.titre;
                // Correction 458: Utiliser le type du document comme catégorie, pas le titre splitté
                categorie = DOCUMENT_LABELS[doc.type] || "Document";
              } else {
                const typeLabel = DOCUMENT_LABELS[doc.type] || "Document";
                documentName = isPersonalized
                  ? `${typeLabel} - ${apprenant.prenom} ${apprenant.nom}`
                  : typeLabel;
                categorie = typeLabel;
              }

              // Correction 459: Déterminer la catégorie globale
              const isSupport = SUPPORTS_FORMATION.includes(doc.type);
              // Correction 460: Les supports ne sont disponibles qu'après le début de session
              const docIsAvailable = isSupport ? (sessionStartDate ? now >= sessionStartDate : true) : true;

              allDocuments.push({
                id: doc.id,
                nom: documentName,
                description: sessionName,
                type: doc.type,
                categorie,
                url: documentUrl,
                taille: null,
                createdAt: doc.createdAt.toISOString(),
                sessionRef: session.reference || session.id,
                isPersonalized,
                categorieGlobale: isSupport ? "support" : "administratif",
                isAvailable: docIsAvailable,
                dateDisponibilite: isSupport && sessionStartDate ? sessionStartDate.toISOString() : null,
              });
            }
          }
        }

        // 3. Feuilles d'émargement (via journées)
        for (const journee of session.journees) {
          for (const feuille of journee.feuillesEmargement) {
            const dateStr = journee.date
              ? new Date(journee.date).toLocaleDateString("fr-FR")
              : "";

            // Éviter les doublons
            if (!allDocuments.some((d) => d.id === `feuille_${feuille.id}`)) {
              allDocuments.push({
                id: `feuille_${feuille.id}`,
                nom: `Feuille d'émargement${dateStr ? ` du ${dateStr}` : ""}`,
                description: sessionName,
                type: "FEUILLE_EMARGEMENT",
                categorie: DOCUMENT_LABELS.FEUILLE_EMARGEMENT,
                url: feuille.pdfUrl || `/api/emargement/${feuille.id}/pdf?token=${token}`,
                taille: null,
                createdAt: feuille.createdAt.toISOString(),
                sessionRef: session.reference || session.id,
                isPersonalized: false,
                categorieGlobale: "administratif",
                isAvailable: true,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Erreur récupération SessionParticipantNew:", err);
    }

    // 4. Documents de session (ancien système - DocumentSession) - Rétrocompatibilité
    // Correction 430: Filtrer par sessionId si fourni
    try {
      const oldSessionParticipations = await prisma.sessionParticipant.findMany({
        where: {
          apprenantId,
          client: {
            session: {
              organizationId,
              // Correction 430: Filtrer par sessionId
              ...(sessionId ? { id: sessionId } : {}),
            },
          },
        },
        include: {
          client: {
            select: {
              id: true,
              typeClient: true,
              session: {
                select: {
                  id: true,
                  formation: {
                    select: { titre: true },
                  },
                  documentsGeneres: {
                    select: {
                      id: true,
                      type: true,
                      clientId: true,
                      apprenantId: true,
                      fileUrl: true,
                      content: true,
                      createdAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const participation of oldSessionParticipations) {
        const session = participation.client.session;
        const clientId = participation.client.id;
        const clientType = participation.client.typeClient;
        const sessionName = formatSessionName(null, session.id, session.formation?.titre || "Formation");

        for (const doc of session.documentsGeneres) {
          // Correction: Exclure les types de documents non destinés aux apprenants
          if (EXCLUDED_DOCUMENT_TYPES.includes(doc.type)) {
            continue;
          }

          // Correction 457: Même logique de filtrage améliorée
          let isRelevant = false;
          let isPersonalized = false;

          if (CLIENT_DOCUMENT_TYPES.includes(doc.type)) {
            // Convention : pour SALARIE (via entreprise) ou INDEPENDANT
            if (doc.type === "CONVENTION" && (clientType === "SALARIE" || clientType === "INDEPENDANT")) {
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            }
            // Contrat : pour PARTICULIER
            if (doc.type === "CONTRAT_FORMATION" && clientType === "PARTICULIER") {
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            }
          } else if (PARTICIPANT_DOCUMENT_TYPES.includes(doc.type)) {
            isRelevant = doc.apprenantId === participation.id;
            isPersonalized = true;
          } else if (GLOBAL_DOCUMENT_TYPES.includes(doc.type)) {
            isRelevant = doc.apprenantId === null && doc.clientId === null;
            isPersonalized = false;
          }
          // Correction 457: Documents "AUTRE" - filtrer par apprenant
          else if (doc.type === "AUTRE") {
            if (doc.apprenantId) {
              isRelevant = doc.apprenantId === participation.id;
              isPersonalized = true;
            } else if (doc.clientId) {
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            } else {
              // Document global
              isRelevant = true;
              isPersonalized = false;
            }
          }
          // Supports de formation - visibles par tous
          else if (SUPPORTS_FORMATION.includes(doc.type)) {
            isRelevant = true;
            isPersonalized = false;
          }
          // Autres types - vérifier destinataire
          else {
            if (doc.apprenantId) {
              isRelevant = doc.apprenantId === participation.id;
              isPersonalized = true;
            } else if (doc.clientId) {
              isRelevant = doc.clientId === clientId;
              isPersonalized = true;
            } else {
              isRelevant = true;
              isPersonalized = false;
            }
          }

          // Vérifier que le document a du contenu (fileUrl OU content HTML)
          const content = doc.content as { html?: string } | null;
          const hasContent = doc.fileUrl || content?.html;

          if (isRelevant && hasContent) {
            if (!allDocuments.some((d) => d.id === doc.id)) {
              // Utiliser l'URL du fichier si disponible, sinon générer l'URL vers l'API PDF
              const documentUrl = doc.fileUrl || `/api/session-documents/${doc.id}/pdf?token=${token}`;

              // Nom du document basé sur le type
              const typeLabel = DOCUMENT_LABELS[doc.type] || "Document";
              const documentName = isPersonalized
                ? `${typeLabel} - ${apprenant.prenom} ${apprenant.nom}`
                : typeLabel;

              // Correction 459: Déterminer la catégorie globale
              const isSupport = SUPPORTS_FORMATION.includes(doc.type);
              // Correction 460: Les supports ne sont disponibles qu'après le début de session
              const docIsAvailable = isSupport ? (sessionStartDate ? now >= sessionStartDate : true) : true;

              allDocuments.push({
                id: doc.id,
                nom: documentName,
                description: sessionName,
                type: doc.type,
                categorie: typeLabel,
                url: documentUrl,
                taille: null,
                createdAt: doc.createdAt.toISOString(),
                sessionRef: session.id,
                isPersonalized,
                categorieGlobale: isSupport ? "support" : "administratif",
                isAvailable: docIsAvailable,
                dateDisponibilite: isSupport && sessionStartDate ? sessionStartDate.toISOString() : null,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Erreur récupération SessionParticipant (ancien):", err);
    }

    // Trier par date décroissante
    allDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Extraire les catégories uniques
    const categories = [...new Set(allDocuments.map((d) => d.categorie))].filter(Boolean);

    // Correction 459: Séparer par catégorie globale
    const documentsAdministratifs = allDocuments.filter(d => d.categorieGlobale === "administratif");
    const supportsFormation = allDocuments.filter(d => d.categorieGlobale === "support");

    return NextResponse.json({
      documents: allDocuments,
      documentsAdministratifs,
      supportsFormation,
      categories,
      total: allDocuments.length,
      // Correction 460: Date de disponibilité des supports
      sessionStartDate: sessionStartDate?.toISOString() || null,
    });
  } catch (error) {
    console.error("Erreur API documents apprenant:", error);
    // Log détaillé pour debug
    if (error instanceof Error) {
      console.error("Erreur détaillée:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}
