import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping des templates "AUTRE" vers leurs nouveaux types
const templateTypeMapping: Record<string, string> = {
  'Conditions générales de vente': 'CONDITIONS_GENERALES_VENTE',
  'Contrat de sous-traitance': 'CONTRAT_SOUS_TRAITANCE',
  'Évaluation intervenant': 'EVALUATION_INTERVENANT',
  'Évaluation entreprise': 'EVALUATION_ENTREPRISE',
  'Évaluation financeur': 'EVALUATION_FINANCEUR',
};

async function updateTemplateTypes() {
  try {
    console.log('=== MISE À JOUR DES TYPES DE TEMPLATES ===\n');

    // D'abord, récupérer les templates avec type AUTRE
    const templatesWithAutre = await prisma.template.findMany({
      where: { documentType: 'AUTRE' }
    });

    console.log(`Trouvé ${templatesWithAutre.length} templates avec le type AUTRE\n`);

    for (const template of templatesWithAutre) {
      const newType = templateTypeMapping[template.name];

      if (newType) {
        console.log(`Mise à jour: "${template.name}"`);
        console.log(`  - Ancien type: AUTRE`);
        console.log(`  - Nouveau type: ${newType}`);

        await prisma.template.update({
          where: { id: template.id },
          data: { documentType: newType as any }
        });

        console.log(`  ✓ Mise à jour réussie\n`);
      } else {
        console.log(`⚠ Template "${template.name}" n'a pas de mapping défini, conservé en AUTRE\n`);
      }
    }

    // Aussi, mettre à jour "Feuille d'émargement" si elle n'a pas le bon type
    const feuilleEmargement = await prisma.template.findFirst({
      where: { name: "Feuille d'émargement" }
    });

    if (feuilleEmargement && feuilleEmargement.documentType !== 'FEUILLE_EMARGEMENT') {
      console.log(`Mise à jour: "${feuilleEmargement.name}"`);
      console.log(`  - Ancien type: ${feuilleEmargement.documentType}`);
      console.log(`  - Nouveau type: FEUILLE_EMARGEMENT`);

      await prisma.template.update({
        where: { id: feuilleEmargement.id },
        data: { documentType: 'FEUILLE_EMARGEMENT' }
      });

      console.log(`  ✓ Mise à jour réussie\n`);
    }

    // Vérification finale
    console.log('=== VÉRIFICATION FINALE ===\n');
    const allTemplates = await prisma.template.findMany({
      orderBy: { createdAt: 'asc' }
    });

    allTemplates.forEach((t, i) => {
      console.log(`${i+1}. ${t.name} | Type: ${t.documentType}`);
    });

    const remainingAutre = allTemplates.filter(t => t.documentType === 'AUTRE');
    console.log(`\n✓ Templates restant avec type AUTRE: ${remainingAutre.length}`);

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTemplateTypes();
