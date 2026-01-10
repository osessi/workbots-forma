// ===========================================
// SERVICE EMAIL - Envoi d'emails
// ===========================================
// Service centralisé pour l'envoi d'emails
// Supporte Resend comme provider (extensible à d'autres)
// Stocke tous les emails en BDD pour traçabilité Qualiopi

import { prisma } from "@/lib/db/prisma";
import { SentEmailType, SentEmailStatus } from "@prisma/client";

// Types
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Options étendues pour le stockage en BDD
interface EmailSendOptions extends EmailOptions {
  // Type d'email pour catégorisation
  type?: SentEmailType;
  // Nom du destinataire pour affichage
  toName?: string;
  // Références vers entités liées (pour recherche/filtrage)
  apprenantId?: string;
  sessionId?: string;
  formationId?: string;
  preInscriptionId?: string;
  signatureDocumentId?: string;
  // User qui envoie (si pas automatique)
  sentByUserId?: string;
  // Infos techniques (pour audit)
  ipAddress?: string;
  userAgent?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentEmailId?: string; // ID de l'enregistrement en BDD
}

// Récupérer la configuration email de l'organisation ou globale
async function getEmailConfig(organizationId?: string): Promise<{
  provider: string;
  apiKey: string;
  fromEmail: string;
  fromName: string;
} | null> {
  try {
    // D'abord essayer la config de l'organisation
    if (organizationId) {
      const orgConfig = await prisma.globalConfig.findFirst({
        where: {
          key: `email_config_${organizationId}`,
        },
      });
      if (orgConfig) {
        return JSON.parse(orgConfig.value as string);
      }
    }

    // Sinon, utiliser la config globale
    const globalConfig = await prisma.globalConfig.findFirst({
      where: {
        key: "email_config_global",
      },
    });

    if (globalConfig) {
      return JSON.parse(globalConfig.value as string);
    }

    // Config par défaut depuis les variables d'environnement
    if (process.env.RESEND_API_KEY) {
      return {
        provider: "resend",
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.EMAIL_FROM || "noreply@workbots.fr",
        fromName: process.env.EMAIL_FROM_NAME || "WORKBOTS Formation",
      };
    }

    return null;
  } catch (error) {
    console.error("Erreur récupération config email:", error);
    return null;
  }
}

// Envoyer via Resend
async function sendViaResend(options: EmailOptions, config: { apiKey: string; fromEmail: string; fromName: string }): Promise<EmailResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || `${config.fromName} <${config.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
        })),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, messageId: data.id };
    } else {
      return { success: false, error: data.message || "Erreur Resend" };
    }
  } catch (error) {
    console.error("Erreur Resend:", error);
    return { success: false, error: "Erreur lors de l'envoi via Resend" };
  }
}

// ===========================================
// DÉTECTION AUTOMATIQUE DU TYPE D'EMAIL
// ===========================================

function detectEmailType(subject: string): SentEmailType {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes("code de vérification")) return "VERIFICATION_CODE";
  if (lowerSubject.includes("document à signer")) return "SIGNATURE_INVITATION";
  if (lowerSubject.includes("bienvenue") || lowerSubject.includes("espace apprenant")) return "INVITATION_APPRENANT";
  if (lowerSubject.includes("pré-inscription") || lowerSubject.includes("pre-inscription")) return "PRE_INSCRIPTION";
  if (lowerSubject.includes("nouvelle pré-inscription")) return "NOTIFICATION_ADMIN";
  if (lowerSubject.includes("convocation")) return "CONVOCATION";
  if (lowerSubject.includes("attestation")) return "ATTESTATION";
  if (lowerSubject.includes("convention")) return "CONVENTION";
  if (lowerSubject.includes("rappel")) return "RAPPEL";
  if (lowerSubject.includes("document")) return "DOCUMENT";

  return "OTHER";
}

// ===========================================
// STOCKAGE EN BASE DE DONNÉES
// ===========================================

async function storeEmailInDatabase(
  options: EmailSendOptions,
  organizationId: string,
  status: SentEmailStatus,
  resendId?: string,
  errorMessage?: string
): Promise<string | null> {
  try {
    const toEmail = Array.isArray(options.to) ? options.to[0] : options.to;
    const ccEmails = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : [];
    const bccEmails = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : [];

    // Préparer les métadonnées des pièces jointes (sans le contenu)
    const attachmentsMeta = options.attachments?.map(a => ({
      filename: a.filename,
      contentType: a.contentType || "application/octet-stream",
      size: typeof a.content === "string" ? a.content.length : a.content.length,
    }));

    const sentEmail = await prisma.sentEmail.create({
      data: {
        organizationId,
        toEmail,
        toName: options.toName,
        ccEmails,
        bccEmails,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        type: options.type || detectEmailType(options.subject),
        status,
        resendId,
        apprenantId: options.apprenantId,
        sessionId: options.sessionId,
        formationId: options.formationId,
        preInscriptionId: options.preInscriptionId,
        signatureDocumentId: options.signatureDocumentId,
        attachments: attachmentsMeta ? JSON.parse(JSON.stringify(attachmentsMeta)) : undefined,
        sentByUserId: options.sentByUserId,
        sentBySystem: !options.sentByUserId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        errorMessage,
      },
    });

    return sentEmail.id;
  } catch (error) {
    console.error("[EMAIL] Erreur stockage en BDD:", error);
    return null;
  }
}

// Store pour les emails en développement (legacy, gardé pour compatibilité)
declare global {
  // eslint-disable-next-line no-var
  var devEmails: Array<{
    id: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    sentAt: Date;
    organizationId?: string;
    type?: string;
  }>;
}

if (!global.devEmails) {
  global.devEmails = [];
}

// Fonction pour stocker un email en développement (legacy)
function storeDevEmail(options: EmailOptions, organizationId?: string) {
  if (process.env.NODE_ENV !== "production") {
    global.devEmails.push({
      id: Math.random().toString(36).substring(7),
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      sentAt: new Date(),
      organizationId,
      type: detectEmailType(options.subject),
    });

    // Garder seulement les 100 derniers
    if (global.devEmails.length > 100) {
      global.devEmails = global.devEmails.slice(-100);
    }
  }
}

// ===========================================
// FONCTION PRINCIPALE D'ENVOI D'EMAIL
// ===========================================

export async function sendEmail(
  options: EmailOptions | EmailSendOptions,
  organizationId?: string
): Promise<EmailResult> {
  // Stocker également en mémoire pour le dev email viewer (legacy)
  storeDevEmail(options, organizationId);

  const config = await getEmailConfig(organizationId);

  // Convertir en EmailSendOptions pour avoir accès aux propriétés étendues
  const extendedOptions = options as EmailSendOptions;

  if (!config) {
    // Mode développement sans config : stocker en BDD avec statut SENT
    console.log("===========================================");
    console.log("[EMAIL DEV MODE] Email stocké (pas de config SMTP)");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("From:", options.from || "noreply@workbots.fr");
    console.log("-------------------------------------------");
    console.log("Voir les emails: /emails");
    console.log("===========================================");

    // Stocker en BDD même en dev
    let sentEmailId: string | null = null;
    if (organizationId) {
      sentEmailId = await storeEmailInDatabase(extendedOptions, organizationId, "SENT");
    }

    return {
      success: true,
      messageId: "dev-mode-" + Date.now(),
      sentEmailId: sentEmailId || undefined
    };
  }

  // Envoyer via le provider configuré
  let result: EmailResult;

  switch (config.provider) {
    case "resend":
      result = await sendViaResend(options, config);
      break;
    default:
      console.warn(`Provider email inconnu: ${config.provider}`);
      result = { success: false, error: `Provider email inconnu: ${config.provider}` };
  }

  // Stocker en BDD après envoi (en production)
  if (organizationId) {
    const status: SentEmailStatus = result.success ? "SENT" : "FAILED";
    const sentEmailId = await storeEmailInDatabase(
      extendedOptions,
      organizationId,
      status,
      result.messageId,
      result.error
    );
    result.sentEmailId = sentEmailId || undefined;
  }

  return result;
}

// ===========================================
// TEMPLATES D'EMAILS PRÉ-INSCRIPTIONS
// ===========================================

interface PreInscriptionEmailData {
  prenom: string;
  nom: string;
  email: string;
  formationTitre: string;
  organizationName: string;
  organizationLogo?: string | null;
  organizationEmail?: string | null;
  organizationTelephone?: string | null;
  primaryColor?: string;
}

// Email de confirmation de pré-inscription (pour le prospect)
export function generatePreInscriptionConfirmationEmail(data: PreInscriptionEmailData): { subject: string; html: string; text: string } {
  const primaryColor = data.primaryColor || "#4277FF";

  const subject = `Confirmation de votre pré-inscription - ${data.formationTitre}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de pré-inscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 3px solid ${primaryColor};">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 60px; max-width: 200px;">`
                : `<h1 style="margin: 0; color: ${primaryColor}; font-size: 24px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                Bonjour ${data.prenom} ${data.nom},
              </h2>

              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Nous avons bien reçu votre demande de pré-inscription à la formation :
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                  ${data.formationTitre}
                </h3>
              </div>

              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Notre équipe va étudier votre demande et vous recontactera dans les plus brefs délais pour :
              </p>

              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #4a4a4a; font-size: 16px; line-height: 1.8;">
                <li>Vérifier l'adéquation de la formation avec vos objectifs</li>
                <li>Discuter des modalités de financement</li>
                <li>Répondre à toutes vos questions</li>
                <li>Planifier votre inscription définitive</li>
              </ul>

              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; color: #0d6efd; font-size: 14px;">
                  <strong>💡 Information :</strong> Conformément à nos engagements qualité (Qualiopi), nous analyserons attentivement votre profil et vos besoins pour vous proposer un accompagnement personnalisé.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">
                ${data.organizationName}
              </p>
              ${data.organizationEmail ? `
                <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px;">
                  📧 ${data.organizationEmail}
                </p>
              ` : ""}
              ${data.organizationTelephone ? `
                <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px;">
                  📞 ${data.organizationTelephone}
                </p>
              ` : ""}
              <p style="margin: 20px 0 0 0; color: #adb5bd; font-size: 12px;">
                Cet email a été envoyé automatiquement suite à votre demande de pré-inscription.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Bonjour ${data.prenom} ${data.nom},

