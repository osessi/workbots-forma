// ===========================================
// API: GESTION D'UNE PROCÉDURE PAR TYPE
// GET /api/organisation/procedures/[type] - Détails
// PATCH /api/organisation/procedures/[type] - Modifier
// DELETE /api/organisation/procedures/[type] - Supprimer
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { ProcedureType } from "@prisma/client";

// Helper pour créer le client Supabase
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

// ===========================================
// GET - Détails d'une procédure
// ===========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const procedure = await prisma.procedure.findUnique({
      where: {
        organizationId_type: {
          organizationId: dbUser.organizationId,
          type: type as ProcedureType,
        },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            content: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!procedure) {
      return NextResponse.json(
        { error: "Procédure non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(procedure);
  } catch (error) {
    console.error("[API] GET /api/organisation/procedures/[type] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// PATCH - Modifier une procédure
// ===========================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, firstName: true, lastName: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la procédure existe
    const existingProcedure = await prisma.procedure.findUnique({
      where: {
        organizationId_type: {
          organizationId: dbUser.organizationId,
          type: type as ProcedureType,
        },
      },
    });

    if (!existingProcedure) {
      return NextResponse.json(
        { error: "Procédure non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nom, description, content, isPublished, fileUrl } = body;

    // Si le contenu change, créer une nouvelle version
    const contentChanged = content && JSON.stringify(content) !== JSON.stringify(existingProcedure.content);

    // Transaction pour mettre à jour et créer la version
    const result = await prisma.$transaction(async (tx) => {
      // Créer une version si le contenu a changé
      if (contentChanged) {
        await tx.procedureVersion.create({
          data: {
            procedureId: existingProcedure.id,
            content: existingProcedure.content || {},
            version: existingProcedure.version,
            modifiedById: dbUser.id,
            modifiedByName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || "Utilisateur",
            changeNotes: body.changeNotes || "Modification du contenu",
          },
        });
      }

      // Mettre à jour la procédure
      const procedure = await tx.procedure.update({
        where: {
          organizationId_type: {
            organizationId: dbUser.organizationId,
            type: type as ProcedureType,
          },
        },
        data: {
          ...(nom !== undefined && { nom }),
          ...(description !== undefined && { description }),
          ...(content !== undefined && { content }),
          ...(fileUrl !== undefined && { fileUrl }),
          ...(isPublished !== undefined && {
            isPublished,
            publishedAt: isPublished ? new Date() : null,
          }),
          ...(contentChanged && { version: { increment: 1 } }),
          lastModifiedBy: dbUser.id,
        },
        include: {
          versions: {
            take: 5,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return procedure;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] PATCH /api/organisation/procedures/[type] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer une procédure
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la procédure existe
    const procedure = await prisma.procedure.findUnique({
      where: {
        organizationId_type: {
          organizationId: dbUser.organizationId,
          type: type as ProcedureType,
        },
      },
    });

    if (!procedure) {
      return NextResponse.json(
        { error: "Procédure non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer (les versions seront supprimées en cascade)
    await prisma.procedure.delete({
      where: {
        organizationId_type: {
          organizationId: dbUser.organizationId,
          type: type as ProcedureType,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/organisation/procedures/[type] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
