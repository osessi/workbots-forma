// ===========================================
// API VARIABLES PERSONNALISEES
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Liste des variables personnalisees de l'organisation
export async function GET() {
  try {
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

    if (!dbUser.organizationId) {
      return NextResponse.json({ variables: [] });
    }

    const variables = await prisma.customVariable.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: [{ category: "asc" }, { label: "asc" }],
    });

    return NextResponse.json({ variables });
  } catch (error) {
    console.error("Erreur liste variables:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des variables" },
      { status: 500 }
    );
  }
}

// POST - Créer une variable personnalisee
export async function POST(req: NextRequest) {
  try {
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

    if (!dbUser.organizationId) {
      return NextResponse.json(
        { error: "Vous devez appartenir à une organisation" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { variableId, label, description, category, defaultValue, dataType } = body;

    if (!variableId || !label) {
      return NextResponse.json(
        { error: "ID et label requis" },
        { status: 400 }
      );
    }

    // Verifier que l'ID est valide (format: custom.xxx)
    const cleanVariableId = variableId.startsWith("custom.")
      ? variableId
      : `custom.${variableId}`;

    // Verifier que la variable n'existe pas deja
    const existing = await prisma.customVariable.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        variableId: cleanVariableId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Une variable avec cet ID existe déjà" },
        { status: 400 }
      );
    }

    const variable = await prisma.customVariable.create({
      data: {
        variableId: cleanVariableId,
        label,
        description: description || null,
        category: category || "organisation",
        defaultValue: defaultValue || null,
        dataType: dataType || "text",
        organizationId: dbUser.organizationId,
      },
    });

    return NextResponse.json({ variable }, { status: 201 });
  } catch (error) {
    console.error("Erreur création variable:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la variable" },
      { status: 500 }
    );
  }
}
