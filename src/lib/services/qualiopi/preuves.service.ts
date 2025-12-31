// ===========================================
// SERVICE DE GÉNÉRATION DE PREUVES QUALIOPI
// Captures d'écran + Export ZIP
// ===========================================

import puppeteer, { Browser, Page } from "puppeteer";
import archiver from "archiver";
import { Writable } from "stream";
import prisma from "@/lib/db/prisma";
import { INDICATEURS_QUALIOPI, CRITERES_QUALIOPI } from "./indicateurs-data";

// Types
export interface PreuveGeneree {
  indicateur: number;
  type: "screenshot" | "pdf" | "data";
  nom: string;
  description: string;
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export interface DossierAudit {
  zipBuffer: Buffer;
  fichiers: {
    nom: string;
    taille: number;
    type: string;
  }[];
  dateGeneration: Date;
}

// ===========================================
// CONFIGURATION PUPPETEER
// ===========================================

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ===========================================
// CAPTURE D'ÉCRAN D'UNE PAGE
// ===========================================

export async function captureScreenshot(
  url: string,
  options: {
    width?: number;
    height?: number;
    fullPage?: boolean;
    cookies?: { name: string; value: string; domain: string }[];
  } = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Définir la taille de la fenêtre
    await page.setViewport({
      width: options.width || 1920,
      height: options.height || 1080,
    });

    // Ajouter les cookies si fournis (pour l'authentification)
    if (options.cookies && options.cookies.length > 0) {
      await page.setCookie(...options.cookies);
    }

    // Naviguer vers l'URL
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Attendre un peu pour que tout soit chargé
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capturer la screenshot
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: options.fullPage ?? true,
    });

    return screenshot as Buffer;
  } finally {
    await page.close();
  }
}

// ===========================================
// GÉNÉRATION DE PREUVES PAR INDICATEUR
// ===========================================

export async function genererPreuvesIndicateur(
  organizationId: string,
  numeroIndicateur: number,
  baseUrl: string,
  authCookies: { name: string; value: string; domain: string }[]
): Promise<PreuveGeneree[]> {
  const preuves: PreuveGeneree[] = [];
  const indicateur = INDICATEURS_QUALIOPI.find(i => i.numero === numeroIndicateur);

  if (!indicateur) {
    throw new Error(`Indicateur ${numeroIndicateur} non trouvé`);
  }

  // Définir les pages à capturer selon l'indicateur
  const pagesACapture = getPagesPourIndicateur(numeroIndicateur, baseUrl);

  for (const pageConfig of pagesACapture) {
    try {
      const screenshot = await captureScreenshot(pageConfig.url, {
        cookies: authCookies,
        fullPage: pageConfig.fullPage ?? true,
      });

      preuves.push({
        indicateur: numeroIndicateur,
        type: "screenshot",
        nom: `IND${numeroIndicateur.toString().padStart(2, "0")}_${pageConfig.nom}.png`,
        description: pageConfig.description,
        buffer: screenshot,
        mimeType: "image/png",
        extension: "png",
      });
    } catch (error) {
      console.error(`Erreur capture ${pageConfig.nom}:`, error);
    }
  }

  // Ajouter des données exportées si applicable
  const donneesExportees = await exporterDonneesIndicateur(organizationId, numeroIndicateur);
  if (donneesExportees) {
    preuves.push(donneesExportees);
  }

  return preuves;
}

// ===========================================
// PAGES À CAPTURER PAR INDICATEUR
// ===========================================

