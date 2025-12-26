import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";

// Client Supabase avec service role pour les opérations storage
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types pour le manifest SCORM
interface SCORMManifest {
  title: string;
  description?: string;
  version: "SCORM_1_2" | "SCORM_2004";
  launchUrl: string;
  masteryScore?: number;
  organizations: Array<{
    identifier: string;
    title: string;
    items: Array<{
      identifier: string;
      title: string;
      resourceRef?: string;
    }>;
  }>;
  resources: Array<{
    identifier: string;
    type: string;
    href?: string;
    scormType?: string;
  }>;
}

// Parser le manifest SCORM (imsmanifest.xml)
function parseManifest(xmlContent: string): SCORMManifest {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  // Détecter la version SCORM
  const schemaVersion = doc.getElementsByTagName("schemaversion")[0]?.textContent || "";
  const version: "SCORM_1_2" | "SCORM_2004" = schemaVersion.includes("2004")
    ? "SCORM_2004"
    : "SCORM_1_2";

  // Titre du cours
  const titleElement = doc.getElementsByTagName("title")[0];
  const title = titleElement?.textContent || "Module SCORM";

  // Description
  const descriptionElement = doc.getElementsByTagName("description")[0];
  const description = descriptionElement?.textContent || undefined;

  // Parser les organizations
  const organizations: SCORMManifest["organizations"] = [];
  const orgsElements = doc.getElementsByTagName("organization");

  for (let i = 0; i < orgsElements.length; i++) {
    const org = orgsElements[i];
    const orgIdentifier = org.getAttribute("identifier") || `org_${i}`;
    const orgTitleEl = org.getElementsByTagName("title")[0];
    const orgTitle = orgTitleEl?.textContent || "Organization";

    const items: SCORMManifest["organizations"][0]["items"] = [];
    const itemElements = org.getElementsByTagName("item");

    for (let j = 0; j < itemElements.length; j++) {
      const item = itemElements[j];
      const itemIdentifier = item.getAttribute("identifier") || `item_${j}`;
      const itemTitleEl = item.getElementsByTagName("title")[0];
      const itemTitle = itemTitleEl?.textContent || "Item";
      const resourceRef = item.getAttribute("identifierref") || undefined;

      items.push({
        identifier: itemIdentifier,
        title: itemTitle,
        resourceRef,
      });
    }

    organizations.push({
      identifier: orgIdentifier,
      title: orgTitle,
      items,
    });
  }

  // Parser les resources
  const resources: SCORMManifest["resources"] = [];
  const resourceElements = doc.getElementsByTagName("resource");

  let launchUrl = "index.html";

  for (let i = 0; i < resourceElements.length; i++) {
    const resource = resourceElements[i];
    const identifier = resource.getAttribute("identifier") || `resource_${i}`;
    const type = resource.getAttribute("type") || "webcontent";
    const href = resource.getAttribute("href") || undefined;
    const scormType = resource.getAttributeNS("http://www.adlnet.org/xsd/adlcp_rootv1p2", "scormtype")
      || resource.getAttribute("adlcp:scormtype")
      || resource.getAttributeNS("http://www.adlnet.org/xsd/adlcp_v1p3", "scormType")
      || resource.getAttribute("adlcp:scormType")
      || undefined;

    // Le premier SCO avec href est généralement le point de lancement
    if (href && (scormType === "sco" || scormType === "SCO") && launchUrl === "index.html") {
      launchUrl = href;
    }

    resources.push({
      identifier,
      type,
      href,
      scormType,
    });
  }

  // Si aucun SCO trouvé, prendre le premier resource avec href
  if (launchUrl === "index.html" && resources.length > 0) {
    const firstWithHref = resources.find(r => r.href);
    if (firstWithHref?.href) {
      launchUrl = firstWithHref.href;
    }
  }

  // Parser le mastery score si présent
  let masteryScore: number | undefined;
  const masteryElements = doc.getElementsByTagName("adlcp:masteryscore");
  if (masteryElements.length > 0) {
    const score = parseFloat(masteryElements[0].textContent || "");
    if (!isNaN(score)) {
      masteryScore = score;
    }
  }

  return {
    title,
    description,
    version,
    launchUrl,
    masteryScore,
    organizations,
    resources,
  };
}