Nous avons bien reçu votre demande de pré-inscription à la formation :
${data.formationTitre}

Notre équipe va étudier votre demande et vous recontactera dans les plus brefs délais pour :
- Vérifier l'adéquation de la formation avec vos objectifs
- Discuter des modalités de financement
- Répondre à toutes vos questions
- Planifier votre inscription définitive

Conformément à nos engagements qualité (Qualiopi), nous analyserons attentivement votre profil et vos besoins pour vous proposer un accompagnement personnalisé.

---
${data.organizationName}
${data.organizationEmail ? `Email: ${data.organizationEmail}` : ""}
${data.organizationTelephone ? `Tél: ${data.organizationTelephone}` : ""}
`;

  return { subject, html, text };
}

// Email de notification pour l'organisation (nouvelle pré-inscription)
interface OrganizationNotificationData extends PreInscriptionEmailData {
  preInscriptionId: string;
  situationProfessionnelle?: string;
  situationHandicap: boolean;
  modeFinancement?: string;
  telephone?: string;
  objectifsProfessionnels?: string;
  adminUrl: string;
}

export function generateOrganizationNotificationEmail(data: OrganizationNotificationData): { subject: string; html: string; text: string } {
  const primaryColor = data.primaryColor || "#4277FF";

  const subject = `🔔 Nouvelle pré-inscription - ${data.prenom} ${data.nom} - ${data.formationTitre}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle pré-inscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: ${primaryColor}; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🔔 Nouvelle pré-inscription
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 20px;">
                  ${data.formationTitre}
                </h2>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  Reçue le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                Informations du prospect
              </h3>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px; width: 40%;">Nom complet</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-size: 14px; font-weight: 500;">${data.prenom} ${data.nom}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px;">Email</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-size: 14px;"><a href="mailto:${data.email}" style="color: ${primaryColor};">${data.email}</a></td>
                </tr>
                ${data.telephone ? `
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px;">Téléphone</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-size: 14px;"><a href="tel:${data.telephone}" style="color: ${primaryColor};">${data.telephone}</a></td>
                </tr>
                ` : ""}
                ${data.situationProfessionnelle ? `
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px;">Situation</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-size: 14px;">${data.situationProfessionnelle}</td>
                </tr>
                ` : ""}
                ${data.modeFinancement ? `
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px;">Financement</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-size: 14px;">${data.modeFinancement}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px;">Situation handicap</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-size: 14px;">
                    ${data.situationHandicap
                      ? '<span style="background-color: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 4px; font-size: 12px;">⚠️ Oui - Aménagements à prévoir</span>'
                      : '<span style="color: #6c757d;">Non</span>'
                    }
                  </td>
                </tr>
              </table>

              ${data.objectifsProfessionnels ? `
              <div style="margin-top: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                  Objectifs professionnels
                </h3>
                <p style="margin: 0; color: #4a4a4a; font-size: 14px; line-height: 1.6; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                  ${data.objectifsProfessionnels}
                </p>
              </div>
              ` : ""}

              <div style="margin-top: 30px; text-align: center;">
                <a href="${data.adminUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Traiter cette pré-inscription
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                Email automatique - Système WORKBOTS Formation
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
🔔 NOUVELLE PRÉ-INSCRIPTION

Formation: ${data.formationTitre}
Reçue le: ${new Date().toLocaleDateString("fr-FR")}

INFORMATIONS DU PROSPECT
------------------------
Nom: ${data.prenom} ${data.nom}
Email: ${data.email}
${data.telephone ? `Téléphone: ${data.telephone}` : ""}
${data.situationProfessionnelle ? `Situation: ${data.situationProfessionnelle}` : ""}
${data.modeFinancement ? `Financement: ${data.modeFinancement}` : ""}
Situation handicap: ${data.situationHandicap ? "Oui - Aménagements à prévoir" : "Non"}

${data.objectifsProfessionnels ? `OBJECTIFS PROFESSIONNELS\n${data.objectifsProfessionnels}` : ""}

Pour traiter cette pré-inscription: ${data.adminUrl}
`;

  return { subject, html, text };
}

