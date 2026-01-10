// ===========================================
// API ROUTE - Génération PDF Procédure Qualité
// ===========================================
// Génère un PDF d'une procédure avec en-tête (logo) et pied de page (infos organisme)

import { NextRequest, NextResponse } from "next/server";
import {
  generatePDFWithOrganisation,
  OrganisationInfo,
} from "@/lib/services/pdf-generator";

interface ProcedureRequest {
  procedureType: string;
  procedureName: string;
  content: string;
  version: number;
  indicateur: string;
  organisme: {
    nomCommercial: string;
    adresse: string;
    codePostal: string;
    ville: string;
    siret: string;
    numeroFormateur: string;
    prefectureRegion: string;
    logo: string;
  };
}

// Convertit le texte brut en HTML formaté
function textToHtml(text: string, procedureName: string, indicateur: string, version: number): string {
  // Séparer les paragraphes
  const paragraphs = text.split("\n\n").filter(Boolean);

  let htmlContent = "";

  // En-tête du document
  htmlContent += `
    <div style="margin-bottom: 30px;">
      <h1 style="font-size: 18pt; color: #1a1a1a; margin-bottom: 10px; border-bottom: 2px solid #4277FF; padding-bottom: 10px;">
        ${procedureName}
      </h1>
      <div style="display: flex; justify-content: space-between; font-size: 10pt; color: #666;">
        <span>Indicateur : ${indicateur}</span>
        <span>Version ${version || 1}</span>
      </div>
    </div>
  `;

  // Contenu
  paragraphs.forEach((paragraph) => {
    const trimmed = paragraph.trim();

    // Détecte les titres de sections (lignes en majuscules ou commençant par un numéro)
    if (/^[A-Z0-9\.\s\-–:]+$/.test(trimmed) && trimmed.length < 100) {
      // Titre principal en majuscules
      htmlContent += `<h2 style="font-size: 14pt; color: #333; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase;">${trimmed}</h2>`;
    } else if (/^\d+\.\s+[A-Z]/.test(trimmed)) {
      // Titre numéroté (ex: "1. OBJET")
      htmlContent += `<h2 style="font-size: 13pt; color: #333; margin-top: 20px; margin-bottom: 10px;">${trimmed}</h2>`;
    } else if (/^\d+\.\d+\s+/.test(trimmed)) {
      // Sous-titre numéroté (ex: "1.1 Avant la formation")
      htmlContent += `<h3 style="font-size: 12pt; color: #555; margin-top: 15px; margin-bottom: 8px;">${trimmed}</h3>`;
    } else if (/^[-•]\s+/.test(trimmed)) {
      // Liste à puces
      const items = trimmed.split("\n").map((item) => item.replace(/^[-•]\s+/, ""));
      htmlContent += `<ul style="margin: 10px 0; padding-left: 25px;">`;
      items.forEach((item) => {
        if (item.trim()) {
          htmlContent += `<li style="margin: 5px 0;">${item.trim()}</li>`;
        }
      });
      htmlContent += `</ul>`;
    } else {
      // Paragraphe normal
      // Traiter les retours à la ligne simples comme des items de liste s'ils commencent par -
      const lines = trimmed.split("\n");
      if (lines.length > 1 && lines.some((line) => line.trim().startsWith("-"))) {
        htmlContent += `<ul style="margin: 10px 0; padding-left: 25px;">`;
        lines.forEach((line) => {
          const cleanLine = line.replace(/^-\s*/, "").trim();
          if (cleanLine) {
            htmlContent += `<li style="margin: 5px 0;">${cleanLine}</li>`;
          }
        });
        htmlContent += `</ul>`;
      } else {
        htmlContent += `<p style="margin: 10px 0; line-height: 1.6;">${trimmed.replace(/\n/g, "<br/>")}</p>`;
      }
    }
  });

  // Wrapper HTML complet
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${procedureName}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    @page {
      margin: 0;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcedureRequest = await request.json();

    const {
      procedureName,
      content,
      version,
      indicateur,
      organisme,
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Contenu de la procédure manquant" },
        { status: 400 }
      );
    }

    // Préparer les infos de l'organisation pour l'en-tête/pied de page
    const orgInfo: OrganisationInfo = {
      nom: organisme.nomCommercial || "Organisme de formation",
      nomCommercial: organisme.nomCommercial,
      siret: organisme.siret,
      numeroFormateur: organisme.numeroFormateur,
      prefectureRegion: organisme.prefectureRegion,
      adresse: organisme.adresse,
      codePostal: organisme.codePostal,
      ville: organisme.ville,
      logo: organisme.logo,
    };

    // Convertir le texte en HTML
    const htmlContent = textToHtml(content, procedureName, indicateur, version);

    // Générer le PDF avec en-tête et pied de page
    const pdfBuffer = await generatePDFWithOrganisation(htmlContent, orgInfo);

    // Retourner le PDF (convertir Buffer en Uint8Array pour NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="procedure-${procedureName.toLowerCase().replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF procédure:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
