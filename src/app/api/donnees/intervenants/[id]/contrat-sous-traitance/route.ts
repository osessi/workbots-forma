// ===========================================
// API CONTRAT DE SOUS-TRAITANCE - IND 27
// ===========================================
// POST /api/donnees/intervenants/[id]/contrat-sous-traitance
// Génère un contrat de sous-traitance pour un intervenant et l'envoie pour signature

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth";

// POST - Générer et envoyer le contrat de sous-traitance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer l'intervenant
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        isActive: true,
      },
    });

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    if (!intervenant.email) {
      return NextResponse.json(
        { error: "L'intervenant doit avoir une adresse email pour recevoir le contrat" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation pour les informations de l'organisme
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      sessionId, // Session concernée (optionnel)
      montant, // Montant de la prestation
      dateDebut, // Date de début de la prestation
      dateFin, // Date de fin de la prestation
      description, // Description de la prestation
      conditions, // Conditions particulières
      sendNow = true, // Envoyer maintenant pour signature
    } = body;

    // Récupérer la session si spécifiée
    let formation: { titre: string } | null = null;
    if (sessionId) {
      const sessionData = await prisma.session.findFirst({
        where: {
          id: sessionId,
          organizationId: user.organizationId,
        },
        include: {
          formation: true,
        },
      });
      if (sessionData) {
        formation = { titre: sessionData.formation.titre };
      }
    }

    // Générer le contenu HTML du contrat
    const contratHtml = generateContratHtml({
      organization,
      intervenant,
      formation,
      montant,
      dateDebut,
      dateFin,
      description,
      conditions,
    });

    // Générer un token unique pour la signature
    const token = crypto.randomUUID();

    // Calculer la date d'expiration (30 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Créer le document de signature
    const signatureDocument = await prisma.signatureDocument.create({
      data: {
        titre: `Contrat de sous-traitance - ${intervenant.prenom} ${intervenant.nom}`,
        documentType: "CONTRAT_SOUS_TRAITANCE",
        contenuHtml: contratHtml,
        destinataireNom: `${intervenant.prenom} ${intervenant.nom}`,
        destinataireEmail: intervenant.email.toLowerCase(),
        destinataireTel: intervenant.telephone,
        sessionId: sessionId || null,
        authMethod: "EMAIL_CODE",
        expiresAt,
        token,
        organizationId: user.organizationId,
        status: sendNow ? "PENDING_SIGNATURE" : "DRAFT",
        sentAt: sendNow ? new Date() : null,
        sentBy: sendNow ? user.id : null,
      },
    });

    // Si sendNow, envoyer l'email de signature
    if (sendNow) {
      // Appeler l'API d'envoi
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/api/signatures/${signatureDocument.id}/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cookie": request.headers.get("cookie") || "",
          },
        });
      } catch (sendError) {
        console.error("Erreur envoi email signature:", sendError);
        // On continue quand même, le document est créé
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: signatureDocument.id,
        token: signatureDocument.token,
        status: signatureDocument.status,
        signatureUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/signer/${signatureDocument.token}`,
        expiresAt: signatureDocument.expiresAt,
      },
      intervenant: {
        id: intervenant.id,
        nom: intervenant.nom,
        prenom: intervenant.prenom,
        email: intervenant.email,
      },
      message: sendNow
        ? `Contrat envoyé à ${intervenant.email} pour signature`
        : "Contrat créé en brouillon",
    });
  } catch (error) {
    console.error("Erreur génération contrat sous-traitance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du contrat" },
      { status: 500 }
    );
  }
}

// GET - Récupérer les contrats de sous-traitance d'un intervenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer l'intervenant pour avoir son email
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
      },
    });

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    if (!intervenant.email) {
      return NextResponse.json({ contrats: [] });
    }

    // Récupérer les contrats de sous-traitance associés
    const contrats = await prisma.signatureDocument.findMany({
      where: {
        organizationId: user.organizationId,
        documentType: "CONTRAT_SOUS_TRAITANCE",
        destinataireEmail: intervenant.email.toLowerCase(),
      },
      include: {
        signatures: {
          select: {
            id: true,
            signedAt: true,
          },
        },
        session: {
          select: {
            id: true,
            formation: {
              select: {
                titre: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      contrats: contrats.map(c => ({
        id: c.id,
        titre: c.titre,
        status: c.status,
        createdAt: c.createdAt,
        sentAt: c.sentAt,
        expiresAt: c.expiresAt,
        isSigned: c.signatures.length > 0,
        signedAt: c.signatures[0]?.signedAt || null,
        session: c.session,
        signatureUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/signer/${c.token}`,
      })),
    });
  } catch (error) {
    console.error("Erreur récupération contrats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des contrats" },
      { status: 500 }
    );
  }
}

