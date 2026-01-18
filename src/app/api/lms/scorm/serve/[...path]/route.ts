import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// Client Supabase avec service role pour les opérations storage
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Servir un fichier SCORM avec les bons headers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    // Extraire packageId du path (premier segment)
    const packageId = path[0];
    const filePath = path.slice(1).join("/");

    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier que le package appartient à l'organisation
    const scormPackage = await prisma.sCORMPackage.findFirst({
      where: {
        id: packageId,
        organizationId: user.organizationId,
      },
    });

    if (!scormPackage) {
      return NextResponse.json({ error: "Package non trouvé" }, { status: 404 });
    }

    // Télécharger le fichier depuis Supabase (utiliser admin pour bypass RLS)
    const storagePath = `${scormPackage.storagePath}/${filePath}`;
    const { data, error } = await supabaseAdmin.storage
      .from("lms-content")
      .download(storagePath);

    if (error || !data) {
      console.error("Erreur téléchargement fichier SCORM:", error, "Path:", storagePath);
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    // Déterminer le content-type
    const contentType = getContentType(filePath);

    // Pour les fichiers HTML, on doit ajuster les chemins relatifs
    if (contentType === "text/html") {
      let htmlContent = await data.text();

      // Injecter une balise <base> pour que les chemins relatifs fonctionnent
      const baseUrl = `/api/lms/scorm/serve/${packageId}/`;
      const baseTag = `<base href="${baseUrl}">`;

      // Insérer la balise base après <head> si elle existe
      if (htmlContent.includes("<head>")) {
        htmlContent = htmlContent.replace("<head>", `<head>\n${baseTag}`);
      } else if (htmlContent.includes("<HEAD>")) {
        htmlContent = htmlContent.replace("<HEAD>", `<HEAD>\n${baseTag}`);
      } else {
        // Si pas de <head>, ajouter au début
        htmlContent = baseTag + htmlContent;
      }

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Retourner le fichier avec les bons headers
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Erreur serve SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du fichier" },
      { status: 500 }
    );
  }
}

function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    pdf: "application/pdf",
    swf: "application/x-shockwave-flash",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
