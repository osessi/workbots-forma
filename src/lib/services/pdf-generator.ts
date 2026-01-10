// ===========================================
// PDF GENERATOR SERVICE
// ===========================================
// Convertit le HTML en PDF avec Puppeteer

import puppeteer from "puppeteer";

export interface PDFOptions {
  format?: "A4" | "Letter";
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

// Informations de l'organisme pour en-tête/pied de page
export interface OrganisationInfo {
  nom: string;
  nomCommercial?: string | null;
  siret?: string | null;
  numeroFormateur?: string | null;
  prefectureRegion?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  logo?: string | null;
  representantNom?: string | null;
  representantPrenom?: string | null;
}

const defaultOptions: PDFOptions = {
  format: "A4",
  landscape: false,
  margin: {
    top: "25mm",
    right: "15mm",
    bottom: "30mm",
    left: "15mm",
  },
  displayHeaderFooter: true,
};

// Génère le template d'en-tête avec le logo de l'organisme
export function generateHeaderTemplate(org?: OrganisationInfo): string {
  if (!org?.logo) {
    return `<div style="width: 100%; font-size: 8px; padding: 0 15mm;"></div>`;
  }

  return `
    <div style="width: 100%; font-size: 8px; padding: 5mm 15mm 0 15mm; display: flex; justify-content: flex-start;">
      <img src="${org.logo}" style="max-height: 40px; max-width: 150px;" />
    </div>
  `;
}

// Génère le template de pied de page avec les infos de l'organisme
export function generateFooterTemplate(org?: OrganisationInfo): string {
  if (!org) {
    return `
      <div style="width: 100%; font-size: 8px; text-align: center; padding: 0 15mm; color: #666;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `;
  }

  const nomAffiche = org.nomCommercial || org.nom;
  const adresseLigne = [org.adresse, org.codePostal, org.ville].filter(Boolean).join(", ");

  let infoLines: string[] = [];

  // Ligne 1: Nom commercial | Adresse
  if (nomAffiche || adresseLigne) {
    infoLines.push([nomAffiche, adresseLigne].filter(Boolean).join(" | "));
  }

  // Ligne 2: SIRET + NDA
  const infosPro: string[] = [];
  if (org.siret) infosPro.push(`SIRET : ${org.siret}`);
  if (org.numeroFormateur) {
    const regionInfo = org.prefectureRegion ? ` (${org.prefectureRegion})` : "";
    infosPro.push(`N° d'activité : ${org.numeroFormateur}${regionInfo}`);
  }
  if (infosPro.length > 0) {
    infoLines.push(infosPro.join(" – "));
  }

  return `
    <div style="width: 100%; font-size: 7px; text-align: center; padding: 0 15mm; color: #666; border-top: 1px solid #ddd; padding-top: 3mm;">
      ${infoLines.map(line => `<div style="margin-bottom: 1mm;">${line}</div>`).join("")}
      <div style="margin-top: 2mm;">
        Page <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    </div>
  `;
}

// Template HTML de base avec styles
function wrapHtmlContent(htmlContent: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
    h1 {
      font-size: 18pt;
      color: #1a1a1a;
      margin-bottom: 15px;
      border-bottom: 2px solid #4277FF;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 14pt;
      color: #333;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 12pt;
      color: #555;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    p {
      margin: 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .logo {
      max-height: 60px;
    }
    .document-info {
      text-align: right;
      font-size: 10pt;
      color: #666;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .signature-zone {
      margin-top: 40px;
      padding: 20px;
      border: 1px dashed #ccc;
      min-height: 100px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    li {
      margin: 5px 0;
    }
    strong {
      font-weight: 600;
    }
    .highlight {
      background-color: #fff3cd;
      padding: 2px 5px;
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

export async function generatePDFFromHtml(
  htmlContent: string,
  title: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const mergedOptions = { ...defaultOptions, ...options };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Wrap le contenu HTML avec le template de base
    const fullHtml = wrapHtmlContent(htmlContent, title);

    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
    });

    // Générer le PDF
    const pdfBuffer = await page.pdf({
      format: mergedOptions.format,
      landscape: mergedOptions.landscape,
      margin: mergedOptions.margin,
      displayHeaderFooter: mergedOptions.displayHeaderFooter,
      headerTemplate: mergedOptions.headerTemplate || "",
      footerTemplate: mergedOptions.footerTemplate || `
        <div style="font-size: 9px; text-align: center; width: 100%;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Nouvelle fonction principale avec support en-tête/pied de page organisme
export async function generatePDFWithOrganisation(
  fullHtml: string,
  organisation?: OrganisationInfo,
  options: PDFOptions = {}
): Promise<Buffer> {
  const headerTemplate = generateHeaderTemplate(organisation);
  const footerTemplate = generateFooterTemplate(organisation);

  const mergedOptions: PDFOptions = {
    ...defaultOptions,
    ...options,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: mergedOptions.format,
      landscape: mergedOptions.landscape,
      margin: mergedOptions.margin,
      displayHeaderFooter: mergedOptions.displayHeaderFooter,
      headerTemplate: mergedOptions.headerTemplate,
      footerTemplate: mergedOptions.footerTemplate,
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function generatePDFFromHtmlRaw(
  fullHtml: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const mergedOptions = { ...defaultOptions, ...options };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: mergedOptions.format,
      landscape: mergedOptions.landscape,
      margin: mergedOptions.margin,
      displayHeaderFooter: mergedOptions.displayHeaderFooter,
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
