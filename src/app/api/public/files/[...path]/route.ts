// ===========================================
// API PROXY FICHIERS PUBLICS
// ===========================================
// Proxy pour servir les fichiers Supabase sans exposer l'URL de la base de données
// URL: /api/public/files/{path}
// Exemple: /api/public/files/certificats-qualiopi/org123/file.pdf

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const STORAGE_BUCKET = "worksbots-forma-stockage";

type RouteParams = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { path } = await params;
    const filePath = path.join("/");

    if (!filePath) {
      return NextResponse.json(
        { error: "Chemin de fichier requis" },
        { status: 400 }
      );
    }

    // Construire l'URL Supabase Storage
    const supabaseUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;

    // Récupérer le fichier depuis Supabase
    const response = await fetch(supabaseUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer le contenu et le type
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // Retourner le fichier avec les headers appropriés
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${filePath.split("/").pop()}"`,
      },
    });
  } catch (error) {
    console.error("Erreur proxy fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du fichier" },
      { status: 500 }
    );
  }
}
