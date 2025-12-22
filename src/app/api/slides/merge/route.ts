// ===========================================
// API - Fusion/Téléchargement de tous les PPTX
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import JSZip from "jszip";

interface ModuleExport {
  moduleId: string;
  moduleTitre: string;
  exportUrl: string;
}

interface MergeRequest {
  formationTitre: string;
  modules: ModuleExport[];
}

// POST - Télécharger et fusionner tous les PPTX
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
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

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Parser la requête
    const body: MergeRequest = await request.json();
    const { formationTitre, modules } = body;

    if (!modules || modules.length === 0) {
      return NextResponse.json(
        { error: "Aucun module à télécharger" },
        { status: 400 }
      );
    }

    // Créer le ZIP
    const zip = new JSZip();

    // Télécharger chaque PPTX et l'ajouter au ZIP
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];

      try {
        // Télécharger le fichier depuis l'URL Gamma
        const response = await fetch(module.exportUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AutomateForma/1.0)",
          },
        });

        if (!response.ok) {
          console.error(`Erreur téléchargement module ${module.moduleId}:`, response.status);
          continue;
        }

        const buffer = await response.arrayBuffer();

        // Nettoyer le nom du fichier
        const cleanModuleName = module.moduleTitre
          .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, "")
          .replace(/\s+/g, "-")
          .substring(0, 50);

        // Ajouter au ZIP avec numéro d'ordre
        const filename = `${String(i + 1).padStart(2, "0")}-${cleanModuleName}.pptx`;
        zip.file(filename, buffer);

      } catch (err) {
        console.error(`Erreur module ${module.moduleId}:`, err);
        // Continuer avec les autres modules
      }
    }

    // Vérifier qu'on a au moins un fichier
    const fileCount = Object.keys(zip.files).length;
    if (fileCount === 0) {
      return NextResponse.json(
        { error: "Impossible de télécharger les fichiers" },
        { status: 500 }
      );
    }

    // Ajouter un fichier README pour expliquer l'ordre
    const readmeContent = `Formation: ${formationTitre}
=====================================

Modules inclus (dans l'ordre):
${modules.map((m, i) => `${i + 1}. ${m.moduleTitre}`).join("\n")}

---
Généré par Automate Forma
`;
    zip.file("00-README.txt", readmeContent);

    // Générer le ZIP
    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Nettoyer le nom de la formation pour le fichier
    const cleanFormationName = formationTitre
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    // Retourner le ZIP
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${cleanFormationName}-slides.zip"`,
        "Content-Length": String(zipBuffer.byteLength),
      },
    });

  } catch (error) {
    console.error("Erreur fusion PPTX:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la création du fichier",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
