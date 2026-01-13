// ===========================================
// API PRÉ-INSCRIPTION - POST /api/public/pre-inscription
// ===========================================
// Qualiopi Indicateur 1 & 4 : Analyse du besoin et fiche de renseignements
// Permet aux prospects de se pré-inscrire à une formation

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import {
  sendEmail,
  generatePreInscriptionConfirmationEmail,
  generateOrganizationNotificationEmail,
} from "@/lib/services/email";
import { notifyPreInscription } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

// Schéma de validation Zod pour la pré-inscription
const preInscriptionSchema = z.object({
  // Organisation et formation
  organizationSlug: z.string().min(1, "Organisation requise"),
  formationId: z.string().min(1, "Formation requise"),

  // Type de profil (Correction 395)
  profileType: z.enum(["particulier", "independant", "entreprise"]).optional(),

  // ===========================================
  // PARTIE 1 : ANALYSE DU BESOIN (Qualiopi)
  // ===========================================
  objectifsProfessionnels: z.string().optional(),
  contexte: z.string().optional(),
  experiencePrealable: z.string().optional(),
  attentesSpecifiques: z.string().optional(),
  contraintes: z.string().optional(),

  // ===========================================
  // PARTIE 2 : FICHE DE RENSEIGNEMENTS
  // ===========================================
  // Identité (obligatoire - pour entreprise: représentant légal)
  civilite: z.enum(["M.", "Mme"]).optional(),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  dateNaissance: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  lieuNaissance: z.string().optional(),

  // Coordonnées
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().default("France"),

  // Situation professionnelle
  situationProfessionnelle: z.enum([
    "SALARIE",
    "INDEPENDANT",
    "DEMANDEUR_EMPLOI",
    "ETUDIANT",
    "RETRAITE",
    "PARTICULIER",
    "AUTRE",
  ]).optional(),
  entreprise: z.string().optional(),
  poste: z.string().optional(),
  siret: z.string().optional(),

  // ===========================================
  // ENTREPRISE : Champs additionnels (Correction 395)
  // ===========================================
  raisonSociale: z.string().optional(),
  numeroTVA: z.string().optional(),
  representantCivilite: z.string().optional(),
  representantNom: z.string().optional(),
  representantPrenom: z.string().optional(),
  representantEmail: z.string().optional(),
  representantTelephone: z.string().optional(),
  representantFonction: z.string().optional(),
  // Apprenants (liste de personnes à former)
  apprenants: z.array(z.object({
    nom: z.string(),
    prenom: z.string(),
    email: z.string(),
    telephone: z.string().optional(),
    dateNaissance: z.string().optional(),
    lieuNaissance: z.string().optional(),
    poste: z.string().optional(),
  })).optional(),

  // ===========================================
  // HANDICAP (OBLIGATOIRE QUALIOPI)
  // ===========================================
  situationHandicap: z.boolean().default(false),
  besoinsAmenagements: z.string().optional(),

  // ===========================================
  // FINANCEMENT
  // ===========================================
  modeFinancement: z.enum([
    "ENTREPRISE",
    "OPCO",
    "CPF",
    "FRANCE_TRAVAIL",
    "PERSONNEL",
    "MIXTE",
    "AUTRE",
  ]).optional(),
  financeurNom: z.string().optional(),
  commentaireFinancement: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des données
    const validationResult = preInscriptionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Récupérer l'organisation
    const organization = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug },
      select: {
        id: true,
        name: true,
        nomCommercial: true,
        email: true,
        telephone: true,
        logo: true,
        primaryColor: true,
        catalogueActif: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    if (!organization.catalogueActif) {
      return NextResponse.json(
        { error: "Le catalogue n'est pas disponible pour cette organisation" },
        { status: 403 }
      );
    }

    // Vérifier que la formation existe et est publiée
    const formation = await prisma.formation.findUnique({
      where: { id: data.formationId },
      select: {
        id: true,
        titre: true,
        organizationId: true,
        estPublieCatalogue: true,
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    if (formation.organizationId !== organization.id) {
      return NextResponse.json(
        { error: "Cette formation n'appartient pas à cette organisation" },
        { status: 400 }
      );
    }

    if (!formation.estPublieCatalogue) {
      return NextResponse.json(
        { error: "Cette formation n'est pas disponible à l'inscription" },
        { status: 403 }
      );
    }

    // Vérifier si une pré-inscription existe déjà pour cet email et cette formation
    const existingPreInscription = await prisma.preInscription.findFirst({
      where: {
        email: data.email,
        formationId: data.formationId,
        statut: { in: ["NOUVELLE", "EN_TRAITEMENT"] },
      },
    });

    if (existingPreInscription) {
      return NextResponse.json(
        {
          error: "Une pré-inscription est déjà en cours pour cette formation avec cet email",
          preInscriptionId: existingPreInscription.id,
        },
        { status: 409 }
      );
    }

    // Récupérer les métadonnées de la requête
    const ipAddress = request.headers.get("x-forwarded-for") ||
                      request.headers.get("x-real-ip") ||
                      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const sourceUrl = request.headers.get("referer") || undefined;

    // Correction 395: Construire les informations entreprise si profil entreprise
    let entrepriseInfo = data.entreprise;
    let contraintesData = data.contraintes;

    if (data.profileType === "entreprise") {
      // Stocker les infos entreprise dans le champ entreprise
      entrepriseInfo = data.raisonSociale || data.entreprise;

      // Stocker les apprenants dans le champ contraintes (format JSON)
      if (data.apprenants && data.apprenants.length > 0) {
        const apprenantsText = data.apprenants.map((a, i) =>
          `Apprenant ${i + 1}: ${a.prenom} ${a.nom} (${a.email})${a.telephone ? ` - Tél: ${a.telephone}` : ''}${a.poste ? ` - Poste: ${a.poste}` : ''}`
        ).join('\n');
        contraintesData = `[APPRENANTS À FORMER]\n${apprenantsText}${data.contraintes ? `\n\n[CONTRAINTES]\n${data.contraintes}` : ''}`;
      }
    }

    // Créer la pré-inscription
    const preInscription = await prisma.preInscription.create({
      data: {
        organizationId: organization.id,
        formationId: data.formationId,

        // Partie 1 : Analyse du besoin
        objectifsProfessionnels: data.objectifsProfessionnels,
        contexte: data.contexte,
        experiencePrealable: data.experiencePrealable,
        attentesSpecifiques: data.attentesSpecifiques,
        contraintes: contraintesData,

        // Partie 2 : Fiche de renseignements
        civilite: data.civilite,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        lieuNaissance: data.lieuNaissance,

        email: data.email,
        telephone: data.telephone,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        pays: data.pays,

        situationProfessionnelle: data.situationProfessionnelle,
        entreprise: entrepriseInfo,
        poste: data.poste,
        siret: data.siret,

        // Handicap (Qualiopi obligatoire)
        situationHandicap: data.situationHandicap,
        besoinsAmenagements: data.besoinsAmenagements,

        // Financement
        modeFinancement: data.modeFinancement,
        financeurNom: data.financeurNom,
        commentaireFinancement: data.commentaireFinancement,

        // Metadata
        statut: "NOUVELLE",
        sourceUrl,
        ipAddress,
        userAgent,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        statut: true,
        createdAt: true,
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    // ===========================================
    // ENVOI DES EMAILS
    // ===========================================

    // Données communes pour les emails
    const orgDisplayName = organization.nomCommercial || organization.name;

    // 1. Email de confirmation au prospect
    try {
      const confirmationEmail = generatePreInscriptionConfirmationEmail({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        formationTitre: formation.titre,
        organizationName: orgDisplayName,
        organizationLogo: organization.logo,
        organizationEmail: organization.email,
        organizationTelephone: organization.telephone,
        primaryColor: organization.primaryColor || undefined,
      });

      await sendEmail({
        to: data.email,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
        text: confirmationEmail.text,
      }, organization.id);

      console.log(`[PRE-INSCRIPTION] Email de confirmation envoyé à ${data.email}`);
    } catch (emailError) {
      console.error("[PRE-INSCRIPTION] Erreur envoi email confirmation:", emailError);
      // On ne bloque pas la création de la pré-inscription si l'email échoue
    }

    // 2. Email de notification à l'organisation
    if (organization.email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.workbots.fr";
        const notificationEmail = generateOrganizationNotificationEmail({
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          telephone: data.telephone,
          formationTitre: formation.titre,
          organizationName: orgDisplayName,
          organizationLogo: organization.logo,
          primaryColor: organization.primaryColor || undefined,
          preInscriptionId: preInscription.id,
          situationProfessionnelle: data.situationProfessionnelle,
          situationHandicap: data.situationHandicap,
          modeFinancement: data.modeFinancement,
          objectifsProfessionnels: data.objectifsProfessionnels,
          adminUrl: `${baseUrl}/pre-inscriptions?id=${preInscription.id}`,
        });

        await sendEmail({
          to: organization.email,
          subject: notificationEmail.subject,
          html: notificationEmail.html,
          text: notificationEmail.text,
        }, organization.id);

        console.log(`[PRE-INSCRIPTION] Notification envoyée à l'organisation ${organization.email}`);
      } catch (emailError) {
        console.error("[PRE-INSCRIPTION] Erreur envoi notification organisation:", emailError);
      }
    }

    // 3. Créer une notification interne dans le SaaS
    try {
      await notifyPreInscription({
        organizationId: organization.id,
        preInscriptionId: preInscription.id,
        prenom: data.prenom,
        nom: data.nom,
        formationTitre: formation.titre,
        situationHandicap: data.situationHandicap,
      });
      console.log(`[PRE-INSCRIPTION] Notification interne créée`);
    } catch (notifError) {
      console.error("[PRE-INSCRIPTION] Erreur création notification interne:", notifError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Votre pré-inscription a été enregistrée avec succès",
        preInscription: {
          id: preInscription.id,
          nom: preInscription.nom,
          prenom: preInscription.prenom,
          email: preInscription.email,
          statut: preInscription.statut,
          formation: { id: formation.id, titre: formation.titre },
          createdAt: preInscription.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur API pré-inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la pré-inscription" },
      { status: 500 }
    );
  }
}

// GET pour vérifier le statut d'une pré-inscription
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json(
        { error: "Paramètre 'id' ou 'email' requis" },
        { status: 400 }
      );
    }

    const whereClause: Record<string, unknown> = {};
    if (id) whereClause.id = id;
    if (email) whereClause.email = email;

    const preInscriptions = await prisma.preInscription.findMany({
      where: whereClause,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        statut: true,
        createdAt: true,
        traiteeAt: true,
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        organization: {
          select: {
            name: true,
            nomCommercial: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      preInscriptions: preInscriptions.map((pi) => ({
        id: pi.id,
        nom: pi.nom,
        prenom: pi.prenom,
        email: pi.email,
        statut: pi.statut,
        formation: pi.formation.titre,
        organization: pi.organization.nomCommercial || pi.organization.name,
        createdAt: pi.createdAt,
        traiteeAt: pi.traiteeAt,
      })),
    });
  } catch (error) {
    console.error("Erreur API vérification pré-inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
