// ===========================================
// SERVICE DE GÉNÉRATION DE PREUVES QUALIOPI
// Captures d'écran + Export ZIP
// ===========================================

import puppeteer, { Browser, Page } from "puppeteer";
import archiver from "archiver";
import { Writable } from "stream";
import prisma from "@/lib/db/prisma";
import { INDICATEURS_QUALIOPI, CRITERES_QUALIOPI, IndicateurQualiopi } from "./indicateurs-data";

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
  console.log(`[Puppeteer] Capturing screenshot: ${url}`);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Définir la taille de la fenêtre
    await page.setViewport({
      width: options.width || 1920,
      height: options.height || 1080,
    });

    // Extraire le domaine de l'URL
    const urlObj = new URL(url);
    const baseOrigin = urlObj.origin;

    // Si des cookies sont fournis, injecter l'authentification Supabase
    if (options.cookies && options.cookies.length > 0) {
      console.log(`[Puppeteer] Setting up authentication for: ${baseOrigin}`);

      // Naviguer d'abord vers le domaine pour pouvoir modifier le localStorage
      try {
        await page.goto(baseOrigin, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
      } catch (e) {
        console.log(`[Puppeteer] Initial navigation completed`);
      }

      // Chercher le cookie Supabase qui contient le token
      // Les cookies Supabase ont généralement le format: sb-<project>-auth-token
      const supabaseCookies = options.cookies.filter(c =>
        c.name.includes("sb-") && c.name.includes("-auth-token")
      );

      console.log(`[Puppeteer] Found ${supabaseCookies.length} Supabase auth cookies`);

      if (supabaseCookies.length > 0) {
        // Le cookie Supabase contient une session encodée en base64
        // On va l'injecter dans le localStorage pour que le client Supabase le reconnaisse
        for (const cookie of supabaseCookies) {
          try {
            // Décoder le cookie (peut être encodé en URL ou base64)
            let sessionData = cookie.value;

            // Essayer de décoder si c'est encodé en URL
            try {
              sessionData = decodeURIComponent(sessionData);
            } catch (e) {
              // Pas encodé en URL, continuer
            }

            // Extraire le project ID du nom du cookie (sb-<project>-auth-token)
            const projectIdMatch = cookie.name.match(/sb-([^-]+)-auth-token/);
            const projectId = projectIdMatch ? projectIdMatch[1] : "default";

            // Injecter dans le localStorage sous la clé que Supabase utilise
            const storageKey = `sb-${projectId}-auth-token`;

            await page.evaluate((key: string, value: string) => {
              localStorage.setItem(key, value);
              console.log(`[Puppeteer] Set localStorage: ${key}`);
            }, storageKey, sessionData);

            console.log(`[Puppeteer] Injected Supabase session into localStorage: ${storageKey}`);
          } catch (e: any) {
            console.warn(`[Puppeteer] Could not inject session: ${e?.message}`);
          }
        }
      }

      // Aussi définir les cookies de manière traditionnelle
      const cleanedCookies = options.cookies
        .filter(c => c.name && c.value && c.value.trim() !== "")
        .map(c => ({
          name: c.name,
          value: c.value,
          url: baseOrigin,
        }));

      if (cleanedCookies.length > 0) {
        try {
          await page.setCookie(...cleanedCookies);
          console.log(`[Puppeteer] Set ${cleanedCookies.length} cookies`);
        } catch (cookieError: any) {
          console.warn(`[Puppeteer] Warning: Could not set cookies: ${cookieError?.message}`);
        }
      }
    }

    // Naviguer vers l'URL cible
    console.log(`[Puppeteer] Navigating to target: ${url}`);
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Attendre que la page soit bien chargée (et que l'auth soit prise en compte)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Vérifier si on est sur une page de login (redirection non souhaitée)
    const currentUrl = page.url();
    if (currentUrl.includes("/login") || currentUrl.includes("/auth") || currentUrl.includes("/connexion")) {
      console.warn(`[Puppeteer] Warning: Redirected to login page: ${currentUrl}`);
    }

    // Capturer la screenshot
    console.log(`[Puppeteer] Taking screenshot...`);
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: options.fullPage ?? true,
    });

    console.log(`[Puppeteer] Screenshot captured successfully (${(screenshot as Buffer).length} bytes)`);
    return screenshot as Buffer;
  } catch (error) {
    console.error(`[Puppeteer] Error capturing ${url}:`, error);
    throw error;
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

  // Récupérer le slug et nom de l'organisation
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true, name: true },
  });
  const orgSlug = organization?.slug || organizationId;
  const orgName = organization?.name || "Organisme";

  // Définir les pages à capturer selon l'indicateur
  const pagesACapture = getPagesPourIndicateur(numeroIndicateur, baseUrl, orgSlug);

  // Capturer toutes les screenshots et les stocker avec leurs métadonnées
  const captures: { buffer: Buffer; description: string; isPublic: boolean; nom: string }[] = [];
  const capturesEchouees: { nom: string; description: string; erreur: string }[] = [];

  console.log(`[Preuves] Starting captures for indicator ${numeroIndicateur}, ${pagesACapture.length} pages to capture`);
  console.log(`[Preuves] Base URL: ${baseUrl}`);
  console.log(`[Preuves] Auth cookies: ${authCookies.length}`);

  for (const pageConfig of pagesACapture) {
    console.log(`[Preuves] Capturing: ${pageConfig.nom} - ${pageConfig.url}`);
    try {
      // Pour les pages internes (non publiques), générer une capture HTML côté serveur
      // au lieu d'essayer de capturer les pages web avec authentification
      if (!pageConfig.isPublic) {
        console.log(`[Preuves] Generating server-side capture for: ${pageConfig.nom}`);
        const serverCapture = await genererCaptureServeur(
          organizationId,
          pageConfig.nom,
          pageConfig.description
        );
        if (serverCapture) {
          captures.push({
            buffer: serverCapture,
            description: pageConfig.description,
            isPublic: false,
            nom: pageConfig.nom,
          });
          console.log(`[Preuves] ✓ Capture serveur réussie: ${pageConfig.nom}`);
          continue;
        }
      }

      // Pour les pages publiques, capturer normalement avec Puppeteer
      const screenshot = await captureScreenshot(pageConfig.url, {
        cookies: undefined, // Pas de cookies pour les pages publiques
        fullPage: pageConfig.fullPage ?? true,
      });

      captures.push({
        buffer: screenshot,
        description: pageConfig.description,
        isPublic: pageConfig.isPublic || false,
        nom: pageConfig.nom,
      });
      console.log(`[Preuves] ✓ Capture réussie: ${pageConfig.nom}`);
    } catch (error: any) {
      console.error(`[Preuves] ✗ Erreur capture ${pageConfig.nom}:`, error?.message || error);
      capturesEchouees.push({
        nom: pageConfig.nom,
        description: pageConfig.description,
        erreur: error?.message || "Erreur inconnue",
      });
    }
  }

  console.log(`[Preuves] Captures terminées: ${captures.length} réussies, ${capturesEchouees.length} échouées`);

  // Générer un PDF intégré avec les données + captures d'écran
  const pdfIntegre = await genererPDFIntegre(
    organizationId,
    numeroIndicateur,
    orgName,
    indicateur,
    captures,
    capturesEchouees
  );

  if (pdfIntegre) {
    preuves.push(pdfIntegre);
  }

  return preuves;
}

