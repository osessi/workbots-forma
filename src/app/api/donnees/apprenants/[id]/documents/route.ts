// ===========================================
// API DOCUMENTS APPRENANT - /api/donnees/apprenants/[id]/documents
// ===========================================
// Permet de gérer les documents liés à un apprenant

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

// Vérifier et créer le bucket si nécessaire
async function ensureBucketExists() {
  const bucketName = "documents";

  // Vérifier si le bucket existe
  const { data: buckets } = await supabaseStorage.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucketName);

  if (!bucketExists) {
    // Créer le bucket avec accès public pour les fichiers
    const { error } = await supabaseStorage.storage.createBucket(bucketName, {
      public: false, // Privé - on utilise des URLs signées
      fileSizeLimit: 10485760, // 10 MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
        "image/gif",
      ],
    });

    if (error) {
      console.error("Erreur création bucket:", error);
    }
  }
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Liste des documents d'un apprenant
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id: apprenantId } = await params;

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

    // Récupérer les documents
    const documents = await prisma.apprenantDocument.findMany({
      where: {
        apprenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Générer des URLs signées fraîches pour chaque document
    const documentsWithFreshUrls = await Promise.all(
      documents.map(async (doc) => {
        let freshUrl = doc.url;

        // Si storagePath existe, générer une nouvelle URL signée
        if (doc.storagePath) {
          const { data: signedUrlData } = await supabaseStorage.storage
            .from("documents")
            .createSignedUrl(doc.storagePath, 3600); // 1 heure

          if (signedUrlData?.signedUrl) {
            freshUrl = signedUrlData.signedUrl;
          }
        }

        return {
          id: doc.id,
          nom: doc.nom,
          type: doc.type,
          taille: doc.taille,
          url: freshUrl,
          createdAt: doc.createdAt.toISOString(),
          createdBy: doc.createdBy,
        };
      })
    );

    return NextResponse.json({
      documents: documentsWithFreshUrls,
    });
  } catch (error) {
    console.error("Erreur GET documents apprenant:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Upload d'un document
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: apprenantId } = await params;

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

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    // Vérifier la taille (max 10 MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 10 MB" },
        { status: 400 }
      );
    }

    // S'assurer que le bucket existe
    await ensureBucketExists();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `apprenants/${apprenantId}/${timestamp}_${safeName}`;

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from("documents")
      .upload(filePath, buffer, {
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

    // Générer une URL signée (valide 1 an = 31536000 secondes)
    // Cela permet d'accéder aux fichiers même si le bucket est privé
    const { data: signedUrlData, error: signedUrlError } = await supabaseStorage.storage
      .from("documents")
      .createSignedUrl(filePath, 31536000); // 1 an

    if (signedUrlError) {
      console.error("Erreur génération URL signée:", signedUrlError);
      // Fallback sur l'URL publique si la signature échoue
    }

    // Utiliser l'URL signée si disponible, sinon l'URL publique
    const documentUrl = signedUrlData?.signedUrl ||
      supabaseStorage.storage.from("documents").getPublicUrl(filePath).data.publicUrl;

    // Créer l'enregistrement en base
    const document = await prisma.apprenantDocument.create({
      data: {
        nom: file.name,
        type: file.type,
        taille: file.size,
        url: documentUrl,
        storagePath: filePath,
        apprenantId,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        nom: document.nom,
        type: document.type,
        taille: document.taille,
        url: document.url,
        createdAt: document.createdAt.toISOString(),
        createdBy: document.createdBy,
      },
    });
  } catch (error) {
    console.error("Erreur POST document apprenant:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
