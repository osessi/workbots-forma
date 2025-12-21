// ===========================================
// API VERSIONS DE TEMPLATE
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Liste des versions d'un template
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Verifier que le template existe et est accessible
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [
          { isSystem: true },
          ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    // Recuperer les versions
    const versions = await prisma.templateVersion.findMany({
      where: { templateId: id },
      orderBy: { version: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Erreur liste versions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des versions" },
      { status: 500 }
    );
  }
}

// POST - Creer une nouvelle version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Verifier les droits admin
    if (!dbUser.isSuperAdmin && dbUser.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Verifier que le template existe
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [
          ...(dbUser.isSuperAdmin ? [{ isSystem: true }] : []),
          ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    const { changeNote } = body;

    // Trouver la derniere version
    const lastVersion = await prisma.templateVersion.findFirst({
      where: { templateId: id },
      orderBy: { version: "desc" },
    });

    const newVersionNumber = (lastVersion?.version || 0) + 1;

    // Creer la nouvelle version avec le contenu actuel du template
    const version = await prisma.templateVersion.create({
      data: {
        templateId: id,
        version: newVersionNumber,
        content: template.content ?? {},
        headerContent: template.headerContent ?? undefined,
        footerContent: template.footerContent ?? undefined,
        changeNote: changeNote || `Version ${newVersionNumber}`,
        createdById: dbUser.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("Erreur création version:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la version" },
      { status: 500 }
    );
  }
}
