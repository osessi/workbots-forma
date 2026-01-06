// ===========================================
// API RECORDING DOWNLOAD - /api/video/recordings/[id]/download
// ===========================================
// Redirection vers l'URL de lecture de l'enregistrement

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/db/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { id } = await params;

    // Récupérer l'enregistrement
    const recording = await prisma.videoRecording.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!recording) {
      return NextResponse.json({ error: "Enregistrement non trouvé" }, { status: 404 });
    }

    let fileUrl = recording.fileUrl;

    // Si stocké dans Supabase, générer une URL signée fraîche
    if (recording.storagePath) {
      const { data: signedUrlData } = await supabaseStorage.storage
        .from("recordings")
        .createSignedUrl(recording.storagePath, 3600); // 1 heure

      if (signedUrlData?.signedUrl) {
        fileUrl = signedUrlData.signedUrl;
      }
    }

    if (!fileUrl) {
      return NextResponse.json({ error: "URL non disponible" }, { status: 404 });
    }

    // Rediriger vers l'URL du fichier
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error("Erreur download recording:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
