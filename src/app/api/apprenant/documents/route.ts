// ===========================================
// API DOCUMENTS APPRENANT - GET /api/apprenant/documents
// ===========================================
// Récupère les documents disponibles pour l'apprenant:
// - Documents de la formation (fiche pédagogique, programme, etc.)
// - Documents de session personnalisés (convention/contrat en son nom)
// - Documents de session globaux (feuilles émargement dupliquées)
// - Convocations individuelles
// - Attestations de formation

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
};

// Types de documents par client (Convention pour entreprises/indépendants, Contrat pour particuliers)
const CLIENT_DOCUMENT_TYPES = ["CONVENTION", "CONTRAT_FORMATION"];
// Types de documents individuels par participant
const PARTICIPANT_DOCUMENT_TYPES = ["CONVOCATION", "ATTESTATION_PRESENCE", "ATTESTATION_FIN", "CERTIFICAT"];
// Types de documents globaux (dupliqués pour tous)
const GLOBAL_DOCUMENT_TYPES = ["FEUILLE_EMARGEMENT", "REGLEMENT_INTERIEUR", "CONDITIONS_GENERALES_VENTE"];

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
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params
    const token = request.nextUrl.searchParams.get("token");
    const inscriptionId = request.nextUrl.searchParams.get("inscriptionId");

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

    // 1. Documents de la formation (fiche pédagogique, programme, etc.)
    try {
      const inscription = await prisma.lMSInscription.findFirst({
        where: inscriptionId
          ? { id: inscriptionId, apprenantId }
          : { apprenantId },
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
        inscription.formation.documents.forEach((doc) => {
          if (doc.fileUrl) {
            allDocuments.push({
              id: doc.id,
              nom: doc.titre,
              description: `Formation: ${inscription.formation.titre}`,
              type: doc.type,
              categorie: DOCUMENT_LABELS[doc.type] || "Document",
              url: doc.fileUrl,
              taille: doc.fileSize,
              createdAt: doc.createdAt.toISOString(),
              isPersonalized: false,
            });
          }
        });
      }
    } catch (err) {
      console.error("Erreur récupération documents formation:", err);
    }

    // 2. Documents de session (nouveau système) - Récupérer les participations
    try {
      const sessionParticipations = await prisma.sessionParticipantNew.findMany({
        where: {
          apprenantId,
          client: {
            session: {
              organizationId,
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
          // Autres documents sans restriction - visibles par tous les participants de la session
          else {
            isRelevant = true;
            isPersonalized = false;
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
                // Extraire la catégorie du titre (ex: "Évaluation intervenant - Formateur" -> "Évaluation intervenant")
                categorie = doc.titre.split(" - ")[0] || "Document";
              } else {
                const typeLabel = DOCUMENT_LABELS[doc.type] || "Document";
                documentName = isPersonalized
                  ? `${typeLabel} - ${apprenant.prenom} ${apprenant.nom}`
                  : typeLabel;
                categorie = typeLabel;
              }

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
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Erreur récupération SessionParticipantNew:", err);
    }

    // 4. Documents de session (ancien système - DocumentSession) - Rétrocompatibilité
    try {
      const oldSessionParticipations = await prisma.sessionParticipant.findMany({
        where: {
          apprenantId,
          client: {
            session: {
              organizationId,
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
          // Même logique de filtrage améliorée
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
          } else {
            // Autres documents - visibles par tous les participants de la session
            isRelevant = true;
            isPersonalized = false;
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

    return NextResponse.json({
      documents: allDocuments,
      categories,
      total: allDocuments.length,
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
