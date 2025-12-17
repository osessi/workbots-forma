// ===========================================
// API SEED TEMPLATES PAR DEFAUT
// ===========================================
// POST /api/admin/templates/seed
// Crée les templates système par défaut

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { DEFAULT_TEMPLATES } from "@/lib/templates/default-templates";
import { DocumentType, TemplateCategory } from "@prisma/client";

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

    // Options de la requête
    const body = await request.json().catch(() => ({}));
    const forceUpdate = body.forceUpdate || false;

    const results = {
      created: [] as string[],
      updated: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    for (const template of DEFAULT_TEMPLATES) {
      try {
        // Vérifier si le template existe déjà
        const existingTemplate = await prisma.template.findFirst({
          where: {
            name: template.name,
            isSystem: true,
          },
        });

        if (existingTemplate) {
          if (forceUpdate) {
            // Mettre à jour le template existant
            await prisma.template.update({
              where: { id: existingTemplate.id },
              data: {
                description: template.description,
                documentType: template.documentType as DocumentType,
                category: template.category as TemplateCategory,
                content: template.content,
                headerContent: template.headerContent || undefined,
                footerContent: template.footerContent || undefined,
                variables: template.variables,
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
              description: template.description,
              documentType: template.documentType as DocumentType,
              category: template.category as TemplateCategory,
              content: template.content,
              headerContent: template.headerContent || undefined,
              footerContent: template.footerContent || undefined,
              variables: template.variables,
              isSystem: true,
              isActive: true,
            },
          });
          results.created.push(template.name);
        }
      } catch (error) {
        console.error(`Erreur template ${template.name}:`, error);
        results.errors.push(`${template.name}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seed terminé: ${results.created.length} créés, ${results.updated.length} mis à jour, ${results.skipped.length} ignorés`,
      results,
    });
  } catch (error) {
    console.error("Erreur seed templates:", error);
    return NextResponse.json(
      { error: "Erreur lors du seed des templates" },
      { status: 500 }
    );
  }
}

// GET pour voir les templates système existants
export async function GET() {
  try {
    const systemTemplates = await prisma.template.findMany({
      where: { isSystem: true },
      select: {
        id: true,
        name: true,
        documentType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      templates: systemTemplates,
      total: systemTemplates.length,
      availableDefaults: DEFAULT_TEMPLATES.map(t => ({
        name: t.name,
        documentType: t.documentType,
      })),
    });
  } catch (error) {
    console.error("Erreur GET seed templates:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}
