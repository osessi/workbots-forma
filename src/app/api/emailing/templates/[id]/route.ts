// ===========================================
// API EMAILING TEMPLATE - Détail/Modifier/Supprimer
// GET /api/emailing/templates/[id]
// PATCH /api/emailing/templates/[id]
// DELETE /api/emailing/templates/[id]
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

// GET - Détail d'un template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, isSuperAdmin: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          { isGlobal: true },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 10,
          select: {
            id: true,
            version: true,
            subject: true,
            createdAt: true,
            changeNotes: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[API] GET /api/emailing/templates/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier un template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, isSuperAdmin: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier l'accès au template
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }, { isGlobal: true }] : []),
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    // Un utilisateur normal ne peut pas modifier un template global
    if (template.isGlobal && !dbUser.isSuperAdmin) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier un template global" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      subject,
      category,
      htmlContent,
      textContent,
      jsonContent,
      variables,
      isActive,
      isGlobal,
      changeNotes,
    } = body;

    // Vérifier si le contenu a changé
    const contentChanged =
      (htmlContent && htmlContent !== template.htmlContent) ||
      (subject && subject !== template.subject);

    // Créer une version si le contenu a changé
    if (contentChanged) {
      await prisma.emailTemplateVersion.create({
        data: {
          templateId: id,
          version: template.version,
          subject: template.subject,
          htmlContent: template.htmlContent,
          jsonContent: template.jsonContent as object | undefined,
          createdById: dbUser.id,
          changeNotes: changeNotes || "Modification du contenu",
        },
      });
    }

    // Mettre à jour le template
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(subject !== undefined && { subject }),
        ...(category !== undefined && { category }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(textContent !== undefined && { textContent }),
        ...(jsonContent !== undefined && { jsonContent }),
        ...(variables !== undefined && { variables }),
        ...(isActive !== undefined && { isActive }),
        ...(isGlobal !== undefined && dbUser.isSuperAdmin && { isGlobal }),
        ...(contentChanged && { version: { increment: 1 } }),
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("[API] PATCH /api/emailing/templates/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, isSuperAdmin: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier l'accès
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    if (template.isGlobal && !dbUser.isSuperAdmin) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer un template global" },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.emailTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/emailing/templates/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