// ===========================================
// EMAIL INVITATION ESPACE APPRENANT
// ===========================================
// Envoyé quand une pré-inscription est acceptée

interface InvitationApprenantEmailData {
  prenom: string;
  nom: string;
  email: string;
  formationTitre: string;
  organizationName: string;
  organizationLogo?: string | null;
  organizationEmail?: string | null;
  organizationTelephone?: string | null;
  primaryColor?: string;
  espaceApprenantUrl: string;
}

export function generateInvitationApprenantEmail(data: InvitationApprenantEmailData) {
  const color = data.primaryColor || "#4277FF";

  const subject = `🎓 Bienvenue ! Votre accès à l'espace apprenant - ${data.organizationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur votre espace apprenant</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 60px; max-width: 200px;">`
                : `<h1 style="color: white; margin: 0; font-size: 24px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Badge de succès -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #d4edda; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🎉</span>
              </div>
              <h2 style="color: #28a745; margin: 0 0 10px; font-size: 28px;">Félicitations ${data.prenom} !</h2>
              <p style="color: #6c757d; margin: 0; font-size: 16px;">Votre inscription a été validée</p>
            </td>
          </tr>

          <!-- Message principal -->
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <p style="margin: 0 0 15px; color: #495057; font-size: 16px; line-height: 1.6;">
                  Votre demande de pré-inscription à la formation <strong style="color: ${color};">"${data.formationTitre}"</strong> a été acceptée par ${data.organizationName}.
                </p>
                <p style="margin: 0; color: #495057; font-size: 16px; line-height: 1.6;">
                  Vous avez désormais accès à votre <strong>espace apprenant personnel</strong>, où vous pourrez :
                </p>
              </div>

              <!-- Fonctionnalités de l'espace apprenant -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 20px;">📚</span>
                        </td>
                        <td style="color: #495057; font-size: 15px; line-height: 1.5;">
                          <strong>Consulter</strong> les détails de votre formation et le programme
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 20px;">📅</span>
                        </td>
                        <td style="color: #495057; font-size: 15px; line-height: 1.5;">
                          <strong>Voir</strong> les dates et horaires de vos sessions
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 20px;">📄</span>
                        </td>
                        <td style="color: #495057; font-size: 15px; line-height: 1.5;">
                          <strong>Télécharger</strong> vos documents (convocation, supports, attestations...)
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 20px;">✅</span>
                        </td>
                        <td style="color: #495057; font-size: 15px; line-height: 1.5;">
                          <strong>Émarger</strong> en ligne et suivre votre progression
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bouton CTA -->
          <tr>
            <td style="padding: 20px 40px 30px; text-align: center;">
              <a href="${data.espaceApprenantUrl}" style="display: inline-block; background-color: ${color}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px ${color}40;">
                Accéder à mon espace apprenant
              </a>
              <p style="margin: 15px 0 0; color: #adb5bd; font-size: 13px;">
                Ou copiez ce lien : ${data.espaceApprenantUrl}
              </p>
            </td>
          </tr>

          <!-- Infos de connexion -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #e8f4fd; border-left: 4px solid ${color}; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 8px; color: ${color}; font-weight: 600; font-size: 14px;">
                  💡 Pour vous connecter
                </p>
                <p style="margin: 0; color: #495057; font-size: 14px; line-height: 1.5;">
                  Utilisez votre adresse email <strong>${data.email}</strong> pour créer votre compte ou vous connecter si vous avez déjà un compte.
                </p>
              </div>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 15px; color: #6c757d; font-size: 14px; text-align: center;">
                Des questions ? Notre équipe est à votre disposition.
              </p>
              <div style="text-align: center;">
                ${data.organizationEmail
                  ? `<a href="mailto:${data.organizationEmail}" style="display: inline-block; margin: 0 10px; color: ${color}; text-decoration: none; font-size: 14px;">✉️ ${data.organizationEmail}</a>`
                  : ""
                }
                ${data.organizationTelephone
                  ? `<a href="tel:${data.organizationTelephone}" style="display: inline-block; margin: 0 10px; color: ${color}; text-decoration: none; font-size: 14px;">📞 ${data.organizationTelephone}</a>`
                  : ""
                }
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                ${data.organizationName} - Organisme de formation<br>
                Email automatique - Merci de ne pas répondre directement
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
🎓 BIENVENUE ${data.prenom.toUpperCase()} !

Votre inscription à la formation "${data.formationTitre}" a été validée par ${data.organizationName}.

VOTRE ESPACE APPRENANT
----------------------
Vous avez désormais accès à votre espace apprenant personnel où vous pourrez :
• Consulter les détails de votre formation
• Voir les dates et horaires de vos sessions
• Télécharger vos documents
• Émarger en ligne

🔗 Accéder à mon espace : ${data.espaceApprenantUrl}

Utilisez votre email ${data.email} pour vous connecter.

CONTACT
-------
${data.organizationEmail ? `Email: ${data.organizationEmail}` : ""}
${data.organizationTelephone ? `Téléphone: ${data.organizationTelephone}` : ""}

---
${data.organizationName}
`;

  return { subject, html, text };
}

// ===========================================
// EMAILS SIGNATURE ÉLECTRONIQUE
// ===========================================

// Email avec code de vérification pour signature
interface SignatureVerificationCodeData {
  destinataireNom: string;
  documentTitre: string;
  code: string;
  organizationName: string;
  organizationLogo?: string | null;
  primaryColor?: string;
}