// GET - Récupérer tous les packages SCORM
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const formationId = searchParams.get("formationId");

    const packages = await prisma.sCORMPackage.findMany({
      where: {
        organizationId: user.organizationId,
        ...(status ? { status: status as any } : {}),
        ...(formationId ? { formationId } : {}),
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        _count: {
          select: {
            trackingData: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Stats
    const stats = {
      total: packages.length,
      valid: packages.filter(p => p.status === "VALID").length,
      error: packages.filter(p => p.status === "ERROR").length,
      processing: packages.filter(p => p.status === "PROCESSING" || p.status === "UPLOADING").length,
    };

    return NextResponse.json({ packages, stats });
  } catch (error) {
    console.error("Erreur récupération packages SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des packages" },
      { status: 500 }
    );
  }
}

// POST - Upload un nouveau package SCORM
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const titre = formData.get("titre") as string;
    const description = formData.get("description") as string | null;
    const formationId = formData.get("formationId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    // Vérifier que c'est un ZIP
    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Le fichier doit être au format ZIP" },
        { status: 400 }
      );
    }

    // Créer le package en status UPLOADING
    const scormPackage = await prisma.sCORMPackage.create({
      data: {
        titre: titre || file.name.replace(".zip", ""),
        description: description || null,
        status: "UPLOADING",
        storagePath: "",
        originalFileName: file.name,
        fileSize: file.size,
        formationId: formationId || null,
        organizationId: user.organizationId,
        uploadedBy: user.id,
      },
    });

    try {
      // Lire le contenu du ZIP
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Chercher le manifest
      const manifestFile = zip.file("imsmanifest.xml");
      if (!manifestFile) {
        await prisma.sCORMPackage.update({
          where: { id: scormPackage.id },
          data: {
            status: "ERROR",
            errorMessage: "Fichier imsmanifest.xml introuvable dans le package",
          },
        });
        return NextResponse.json(
          { error: "Package SCORM invalide: imsmanifest.xml manquant" },
          { status: 400 }
        );
      }

      // Parser le manifest
      const manifestContent = await manifestFile.async("text");
      const manifest = parseManifest(manifestContent);

      // Mettre à jour vers PROCESSING
      await prisma.sCORMPackage.update({
        where: { id: scormPackage.id },
        data: { status: "PROCESSING" },
      });

      // Chemin de stockage
      const storagePath = `scorm-packages/${user.organizationId}/${scormPackage.id}`;

      // Upload chaque fichier du ZIP vers Supabase Storage
      const uploadPromises: Promise<any>[] = [];
      const uploadErrors: string[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          uploadPromises.push(
            zipEntry.async("arraybuffer").then(async (content) => {
              const filePath = `${storagePath}/${relativePath}`;
              const { error } = await supabaseAdmin.storage
                .from("lms-content")
                .upload(filePath, content, {
                  contentType: getMimeType(relativePath),
                  upsert: true,
                });

              if (error) {
                console.error(`Erreur upload ${relativePath}:`, error);
                uploadErrors.push(`${relativePath}: ${error.message}`);
              }
            })
          );
        }
      });

      await Promise.all(uploadPromises);

      // Vérifier s'il y a eu des erreurs
      if (uploadErrors.length > 0) {
        // Si toutes les erreurs mentionnent "bucket not found", c'est un problème de configuration
        const bucketNotFound = uploadErrors.some(e =>
          e.toLowerCase().includes("bucket") || e.toLowerCase().includes("not found")
        );

        if (bucketNotFound || uploadErrors.length > uploadPromises.length / 2) {
          throw new Error(
            bucketNotFound
              ? "Le bucket 'lms-content' n'existe pas dans Supabase Storage. Créez-le dans votre dashboard Supabase."
              : `Erreurs d'upload: ${uploadErrors.slice(0, 3).join(", ")}`
          );
        }
      }

      // Mettre à jour le package avec les infos du manifest
      const updatedPackage = await prisma.sCORMPackage.update({
        where: { id: scormPackage.id },
        data: {
          titre: manifest.title || titre || file.name.replace(".zip", ""),
          description: manifest.description || description || null,
          version: manifest.version,
          status: "VALID",
          manifestData: manifest as any,
          launchUrl: manifest.launchUrl,
          masteryScore: manifest.masteryScore,
          storagePath,
        },
      });

      return NextResponse.json({
        success: true,
        package: updatedPackage,
        manifest,
      });
    } catch (parseError: any) {
      console.error("Erreur parsing/upload SCORM:", parseError);

      await prisma.sCORMPackage.update({
        where: { id: scormPackage.id },
        data: {
          status: "ERROR",
          errorMessage: parseError.message || "Erreur lors du traitement du package",
        },
      });

      return NextResponse.json(
        { error: "Erreur lors du traitement du package SCORM" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur upload package SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du package" },
      { status: 500 }
    );
  }
}

// Helper pour déterminer le MIME type
function getMimeType(filename: string): string {
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
