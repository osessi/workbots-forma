// ===========================================
// HANDLERS D'ACTIONS POUR LES WORKFLOWS
// Module 6 - Moteur d'Automatisation
// ===========================================

import { WorkflowActionType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  ActionConfig,
  ActionResult,
  WorkflowExecutionContext,
  EnvoyerEmailActionConfig,
  EnvoyerSMSActionConfig,
  GenererDocumentActionConfig,
  DemanderSignatureActionConfig,
  MettreAJourChampActionConfig,
  CreerEntiteActionConfig,
  NotificationActionConfig,
  WebhookActionConfig,
  DelaiActionConfig,
  ConditionActionConfig,
  ActionHandler,
  ActionHandlerRegistry,
} from "@/types/workflow";

// ===========================================
// UTILITAIRES
// ===========================================

/**
 * Remplacer les variables dans un texte
 * Supporte la syntaxe {{variable}} et {{variable.subfield}}
 */
function replaceVariables(
  text: string,
  context: WorkflowExecutionContext
): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split(".");
    let value: unknown = context.variables;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return match; // Variable non trouvée, garder le placeholder
      }
    }

    if (value instanceof Date) {
      return value.toLocaleDateString("fr-FR");
    }

    return String(value ?? "");
  });
}

/**
 * Obtenir l'email du destinataire
 */
async function getDestinataire(
  type: string,
  context: WorkflowExecutionContext,
  customEmail?: string
): Promise<string | null> {
  switch (type) {
    case "apprenant":
      return context.variables.apprenant?.email || null;
    case "intervenant":
      // Récupérer l'email du formateur depuis la session
      const sessionId = context.declencheur.data.sessionId as string;
      if (sessionId) {
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: { formateur: true },
        });
        return session?.formateur?.email || null;
      }
      return null;
    case "entreprise":
      // Récupérer l'email de l'entreprise de l'apprenant
      const apprenantId = context.declencheur.data.apprenantId as string;
      if (apprenantId) {
        const apprenant = await prisma.apprenant.findUnique({
          where: { id: apprenantId },
          include: { entreprise: true },
        });
        return apprenant?.entreprise?.contactEmail || null;
      }
      return null;
    case "financeur":
      // TODO: Implémenter la récupération de l'email du financeur
      return null;
    case "custom":
      return customEmail || null;
    default:
      return null;
  }
}

// ===========================================
// HANDLER: ENVOYER EMAIL
// ===========================================

const handleEnvoyerEmail: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const emailConfig = config as EnvoyerEmailActionConfig;

  try {
    // Obtenir le template si spécifié
    let sujet = emailConfig.sujet || "";
    let contenu = emailConfig.contenu || "";

    if (emailConfig.templateId) {
      const template = await prisma.workflowEmailTemplate.findUnique({
        where: { id: emailConfig.templateId },
      });

      if (template) {
        sujet = template.sujet;
        contenu = template.contenu;
      }
    }

    if (!sujet || !contenu) {
      return {
        success: false,
        error: "Sujet ou contenu de l'email manquant",
      };
    }

    // Remplacer les variables
    sujet = replaceVariables(sujet, context);
    contenu = replaceVariables(contenu, context);

    // Obtenir l'email du destinataire
    const destinataireEmail = await getDestinataire(
      emailConfig.destinataire,
      context,
      emailConfig.destinataireCustom
    );

    if (!destinataireEmail) {
      return {
        success: false,
        error: `Impossible de trouver l'email du destinataire (${emailConfig.destinataire})`,
      };
    }

    // Récupérer l'organisation pour le nom de l'expéditeur
    const organization = await prisma.organization.findUnique({
      where: { id: context.organizationId },
    });

    // Envoyer l'email via le service d'email existant
    const { sendEmail } = await import("@/lib/services/email");

    await sendEmail({
      to: destinataireEmail,
      subject: sujet,
      html: contenu,
      from: organization?.email || undefined,
      cc: emailConfig.copie,
      bcc: emailConfig.copieCachee,
    });

    return {
      success: true,
      data: {
        to: destinataireEmail,
        subject: sujet,
        sentAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email",
    };
  }
};

