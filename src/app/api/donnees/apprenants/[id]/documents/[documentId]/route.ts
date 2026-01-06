// ===========================================
// API DOCUMENT APPRENANT - /api/donnees/apprenants/[id]/documents/[documentId]
// ===========================================
// Permet de gérer un document spécifique d'un apprenant

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { createClient } from "@supabase/supabase-js";

// Client Supabase pour le storage (avec service role key)
const supabaseStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type RouteParams = {
  params: Promise<{ id: string; documentId: string }>;
};

// DELETE - Supprimer un document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id: apprenantId, documentId } = await params;

    // Vérifier que l'apprenant appartient à l'organisation
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json({ error: "Apprenant non trouvé" }, { status: 404 });
    }

    // Récupérer le document
    const document = await prisma.apprenantDocument.findFirst({
      where: {
        id: documentId,
        apprenantId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    // Supprimer du storage Supabase si le chemin existe
    if (document.storagePath) {
      const { error: deleteError } = await supabaseStorage.storage
        .from("documents")
        .remove([document.storagePath]);

      if (deleteError) {
        console.error("Erreur suppression Supabase:", deleteError);
        // On continue quand même pour supprimer l'entrée en base
      }
    }

    // Supprimer de la base de données
    await prisma.apprenantDocument.delete({
      where: {
        id: documentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE document apprenant:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
