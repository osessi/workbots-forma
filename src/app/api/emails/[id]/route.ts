// ===========================================
// API EMAIL DETAIL - GET /api/emails/[id]
// ===========================================
// Récupérer le contenu complet d'un email

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authentification
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
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
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
