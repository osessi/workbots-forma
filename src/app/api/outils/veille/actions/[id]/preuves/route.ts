// ===========================================
// API VEILLE ACTION PREUVES - Upload/Delete
// Corrections 402-407 : Exploitation de la veille
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Client Supabase pour le storage (avec service role key)
const supabaseStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST - Upload une preuve
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: actionId } = await params;
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

    // Vérifier que l'action appartient à l'organisation
    const action = await prisma.veilleAction.findFirst({
      where: {
        id: actionId,
        organizationId: user.organizationId,
      },
    });

    if (!action) {
      return NextResponse.json({ error: "Action non trouvée" }, { status: 404 });
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 MB)" },
        { status: 400 }
      );
    }

    // Générer un nom unique
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `veille-preuves/${user.organizationId}/${actionId}/${timestamp}_${sanitizedName}`;

    // Upload vers Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseStorage.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Erreur upload Supabase:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload" },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabaseStorage.storage
      .from("documents")
      .getPublicUrl(storagePath);

    // Créer la preuve en base
    const preuve = await prisma.veilleActionPreuve.create({
      data: {
        actionId,
        nom: file.name,
        url: urlData.publicUrl,
        storagePath,
        type: file.type,
        taille: file.size,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(preuve, { status: 201 });
  } catch (error) {
    console.error("Erreur POST veille preuve:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une preuve
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: actionId } = await params;
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

    // Récupérer l'ID de la preuve depuis le body
    const body = await request.json();
    const { preuveId } = body;

    if (!preuveId) {
      return NextResponse.json({ error: "ID de preuve requis" }, { status: 400 });
    }

    // Vérifier que la preuve appartient à l'action de l'organisation
    const preuve = await prisma.veilleActionPreuve.findFirst({
      where: {
        id: preuveId,
        actionId,
        action: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!preuve) {
      return NextResponse.json({ error: "Preuve non trouvée" }, { status: 404 });
    }

    // Supprimer du storage Supabase
    if (preuve.storagePath) {
      const { error: deleteError } = await supabaseStorage.storage
        .from("documents")
        .remove([preuve.storagePath]);

      if (deleteError) {
        console.error("Erreur suppression Supabase:", deleteError);
        // On continue quand même pour supprimer l'entrée en base
      }
    }

    // Supprimer de la base
    await prisma.veilleActionPreuve.delete({
      where: { id: preuveId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE veille preuve:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
