// ===========================================
// API: PREUVES D'UN INDICATEUR QUALIOPI
// POST /api/qualiopi/indicateurs/[numero]/preuves - Ajouter une preuve
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Bucket Supabase Storage
const STORAGE_BUCKET = "worksbots-forma-stockage";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;

    // Récupérer le FormData
    const formData = await request.formData();
    const type = formData.get("type") as string;
    const nom = formData.get("nom") as string;
    const description = formData.get("description") as string | null;
    const lien = formData.get("lien") as string | null;
    const file = formData.get("file") as File | null;

    if (!type || !nom) {
      return NextResponse.json(
        { error: "Type et nom requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'indicateur existe
    let indicateur = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
    });

    // Si l'indicateur n'existe pas, le créer
    if (!indicateur) {
      const critere = Math.min(7, Math.ceil(numeroInt / 5));
      indicateur = await prisma.indicateurConformite.create({
        data: {
          organizationId,
          numeroIndicateur: numeroInt,
          critere,
          libelle: `Indicateur ${numeroInt}`,
          status: "EN_COURS",
          score: 0,
        },
      });
    }

    // Gérer le fichier si présent
    let fileUrl: string | null = null;
    if (file && file.size > 0) {
      try {
        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const extension = file.name.split(".").pop() || "bin";
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `preuves/${organizationId}/${numeroInt}/${timestamp}_${sanitizedName}`;

        // Convertir le File en ArrayBuffer pour Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[Upload] Tentative d'upload: ${fileName}, taille: ${buffer.length} bytes, type: ${file.type}`);

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error("[Upload] Erreur Supabase Storage:", uploadError.message, uploadError);
          // Retourner l'erreur pour debug
          return NextResponse.json(
            { error: `Erreur upload: ${uploadError.message}` },
            { status: 500 }
          );
        }

        console.log("[Upload] Succès:", uploadData);

        // Stocker le chemin du fichier (pas l'URL publique Supabase)
        // L'URL sera générée via notre propre API proxy pour ne pas exposer Supabase
        // On encode chaque segment du path séparément pour garder les /
        const encodedPath = fileName.split("/").map(segment => encodeURIComponent(segment)).join("/");
        fileUrl = `/api/qualiopi/fichiers/${encodedPath}`;
        console.log("[Upload] Chemin fichier:", fileUrl);
      } catch (uploadErr) {
        console.error("[Upload] Exception:", uploadErr);
        return NextResponse.json(
          { error: `Erreur upload: ${uploadErr instanceof Error ? uploadErr.message : "Erreur inconnue"}` },
          { status: 500 }
        );
      }
    }

    // Créer la preuve
    // Note: on utilise documentId pour stocker l'URL du fichier/lien
    // et sourceType pour indiquer le type de source (LIEN, DOCUMENT, CAPTURE)
    const preuve = await prisma.preuveIndicateur.create({
      data: {
        indicateurId: indicateur.id,
        type,
        nom,
        description: description || null,
        documentId: lien || fileUrl || null, // URL du fichier ou lien
        sourceType: type, // DOCUMENT, CAPTURE, LIEN
      },
    });

    return NextResponse.json(preuve, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/qualiopi/indicateurs/[numero]/preuves error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Récupérer les preuves d'un indicateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;

    // Récupérer les preuves
    const indicateur = await prisma.indicateurConformite.findUnique({
      where: {
        organizationId_numeroIndicateur: {
          organizationId,
          numeroIndicateur: numeroInt,
        },
      },
      include: {
        preuves: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(indicateur?.preuves || []);
  } catch (error) {
    console.error("[API] GET /api/qualiopi/indicateurs/[numero]/preuves error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// DELETE - Supprimer une preuve
// ===========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params;
    const numeroInt = parseInt(numero);

    if (isNaN(numeroInt) || numeroInt < 1 || numeroInt > 32) {
      return NextResponse.json(
        { error: "Numéro d'indicateur invalide (1-32)" },
        { status: 400 }
      );
    }

    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const organizationId = dbUser.organizationId;

    // Récupérer l'ID de la preuve depuis le body
    const body = await request.json();
    const { preuveId } = body;

    if (!preuveId) {
      return NextResponse.json(
        { error: "ID de la preuve requis" },
        { status: 400 }
      );
    }

    // Vérifier que la preuve appartient à un indicateur de l'organisation
    const preuve = await prisma.preuveIndicateur.findUnique({
      where: { id: preuveId },
      include: {
        indicateur: {
          select: { organizationId: true },
        },
      },
    });

    if (!preuve || preuve.indicateur.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Preuve non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer le fichier de Supabase Storage si c'est un fichier local
    if (preuve.documentId && preuve.documentId.startsWith("/api/qualiopi/fichiers/")) {
      try {
        // Extraire le chemin du fichier
        const filePath = preuve.documentId.replace("/api/qualiopi/fichiers/", "");
        const decodedPath = decodeURIComponent(filePath);

        console.log("[Delete] Suppression du fichier:", decodedPath);

        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([decodedPath]);

        if (deleteError) {
          console.error("[Delete] Erreur suppression fichier:", deleteError);
          // On continue quand même la suppression de la preuve
        }
      } catch (err) {
        console.error("[Delete] Exception suppression fichier:", err);
      }
    }

    // Supprimer la preuve de la base de données
    await prisma.preuveIndicateur.delete({
      where: { id: preuveId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/qualiopi/indicateurs/[numero]/preuves error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