export function generateSignatureVerificationCodeEmail(data: SignatureVerificationCodeData) {
  const color = data.primaryColor || "#4277FF";

  const subject = `Code de vérification pour signature - ${data.documentTitre}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 30px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 50px; max-width: 180px;">`
                : `<h1 style="color: white; margin: 0; font-size: 22px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 22px; text-align: center;">
                Code de vérification
              </h2>

              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6; text-align: center;">
                Bonjour ${data.destinataireNom},<br>
                Voici votre code pour signer le document :
              </p>

              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; text-align: center;">
                <strong>${data.documentTitre}</strong>
              </p>

              <!-- Code Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed ${color}; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">Votre code :</p>
                <p style="margin: 0; font-size: 42px; font-weight: bold; letter-spacing: 10px; color: ${color}; font-family: monospace;">
                  ${data.code}
                </p>
              </div>

              <p style="margin: 0; color: #dc3545; font-size: 14px; text-align: center;">
                ⏱️ Ce code expire dans <strong>5 minutes</strong>
              </p>

              <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin-top: 30px;">
                <p style="margin: 0; color: #856404; font-size: 13px; text-align: center;">
                  🔒 Si vous n'avez pas demandé ce code, veuillez ignorer cet email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                ${data.organizationName} - Signature électronique sécurisée
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
CODE DE VÉRIFICATION POUR SIGNATURE

Bonjour ${data.destinataireNom},

Voici votre code pour signer le document "${data.documentTitre}" :

🔐 CODE : ${data.code}

⏱️ Ce code expire dans 5 minutes.

Si vous n'avez pas demandé ce code, veuillez ignorer cet email.

---
${data.organizationName}
`;

  return { subject, html, text };
}

// Email d'invitation à signer un document
interface SignatureInvitationData {
  destinataireNom: string;
  destinataireEmail: string;
  documentTitre: string;
  documentType: string;
  signatureUrl: string;
  expiresAt?: Date | null;
  organizationName: string;
  organizationLogo?: string | null;
  primaryColor?: string;
}

export function generateSignatureInvitationEmail(data: SignatureInvitationData) {
  const color = data.primaryColor || "#4277FF";

  const subject = `Document à signer : ${data.documentTitre}`;

  const expirationText = data.expiresAt
    ? `Ce document doit être signé avant le <strong>${data.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>.`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document à signer</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 30px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 50px; max-width: 180px;">`
                : `<h1 style="color: white; margin: 0; font-size: 22px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 25px; color: #1a1a1a; font-size: 24px;">
                ✍️ Document à signer
              </h2>

              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Bonjour ${data.destinataireNom},
              </p>

              <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${data.organizationName} vous invite à signer le document suivant :
              </p>

              <!-- Document Info Box -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 18px;">
                  📄 ${data.documentTitre}
                </h3>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  Type : ${data.documentType}
                </p>
              </div>

              ${expirationText ? `
              <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 15px;">
                ${expirationText}
              </p>
              ` : ""}

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.signatureUrl}" style="display: inline-block; background-color: ${color}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px ${color}40;">
                  Signer le document
                </a>
              </div>

              <p style="margin: 0; color: #adb5bd; font-size: 13px; text-align: center;">
                Ou copiez ce lien dans votre navigateur :<br>
                <a href="${data.signatureUrl}" style="color: ${color}; word-break: break-all;">${data.signatureUrl}</a>
              </p>

              <div style="background-color: #e8f4fd; border-radius: 8px; padding: 15px; margin-top: 30px;">
                <p style="margin: 0; color: #0c5460; font-size: 13px;">
                  🔒 <strong>Signature électronique sécurisée</strong><br>
                  Un code de vérification vous sera envoyé par email lors de la signature.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 13px;">
                Cet email a été envoyé par ${data.organizationName}.
              </p>
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                Si vous n'êtes pas le destinataire prévu, veuillez ignorer cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
DOCUMENT À SIGNER

Bonjour ${data.destinataireNom},

${data.organizationName} vous invite à signer le document suivant :

📄 ${data.documentTitre}
Type : ${data.documentType}
${data.expiresAt ? `Date limite : ${data.expiresAt.toLocaleDateString("fr-FR")}` : ""}

🔗 Pour signer ce document, cliquez sur le lien suivant :
${data.signatureUrl}

Un code de vérification vous sera envoyé par email lors de la signature.

---
${data.organizationName}
`;

  return { subject, html, text };
}

// ===========================================
// EMAIL ENVOI DOCUMENT GÉNÉRIQUE
// ===========================================

interface DocumentSendEmailData {
  destinataireNom?: string;
  documentTitre: string;
  documentType: string;
  customSubject?: string;
  customMessage?: string;
  organizationName: string;
  organizationLogo?: string | null;
  primaryColor?: string;
}

export function generateDocumentSendEmail(data: DocumentSendEmailData) {
  const color = data.primaryColor || "#4277FF";

  const subject = data.customSubject || `Document : ${data.documentTitre}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 30px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 50px; max-width: 180px;">`
                : `<h1 style="color: white; margin: 0; font-size: 22px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${data.destinataireNom ? `
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Bonjour ${data.destinataireNom},
              </p>
              ` : ""}

              ${data.customMessage ? `
              <div style="margin-bottom: 25px; color: #4a4a4a; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                ${data.customMessage}
              </div>
              ` : `
              <p style="margin: 0 0 25px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Veuillez trouver ci-joint le document demandé.
              </p>
              `}

              <!-- Document Info Box -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 18px;">
                  📄 ${data.documentTitre}
                </h3>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  Type : ${data.documentType}
                </p>
              </div>

              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                Le document est disponible en pièce jointe de cet email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                ${data.organizationName} - Organisme de formation
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
${data.destinataireNom ? `Bonjour ${data.destinataireNom},` : ""}

${data.customMessage || "Veuillez trouver ci-joint le document demandé."}

📄 ${data.documentTitre}
Type : ${data.documentType}

Le document est disponible en pièce jointe de cet email.

---
${data.organizationName}
`;

  return { subject, html, text };
}

// ===========================================
// EMAIL CODE OTP APPRENANT
// ===========================================
// Code de connexion pour l'espace apprenant

interface ApprenantOTPEmailData {
  prenom: string;
  code: string;
  organizationName: string;
  organizationLogo?: string | null;
  primaryColor?: string;
  expiresInMinutes: number;
}

