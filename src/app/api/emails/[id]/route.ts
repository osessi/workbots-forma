// ===========================================
// API EMAIL DETAIL - GET /api/emails/[id]
// ===========================================
// Récupérer le contenu complet d'un email

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer l'email
    const email = await prisma.sentEmail.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!email) {
      return NextResponse.json({ error: "Email non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Erreur API email detail:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'email" },
      { status: 500 }
    );
  }
}
