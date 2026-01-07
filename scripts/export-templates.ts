// Script pour exporter les templates de la base de données
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  // Exporter les Template (modèle existant)
  const templates = await prisma.template.findMany({
    where: {
      // Uniquement les templates documents
      category: "DOCUMENT"
    },
    orderBy: { documentType: "asc" },
  });

  console.log(`Found ${templates.length} document templates\n`);

  // Afficher les templates trouvés
  console.log("=== DOCUMENT TEMPLATES ===");
  templates.forEach((t, i) => {
    console.log(`${i + 1}. ${t.documentType}: ${t.name}`);
  });

  // Générer le code TypeScript pour le seed
  const seedCode = templates.map((t) => {
    return `    {
      name: ${JSON.stringify(t.name)},
      description: ${t.description ? JSON.stringify(t.description) : "null"},
      category: TemplateCategory.${t.category},
      documentType: ${t.documentType ? `DocumentType.${t.documentType}` : "undefined"},
      isSystem: ${t.isSystem},
      variables: ${JSON.stringify(t.variables)},
      content: ${JSON.stringify(t.content)},
    }`;
  });

  const output = `// ===========================================
// TEMPLATES DE DOCUMENTS PAR DÉFAUT
// ===========================================
// Générés automatiquement depuis la base de données
// Date: ${new Date().toISOString()}

import { TemplateCategory, DocumentType } from "@prisma/client";

export const DEFAULT_DOCUMENT_TEMPLATES = [
${seedCode.join(",\n")}
];
`;

  fs.writeFileSync("prisma/seed-document-templates.ts", output);
  console.log("\n✅ Templates exported to prisma/seed-document-templates.ts");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