export function generateApprenantOTPEmail(data: ApprenantOTPEmailData) {
  const color = data.primaryColor || "#4277FF";

  const subject = `🔐 Votre code de connexion - ${data.organizationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de connexion</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 50px; max-width: 180px;">`
                : `<h1 style="color: white; margin: 0; font-size: 22px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Icône cadenas -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 70px; height: 70px; background: linear-gradient(135deg, ${color}15 0%, ${color}25 100%); border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">🔐</span>
              </div>
              <h2 style="color: #1a1a2e; margin: 0 0 8px; font-size: 24px; font-weight: 600;">
                Bonjour ${data.prenom} !
              </h2>
              <p style="color: #6c757d; margin: 0; font-size: 15px;">
                Voici votre code de connexion
              </p>
            </td>
          </tr>

          <!-- Code OTP -->
          <tr>
            <td style="padding: 10px 40px 30px; text-align: center;">
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 0 auto; max-width: 280px; border: 2px dashed ${color}40;">
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                  Code de vérification
                </p>
                <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; letter-spacing: 8px; color: ${color};">
                  ${data.code}
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <p style="margin: 0 0 15px; color: #495057; font-size: 14px; line-height: 1.6;">
                Entrez ce code sur la page de connexion pour accéder à votre espace apprenant.
              </p>
              <div style="display: inline-block; background-color: #fff3cd; border-radius: 8px; padding: 12px 20px;">
                <p style="margin: 0; color: #856404; font-size: 13px;">
                  ⏱️ Ce code expire dans <strong>${data.expiresInMinutes} minutes</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Sécurité -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                    <span style="font-size: 16px;">🔒</span>
                  </td>
                  <td>
                    <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.5;">
                      Si vous n'avez pas demandé ce code, ignorez simplement cet email.
                      Ne partagez jamais ce code avec qui que ce soit.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #1a1a2e; text-align: center;">
              <p style="margin: 0; color: #ffffff99; font-size: 12px;">
                ${data.organizationName} - Espace Apprenant
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Bonjour ${data.prenom},

Voici votre code de connexion pour accéder à votre espace apprenant :

🔐 ${data.code}

Ce code expire dans ${data.expiresInMinutes} minutes.

Entrez ce code sur la page de connexion pour accéder à votre espace.

Si vous n'avez pas demandé ce code, ignorez simplement cet email.

---
${data.organizationName} - Espace Apprenant
`;

  return { subject, html, text };
}

// ===========================================
// EMAIL INVITATION AVEC LIEN UNIQUE (Première connexion)
// ===========================================
// Envoyé quand une pré-inscription est acceptée

interface InvitationApprenantWithTokenData {
  prenom: string;
  nom: string;
  email: string;
  formationTitre: string;
  organizationName: string;
  organizationLogo?: string | null;
  organizationEmail?: string | null;
  organizationTelephone?: string | null;
  primaryColor?: string;
  magicLinkUrl: string; // Lien de connexion unique
}

export function generateInvitationApprenantWithTokenEmail(data: InvitationApprenantWithTokenData) {
  const color = data.primaryColor || "#4277FF";

  const subject = `🎓 Bienvenue ${data.prenom} ! Accédez à votre espace formation - ${data.organizationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur votre espace apprenant</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 35px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 60px; max-width: 200px;">`
                : `<h1 style="color: white; margin: 0; font-size: 24px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Badge de succès -->
          <tr>
            <td style="padding: 45px 40px 25px; text-align: center;">
              <div style="width: 90px; height: 90px; background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 50%; margin: 0 auto 25px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);">
                <span style="font-size: 45px;">🎉</span>
              </div>
              <h2 style="color: #28a745; margin: 0 0 10px; font-size: 28px; font-weight: 600;">
                Félicitations ${data.prenom} !
              </h2>
              <p style="color: #6c757d; margin: 0; font-size: 16px;">
                Votre inscription a été validée avec succès
              </p>
            </td>
          </tr>

          <!-- Formation -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <div style="background: linear-gradient(135deg, ${color}08 0%, ${color}15 100%); border-radius: 12px; padding: 20px; border-left: 4px solid ${color};">
                <p style="margin: 0 0 5px; color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                  Formation
                </p>
                <p style="margin: 0; color: #1a1a2e; font-size: 18px; font-weight: 600;">
                  ${data.formationTitre}
                </p>
              </div>
            </td>
          </tr>

          <!-- Message principal -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; color: #495057; font-size: 15px; line-height: 1.7;">
                Vous avez désormais accès à votre <strong>espace apprenant personnel</strong> où vous pourrez suivre votre formation, consulter vos documents et bien plus encore.
              </p>

              <!-- Fonctionnalités -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 35px; vertical-align: top;">
                          <span style="font-size: 18px;">📚</span>
                        </td>
                        <td style="color: #495057; font-size: 14px; line-height: 1.5;">
                          Accéder aux contenus de formation
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 35px; vertical-align: top;">
                          <span style="font-size: 18px;">📅</span>
                        </td>
                        <td style="color: #495057; font-size: 14px; line-height: 1.5;">
                          Consulter le calendrier des sessions
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 35px; vertical-align: top;">
                          <span style="font-size: 18px;">📄</span>
                        </td>
                        <td style="color: #495057; font-size: 14px; line-height: 1.5;">
                          Télécharger vos documents (attestations, conventions...)
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.magicLinkUrl}" style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px ${color}40;">
                      🚀 Accéder à mon espace
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info connexion -->
          <tr>
            <td style="padding: 25px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 35px; vertical-align: top; padding-top: 2px;">
                    <span style="font-size: 18px;">💡</span>
                  </td>
                  <td>
                    <p style="margin: 0 0 8px; color: #495057; font-size: 14px; font-weight: 600;">
                      Comment vous connecter ?
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.6;">
                      Cliquez sur le bouton ci-dessus pour votre première connexion.<br>
                      Pour vos prochaines connexions, utilisez simplement votre email <strong>${data.email}</strong> et recevez un code de connexion.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact -->
          ${data.organizationEmail || data.organizationTelephone ? `
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #495057; font-size: 13px; font-weight: 600;">
                Besoin d'aide ?
              </p>
              <p style="margin: 0; color: #6c757d; font-size: 13px;">
                ${data.organizationEmail ? `📧 ${data.organizationEmail}` : ""}
                ${data.organizationEmail && data.organizationTelephone ? " &nbsp;|&nbsp; " : ""}
                ${data.organizationTelephone ? `📞 ${data.organizationTelephone}` : ""}
              </p>
            </td>
          </tr>
          ` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #1a1a2e; text-align: center;">
              <p style="margin: 0 0 5px; color: #ffffff; font-size: 14px; font-weight: 500;">
                ${data.organizationName}
              </p>
              <p style="margin: 0; color: #ffffff80; font-size: 12px;">
                Organisme de formation
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
🎉 Félicitations ${data.prenom} !

Votre inscription à la formation "${data.formationTitre}" a été validée par ${data.organizationName}.

Vous avez désormais accès à votre espace apprenant personnel où vous pourrez :
- 📚 Accéder aux contenus de formation
- 📅 Consulter le calendrier des sessions
- 📄 Télécharger vos documents

🚀 Accéder à mon espace :
${data.magicLinkUrl}

💡 Pour vos prochaines connexions, utilisez simplement votre email (${data.email}) et recevez un code de connexion.

${data.organizationEmail || data.organizationTelephone ? `
Besoin d'aide ?
${data.organizationEmail ? `📧 ${data.organizationEmail}` : ""}
${data.organizationTelephone ? `📞 ${data.organizationTelephone}` : ""}
` : ""}

---
${data.organizationName} - Organisme de formation
`;

  return { subject, html, text };
}

