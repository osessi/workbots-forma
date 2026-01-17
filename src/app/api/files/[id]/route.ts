// ===========================================
// API FILES [ID] - Opérations sur un fichier spécifique
// ===========================================
// GET /api/files/[id] - Récupérer un fichier
// DELETE /api/files/[id] - Supprimer un fichier importé

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

const STORAGE_BUCKET = "worksbots-forma-stockage";

// Client admin avec service role (bypass RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// GET - Récupérer un fichier spécifique
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

    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error("Erreur récupération fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du fichier" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un fichier importé
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer le fichier
    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    // Vérifier que c'est un fichier importé (pas un fichier système)
    // Les fichiers système ont généralement un category spécifique ou sont liés à des documents générés
    const systemCategories = ["FICHE_PEDAGOGIQUE", "SLIDES", "EVALUATION", "SUPPORT_STAGIAIRE"];
    const isSystemFile = systemCategories.includes(file.category) && file.formationId;

    if (isSystemFile) {
      return NextResponse.json(
        { error: "Impossible de supprimer un fichier système généré automatiquement" },
        { status: 403 }
      );
    }

    // Supprimer le fichier du storage Supabase
    if (file.storagePath) {
      const adminClient = getAdminClient();
      const { error: storageError } = await adminClient.storage
        .from(STORAGE_BUCKET)
        .remove([file.storagePath]);

      if (storageError) {
        console.error("Erreur suppression storage:", storageError);
        // On continue quand même pour supprimer l'entrée en base
      }
    }

    // Supprimer le contenu du fichier s'il existe
    await prisma.fileContent.deleteMany({
      where: { fileId: id },
    });

    // Supprimer l'entrée en base de données
    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Fichier supprimé" });
  } catch (error) {
    console.error("Erreur suppression fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier" },
      { status: 500 }
    );
  }
}
