// ===========================================
// API GENERATION DE DOCUMENTS POUR SESSION
// ===========================================
// POST /api/documents/generate-session
// Génère tous les documents sélectionnés pour une session de formation

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { renderTemplate } from "@/lib/templates";
import { DocumentType, FileCategory } from "@prisma/client";
import { generatePDFFromHtml } from "@/lib/services/pdf-generator";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TEMPLATES } from "@/lib/templates/default-templates";

// Client Supabase admin pour le stockage
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Types pour les données de la requête
interface SessionClient {
  id: string;
  type: "ENTREPRISE" | "INDEPENDANT" | "PARTICULIER";
  entrepriseId?: string;
  entreprise?: {
    id: string;
    raisonSociale: string;
    siret: string | null;
    contactNom: string | null;
    contactPrenom: string | null;
    contactEmail: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
  };
  apprenantId?: string;
  apprenant?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    statut: string;
  };
  apprenants: Array<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
  }>;
}

interface SessionTarif {
  clientId: string;
  tarifHT: number;
  financeurId: string | null;
  montantFinance: number;
  resteACharge: number;
}

interface SessionJournee {
  id: string;
  date: string;
  horaireMatin: string;
  horaireApresMidi: string;
}

interface SessionLieu {
  modalite: "PRESENTIEL" | "DISTANCIEL" | "MIXTE";
  lieuId: string | null;
  lieu?: {
    id: string;
    nom: string;
    lieuFormation: string;
    codePostal: string | null;
    ville: string | null;
  };
  adresseLibre: string;
  lienConnexion: string;
  journees: SessionJournee[];
}

interface SessionFormateurs {
  formateurPrincipalId: string | null;
  formateurPrincipal?: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string | null;
    fonction: string | null;
    specialites: string[];
  };
  coformateursIds: string[];
  coformateurs: Array<{
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string | null;
  }>;
}

interface FormationInfo {
  id?: string;
  titre: string;
  tarifEntreprise: number;
  tarifIndependant: number;
  tarifParticulier: number;
  dureeHeures: number;
  dureeJours: number;
}

interface GenerateSessionRequest {
  formation: FormationInfo;
  clients: SessionClient[];
  tarifs: SessionTarif[];
  lieu: SessionLieu;
  formateurs: SessionFormateurs;
  selectedDocuments: string[];
  autoSaveToDrive?: boolean; // Option pour sauvegarder automatiquement dans le Drive
  targetId?: string; // ID spécifique du client/apprenant cible
}

interface GeneratedDocument {
  id: string;
  type: string;
  titre: string;
  clientId?: string;
  clientName?: string;
  apprenantId?: string;
  apprenantName?: string;
  entrepriseId?: string;
  renderedContent: string;
  savedToDrive?: boolean;
  fileId?: string;
}

// Mapper le type de document wizard vers DocumentType Prisma
function mapDocumentType(wizardType: string): DocumentType | null {
  const mapping: Record<string, DocumentType> = {
    convention: "CONVENTION",
    contrat: "CONTRAT_FORMATION",
    convocation: "CONVOCATION",
    attestation: "ATTESTATION_FIN",
    certificat_realisation: "CERTIFICAT",
    emargement: "FEUILLE_EMARGEMENT",
    facture: "FACTURE",
    evaluation_chaud: "EVALUATION_CHAUD",
    evaluation_froid: "EVALUATION_FROID",
    evaluation_entreprise: "EVALUATION_ENTREPRISE",
    evaluation_financeur: "EVALUATION_FINANCEUR",
    evaluation_intervenant: "EVALUATION_INTERVENANT",
    // Nouveaux types
    programme: "FICHE_PEDAGOGIQUE", // Utilise le template PROGRAMME_DE_FORMATION qui a documentType: FICHE_PEDAGOGIQUE
    reglement_interieur: "REGLEMENT_INTERIEUR",
    cgv: "CONDITIONS_GENERALES_VENTE",
    contrat_sous_traitance: "CONTRAT_SOUS_TRAITANCE",
  };
  return mapping[wizardType] || null;
}

// Mapper le type de document vers FileCategory
function mapToFileCategory(docType: string): FileCategory {
  const mapping: Record<string, FileCategory> = {
    convention: "DOCUMENT",
    contrat: "DOCUMENT",
    convocation: "DOCUMENT",
    attestation: "DOCUMENT",
    emargement: "DOCUMENT",
    facture: "DOCUMENT",
    certificat_realisation: "DOCUMENT",
    evaluation_chaud: "EVALUATION",
    evaluation_froid: "EVALUATION",
    evaluation_entreprise: "EVALUATION",
    evaluation_financeur: "EVALUATION",
    evaluation_intervenant: "EVALUATION",
    // Nouveaux types
    programme: "DOCUMENT",
    reglement_interieur: "DOCUMENT",
    cgv: "DOCUMENT",
    contrat_sous_traitance: "DOCUMENT",
  };
  return mapping[docType] || "DOCUMENT";
}