// ===========================================
// EMAIL CODE OTP INTERVENANT
// ===========================================
// Code de connexion pour l'espace intervenant

interface IntervenantOTPEmailData {
  prenom: string;
  code: string;
  organizationName: string;
  organizationLogo?: string | null;
  primaryColor?: string;
  expiresInMinutes: number;
}

export function generateIntervenantOTPEmail(data: IntervenantOTPEmailData) {
  const color = data.primaryColor || "#10B981"; // Emerald color for intervenants

  const subject = `🔐 Votre code de connexion Intervenant - ${data.organizationName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de connexion</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 50px; max-width: 180px;">`
                : `<h1 style="color: white; margin: 0; font-size: 22px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Icône cadenas -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 70px; height: 70px; background: linear-gradient(135deg, ${color}15 0%, ${color}25 100%); border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">🔐</span>
              </div>
              <h2 style="color: #1a1a2e; margin: 0 0 8px; font-size: 24px; font-weight: 600;">
                Bonjour ${data.prenom} !
              </h2>
              <p style="color: #6c757d; margin: 0; font-size: 15px;">
                Voici votre code de connexion à l'espace intervenant
              </p>
            </td>
          </tr>

          <!-- Code OTP -->
          <tr>
            <td style="padding: 10px 40px 30px; text-align: center;">
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 0 auto; max-width: 280px; border: 2px dashed ${color}40;">
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                  Code de vérification
                </p>
                <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 42px; font-weight: bold; letter-spacing: 8px; color: ${color};">
                  ${data.code}
                </p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <p style="margin: 0 0 15px; color: #495057; font-size: 14px; line-height: 1.6;">
                Entrez ce code sur la page de connexion pour accéder à votre espace intervenant.
              </p>
              <div style="display: inline-block; background-color: #fff3cd; border-radius: 8px; padding: 12px 20px;">
                <p style="margin: 0; color: #856404; font-size: 13px;">
                  ⏱️ Ce code expire dans <strong>${data.expiresInMinutes} minutes</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Sécurité -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 30px; vertical-align: top; padding-top: 2px;">
                    <span style="font-size: 16px;">🔒</span>
                  </td>
                  <td>
                    <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.5;">
                      Si vous n'avez pas demandé ce code, ignorez simplement cet email.
                      Ne partagez jamais ce code avec qui que ce soit.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #1a1a2e; text-align: center;">
              <p style="margin: 0; color: #ffffff99; font-size: 12px;">
                ${data.organizationName} - Espace Intervenant
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Bonjour ${data.prenom},

Voici votre code de connexion pour accéder à votre espace intervenant :

🔐 ${data.code}

Ce code expire dans ${data.expiresInMinutes} minutes.

Entrez ce code sur la page de connexion pour accéder à votre espace.

Si vous n'avez pas demandé ce code, ignorez simplement cet email.

---
${data.organizationName} - Espace Intervenant
`;

  return { subject, html, text };
}

// ===========================================
// EMAIL RAPPEL J-7 AVANT FORMATION - QUALIOPI IND 5
// ===========================================
// Envoyé 7 jours avant le début de la formation
// Avec liens vers documents importants

interface RappelJ7EmailData {
  prenom: string;
  nom: string;
  formationTitre: string;
  dateDebut: string; // Format lisible "lundi 5 janvier 2025"
  heureDebut: string; // Ex: "09:00"
  lieu: string | null; // Lieu ou "À distance"
  formateur: string | null;
  organizationName: string;
  organizationLogo?: string | null;
  organizationEmail?: string | null;
  organizationTelephone?: string | null;
  primaryColor?: string;
  espaceApprenantUrl: string;
  // Documents disponibles
  hasConvocation?: boolean;
  hasProgramme?: boolean;
  hasReglement?: boolean;
  hasCGV?: boolean;
}

