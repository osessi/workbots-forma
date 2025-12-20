// ===========================================
// API EXPORT DES TEMPLATES
// ===========================================
// GET /api/admin/templates/export
// Exporte tous les templates en JSON pour backup

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export async function GET() {
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

    // Récupérer tous les templates
    const templates = await prisma.template.findMany({
      orderBy: { name: "asc" },
    });

    // Créer le backup avec métadonnées
    const backup = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      totalTemplates: templates.length,
      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        documentType: template.documentType,
        category: template.category,
        content: template.content,
        headerContent: template.headerContent,
        footerContent: template.footerContent,
        variables: template.variables,
        isSystem: template.isSystem,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })),
    };

    // Retourner le JSON avec headers pour téléchargement
    const jsonString = JSON.stringify(backup, null, 2);
    const fileName = `templates-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erreur export templates:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export des templates" },
      { status: 500 }
    );
  }
}
