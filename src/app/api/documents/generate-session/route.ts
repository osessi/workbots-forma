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
import { DocumentType } from "@prisma/client";

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
}

interface GeneratedDocument {
  id: string;
  type: string;
  titre: string;
  clientId?: string;
  clientName?: string;
  apprenantId?: string;
  apprenantName?: string;
  renderedContent: string;
}

// Mapper le type de document wizard vers DocumentType Prisma
function mapDocumentType(wizardType: string): DocumentType | null {
  const mapping: Record<string, DocumentType> = {
    convention: "CONVENTION",
    contrat: "CONTRAT_FORMATION",
    convocation: "CONVOCATION",
    attestation: "ATTESTATION_FIN",
    emargement: "ATTESTATION_PRESENCE",
    facture: "FACTURE",
  };
  return mapping[wizardType] || null;
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
    const { formation, clients, tarifs, lieu, formateurs, selectedDocuments } = body;

    if (!selectedDocuments || selectedDocuments.length === 0) {
      return NextResponse.json(
        { error: "Aucun document sélectionné" },
        { status: 400 }
      );
    }

    const generatedDocuments: GeneratedDocument[] = [];

    // Construire le contexte de base commun à tous les documents
    const baseContext = {
      formation: {
        id: formation.id || "",
        titre: formation.titre,
        duree: `${formation.dureeHeures} heures (${formation.dureeJours} jours)`,
        duree_heures: formation.dureeHeures,
        nombre_jours: formation.dureeJours,
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
      journees: lieu.journees.map((j, index) => ({
        numero: index + 1,
        date: formatDateFr(j.date),
        date_courte: formatDateCourteFr(j.date),
        horaires_matin: j.horaireMatin,
        horaires_apres_midi: j.horaireApresMidi,
      })),
      // Nouveau format OF (of_)
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
      // Ancien format pour compatibilité (legacy)
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
      dates: {
        jour: String(new Date().getDate()).padStart(2, "0"),
        mois: getMonthName(new Date().getMonth()),
        annee: String(new Date().getFullYear()),
        date_complete: formatDateCompleteFr(new Date()),
        date_courte: formatDateCourteFr(new Date().toISOString().split("T")[0]),
      },
      signature: {
        responsable_organisme: user.organization?.signature || "",
      },
    };

    // Générer les documents pour chaque type sélectionné
    for (const docType of selectedDocuments) {
      const prismaDocType = mapDocumentType(docType);
      if (!prismaDocType) continue;

      // Trouver le template pour ce type de document
      const template = await prisma.template.findFirst({
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

      if (!template) {
        console.warn(`Aucun template trouvé pour ${docType}`);
        continue;
      }

      // Selon le type de document, générer pour chaque entité concernée
      switch (docType) {
        case "convention":
          // Convention = une par entreprise
          for (const client of clients.filter(c => c.type === "ENTREPRISE")) {
            const tarif = tarifs.find(t => t.clientId === client.id);
            const doc = await generateDocument(
              template,
              {
                ...baseContext,
                client: {
                  type: "entreprise",
                  type_label: "Entreprise",
                },
                entreprise: {
                  nom: client.entreprise?.raisonSociale || "",
                  siret: client.entreprise?.siret || "",
                  adresse: client.entreprise?.adresse || "",
                  code_postal: client.entreprise?.codePostal || "",
                  ville: client.entreprise?.ville || "",
                  adresse_complete: formatAdresse(
                    client.entreprise?.adresse,
                    client.entreprise?.codePostal,
                    client.entreprise?.ville
                  ),
                  representant: client.entreprise?.contactNom
                    ? `${client.entreprise.contactPrenom || ""} ${client.entreprise.contactNom}`.trim()
                    : "",
                  email: client.entreprise?.contactEmail || "",
                },
                participants: client.apprenants.map(a => ({
                  nom: a.nom,
                  prenom: a.prenom,
                  nom_complet: `${a.prenom} ${a.nom}`,
                  email: a.email,
                  telephone: a.telephone || "",
                })),
                tarif: {
                  ht: tarif?.tarifHT || 0,
                  ht_format: `${(tarif?.tarifHT || 0).toLocaleString("fr-FR")} € HT`,
                  financeur: tarif?.financeurId ? "Oui" : "Non",
                  montant_finance: tarif?.montantFinance || 0,
                  montant_finance_format: `${(tarif?.montantFinance || 0).toLocaleString("fr-FR")} €`,
                  reste_a_charge: tarif?.resteACharge || 0,
                  reste_a_charge_format: `${(tarif?.resteACharge || 0).toLocaleString("fr-FR")} €`,
                },
                document: {
                  type: "convention",
                  titre: template.name,
                },
              },
              false
            );
            generatedDocuments.push({
              id: `convention-${client.id}`,
              type: "convention",
              titre: `Convention - ${client.entreprise?.raisonSociale}`,
              clientId: client.id,
              clientName: client.entreprise?.raisonSociale,
              renderedContent: doc,
            });
          }
          break;

        case "contrat":
          // Contrat = un par indépendant ou particulier
          for (const client of clients.filter(c => c.type === "INDEPENDANT" || c.type === "PARTICULIER")) {
            const tarif = tarifs.find(t => t.clientId === client.id);
            const isParticulier = client.type === "PARTICULIER";
            const doc = await generateDocument(
              template,
              {
                ...baseContext,
                client: {
                  type: client.type.toLowerCase(),
                  type_label: client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                },
                particulier: {
                  nom: client.apprenant?.nom || "",
                  prenom: client.apprenant?.prenom || "",
                  nom_complet: client.apprenant
                    ? `${client.apprenant.prenom} ${client.apprenant.nom}`
                    : "",
                  email: client.apprenant?.email || "",
                  telephone: client.apprenant?.telephone || "",
                  statut: client.apprenant?.statut || "",
                },
                participants: [{
                  nom: client.apprenant?.nom || "",
                  prenom: client.apprenant?.prenom || "",
                  nom_complet: client.apprenant
                    ? `${client.apprenant.prenom} ${client.apprenant.nom}`
                    : "",
                  email: client.apprenant?.email || "",
                  telephone: client.apprenant?.telephone || "",
                }],
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
            generatedDocuments.push({
              id: `contrat-${client.id}`,
              type: "contrat",
              titre: `Contrat - ${clientName}`,
              clientId: client.id,
              clientName,
              renderedContent: doc,
            });
          }
          break;

        case "convocation":
          // Convocation = une par apprenant
          for (const client of clients) {
            for (const apprenant of client.apprenants) {
              const doc = await generateDocument(
                template,
                {
                  ...baseContext,
                  client: {
                    type: client.type.toLowerCase(),
                    type_label: client.type === "ENTREPRISE" ? "Entreprise"
                               : client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                  },
                  entreprise: client.entreprise ? {
                    nom: client.entreprise.raisonSociale,
                    siret: client.entreprise.siret || "",
                  } : undefined,
                  participant: {
                    nom: apprenant.nom,
                    prenom: apprenant.prenom,
                    nom_complet: `${apprenant.prenom} ${apprenant.nom}`,
                    email: apprenant.email,
                    telephone: apprenant.telephone || "",
                  },
                  document: {
                    type: "convocation",
                    titre: template.name,
                  },
                },
                false
              );
              generatedDocuments.push({
                id: `convocation-${apprenant.id}`,
                type: "convocation",
                titre: `Convocation - ${apprenant.prenom} ${apprenant.nom}`,
                clientId: client.id,
                apprenantId: apprenant.id,
                apprenantName: `${apprenant.prenom} ${apprenant.nom}`,
                renderedContent: doc,
              });
            }
          }
          break;

        case "attestation":
          // Attestation = une par apprenant
          for (const client of clients) {
            for (const apprenant of client.apprenants) {
              const doc = await generateDocument(
                template,
                {
                  ...baseContext,
                  client: {
                    type: client.type.toLowerCase(),
                    type_label: client.type === "ENTREPRISE" ? "Entreprise"
                               : client.type === "INDEPENDANT" ? "Indépendant" : "Particulier",
                  },
                  entreprise: client.entreprise ? {
                    nom: client.entreprise.raisonSociale,
                  } : undefined,
                  participant: {
                    nom: apprenant.nom,
                    prenom: apprenant.prenom,
                    nom_complet: `${apprenant.prenom} ${apprenant.nom}`,
                    email: apprenant.email,
                  },
                  document: {
                    type: "attestation",
                    titre: template.name,
                  },
                },
                false
              );
              generatedDocuments.push({
                id: `attestation-${apprenant.id}`,
                type: "attestation",
                titre: `Attestation - ${apprenant.prenom} ${apprenant.nom}`,
                clientId: client.id,
                apprenantId: apprenant.id,
                apprenantName: `${apprenant.prenom} ${apprenant.nom}`,
                renderedContent: doc,
              });
            }
          }
          break;

        case "emargement":
          // Feuille d'émargement = une pour toute la session
          const allParticipants = clients.flatMap(c => c.apprenants.map(a => ({
            nom: a.nom,
            prenom: a.prenom,
            nom_complet: `${a.prenom} ${a.nom}`,
            email: a.email,
            entreprise: c.entreprise?.raisonSociale || "",
          })));

          const doc = await generateDocument(
            template,
            {
              ...baseContext,
              participants: allParticipants,
              document: {
                type: "emargement",
                titre: template.name,
              },
            },
            false
          );
          generatedDocuments.push({
            id: "emargement-session",
            type: "emargement",
            titre: "Feuille d'émargement",
            renderedContent: doc,
          });
          break;

        case "facture":
          // Facture = une par client
          for (const client of clients) {
            const tarif = tarifs.find(t => t.clientId === client.id);
            const isParticulier = client.type === "PARTICULIER";
            const clientName = client.type === "ENTREPRISE"
              ? client.entreprise?.raisonSociale
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
                entreprise: client.entreprise ? {
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
                particulier: client.apprenant && client.type !== "ENTREPRISE" ? {
                  nom: client.apprenant.nom,
                  prenom: client.apprenant.prenom,
                  nom_complet: `${client.apprenant.prenom} ${client.apprenant.nom}`,
                  email: client.apprenant.email,
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
            generatedDocuments.push({
              id: `facture-${client.id}`,
              type: "facture",
              titre: `Facture - ${clientName}`,
              clientId: client.id,
              clientName: clientName || undefined,
              renderedContent: doc,
            });
          }
          break;
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