export function generateRappelJ7Email(data: RappelJ7EmailData) {
  const color = data.primaryColor || "#4277FF";

  const subject = `📅 Rappel : Votre formation "${data.formationTitre}" débute dans 7 jours`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel formation J-7</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 35px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 60px; max-width: 200px;">`
                : `<h1 style="color: white; margin: 0; font-size: 24px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Badge J-7 -->
          <tr>
            <td style="padding: 40px 40px 25px; text-align: center;">
              <div style="width: 90px; height: 90px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                <span style="font-size: 42px;">📅</span>
              </div>
              <h2 style="color: #b45309; margin: 0 0 10px; font-size: 28px; font-weight: 600;">
                J-7 avant votre formation
              </h2>
              <p style="color: #6c757d; margin: 0; font-size: 16px;">
                Préparez-vous pour le jour J !
              </p>
            </td>
          </tr>

          <!-- Message principal -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; color: #495057; font-size: 16px; line-height: 1.7;">
                Bonjour <strong>${data.prenom}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #495057; font-size: 16px; line-height: 1.7;">
                Votre formation <strong style="color: ${color};">"${data.formationTitre}"</strong> débute dans 7 jours.
              </p>

              <!-- Informations de la session -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid ${color};">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 35px; vertical-align: top;">
                            <span style="font-size: 18px;">📆</span>
                          </td>
                          <td>
                            <p style="margin: 0 0 3px; color: #6c757d; font-size: 12px; text-transform: uppercase;">Date</p>
                            <p style="margin: 0; color: #1a1a2e; font-size: 15px; font-weight: 500;">
                              ${data.dateDebut} à ${data.heureDebut}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 35px; vertical-align: top;">
                            <span style="font-size: 18px;">📍</span>
                          </td>
                          <td>
                            <p style="margin: 0 0 3px; color: #6c757d; font-size: 12px; text-transform: uppercase;">Lieu</p>
                            <p style="margin: 0; color: #1a1a2e; font-size: 15px; font-weight: 500;">
                              ${data.lieu || "À distance"}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${data.formateur ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 35px; vertical-align: top;">
                            <span style="font-size: 18px;">👨‍🏫</span>
                          </td>
                          <td>
                            <p style="margin: 0 0 3px; color: #6c757d; font-size: 12px; text-transform: uppercase;">Formateur</p>
                            <p style="margin: 0; color: #1a1a2e; font-size: 15px; font-weight: 500;">
                              ${data.formateur}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <!-- Checklist de préparation -->
              <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px; color: #0369a1; font-size: 16px; font-weight: 600;">
                  ✅ Nous vous invitons à :
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${data.hasProgramme ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 30px; vertical-align: top;">
                            <span style="font-size: 16px;">📚</span>
                          </td>
                          <td style="color: #0c4a6e; font-size: 14px; line-height: 1.5;">
                            <strong>Consulter le programme</strong> de formation
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.hasReglement ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 30px; vertical-align: top;">
                            <span style="font-size: 16px;">📋</span>
                          </td>
                          <td style="color: #0c4a6e; font-size: 14px; line-height: 1.5;">
                            <strong>Lire le règlement intérieur</strong>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.hasCGV ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 30px; vertical-align: top;">
                            <span style="font-size: 16px;">📄</span>
                          </td>
                          <td style="color: #0c4a6e; font-size: 14px; line-height: 1.5;">
                            <strong>Prendre connaissance des CGV</strong>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ""}
                  ${data.hasConvocation ? `
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 30px; vertical-align: top;">
                            <span style="font-size: 16px;">📨</span>
                          </td>
                          <td style="color: #0c4a6e; font-size: 14px; line-height: 1.5;">
                            <strong>Télécharger votre convocation</strong>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ""}
                </table>
                <p style="margin: 15px 0 0; color: #0c4a6e; font-size: 13px;">
                  Tous ces documents sont disponibles sur votre espace apprenant.
                </p>
              </div>

              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.espaceApprenantUrl}" style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px ${color}40;">
                      📂 Accéder à mes documents
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding: 25px 40px; background-color: #fef3c7; border-top: 1px solid #fde68a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <span style="font-size: 22px;">💬</span>
                  </td>
                  <td>
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 15px; font-weight: 600;">
                      Des questions ou des besoins spécifiques ?
                    </p>
                    <p style="margin: 0; color: #a16207; font-size: 14px; line-height: 1.6;">
                      N'hésitez pas à nous contacter, nous sommes là pour vous accompagner.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact info -->
          ${data.organizationEmail || data.organizationTelephone ? `
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <div style="text-align: center;">
                ${data.organizationEmail
                  ? `<a href="mailto:${data.organizationEmail}" style="display: inline-block; margin: 0 10px; color: ${color}; text-decoration: none; font-size: 14px;">✉️ ${data.organizationEmail}</a>`
                  : ""
                }
                ${data.organizationTelephone
                  ? `<a href="tel:${data.organizationTelephone}" style="display: inline-block; margin: 0 10px; color: ${color}; text-decoration: none; font-size: 14px;">📞 ${data.organizationTelephone}</a>`
                  : ""
                }
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #1a1a2e; text-align: center;">
              <p style="margin: 0 0 5px; color: #ffffff; font-size: 14px; font-weight: 500;">
                À très bientôt !
              </p>
              <p style="margin: 0; color: #ffffff80; font-size: 12px;">
                L'équipe ${data.organizationName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
📅 RAPPEL : Votre formation débute dans 7 jours

Bonjour ${data.prenom},

Votre formation "${data.formationTitre}" débute dans 7 jours.

📆 Date : ${data.dateDebut} à ${data.heureDebut}
📍 Lieu : ${data.lieu || "À distance"}
${data.formateur ? `👨‍🏫 Formateur : ${data.formateur}` : ""}

✅ NOUS VOUS INVITONS À :
${data.hasProgramme ? "• Consulter le programme de formation" : ""}
${data.hasReglement ? "• Lire le règlement intérieur" : ""}
${data.hasCGV ? "• Prendre connaissance des CGV" : ""}
${data.hasConvocation ? "• Télécharger votre convocation" : ""}

Tous ces documents sont disponibles sur votre espace apprenant :
🔗 ${data.espaceApprenantUrl}

Des questions ou des besoins spécifiques ?
N'hésitez pas à nous contacter.

${data.organizationEmail ? `📧 ${data.organizationEmail}` : ""}
${data.organizationTelephone ? `📞 ${data.organizationTelephone}` : ""}

À très bientôt !
L'équipe ${data.organizationName}
`;

  return { subject, html, text };
}

// ===========================================
// SYSTÈME D'ENVOI EMAIL AVEC PIÈCES JOINTES PDF
// ===========================================
// Qualiopi IND 5 - Envoi des documents importants avant formation

interface PDFAttachment {
  filename: string;
  content: Buffer | string; // Buffer pour fichiers, string base64
  contentType?: string;
}

interface EmailWithAttachmentsData {
  // Destinataire
  to: string;
  toName?: string;
  // IDs pour traçabilité
  apprenantId?: string;
  sessionId?: string;
  formationId?: string;
  // Organisation
  organizationId: string;
  // Email content (subject, html, text)
  emailContent: {
    subject: string;
    html: string;
    text: string;
  };
  // Pièces jointes
  attachments?: PDFAttachment[];
  // Type d'email
  type?: SentEmailType;
}

/**
 * Envoie un email avec pièces jointes PDF
 * Utilisé pour J-7, convocations, etc.
 */
export async function sendEmailWithAttachments(
  data: EmailWithAttachmentsData
): Promise<EmailResult> {
  const { to, toName, apprenantId, sessionId, formationId, organizationId, emailContent, attachments, type } = data;

  // Préparer les pièces jointes au format attendu par sendEmail
  const formattedAttachments = attachments?.map(att => ({
    filename: att.filename,
    content: att.content,
    contentType: att.contentType || "application/pdf",
  }));

  // Utiliser sendEmail avec les options étendues
  return sendEmail(
    {
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments: formattedAttachments,
      // Options étendues pour traçabilité
      type: type || "RAPPEL",
      toName,
      apprenantId,
      sessionId,
      formationId,
    },
    organizationId
  );
}

// ===========================================
// FONCTION D'ENVOI RAPPEL J-7 AVEC PIÈCES JOINTES
// ===========================================

interface SendRappelJ7Options {
  // Données apprenant
  apprenant: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  };
  // Données session
  session: {
    id: string;
    formationId: string;
    formationTitre: string;
    dateDebut: Date;
    heureDebut: string;
    lieu: string | null;
    formateur: string | null;
  };
  // Organisation
  organization: {
    id: string;
    name: string;
    logo?: string | null;
    email?: string | null;
    telephone?: string | null;
    primaryColor?: string;
    baseUrl: string; // URL de base pour l'espace apprenant
  };
  // Documents PDF à joindre (optionnels)
  documents?: {
    convocation?: Buffer | null;
    programme?: Buffer | null;
    reglement?: Buffer | null;
    cgv?: Buffer | null;
  };
}

/**
 * Envoie l'email de rappel J-7 avec les documents en pièces jointes
 * Qualiopi IND 5 - Information des objectifs et déroulement
 */