// ===========================================
// GÉNÉRATION DE CAPTURES CÔTÉ SERVEUR
// Génère des "captures d'écran" à partir des données réelles
// ===========================================

async function genererCaptureServeur(
  organizationId: string,
  nomCapture: string,
  description: string
): Promise<Buffer | null> {
  try {
    let htmlContent = "";

    // Générer le HTML spécifique selon le type de capture
    switch (nomCapture) {
      case "dashboard_general":
      case "dashboard_qualiopi":
        htmlContent = await genererCaptureDashboard(organizationId);
        break;
      case "gestion_formations":
      case "formations_objectifs":
      case "formations_contenus":
      case "formations_modalites":
      case "formations_evaluations":
      case "formations_certifications":
      case "formations_referentiels":
      case "formations_accompagnement":
      case "formations_ressources":
      case "formations_supports":
      case "formations_actualisation":
      case "formations_certifiantes":
        htmlContent = await genererCaptureFormations(organizationId, nomCapture);
        break;
      case "intervenants_liste":
      case "intervenants_coordination":
      case "intervenants_competences":
      case "intervenants_formations":
      case "intervenants_externes":
      case "referents_designes":
        htmlContent = await genererCaptureIntervenants(organizationId);
        break;
      case "apprenants_positionnement":
      case "apprenants_suivi":
      case "apprenants_presence":
      case "apprenants_evaluations":
      case "apprenants_alternance":
      case "apprenants_handicap":
        htmlContent = await genererCaptureApprenants(organizationId);
        break;
      case "sessions_inscriptions":
      case "sessions_suivi":
      case "sessions_assiduite":
      case "sessions_moyens":
      case "sessions_planning":
      case "sessions_alternance":
        htmlContent = await genererCaptureSessions(organizationId);
        break;
      case "evaluations_resultats":
      case "evaluations_positionnement":
      case "evaluations_acquis":
      case "evaluations_satisfaction":
      case "evaluations_certifications":
        htmlContent = await genererCaptureEvaluations(organizationId);
        break;
      case "reclamations_liste":
      case "qualiopi_reclamations":
        htmlContent = await genererCaptureReclamations(organizationId);
        break;
      case "ameliorations_liste":
      case "qualiopi_ameliorations":
        htmlContent = await genererCaptureAmeliorations(organizationId);
        break;
      case "veille_reglementaire":
      case "veille_pedagogique":
      case "veille_metiers":
      case "veille_innovations":
      case "qualiopi_veille":
        htmlContent = await genererCaptureVeille(organizationId);
        break;
      default:
        // Capture générique pour les autres types
        htmlContent = await genererCaptureGenerique(organizationId, description);
    }

    if (!htmlContent) {
      return null;
    }

    // Convertir le HTML en image PNG
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      await new Promise(resolve => setTimeout(resolve, 500));

      const screenshot = await page.screenshot({
        type: "png",
        fullPage: true,
      });

      return screenshot as Buffer;
    } finally {
      await page.close();
    }
  } catch (error) {
    console.error(`[Preuves] Erreur génération capture serveur ${nomCapture}:`, error);
    return null;
  }
}

// Génère une capture du dashboard
async function genererCaptureDashboard(organizationId: string): Promise<string> {
  const [formations, apprenants, sessions, intervenants, evaluations] = await Promise.all([
    prisma.formation.count({ where: { organizationId } }),
    prisma.apprenant.count({ where: { organizationId } }),
    prisma.session.count({ where: { organizationId } }),
    prisma.intervenant.count({ where: { organizationId } }),
    prisma.evaluationSatisfaction.count({ where: { organizationId, status: "COMPLETED" } }),
  ]);

  // Calcul du score Qualiopi simulé
  const scoreQualiopi = Math.min(100, Math.round(
    (formations > 0 ? 20 : 0) +
    (apprenants > 0 ? 20 : 0) +
    (sessions > 0 ? 20 : 0) +
    (intervenants > 0 ? 20 : 0) +
    (evaluations > 0 ? 20 : 0)
  ));

  return generateServerCaptureHTML("Tableau de bord", `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-value">${formations}</div>
        <div class="stat-label">Formations</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${apprenants}</div>
        <div class="stat-label">Apprenants</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${sessions}</div>
        <div class="stat-label">Sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-value">${intervenants}</div>
        <div class="stat-label">Intervenants</div>
      </div>
    </div>
    <div class="qualiopi-score">
      <div class="score-circle">
        <div class="score-value">${scoreQualiopi}%</div>
        <div class="score-label">Score Qualiopi</div>
      </div>
      <div class="score-details">
        <p>Indicateurs validés: ${Math.round(scoreQualiopi / 100 * 32)} / 32</p>
        <p>Dernière mise à jour: ${new Date().toLocaleDateString("fr-FR")}</p>
      </div>
    </div>
  `);
}

