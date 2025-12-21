// ===========================================
// API FILE CONTENT - Récupération/Mise à jour du contenu
// ===========================================
// GET /api/files/[id]/content - Récupérer le contenu
// PUT /api/files/[id]/content - Mettre à jour le contenu

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour authentifier l'utilisateur
async function authenticateUser() {
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
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: { organization: true },
  });

  return user;
}

// GET - Récupérer le contenu du fichier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le fichier appartient à l'organisation
    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        fileContent: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    // Retourner le contenu s'il existe
    const content = file.fileContent?.content || null;

    return NextResponse.json({
      id: file.id,
      name: file.name,
      content,
      mimeType: file.mimeType,
    });
  } catch (error) {
    console.error("Erreur récupération contenu fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du contenu" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le contenu du fichier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
    }

    // Vérifier que le fichier appartient à l'organisation
    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    // Créer ou mettre à jour le contenu
    const fileContent = await prisma.fileContent.upsert({
      where: { fileId: id },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        fileId: id,
        content,
      },
    });

    // Mettre à jour la taille du fichier
    await prisma.file.update({
      where: { id },
      data: {
        size: Buffer.byteLength(content, "utf-8"),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      fileId: id,
      contentId: fileContent.id,
      message: "Contenu mis à jour",
    });
  } catch (error) {
    console.error("Erreur mise à jour contenu fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du contenu" },
      { status: 500 }
    );
  }
}
