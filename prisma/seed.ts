// ===========================================
// SEED DATA - Automate Forma
// ===========================================
// Génère des données de test pour le développement

import { PrismaClient, Plan, DocumentType, TemplateCategory } from "@prisma/client";
import { DEFAULT_DOCUMENT_TEMPLATES } from "./seed-document-templates";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...\n");

  // ===========================================
  // 1. Configuration Globale
  // ===========================================
  console.log("📝 Création de la configuration globale...");

  await prisma.globalConfig.upsert({
    where: { key: "app_settings" },
    update: {},
    create: {
      key: "app_settings",
      value: {
        maintenanceMode: false,
        registrationEnabled: true,
        defaultPlan: "FREE",
        maxFreeOrganizations: 100,
      },
      description: "Paramètres généraux de l'application",
    },
  });

  await prisma.globalConfig.upsert({
    where: { key: "email_settings" },
    update: {},
    create: {
      key: "email_settings",
      value: {
        fromEmail: "noreply@automateforma.com",
        fromName: "Automate Forma",
        supportEmail: "support@automateforma.com",
      },
      description: "Paramètres d'envoi d'emails",
    },
  });

  // ===========================================
  // 2. Organisation Demo
  // ===========================================
  console.log("🏢 Création de l'organisation démo...");

  const demoOrg = await prisma.organization.upsert({
    where: { slug: "demo-formation" },
    update: {},
    create: {
      name: "Demo Formation",
      slug: "demo-formation",
      plan: Plan.PRO,
      siret: "123 456 789 00012",
      numeroFormateur: "11 75 12345 75",
      adresse: "123 rue de la Formation",
      codePostal: "75001",
      ville: "Paris",
      telephone: "01 23 45 67 89",
      primaryColor: "#4277FF",
      maxFormateurs: 10,
      maxFormations: 100,
      maxStorageGb: 25,
    },
  });

  console.log(`   ✓ Organisation créée: ${demoOrg.name}`);

  // ===========================================
  // 3. Templates système (importés depuis seed-document-templates.ts)
  // ===========================================
  console.log("📄 Création des templates système...");

  // Filtrer le template "test" qui n'est pas un vrai template système
  const systemTemplates = DEFAULT_DOCUMENT_TEMPLATES.filter(t => t.name !== "test");

  for (const template of systemTemplates) {
    await prisma.template.upsert({
      where: {
        id: `system-${template.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        ...template,
        isSystem: true,
      },
      create: {
        id: `system-${template.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...template,
        isSystem: true,
      },
    });
  }

  console.log(`   ✓ ${systemTemplates.length} templates système créés`);

  // ===========================================
  // 4. Dossiers de démonstration
  // ===========================================
  console.log("📁 Création des dossiers de démonstration...");

  const folders = [
    { name: "Formation Gestion de Projet", color: "#4277FF" },
    { name: "Formation Management", color: "#22C55E" },
    { name: "Formation Communication", color: "#F97316" },
    { name: "Documents Administratifs", color: "#8B5CF6" },
    { name: "Supports de Cours", color: "#EC4899" },
  ];

  for (const folder of folders) {
    await prisma.folder.upsert({
      where: {
        id: `demo-folder-${folder.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: folder,
      create: {
        id: `demo-folder-${folder.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...folder,
        organizationId: demoOrg.id,
      },
    });
  }

  console.log(`   ✓ ${folders.length} dossiers créés`);

  // ===========================================
  // 5. Workflows d'automatisation
  // ===========================================
  console.log("🤖 Création des workflows d'automatisation...");

  // Workflow 1: Parcours d'inscription automatisé
  const workflow1 = await prisma.workflow.upsert({
    where: { id: "demo-workflow-inscription" },
    update: {},
    create: {
      id: "demo-workflow-inscription",
      organizationId: demoOrg.id,
      nom: "Parcours d'inscription automatisé",
      description: "Gère automatiquement le processus d'inscription des apprenants avec envoi de documents et confirmations",
      icone: "📋",
      categorie: "INSCRIPTION",
      triggerType: "PRE_INSCRIPTION",
      triggerConfig: {},
      estTemplate: false,
    },
  });

  // Étapes du workflow 1
  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-1-1" },
    update: {},
    create: {
      id: "demo-step-1-1",
      workflowId: workflow1.id,
      nom: "Confirmation de pré-inscription",
      description: "Envoie un email de confirmation au candidat",
      ordre: 1,
      type: "ENVOYER_EMAIL",
      config: {
        destinataire: "apprenant",
        sujet: "Confirmation de votre pré-inscription - {{formation.titre}}",
        contenu: "Bonjour {{apprenant.prenom}},\n\nNous avons bien reçu votre demande de pré-inscription pour la formation \"{{formation.titre}}\".\n\nNotre équipe va étudier votre dossier et reviendra vers vous sous 48h.\n\nCordialement,\nL'équipe formation",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-1-2" },
    update: {},
    create: {
      id: "demo-step-1-2",
      workflowId: workflow1.id,
      nom: "Notification équipe",
      description: "Notifie l'équipe d'une nouvelle pré-inscription",
      ordre: 2,
      type: "NOTIFIER_EQUIPE",
      config: {
        titre: "Nouvelle pré-inscription",
        message: "{{apprenant.prenom}} {{apprenant.nom}} s'est pré-inscrit(e) à la formation {{formation.titre}}",
        priorite: "NORMALE",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-1-3" },
    update: {},
    create: {
      id: "demo-step-1-3",
      workflowId: workflow1.id,
      nom: "Délai de traitement",
      description: "Attend 2 jours pour le traitement du dossier",
      ordre: 3,
      type: "DELAI",
      config: {
        duree: 2,
        unite: "jours",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-1-4" },
    update: {},
    create: {
      id: "demo-step-1-4",
      workflowId: workflow1.id,
      nom: "Génération du dossier",
      description: "Génère les documents d'inscription",
      ordre: 4,
      type: "GENERER_DOCUMENT",
      config: {
        typeDocument: "CONVENTION",
        variables: {
          includeConditionsGenerales: true,
        },
      },
    },
  });

  // Workflow 2: Rappels avant session
  const workflow2 = await prisma.workflow.upsert({
    where: { id: "demo-workflow-rappels" },
    update: {},
    create: {
      id: "demo-workflow-rappels",
      organizationId: demoOrg.id,
      nom: "Rappels avant session",
      description: "Envoie des rappels automatiques aux participants avant le début de la formation",
      icone: "⏰",
      categorie: "SESSION",
      triggerType: "SESSION_J_MOINS_7",
      triggerConfig: {},
      estTemplate: false,
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-2-1" },
    update: {},
    create: {
      id: "demo-step-2-1",
      workflowId: workflow2.id,
      nom: "Rappel J-7",
      description: "Email de rappel 7 jours avant",
      ordre: 1,
      type: "ENVOYER_EMAIL",
      config: {
        destinataire: "participants",
        sujet: "Rappel: Votre formation dans 7 jours - {{formation.titre}}",
        contenu: "Bonjour {{apprenant.prenom}},\n\nVotre formation \"{{formation.titre}}\" débutera dans 7 jours.\n\nDate: {{session.dateDebut}}\nLieu: {{session.lieu}}\n\nN'oubliez pas de préparer vos documents.\n\nCordialement",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-2-2" },
    update: {},
    create: {
      id: "demo-step-2-2",
      workflowId: workflow2.id,
      nom: "Délai 6 jours",
      description: "Attendre 6 jours",
      ordre: 2,
      type: "DELAI",
      config: {
        duree: 6,
        unite: "jours",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-2-3" },
    update: {},
    create: {
      id: "demo-step-2-3",
      workflowId: workflow2.id,
      nom: "Rappel J-1",
      description: "Email de rappel la veille",
      ordre: 3,
      type: "ENVOYER_EMAIL",
      config: {
        destinataire: "participants",
        sujet: "C'est demain ! Formation {{formation.titre}}",
        contenu: "Bonjour {{apprenant.prenom}},\n\nVotre formation commence demain !\n\n📍 Lieu: {{session.lieu}}\n⏰ Heure: {{session.heureDebut}}\n\nÀ demain !",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-2-4" },
    update: {},
    create: {
      id: "demo-step-2-4",
      workflowId: workflow2.id,
      nom: "SMS de rappel",
      description: "SMS de rappel la veille",
      ordre: 4,
      type: "ENVOYER_SMS",
      config: {
        destinataire: "participants",
        message: "Rappel: Votre formation {{formation.titre}} débute demain à {{session.heureDebut}}. Lieu: {{session.lieu}}",
      },
    },
  });

  // Workflow 3: Suivi post-formation
  const workflow3 = await prisma.workflow.upsert({
    where: { id: "demo-workflow-suivi" },
    update: {},
    create: {
      id: "demo-workflow-suivi",
      organizationId: demoOrg.id,
      nom: "Suivi post-formation",
      description: "Automatise l'envoi des enquêtes de satisfaction et des attestations après la formation",
      icone: "📊",
      categorie: "EVALUATION",
      triggerType: "SESSION_FIN",
      triggerConfig: {},
      estTemplate: false,
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-3-1" },
    update: {},
    create: {
      id: "demo-step-3-1",
      workflowId: workflow3.id,
      nom: "Génération attestations",
      description: "Génère les attestations de fin de formation",
      ordre: 1,
      type: "GENERER_DOCUMENT",
      config: {
        typeDocument: "ATTESTATION_FIN",
        pourTousLesParticipants: true,
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-3-2" },
    update: {},
    create: {
      id: "demo-step-3-2",
      workflowId: workflow3.id,
      nom: "Envoi attestations",
      description: "Envoie les attestations aux participants",
      ordre: 2,
      type: "ENVOYER_EMAIL",
      config: {
        destinataire: "participants",
        sujet: "Votre attestation de formation - {{formation.titre}}",
        contenu: "Bonjour {{apprenant.prenom}},\n\nFélicitations pour avoir terminé la formation \"{{formation.titre}}\" !\n\nVous trouverez ci-joint votre attestation de fin de formation.\n\nCordialement",
        joindreDocuments: ["attestation"],
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-3-3" },
    update: {},
    create: {
      id: "demo-step-3-3",
      workflowId: workflow3.id,
      nom: "Délai évaluation",
      description: "Attendre 1 jour avant l'enquête",
      ordre: 3,
      type: "DELAI",
      config: {
        duree: 1,
        unite: "jours",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-3-4" },
    update: {},
    create: {
      id: "demo-step-3-4",
      workflowId: workflow3.id,
      nom: "Enquête satisfaction",
      description: "Envoie l'enquête de satisfaction à chaud",
      ordre: 4,
      type: "ENVOYER_EMAIL",
      config: {
        destinataire: "participants",
        sujet: "Votre avis compte ! Enquête de satisfaction",
        contenu: "Bonjour {{apprenant.prenom}},\n\nVous avez terminé la formation \"{{formation.titre}}\" hier.\n\nPourriez-vous prendre 2 minutes pour nous donner votre avis ?\n\n👉 {{lien.enquete}}\n\nMerci pour votre retour !",
      },
    },
  });

  // Workflow 4: Relance signatures
  const workflow4 = await prisma.workflow.upsert({
    where: { id: "demo-workflow-signatures" },
    update: {},
    create: {
      id: "demo-workflow-signatures",
      organizationId: demoOrg.id,
      nom: "Relance documents non signés",
      description: "Relance automatiquement les apprenants qui n'ont pas signé leurs documents",
      icone: "✍️",
      categorie: "DOCUMENT",
      triggerType: "DOCUMENT_NON_SIGNE",
      triggerConfig: {
        delaiJours: 3,
      },
      estTemplate: false,
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-4-1" },
    update: {},
    create: {
      id: "demo-step-4-1",
      workflowId: workflow4.id,
      nom: "Email de relance",
      description: "Premier email de relance",
      ordre: 1,
      type: "ENVOYER_EMAIL",
      config: {
        destinataire: "apprenant",
        sujet: "Rappel: Document en attente de signature",
        contenu: "Bonjour {{apprenant.prenom}},\n\nVous avez un document en attente de signature : {{document.nom}}.\n\nMerci de le signer dans les plus brefs délais en cliquant sur le lien ci-dessous :\n\n👉 {{lien.signature}}\n\nCordialement",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-4-2" },
    update: {},
    create: {
      id: "demo-step-4-2",
      workflowId: workflow4.id,
      nom: "Délai 2 jours",
      description: "Attendre 2 jours",
      ordre: 2,
      type: "DELAI",
      config: {
        duree: 2,
        unite: "jours",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-4-3" },
    update: {},
    create: {
      id: "demo-step-4-3",
      workflowId: workflow4.id,
      nom: "SMS de relance",
      description: "SMS de relance urgent",
      ordre: 3,
      type: "ENVOYER_SMS",
      config: {
        destinataire: "apprenant",
        message: "Urgent: Un document attend votre signature. Merci de le signer rapidement. {{lien.signature}}",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-4-4" },
    update: {},
    create: {
      id: "demo-step-4-4",
      workflowId: workflow4.id,
      nom: "Notification responsable",
      description: "Alerte le responsable formation",
      ordre: 4,
      type: "NOTIFIER_EQUIPE",
      config: {
        titre: "Document non signé",
        message: "{{apprenant.prenom}} {{apprenant.nom}} n'a pas signé le document {{document.nom}} malgré les relances",
        priorite: "HAUTE",
        destinataires: ["responsable"],
      },
    },
  });

  // Workflow 5: Gestion des réclamations
  const workflow5 = await prisma.workflow.upsert({
    where: { id: "demo-workflow-reclamations" },
    update: {},
    create: {
      id: "demo-workflow-reclamations",
      organizationId: demoOrg.id,
      nom: "Traitement des réclamations",
      description: "Automatise le processus de traitement des réclamations selon la norme Qualiopi",
      icone: "⚠️",
      categorie: "QUALITE",
      triggerType: "RECLAMATION_RECUE",
      triggerConfig: {},
      estTemplate: false,
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-5-1" },
    update: {},
    create: {
      id: "demo-step-5-1",
      workflowId: workflow5.id,
      nom: "Accusé de réception",
      description: "Envoie un accusé de réception automatique",
      ordre: 1,
      type: "ENVOYER_EMAIL",
      config: {
        destinataire: "reclamant",
        sujet: "Accusé de réception de votre réclamation",
        contenu: "Bonjour,\n\nNous avons bien reçu votre réclamation concernant : {{reclamation.objet}}.\n\nVotre demande a été enregistrée sous le numéro {{reclamation.numero}}.\n\nNotre équipe qualité va l'examiner et vous répondra sous 48h ouvrées.\n\nCordialement,\nLe service qualité",
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-5-2" },
    update: {},
    create: {
      id: "demo-step-5-2",
      workflowId: workflow5.id,
      nom: "Notification équipe qualité",
      description: "Alerte l'équipe qualité",
      ordre: 2,
      type: "NOTIFIER_EQUIPE",
      config: {
        titre: "Nouvelle réclamation reçue",
        message: "Une nouvelle réclamation a été reçue : {{reclamation.objet}}\nPriorité: {{reclamation.priorite}}",
        priorite: "HAUTE",
        destinataires: ["equipe_qualite"],
      },
    },
  });

  await prisma.workflowEtape.upsert({
    where: { id: "demo-step-5-3" },
    update: {},
    create: {
      id: "demo-step-5-3",
      workflowId: workflow5.id,
      nom: "Création tâche",
      description: "Crée une tâche de traitement",
      ordre: 3,
      type: "CREER_TACHE",
      config: {
        titre: "Traiter réclamation {{reclamation.numero}}",
        description: "Analyser et répondre à la réclamation de {{reclamant.nom}} concernant : {{reclamation.objet}}",
        priorite: "HAUTE",
        echeance: "+2j",
        assignation: "responsable_qualite",
      },
    },
  });

  // Templates d'emails pour les workflows
  console.log("📧 Création des templates d'emails pour workflows...");

  const emailTemplates = [
    {
      id: "demo-email-template-confirmation",
      organizationId: demoOrg.id,
      nom: "Confirmation de pré-inscription",
      sujet: "Confirmation de votre pré-inscription - {{formation.titre}}",
      contenu: "<p>Bonjour {{apprenant.prenom}},</p><p>Nous avons bien reçu votre demande de pré-inscription pour la formation <strong>{{formation.titre}}</strong>.</p><p>Notre équipe va étudier votre dossier et reviendra vers vous sous 48h.</p><p>Cordialement,<br>L'équipe formation</p>",
      variables: [{ nom: "apprenant.prenom", description: "Prénom de l'apprenant" }, { nom: "formation.titre", description: "Titre de la formation" }],
    },
    {
      id: "demo-email-template-rappel",
      organizationId: demoOrg.id,
      nom: "Rappel formation J-7",
      sujet: "Rappel: Votre formation dans 7 jours - {{formation.titre}}",
      contenu: "<p>Bonjour {{apprenant.prenom}},</p><p>Votre formation <strong>{{formation.titre}}</strong> débutera dans 7 jours.</p><p><strong>Date:</strong> {{session.dateDebut}}<br><strong>Lieu:</strong> {{session.lieu}}</p><p>N'oubliez pas de préparer vos documents.</p><p>Cordialement</p>",
      variables: [{ nom: "apprenant.prenom", description: "Prénom de l'apprenant" }, { nom: "formation.titre", description: "Titre de la formation" }],
    },
    {
      id: "demo-email-template-attestation",
      organizationId: demoOrg.id,
      nom: "Envoi attestation de formation",
      sujet: "Votre attestation de formation - {{formation.titre}}",
      contenu: "<p>Bonjour {{apprenant.prenom}},</p><p>Félicitations pour avoir terminé la formation <strong>{{formation.titre}}</strong> !</p><p>Vous trouverez ci-joint votre attestation de fin de formation.</p><p>Cordialement</p>",
      variables: [{ nom: "apprenant.prenom", description: "Prénom de l'apprenant" }, { nom: "formation.titre", description: "Titre de la formation" }],
    },
  ];

  for (const template of emailTemplates) {
    await prisma.workflowEmailTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: template,
    });
  }

  // Templates de SMS pour les workflows
  console.log("📱 Création des templates SMS pour workflows...");

  const smsTemplates = [
    {
      id: "demo-sms-template-rappel",
      organizationId: demoOrg.id,
      nom: "Rappel formation J-1",
      contenu: "Rappel: Votre formation {{formation.titre}} débute demain à {{session.heureDebut}}. Lieu: {{session.lieu}}",
      variables: [{ nom: "formation.titre", description: "Titre de la formation" }, { nom: "session.heureDebut", description: "Heure de début" }],
    },
    {
      id: "demo-sms-template-signature",
      organizationId: demoOrg.id,
      nom: "Relance signature document",
      contenu: "Urgent: Un document attend votre signature pour la formation {{formation.titre}}. Signez ici: {{lien.signature}}",
      variables: [{ nom: "formation.titre", description: "Titre de la formation" }, { nom: "lien.signature", description: "Lien de signature" }],
    },
  ];

  for (const template of smsTemplates) {
    await prisma.workflowSMSTemplate.upsert({
      where: { id: template.id },
      update: {},
      create: template,
    });
  }

  console.log(`   ✓ 5 workflows de démonstration créés`);
  console.log(`   ✓ ${emailTemplates.length} templates d'emails créés`);
  console.log(`   ✓ ${smsTemplates.length} templates SMS créés`);

  // ===========================================
  // Résumé
  // ===========================================
  console.log("\n✅ Seeding terminé avec succès!\n");
  console.log("📊 Résumé:");
  console.log(`   - 1 organisation démo (${demoOrg.name})`);
  console.log(`   - ${systemTemplates.length} templates système`);
  console.log(`   - ${folders.length} dossiers de démonstration`);
  console.log(`   - 2 configurations globales`);
  console.log(`   - 5 workflows d'automatisation`);
  console.log(`   - ${emailTemplates.length} templates d'emails workflow`);
  console.log(`   - ${smsTemplates.length} templates SMS workflow`);
  console.log("\n💡 Note: Les utilisateurs seront créés automatiquement lors de l'inscription via Supabase.");
  console.log("   Le premier utilisateur à s'inscrire deviendra Super Admin.\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erreur lors du seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