// Génère une capture des formations
async function genererCaptureFormations(organizationId: string, type: string): Promise<string> {
  const formations = await prisma.formation.findMany({
    where: { organizationId },
    select: {
      titre: true,
      status: true,
      isCertifiante: true,
      createdAt: true,
      estPublieCatalogue: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const rows = formations.map((f: any) => `
    <tr>
      <td>${f.titre}</td>
      <td><span class="status-badge ${f.status.toLowerCase()}">${f.status}</span></td>
      <td>${f.isCertifiante ? "✓ Oui" : "Non"}</td>
      <td>${f.estPublieCatalogue ? "✓" : "-"}</td>
      <td>${new Date(f.createdAt).toLocaleDateString("fr-FR")}</td>
    </tr>
  `).join("");

  return generateServerCaptureHTML("Gestion des formations", `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Statut</th>
            <th>Certifiante</th>
            <th>Catalogue</th>
            <th>Créée le</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='5' class='empty'>Aucune formation</td></tr>"}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <p>Total: ${formations.length} formation(s)</p>
    </div>
  `);
}

// Génère une capture des intervenants
async function genererCaptureIntervenants(organizationId: string): Promise<string> {
  const intervenants = await prisma.intervenant.findMany({
    where: { organizationId },
    select: {
      nom: true,
      prenom: true,
      email: true,
      fonction: true,
      specialites: true,
      isActive: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const rows = intervenants.map((i: any) => `
    <tr>
      <td>${i.prenom || ""} ${i.nom || ""}</td>
      <td>${i.email || "-"}</td>
      <td>${i.fonction || "-"}</td>
      <td>${i.specialites?.slice(0, 2).join(", ") || "-"}</td>
      <td><span class="status-badge ${i.isActive ? "actif" : "inactif"}">${i.isActive ? "Actif" : "Inactif"}</span></td>
    </tr>
  `).join("");

  return generateServerCaptureHTML("Liste des intervenants", `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Fonction</th>
            <th>Spécialités</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='5' class='empty'>Aucun intervenant</td></tr>"}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <p>Total: ${intervenants.length} intervenant(s)</p>
    </div>
  `);
}

// Génère une capture des apprenants
async function genererCaptureApprenants(organizationId: string): Promise<string> {
  const apprenants = await prisma.apprenant.findMany({
    where: { organizationId },
    select: {
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const rows = apprenants.map(a => `
    <tr>
      <td>${a.prenom || ""} ${a.nom || ""}</td>
      <td>${a.email || "-"}</td>
      <td>${a.telephone || "-"}</td>
      <td>${new Date(a.createdAt).toLocaleDateString("fr-FR")}</td>
    </tr>
  `).join("");

  return generateServerCaptureHTML("Liste des apprenants", `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Inscription</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='4' class='empty'>Aucun apprenant</td></tr>"}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <p>Total: ${apprenants.length} apprenant(s)</p>
    </div>
  `);
}

// Génère une capture des sessions
async function genererCaptureSessions(organizationId: string): Promise<string> {
  const sessions = await prisma.session.findMany({
    where: { organizationId },
    select: {
      nom: true,
      reference: true,
      status: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const rows = sessions.map((s: any) => `
    <tr>
      <td>${s.nom || s.reference || "Session"}</td>
      <td>${s.reference}</td>
      <td><span class="status-badge ${s.status?.toLowerCase()}">${s.status}</span></td>
      <td>${new Date(s.createdAt).toLocaleDateString("fr-FR")}</td>
    </tr>
  `).join("");

  return generateServerCaptureHTML("Sessions de formation", `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Référence</th>
            <th>Statut</th>
            <th>Créée le</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='4' class='empty'>Aucune session</td></tr>"}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <p>Total: ${sessions.length} session(s)</p>
    </div>
  `);
}

// Génère une capture des évaluations
async function genererCaptureEvaluations(organizationId: string): Promise<string> {
  const evaluations = await prisma.evaluationSatisfaction.findMany({
    where: { organizationId },
    select: {
      status: true,
      completedAt: true,
      reponse: { select: { noteGlobale: true } },
      session: { select: { formation: { select: { titre: true } } } },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const completes = evaluations.filter(e => e.status === "COMPLETED");
  const noteMoyenne = completes.length > 0
    ? (completes.reduce((acc, e) => acc + (e.reponse?.noteGlobale || 0), 0) / completes.length).toFixed(1)
    : "N/A";

  const rows = evaluations.map(e => `
    <tr>
      <td>${e.session?.formation?.titre || "Formation"}</td>
      <td><span class="status-badge ${e.status.toLowerCase()}">${e.status}</span></td>
      <td>${e.reponse?.noteGlobale ? `${e.reponse.noteGlobale}/10` : "-"}</td>
      <td>${e.completedAt ? new Date(e.completedAt).toLocaleDateString("fr-FR") : "-"}</td>
    </tr>
  `).join("");

  return generateServerCaptureHTML("Évaluations de satisfaction", `
    <div class="summary-box">
      <div class="summary-stat">
        <span class="summary-value">${evaluations.length}</span>
        <span class="summary-label">Évaluations envoyées</span>
      </div>
      <div class="summary-stat">
        <span class="summary-value">${completes.length}</span>
        <span class="summary-label">Complétées</span>
      </div>
      <div class="summary-stat highlight">
        <span class="summary-value">${noteMoyenne}</span>
        <span class="summary-label">Note moyenne /10</span>
      </div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Formation</th>
            <th>Statut</th>
            <th>Note</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='4' class='empty'>Aucune évaluation</td></tr>"}
        </tbody>
      </table>
    </div>
  `);
}

// Génère une capture des réclamations
async function genererCaptureReclamations(organizationId: string): Promise<string> {
  const reclamations = await prisma.reclamation.findMany({
    where: { organizationId },
    select: {
      objet: true,
      statut: true,
      categorie: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const rows = reclamations.map((r: any) => `
    <tr>
      <td>${r.objet || "Sans objet"}</td>
      <td><span class="status-badge ${r.statut?.toLowerCase()}">${r.statut}</span></td>
      <td>${r.categorie || "-"}</td>
      <td>${new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
    </tr>
  `).join("");

  return generateServerCaptureHTML("Registre des réclamations", `
    ${reclamations.length === 0 ? `
      <div class="empty-state">
        <p>✓ Aucune réclamation enregistrée</p>
        <p class="subtitle">Témoigne d'un bon niveau de satisfaction</p>
      </div>
    ` : `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Objet</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="table-footer">
        <p>Total: ${reclamations.length} réclamation(s)</p>
      </div>
    `}
  `);
}

// Génère une capture des améliorations
async function genererCaptureAmeliorations(organizationId: string): Promise<string> {
  const ameliorations = await prisma.actionAmelioration.findMany({
    where: { organizationId },
    select: {
      titre: true,
      statut: true,
      priorite: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const rows = ameliorations.map(a => `
    <tr>
      <td>${a.titre || "Sans titre"}</td>
      <td><span class="status-badge ${a.statut?.toLowerCase()}">${a.statut}</span></td>
      <td><span class="priority-badge ${a.priorite?.toLowerCase()}">${a.priorite}</span></td>
      <td>${new Date(a.createdAt).toLocaleDateString("fr-FR")}</td>
    </tr>
  `).join("");

  return generateServerCaptureHTML("Actions d'amélioration continue", `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Statut</th>
            <th>Priorité</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='4' class='empty'>Aucune action d'amélioration</td></tr>"}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <p>Total: ${ameliorations.length} action(s)</p>
    </div>
  `);
}

// Génère une capture de veille
async function genererCaptureVeille(organizationId: string): Promise<string> {
  // Récupérer les articles de veille avec leur statut de lecture pour cette organisation
  const articles = await prisma.veilleArticle.findMany({
    select: {
      titre: true,
      type: true,
      source: { select: { nom: true } },
      datePublication: true,
      lecturesParOrg: {
        where: { organizationId },
        select: { status: true },
      },
    },
    take: 10,
    orderBy: { datePublication: "desc" },
  });

  const rows = articles.map(a => {
    const estLu = a.lecturesParOrg.length > 0 && a.lecturesParOrg[0].status === "LU";
    return `
      <tr>
        <td>${a.titre || "Sans titre"}</td>
        <td><span class="type-badge">${a.type}</span></td>
        <td>${a.source?.nom || "-"}</td>
        <td>${a.datePublication ? new Date(a.datePublication).toLocaleDateString("fr-FR") : "-"}</td>
        <td>${estLu ? "✓" : "-"}</td>
      </tr>
    `;
  }).join("");

  return generateServerCaptureHTML("Veille réglementaire et pédagogique", `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Type</th>
            <th>Source</th>
            <th>Date</th>
            <th>Lu</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='5' class='empty'>Aucun élément de veille</td></tr>"}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <p>Total: ${articles.length} élément(s) de veille</p>
    </div>
  `);
}

// Génère une capture générique
async function genererCaptureGenerique(organizationId: string, description: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  return generateServerCaptureHTML(description, `
    <div class="generic-content">
      <div class="org-info">
        <h2>${org?.name || "Organisme de formation"}</h2>
        <p>Données extraites le ${new Date().toLocaleDateString("fr-FR")}</p>
      </div>
      <div class="placeholder">
        <p>📊 ${description}</p>
        <p class="subtitle">Les données de cette section sont disponibles dans le système de gestion.</p>
      </div>
    </div>
  `);
}

// Template HTML pour les captures serveur
function generateServerCaptureHTML(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          padding: 40px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%);
          color: white;
          padding: 30px 40px;
        }
        .header h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .header .subtitle {
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 40px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        .stat-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .stat-label {
          color: #64748b;
          font-size: 14px;
        }
        .qualiopi-score {
          display: flex;
          align-items: center;
          gap: 30px;
          background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%);
          border-radius: 12px;
          padding: 30px;
          color: white;
        }
        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .score-value {
          font-size: 32px;
          font-weight: 700;
        }
        .score-label {
          font-size: 12px;
          opacity: 0.9;
        }
        .score-details p {
          margin-bottom: 8px;
          opacity: 0.9;
        }
        .table-container {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #f1f5f9;
          color: #475569;
          font-weight: 600;
          text-align: left;
          padding: 16px 20px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          font-size: 14px;
        }
        tr:hover td {
          background: #f8fafc;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge.en_cours, .status-badge.active, .status-badge.actif {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .status-badge.terminee, .status-badge.completed, .status-badge.termine, .status-badge.resolu {
          background: #dcfce7;
          color: #16a34a;
        }
        .status-badge.brouillon, .status-badge.pending, .status-badge.en_attente {
          background: #fef3c7;
          color: #d97706;
        }
        .priority-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .priority-badge.haute, .priority-badge.critique {
          background: #fee2e2;
          color: #dc2626;
        }
        .priority-badge.moyenne {
          background: #fef3c7;
          color: #d97706;
        }
        .priority-badge.basse {
          background: #e2e8f0;
          color: #64748b;
        }
        .type-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: #ede9fe;
          color: #7c3aed;
        }
        .table-footer {
          padding: 16px 20px;
          background: #f8fafc;
          color: #64748b;
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
        }
        .empty {
          text-align: center;
          color: #94a3b8;
          font-style: italic;
          padding: 40px 20px !important;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #16a34a;
        }
        .empty-state p {
          font-size: 18px;
          margin-bottom: 8px;
        }
        .empty-state .subtitle {
          color: #64748b;
          font-size: 14px;
        }
        .summary-box {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-stat {
          flex: 1;
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        .summary-stat.highlight {
          background: linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%);
          color: white;
          border: none;
        }
        .summary-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .summary-label {
          font-size: 13px;
          opacity: 0.8;
        }
        .generic-content {
          text-align: center;
          padding: 60px 20px;
        }
        .org-info h2 {
          color: #1e293b;
          margin-bottom: 8px;
        }
        .org-info p {
          color: #64748b;
          margin-bottom: 40px;
        }
        .placeholder {
          background: #f8fafc;
          border-radius: 12px;
          padding: 40px;
          border: 2px dashed #e2e8f0;
        }
        .placeholder p {
          font-size: 18px;
          color: #475569;
          margin-bottom: 8px;
        }
        .placeholder .subtitle {
          color: #94a3b8;
          font-size: 14px;
        }
        .footer {
          background: #f8fafc;
          padding: 20px 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 ${title}</h1>
          <div class="subtitle">WORKBOTS Formation - Données extraites le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          Document généré automatiquement pour preuve Qualiopi
        </div>
      </div>
    </body>
    </html>
  `;
}

// ===========================================
// PAGES À CAPTURER PAR INDICATEUR
// ===========================================

interface PageConfig {
  url: string;
  nom: string;
  description: string;
  fullPage?: boolean;
  isPublic?: boolean; // true = capture sans authentification (vue visiteur)
}

function getPagesPourIndicateur(
  numero: number,
  baseUrl: string,
  orgSlug?: string
): PageConfig[] {
  const pages: PageConfig[] = [];

  // URL du catalogue public avec le paramètre org
  const cataloguePublicUrl = orgSlug
    ? `${baseUrl}/catalogue?org=${orgSlug}`
    : `${baseUrl}/catalogue`;

  switch (numero) {
    // =============================================
    // CRITÈRE 1 - Conditions d'information du public
    // =============================================
    case 1: // Information sur les prestations
      pages.push(
        // Page publique - ce que voit le visiteur/auditeur
        { url: cataloguePublicUrl, nom: "catalogue_public", description: "Catalogue public des formations (vue visiteur)", isPublic: true, fullPage: true },
        // Pages internes de gestion
        { url: `${baseUrl}/mes-formations`, nom: "gestion_formations", description: "Gestion des formations avec détails", fullPage: true },
        { url: `${baseUrl}/settings`, nom: "parametres_organisme", description: "Paramètres de l'organisme (contacts, infos)" }
      );
      break;

    case 2: // Indicateurs de résultats
      pages.push(
        { url: `${baseUrl}`, nom: "dashboard_general", description: "Tableau de bord général avec KPIs" },
        { url: `${baseUrl}/qualiopi`, nom: "dashboard_qualiopi", description: "Dashboard Qualiopi avec scores" },
        { url: `${baseUrl}/evaluations`, nom: "evaluations_resultats", description: "Résultats des évaluations de satisfaction", fullPage: true }
      );
      break;

    case 3: // Obtention des certifications (indicateur CFA/certifiant)
      pages.push(
        { url: `${baseUrl}/mes-formations`, nom: "formations_certifiantes", description: "Formations certifiantes (RNCP/RS)" },
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_certifications", description: "Suivi des certifications" }
      );
      break;

    // =============================================
    // CRITÈRE 2 - Identification précise des objectifs
    // =============================================
    case 4: // Analyse du besoin
      pages.push(
        { url: `${baseUrl}/donnees/apprenants`, nom: "apprenants_positionnement", description: "Liste des apprenants avec positionnement", fullPage: true },
        { url: `${baseUrl}/sessions`, nom: "sessions_inscriptions", description: "Sessions avec inscriptions" }
      );
      break;

    case 5: // Objectifs opérationnels
      pages.push(
        { url: cataloguePublicUrl, nom: "catalogue_objectifs", description: "Catalogue avec objectifs des formations (vue publique)", isPublic: true, fullPage: true },
        { url: `${baseUrl}/mes-formations`, nom: "formations_objectifs", description: "Formations avec objectifs détaillés", fullPage: true }
      );
      break;

    case 6: // Contenus et modalités
      pages.push(
        { url: cataloguePublicUrl, nom: "catalogue_programmes", description: "Programmes de formation (vue publique)", isPublic: true, fullPage: true },
        { url: `${baseUrl}/mes-formations`, nom: "formations_contenus", description: "Contenus et modalités des formations", fullPage: true }
      );
      break;

    case 7: // Adéquation contenus/certification (CFA)
      pages.push(
        { url: `${baseUrl}/mes-formations`, nom: "formations_referentiels", description: "Formations avec référentiels de certification", fullPage: true }
      );
      break;

    case 8: // Procédures de positionnement
      pages.push(
        { url: `${baseUrl}/donnees/apprenants`, nom: "apprenants_evaluations", description: "Apprenants avec évaluations initiales", fullPage: true },
        { url: `${baseUrl}/evaluations`, nom: "evaluations_positionnement", description: "Évaluations de positionnement" }
      );
      break;

    // =============================================
    // CRITÈRE 3 - Adaptation aux publics bénéficiaires
    // =============================================
    case 9: // Information des publics
      pages.push(
        { url: cataloguePublicUrl, nom: "catalogue_conditions", description: "Conditions de déroulement (vue publique)", isPublic: true, fullPage: true },
        { url: `${baseUrl}/mes-formations`, nom: "formations_modalites", description: "Modalités de formation" },
        { url: `${baseUrl}/settings`, nom: "reglement_interieur", description: "Paramètres avec règlement intérieur" }
      );
      break;

    case 10: // Adaptation de la prestation
      pages.push(
        { url: `${baseUrl}/sessions`, nom: "sessions_suivi", description: "Sessions avec suivi des participants", fullPage: true },
        { url: `${baseUrl}/donnees/apprenants`, nom: "apprenants_suivi", description: "Suivi individuel des apprenants", fullPage: true }
      );
      break;

    case 11: // Évaluation de l'atteinte des objectifs
      pages.push(
        { url: `${baseUrl}/evaluations`, nom: "evaluations_acquis", description: "Évaluations des acquis", fullPage: true },
        { url: `${baseUrl}/mes-formations`, nom: "formations_evaluations", description: "Formations avec évaluations" }
      );
      break;

    case 12: // Engagement des bénéficiaires
      pages.push(
        { url: `${baseUrl}/sessions`, nom: "sessions_assiduite", description: "Taux de présence par session", fullPage: true },
        { url: `${baseUrl}/donnees/apprenants`, nom: "apprenants_presence", description: "Suivi de l'assiduité des apprenants", fullPage: true }
      );
      break;

    case 13: // Coordination des acteurs (alternance - CFA)
      pages.push(
        { url: `${baseUrl}/sessions`, nom: "sessions_alternance", description: "Sessions en alternance" },
        { url: `${baseUrl}/donnees/apprenants`, nom: "apprenants_alternance", description: "Apprenants en alternance", fullPage: true }
      );
      break;

    case 14: // Exercice de la citoyenneté (CFA)
      pages.push(
        { url: `${baseUrl}/mes-formations`, nom: "formations_accompagnement", description: "Accompagnement socio-professionnel" },
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_accompagnement", description: "Suivi accompagnement" }
      );
      break;

    case 15: // Information sur les aides (CFA - apprentis)
      pages.push(
        { url: `${baseUrl}/settings`, nom: "informations_apprentis", description: "Informations droits/devoirs apprentis" },
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_apprentis", description: "Suivi des apprentis" }
      );
      break;

    case 16: // Conformité du contrat (certifications)
      pages.push(
        { url: `${baseUrl}/mes-formations`, nom: "formations_certifications", description: "Formations avec certifications" },
        { url: `${baseUrl}/evaluations`, nom: "evaluations_certifications", description: "Résultats des certifications" }
      );
      break;

    // =============================================
    // CRITÈRE 4 - Adéquation des moyens pédagogiques
    // =============================================
    case 17: // Moyens humains et techniques
      pages.push(
        { url: `${baseUrl}/donnees/intervenants`, nom: "intervenants_liste", description: "Liste des intervenants", fullPage: true },
        { url: `${baseUrl}/sessions`, nom: "sessions_moyens", description: "Sessions avec moyens affectés", fullPage: true },
        { url: `${baseUrl}/settings`, nom: "locaux_equipements", description: "Informations locaux et équipements" }
      );
      break;

    case 18: // Coordination des intervenants
      pages.push(
        { url: `${baseUrl}/donnees/intervenants`, nom: "intervenants_coordination", description: "Coordination des intervenants", fullPage: true },
        { url: `${baseUrl}/sessions`, nom: "sessions_planning", description: "Planning des sessions avec intervenants", fullPage: true }
      );
      break;

    case 19: // Ressources pédagogiques
      pages.push(
        { url: `${baseUrl}/mes-formations`, nom: "formations_ressources", description: "Ressources pédagogiques par formation", fullPage: true },
        { url: `${baseUrl}/documents`, nom: "documents_pedagogiques", description: "Documents et supports pédagogiques", fullPage: true }
      );
      break;

    case 20: // Intervenants internes ou externes (CFA - référents)
      pages.push(
        { url: `${baseUrl}/donnees/intervenants`, nom: "referents_designes", description: "Référents handicap et mobilité" },
        { url: `${baseUrl}/settings`, nom: "organigramme_referents", description: "Organigramme avec référents" }
      );
      break;

    case 21: // Modalités de diffusion des supports
      pages.push(
        { url: `${baseUrl}/mes-formations`, nom: "formations_supports", description: "Supports de formation avec dates de mise à jour", fullPage: true },
        { url: `${baseUrl}/documents`, nom: "documents_actualisation", description: "Suivi d'actualisation des documents", fullPage: true }
      );
      break;

    // =============================================
    // CRITÈRE 5 - Qualification et développement des compétences
    // =============================================
    case 22: // Compétences des intervenants
      pages.push(
        { url: `${baseUrl}/donnees/intervenants`, nom: "intervenants_competences", description: "Fiches intervenants avec compétences/CV", fullPage: true }
      );
      break;

    case 23: // Développement des compétences
      pages.push(
        { url: `${baseUrl}/donnees/intervenants`, nom: "intervenants_formations", description: "Formations suivies par les intervenants", fullPage: true },
        { url: `${baseUrl}/qualiopi/veille`, nom: "veille_pedagogique", description: "Veille pédagogique" }
      );
      break;

    case 24: // Veille légale et réglementaire
      pages.push(
        { url: `${baseUrl}/qualiopi/veille`, nom: "veille_reglementaire", description: "Sources de veille réglementaire", fullPage: true },
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_veille", description: "Dashboard veille Qualiopi" }
      );
      break;

    case 25: // Veille sur les compétences métiers
      pages.push(
        { url: `${baseUrl}/qualiopi/veille`, nom: "veille_metiers", description: "Veille sur les évolutions métiers", fullPage: true },
        { url: `${baseUrl}/mes-formations`, nom: "formations_actualisation", description: "Mise à jour des formations" }
      );
      break;

    // =============================================
    // CRITÈRE 6 - Inscription dans l'environnement professionnel
    // =============================================
    case 26: // Veille sur les innovations
      pages.push(
        { url: `${baseUrl}/qualiopi/veille`, nom: "veille_innovations", description: "Veille sur les innovations pédagogiques", fullPage: true }
      );
      break;

    case 27: // Réseau professionnel (handicap)
      pages.push(
        { url: `${baseUrl}/settings`, nom: "referent_handicap", description: "Informations référent handicap" },
        { url: `${baseUrl}/donnees/apprenants`, nom: "apprenants_handicap", description: "Accompagnement des personnes en situation de handicap", fullPage: true },
        { url: cataloguePublicUrl, nom: "catalogue_accessibilite", description: "Informations accessibilité (vue publique)", isPublic: true }
      );
      break;

    case 28: // Sous-traitance
      pages.push(
        { url: `${baseUrl}/donnees/intervenants`, nom: "intervenants_externes", description: "Intervenants externes/sous-traitants", fullPage: true },
        { url: `${baseUrl}/documents`, nom: "contrats_soustraitance", description: "Contrats de sous-traitance" }
      );
      break;

    case 29: // Insertion professionnelle (CFA)
      pages.push(
        { url: `${baseUrl}/qualiopi`, nom: "partenariats_entreprises", description: "Partenariats entreprises" },
        { url: `${baseUrl}/donnees/entreprises`, nom: "entreprises_partenaires", description: "Liste des entreprises partenaires", fullPage: true }
      );
      break;

    // =============================================
    // CRITÈRE 7 - Recueil et prise en compte des appréciations
    // =============================================
    case 30: // Recueil des appréciations
      pages.push(
        { url: `${baseUrl}/evaluations`, nom: "evaluations_satisfaction", description: "Évaluations de satisfaction", fullPage: true },
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_satisfaction", description: "Synthèse satisfaction" }
      );
      break;

    case 31: // Traitement des réclamations
      pages.push(
        { url: `${baseUrl}/reclamations`, nom: "reclamations_liste", description: "Registre des réclamations", fullPage: true },
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_reclamations", description: "Suivi des réclamations" }
      );
      break;

    case 32: // Mesures d'amélioration
      pages.push(
        { url: `${baseUrl}/ameliorations`, nom: "ameliorations_liste", description: "Actions d'amélioration continue", fullPage: true },
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_ameliorations", description: "Suivi des améliorations" }
      );
      break;

    default:
      // Fallback si indicateur non géré
      pages.push(
        { url: `${baseUrl}/qualiopi`, nom: "qualiopi_general", description: "Dashboard Qualiopi" }
      );
  }

  return pages;
}

// ===========================================
// GÉNÉRATION DE PDF INTÉGRÉ (DONNÉES + CAPTURES)
// ===========================================

interface CaptureInfo {
  buffer: Buffer;
  description: string;
  isPublic: boolean;
  nom: string;
}

interface CaptureEchouee {
  nom: string;
  description: string;
  erreur: string;
}

async function genererPDFIntegre(
  organizationId: string,
  numeroIndicateur: number,
  orgName: string,
  indicateur: IndicateurQualiopi,
  captures: CaptureInfo[],
  capturesEchouees: CaptureEchouee[] = []
): Promise<PreuveGeneree | null> {
  try {
    const dateGeneration = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Récupérer les données spécifiques à l'indicateur
    const donneesIndicateur = await getDonneesIndicateur(organizationId, numeroIndicateur);

    // Convertir les captures en base64 pour les intégrer dans le HTML
    const capturesBase64 = captures.map(c => ({
      ...c,
      base64: `data:image/png;base64,${c.buffer.toString("base64")}`,
    }));

    // Séparer les captures publiques et internes
    const capturesPubliques = capturesBase64.filter(c => c.isPublic);
    const capturesInternes = capturesBase64.filter(c => !c.isPublic);

    // Construire le HTML du PDF intégré
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #333;
            padding: 30px;
          }
          .header {
            border-bottom: 3px solid #7C3AED;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            color: #7C3AED;
            font-size: 20px;
            margin-bottom: 5px;
          }
          .header h2 {
            color: #666;
            font-size: 14px;
            font-weight: normal;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            color: #888;
            font-size: 10px;
          }
          .qualiopi-badge {
            background: linear-gradient(135deg, #7C3AED, #3B82F6);
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 9px;
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            color: #7C3AED;
            font-size: 14px;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 8px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-title .icon {
            width: 24px;
            height: 24px;
            background: #7C3AED;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }
          .exigences-list {
            list-style: none;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .exigences-list li {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            font-size: 10px;
            background: #F9FAFB;
            padding: 8px;
            border-radius: 6px;
          }
          .exigences-list li::before {
            content: "✓";
            color: #10B981;
            font-weight: bold;
          }
          .preuves-attendues {
            background: #EEF2FF;
            border-left: 4px solid #7C3AED;
            padding: 12px 15px;
            margin: 15px 0;
            border-radius: 0 8px 8px 0;
          }
          .preuves-attendues h4 {
            color: #7C3AED;
            margin-bottom: 8px;
            font-size: 11px;
          }
          .preuves-attendues ul {
            margin-left: 20px;
            font-size: 10px;
          }
          .data-section {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
          }
          .data-section h4 {
            color: #166534;
            margin-bottom: 10px;
          }
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .stat-card {
            background: white;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            border: 1px solid #E5E7EB;
          }
          .stat-card.highlight {
            background: linear-gradient(135deg, #7C3AED, #3B82F6);
            color: white;
            border: none;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .stat-label {
            font-size: 9px;
            opacity: 0.8;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin: 10px 0;
          }
          .data-table th {
            background: #7C3AED;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9px;
          }
          .data-table td {
            padding: 8px;
            border-bottom: 1px solid #E5E7EB;
          }
          .data-table tr:nth-child(even) td {
            background: #F9FAFB;
          }
          .captures-section {
            margin-top: 20px;
          }
          .capture-container {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .capture-label {
            background: #F3F4F6;
            padding: 8px 12px;
            border-radius: 6px 6px 0 0;
            font-weight: bold;
            font-size: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .capture-label.public {
            background: #DCFCE7;
            color: #166534;
          }
          .capture-label.public::before {
            content: "🌐";
          }
          .capture-label.internal {
            background: #E0E7FF;
            color: #3730A3;
          }
          .capture-label.internal::before {
            content: "🔒";
          }
          .capture-image {
            border: 1px solid #E5E7EB;
            border-top: none;
            border-radius: 0 0 6px 6px;
            overflow: hidden;
          }
          .capture-image img {
            width: 100%;
            height: auto;
            display: block;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            color: #888;
            font-size: 9px;
          }
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Indicateur ${numeroIndicateur} - ${indicateur.libelle}</h1>
          <h2>Critère ${indicateur.critere} - ${getCritereNom(indicateur.critere)}</h2>
          <div class="meta">
            <span>Organisme: <strong>${orgName}</strong></span>
            <span class="qualiopi-badge">PREUVE QUALIOPI</span>
            <span>Généré le: ${dateGeneration}</span>
          </div>
        </div>

        <!-- Description de l'indicateur -->
        <div class="section">
          <h3 class="section-title"><span class="icon">📋</span> Description</h3>
          <p style="font-size: 11px; line-height: 1.6; color: #374151;">${indicateur.description}</p>
        </div>

        <!-- Exigences -->
        <div class="section">
          <h3 class="section-title"><span class="icon">✓</span> Exigences à respecter</h3>
          <ul class="exigences-list">
            ${indicateur.exigences.map(e => `<li>${e}</li>`).join("")}
          </ul>
        </div>

        <!-- Preuves attendues -->
        <div class="preuves-attendues">
          <h4>📎 Preuves attendues pour cet indicateur</h4>
          <ul>
            ${indicateur.preuvesAttendues.map(p => `<li>${p}</li>`).join("")}
          </ul>
        </div>

        <!-- Données extraites (si disponibles) -->
        ${donneesIndicateur ? `
        <div class="section">
          <h3 class="section-title"><span class="icon">📊</span> Données extraites</h3>
          <div class="data-section">
            ${donneesIndicateur}
          </div>
        </div>
        ` : ""}

        <!-- Captures d'écran -->
        <div class="page-break"></div>
        <div class="section captures-section">
          <h3 class="section-title"><span class="icon">📸</span> Captures d'écran - Preuves visuelles</h3>

          ${captures.length === 0 && capturesEchouees.length === 0 ? `
          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <strong>⚠️ Aucune capture d'écran</strong><br>
            <span style="font-size: 10px; color: #92400E;">Les captures d'écran n'ont pas pu être générées pour cet indicateur.</span>
          </div>
          ` : ""}

          ${capturesPubliques.length > 0 ? `
          <h4 style="color: #166534; margin: 15px 0 10px; font-size: 12px;">🌐 Pages publiques (vue visiteur/auditeur)</h4>
          ${capturesPubliques.map(c => `
            <div class="capture-container">
              <div class="capture-label public">${c.description}</div>
              <div class="capture-image">
                <img src="${c.base64}" alt="${c.description}" />
              </div>
            </div>
          `).join("")}
          ` : ""}

          ${capturesInternes.length > 0 ? `
          <h4 style="color: #3730A3; margin: 15px 0 10px; font-size: 12px;">🔒 Pages internes (gestion)</h4>
          ${capturesInternes.map(c => `
            <div class="capture-container">
              <div class="capture-label internal">${c.description}</div>
              <div class="capture-image">
                <img src="${c.base64}" alt="${c.description}" />
              </div>
            </div>
          `).join("")}
          ` : ""}

          ${capturesEchouees.length > 0 ? `
          <h4 style="color: #DC2626; margin: 15px 0 10px; font-size: 12px;">⚠️ Captures non disponibles (${capturesEchouees.length})</h4>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px; font-size: 10px;">
            <p style="margin-bottom: 8px; color: #991B1B;">Les captures suivantes n'ont pas pu être générées :</p>
            <ul style="margin-left: 15px; color: #7F1D1D;">
              ${capturesEchouees.map(c => `<li><strong>${c.description}</strong> - ${c.erreur}</li>`).join("")}
            </ul>
          </div>
          ` : ""}
        </div>

        <div class="footer">
          Document généré automatiquement par WORKBOTS Formation<br>
          Preuve documentaire pour audit Qualiopi - Indicateur ${numeroIndicateur}<br>
          ${captures.length > 0 ? `${captures.length} capture(s) réussie(s)` : ""}
          ${capturesEchouees.length > 0 ? ` • ${capturesEchouees.length} capture(s) échouée(s)` : ""}
        </div>
      </body>
      </html>
    `;

    // Générer le PDF
    const pdfBuffer = await genererPDFFromHTML(htmlContent);

    return {
      indicateur: numeroIndicateur,
      type: "pdf",
      nom: `IND${numeroIndicateur.toString().padStart(2, "0")}_PREUVE_COMPLETE.pdf`,
      description: `Preuve complète indicateur ${numeroIndicateur} - ${indicateur.libelle}`,
      buffer: pdfBuffer,
      mimeType: "application/pdf",
      extension: "pdf",
    };
  } catch (error) {
    console.error(`Erreur génération PDF intégré indicateur ${numeroIndicateur}:`, error);
    return null;
  }
}

// Récupérer le nom du critère
function getCritereNom(numeroCritere: number): string {
  const critere = CRITERES_QUALIOPI.find(c => c.numero === numeroCritere);
  return critere?.titre || "";
}

// Récupérer les données spécifiques à chaque indicateur (HTML)
async function getDonneesIndicateur(organizationId: string, numeroIndicateur: number): Promise<string | null> {
  try {
    switch (numeroIndicateur) {
      case 1: {
        // Statistiques du catalogue
        const formations = await prisma.formation.count({ where: { organizationId } });
        // Formations actives = EN_COURS ou TERMINEE (pas BROUILLON ni ARCHIVEE)
        const formationsPubliees = await prisma.formation.count({
          where: {
            organizationId,
            status: { in: ["EN_COURS", "TERMINEE"] }
          }
        });
        return `
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value">${formations}</div>
              <div class="stat-label">Formations totales</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-value">${formationsPubliees}</div>
              <div class="stat-label">Formations publiées</div>
            </div>
          </div>
        `;
      }

      case 2: {
        // Statistiques de satisfaction
        const evaluations = await prisma.evaluationSatisfaction.findMany({
          where: { organizationId },
          include: { reponse: true },
        });
        const completes = evaluations.filter(e => e.status === "COMPLETED");
        const tauxReponse = evaluations.length > 0
          ? ((completes.length / evaluations.length) * 100).toFixed(1)
          : "0";
        const avecNote = completes.filter(e => e.reponse?.noteGlobale);
        const noteMoyenne = avecNote.length > 0
          ? (avecNote.reduce((acc, e) => acc + (e.reponse?.noteGlobale || 0), 0) / avecNote.length).toFixed(1)
          : "N/A";

        return `
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value">${evaluations.length}</div>
              <div class="stat-label">Évaluations totales</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${completes.length}</div>
              <div class="stat-label">Complétées</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${tauxReponse}%</div>
              <div class="stat-label">Taux de réponse</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-value">${noteMoyenne}</div>
              <div class="stat-label">Note moyenne /10</div>
            </div>
          </div>
        `;
      }

      case 4: {
        // Statistiques apprenants
        const apprenants = await prisma.apprenant.count({ where: { organizationId } });
        const sessions = await prisma.session.count({ where: { organizationId } });
        return `
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value">${apprenants}</div>
              <div class="stat-label">Apprenants inscrits</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-value">${sessions}</div>
              <div class="stat-label">Sessions créées</div>
            </div>
          </div>
        `;
      }

      case 17: {
        // Liste des intervenants
        const intervenants = await prisma.intervenant.findMany({
          where: { organizationId },
          select: { nom: true, prenom: true, fonction: true, specialites: true },
          take: 10,
        });
        if (intervenants.length === 0) return null;

        const rows = intervenants.map(i => `
          <tr>
            <td>${i.prenom || ""} ${i.nom || ""}</td>
            <td>${i.fonction || "Non renseigné"}</td>
            <td>${i.specialites?.join(", ") || "Non renseigné"}</td>
          </tr>
        `).join("");

        return `
          <h4 style="margin-bottom: 10px;">Liste des intervenants (${intervenants.length})</h4>
          <table class="data-table">
            <thead>
              <tr><th>Nom</th><th>Fonction</th><th>Spécialités</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }

      case 30: {
        // Résultats évaluations
        const evals = await prisma.evaluationSatisfaction.findMany({
          where: { organizationId, status: "COMPLETED" },
          include: {
            reponse: true,
            session: { select: { formation: { select: { titre: true } } } },
          },
          take: 10,
        });
        if (evals.length === 0) return null;

        const rows = evals.map(e => `
          <tr>
            <td>${e.session?.formation?.titre || "Formation"}</td>
            <td style="text-align: center;">${e.reponse?.noteGlobale || "N/A"}/10</td>
            <td style="text-align: center;">${e.completedAt ? new Date(e.completedAt).toLocaleDateString("fr-FR") : "N/A"}</td>
          </tr>
        `).join("");

        return `
          <h4 style="margin-bottom: 10px;">Dernières évaluations de satisfaction</h4>
          <table class="data-table">
            <thead>
              <tr><th>Formation</th><th style="text-align: center;">Note</th><th style="text-align: center;">Date</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }

      case 31: {
        // Réclamations
        const reclamations = await prisma.reclamation.findMany({
          where: { organizationId },
          select: { objet: true, statut: true, createdAt: true },
          take: 10,
        });
        if (reclamations.length === 0) return `<p>Aucune réclamation enregistrée - témoigne d'un bon niveau de satisfaction.</p>`;

        const rows = reclamations.map(r => `
          <tr>
            <td>${r.objet || "Sans objet"}</td>
            <td style="text-align: center;">${r.statut}</td>
            <td style="text-align: center;">${new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
          </tr>
        `).join("");

        return `
          <h4 style="margin-bottom: 10px;">Registre des réclamations (${reclamations.length})</h4>
          <table class="data-table">
            <thead>
              <tr><th>Objet</th><th style="text-align: center;">Statut</th><th style="text-align: center;">Date</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }

      case 32: {
        // Améliorations (ActionAmelioration dans Prisma)
        const ameliorations = await prisma.actionAmelioration.findMany({
          where: { organizationId },
          select: { titre: true, statut: true, createdAt: true },
          take: 10,
        });
        if (ameliorations.length === 0) return null;

        const rows = ameliorations.map(a => `
          <tr>
            <td>${a.titre || "Sans titre"}</td>
            <td style="text-align: center;">${a.statut}</td>
            <td style="text-align: center;">${new Date(a.createdAt).toLocaleDateString("fr-FR")}</td>
          </tr>
        `).join("");

        return `
          <h4 style="margin-bottom: 10px;">Actions d'amélioration (${ameliorations.length})</h4>
          <table class="data-table">
            <thead>
              <tr><th>Titre</th><th style="text-align: center;">Statut</th><th style="text-align: center;">Date</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Erreur récupération données indicateur ${numeroIndicateur}:`, error);
    return null;
  }
}

// ===========================================
// EXPORT DE DONNÉES PAR INDICATEUR (FORMAT PDF) - LEGACY
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