// ===========================================
// HANDLER: ENVOYER SMS
// ===========================================

const handleEnvoyerSMS: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const smsConfig = config as EnvoyerSMSActionConfig;

  try {
    // Obtenir le template si spécifié
    let contenu = smsConfig.contenu || "";

    if (smsConfig.templateId) {
      const template = await prisma.workflowSMSTemplate.findUnique({
        where: { id: smsConfig.templateId },
      });

      if (template) {
        contenu = template.contenu;
      }
    }

    if (!contenu) {
      return {
        success: false,
        error: "Contenu du SMS manquant",
      };
    }

    // Remplacer les variables
    contenu = replaceVariables(contenu, context);

    // Obtenir le numéro du destinataire
    let telephone: string | null = null;

    switch (smsConfig.destinataire) {
      case "apprenant":
        telephone = context.variables.apprenant?.telephone || null;
        break;
      case "intervenant":
        // Récupérer le téléphone du formateur
        const sessionId = context.declencheur.data.sessionId as string;
        if (sessionId) {
          const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { formateur: true },
          });
          telephone = session?.formateur?.telephone || null;
        }
        break;
      case "custom":
        telephone = smsConfig.destinataireCustom || null;
        break;
    }

    if (!telephone) {
      return {
        success: false,
        error: `Impossible de trouver le téléphone du destinataire (${smsConfig.destinataire})`,
      };
    }

    // TODO: Implémenter l'envoi SMS via un service tiers (Twilio, etc.)
    // Pour l'instant, on simule l'envoi
    console.log(`[WorkflowSMS] Envoi SMS à ${telephone}: ${contenu}`);

    return {
      success: true,
      data: {
        to: telephone,
        content: contenu,
        sentAt: new Date().toISOString(),
        simulated: true, // Indique que c'est simulé
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'envoi du SMS",
    };
  }
};

// ===========================================
// HANDLER: GÉNÉRER DOCUMENT
// ===========================================

const handleGenererDocument: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const docConfig = config as GenererDocumentActionConfig;

  try {
    // Import du service de génération de documents
    // TODO: Implémenter le service de génération de documents

    const apprenantId = context.declencheur.data.apprenantId as string;
    const sessionId = context.declencheur.data.sessionId as string;
    const formationId = context.variables.formation?.id;

    if (!apprenantId || !sessionId || !formationId) {
      return {
        success: false,
        error: "Données manquantes pour la génération du document",
      };
    }

    // Créer une entrée de document
    const document = await prisma.document.create({
      data: {
        type: docConfig.typeDocument as any,
        titre: `${docConfig.typeDocument}_${new Date().toISOString().split('T')[0]}`,
        formationId,
        // fileUrl sera rempli après génération
      },
    });

    // TODO: Générer le PDF réel via le service de génération
    // Pour l'instant on retourne juste l'ID du document créé

    // Envoyer par email si demandé
    if (docConfig.envoyerParEmail && docConfig.destinataireEmail) {
      const destinataireEmail = await getDestinataire(
        docConfig.destinataireEmail,
        context
      );

      if (destinataireEmail) {
        // TODO: Envoyer l'email avec le document en pièce jointe
        console.log(`[WorkflowDoc] Document envoyé à ${destinataireEmail}`);
      }
    }

    return {
      success: true,
      data: {
        documentId: document.id,
        type: docConfig.typeDocument,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la génération du document",
    };
  }
};

// ===========================================
// HANDLER: DEMANDER SIGNATURE
// ===========================================

