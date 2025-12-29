// ===========================================
// API PROCEDURES - Qualiopi IND 26
// Gestion des procédures qualité de l'organisme
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { ProcedureType } from "@prisma/client";
import { PROCEDURE_TYPES_INFO } from "@/lib/procedures";

// GET - Récupérer les procédures de l'organisation
export async function GET() {
  try {
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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer les procédures existantes
    const procedures = await prisma.procedure.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: {
        type: "asc",
      },
    });

    // Construire la liste complète avec les types disponibles
    const allTypes = Object.entries(PROCEDURE_TYPES_INFO).map(([type, info]) => {
      const existing = procedures.find((p) => p.type === type);
      return {
        type,
        ...info,
        procedure: existing || null,
        hasContent: !!existing?.content,
        isPublished: existing?.isPublished || false,
        version: existing?.version || 0,
        versionsCount: existing?._count?.versions || 0,
        updatedAt: existing?.updatedAt || null,
      };
    });

    return NextResponse.json({
      procedures: allTypes,
      stats: {
        total: Object.keys(PROCEDURE_TYPES_INFO).length - 1, // -1 pour PERSONNALISEE
        completed: procedures.filter((p) => p.content && p.type !== "PERSONNALISEE").length,
        published: procedures.filter((p) => p.isPublished).length,
      },
    });
  } catch (error) {
    console.error("Erreur récupération procédures:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des procédures" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour une procédure
export async function POST(request: NextRequest) {
  try {
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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { type, nom, description, content, isPublished, changeNotes } = body;

    if (!type) {
      return NextResponse.json({ error: "Le type de procédure est requis" }, { status: 400 });
    }

    // Vérifier si la procédure existe déjà
    const existing = await prisma.procedure.findFirst({
      where: {
        organizationId: user.organizationId,
        type: type as ProcedureType,
      },
    });

    if (existing) {
      // Mettre à jour - créer une version d'abord si le contenu change
      if (content && existing.content) {
        await prisma.procedureVersion.create({
          data: {
            procedureId: existing.id,
            content: existing.content,
            version: existing.version,
            modifiedById: user.id,
            modifiedByName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            changeNotes: changeNotes || null,
          },
        });
      }

      const procedure = await prisma.procedure.update({
        where: { id: existing.id },
        data: {
          nom: nom || existing.nom,
          description: description !== undefined ? description : existing.description,
          content: content !== undefined ? content : existing.content,
          isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
          publishedAt: isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
          version: content ? existing.version + 1 : existing.version,
          lastModifiedBy: user.id,
        },
        include: {
          _count: {
            select: { versions: true },
          },
        },
      });

      return NextResponse.json(procedure);
    } else {
      // Créer une nouvelle procédure
      const typeInfo = PROCEDURE_TYPES_INFO[type as ProcedureType];

      const procedure = await prisma.procedure.create({
        data: {
          type: type as ProcedureType,
          nom: nom || typeInfo?.nom || type,
          description: description || typeInfo?.description || null,
          content: content || null,
          organizationId: user.organizationId,
          isPublished: isPublished || false,
          publishedAt: isPublished ? new Date() : null,
          lastModifiedBy: user.id,
        },
        include: {
          _count: {
            select: { versions: true },
          },
        },
      });

      return NextResponse.json(procedure, { status: 201 });
    }
  } catch (error) {
    console.error("Erreur création/mise à jour procédure:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la procédure" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une procédure (soft delete)
export async function DELETE(request: NextRequest) {
  try {
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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Vérifier que la procédure appartient à l'organisation
    const procedure = await prisma.procedure.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!procedure) {
      return NextResponse.json({ error: "Procédure non trouvée" }, { status: 404 });
    }

    // Soft delete
    await prisma.procedure.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression procédure:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
