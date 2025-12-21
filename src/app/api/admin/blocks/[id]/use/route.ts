// ===========================================
// API UTILISATION D'UN BLOC
// ===========================================
// Incremente le compteur d'utilisation d'un bloc

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST - Incrementer le compteur d'utilisation
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

    // Verifier que le bloc existe et est accessible
    const block = await prisma.reusableBlock.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { isSystem: true },
          ...(dbUser.organizationId ? [{ organizationId: dbUser.organizationId }] : []),
        ],
      },
    });

    if (!block) {
      return NextResponse.json({ error: "Bloc non trouvé" }, { status: 404 });
    }

    // Incrementer le compteur
    const updatedBlock = await prisma.reusableBlock.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ usageCount: updatedBlock.usageCount });
  } catch (error) {
    console.error("Erreur utilisation bloc:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du compteur" },
      { status: 500 }
    );
  }
}