// Sauvegarder un document dans le Drive avec structure Formation > Entreprise > Apprenant
// Si copyToAllApprenants est true, le document sera copié dans tous les dossiers des apprenants concernés
async function saveDocumentToDrive(params: {
  organizationId: string;
  userId: string;
  formationId: string;
  formationTitre: string;
  documentType: string;
  titre: string;
  content: string;
  entrepriseId?: string;
  apprenantId?: string;
  // Nouveaux paramètres pour la duplication
  copyToAllApprenants?: boolean; // Copier dans tous les dossiers des apprenants de l'entreprise
  allApprenantIds?: string[]; // Liste des IDs des apprenants pour la duplication (pour documents session-wide)
}): Promise<{ success: boolean; fileId?: string; folderId?: string; fileIds?: string[] }> {
  try {
    const { organizationId, userId, formationId, formationTitre, documentType, titre, content, entrepriseId, apprenantId, copyToAllApprenants, allApprenantIds } = params;

    // S'assurer qu'un dossier racine existe pour la formation
    let formationFolder = await prisma.folder.findFirst({
      where: {
        formationId,
        organizationId,
        folderType: "formation",
      },
    });

    if (!formationFolder) {
      formationFolder = await prisma.folder.create({
        data: {
          name: formationTitre,
          color: "#4277FF",
          organizationId,
          formationId,
          folderType: "formation",
        },
      });
    }

    let targetFolderId = formationFolder.id;

    // Si entrepriseId est fourni, créer/trouver le sous-dossier entreprise
    if (entrepriseId) {
      const entreprise = await prisma.entreprise.findFirst({
        where: { id: entrepriseId, organizationId },
      });

      if (entreprise) {
        let entrepriseFolder = await prisma.folder.findFirst({
          where: {
            parentId: formationFolder.id,
            entrepriseId: entreprise.id,
            organizationId,
          },
        });

        if (!entrepriseFolder) {
          entrepriseFolder = await prisma.folder.create({
            data: {
              name: entreprise.raisonSociale,
              color: "#F59E0B",
              parentId: formationFolder.id,
              entrepriseId: entreprise.id,
              folderType: "entreprise",
              organizationId,
            },
          });
        }

        targetFolderId = entrepriseFolder.id;

        // Si apprenantId est aussi fourni, créer/trouver le sous-dossier apprenant
        if (apprenantId) {
          const apprenant = await prisma.apprenant.findFirst({
            where: { id: apprenantId, organizationId },
          });

          if (apprenant) {
            let apprenantFolder = await prisma.folder.findFirst({
              where: {
                parentId: entrepriseFolder.id,
                apprenantId: apprenant.id,
                organizationId,
              },
            });

            if (!apprenantFolder) {
              apprenantFolder = await prisma.folder.create({
                data: {
                  name: `${apprenant.prenom} ${apprenant.nom}`,
                  color: "#10B981",
                  parentId: entrepriseFolder.id,
                  apprenantId: apprenant.id,
                  folderType: "apprenant",
                  organizationId,
                },
              });
            }

            targetFolderId = apprenantFolder.id;
          }
        }
      }
    } else if (apprenantId) {
      // Apprenant sans entreprise (particulier/indépendant)
      const apprenant = await prisma.apprenant.findFirst({
        where: { id: apprenantId, organizationId },
      });

      if (apprenant) {
        let apprenantFolder = await prisma.folder.findFirst({
          where: {
            parentId: formationFolder.id,
            apprenantId: apprenant.id,
            organizationId,
          },
        });

        if (!apprenantFolder) {
          apprenantFolder = await prisma.folder.create({
            data: {
              name: `${apprenant.prenom} ${apprenant.nom}`,
              color: "#10B981",
              parentId: formationFolder.id,
              apprenantId: apprenant.id,
              folderType: "apprenant",
              organizationId,
            },
          });
        }

        targetFolderId = apprenantFolder.id;
      }
    }

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedTitre = titre.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/g, "").substring(0, 50);

    // Liste pour stocker les IDs des fichiers créés
    const createdFileIds: string[] = [];

    // Générer le PDF une seule fois pour ce document
    let pdfBuffer: Buffer;
    let mimeType: string;
    let fileExtension: string;

    try {
      pdfBuffer = await generatePDFFromHtml(content, titre);
      mimeType = "application/pdf";
      fileExtension = "pdf";
    } catch (pdfError) {
      console.error("Erreur génération PDF, fallback HTML:", pdfError);
      pdfBuffer = Buffer.from(content, "utf-8");
      mimeType = "text/html";
      fileExtension = "html";
    }

    const fileName = `${sanitizedTitre}_${timestamp}.${fileExtension}`;
    const supabaseAdmin = getSupabaseAdmin();

    // Fonction helper pour créer un fichier dans un dossier
    const createFileInFolder = async (folderId: string, fileNameSuffix?: string) => {
      const finalFileName = fileNameSuffix
        ? `${sanitizedTitre}_${fileNameSuffix}_${timestamp}.${fileExtension}`
        : fileName;
      const storagePath = `documents/${organizationId}/${formationId}/${finalFileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from("files")
        .upload(storagePath, pdfBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error("Erreur upload Supabase Storage:", uploadError);
      }

      // URL proxy pour accéder au fichier
      const proxyUrl = `/api/fichiers/${storagePath}`;

      const file = await prisma.file.create({
        data: {
          name: finalFileName,
          originalName: `${titre}.${fileExtension}`,
          mimeType: mimeType,
          size: pdfBuffer.length,
          category: mapToFileCategory(documentType),
          storagePath: storagePath,
          publicUrl: proxyUrl,
          organizationId,
          userId,
          formationId,
          folderId,
        },
      });

      // Sauvegarder le contenu HTML original pour édition future
      await prisma.fileContent.create({
        data: {
          fileId: file.id,
          content: content,
        },
      });

      createdFileIds.push(file.id);
      return file;
    };

    // Cas 1: Document session-wide (émargement) - copier dans tous les dossiers apprenants
    if (allApprenantIds && allApprenantIds.length > 0) {
      for (const apprId of allApprenantIds) {
        const apprenant = await prisma.apprenant.findFirst({
          where: { id: apprId, organizationId },
          include: { entreprise: true },
        });

        if (apprenant) {
          // Trouver ou créer le dossier apprenant
          let parentFolderId = formationFolder.id;

          // Si l'apprenant a une entreprise, créer d'abord le dossier entreprise
          if (apprenant.entrepriseId) {
            let entrepriseFolder = await prisma.folder.findFirst({
              where: {
                parentId: formationFolder.id,
                entrepriseId: apprenant.entrepriseId,
                organizationId,
              },
            });

            if (!entrepriseFolder) {
              entrepriseFolder = await prisma.folder.create({
                data: {
                  name: apprenant.entreprise?.raisonSociale || "Entreprise",
                  color: "#F59E0B",
                  parentId: formationFolder.id,
                  entrepriseId: apprenant.entrepriseId,
                  folderType: "entreprise",
                  organizationId,
                },
              });
            }
            parentFolderId = entrepriseFolder.id;
          }

          // Créer ou trouver le dossier apprenant
          let apprenantFolder = await prisma.folder.findFirst({
            where: {
              parentId: parentFolderId,
              apprenantId: apprenant.id,
              organizationId,
            },
          });

          if (!apprenantFolder) {
            apprenantFolder = await prisma.folder.create({
              data: {
                name: `${apprenant.prenom} ${apprenant.nom}`,
                color: "#10B981",
                parentId: parentFolderId,
                apprenantId: apprenant.id,
                folderType: "apprenant",
                organizationId,
              },
            });
          }

          // Créer le fichier dans ce dossier
          await createFileInFolder(apprenantFolder.id, apprenant.id.substring(0, 6));
        }
      }

      return { success: true, fileIds: createdFileIds };
    }

    // Cas 2: Document entreprise - copier dans les dossiers de tous les apprenants de l'entreprise
    if (copyToAllApprenants && entrepriseId) {
      // Récupérer tous les apprenants de cette entreprise dans cette session
      const apprenants = await prisma.apprenant.findMany({
        where: { entrepriseId, organizationId },
      });

      // Créer d'abord le fichier principal dans le dossier entreprise
      const mainFile = await createFileInFolder(targetFolderId);

      // Ensuite, copier dans chaque dossier apprenant
      for (const apprenant of apprenants) {
        let apprenantFolder = await prisma.folder.findFirst({
          where: {
            parentId: targetFolderId, // Le dossier entreprise
            apprenantId: apprenant.id,
            organizationId,
          },
        });

        if (!apprenantFolder) {
          apprenantFolder = await prisma.folder.create({
            data: {
              name: `${apprenant.prenom} ${apprenant.nom}`,
              color: "#10B981",
              parentId: targetFolderId,
              apprenantId: apprenant.id,
              folderType: "apprenant",
              organizationId,
            },
          });
        }

        await createFileInFolder(apprenantFolder.id, apprenant.id.substring(0, 6));
      }

      return { success: true, fileId: mainFile.id, folderId: targetFolderId, fileIds: createdFileIds };
    }

    // Cas 3: Comportement normal - un seul fichier
    const file = await createFileInFolder(targetFolderId);

    return { success: true, fileId: file.id, folderId: targetFolderId, fileIds: [file.id] };
  } catch (error) {
    console.error("Erreur sauvegarde document Drive:", error);
    return { success: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentification
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

    // Récupérer l'utilisateur et son organisation
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body: GenerateSessionRequest = await request.json();
    const { formation, clients, tarifs, lieu, formateurs, selectedDocuments, autoSaveToDrive = true, targetId } = body;

    if (!selectedDocuments || selectedDocuments.length === 0) {
      return NextResponse.json(
        { error: "Aucun document sélectionné" },
        { status: 400 }
      );
    }

    const generatedDocuments: GeneratedDocument[] = [];

    // Récupérer les données complètes de la formation depuis la base de données
    let formationComplete = null;
    let fichePeda: Record<string, unknown> | null = null;
    if (formation.id) {
      formationComplete = await prisma.formation.findUnique({
        where: { id: formation.id },
      });
      // Les données détaillées sont dans fichePedagogique (JSON)
      if (formationComplete?.fichePedagogique) {
        fichePeda = formationComplete.fichePedagogique as Record<string, unknown>;
      }
    }

    // Helper pour extraire les valeurs de la fiche pédagogique (support des différentes conventions de nommage)
    const getFicheValue = (keys: string[], defaultValue: string = ""): string => {
      if (!fichePeda) return defaultValue;
      for (const key of keys) {
        const value = fichePeda[key];
        if (value !== undefined && value !== null && value !== "") {
          // Si c'est un tableau, le joindre
          if (Array.isArray(value)) {
            return value.join("\n- ");
          }
          return String(value);
        }
      }
      return defaultValue;
    };

    // Générer le planning des journées au format texte
    const planningJournees = lieu.journees.map((j, index) => {
      const dateFormatted = formatDateFr(j.date);
      return `Jour ${index + 1} (${dateFormatted}) : Matin ${j.horaireMatin || "09:00 - 12:30"}, Après-midi ${j.horaireApresMidi || "14:00 - 17:30"}`;
    }).join("\n");

    // Construire le contexte de base commun à tous les documents
    const baseContext = {
      // ===========================================
      // FORMATION (formation_)
      // ===========================================
      formation: {
        id: formation.id || "",
        titre: formationComplete?.titre || formation.titre,
        modalite: lieu.modalite === "PRESENTIEL" ? "Présentiel" :
                  lieu.modalite === "DISTANCIEL" ? "Distanciel" : "Mixte",
        categorie_action: getFicheValue(["categorieAction", "categorie_action"], "Action de formation"),
        duree_heures: getFicheValue(["dureeHeures", "duree_heures", "nombreHeures"], String(formation.dureeHeures)),
        duree_jours: getFicheValue(["dureeJours", "duree_jours", "nombreJours"], String(formation.dureeJours)),
        duree_heures_jours: `${getFicheValue(["dureeHeures", "duree_heures"], String(formation.dureeHeures))} heures (${getFicheValue(["dureeJours", "duree_jours"], String(formation.dureeJours))} jours)`,
        nb_participants_max: getFicheValue(["nbParticipantsMax", "nb_participants_max", "nbParticipants"], "12"),
        description: formationComplete?.description || getFicheValue(["description"]),
        objectifs_pedagogiques: getFicheValue(["objectifsPedagogiques", "objectifs_pedagogiques", "objectifs"]),
        prerequis: formationComplete?.prerequis || getFicheValue(["prerequis", "preRequis"], "Aucun prérequis"),
        public_vise: getFicheValue(["publicVise", "public_vise", "publicCible", "public"]),
        contenu_detaille: getFicheValue(["contenuDetaille", "contenu_detaille", "contenu", "programmeDetaille"]),
        suivi_execution_evaluation: getFicheValue(["suiviExecutionEvaluation", "suivi_execution_evaluation", "suiviEvaluation"], "Feuilles de présence signées, QCM d'évaluation des acquis"),
        ressources_pedagogiques: getFicheValue(["ressourcesPedagogiques", "ressources_pedagogiques", "ressources", "moyensPedagogiques"], "Supports de cours, exercices pratiques"),
        accessibilite: getFicheValue(["accessibilite", "accessibiliteHandicap"], "Formation accessible aux personnes en situation de handicap"),
        delai_acces: getFicheValue(["delaiAcces", "delai_acces"], "14 jours ouvrables avant le début de la formation"),
        tarif_entreprise_ht_fiche_peda: `${formation.tarifEntreprise.toLocaleString("fr-FR")} € HT`,
        tarif_independant_ht_fiche_peda: `${formation.tarifIndependant.toLocaleString("fr-FR")} € HT`,
        tarif_particulier_ttc_fiche_peda: `${formation.tarifParticulier.toLocaleString("fr-FR")} € TTC`,
        // Legacy/compatibilité
        duree: `${formation.dureeHeures} heures (${formation.dureeJours} jours)`,
        prix: formation.tarifEntreprise,
        prix_format: `${formation.tarifEntreprise.toLocaleString("fr-FR")} € HT`,
        modalites: lieu.modalite === "PRESENTIEL" ? "Présentiel" :
                   lieu.modalite === "DISTANCIEL" ? "Distanciel" : "Mixte",
        lieu: lieu.lieu?.lieuFormation || lieu.adresseLibre || "",
        adresse: lieu.lieu?.lieuFormation || lieu.adresseLibre || "",
        code_postal: lieu.lieu?.codePostal || "",
        ville: lieu.lieu?.ville || "",
        lien_connexion: lieu.lienConnexion || "",
        date_debut: lieu.journees[0]?.date ? formatDateFr(lieu.journees[0].date) : "",
        date_fin: lieu.journees[lieu.journees.length - 1]?.date
                   ? formatDateFr(lieu.journees[lieu.journees.length - 1].date) : "",
      },

      // ===========================================
      // SESSION (session_)
      // ===========================================
      session: {
        modalite: lieu.modalite === "PRESENTIEL" ? "Présentiel" :
                  lieu.modalite === "DISTANCIEL" ? "Distanciel" : "Mixte",
        date_debut: lieu.journees[0]?.date ? formatDateFr(lieu.journees[0].date) : "",
        date_fin: lieu.journees[lieu.journees.length - 1]?.date
                   ? formatDateFr(lieu.journees[lieu.journees.length - 1].date) : "",
        planning_journees_formation: planningJournees,
        journees: lieu.journees.map((j, index) => ({
          numero: index + 1,
          date: formatDateFr(j.date),
          horaire_matin: j.horaireMatin || "09:00 - 12:30",
          horaire_apres_midi: j.horaireApresMidi || "14:00 - 17:30",
        })),
      },

      // ===========================================
      // LIEU (lieu_)
      // ===========================================
      lieu: {
        type: lieu.modalite === "PRESENTIEL" ? "PRESENTIEL" : "VISIOCONFERENCE",
        nom: lieu.lieu?.nom || "Lieu de formation",
        formation: lieu.lieu?.lieuFormation || lieu.adresseLibre || lieu.lienConnexion || "",
        code_postal: lieu.lieu?.codePostal || "",
        ville: lieu.lieu?.ville || "",
        informations_pratiques: lieu.lieu ? `${lieu.lieu.lieuFormation}${lieu.lieu.ville ? `, ${lieu.lieu.ville}` : ""}` : lieu.lienConnexion || "",
        capacite: 12,
      },

      // ===========================================
      // INTERVENANT (intervenant_)
      // ===========================================
      intervenant: {
        nom: formateurs.formateurPrincipal?.nom || "",
        prenom: formateurs.formateurPrincipal?.prenom || "",
        adresse: "",
        code_postal: "",
        ville: "",
        pays: "France",
        email: formateurs.formateurPrincipal?.email || "",
        telephone: formateurs.formateurPrincipal?.telephone || "",
        specialites: formateurs.formateurPrincipal?.specialites?.join(", ") || "",
        raison_sociale: "",
        siret: "",
        nda: "",
      },

      // Liste des intervenants pour les boucles
      intervenants: [
        ...(formateurs.formateurPrincipal ? [{
          id: formateurs.formateurPrincipal.id,
          nom: formateurs.formateurPrincipal.nom,
          prenom: formateurs.formateurPrincipal.prenom,
          email: formateurs.formateurPrincipal.email || "",
          specialites: formateurs.formateurPrincipal.specialites || [],
        }] : []),
        ...formateurs.coformateurs.map(cf => ({
          id: cf.id,
          nom: cf.nom,
          prenom: cf.prenom,
          email: cf.email || "",
          specialites: [],
        })),
      ],
      intervenant_equipe_pedagogique: formateurs.formateurPrincipal
        ? `${formateurs.formateurPrincipal.prenom} ${formateurs.formateurPrincipal.nom}${formateurs.formateurPrincipal.specialites?.length ? ` (${formateurs.formateurPrincipal.specialites.join(", ")})` : ""}`
        : "",

      // ===========================================
      // JOURNEES pour les boucles
      // ===========================================
      journees: lieu.journees.map((j, index) => ({
        numero: index + 1,
        date: formatDateFr(j.date),
        date_courte: formatDateCourteFr(j.date),
        horaires_matin: j.horaireMatin || "09:00 - 12:30",
        horaires_apres_midi: j.horaireApresMidi || "14:00 - 17:30",
        horaire_matin: j.horaireMatin || "09:00 - 12:30",
        horaire_apres_midi: j.horaireApresMidi || "14:00 - 17:30",
      })),

      // ===========================================
      // ORGANISME DE FORMATION (of_)
      // ===========================================
      of: {
        raison_sociale: user.organization?.name || "",
        nom_commercial: user.organization?.nomCommercial || "",
        siret: user.organization?.siret || "",
        ville_rcs: user.organization?.villeRcs || "",
        nda: user.organization?.numeroFormateur || "",
        region_enregistrement: user.organization?.prefectureRegion || "",
        adresse: user.organization?.adresse || "",
        code_postal: user.organization?.codePostal || "",
        ville: user.organization?.ville || "",
        pays: "France",
        representant_nom: user.organization?.representantNom || "",
        representant_prenom: user.organization?.representantPrenom || "",
        representant_fonction: user.organization?.representantFonction || "",
        email: user.organization?.email || "",
        telephone: user.organization?.telephone || "",
        site_web: user.organization?.siteWeb || "",
        signature_responsable: user.organization?.signature || "",
        cachet: user.organization?.cachet || "",
        logo_organisme: user.organization?.logo || "",
      },

      // ===========================================
      // DATES DU JOUR (date_)
      // ===========================================
      dates: {
        jour: String(new Date().getDate()).padStart(2, "0"),
        mois: getMonthName(new Date().getMonth()),
        annee: String(new Date().getFullYear()),
        complete_longue: formatDateCompleteFr(new Date()),
        complete_courte: formatDateCourteFr(new Date().toISOString().split("T")[0]),
        // Legacy
        date_complete: formatDateCompleteFr(new Date()),
        date_courte: formatDateCourteFr(new Date().toISOString().split("T")[0]),
      },

      // ===========================================
      // LEGACY - Ancien format pour compatibilité
      // ===========================================
      organisation: {
        nom: user.organization?.name || "",
        siret: user.organization?.siret || "",
        numero_da: user.organization?.numeroFormateur || "",
        adresse: user.organization?.adresse || "",
        code_postal: user.organization?.codePostal || "",
        ville: user.organization?.ville || "",
        telephone: user.organization?.telephone || "",
        email: user.organization?.email || "",
        logo: user.organization?.logo || "",
        representant: user.organization?.representantLegal || user.organization?.representantNom && user.organization?.representantPrenom
          ? `${user.organization.representantPrenom} ${user.organization.representantNom}`
          : "",
        prefecture_region: user.organization?.prefectureRegion || "",
      },
      formateur: {
        nom: formateurs.formateurPrincipal?.nom || "",
        prenom: formateurs.formateurPrincipal?.prenom || "",
        nom_complet: formateurs.formateurPrincipal
          ? `${formateurs.formateurPrincipal.prenom} ${formateurs.formateurPrincipal.nom}`
          : "",
        email: formateurs.formateurPrincipal?.email || "",
        telephone: formateurs.formateurPrincipal?.telephone || "",
        fonction: formateurs.formateurPrincipal?.fonction || "",
        specialites: formateurs.formateurPrincipal?.specialites?.join(", ") || "",
      },
      coformateurs: formateurs.coformateurs.map(cf => ({
        nom: cf.nom,
        prenom: cf.prenom,
        nom_complet: `${cf.prenom} ${cf.nom}`,
        email: cf.email || "",
        telephone: cf.telephone || "",
      })),
      signature: {
        responsable_organisme: user.organization?.signature || "",
      },
    };

    // Générer les documents pour chaque type sélectionné
    for (const docType of selectedDocuments) {
      const prismaDocType = mapDocumentType(docType);
      if (!prismaDocType) continue;

      // Trouver le template pour ce type de document (d'abord en base, puis par défaut)
      let template = await prisma.template.findFirst({
        where: {
          documentType: prismaDocType,
          isActive: true,
          OR: [
            { organizationId: user.organizationId },
            { isSystem: true },
          ],
        },
        orderBy: [
          { organizationId: "desc" },
          { createdAt: "desc" },
        ],
      });

      // Si pas de template en base, utiliser le template par défaut
      if (!template) {
        console.warn(`Aucun template en base pour ${docType}, utilisation du template par défaut`);

        // Chercher dans les templates par défaut
        const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.documentType === prismaDocType);
        if (!defaultTemplate) {
          console.warn(`Aucun template par défaut trouvé pour ${docType}`);
          continue;
        }

        // Créer un objet template factice compatible avec le type attendu
        template = {
          id: `default-${docType}`,
          name: defaultTemplate.name,
          description: defaultTemplate.description,
          documentType: prismaDocType,
          category: defaultTemplate.category as never,
          content: defaultTemplate.content as never,
          headerContent: defaultTemplate.headerContent || null,
          footerContent: defaultTemplate.footerContent || null,
          variables: defaultTemplate.variables || [],
          isActive: true,
          isSystem: true,
          organizationId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (!template) {
        console.warn(`Impossible de générer ${docType} - aucun template disponible`);
        continue;
      }

      // Selon le type de document, générer pour chaque entité concernée
      switch (docType) {
        case "convention":
          // Convention = une par entreprise (ou indépendant)
          // Filtrer par targetId si fourni
          const conventionClients = clients.filter(c =>
            (c.type === "ENTREPRISE" || c.type === "INDEPENDANT") &&
            (!targetId || c.id === targetId)
          );
          for (const client of conventionClients) {
            const tarif = tarifs.find(t => t.clientId === client.id);

            // Récupérer les données complètes de l'entreprise depuis la base de données
            let entrepriseComplete = null;
            if (client.entrepriseId) {
              entrepriseComplete = await prisma.entreprise.findUnique({
                where: { id: client.entrepriseId },
              });
            }

            // Construire la liste des apprenants avec leurs données complètes
            const apprenantsComplets = await Promise.all(
              client.apprenants.map(async (a) => {
                const apprenantDb = await prisma.apprenant.findUnique({
                  where: { id: a.id },
                });
                return {
                  nom: apprenantDb?.nom || a.nom,
                  prenom: apprenantDb?.prenom || a.prenom,
                  nom_complet: `${apprenantDb?.prenom || a.prenom} ${apprenantDb?.nom || a.nom}`,
                  email: apprenantDb?.email || a.email,
                  telephone: apprenantDb?.telephone || a.telephone || "",
                };
              })
            );

            const doc = await generateDocument(
              template,
              {
                ...baseContext,
                client: {
                  type: "entreprise",
                  type_label: "Entreprise",
                },
                // Format entreprise_ pour le nouveau système de variables
                entreprise: {
                  raison_sociale: entrepriseComplete?.raisonSociale || client.entreprise?.raisonSociale || "",
                  nom: entrepriseComplete?.raisonSociale || client.entreprise?.raisonSociale || "",
                  siret: entrepriseComplete?.siret || client.entreprise?.siret || "",
                  adresse: entrepriseComplete?.adresse || client.entreprise?.adresse || "",
                  code_postal: entrepriseComplete?.codePostal || client.entreprise?.codePostal || "",
                  ville: entrepriseComplete?.ville || client.entreprise?.ville || "",
                  pays: entrepriseComplete?.pays || "France",
                  adresse_complete: formatAdresse(
                    entrepriseComplete?.adresse || client.entreprise?.adresse,
                    entrepriseComplete?.codePostal || client.entreprise?.codePostal,
                    entrepriseComplete?.ville || client.entreprise?.ville
                  ),
                  representant_civilite: entrepriseComplete?.contactCivilite || "",
                  representant_nom: entrepriseComplete?.contactNom || client.entreprise?.contactNom || "",
                  representant_prenom: entrepriseComplete?.contactPrenom || client.entreprise?.contactPrenom || "",
                  representant_fonction: entrepriseComplete?.contactFonction || "",
                  representant: entrepriseComplete?.contactNom
                    ? `${entrepriseComplete.contactPrenom || ""} ${entrepriseComplete.contactNom}`.trim()
                    : client.entreprise?.contactNom
                      ? `${client.entreprise.contactPrenom || ""} ${client.entreprise.contactNom}`.trim()
                      : "",
                  email: entrepriseComplete?.contactEmail || client.entreprise?.contactEmail || "",
                  telephone: entrepriseComplete?.contactTelephone || "",
                  tva_intracom: entrepriseComplete?.tvaIntracom || "",
                  // Données calculées
                  nombre_apprenants: client.apprenants.length,
                  liste_apprenants: apprenantsComplets.map(a => `${a.prenom} ${a.nom}`).join(", "),
                },
                participants: apprenantsComplets,
                // Liste des apprenants pour les boucles {{#each apprenants}}
                apprenants: apprenantsComplets,
                apprenants_liste: apprenantsComplets.map(a => `${a.prenom} ${a.nom}`).join(", "),
                // Apprenant singulier (premier de la liste) pour les templates qui utilisent apprenant_*
                // Note: Pour les conventions entreprise, ce n'est normalement pas utilisé mais certains templates le référencent
                apprenant: apprenantsComplets.length > 0 ? {
                  nom: apprenantsComplets[0].nom,
                  prenom: apprenantsComplets[0].prenom,
                  statut: "SALARIE",
                  raison_sociale: "",
                  siret: "",
                  adresse: "",
                  code_postal: "",
                  ville: "",
                  pays: "France",
                  email: apprenantsComplets[0].email || "",
                  telephone: apprenantsComplets[0].telephone || "",
                } : undefined,
                // Ancien format tarif pour compatibilité
                tarif: {
                  ht: tarif?.tarifHT || 0,
                  ht_format: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € HT`,
                  financeur: tarif?.financeurId ? "Oui" : "Non",
                  montant_finance: tarif?.montantFinance || 0,
                  montant_finance_format: `${(tarif?.montantFinance || 0).toLocaleString("fr-FR")} €`,
                  reste_a_charge: tarif?.resteACharge || 0,
                  reste_a_charge_format: `${(tarif?.resteACharge || 0).toLocaleString("fr-FR")} €`,
                },
                // Nouveau format tarifs_ pour le système de variables
                tarifs: {
                  tarif_entreprise_ht_documents: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € HT`,
                  entreprise_montant_tva: `${((tarif?.tarifHT || 0) * 0.2).toLocaleString("fr-FR")} €`,
                  entreprise_prix_ttc: `${((tarif?.tarifHT || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                  entreprise_montant_financeur_ht: `${(tarif?.montantFinance || 0).toLocaleString("fr-FR")} € HT`,
                  entreprise_montant_financeur_ttc: `${((tarif?.montantFinance || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                  entreprise_reste_a_charge_ht: `${(tarif?.resteACharge || 0).toLocaleString("fr-FR")} € HT`,
                  entreprise_reste_a_charge_ttc: `${((tarif?.resteACharge || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                  entreprise_a_financeur: tarif?.financeurId ? true : false,
                },
                document: {
                  type: "convention",
                  titre: template.name,
                },
              },
              false
            );
            const docEntry: GeneratedDocument = {
              id: `convention-${client.id}`,
              type: "convention",
              titre: `Convention - ${client.entreprise?.raisonSociale}`,
              clientId: client.id,
              clientName: client.entreprise?.raisonSociale,
              entrepriseId: client.entrepriseId,
              renderedContent: doc,
            };

            // Auto-save to Drive if enabled - copier dans les dossiers de chaque apprenant de l'entreprise
            if (autoSaveToDrive && formation.id) {
              const saveResult = await saveDocumentToDrive({
                organizationId: user.organizationId!,
                userId: user.id,
                formationId: formation.id,
                formationTitre: formation.titre,
                documentType: "convention",
                titre: docEntry.titre,
                content: doc,
                entrepriseId: client.entrepriseId,
                copyToAllApprenants: true, // Copier dans tous les dossiers des apprenants de l'entreprise
              });
              docEntry.savedToDrive = saveResult.success;
              docEntry.fileId = saveResult.fileId;
            }

            generatedDocuments.push(docEntry);
          }
          break;

        case "contrat":
          // Contrat = un par particulier (les indépendants ont des conventions)
          // Filtrer par targetId si fourni
          const contratClients = clients.filter(c =>
            c.type === "PARTICULIER" &&
            (!targetId || c.id === targetId)
          );
          for (const client of contratClients) {
            const tarif = tarifs.find(t => t.clientId === client.id);
            const isParticulier = client.type === "PARTICULIER";

            // Récupérer les données complètes de l'apprenant depuis la base de données
            let apprenantComplet = null;
            if (client.apprenantId) {
              apprenantComplet = await prisma.apprenant.findUnique({
                where: { id: client.apprenantId },
              });
            }

            const doc = await generateDocument(
              template,
              {
                ...baseContext,
                client: {
                  type: client.type.toLowerCase(),
                  type_label: client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                },
                // Nouveau format apprenant_ (utilisé par les templates)
                apprenant: {
                  nom: apprenantComplet?.nom || client.apprenant?.nom || "",
                  prenom: apprenantComplet?.prenom || client.apprenant?.prenom || "",
                  statut: apprenantComplet?.statut || client.apprenant?.statut || "",
                  raison_sociale: apprenantComplet?.raisonSociale || "",
                  siret: apprenantComplet?.siret || "",
                  adresse: apprenantComplet?.adresse || "",
                  code_postal: apprenantComplet?.codePostal || "",
                  ville: apprenantComplet?.ville || "",
                  pays: apprenantComplet?.pays || "France",
                  email: apprenantComplet?.email || client.apprenant?.email || "",
                  telephone: apprenantComplet?.telephone || client.apprenant?.telephone || "",
                },
                // Ancien format particulier pour compatibilité
                particulier: {
                  nom: apprenantComplet?.nom || client.apprenant?.nom || "",
                  prenom: apprenantComplet?.prenom || client.apprenant?.prenom || "",
                  nom_complet: apprenantComplet
                    ? `${apprenantComplet.prenom} ${apprenantComplet.nom}`
                    : client.apprenant
                      ? `${client.apprenant.prenom} ${client.apprenant.nom}`
                      : "",
                  email: apprenantComplet?.email || client.apprenant?.email || "",
                  telephone: apprenantComplet?.telephone || client.apprenant?.telephone || "",
                  statut: apprenantComplet?.statut || client.apprenant?.statut || "",
                },
                participants: [{
                  nom: apprenantComplet?.nom || client.apprenant?.nom || "",
                  prenom: apprenantComplet?.prenom || client.apprenant?.prenom || "",
                  nom_complet: apprenantComplet
                    ? `${apprenantComplet.prenom} ${apprenantComplet.nom}`
                    : client.apprenant
                      ? `${client.apprenant.prenom} ${client.apprenant.nom}`
                      : "",
                  email: apprenantComplet?.email || client.apprenant?.email || "",
                  telephone: apprenantComplet?.telephone || client.apprenant?.telephone || "",
                }],
                // Ancien format tarif pour compatibilité
                tarif: {
                  ht: tarif?.tarifHT || 0,
                  ht_format: isParticulier
                    ? `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € TTC`
                    : `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € HT`,
                  financeur: tarif?.financeurId ? "Oui" : "Non",
                  montant_finance: tarif?.montantFinance || 0,
                  montant_finance_format: `${(tarif?.montantFinance || 0).toLocaleString("fr-FR")} €`,
                  reste_a_charge: tarif?.resteACharge || 0,
                  reste_a_charge_format: `${(tarif?.resteACharge || 0).toLocaleString("fr-FR")} €`,
                },
                // Nouveau format tarifs_ pour le système de variables
                tarifs: isParticulier ? {
                  particulier_prix_ttc: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € TTC`,
                } : {
                  tarif_independant_ht_documents: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € HT`,
                  independant_montant_tva: `${((tarif?.tarifHT || 0) * 0.2).toLocaleString("fr-FR")} €`,
                  independant_prix_ttc: `${((tarif?.tarifHT || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                  independant_montant_financeur_ht: `${(tarif?.montantFinance || 0).toLocaleString("fr-FR")} € HT`,
                  independant_montant_financeur_ttc: `${((tarif?.montantFinance || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                  independant_reste_a_charge_ht: `${(tarif?.resteACharge || 0).toLocaleString("fr-FR")} € HT`,
                  independant_reste_a_charge_ttc: `${((tarif?.resteACharge || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                  independant_a_financeur: tarif?.financeurId ? true : false,
                },
                document: {
                  type: "contrat",
                  titre: template.name,
                },
              },
              false
            );
            const clientName = client.apprenant
              ? `${client.apprenant.prenom} ${client.apprenant.nom}`
              : "Client";
            const docEntry: GeneratedDocument = {
              id: `contrat-${client.id}`,
              type: "contrat",
              titre: `Contrat - ${clientName}`,
              clientId: client.id,
              clientName,
              apprenantId: client.apprenantId,
              renderedContent: doc,
            };

            // Auto-save to Drive if enabled
            if (autoSaveToDrive && formation.id) {
              const saveResult = await saveDocumentToDrive({
                organizationId: user.organizationId!,
                userId: user.id,
                formationId: formation.id,
                formationTitre: formation.titre,
                documentType: "contrat",
                titre: docEntry.titre,
                content: doc,
                apprenantId: client.apprenantId,
              });
              docEntry.savedToDrive = saveResult.success;
              docEntry.fileId = saveResult.fileId;
            }

            generatedDocuments.push(docEntry);
          }
          break;

        case "convocation":
          // Convocation = une par apprenant
          // Filtrer par targetId si fourni (targetId est l'ID de l'apprenant)
          for (const client of clients) {
            const apprenantsFiltres = targetId
              ? client.apprenants.filter(a => a.id === targetId)
              : client.apprenants;
            for (const apprenant of apprenantsFiltres) {
              // Récupérer les données complètes de l'apprenant
              const apprenantDb = await prisma.apprenant.findUnique({
                where: { id: apprenant.id },
              });

              // Récupérer les données complètes de l'entreprise si présente
              let entrepriseDb = null;
              if (client.entrepriseId) {
                entrepriseDb = await prisma.entreprise.findUnique({
                  where: { id: client.entrepriseId },
                });
              }

              const doc = await generateDocument(
                template,
                {
                  ...baseContext,
                  client: {
                    type: client.type.toLowerCase(),
                    type_label: client.type === "ENTREPRISE" ? "Entreprise"
                               : client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                  },
                  // Nouveau format entreprise_ pour les templates
                  entreprise: entrepriseDb ? {
                    raison_sociale: entrepriseDb.raisonSociale,
                    nom: entrepriseDb.raisonSociale,
                    siret: entrepriseDb.siret || "",
                    adresse: entrepriseDb.adresse || "",
                    code_postal: entrepriseDb.codePostal || "",
                    ville: entrepriseDb.ville || "",
                    pays: entrepriseDb.pays || "France",
                  } : client.entreprise ? {
                    raison_sociale: client.entreprise.raisonSociale,
                    nom: client.entreprise.raisonSociale,
                    siret: client.entreprise.siret || "",
                  } : undefined,
                  // Ancien format participant pour compatibilité
                  participant: {
                    nom: apprenantDb?.nom || apprenant.nom,
                    prenom: apprenantDb?.prenom || apprenant.prenom,
                    nom_complet: `${apprenantDb?.prenom || apprenant.prenom} ${apprenantDb?.nom || apprenant.nom}`,
                    email: apprenantDb?.email || apprenant.email,
                    telephone: apprenantDb?.telephone || apprenant.telephone || "",
                  },
                  // Nouveau format apprenant_ pour les templates
                  apprenant: {
                    nom: apprenantDb?.nom || apprenant.nom,
                    prenom: apprenantDb?.prenom || apprenant.prenom,
                    statut: apprenantDb?.statut || "",
                    raison_sociale: apprenantDb?.raisonSociale || "",
                    siret: apprenantDb?.siret || "",
                    adresse: apprenantDb?.adresse || "",
                    code_postal: apprenantDb?.codePostal || "",
                    ville: apprenantDb?.ville || "",
                    pays: apprenantDb?.pays || "France",
                    email: apprenantDb?.email || apprenant.email,
                    telephone: apprenantDb?.telephone || apprenant.telephone || "",
                  },
                  document: {
                    type: "convocation",
                    titre: template.name,
                  },
                },
                false
              );
              const docEntry: GeneratedDocument = {
                id: `convocation-${apprenant.id}`,
                type: "convocation",
                titre: `Convocation - ${apprenant.prenom} ${apprenant.nom}`,
                clientId: client.id,
                apprenantId: apprenant.id,
                apprenantName: `${apprenant.prenom} ${apprenant.nom}`,
                entrepriseId: client.entrepriseId,
                renderedContent: doc,
              };

              // Auto-save to Drive if enabled
              if (autoSaveToDrive && formation.id) {
                const saveResult = await saveDocumentToDrive({
                  organizationId: user.organizationId!,
                  userId: user.id,
                  formationId: formation.id,
                  formationTitre: formation.titre,
                  documentType: "convocation",
                  titre: docEntry.titre,
                  content: doc,
                  entrepriseId: client.entrepriseId,
                  apprenantId: apprenant.id,
                });
                docEntry.savedToDrive = saveResult.success;
                docEntry.fileId = saveResult.fileId;
              }

              generatedDocuments.push(docEntry);
            }
          }
          break;

        case "attestation":
          // Attestation = une par apprenant
          // Filtrer par targetId si fourni (targetId est l'ID de l'apprenant)
          for (const client of clients) {
            const apprenantsFiltrésAttest = targetId
              ? client.apprenants.filter(a => a.id === targetId)
              : client.apprenants;
            for (const apprenant of apprenantsFiltrésAttest) {
              // Récupérer les données complètes de l'apprenant
              const apprenantDbAttest = await prisma.apprenant.findUnique({
                where: { id: apprenant.id },
              });

              // Récupérer les données complètes de l'entreprise si présente
              let entrepriseDbAttest = null;
              if (client.entrepriseId) {
                entrepriseDbAttest = await prisma.entreprise.findUnique({
                  where: { id: client.entrepriseId },
                });
              }

              const doc = await generateDocument(
                template,
                {
                  ...baseContext,
                  client: {
                    type: client.type.toLowerCase(),
                    type_label: client.type === "ENTREPRISE" ? "Entreprise"
                               : client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                  },
                  // Nouveau format entreprise_ pour les templates
                  entreprise: entrepriseDbAttest ? {
                    raison_sociale: entrepriseDbAttest.raisonSociale,
                    nom: entrepriseDbAttest.raisonSociale,
                    siret: entrepriseDbAttest.siret || "",
                    adresse: entrepriseDbAttest.adresse || "",
                    code_postal: entrepriseDbAttest.codePostal || "",
                    ville: entrepriseDbAttest.ville || "",
                    pays: entrepriseDbAttest.pays || "France",
                  } : client.entreprise ? {
                    raison_sociale: client.entreprise.raisonSociale,
                    nom: client.entreprise.raisonSociale,
                  } : undefined,
                  // Ancien format participant pour compatibilité
                  participant: {
                    nom: apprenantDbAttest?.nom || apprenant.nom,
                    prenom: apprenantDbAttest?.prenom || apprenant.prenom,
                    nom_complet: `${apprenantDbAttest?.prenom || apprenant.prenom} ${apprenantDbAttest?.nom || apprenant.nom}`,
                    email: apprenantDbAttest?.email || apprenant.email,
                  },
                  // Nouveau format apprenant_ pour les templates
                  apprenant: {
                    nom: apprenantDbAttest?.nom || apprenant.nom,
                    prenom: apprenantDbAttest?.prenom || apprenant.prenom,
                    statut: apprenantDbAttest?.statut || "",
                    raison_sociale: apprenantDbAttest?.raisonSociale || "",
                    siret: apprenantDbAttest?.siret || "",
                    adresse: apprenantDbAttest?.adresse || "",
                    code_postal: apprenantDbAttest?.codePostal || "",
                    ville: apprenantDbAttest?.ville || "",
                    pays: apprenantDbAttest?.pays || "France",
                    email: apprenantDbAttest?.email || apprenant.email,
                    telephone: apprenantDbAttest?.telephone || apprenant.telephone || "",
                  },
                  document: {
                    type: "attestation",
                    titre: template.name,
                  },
                },
                false
              );
              const docEntry: GeneratedDocument = {
                id: `attestation-${apprenant.id}`,
                type: "attestation",
                titre: `Attestation - ${apprenant.prenom} ${apprenant.nom}`,
                clientId: client.id,
                apprenantId: apprenant.id,
                apprenantName: `${apprenant.prenom} ${apprenant.nom}`,
                entrepriseId: client.entrepriseId,
                renderedContent: doc,
              };

              // Auto-save to Drive if enabled
              if (autoSaveToDrive && formation.id) {
                const saveResult = await saveDocumentToDrive({
                  organizationId: user.organizationId!,
                  userId: user.id,
                  formationId: formation.id,
                  formationTitre: formation.titre,
                  documentType: "attestation",
                  titre: docEntry.titre,
                  content: doc,
                  entrepriseId: client.entrepriseId,
                  apprenantId: apprenant.id,
                });
                docEntry.savedToDrive = saveResult.success;
                docEntry.fileId = saveResult.fileId;
              }

              generatedDocuments.push(docEntry);
            }
          }
          break;

        case "certificat_realisation":
          // Certificat de réalisation = un par apprenant
          // Filtrer par targetId si fourni (targetId est l'ID de l'apprenant)
          for (const client of clients) {
            const apprenantsFiltrésCertif = targetId
              ? client.apprenants.filter(a => a.id === targetId)
              : client.apprenants;
            for (const apprenant of apprenantsFiltrésCertif) {
              // Récupérer les données complètes de l'apprenant
              const apprenantDbCertif = await prisma.apprenant.findUnique({
                where: { id: apprenant.id },
              });

              // Récupérer les données complètes de l'entreprise si présente
              let entrepriseDbCertif = null;
              if (client.entrepriseId) {
                entrepriseDbCertif = await prisma.entreprise.findUnique({
                  where: { id: client.entrepriseId },
                });
              }

              const doc = await generateDocument(
                template,
                {
                  ...baseContext,
                  client: {
                    type: client.type.toLowerCase(),
                    type_label: client.type === "ENTREPRISE" ? "Entreprise"
                               : client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                  },
                  // Nouveau format entreprise_ pour les templates
                  entreprise: entrepriseDbCertif ? {
                    raison_sociale: entrepriseDbCertif.raisonSociale,
                    nom: entrepriseDbCertif.raisonSociale,
                    siret: entrepriseDbCertif.siret || "",
                    adresse: entrepriseDbCertif.adresse || "",
                    code_postal: entrepriseDbCertif.codePostal || "",
                    ville: entrepriseDbCertif.ville || "",
                    pays: entrepriseDbCertif.pays || "France",
                  } : client.entreprise ? {
                    raison_sociale: client.entreprise.raisonSociale,
                    nom: client.entreprise.raisonSociale,
                  } : undefined,
                  // Ancien format participant pour compatibilité
                  participant: {
                    nom: apprenantDbCertif?.nom || apprenant.nom,
                    prenom: apprenantDbCertif?.prenom || apprenant.prenom,
                    nom_complet: `${apprenantDbCertif?.prenom || apprenant.prenom} ${apprenantDbCertif?.nom || apprenant.nom}`,
                    email: apprenantDbCertif?.email || apprenant.email,
                  },
                  // Nouveau format apprenant_ pour les templates
                  apprenant: {
                    nom: apprenantDbCertif?.nom || apprenant.nom,
                    prenom: apprenantDbCertif?.prenom || apprenant.prenom,
                    statut: apprenantDbCertif?.statut || "",
                    raison_sociale: apprenantDbCertif?.raisonSociale || "",
                    siret: apprenantDbCertif?.siret || "",
                    adresse: apprenantDbCertif?.adresse || "",
                    code_postal: apprenantDbCertif?.codePostal || "",
                    ville: apprenantDbCertif?.ville || "",
                    pays: apprenantDbCertif?.pays || "France",
                    email: apprenantDbCertif?.email || apprenant.email,
                    telephone: apprenantDbCertif?.telephone || apprenant.telephone || "",
                  },
                  document: {
                    type: "certificat_realisation",
                    titre: template.name,
                  },
                },
                false
              );
              const docEntry: GeneratedDocument = {
                id: `certificat_realisation-${apprenant.id}`,
                type: "certificat_realisation",
                titre: `Certificat de réalisation - ${apprenant.prenom} ${apprenant.nom}`,
                clientId: client.id,
                apprenantId: apprenant.id,
                apprenantName: `${apprenant.prenom} ${apprenant.nom}`,
                entrepriseId: client.entrepriseId,
                renderedContent: doc,
              };

              // Auto-save to Drive if enabled
              if (autoSaveToDrive && formation.id) {
                const saveResult = await saveDocumentToDrive({
                  organizationId: user.organizationId!,
                  userId: user.id,
                  formationId: formation.id,
                  formationTitre: formation.titre,
                  documentType: "certificat_realisation",
                  titre: docEntry.titre,
                  content: doc,
                  entrepriseId: client.entrepriseId,
                  apprenantId: apprenant.id,
                });
                docEntry.savedToDrive = saveResult.success;
                docEntry.fileId = saveResult.fileId;
              }

              generatedDocuments.push(docEntry);
            }
          }
          break;

        case "emargement":
          // Feuille d'émargement dynamique = une pour toute la session
          // Génère un document HTML dynamique avec tableau des participants et journées
          const allParticipants = clients.flatMap(c => c.apprenants.map(a => ({
            nom: a.nom,
            prenom: a.prenom,
            nom_complet: `${a.prenom} ${a.nom}`,
            email: a.email,
            entreprise: c.entreprise?.raisonSociale || "",
          })));

          // Générer les colonnes pour chaque demi-journée
          const columns: { dateLabel: string; periode: "matin" | "apres_midi"; label: string }[] = [];
          lieu.journees.forEach((j) => {
            const dateLabel = formatDateCourteFr(j.date);
            if (j.horaireMatin && j.horaireMatin !== "-") {
              columns.push({ dateLabel, periode: "matin", label: `${dateLabel}\nMatin` });
            }
            if (j.horaireApresMidi && j.horaireApresMidi !== "-") {
              columns.push({ dateLabel, periode: "apres_midi", label: `${dateLabel}\nAprès-midi` });
            }
          });

          // Si pas de colonnes (pas de journées définies), créer une colonne par défaut
          if (columns.length === 0 && lieu.journees.length > 0) {
            lieu.journees.forEach((j) => {
              const dateLabel = formatDateCourteFr(j.date);
              columns.push({ dateLabel, periode: "matin", label: `${dateLabel}\nMatin` });
              columns.push({ dateLabel, periode: "apres_midi", label: `${dateLabel}\nAprès-midi` });
            });
          }

          // Générer le HTML dynamique directement
          const emargementHtml = generateEmargementHTML({
            organization: {
              name: user.organization?.name || "",
              nomCommercial: user.organization?.nomCommercial || null,
              logo: user.organization?.logo || null,
              cachet: user.organization?.cachet || null,
              signature: user.organization?.signature || null,
              numeroFormateur: user.organization?.numeroFormateur || null,
              prefectureRegion: user.organization?.prefectureRegion || null,
              siret: user.organization?.siret || null,
              adresse: user.organization?.adresse || null,
              codePostal: user.organization?.codePostal || null,
              ville: user.organization?.ville || null,
              telephone: user.organization?.telephone || null,
              email: user.organization?.email || null,
              siteWeb: user.organization?.siteWeb || null,
              representantNom: user.organization?.representantNom || null,
              representantPrenom: user.organization?.representantPrenom || null,
              representantFonction: user.organization?.representantFonction || null,
            },
            formation: {
              titre: formation.titre,
              dureeHeures: formation.dureeHeures,
            },
            session: {
              dateDebut: lieu.journees[0]?.date || "",
              dateFin: lieu.journees[lieu.journees.length - 1]?.date || "",
              lieu: lieu.lieu ? {
                nom: lieu.lieu.nom,
                lieuFormation: lieu.lieu.lieuFormation,
                ville: lieu.lieu.ville || null,
              } : null,
              formateur: formateurs.formateurPrincipal ? {
                prenom: formateurs.formateurPrincipal.prenom,
                nom: formateurs.formateurPrincipal.nom,
              } : null,
              modalite: lieu.modalite,
            },
            participants: allParticipants,
            columns,
          });

          const emargementEntry: GeneratedDocument = {
            id: "emargement-session",
            type: "emargement",
            titre: "Feuille d'émargement",
            renderedContent: emargementHtml,
          };

          // Auto-save emargement to Drive - copier dans TOUS les dossiers des apprenants de la session
          if (autoSaveToDrive && formation.id) {
            // Collecter tous les IDs d'apprenants de la session
            const allApprenantIds = clients.flatMap(c => c.apprenants.map(a => a.id));

            const saveResult = await saveDocumentToDrive({
              organizationId: user.organizationId!,
              userId: user.id,
              formationId: formation.id,
              formationTitre: formation.titre,
              documentType: "emargement",
              titre: emargementEntry.titre,
              content: emargementHtml,
              allApprenantIds, // Copier dans tous les dossiers des apprenants
            });
            emargementEntry.savedToDrive = saveResult.success;
            emargementEntry.fileId = saveResult.fileIds?.[0];
          }

          generatedDocuments.push(emargementEntry);
          break;

        case "facture":
          // Facture = une par client
          // Filtrer par targetId si fourni
          const factureClients = targetId
            ? clients.filter(c => c.id === targetId)
            : clients;
          for (const client of factureClients) {
            const tarif = tarifs.find(t => t.clientId === client.id);
            const isParticulier = client.type === "PARTICULIER";

            // Récupérer les données complètes de l'entreprise
            let entrepriseDbFacture = null;
            if (client.entrepriseId) {
              entrepriseDbFacture = await prisma.entreprise.findUnique({
                where: { id: client.entrepriseId },
              });
            }

            // Récupérer les données complètes de l'apprenant si pas une entreprise
            let apprenantDbFacture = null;
            if (client.apprenantId && client.type !== "ENTREPRISE") {
              apprenantDbFacture = await prisma.apprenant.findUnique({
                where: { id: client.apprenantId },
              });
            }

            const clientName = client.type === "ENTREPRISE"
              ? entrepriseDbFacture?.raisonSociale || client.entreprise?.raisonSociale
              : apprenantDbFacture
                ? `${apprenantDbFacture.prenom} ${apprenantDbFacture.nom}`
                : client.apprenant
                  ? `${client.apprenant.prenom} ${client.apprenant.nom}`
                  : "Client";

            const doc = await generateDocument(
              template,
              {
                ...baseContext,
                client: {
                  type: client.type.toLowerCase(),
                  type_label: client.type === "ENTREPRISE" ? "Entreprise"
                             : client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                  nom: clientName,
                },
                // Nouveau format entreprise_ pour les templates
                entreprise: entrepriseDbFacture ? {
                  raison_sociale: entrepriseDbFacture.raisonSociale,
                  nom: entrepriseDbFacture.raisonSociale,
                  siret: entrepriseDbFacture.siret || "",
                  adresse: entrepriseDbFacture.adresse || "",
                  code_postal: entrepriseDbFacture.codePostal || "",
                  ville: entrepriseDbFacture.ville || "",
                  pays: entrepriseDbFacture.pays || "France",
                  adresse_complete: formatAdresse(
                    entrepriseDbFacture.adresse,
                    entrepriseDbFacture.codePostal,
                    entrepriseDbFacture.ville
                  ),
                  representant_civilite: entrepriseDbFacture.contactCivilite || "",
                  representant_nom: entrepriseDbFacture.contactNom || "",
                  representant_prenom: entrepriseDbFacture.contactPrenom || "",
                  representant_fonction: entrepriseDbFacture.contactFonction || "",
                  email: entrepriseDbFacture.contactEmail || "",
                  telephone: entrepriseDbFacture.contactTelephone || "",
                  tva_intracom: entrepriseDbFacture.tvaIntracom || "",
                } : client.entreprise ? {
                  raison_sociale: client.entreprise.raisonSociale,
                  nom: client.entreprise.raisonSociale,
                  siret: client.entreprise.siret || "",
                  adresse: client.entreprise.adresse || "",
                  code_postal: client.entreprise.codePostal || "",
                  ville: client.entreprise.ville || "",
                  adresse_complete: formatAdresse(
                    client.entreprise.adresse,
                    client.entreprise.codePostal,
                    client.entreprise.ville
                  ),
                } : undefined,
                // Ancien format particulier pour compatibilité
                particulier: apprenantDbFacture ? {
                  nom: apprenantDbFacture.nom,
                  prenom: apprenantDbFacture.prenom,
                  nom_complet: `${apprenantDbFacture.prenom} ${apprenantDbFacture.nom}`,
                  email: apprenantDbFacture.email,
                } : client.apprenant && client.type !== "ENTREPRISE" ? {
                  nom: client.apprenant.nom,
                  prenom: client.apprenant.prenom,
                  nom_complet: `${client.apprenant.prenom} ${client.apprenant.nom}`,
                  email: client.apprenant.email,
                } : undefined,
                // Nouveau format apprenant_ pour les templates
                apprenant: apprenantDbFacture ? {
                  nom: apprenantDbFacture.nom,
                  prenom: apprenantDbFacture.prenom,
                  statut: apprenantDbFacture.statut || "",
                  raison_sociale: apprenantDbFacture.raisonSociale || "",
                  siret: apprenantDbFacture.siret || "",
                  adresse: apprenantDbFacture.adresse || "",
                  code_postal: apprenantDbFacture.codePostal || "",
                  ville: apprenantDbFacture.ville || "",
                  pays: apprenantDbFacture.pays || "France",
                  email: apprenantDbFacture.email,
                  telephone: apprenantDbFacture.telephone || "",
                } : client.apprenant && client.type !== "ENTREPRISE" ? {
                  nom: client.apprenant.nom,
                  prenom: client.apprenant.prenom,
                  statut: client.apprenant.statut || "",
                  email: client.apprenant.email,
                  telephone: client.apprenant.telephone || "",
                } : undefined,
                participants: client.apprenants.map(a => ({
                  nom: a.nom,
                  prenom: a.prenom,
                  nom_complet: `${a.prenom} ${a.nom}`,
                })),
                tarif: {
                  ht: tarif?.tarifHT || 0,
                  ht_format: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} €`,
                  tva: isParticulier ? 0 : ((tarif?.tarifHT || 0) * 0.2),
                  tva_format: isParticulier ? "0,00 €" : `${(((tarif?.tarifHT || 0) * 0.2)).toLocaleString("fr-FR")} €`,
                  ttc: isParticulier ? tarif?.tarifHT || 0 : ((tarif?.tarifHT || 0) * 1.2),
                  ttc_format: isParticulier
                    ? `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} €`
                    : `${(((tarif?.tarifHT || 0) * 1.2)).toLocaleString("fr-FR")} €`,
                  nombre_participants: client.apprenants.length,
                },
                // Nouveau format tarifs_ pour le système de variables
                tarifs: client.type === "ENTREPRISE" ? {
                  tarif_entreprise_ht_documents: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € HT`,
                  entreprise_montant_tva: `${((tarif?.tarifHT || 0) * 0.2).toLocaleString("fr-FR")} €`,
                  entreprise_prix_ttc: `${((tarif?.tarifHT || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                } : isParticulier ? {
                  particulier_prix_ttc: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € TTC`,
                } : {
                  tarif_independant_ht_documents: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € HT`,
                  independant_montant_tva: `${((tarif?.tarifHT || 0) * 0.2).toLocaleString("fr-FR")} €`,
                  independant_prix_ttc: `${((tarif?.tarifHT || 0) * 1.2).toLocaleString("fr-FR")} € TTC`,
                },
                facture: {
                  numero: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                  date: formatDateCourteFr(new Date().toISOString().split("T")[0]),
                },
                document: {
                  type: "facture",
                  titre: template.name,
                },
              },
              false
            );
            const factureEntry: GeneratedDocument = {
              id: `facture-${client.id}`,
              type: "facture",
              titre: `Facture - ${clientName}`,
              clientId: client.id,
              clientName: clientName || undefined,
              entrepriseId: client.entrepriseId,
              apprenantId: client.apprenantId,
              renderedContent: doc,
            };

            // Auto-save to Drive if enabled
            if (autoSaveToDrive && formation.id) {
              const saveResult = await saveDocumentToDrive({
                organizationId: user.organizationId!,
                userId: user.id,
                formationId: formation.id,
                formationTitre: formation.titre,
                documentType: "facture",
                titre: factureEntry.titre,
                content: doc,
                entrepriseId: client.entrepriseId,
                apprenantId: client.apprenantId,
              });
              factureEntry.savedToDrive = saveResult.success;
              factureEntry.fileId = saveResult.fileId;
            }

            generatedDocuments.push(factureEntry);
          }
          break;

        case "programme":
          // Programme de formation = un document global par session
          {
            const programmeDoc = await generateDocument(
              template,
              {
                ...baseContext,
              },
              false
            );

            const programmeEntry: GeneratedDocument = {
              id: `programme_${Date.now()}`,
              type: "programme",
              titre: `Programme - ${formation.titre}`,
              renderedContent: programmeDoc,
            };

            if (autoSaveToDrive && formation.id) {
              const saveResult = await saveDocumentToDrive({
                organizationId: user.organizationId!,
                userId: user.id,
                formationId: formation.id,
                formationTitre: formation.titre,
                documentType: "programme",
                titre: programmeEntry.titre,
                content: programmeDoc,
              });
              programmeEntry.savedToDrive = saveResult.success;
              programmeEntry.fileId = saveResult.fileId;
            }

            generatedDocuments.push(programmeEntry);
          }
          break;

        case "reglement_interieur":
          // Règlement intérieur = un document global par session
          {
            const reglementDoc = await generateDocument(
              template,
              {
                ...baseContext,
              },
              false
            );

            const reglementEntry: GeneratedDocument = {
              id: `reglement_${Date.now()}`,
              type: "reglement_interieur",
              titre: `Règlement Intérieur - ${formation.titre}`,
              renderedContent: reglementDoc,
            };

            if (autoSaveToDrive && formation.id) {
              const saveResult = await saveDocumentToDrive({
                organizationId: user.organizationId!,
                userId: user.id,
                formationId: formation.id,
                formationTitre: formation.titre,
                documentType: "reglement_interieur",
                titre: reglementEntry.titre,
                content: reglementDoc,
              });
              reglementEntry.savedToDrive = saveResult.success;
              reglementEntry.fileId = saveResult.fileId;
            }

            generatedDocuments.push(reglementEntry);
          }
          break;

        case "cgv":
          // CGV = un document global par session
          {
            const cgvDoc = await generateDocument(
              template,
              {
                ...baseContext,
              },
              false
            );

            const cgvEntry: GeneratedDocument = {
              id: `cgv_${Date.now()}`,
              type: "cgv",
              titre: `Conditions Générales de Vente`,
              renderedContent: cgvDoc,
            };

            if (autoSaveToDrive && formation.id) {
              const saveResult = await saveDocumentToDrive({
                organizationId: user.organizationId!,
                userId: user.id,
                formationId: formation.id,
                formationTitre: formation.titre,
                documentType: "cgv",
                titre: cgvEntry.titre,
                content: cgvDoc,
              });
              cgvEntry.savedToDrive = saveResult.success;
              cgvEntry.fileId = saveResult.fileId;
            }

            generatedDocuments.push(cgvEntry);
          }
          break;

        case "contrat_sous_traitance":
          // Contrat de sous-traitance = un par intervenant externe
          {
            // Récupérer les co-formateurs s'il y en a
            const allIntervenants = [
              ...(formateurs.formateurPrincipal ? [formateurs.formateurPrincipal] : []),
              ...(formateurs.coformateurs || []),
            ];

            for (const intervenant of allIntervenants) {
              // Récupérer les données complètes de l'intervenant
              const intervenantDb = await prisma.intervenant.findUnique({
                where: { id: intervenant.id },
              });

              if (!intervenantDb) continue;

              const contratDoc = await generateDocument(
                template,
                {
                  ...baseContext,
                  intervenant: {
                    nom: intervenantDb.nom,
                    prenom: intervenantDb.prenom,
                    adresse: "",
                    code_postal: "",
                    ville: "",
                    pays: "France",
                    email: intervenantDb.email || "",
                    telephone: intervenantDb.telephone || "",
                    fonction: intervenantDb.fonction || "",
                    specialites: intervenantDb.specialites || [],
                    raison_sociale: intervenantDb.structure || "",
                    siret: intervenantDb.structureSiret || "",
                    nda: intervenantDb.numeroDeclarationActivite || "",
                  },
                },
                false
              );

              const contratEntry: GeneratedDocument = {
                id: `contrat_sous_traitance_${intervenant.id}_${Date.now()}`,
                type: "contrat_sous_traitance",
                titre: `Contrat de sous-traitance - ${intervenantDb.prenom} ${intervenantDb.nom}`,
                renderedContent: contratDoc,
              };

              if (autoSaveToDrive && formation.id) {
                const saveResult = await saveDocumentToDrive({
                  organizationId: user.organizationId!,
                  userId: user.id,
                  formationId: formation.id,
                  formationTitre: formation.titre,
                  documentType: "contrat_sous_traitance",
                  titre: contratEntry.titre,
                  content: contratDoc,
                });
                contratEntry.savedToDrive = saveResult.success;
                contratEntry.fileId = saveResult.fileId;
              }

              generatedDocuments.push(contratEntry);
            }
          }
          break;

        // Note: Les évaluations (à chaud, à froid, entreprise, financeur, intervenant)
        // sont maintenant gérées comme des formulaires en ligne via l'API /api/evaluation-satisfaction
        // et /api/evaluation-intervenant. Elles ne sont plus générées comme des documents PDF.
      }
    }

    return NextResponse.json({
      success: true,
      documents: generatedDocuments,
      count: generatedDocuments.length,
    });
  } catch (error) {
    console.error("Erreur génération documents session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération des documents" },
      { status: 500 }
    );
  }
}

// Fonction helper pour générer un document à partir d'un template
async function generateDocument(
  template: { content: unknown; headerContent: unknown; footerContent: unknown },
  context: Record<string, unknown>,
  previewMode: boolean
): Promise<string> {
  const templateContent = typeof template.content === "string"
    ? template.content
    : JSON.stringify(template.content);

  return renderTemplate(templateContent, context as never, { previewMode });
}

// Fonctions utilitaires de formatage de dates
function formatDateFr(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateCourteFr(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function formatDateCompleteFr(date: Date): string {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getMonthName(monthIndex: number): string {
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  return months[monthIndex];
}

function formatAdresse(
  adresse: string | null | undefined,
  codePostal: string | null | undefined,
  ville: string | null | undefined
): string {
  const parts = [adresse, `${codePostal || ""} ${ville || ""}`.trim()].filter(Boolean);
  return parts.join(", ");
}

// Fonction pour générer le HTML d'émargement dynamique
interface EmargementColumn {
  dateLabel: string;
  periode: "matin" | "apres_midi";
  label: string;
}

interface EmargementParticipant {
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  entreprise: string;
  signatures?: Record<string, string>; // clé = "dateLabel_periode", valeur = base64 signature
}

interface EmargementSignature {
  participantEmail: string;
  date: string;
  periode: "matin" | "apres_midi";
  signatureData: string;
}

function generateEmargementHTML(data: {
  organization: {
    name: string;
    nomCommercial?: string | null;
    logo: string | null;
    cachet: string | null;
    signature?: string | null;
    numeroFormateur: string | null;
    prefectureRegion?: string | null;
    siret: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
    telephone?: string | null;
    email?: string | null;
    siteWeb?: string | null;
    representantNom?: string | null;
    representantPrenom?: string | null;
    representantFonction?: string | null;
  };
  formation: {
    titre: string;
    dureeHeures: number;
  };
  session: {
    dateDebut: string;
    dateFin: string;
    lieu: {
      nom: string;
      lieuFormation: string;
      ville: string | null;
    } | null;
    formateur: {
      prenom: string;
      nom: string;
    } | null;
    modalite: string;
  };
  participants: EmargementParticipant[];
  columns: EmargementColumn[];
  signatures?: EmargementSignature[];
  formateurSignatures?: { date: string; periode: "matin" | "apres_midi"; signatureData: string }[];
}): string {
  const { organization, formation, session, participants, columns, signatures = [], formateurSignatures = [] } = data;

  // Helper pour formater les dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper pour trouver la signature d'un participant pour une colonne
  const getParticipantSignature = (participantEmail: string, column: EmargementColumn): string | null => {
    const sig = signatures.find(s =>
      s.participantEmail === participantEmail &&
      s.date === column.dateLabel &&
      s.periode === column.periode
    );
    return sig?.signatureData || null;
  };

  // Helper pour trouver la signature du formateur pour une colonne
  const getFormateurSignature = (column: EmargementColumn): string | null => {
    const sig = formateurSignatures.find(s =>
      s.date === column.dateLabel &&
      s.periode === column.periode
    );
    return sig?.signatureData || null;
  };

  // Générer les en-têtes de colonnes
  const generateColumnHeaders = () => {
    return columns.map((col) => `<th class="date-header">${col.label.replace("\n", "<br/>")}</th>`).join("");
  };

  // Générer le tableau des participants avec signatures
  const generateParticipantRows = () => {
    return participants.map((p, index) => {
      const cells = columns.map((col) => {
        const sig = getParticipantSignature(p.email, col);
        if (sig) {
          return `<td class="signature-cell signed"><img src="${sig}" alt="Signature" class="signature-img" /></td>`;
        }
        // Vérifier aussi dans les signatures embarquées du participant
        const embeddedKey = `${col.dateLabel}_${col.periode}`;
        if (p.signatures?.[embeddedKey]) {
          return `<td class="signature-cell signed"><img src="${p.signatures[embeddedKey]}" alt="Signature" class="signature-img" /></td>`;
        }
        return '<td class="signature-cell empty"></td>';
      }).join("");
      return `
        <tr>
          <td class="participant-num">${index + 1}</td>
          <td class="participant-name">${p.prenom} ${p.nom}</td>
          <td class="participant-company">${p.entreprise || "-"}</td>
          ${cells}
        </tr>
      `;
    }).join("");
  };

  // Générer la ligne formateur avec signatures
  const generateFormateurRow = () => {
    if (!session.formateur) return "";

    const cells = columns.map((col) => {
      const sig = getFormateurSignature(col);
      if (sig) {
        return `<td class="signature-cell signed"><img src="${sig}" alt="Signature" class="signature-img" /></td>`;
      }
      return '<td class="signature-cell empty"></td>';
    }).join("");

    return `
      <tr class="formateur-row">
        <td colspan="3" class="formateur-label">
          <strong>Formateur :</strong> ${session.formateur.prenom} ${session.formateur.nom}
        </td>
        ${cells}
      </tr>
    `;
  };

  // Construire le nom de l'organisation (nom commercial ou raison sociale)
  const orgDisplayName = organization.nomCommercial || organization.name;
  const orgLegalName = organization.nomCommercial && organization.name !== organization.nomCommercial
    ? organization.name
    : null;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feuille d'émargement - ${formation.titre}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10px;
      line-height: 1.4;
      color: #333;
      background: white;
    }

    .container {
      max-width: 100%;
      padding: 15px;
    }

    /* Header avec logo seulement */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 12px;
      border-bottom: 2px solid #4F46E5;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      max-height: 50px;
      max-width: 120px;
      object-fit: contain;
    }

    .org-header-info {
      font-size: 9px;
      color: #666;
    }

    .org-header-info h1 {
      font-size: 13px;
      color: #333;
      margin-bottom: 2px;
    }

    .org-header-info .legal-name {
      font-size: 8px;
      color: #888;
      font-style: italic;
    }

    .header-right {
      text-align: right;
      font-size: 8px;
      color: #666;
    }

    /* Titre du document */
    .document-title {
      text-align: center;
      margin-bottom: 15px;
    }

    .document-title h2 {
      font-size: 16px;
      color: #4F46E5;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }

    /* Informations formation */
    .formation-info {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 15px;
    }

    .formation-info h3 {
      font-size: 12px;
      color: #1E293B;
      margin-bottom: 8px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .info-item {
      font-size: 9px;
    }

    .info-item label {
      font-weight: 600;
      color: #64748B;
      display: block;
      margin-bottom: 1px;
    }

    .info-item span {
      color: #1E293B;
    }

    /* Tableau d'émargement */
    .emargement-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9px;
    }

    .emargement-table th,
    .emargement-table td {
      border: 1px solid #CBD5E1;
      padding: 5px 3px;
      text-align: center;
      vertical-align: middle;
    }

    .emargement-table th {
      background: #4F46E5;
      color: white;
      font-weight: 600;
      font-size: 8px;
    }

    .emargement-table th.date-header {
      min-width: 65px;
    }

    .participant-num {
      width: 25px;
      font-weight: 600;
      background: #F8FAFC;
    }

    .participant-name {
      text-align: left;
      padding-left: 6px !important;
      min-width: 130px;
      font-weight: 500;
    }

    .participant-company {
      text-align: left;
      padding-left: 6px !important;
      min-width: 100px;
      color: #64748B;
      font-size: 8px;
    }

    .signature-cell {
      width: 65px;
      height: 35px;
      background: #FAFAFA;
      padding: 2px !important;
    }

    .signature-cell.empty {
      background: #F1F5F9;
    }

    .signature-cell.signed {
      background: #F0FDF4;
    }

    .signature-img {
      max-width: 60px;
      max-height: 30px;
      object-fit: contain;
    }

    .formateur-row {
      background: #EEF2FF;
    }

    .formateur-row td {
      border-top: 2px solid #4F46E5;
    }

    .formateur-label {
      text-align: left !important;
      padding-left: 8px !important;
      font-size: 9px;
    }

    /* Section cachet et signature en bas */
    .bottom-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }

    .cachet-signature-section {
      display: flex;
      gap: 30px;
      align-items: flex-start;
    }

    .stamp-box {
      text-align: center;
    }

    .stamp-box .label {
      font-size: 8px;
      color: #64748B;
      margin-bottom: 5px;
    }

    .stamp-box .stamp-area {
      border: 1px dashed #CBD5E1;
      min-width: 100px;
      min-height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FAFAFA;
      border-radius: 4px;
    }

    .stamp-box .stamp-area img {
      max-width: 95px;
      max-height: 65px;
      object-fit: contain;
    }

    .stamp-box .stamp-area.empty {
      font-size: 7px;
      color: #94A3B8;
    }

    /* Footer avec infos organisation */
    .footer {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #E2E8F0;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .footer-org-info {
      font-size: 7px;
      color: #64748B;
      line-height: 1.5;
    }

    .footer-org-info .org-name {
      font-weight: 600;
      color: #1E293B;
      font-size: 8px;
    }

    .footer-org-info .legal-info {
      margin-top: 3px;
    }

    .footer-legal {
      font-size: 7px;
      color: #94A3B8;
      max-width: 40%;
      text-align: right;
    }

    .footer-legal p {
      margin-bottom: 2px;
    }

    .footer-date {
      font-size: 7px;
      color: #94A3B8;
      margin-top: 5px;
    }

    /* Print styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .container {
        padding: 0;
        min-height: auto;
      }

      .emargement-table th {
        background: #4F46E5 !important;
        color: white !important;
      }

      .signature-cell.signed {
        background: #F0FDF4 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header avec logo -->
    <header class="header">
      <div class="logo-section">
        ${organization.logo ? `<img src="${organization.logo}" alt="Logo" class="logo" />` : ""}
        <div class="org-header-info">
          <h1>${orgDisplayName}</h1>
          ${orgLegalName ? `<div class="legal-name">${orgLegalName}</div>` : ""}
        </div>
      </div>
      <div class="header-right">
        ${organization.numeroFormateur ? `<div>N° d'activité : ${organization.numeroFormateur}</div>` : ""}
        ${organization.prefectureRegion ? `<div>Enregistré auprès de la préfecture ${organization.prefectureRegion}</div>` : ""}
      </div>
    </header>

    <!-- Titre -->
    <div class="document-title">
      <h2>Feuille d'émargement</h2>
    </div>

    <!-- Informations formation -->
    <div class="formation-info">
      <h3>${formation.titre}</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>Période</label>
          <span>${formatDate(session.dateDebut)}${session.dateFin && session.dateFin !== session.dateDebut ? ` au ${formatDate(session.dateFin)}` : ""}</span>
        </div>
        <div class="info-item">
          <label>Durée</label>
          <span>${formation.dureeHeures} heures</span>
        </div>
        <div class="info-item">
          <label>Modalité</label>
          <span>${session.modalite === "PRESENTIEL" ? "Présentiel" : session.modalite === "DISTANCIEL" ? "Distanciel" : "Mixte"}</span>
        </div>
        ${session.lieu ? `
        <div class="info-item">
          <label>Lieu</label>
          <span>${session.lieu.lieuFormation}${session.lieu.ville ? `, ${session.lieu.ville}` : ""}</span>
        </div>
        ` : ""}
        ${session.formateur ? `
        <div class="info-item">
          <label>Formateur</label>
          <span>${session.formateur.prenom} ${session.formateur.nom}</span>
        </div>
        ` : ""}
        <div class="info-item">
          <label>Nombre de participants</label>
          <span>${participants.length}</span>
        </div>
      </div>
    </div>

    <!-- Tableau d'émargement -->
    <table class="emargement-table">
      <thead>
        <tr>
          <th>N°</th>
          <th>Nom et Prénom</th>
          <th>Entreprise</th>
          ${generateColumnHeaders()}
        </tr>
      </thead>
      <tbody>
        ${generateParticipantRows()}
        ${generateFormateurRow()}
      </tbody>
    </table>

    <!-- Section cachet et signature en bas -->
    <div class="bottom-section">
      <div class="cachet-signature-section">
        <div class="stamp-box">
          <div class="label">Cachet de l'organisme</div>
          <div class="stamp-area ${organization.cachet ? "" : "empty"}">
            ${organization.cachet
              ? `<img src="${organization.cachet}" alt="Cachet" />`
              : "Emplacement cachet"}
          </div>
        </div>
        <div class="stamp-box">
          <div class="label">Signature du responsable</div>
          <div class="stamp-area ${organization.signature ? "" : "empty"}">
            ${organization.signature
              ? `<img src="${organization.signature}" alt="Signature" />`
              : "Emplacement signature"}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer avec infos organisation complètes -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-org-info">
          <div class="org-name">${orgDisplayName}${orgLegalName ? ` (${orgLegalName})` : ""}</div>
          ${organization.adresse || organization.codePostal || organization.ville ? `
          <div>${[organization.adresse, `${organization.codePostal || ""} ${organization.ville || ""}`.trim()].filter(Boolean).join(" - ")}</div>
          ` : ""}
          <div class="legal-info">
            ${organization.siret ? `SIRET : ${organization.siret}` : ""}
            ${organization.siret && organization.numeroFormateur ? " | " : ""}
            ${organization.numeroFormateur ? `N° de déclaration d'activité : ${organization.numeroFormateur}` : ""}
            ${organization.prefectureRegion ? ` (Préfecture ${organization.prefectureRegion})` : ""}
          </div>
          ${organization.telephone || organization.email ? `
          <div>
            ${organization.telephone ? `Tél : ${organization.telephone}` : ""}
            ${organization.telephone && organization.email ? " | " : ""}
            ${organization.email ? `Email : ${organization.email}` : ""}
          </div>
          ` : ""}
          ${organization.siteWeb ? `<div>Site web : ${organization.siteWeb}</div>` : ""}
        </div>
        <div class="footer-legal">
          <p>Les signataires reconnaissent avoir assisté à la formation aux dates et heures indiquées.</p>
          <p>Ce document ne peut être modifié après signature et fait foi en cas de contrôle.</p>
          <div class="footer-date">
            Document généré le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>
  `;
}
