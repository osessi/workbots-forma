// ===========================================
// API IMPORT DES TEMPLATES
// ===========================================
// POST /api/admin/templates/import
// Importe des templates depuis un fichier JSON backup

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { DocumentType, TemplateCategory } from "@prisma/client";

interface TemplateBackup {
  id?: string;
  name: string;
  description?: string;
  documentType: string;
  category?: string;
  content: unknown;
  headerContent?: unknown;
  footerContent?: unknown;
  variables?: string[];
  isSystem?: boolean;
  isActive?: boolean;
}

interface BackupFile {
  exportDate?: string;
  version?: string;
  totalTemplates?: number;
  templates: TemplateBackup[];
}

// Mapping des types de document
const VALID_DOCUMENT_TYPES: Record<string, DocumentType> = {
  FICHE_PEDAGOGIQUE: "FICHE_PEDAGOGIQUE",
  CONVENTION: "CONVENTION",
  CONVOCATION: "CONVOCATION",
  ATTESTATION_PRESENCE: "ATTESTATION_PRESENCE",
  ATTESTATION_FIN: "ATTESTATION_FIN",
  EVALUATION_CHAUD: "EVALUATION_CHAUD",
  EVALUATION_FROID: "EVALUATION_FROID",
  REGLEMENT_INTERIEUR: "REGLEMENT_INTERIEUR",
  CERTIFICAT: "CERTIFICAT",
  AUTRE: "AUTRE",
};

const VALID_CATEGORIES: Record<string, TemplateCategory> = {
  DOCUMENT: "DOCUMENT",
  EMAIL: "EMAIL",
  PDF: "PDF",
};

export async function POST(request: NextRequest) {
  try {
    // Authentification super admin
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      return NextResponse.json({ error: "Accès réservé aux super admins" }, { status: 403 });
    }

    // Parser le body JSON
    const body = await request.json();
    const { backup, mode = "merge" } = body as { backup: BackupFile; mode?: "merge" | "replace" };

    if (!backup || !backup.templates || !Array.isArray(backup.templates)) {
      return NextResponse.json(
        { error: "Format de backup invalide. Le fichier doit contenir un tableau 'templates'." },
        { status: 400 }
      );
    }

    const results = {
      created: [] as string[],
      updated: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    // Si mode "replace", supprimer tous les templates existants d'abord
    if (mode === "replace") {
      await prisma.template.deleteMany({});
      results.skipped.push("Tous les templates existants ont été supprimés (mode replace)");
    }

    for (const template of backup.templates) {
      try {
        // Valider le nom
        if (!template.name || typeof template.name !== "string") {
          results.errors.push(`Template sans nom valide ignoré`);
          continue;
        }

        // Valider et convertir le type de document
        const documentType = VALID_DOCUMENT_TYPES[template.documentType];
        if (!documentType) {
          results.errors.push(`${template.name}: Type de document invalide '${template.documentType}'`);
          continue;
        }

        // Valider la catégorie (optionnelle)
        const category = template.category ? VALID_CATEGORIES[template.category] : "DOCUMENT";

        // Préparer le contenu
        const content = typeof template.content === "string"
          ? JSON.parse(template.content)
          : template.content;

        const headerContent = template.headerContent
          ? (typeof template.headerContent === "string" ? JSON.parse(template.headerContent) : template.headerContent)
          : null;

        const footerContent = template.footerContent
          ? (typeof template.footerContent === "string" ? JSON.parse(template.footerContent) : template.footerContent)
          : null;

        // Vérifier si le template existe déjà (par nom)
        const existingTemplate = await prisma.template.findFirst({
          where: { name: template.name },
        });

        if (existingTemplate) {
          if (mode === "merge") {
            // Mettre à jour le template existant
            await prisma.template.update({
              where: { id: existingTemplate.id },
              data: {
                description: template.description || existingTemplate.description,
                documentType,
                category: category || existingTemplate.category,
                content,
                headerContent,
                footerContent,
                variables: template.variables || [],
                isActive: template.isActive ?? existingTemplate.isActive,
                updatedAt: new Date(),
              },
            });
            results.updated.push(template.name);
          } else {
            results.skipped.push(template.name);
          }
        } else {
          // Créer le nouveau template
          await prisma.template.create({
            data: {
              name: template.name,
              description: template.description || "",
              documentType,
              category: category || "DOCUMENT",
              content,
              headerContent,
              footerContent,
              variables: template.variables || [],
              isSystem: template.isSystem ?? false,
              isActive: template.isActive ?? true,
            },
          });
          results.created.push(template.name);
        }
      } catch (error) {
        console.error(`Erreur import template ${template.name}:`, error);
        results.errors.push(`${template.name}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import terminé: ${results.created.length} créés, ${results.updated.length} mis à jour, ${results.skipped.length} ignorés, ${results.errors.length} erreurs`,
      results,
    });
  } catch (error) {
    console.error("Erreur import templates:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'import des templates" },
      { status: 500 }
    );
  }
}
