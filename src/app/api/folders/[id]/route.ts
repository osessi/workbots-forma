// ===========================================
// API FOLDERS [ID] - Opérations sur un dossier spécifique
// ===========================================
// GET /api/folders/[id] - Récupérer un dossier
// DELETE /api/folders/[id] - Supprimer un dossier créé par l'utilisateur
// PATCH /api/folders/[id] - Renommer un dossier

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

// GET - Récupérer un dossier spécifique
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

    const folder = await prisma.folder.findFirst({
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
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        files: {
          orderBy: { createdAt: "desc" },
        },
        children: {
          include: {
            files: true,
          },
        },
        _count: {
          select: { files: true, children: true },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Erreur récupération dossier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du dossier" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un dossier créé par l'utilisateur
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

    // Récupérer le dossier avec ses fichiers et sous-dossiers
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        files: true,
        children: {
          include: {
            files: true,
            children: {
              include: {
                files: true,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    // Vérifier que c'est un dossier créé par l'utilisateur (pas un dossier système)
    // Les dossiers système sont les dossiers RACINE liés à une formation, un apprenant ou une entreprise
    // Un sous-dossier créé par l'utilisateur dans un dossier de formation peut être supprimé
    const isRootSystemFolder = !folder.parentId && (folder.formationId || folder.apprenantId || folder.entrepriseId);

    if (isRootSystemFolder) {
      return NextResponse.json(
        { error: "Impossible de supprimer un dossier système généré automatiquement" },
        { status: 403 }
      );
    }

    // Collecter tous les fichiers à supprimer (récursivement)
    const filesToDelete: string[] = [];

    const collectFiles = (files: { storagePath: string }[]) => {
      files.forEach(f => {
        if (f.storagePath) {
          filesToDelete.push(f.storagePath);
        }
      });
    };

    collectFiles(folder.files);
    folder.children.forEach(child => {
      collectFiles(child.files);
      if ('children' in child && Array.isArray(child.children)) {
        child.children.forEach((grandchild: { files: { storagePath: string }[] }) => {
          collectFiles(grandchild.files);
        });
      }
    });

    // Supprimer les fichiers du storage Supabase
    if (filesToDelete.length > 0) {
      const adminClient = getAdminClient();
      const { error: storageError } = await adminClient.storage
        .from(STORAGE_BUCKET)
        .remove(filesToDelete);

      if (storageError) {
        console.error("Erreur suppression storage:", storageError);
        // On continue quand même
      }
    }

    // Supprimer le dossier et tout son contenu (cascade)
    // D'abord supprimer les contenus de fichiers
    const allFileIds = [
      ...folder.files.map(f => f.id),
      ...folder.children.flatMap(c => c.files.map(f => f.id)),
      ...folder.children.flatMap(c =>
        'children' in c && Array.isArray(c.children)
          ? c.children.flatMap((gc: { files: { id: string }[] }) => gc.files.map(f => f.id))
          : []
      ),
    ];

    if (allFileIds.length > 0) {
      await prisma.fileContent.deleteMany({
        where: { fileId: { in: allFileIds } },
      });
    }

    // Supprimer les fichiers
    await prisma.file.deleteMany({
      where: { folderId: id },
    });

    // Supprimer les fichiers des sous-dossiers
    const childIds = folder.children.map(c => c.id);
    if (childIds.length > 0) {
      // Supprimer les fichiers des petits-enfants d'abord
      const grandchildIds = folder.children.flatMap(c =>
        'children' in c && Array.isArray(c.children)
          ? c.children.map((gc: { id: string }) => gc.id)
          : []
      );

      if (grandchildIds.length > 0) {
        await prisma.file.deleteMany({
          where: { folderId: { in: grandchildIds } },
        });
        await prisma.folder.deleteMany({
          where: { id: { in: grandchildIds } },
        });
      }

      // Supprimer les fichiers des enfants
      await prisma.file.deleteMany({
        where: { folderId: { in: childIds } },
      });
      await prisma.folder.deleteMany({
        where: { id: { in: childIds } },
      });
    }

    // Supprimer le dossier principal
    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Dossier supprimé" });
  } catch (error) {
    console.error("Erreur suppression dossier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du dossier" },
      { status: 500 }
    );
  }
}

// PATCH - Renommer un dossier
export async function PATCH(
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
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Le nom du dossier est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le dossier existe et appartient à l'organisation
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Dossier non trouvé" }, { status: 404 });
    }

    // Vérifier que c'est un dossier créé par l'utilisateur
    // Les dossiers système RACINE ne peuvent pas être renommés
    const isRootSystemFolder = !folder.parentId && (folder.formationId || folder.apprenantId || folder.entrepriseId);

    if (isRootSystemFolder) {
      return NextResponse.json(
        { error: "Impossible de renommer un dossier système" },
        { status: 403 }
      );
    }

    // Mettre à jour le nom
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      success: true,
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
      },
    });
  } catch (error) {
    console.error("Erreur renommage dossier:", error);
    return NextResponse.json(
      { error: "Erreur lors du renommage du dossier" },
      { status: 500 }
    );
  }
}
