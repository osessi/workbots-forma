// ===========================================
// API VARIABLE PERSONNALISEE (DETAIL)
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Recuperer une variable
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

    if (!dbUser || !dbUser.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const variable = await prisma.customVariable.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!variable) {
      return NextResponse.json({ error: "Variable non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ variable });
  } catch (error) {
    console.error("Erreur récupération variable:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la variable" },
      { status: 500 }
    );
  }
}

// PUT - Mettre a jour une variable
export async function PUT(
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

    if (!dbUser || !dbUser.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Verifier les droits admin
    if (!dbUser.isSuperAdmin && dbUser.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Verifier que la variable existe
    const existing = await prisma.customVariable.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Variable non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { label, description, category, defaultValue, dataType } = body;

    const updatedVariable = await prisma.customVariable.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(defaultValue !== undefined && { defaultValue }),
        ...(dataType && { dataType }),
      },
    });

    return NextResponse.json({ variable: updatedVariable });
  } catch (error) {
    console.error("Erreur mise à jour variable:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la variable" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une variable
export async function DELETE(
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

    if (!dbUser || !dbUser.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Verifier les droits admin
    if (!dbUser.isSuperAdmin && dbUser.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Verifier que la variable existe
    const existing = await prisma.customVariable.findFirst({
      where: {
        id,
        organizationId: dbUser.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Variable non trouvée" }, { status: 404 });
    }

    await prisma.customVariable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression variable:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la variable" },
      { status: 500 }
    );
  }
}
