import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function generateDefaultTemplates() {
  try {
    console.log('=== GÉNÉRATION DES DEFAULT TEMPLATES ===\n');

    // Récupérer tous les templates système de la base
    const templates = await prisma.template.findMany({
      where: { isSystem: true },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Trouvé ${templates.length} templates système\n`);

    // Générer le fichier TypeScript
    let output = `// ===========================================
// TEMPLATES PAR DEFAUT - GÉNÉRÉS DEPUIS LA BASE DE DONNÉES
// ===========================================
// Ces templates sont créés automatiquement comme templates système
// Design épuré, professionnel et conforme aux normes Qualiopi
// GÉNÉRÉ LE: ${new Date().toISOString()}

export interface DefaultTemplate {
  name: string;
  description: string;
  documentType: string;
  category: "DOCUMENT" | "EMAIL" | "PDF";
  content: object;
  headerContent?: object;
  footerContent?: object;
  variables: string[];
}

`;

    // Générer chaque template
    const templateVarNames: string[] = [];

    for (const template of templates) {
      // Créer un nom de variable valide
      const varName = template.name
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') + '_TEMPLATE';

      templateVarNames.push(varName);

      console.log(`- Génération: ${template.name} -> ${varName}`);

      output += `// ===========================================
// TEMPLATE: ${template.name.toUpperCase()}
// ===========================================
export const ${varName}: DefaultTemplate = ${JSON.stringify({
        name: template.name,
        description: template.description || '',
        documentType: template.documentType,
        category: template.category,
        content: template.content,
        headerContent: template.headerContent || undefined,
        footerContent: template.footerContent || undefined,
        variables: template.variables || [],
      }, null, 2)};

`;
    }

    // Ajouter l'export de tous les templates
    output += `// ===========================================
// LISTE DE TOUS LES TEMPLATES
// ===========================================
export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  ${templateVarNames.join(',\n  ')},
];
`;

    // Écrire le fichier
    const outputPath = path.join(process.cwd(), 'src/lib/templates/default-templates.ts');

    // D'abord, sauvegarder l'ancien fichier
    const backupPath = path.join(process.cwd(), 'backups', `default-templates-backup-${Date.now()}.ts`);
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, backupPath);
      console.log(`\n✓ Ancien fichier sauvegardé: ${backupPath}`);
    }

    fs.writeFileSync(outputPath, output);
    console.log(`\n✓ Nouveau fichier généré: ${outputPath}`);

    // Vérifier que le fichier est valide (syntaxe TS)
    console.log('\n=== TEMPLATES GÉNÉRÉS ===');
    templateVarNames.forEach((name, i) => {
      console.log(`${i+1}. ${name}`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateDefaultTemplates();
