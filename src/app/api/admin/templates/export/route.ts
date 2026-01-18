// ===========================================
// API EXPORT DES TEMPLATES
// ===========================================
// GET /api/admin/templates/export
// Exporte tous les templates en JSON pour backup

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET() {
  try {
    // Authentification super admin
    const user = await authenticateUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.isSuperAdmin) {
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