// Fonction pour générer le HTML du contrat
function generateContratHtml(data: {
  organization: {
    name: string;
    siret: string | null;
    numeroFormateur: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
    representantNom: string | null;
    representantPrenom: string | null;
    representantFonction: string | null;
  };
  intervenant: {
    nom: string;
    prenom: string;
    structure: string | null;
    structureSiret: string | null;
    numeroDeclarationActivite: string | null;
    email: string | null;
    telephone: string | null;
  };
  formation: {
    titre: string;
  } | null;
  montant?: number;
  dateDebut?: string;
  dateFin?: string;
  description?: string;
  conditions?: string;
}): string {
  const { organization, intervenant, formation, montant, dateDebut, dateFin, description, conditions } = data;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "[À compléter]";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const today = new Date();

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6;">
      <h1 style="text-align: center; color: #1a1a2e; margin-bottom: 30px; border-bottom: 2px solid #4277FF; padding-bottom: 15px;">
        CONTRAT DE SOUS-TRAITANCE
      </h1>
      <p style="text-align: center; color: #666; margin-bottom: 40px;">
        Conformément à l'indicateur 27 du référentiel Qualiopi
      </p>

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 30px;">
        ENTRE LES SOUSSIGNÉS
      </h2>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1a1a2e;">L'ORGANISME DE FORMATION (Donneur d'ordre)</h3>
        <p><strong>${organization.name}</strong></p>
        <p>SIRET : ${organization.siret || "[À compléter]"}</p>
        <p>N° de déclaration d'activité : ${organization.numeroFormateur || "[À compléter]"}</p>
        <p>Adresse : ${organization.adresse || ""} ${organization.codePostal || ""} ${organization.ville || ""}</p>
        <p>Représenté par : ${organization.representantPrenom || ""} ${organization.representantNom || ""}, ${organization.representantFonction || "Responsable"}</p>
        <p style="margin-bottom: 0;">Ci-après dénommé <strong>"Le Donneur d'ordre"</strong></p>
      </div>

      <p style="text-align: center; font-weight: bold; font-size: 1.2em; margin: 20px 0;">ET</p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1a1a2e;">LE SOUS-TRAITANT</h3>
        <p><strong>${intervenant.structure || `${intervenant.prenom} ${intervenant.nom}`}</strong></p>
        ${intervenant.structureSiret ? `<p>SIRET : ${intervenant.structureSiret}</p>` : ""}
        ${intervenant.numeroDeclarationActivite ? `<p>N° de déclaration d'activité : ${intervenant.numeroDeclarationActivite}</p>` : ""}
        <p>Représenté par : ${intervenant.prenom} ${intervenant.nom}</p>
        <p>Email : ${intervenant.email || "[À compléter]"}</p>
        ${intervenant.telephone ? `<p>Téléphone : ${intervenant.telephone}</p>` : ""}
        <p style="margin-bottom: 0;">Ci-après dénommé <strong>"Le Sous-traitant"</strong></p>
      </div>

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 1 - OBJET DU CONTRAT
      </h2>
      <p>
        Le Donneur d'ordre confie au Sous-traitant, qui accepte, la réalisation de prestations de formation
        dans le cadre de son activité d'organisme de formation.
      </p>
      ${formation ? `
      <p><strong>Formation concernée :</strong> ${formation.titre}</p>
      ` : ""}
      ${description ? `
      <p><strong>Description de la prestation :</strong></p>
      <p style="background: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px;">
        ${description}
      </p>
      ` : ""}

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 2 - DURÉE
      </h2>
      <p>
        Le présent contrat prend effet à compter du <strong>${formatDate(dateDebut)}</strong>
        et prend fin le <strong>${formatDate(dateFin)}</strong>.
      </p>

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 3 - OBLIGATIONS DU SOUS-TRAITANT
      </h2>
      <p>Le Sous-traitant s'engage à :</p>
      <ul>
        <li>Respecter le programme, les objectifs pédagogiques et les méthodes définies par le Donneur d'ordre</li>
        <li>Garantir la qualité de ses prestations conformément aux exigences Qualiopi</li>
        <li>Transmettre tous les documents nécessaires au suivi de la formation (émargements, évaluations)</li>
        <li>Informer immédiatement le Donneur d'ordre de tout incident susceptible d'affecter la prestation</li>
        <li>Respecter la confidentialité des informations relatives aux stagiaires et au Donneur d'ordre</li>
        <li>Fournir les justificatifs de ses compétences et qualifications</li>
        <li>Ne pas céder ni sous-traiter tout ou partie du présent contrat sans accord écrit préalable</li>
      </ul>

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 4 - OBLIGATIONS DU DONNEUR D'ORDRE
      </h2>
      <p>Le Donneur d'ordre s'engage à :</p>
      <ul>
        <li>Fournir au Sous-traitant tous les éléments nécessaires à la réalisation de la prestation</li>
        <li>Informer le Sous-traitant de la politique qualité de l'organisme</li>
        <li>Mettre à disposition les moyens matériels et logistiques convenus</li>
        <li>Régler les prestations dans les conditions prévues au présent contrat</li>
      </ul>

      ${montant ? `
      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 5 - CONDITIONS FINANCIÈRES
      </h2>
      <p>
        En contrepartie de la réalisation des prestations objet du présent contrat, le Donneur d'ordre
        versera au Sous-traitant la somme de <strong>${montant.toLocaleString("fr-FR")} €</strong>
        ${montant < 1000 ? "TTC" : "HT"}.
      </p>
      <p>Le règlement sera effectué dans un délai de 30 jours à compter de la réception de la facture.</p>
      ` : ""}

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 6 - ASSURANCE
      </h2>
      <p>
        Le Sous-traitant déclare avoir souscrit une assurance responsabilité civile professionnelle
        couvrant les dommages pouvant résulter de ses activités.
      </p>

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 7 - RÉSILIATION
      </h2>
      <p>
        Chacune des parties peut résilier le présent contrat en cas de manquement grave de l'autre partie
        à ses obligations, après mise en demeure restée sans effet pendant 15 jours.
      </p>

      ${conditions ? `
      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE 8 - CONDITIONS PARTICULIÈRES
      </h2>
      <p style="background: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px;">
        ${conditions}
      </p>
      ` : ""}

      <h2 style="color: #1a1a2e; border-left: 4px solid #4277FF; padding-left: 15px; margin-top: 40px;">
        ARTICLE ${conditions ? "9" : "8"} - DROIT APPLICABLE
      </h2>
      <p>
        Le présent contrat est soumis au droit français. En cas de litige, les parties s'engagent
        à rechercher une solution amiable avant toute action judiciaire.
      </p>

      <div style="margin-top: 50px; border-top: 1px solid #e0e0e0; padding-top: 30px;">
        <p style="text-align: center; color: #666;">
          Fait en deux exemplaires originaux, à ${organization.ville || "[Ville]"}, le ${formatDate(today)}
        </p>

        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 45%; text-align: center;">
            <p style="border-top: 1px solid #333; padding-top: 10px;">
              <strong>Pour le Donneur d'ordre</strong><br/>
              ${organization.representantPrenom || ""} ${organization.representantNom || ""}<br/>
              ${organization.representantFonction || ""}
            </p>
          </div>
          <div style="width: 45%; text-align: center;">
            <p style="border-top: 1px solid #333; padding-top: 10px;">
              <strong>Le Sous-traitant</strong><br/>
              ${intervenant.prenom} ${intervenant.nom}<br/>
              <em>(Signature électronique)</em>
            </p>
          </div>
        </div>
      </div>

      <p style="margin-top: 40px; font-size: 0.85em; color: #666; text-align: center; font-style: italic;">
        Document généré conformément à l'indicateur 27 du référentiel Qualiopi.<br/>
        Ce contrat définit les conditions de collaboration entre le donneur d'ordre et le sous-traitant.
      </p>
    </div>
  `;
}
