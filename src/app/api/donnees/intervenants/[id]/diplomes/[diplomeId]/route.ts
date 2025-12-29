// ===========================================
// API DIPLOME INTERVENANT - CRUD par ID
// Qualiopi IND 17 - Gestion individuelle des diplômes
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// PUT - Modifier un diplôme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; diplomeId: string }> }
) {
  try {
    const { id, diplomeId } = await params;
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

    // Vérifier que l'intervenant appartient à l'organisation
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    // Vérifier que le diplôme existe et appartient à cet intervenant
    const existingDiplome = await prisma.intervenantDiplome.findFirst({
      where: {
        id: diplomeId,
        intervenantId: id,
      },
    });

    if (!existingDiplome) {
      return NextResponse.json({ error: "Diplôme non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { intitule, organisme, anneeObtention, niveau, fichierUrl } = body;

    const diplome = await prisma.intervenantDiplome.update({
      where: { id: diplomeId },
      data: {
        intitule,
        organisme,
        anneeObtention: anneeObtention !== undefined ? (anneeObtention ? parseInt(anneeObtention) : null) : undefined,
        niveau,
        fichierUrl,
      },
    });

    return NextResponse.json(diplome);
  } catch (error) {
    console.error("Erreur modification diplôme:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du diplôme" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un diplôme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; diplomeId: string }> }
) {
  try {
    const { id, diplomeId } = await params;
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

    // Vérifier que l'intervenant appartient à l'organisation
    const intervenant = await prisma.intervenant.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!intervenant) {
      return NextResponse.json({ error: "Intervenant non trouvé" }, { status: 404 });
    }

    // Vérifier que le diplôme existe et appartient à cet intervenant
    const existingDiplome = await prisma.intervenantDiplome.findFirst({
      where: {
        id: diplomeId,
        intervenantId: id,
      },
    });

    if (!existingDiplome) {
      return NextResponse.json({ error: "Diplôme non trouvé" }, { status: 404 });
    }

    await prisma.intervenantDiplome.delete({
      where: { id: diplomeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression diplôme:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du diplôme" },
      { status: 500 }
    );
  }
}