function getPagesPourIndicateur(
  numero: number,
  baseUrl: string
): { url: string; nom: string; description: string; fullPage?: boolean }[] {
  const pages: { url: string; nom: string; description: string; fullPage?: boolean }[] = [];

  switch (numero) {
    case 1: // Information sur les prestations
      pages.push(
        { url: `${baseUrl}/catalogue`, nom: "catalogue", description: "Catalogue des formations" },
        { url: `${baseUrl}/automate/settings`, nom: "parametres", description: "Paramètres de l'organisme" }
      );
      break;

    case 2: // Indicateurs de résultats
      pages.push(
        { url: `${baseUrl}/automate`, nom: "dashboard", description: "Tableau de bord général" },
        { url: `${baseUrl}/automate/qualiopi`, nom: "qualiopi_dashboard", description: "Dashboard Qualiopi" }
      );
      break;

    case 4: // Analyse du besoin
      pages.push(
        { url: `${baseUrl}/automate/donnees/apprenants`, nom: "apprenants", description: "Liste des apprenants" },
        { url: `${baseUrl}/automate/sessions`, nom: "sessions", description: "Liste des sessions" }
      );
      break;

    case 9: // Information des publics
      pages.push(
        { url: `${baseUrl}/automate/mes-formations`, nom: "formations", description: "Liste des formations" }
      );
      break;

    case 11: // Évaluation de l'atteinte des objectifs
      pages.push(
        { url: `${baseUrl}/automate/mes-formations`, nom: "formations_evaluations", description: "Formations avec évaluations" }
      );
      break;

    case 17: // Moyens humains et techniques
      pages.push(
        { url: `${baseUrl}/automate/donnees/intervenants`, nom: "intervenants", description: "Liste des intervenants" },
        { url: `${baseUrl}/automate/sessions`, nom: "sessions_moyens", description: "Sessions avec moyens" }
      );
      break;

    case 22: // Compétences des intervenants
      pages.push(
        { url: `${baseUrl}/automate/donnees/intervenants`, nom: "intervenants_cv", description: "Fiches intervenants" }
      );
      break;

    case 24: // Veille légale et réglementaire
      pages.push(
        { url: `${baseUrl}/admin/veille`, nom: "veille", description: "Sources de veille" }
      );
      break;

    case 30: // Recueil des appréciations
      pages.push(
        { url: `${baseUrl}/automate/evaluations`, nom: "evaluations", description: "Évaluations de satisfaction" }
      );
      break;

    case 31: // Traitement des réclamations
      pages.push(
        { url: `${baseUrl}/automate/reclamations`, nom: "reclamations", description: "Gestion des réclamations" }
      );
      break;

    case 32: // Mesures d'amélioration
      pages.push(
        { url: `${baseUrl}/automate/ameliorations`, nom: "ameliorations", description: "Actions d'amélioration" }
      );
      break;

    default:
      // Pour les autres indicateurs, capturer le dashboard Qualiopi
      pages.push(
        { url: `${baseUrl}/automate/qualiopi`, nom: "qualiopi_general", description: "Dashboard Qualiopi" }
      );
  }

  return pages;
}

// ===========================================
// EXPORT DE DONNÉES PAR INDICATEUR (FORMAT PDF)
// ===========================================

