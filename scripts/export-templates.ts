import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportTemplates() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Créer un backup avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupsDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupsDir, `templates-backup-${timestamp}.json`);

    // Créer le dossier backups s'il n'existe pas
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    fs.writeFileSync(backupPath, JSON.stringify(templates, null, 2));

    console.log('=== BACKUP CRÉÉ ===');
    console.log('Fichier:', backupPath);
    console.log('Nombre de templates:', templates.length);
    console.log('');
    console.log('=== LISTE DES TEMPLATES ===');
    templates.forEach((t, i) => {
      console.log(`${i+1}. ${t.name} | Type: ${t.documentType} | System: ${t.isSystem}`);
    });

    // Afficher aussi les templates avec type AUTRE pour les identifier
    console.log('');
    console.log('=== TEMPLATES AVEC TYPE "AUTRE" ===');
    const autreTemplates = templates.filter(t => t.documentType === 'AUTRE');
    if (autreTemplates.length === 0) {
      console.log('Aucun template avec le type AUTRE');
    } else {
      autreTemplates.forEach((t, i) => {
        console.log(`${i+1}. ${t.name} (ID: ${t.id})`);
      });
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportTemplates();