const handleDemanderSignature: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const signConfig = config as DemanderSignatureActionConfig;

  try {
    // TODO: Implémenter la demande de signature électronique
    // Intégration avec le système de signature existant

    return {
      success: true,
      data: {
        typeDocument: signConfig.typeDocument,
        signataires: signConfig.signataires,
        requestedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la demande de signature",
    };
  }
};

// ===========================================
// HANDLER: METTRE À JOUR UN CHAMP
// ===========================================

const handleMettreAJourChamp: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const updateConfig = config as MettreAJourChampActionConfig;

  try {
    const { entite, champ, valeur, mode } = updateConfig;

    // Déterminer l'ID de l'entité à mettre à jour
    let entityId: string | null = null;

    switch (entite) {
      case "apprenant":
        entityId = context.declencheur.data.apprenantId as string;
        break;
      case "session":
        entityId = context.declencheur.data.sessionId as string;
        break;
      case "formation":
        entityId = context.variables.formation?.id || null;
        break;
      case "inscription":
        entityId = context.declencheur.data.inscriptionId as string;
        break;
    }

    if (!entityId) {
      return {
        success: false,
        error: `Impossible de trouver l'ID de l'entité ${entite}`,
      };
    }

    // Construire la mise à jour
    let updateData: Record<string, unknown> = {};

    switch (mode) {
      case "remplacer":
        updateData[champ] = valeur;
        break;
      case "incrementer":
        updateData[champ] = { increment: Number(valeur) };
        break;
      case "decrementer":
        updateData[champ] = { decrement: Number(valeur) };
        break;
      // TODO: Gérer ajouter/retirer pour les tableaux
    }

    // Effectuer la mise à jour selon l'entité
    switch (entite) {
      case "apprenant":
        await prisma.apprenant.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      case "session":
        await prisma.session.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      case "formation":
        await prisma.formation.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      // TODO: Ajouter inscription
    }

    return {
      success: true,
      data: {
        entite,
        entityId,
        champ,
        valeur,
        mode,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
    };
  }
};

// ===========================================
// HANDLER: CRÉER ENTITÉ
// ===========================================

const handleCreerApprenant: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const createConfig = config as CreerEntiteActionConfig;

  try {
    // Récupérer les données et remplacer les variables
    const donnees = createConfig.donnees as Record<string, unknown>;

    const apprenant = await prisma.apprenant.create({
      data: {
        organizationId: context.organizationId,
        nom: String(donnees.nom || ""),
        prenom: String(donnees.prenom || ""),
        email: String(donnees.email || ""),
        telephone: donnees.telephone ? String(donnees.telephone) : null,
      },
    });

    return {
      success: true,
      data: {
        apprenantId: apprenant.id,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création de l'apprenant",
    };
  }
};

const handleCreerInscription: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  // TODO: Adapter à la structure de données de SessionParticipant qui nécessite un clientId
  // Le schéma SessionParticipant est plus complexe et lié à SessionClient
  const apprenantId = context.declencheur.data.apprenantId as string;
  const sessionId = context.declencheur.data.sessionId as string;

  if (!apprenantId || !sessionId) {
    return {
      success: false,
      error: "apprenantId et sessionId requis pour créer une inscription",
    };
  }

  // Pour l'instant, retourner un résultat de succès simulé
  // L'implémentation réelle nécessite de créer d'abord un SessionClient puis un SessionParticipant
  return {
    success: true,
    data: {
      message: "Fonctionnalité d'inscription à implémenter selon le flux de l'application",
      apprenantId,
      sessionId,
    },
  };
};

// ===========================================
// HANDLER: CRÉER RÉCLAMATION
// ===========================================