async function exporterDonneesIndicateur(
  organizationId: string,
  numeroIndicateur: number
): Promise<PreuveGeneree | null> {
  try {
    let htmlContent = "";
    let nom = "";
    let description = "";

    // Récupérer l'organisation pour le titre
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    const orgName = org?.name || "Organisme";
    const dateGeneration = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    switch (numeroIndicateur) {
      case 2: // Statistiques de satisfaction
        const evaluations = await prisma.evaluationSatisfaction.findMany({
          where: { organizationId },
          include: { reponse: true },
        });
        const stats = {
          total: evaluations.length,
          completes: evaluations.filter(e => e.status === "COMPLETED").length,
          tauxReponse: evaluations.length > 0
            ? ((evaluations.filter(e => e.status === "COMPLETED").length / evaluations.length) * 100).toFixed(1)
            : "0",
          noteMoyenne: calcMoyenne(evaluations),
        };

        htmlContent = genererPDFHTML({
          titre: "Indicateur 2 - Indicateurs de résultats",
          sousTitre: "Statistiques de satisfaction",
          orgName,
          dateGeneration,
          contenu: `
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Évaluations totales</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.completes}</div>
                <div class="stat-label">Évaluations complétées</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${stats.tauxReponse}%</div>
                <div class="stat-label">Taux de réponse</div>
              </div>
              <div class="stat-card highlight">
                <div class="stat-value">${stats.noteMoyenne}</div>
                <div class="stat-label">Note moyenne /10</div>
              </div>
            </div>
            <p class="conclusion">Ces indicateurs témoignent du suivi rigoureux de la satisfaction des bénéficiaires conformément aux exigences Qualiopi.</p>
          `,
        });
        nom = `IND02_statistiques_satisfaction.pdf`;
        description = "Statistiques des évaluations de satisfaction";
        break;

      case 17: // Liste des intervenants
        const intervenants = await prisma.intervenant.findMany({
          where: { organizationId },
          select: {
            nom: true,
            prenom: true,
            email: true,
            specialites: true,
            fonction: true,
          },
        });

        const intervenantsRows = intervenants.map(i => `
          <tr>
            <td>${i.prenom || ""} ${i.nom || ""}</td>
            <td>${i.fonction || "Non renseigné"}</td>
            <td>${i.specialites?.join(", ") || "Non renseigné"}</td>
            <td>${i.email || ""}</td>
          </tr>
        `).join("");

        htmlContent = genererPDFHTML({
          titre: "Indicateur 17 - Moyens humains",
          sousTitre: `Liste des intervenants (${intervenants.length})`,
          orgName,
          dateGeneration,
          contenu: `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Fonction</th>
                  <th>Spécialités</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                ${intervenantsRows || '<tr><td colspan="4" class="empty">Aucun intervenant enregistré</td></tr>'}
              </tbody>
            </table>
            <p class="conclusion">Cette liste atteste de la mobilisation des moyens humains qualifiés pour la réalisation des prestations.</p>
          `,
        });
        nom = `IND17_liste_intervenants.pdf`;
        description = "Liste des intervenants";
        break;

      case 30: // Résultats des évaluations
        const evals = await prisma.evaluationSatisfaction.findMany({
          where: { organizationId, status: "COMPLETED" },
          include: {
            reponse: true,
            session: { select: { formation: { select: { titre: true } } } },
          },
        });

        const evalsRows = evals.map(e => `
          <tr>
            <td>${e.session?.formation?.titre || "Formation"}</td>
            <td class="center">${e.reponse?.noteGlobale || "N/A"}/10</td>
            <td class="center">${e.completedAt ? new Date(e.completedAt).toLocaleDateString("fr-FR") : "N/A"}</td>
          </tr>
        `).join("");

        const moyenneEvals = evals.length > 0
          ? (evals.reduce((acc, e) => acc + (e.reponse?.noteGlobale || 0), 0) / evals.length).toFixed(1)
          : "N/A";

        htmlContent = genererPDFHTML({
          titre: "Indicateur 30 - Recueil des appréciations",
          sousTitre: `Résultats des évaluations de satisfaction`,
          orgName,
          dateGeneration,
          contenu: `
            <div class="summary-box">
              <strong>Synthèse:</strong> ${evals.length} évaluations complétées - Note moyenne: ${moyenneEvals}/10
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Formation</th>
                  <th class="center">Note</th>
                  <th class="center">Date</th>
                </tr>
              </thead>
              <tbody>
                ${evalsRows || '<tr><td colspan="3" class="empty">Aucune évaluation complétée</td></tr>'}
              </tbody>
            </table>
            <p class="conclusion">Ce document atteste du recueil systématique des appréciations des bénéficiaires.</p>
          `,
        });
        nom = `IND30_resultats_evaluations.pdf`;
        description = "Résultats des évaluations de satisfaction";
        break;

      default:
        return null;
    }

    if (!htmlContent) return null;

    // Générer le PDF avec Puppeteer
    const pdfBuffer = await genererPDFFromHTML(htmlContent);

    return {
      indicateur: numeroIndicateur,
      type: "pdf",
      nom,
      description,
      buffer: pdfBuffer,
      mimeType: "application/pdf",
      extension: "pdf",
    };
  } catch (error) {
    console.error(`Erreur export données indicateur ${numeroIndicateur}:`, error);
    return null;
  }
}

// ===========================================
// GÉNÉRATION HTML POUR PDF
// ===========================================

