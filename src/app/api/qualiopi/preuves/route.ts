// ===========================================
// API: GÉNÉRATION DE PREUVES QUALIOPI
// POST /api/qualiopi/preuves - Générer preuves pour un indicateur
// POST /api/qualiopi/preuves?full=true - Générer dossier complet ZIP
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import {
  genererPreuvesIndicateur,
  genererDossierAuditComplet,
} from "@/lib/services/qualiopi";

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

export async function POST(request: NextRequest) {
  try {
    // Authentification
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

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
    const body = await request.json();
    const { indicateur, full } = body;

    // Construire l'URL de base et les cookies d'authentification
    const baseUrl = request.headers.get("origin") || "http://localhost:4000";

    // Récupérer la session Supabase complète pour avoir le token d'accès
    const { data: { session } } = await supabase.auth.getSession();

    // Construire les cookies d'auth - inclure le token de session si disponible
    const authCookies = allCookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: new URL(baseUrl).hostname,
    }));

    // Si on a une session Supabase, ajouter aussi le token sous forme de cookie pour Puppeteer
    if (session?.access_token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || "default";

      // Ajouter le cookie de session au format que Supabase attend
      authCookies.push({
        name: `sb-${projectId}-auth-token`,
        value: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user,
        }),
        domain: new URL(baseUrl).hostname,
      });

      console.log(`[Preuves API] Added Supabase session token for project: ${projectId}`);
    }

    if (full) {
      // Générer le dossier d'audit complet (ZIP)
      console.log("[Preuves API] Generating full audit dossier...");

      const dossier = await genererDossierAuditComplet(
        organizationId,
        baseUrl,
        authCookies
      );

      // Retourner le ZIP en téléchargement
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Dossier_Audit_Qualiopi_${dateStr}.zip`;

      return new NextResponse(new Uint8Array(dossier.zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": dossier.zipBuffer.length.toString(),
        },
      });
    }

    if (!indicateur || typeof indicateur !== "number") {
      return NextResponse.json(
        { error: "Numéro d'indicateur requis" },
        { status: 400 }
      );
    }

    // Générer les preuves pour un indicateur spécifique
    console.log(`[Preuves API] Generating proofs for indicator ${indicateur}...`);

    const preuves = await genererPreuvesIndicateur(
      organizationId,
      indicateur,
      baseUrl,
      authCookies
    );

    if (preuves.length === 0) {
      return NextResponse.json(
        { error: "Aucune preuve générée" },
        { status: 404 }
      );
    }

    // Si une seule preuve, la retourner directement
    if (preuves.length === 1) {
      const preuve = preuves[0];
      return new NextResponse(new Uint8Array(preuve.buffer), {
        status: 200,
        headers: {
          "Content-Type": preuve.mimeType,
          "Content-Disposition": `attachment; filename="${preuve.nom}"`,
          "Content-Length": preuve.buffer.length.toString(),
        },
      });
    }

    // Si plusieurs preuves, créer un mini ZIP
    const archiver = require("archiver");
    const { Writable } = require("stream");

    const chunks: Buffer[] = [];
    const writableStream = new Writable({
      write(chunk: Buffer, encoding: any, callback: () => void) {
        chunks.push(chunk);
        callback();
      },
    });

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(writableStream);

    for (const preuve of preuves) {
      archive.append(preuve.buffer, { name: preuve.nom });
    }

    await archive.finalize();

    await new Promise<void>((resolve, reject) => {
      writableStream.on("finish", resolve);
      writableStream.on("error", reject);
    });

    const zipBuffer = Buffer.concat(chunks);
    const filename = `Preuves_IND${indicateur.toString().padStart(2, "0")}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[API] POST /api/qualiopi/preuves error:", error);
    return NextResponse.json({
      error: "Erreur serveur",
      message: error?.message || "Unknown error",
    }, { status: 500 });
  }
}