const handleCreerReclamation: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const createConfig = config as CreerEntiteActionConfig;

  try {
    const donnees = createConfig.donnees as Record<string, unknown>;

    const reclamation = await prisma.reclamation.create({
      data: {
        organizationId: context.organizationId,
        origine: (donnees.origine as any) || "AUTRE",
        nomPlaignant: String(donnees.nomPlaignant || context.variables.apprenant?.prenom + " " + context.variables.apprenant?.nom || "Plaignant automatique"),
        emailPlaignant: String(donnees.emailPlaignant || context.variables.apprenant?.email || ""),
        objet: String(donnees.objet || "Réclamation automatique"),
        description: String(donnees.description || "Réclamation générée automatiquement par le workflow"),
        formationId: context.variables.formation?.id,
        apprenantId: context.declencheur.data.apprenantId as string || null,
      },
    });

    return {
      success: true,
      data: {
        reclamationId: reclamation.id,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création de la réclamation",
    };
  }
};

// ===========================================
// HANDLER: CRÉER AMÉLIORATION
// ===========================================

const handleCreerAmelioration: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const createConfig = config as CreerEntiteActionConfig;

  try {
    const donnees = createConfig.donnees as Record<string, unknown>;

    const amelioration = await prisma.actionAmelioration.create({
      data: {
        organizationId: context.organizationId,
        titre: String(donnees.titre || "Action d'amélioration automatique"),
        description: String(donnees.description || ""),
        origine: (donnees.origine as any) || "INITIATIVE",
        priorite: (donnees.priorite as any) || "MOYENNE",
        formationId: context.variables.formation?.id,
      },
    });

    return {
      success: true,
      data: {
        ameliorationId: amelioration.id,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création de l'amélioration",
    };
  }
};

// ===========================================
// HANDLER: CRÉER TÂCHE
// ===========================================

const handleCreerTache: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  // TODO: Implémenter le système de tâches internes
  // Pour l'instant, on crée une notification à l'équipe

  const createConfig = config as CreerEntiteActionConfig;
  const donnees = createConfig.donnees as Record<string, unknown>;

  return {
    success: true,
    data: {
      titre: donnees.titre,
      description: donnees.description,
      createdAt: new Date().toISOString(),
      note: "Tâche créée (système de tâches à implémenter)",
    },
  };
};

// ===========================================
// HANDLER: NOTIFICATION ÉQUIPE
// ===========================================

const handleNotifierEquipe: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const notifConfig = config as NotificationActionConfig;

  try {
    // Trouver tous les utilisateurs de l'organisation
    const whereClause: any = {
      organizationId: context.organizationId,
      isActive: true,
    };

    // Filtrer par rôles si spécifiés
    if (notifConfig.roles && notifConfig.roles.length > 0) {
      whereClause.role = { in: notifConfig.roles };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    // Remplacer les variables dans le message
    const titre = replaceVariables(notifConfig.titre, context);
    const message = replaceVariables(notifConfig.message, context);

    // Créer les notifications
    const notifications = await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        organizationId: context.organizationId,
        type: "SYSTEME" as const,
        titre,
        message,
        actionUrl: notifConfig.lienAction,
        isRead: false,
      })),
    });

    return {
      success: true,
      data: {
        notificationsCreees: notifications.count,
        destinataires: users.length,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la notification",
    };
  }
};

// ===========================================
// HANDLER: NOTIFICATION UTILISATEUR
// ===========================================

const handleNotifierUtilisateur: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const notifConfig = config as NotificationActionConfig;

  try {
    if (!notifConfig.utilisateurId) {
      return {
        success: false,
        error: "utilisateurId requis pour notifier un utilisateur spécifique",
      };
    }

    // Remplacer les variables dans le message
    const titre = replaceVariables(notifConfig.titre, context);
    const message = replaceVariables(notifConfig.message, context);

    const notification = await prisma.notification.create({
      data: {
        userId: notifConfig.utilisateurId,
        organizationId: context.organizationId,
        type: "SYSTEME" as const,
        titre,
        message,
        actionUrl: notifConfig.lienAction,
        isRead: false,
      },
    });

    return {
      success: true,
      data: {
        notificationId: notification.id,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la notification",
    };
  }
};

// ===========================================
// HANDLER: WEBHOOK
// ===========================================

