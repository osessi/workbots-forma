// ===========================================
// API FOLDERS - Gestion des dossiers
// ===========================================
// POST /api/folders - Créer un nouveau dossier
// GET /api/folders - Lister les dossiers

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// POST - Créer un nouveau dossier
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId, formationId, apprenantId, entrepriseId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Le nom du dossier est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le parent existe et appartient à l'organisation
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          organizationId: user.organizationId,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Dossier parent non trouvé" },
          { status: 404 }
        );
      }
    }

    // Vérifier que la formation existe et appartient à l'organisation
    if (formationId) {
      const formation = await prisma.formation.findFirst({
        where: {
          id: formationId,
          organizationId: user.organizationId,
        },
      });

      if (!formation) {
        return NextResponse.json(
          { error: "Formation non trouvée" },
          { status: 404 }
        );
      }
    }

    // Créer le dossier
    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        organizationId: user.organizationId,
        parentId: parentId || null,
        formationId: formationId || null,
        apprenantId: apprenantId || null,
        entrepriseId: entrepriseId || null,
      },
    });

    return NextResponse.json({
      success: true,
      folder: {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        formationId: folder.formationId,
        apprenantId: folder.apprenantId,
        entrepriseId: folder.entrepriseId,
        createdAt: folder.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur création dossier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du dossier" },
      { status: 500 }
    );
  }
}

// Types pour l'arborescence
interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  formationId: string | null;
  formation: { id: string; titre: string } | null;
  apprenantId: string | null;
  apprenant: { id: string; nom: string; prenom: string } | null;
  entrepriseId: string | null;
  entreprise: { id: string; raisonSociale: string } | null;
  children: FolderNode[];
  filesCount: number;
  createdAt: string;
}

// GET - Lister les dossiers avec arborescence
export async function GET() {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer tous les dossiers avec leurs fichiers
    const folders = await prisma.folder.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        formation: {
          select: { id: true, titre: true },
        },
        apprenant: {
          select: { id: true, nom: true, prenom: true },
        },
        entreprise: {
          select: { id: true, raisonSociale: true },
        },
        _count: {
          select: { files: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Construire l'arborescence
    const folderMap = new Map<string, FolderNode>();

    // Première passe : créer tous les nœuds
    folders.forEach((f) => {
      folderMap.set(f.id, {
        id: f.id,
        name: f.name,
        parentId: f.parentId,
        formationId: f.formationId,
        formation: f.formation,
        apprenantId: f.apprenantId,
        apprenant: f.apprenant,
        entrepriseId: f.entrepriseId,
        entreprise: f.entreprise,
        children: [],
        filesCount: f._count.files,
        createdAt: f.createdAt.toISOString(),
      });
    });

    // Deuxième passe : construire la hiérarchie
    const rootFolders: FolderNode[] = [];
    folderMap.forEach((folder) => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folder);
        } else {
          // Parent non trouvé, traiter comme racine
          rootFolders.push(folder);
        }
      } else {
        rootFolders.push(folder);
      }
    });

    // Trier les enfants par nom
    const sortChildren = (folders: FolderNode[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach((f) => sortChildren(f.children));
    };
    sortChildren(rootFolders);

    // Liste plate pour le sélecteur (avec indentation)
    const flatList: { id: string; name: string; depth: number; path: string }[] = [];
    const buildFlatList = (folders: FolderNode[], depth: number, pathPrefix: string) => {
      folders.forEach((f) => {
        const path = pathPrefix ? `${pathPrefix} / ${f.name}` : f.name;
        flatList.push({
          id: f.id,
          name: f.name,
          depth,
          path,
        });
        buildFlatList(f.children, depth + 1, path);
      });
    };
    buildFlatList(rootFolders, 0, "");

    return NextResponse.json({
      tree: rootFolders,
      flatList,
      total: folders.length,
    });
  } catch (error) {
    console.error("Erreur récupération dossiers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dossiers" },
      { status: 500 }
    );
  }
}