export async function sendRappelJ7WithDocuments(
  options: SendRappelJ7Options
): Promise<EmailResult> {
  const { apprenant, session, organization, documents } = options;

  // Formater la date en français
  const dateDebut = new Date(session.dateDebut);
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const dateDebutFormatted = dateDebut.toLocaleDateString("fr-FR", dateOptions);

  // URL de l'espace apprenant
  const espaceApprenantUrl = `${organization.baseUrl}/apprenant/documents`;

  // Générer le contenu de l'email
  const emailContent = generateRappelJ7Email({
    prenom: apprenant.prenom,
    nom: apprenant.nom,
    formationTitre: session.formationTitre,
    dateDebut: dateDebutFormatted,
    heureDebut: session.heureDebut,
    lieu: session.lieu,
    formateur: session.formateur,
    organizationName: organization.name,
    organizationLogo: organization.logo,
    organizationEmail: organization.email,
    organizationTelephone: organization.telephone,
    primaryColor: organization.primaryColor,
    espaceApprenantUrl,
    // Indiquer quels documents sont disponibles
    hasConvocation: !!documents?.convocation,
    hasProgramme: !!documents?.programme,
    hasReglement: !!documents?.reglement,
    hasCGV: !!documents?.cgv,
  });

  // Préparer les pièces jointes
  const attachments: PDFAttachment[] = [];

  if (documents?.convocation) {
    attachments.push({
      filename: `Convocation_${session.formationTitre.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      content: documents.convocation,
      contentType: "application/pdf",
    });
  }

  if (documents?.programme) {
    attachments.push({
      filename: `Programme_${session.formationTitre.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      content: documents.programme,
      contentType: "application/pdf",
    });
  }

  if (documents?.reglement) {
    attachments.push({
      filename: "Reglement_Interieur.pdf",
      content: documents.reglement,
      contentType: "application/pdf",
    });
  }

  if (documents?.cgv) {
    attachments.push({
      filename: "Conditions_Generales_Vente.pdf",
      content: documents.cgv,
      contentType: "application/pdf",
    });
  }

  // Envoyer l'email
  return sendEmailWithAttachments({
    to: apprenant.email,
    toName: `${apprenant.prenom} ${apprenant.nom}`,
    apprenantId: apprenant.id,
    sessionId: session.id,
    formationId: session.formationId,
    organizationId: organization.id,
    emailContent,
    attachments: attachments.length > 0 ? attachments : undefined,
    type: "RAPPEL",
  });
}

// ===========================================
// FONCTION GÉNÉRIQUE D'ENVOI DE DOCUMENTS
// ===========================================

interface SendDocumentsEmailData {
  // Destinataire
  to: string;
  toName: string;
  // IDs pour traçabilité
  apprenantId?: string;
  sessionId?: string;
  formationId?: string;
  // Organisation
  organizationId: string;
  organizationName: string;
  organizationLogo?: string | null;
  organizationEmail?: string | null;
  primaryColor?: string;
  // Contexte
  formationTitre: string;
  // Documents
  documents: Array<{
    name: string;
    filename: string;
    content: Buffer;
  }>;
  // Message personnalisé (optionnel)
  customMessage?: string;
}

/**
 * Envoie un email avec une liste de documents PDF en pièces jointes
 * Utilisé pour envoyer des documents spécifiques (attestations, certificats, etc.)
 */
export async function sendDocumentsEmail(
  data: SendDocumentsEmailData
): Promise<EmailResult> {
  const color = data.primaryColor || "#4277FF";

  // Construire la liste des documents pour l'email
  const documentsList = data.documents
    .map(doc => `<li style="padding: 8px 0; color: #495057; font-size: 15px;">📎 ${doc.name}</li>`)
    .join("");

  const subject = `📄 Documents - ${data.formationTitre}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 35px 40px; text-align: center;">
              ${data.organizationLogo
                ? `<img src="${data.organizationLogo}" alt="${data.organizationName}" style="max-height: 60px; max-width: 200px;">`
                : `<h1 style="color: white; margin: 0; font-size: 24px;">${data.organizationName}</h1>`
              }
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">📄</span>
              </div>

              <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 22px; text-align: center;">
                Vos documents
              </h2>

              <p style="margin: 0 0 25px; color: #495057; font-size: 16px; line-height: 1.7;">
                Bonjour <strong>${data.toName}</strong>,
              </p>

              ${data.customMessage ? `
              <p style="margin: 0 0 25px; color: #495057; font-size: 16px; line-height: 1.7;">
                ${data.customMessage}
              </p>
              ` : `
              <p style="margin: 0 0 25px; color: #495057; font-size: 16px; line-height: 1.7;">
                Veuillez trouver ci-joint les documents relatifs à votre formation
                <strong style="color: ${color};">"${data.formationTitre}"</strong>.
              </p>
              `}

              <!-- Liste des documents -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px; color: #1a1a2e; font-size: 16px; font-weight: 600;">
                  📎 Documents joints :
                </h3>
                <ul style="margin: 0; padding-left: 0; list-style: none;">
                  ${documentsList}
                </ul>
              </div>

              <p style="margin: 0; color: #6c757d; font-size: 14px; text-align: center;">
                Ces documents sont importants, pensez à les conserver.
              </p>
            </td>
          </tr>

          <!-- Contact -->
          ${data.organizationEmail ? `
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                Une question ? Contactez-nous :
                <a href="mailto:${data.organizationEmail}" style="color: ${color}; text-decoration: none;">${data.organizationEmail}</a>
              </p>
            </td>
          </tr>
          ` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #1a1a2e; text-align: center;">
              <p style="margin: 0; color: #ffffff80; font-size: 12px;">
                L'équipe ${data.organizationName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const documentsListText = data.documents.map(doc => `• ${doc.name}`).join("\n");
  const text = `
📄 VOS DOCUMENTS

Bonjour ${data.toName},

${data.customMessage || `Veuillez trouver ci-joint les documents relatifs à votre formation "${data.formationTitre}".`}

📎 Documents joints :
${documentsListText}

Ces documents sont importants, pensez à les conserver.

${data.organizationEmail ? `Une question ? Contactez-nous : ${data.organizationEmail}` : ""}

L'équipe ${data.organizationName}
`;

  // Préparer les pièces jointes
  const attachments: PDFAttachment[] = data.documents.map(doc => ({
    filename: doc.filename,
    content: doc.content,
    contentType: "application/pdf",
  }));

  return sendEmailWithAttachments({
    to: data.to,
    toName: data.toName,
    apprenantId: data.apprenantId,
    sessionId: data.sessionId,
    formationId: data.formationId,
    organizationId: data.organizationId,
    emailContent: { subject, html, text },
    attachments,
    type: "DOCUMENT",
  });
}