function genererPDFHTML(params: {
  titre: string;
  sousTitre: string;
  orgName: string;
  dateGeneration: string;
  contenu: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          padding: 40px;
        }
        .header {
          border-bottom: 3px solid #7C3AED;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #7C3AED;
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header h2 {
          color: #666;
          font-size: 16px;
          font-weight: normal;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          color: #888;
          font-size: 11px;
        }
        .qualiopi-badge {
          background: linear-gradient(135deg, #7C3AED, #3B82F6);
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 10px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: #F3F4F6;
          border-radius: 10px;
          padding: 25px;
          text-align: center;
        }
        .stat-card.highlight {
          background: linear-gradient(135deg, #7C3AED, #3B82F6);
          color: white;
        }
        .stat-value {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .data-table th {
          background: #7C3AED;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
        }
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #E5E7EB;
        }
        .data-table tr:nth-child(even) td {
          background: #F9FAFB;
        }
        .data-table .center {
          text-align: center;
        }
        .data-table .empty {
          text-align: center;
          color: #888;
          font-style: italic;
        }
        .summary-box {
          background: #EEF2FF;
          border-left: 4px solid #7C3AED;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .conclusion {
          margin-top: 30px;
          padding: 20px;
          background: #F0FDF4;
          border-radius: 8px;
          color: #166534;
          font-style: italic;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #888;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${params.titre}</h1>
        <h2>${params.sousTitre}</h2>
        <div class="meta">
          <span>Organisme: <strong>${params.orgName}</strong></span>
          <span class="qualiopi-badge">PREUVE QUALIOPI</span>
          <span>Généré le: ${params.dateGeneration}</span>
        </div>
      </div>

      <div class="content">
        ${params.contenu}
      </div>

      <div class="footer">
        Document généré automatiquement par WORKBOTS Formation - Preuve documentaire pour audit Qualiopi
      </div>
    </body>
    </html>
  `;
}

// ===========================================
// GÉNÉRATION PDF DEPUIS HTML
// ===========================================

async function genererPDFFromHTML(htmlContent: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

function calcMoyenne(evaluations: any[]): string {
  const avecNote = evaluations.filter(e => e.reponse?.noteGlobale);
  if (avecNote.length === 0) return "N/A";
  const sum = avecNote.reduce((acc, e) => acc + (e.reponse?.noteGlobale || 0), 0);
  return (sum / avecNote.length).toFixed(1);
}

// ===========================================
// GÉNÉRATION DU DOSSIER D'AUDIT COMPLET (ZIP)
// ===========================================

export async function genererDossierAuditComplet(
  organizationId: string,
  baseUrl: string,
  authCookies: { name: string; value: string; domain: string }[]
): Promise<DossierAudit> {
  const fichiers: { nom: string; taille: number; type: string }[] = [];

  // Créer un buffer pour stocker le ZIP
  const chunks: Buffer[] = [];
  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  // Créer l'archive ZIP
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(writableStream);

  // 1. Ajouter le rapport de synthèse
  const rapportSynthese = await genererRapportSynthese(organizationId);
  archive.append(rapportSynthese.buffer, { name: "00_RAPPORT_SYNTHESE.pdf" });
  fichiers.push({ nom: "00_RAPPORT_SYNTHESE.pdf", taille: rapportSynthese.buffer.length, type: "pdf" });

  // 2. Créer un dossier par critère
  for (const critere of CRITERES_QUALIOPI) {
    const dossierCritere = `Critere_${critere.numero}_${sanitizeFilename(critere.titre)}`;

    // Pour chaque indicateur du critère
    const indicateursCritere = INDICATEURS_QUALIOPI.filter(i => i.critere === critere.numero);

    for (const indicateur of indicateursCritere) {
      try {
        const preuves = await genererPreuvesIndicateur(
          organizationId,
          indicateur.numero,
          baseUrl,
          authCookies
        );

        for (const preuve of preuves) {
          const cheminFichier = `${dossierCritere}/${preuve.nom}`;
          archive.append(preuve.buffer, { name: cheminFichier });
          fichiers.push({
            nom: cheminFichier,
            taille: preuve.buffer.length,
            type: preuve.extension,
          });
        }
      } catch (error) {
        console.error(`Erreur génération preuves indicateur ${indicateur.numero}:`, error);
      }
    }
  }

  // 3. Ajouter la liste des indicateurs
  const listeIndicateurs = genererListeIndicateurs();
  archive.append(listeIndicateurs, { name: "LISTE_32_INDICATEURS.txt" });
  fichiers.push({ nom: "LISTE_32_INDICATEURS.txt", taille: listeIndicateurs.length, type: "txt" });

  // Finaliser l'archive
  await archive.finalize();

  // Attendre que le stream soit terminé
  await new Promise<void>((resolve, reject) => {
    writableStream.on("finish", resolve);
    writableStream.on("error", reject);
  });

  // Fermer le navigateur
  await closeBrowser();

  return {
    zipBuffer: Buffer.concat(chunks),
    fichiers,
    dateGeneration: new Date(),
  };
}

// ===========================================
// UTILITAIRES
// ===========================================

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 50);
}

function genererListeIndicateurs(): string {
  let content = "=== 32 INDICATEURS QUALIOPI ===\n\n";

  for (const critere of CRITERES_QUALIOPI) {
    content += `\n=== CRITÈRE ${critere.numero}: ${critere.titre.toUpperCase()} ===\n`;
    content += `${critere.description}\n\n`;

    const indicateurs = INDICATEURS_QUALIOPI.filter(i => i.critere === critere.numero);
    for (const ind of indicateurs) {
      content += `  [IND ${ind.numero}] ${ind.libelle}\n`;
    }
    content += "\n";
  }

  return content;
}

async function genererRapportSynthese(organizationId: string): Promise<{ buffer: Buffer }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  const formations = await prisma.formation.count({ where: { organizationId } });
  const sessions = await prisma.session.count({ where: { organizationId } });
  const apprenants = await prisma.apprenant.count({ where: { organizationId } });
  const intervenants = await prisma.intervenant.count({ where: { organizationId } });

  // Récupérer le nombre d'indicateurs conformes
  const indicateursConformes = await prisma.indicateurConformite.count({
    where: { organizationId, status: "CONFORME" },
  });

  const dateGeneration = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
          padding: 50px;
        }
        .cover {
          text-align: center;
          padding: 100px 0;
          border-bottom: 3px solid #7C3AED;
          margin-bottom: 40px;
        }
        .cover h1 {
          color: #7C3AED;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .cover h2 {
          color: #666;
          font-size: 18px;
          font-weight: normal;
          margin-bottom: 30px;
        }
        .cover .org-name {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
        }
        .cover .date {
          color: #888;
          font-size: 14px;
        }
        .badge {
          display: inline-block;
          background: linear-gradient(135deg, #7C3AED, #3B82F6);
          color: white;
          padding: 10px 30px;
          border-radius: 25px;
          font-weight: bold;
          margin: 30px 0;
        }
        .section {
          margin-bottom: 40px;
        }
        .section-title {
          color: #7C3AED;
          font-size: 18px;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .stat-card {
          background: #F8FAFC;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          border: 1px solid #E2E8F0;
        }
        .stat-card.highlight {
          background: linear-gradient(135deg, #7C3AED, #3B82F6);
          color: white;
          border: none;
        }
        .stat-value {
          font-size: 42px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.8;
        }
        .criteria-list {
          list-style: none;
        }
        .criteria-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #E5E7EB;
        }
        .criteria-num {
          width: 40px;
          height: 40px;
          background: #7C3AED;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 15px;
        }
        .criteria-title {
          flex: 1;
          font-weight: 500;
        }
        .info-box {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        .info-box.warning {
          background: #FEF3C7;
          border-color: #FCD34D;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #888;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>DOSSIER D'AUDIT</h1>
        <h2>Certification Qualiopi</h2>
        <div class="badge">RÉFÉRENTIEL NATIONAL QUALITÉ</div>
        <div class="org-name">${org?.name || "Organisme de formation"}</div>
        <div class="date">Généré le ${dateGeneration}</div>
      </div>

      <div class="section">
        <h2 class="section-title">Synthèse de l'organisme</h2>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-value">${formations}</div>
            <div class="stat-label">Formations au catalogue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${sessions}</div>
            <div class="stat-label">Sessions réalisées</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${apprenants}</div>
            <div class="stat-label">Apprenants formés</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${intervenants}</div>
            <div class="stat-label">Intervenants qualifiés</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">État de conformité</h2>
        <div class="stat-grid">
          <div class="stat-card highlight">
            <div class="stat-value">${indicateursConformes}/32</div>
            <div class="stat-label">Indicateurs conformes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Math.round((indicateursConformes / 32) * 100)}%</div>
            <div class="stat-label">Taux de conformité</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Les 7 critères Qualiopi</h2>
        <ul class="criteria-list">
          <li class="criteria-item">
            <span class="criteria-num">1</span>
            <span class="criteria-title">Conditions d'information du public</span>
          </li>
          <li class="criteria-item">
            <span class="criteria-num">2</span>
            <span class="criteria-title">Identification précise des objectifs</span>
          </li>
          <li class="criteria-item">
            <span class="criteria-num">3</span>
            <span class="criteria-title">Adaptation aux publics bénéficiaires</span>
          </li>
          <li class="criteria-item">
            <span class="criteria-num">4</span>
            <span class="criteria-title">Adéquation des moyens pédagogiques</span>
          </li>
          <li class="criteria-item">
            <span class="criteria-num">5</span>
            <span class="criteria-title">Qualification du personnel</span>
          </li>
          <li class="criteria-item">
            <span class="criteria-num">6</span>
            <span class="criteria-title">Inscription dans l'environnement professionnel</span>
          </li>
          <li class="criteria-item">
            <span class="criteria-num">7</span>
            <span class="criteria-title">Recueil et prise en compte des appréciations</span>
          </li>
        </ul>
      </div>

      <div class="info-box">
        <strong>À propos de ce dossier</strong><br>
        Ce dossier contient l'ensemble des preuves documentaires organisées par critère et par indicateur.
        Chaque sous-dossier correspond à un critère Qualiopi et contient les captures d'écran et documents
        attestant de la conformité de l'organisme aux exigences du Référentiel National Qualité.
      </div>

      <div class="footer">
        Dossier généré automatiquement par WORKBOTS Formation<br>
        Ce document constitue une preuve documentaire pour votre audit Qualiopi
      </div>
    </body>
    </html>
  `;

  // Générer le PDF
  const pdfBuffer = await genererPDFFromHTML(htmlContent);

  return { buffer: pdfBuffer };
}

// ===========================================
// EXPORTS
// ===========================================

export {
  closeBrowser,
};
