import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface TemplateSetting {
  description: string;
  ordered: boolean;
  default?: boolean;
}

interface TemplateResponse {
  templateID: string;
  templateName?: string;
  files: string[];
  settings: TemplateSetting | null;
}

export async function GET() {
  try {
    // Path to presentation templates
    const templatesDir = path.join(process.cwd(), 'src/components/slides/presentation-templates');

    // Check if directory exists
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json([]);
    }

    const templates: TemplateResponse[] = [];

    // Read all directories in the templates folder
    const items = fs.readdirSync(templatesDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const templateID = item.name;
        const templatePath = path.join(templatesDir, templateID);

        // Get all .tsx files in the template directory
        const files = fs.readdirSync(templatePath)
          .filter(file => file.endsWith('.tsx') && !file.startsWith('_'));

        // Try to load settings.json
        let settings: TemplateSetting | null = null;
        const settingsPath = path.join(templatePath, 'settings.json');
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
            settings = JSON.parse(settingsContent);
          } catch (e) {
            console.error(`Failed to parse settings for ${templateID}:`, e);
          }
        }

        if (files.length > 0) {
          templates.push({
            templateID,
            templateName: templateID.charAt(0).toUpperCase() + templateID.slice(1),
            files,
            settings,
          });
        }
      }
    }

    // Sort templates: default first, then alphabetically
    templates.sort((a, b) => {
      if (a.settings?.default && !b.settings?.default) return -1;
      if (!a.settings?.default && b.settings?.default) return 1;
      return a.templateID.localeCompare(b.templateID);
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error loading templates:', error);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