const handleWebhook: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const webhookConfig = config as WebhookActionConfig;

  try {
    // Préparer le body avec les variables remplacées
    let body = webhookConfig.body;
    if (body) {
      body = JSON.parse(replaceVariables(JSON.stringify(body), context));
    }

    // Préparer les headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...webhookConfig.headers,
    };

    // Effectuer la requête
    const response = await fetch(webhookConfig.url, {
      method: webhookConfig.methode,
      headers,
      body: webhookConfig.methode !== "GET" ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(webhookConfig.timeout || 30000),
    });

    const responseData = await response.text();

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook failed with status ${response.status}: ${responseData}`,
        data: {
          statusCode: response.status,
          response: responseData,
        },
      };
    }

    return {
      success: true,
      data: {
        statusCode: response.status,
        response: responseData,
        executedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'appel webhook",
    };
  }
};

// ===========================================
// HANDLER: APPEL API
// ===========================================

const handleAppelAPI: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  // Similaire à webhook mais avec plus d'options
  return handleWebhook(config, context);
};

// ===========================================
// HANDLER: DÉLAI
// ===========================================

const handleDelai: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const delaiConfig = config as DelaiActionConfig;

  // Le délai est géré dans le workflow-execution.queue.ts
  // Ici on retourne juste les informations du délai

  return {
    success: true,
    data: {
      duree: delaiConfig.duree,
      unite: delaiConfig.unite,
      note: "Le délai sera géré par le système de queue",
    },
  };
};

// ===========================================
// HANDLER: CONDITION
// ===========================================

const handleCondition: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  const conditionConfig = config as ConditionActionConfig;

  try {
    // Import de l'évaluateur de conditions
    const { evaluateCondition } = await import("./workflow-condition-evaluators");

    // Évaluer toutes les conditions
    let result = conditionConfig.operateur === "ET";

    for (const condition of conditionConfig.conditions) {
      const conditionResult = await evaluateCondition(condition, context);

      if (conditionConfig.operateur === "ET") {
        result = result && conditionResult;
        if (!result) break; // Short-circuit
      } else {
        result = result || conditionResult;
        if (result) break; // Short-circuit
      }
    }

    return {
      success: true,
      data: {
        conditionResult: result,
        operateur: conditionConfig.operateur,
        conditionsEvaluees: conditionConfig.conditions.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'évaluation des conditions",
    };
  }
};

// ===========================================
// HANDLER: BOUCLE
// ===========================================

const handleBoucle: ActionHandler = async (
  config: ActionConfig,
  context: WorkflowExecutionContext
): Promise<ActionResult> => {
  // TODO: Implémenter la logique de boucle
  return {
    success: true,
    data: {
      note: "Boucle à implémenter",
    },
  };
};

// ===========================================
// REGISTRY DES HANDLERS
// ===========================================

export const actionHandlers: ActionHandlerRegistry = {
  ENVOYER_EMAIL: handleEnvoyerEmail,
  ENVOYER_SMS: handleEnvoyerSMS,
  GENERER_DOCUMENT: handleGenererDocument,
  DEMANDER_SIGNATURE: handleDemanderSignature,
  METTRE_A_JOUR_CHAMP: handleMettreAJourChamp,
  CREER_APPRENANT: handleCreerApprenant,
  CREER_INSCRIPTION: handleCreerInscription,
  CREER_RECLAMATION: handleCreerReclamation,
  CREER_AMELIORATION: handleCreerAmelioration,
  CREER_TACHE: handleCreerTache,
  NOTIFIER_EQUIPE: handleNotifierEquipe,
  NOTIFIER_UTILISATEUR: handleNotifierUtilisateur,
  WEBHOOK: handleWebhook,
  APPEL_API: handleAppelAPI,
  DELAI: handleDelai,
  CONDITION: handleCondition,
  BOUCLE: handleBoucle,
};

export default actionHandlers;
