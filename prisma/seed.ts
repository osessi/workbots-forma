// ===========================================
// SEED DATA - Automate Forma
// ===========================================
// Génère des données de test pour le développement

import { PrismaClient, Plan, UserRole, FormationStatus, FileCategory, DocumentType, TemplateCategory } from "@prisma/client";

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
  // 3. Templates système
  // ===========================================
  console.log("📄 Création des templates système...");

  const templates = [
    {
      name: "Fiche Pédagogique Standard",
      description: "Template de fiche pédagogique conforme Qualiopi",
      category: TemplateCategory.DOCUMENT,
      documentType: DocumentType.FICHE_PEDAGOGIQUE,
      isSystem: true,
      variables: ["formation.titre", "formation.description", "formation.duree", "formateur.nom", "organisation.nom"],
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "{{formation.titre}}" }] },
          { type: "paragraph", content: [{ type: "text", text: "Durée: {{formation.duree}} heures" }] },
        ],
      },
    },
    {
      name: "Convention de Formation",
      description: "Template de convention de formation",
      category: TemplateCategory.DOCUMENT,
      documentType: DocumentType.CONVENTION,
      isSystem: true,
      variables: ["formation.titre", "participant.nom", "participant.prenom", "organisation.nom", "dates.debut", "dates.fin"],
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Convention de Formation Professionnelle" }] },
        ],
      },
    },
    {
      name: "Attestation de Fin de Formation",
      description: "Template d'attestation de fin de formation",
      category: TemplateCategory.DOCUMENT,
      documentType: DocumentType.ATTESTATION_FIN,
      isSystem: true,
      variables: ["participant.nom", "participant.prenom", "formation.titre", "dates.debut", "dates.fin", "organisation.nom"],
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Attestation de Fin de Formation" }] },
        ],
      },
    },
    {
      name: "Email de Convocation",
      description: "Template d'email de convocation aux participants",
      category: TemplateCategory.EMAIL,
      isSystem: true,
      variables: ["participant.prenom", "formation.titre", "dates.debut", "lieu", "formateur.nom"],
      content: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Bonjour {{participant.prenom}}," }] },
          { type: "paragraph", content: [{ type: "text", text: "Nous avons le plaisir de vous confirmer votre inscription à la formation {{formation.titre}}." }] },
        ],
      },
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: {
        id: `system-${template.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: template,
      create: {
        id: `system-${template.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...template,
      },
    });
  }

  console.log(`   ✓ ${templates.length} templates système créés`);

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
  // Résumé
  // ===========================================
  console.log("\n✅ Seeding terminé avec succès!\n");
  console.log("📊 Résumé:");
  console.log(`   - 1 organisation démo (${demoOrg.name})`);
  console.log(`   - ${templates.length} templates système`);
  console.log(`   - ${folders.length} dossiers de démonstration`);
  console.log(`   - 2 configurations globales`);
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
