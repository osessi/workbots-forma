// ===========================================
// API VIDEO RECORDINGS - /api/video/recordings
// ===========================================
// Gestion des enregistrements vidéo

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";
import { VideoProvider } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Client Supabase pour le storage
const supabaseStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// GET - Liste des enregistrements
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const meetingId = searchParams.get("meetingId");

    // Construire les filtres
    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (meetingId) {
      where.meetingId = meetingId;
    }

    const recordings = await prisma.videoRecording.findMany({
      where,
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            provider: true,
            scheduledStart: true,
          },
        },
        session: {
          select: {
            id: true,
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        recordedAt: "desc",
      },
    });

    // Générer des URLs signées fraîches pour les enregistrements stockés dans Supabase
    const recordingsWithUrls = await Promise.all(
      recordings.map(async (recording) => {
        let fileUrl = recording.fileUrl;

        if (recording.storagePath) {
          const { data: signedUrlData } = await supabaseStorage.storage
            .from("recordings")
            .createSignedUrl(recording.storagePath, 3600); // 1 heure

          if (signedUrlData?.signedUrl) {
            fileUrl = signedUrlData.signedUrl;
          }
        }

        return {
          ...recording,
          fileUrl,
          fileSize: recording.fileSize ? Number(recording.fileSize) : null,
        };
      })
    );

    return NextResponse.json({ recordings: recordingsWithUrls });
  } catch (error) {
    console.error("Erreur GET video recordings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Upload manuel d'un enregistrement
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const sessionId = formData.get("sessionId") as string | null;
    const meetingId = formData.get("meetingId") as string | null;
    const provider = (formData.get("provider") as VideoProvider) || VideoProvider.ZOOM;

    if (!file || !title) {
      return NextResponse.json(
        { error: "Fichier et titre requis" },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 500 MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 500 MB" },
        { status: 400 }
      );
    }

    // S'assurer que le bucket existe
    await ensureBucketExists();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${user.organizationId}/${timestamp}_${safeName}`;

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabaseStorage.storage
      .from("recordings")
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

    // Générer une URL signée
    const { data: signedUrlData } = await supabaseStorage.storage
      .from("recordings")
      .createSignedUrl(filePath, 31536000); // 1 an

    const fileUrl = signedUrlData?.signedUrl ||
      supabaseStorage.storage.from("recordings").getPublicUrl(filePath).data.publicUrl;

    // Créer l'enregistrement en base
    const recording = await prisma.videoRecording.create({
      data: {
        title,
        description,
        provider,
        fileUrl,
        storagePath: filePath,
        fileSize: BigInt(file.size),
        mimeType: file.type,
        sessionId,
        meetingId,
        uploadedById: user.id,
        organizationId: user.organizationId,
        recordedAt: new Date(),
      },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            provider: true,
          },
        },
        session: {
          select: {
            id: true,
            formation: {
              select: {
                id: true,
                titre: true,
              },
            },
          },
        },
        uploadedBy: {
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
      recording: {
        ...recording,
        fileSize: Number(recording.fileSize),
      },
    });
  } catch (error) {
    console.error("Erreur POST video recording:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Vérifier et créer le bucket si nécessaire
async function ensureBucketExists() {
  const bucketName = "recordings";

  const { data: buckets } = await supabaseStorage.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucketName);

  if (!bucketExists) {
    const { error } = await supabaseStorage.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 524288000, // 500 MB
      allowedMimeTypes: [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "audio/mpeg",
        "audio/wav",
        "audio/webm",
      ],
    });

    if (error) {
      console.error("Erreur création bucket recordings:", error);
    }
  }
}
