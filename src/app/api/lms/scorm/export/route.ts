import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import JSZip from "jszip";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// Types pour la génération SCORM
interface ModuleContent {
  id: string;
  titre: string;
  ordre: number;
  duree?: number;
  contenu?: any;
}

interface FormationExport {
  id: string;
  titre: string;
  description: string | null;
  modules: ModuleContent[];
  fichePedagogique?: any;
  evaluationsData?: any;
}

// POST - Générer et exporter un package SCORM à partir d'une formation
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Créer le client Supabase pour les opérations storage
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

    const body = await request.json();
    const { formationId, version = "SCORM_1_2", options = {} } = body;

    if (!formationId) {
      return NextResponse.json(
        { error: "formationId est requis" },
        { status: 400 }
      );
    }

    // Récupérer la formation avec ses modules
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          orderBy: { ordre: "asc" },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Préparer les données de la formation
    const formationData: FormationExport = {
      id: formation.id,
      titre: formation.titre,
      description: formation.description,
      modules: formation.modules.map(m => ({
        id: m.id,
        titre: m.titre,
        ordre: m.ordre,
        duree: m.duree || undefined,
        contenu: m.contenu,
      })),
      fichePedagogique: formation.fichePedagogique,
      evaluationsData: formation.evaluationsData,
    };

    // Générer le package SCORM
    const scormPackage = await generateScormPackage(
      formationData,
      version as "SCORM_1_2" | "SCORM_2004",
      options
    );

    // Générer un nom de fichier unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `scorm_${formation.titre.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.zip`;

    // Stocker le package dans Supabase Storage
    const storagePath = `scorm-exports/${user.organizationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("lms-content")
      .upload(storagePath, scormPackage, {
        contentType: "application/zip",
        upsert: true,
      });

    if (uploadError) {
      console.error("Erreur upload package SCORM:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors du stockage du package" },
        { status: 500 }
      );
    }

    // Générer une URL signée pour le téléchargement (1 heure)
    const { data: signedUrl } = await supabase.storage
      .from("lms-content")
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      success: true,
      fileName,
      storagePath,
      downloadUrl: signedUrl?.signedUrl,
      formation: {
        id: formation.id,
        titre: formation.titre,
        modulesCount: formation.modules.length,
      },
      version,
    });
  } catch (error) {
    console.error("Erreur export SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export du package SCORM" },
      { status: 500 }
    );
  }
}

// Générer le package SCORM complet
async function generateScormPackage(
  formation: FormationExport,
  version: "SCORM_1_2" | "SCORM_2004",
  options: { masteryScore?: number; includeEvaluations?: boolean }
): Promise<Buffer> {
  const zip = new JSZip();
  const masteryScore = options.masteryScore || 80;
  const includeEvaluations = options.includeEvaluations !== false;

  // 1. Générer le manifest SCORM
  const manifest = generateManifest(formation, version, masteryScore);
  zip.file("imsmanifest.xml", manifest);

  // 2. Générer les fichiers de contenu HTML
  const indexHtml = generateIndexHtml(formation, version);
  zip.file("index.html", indexHtml);

  // 3. Générer le contenu des modules
  formation.modules.forEach((module, index) => {
    const moduleHtml = generateModuleHtml(module, index, formation.modules.length, version);
    zip.file(`module_${index + 1}.html`, moduleHtml);
  });

  // 4. Ajouter les évaluations si présentes et demandées
  if (includeEvaluations && formation.evaluationsData) {
    const quizHtml = generateQuizHtml(formation.evaluationsData, version);
    zip.file("quiz.html", quizHtml);
  }

  // 5. Ajouter les fichiers JavaScript SCORM API wrapper
  const scormApiJs = generateScormApiWrapper(version);
  zip.file("scorm_api.js", scormApiJs);

  // 6. Ajouter les styles CSS
  const stylesCSS = generateStylesCSS();
  zip.file("styles.css", stylesCSS);

  // 7. Générer le buffer ZIP
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// Générer le manifest SCORM (imsmanifest.xml)
function generateManifest(
  formation: FormationExport,
  version: "SCORM_1_2" | "SCORM_2004",
  masteryScore: number
): string {
  const identifier = `SCORM_${formation.id}`;
  const now = new Date().toISOString();

  if (version === "SCORM_2004") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="ORG-${formation.id}">
    <organization identifier="ORG-${formation.id}">
      <title>${escapeXml(formation.titre)}</title>
${formation.modules.map((m, i) => `      <item identifier="ITEM-${i + 1}" identifierref="RES-${i + 1}">
        <title>${escapeXml(m.titre)}</title>
        <imsss:sequencing>
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true"/>
        </imsss:sequencing>
      </item>`).join("\n")}
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-0" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm_api.js"/>
      <file href="styles.css"/>
    </resource>
${formation.modules.map((m, i) => `    <resource identifier="RES-${i + 1}" type="webcontent" adlcp:scormType="sco" href="module_${i + 1}.html">
      <file href="module_${i + 1}.html"/>
    </resource>`).join("\n")}
  </resources>
</manifest>`;
  } else {
    // SCORM 1.2
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-${formation.id}">
    <organization identifier="ORG-${formation.id}">
      <title>${escapeXml(formation.titre)}</title>
      <item identifier="ITEM-main" identifierref="RES-main">
        <title>${escapeXml(formation.titre)}</title>
        <adlcp:masteryscore>${masteryScore}</adlcp:masteryscore>
${formation.modules.map((m, i) => `        <item identifier="ITEM-${i + 1}" identifierref="RES-${i + 1}">
          <title>${escapeXml(m.titre)}</title>
        </item>`).join("\n")}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-main" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm_api.js"/>
      <file href="styles.css"/>
    </resource>
${formation.modules.map((m, i) => `    <resource identifier="RES-${i + 1}" type="webcontent" adlcp:scormtype="sco" href="module_${i + 1}.html">
      <file href="module_${i + 1}.html"/>
    </resource>`).join("\n")}
  </resources>
</manifest>`;
  }
}

// Générer la page d'index HTML
function generateIndexHtml(formation: FormationExport, version: "SCORM_1_2" | "SCORM_2004"): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(formation.titre)}</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm_api.js"></script>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${escapeHtml(formation.titre)}</h1>
      ${formation.description ? `<p class="description">${escapeHtml(formation.description)}</p>` : ""}
    </header>

    <main class="content">
      <h2>Modules de la formation</h2>
      <div class="modules-list">
        ${formation.modules.map((m, i) => `
        <a href="module_${i + 1}.html" class="module-card">
          <span class="module-number">${i + 1}</span>
          <div class="module-info">
            <h3>${escapeHtml(m.titre)}</h3>
            ${m.duree ? `<span class="module-duration">${m.duree} min</span>` : ""}
          </div>
          <span class="module-arrow">→</span>
        </a>
        `).join("")}
      </div>
    </main>

    <footer class="footer">
      <div class="progress-info">
        <span id="progress-status">Non commencé</span>
        <span id="progress-time">Temps: 00:00:00</span>
      </div>
    </footer>
  </div>

  <script>
    // Initialisation SCORM
    document.addEventListener('DOMContentLoaded', function() {
      ScormAPI.initialize();
      ScormAPI.setLessonStatus('incomplete');
      updateProgress();
    });

    window.addEventListener('beforeunload', function() {
      ScormAPI.terminate();
    });

    function updateProgress() {
      var status = ScormAPI.getLessonStatus();
      var statusEl = document.getElementById('progress-status');
      if (statusEl) {
        var statusMap = {
          'not attempted': 'Non commencé',
          'incomplete': 'En cours',
          'completed': 'Terminé',
          'passed': 'Réussi',
          'failed': 'Échoué'
        };
        statusEl.textContent = statusMap[status] || status;
      }
    }
  </script>
</body>
</html>`;
}

// Générer le HTML d'un module
function generateModuleHtml(
  module: ModuleContent,
  index: number,
  totalModules: number,
  version: "SCORM_1_2" | "SCORM_2004"
): string {
  const prevModule = index > 0 ? `module_${index}.html` : null;
  const nextModule = index < totalModules - 1 ? `module_${index + 2}.html` : null;
  const isLast = index === totalModules - 1;

  // Extraire le contenu du module si disponible
  let moduleContent = "";
  if (module.contenu) {
    if (typeof module.contenu === "string") {
      moduleContent = module.contenu;
    } else if (module.contenu.content) {
      // TipTap JSON format - conversion basique
      moduleContent = extractTextFromTipTap(module.contenu);
    }
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(module.titre)}</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm_api.js"></script>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="breadcrumb">
        <a href="index.html">Accueil</a> / Module ${index + 1}
      </div>
      <h1>${escapeHtml(module.titre)}</h1>
      ${module.duree ? `<span class="duration-badge">${module.duree} minutes</span>` : ""}
    </header>

    <main class="content module-content">
      ${moduleContent || `
      <div class="placeholder-content">
        <p>Contenu du module "${escapeHtml(module.titre)}"</p>
        <p>Ce module fait partie de votre formation. Parcourez le contenu puis naviguez vers le module suivant.</p>
      </div>
      `}
    </main>

    <nav class="navigation">
      ${prevModule ? `<a href="${prevModule}" class="nav-btn prev">← Module précédent</a>` : '<span class="nav-btn disabled">← Module précédent</span>'}
      ${nextModule ? `<a href="${nextModule}" class="nav-btn next" onclick="markProgress()">Module suivant →</a>` :
        isLast ? `<button onclick="completeFormation()" class="nav-btn complete">Terminer la formation ✓</button>` : ''}
    </nav>

    <footer class="footer">
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: ${Math.round(((index + 1) / totalModules) * 100)}%"></div>
      </div>
      <span class="progress-text">Module ${index + 1} sur ${totalModules}</span>
    </footer>
  </div>

  <script>
    var moduleIndex = ${index};
    var totalModules = ${totalModules};
    var moduleId = '${module.id}';

    document.addEventListener('DOMContentLoaded', function() {
      ScormAPI.initialize();
      ScormAPI.setLessonLocation(moduleId);
      ScormAPI.setLessonStatus('incomplete');

      // Sauvegarder la progression
      var progress = ((moduleIndex + 1) / totalModules) * 100;
      ScormAPI.setProgress(progress);
    });

    function markProgress() {
      ScormAPI.commit();
    }

    function completeFormation() {
      ScormAPI.setLessonStatus('completed');
      ScormAPI.setProgress(100);
      ScormAPI.commit();
      alert('Félicitations ! Vous avez terminé la formation.');
      window.location.href = 'index.html';
    }

    window.addEventListener('beforeunload', function() {
      ScormAPI.terminate();
    });
  </script>
</body>
</html>`;
}

// Générer le HTML du quiz
function generateQuizHtml(evaluationsData: any, version: "SCORM_1_2" | "SCORM_2004"): string {
  // Extraire les questions du format evaluationsData
  let questions: any[] = [];

  if (evaluationsData.qcm && Array.isArray(evaluationsData.qcm)) {
    questions = evaluationsData.qcm;
  } else if (Array.isArray(evaluationsData)) {
    questions = evaluationsData;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Évaluation</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm_api.js"></script>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>Évaluation finale</h1>
      <p>Répondez aux questions suivantes pour valider votre formation.</p>
    </header>

    <main class="content quiz-content">
      <form id="quiz-form">
        ${questions.map((q, i) => `
        <div class="question" data-question="${i}">
          <h3>Question ${i + 1}</h3>
          <p class="question-text">${escapeHtml(q.question || q.text || '')}</p>
          <div class="answers">
            ${(q.options || q.answers || []).map((opt: any, j: number) => `
            <label class="answer-option">
              <input type="radio" name="q${i}" value="${j}">
              <span>${escapeHtml(typeof opt === 'string' ? opt : opt.text || opt.label || '')}</span>
            </label>
            `).join("")}
          </div>
        </div>
        `).join("")}

        <button type="submit" class="submit-btn">Valider mes réponses</button>
      </form>

      <div id="results" class="results hidden">
        <h2>Résultats</h2>
        <div class="score-display">
          <span class="score-number" id="score-value">0</span>
          <span class="score-label">/ ${questions.length}</span>
        </div>
        <p id="result-message"></p>
        <a href="index.html" class="nav-btn">Retour à l'accueil</a>
      </div>
    </main>
  </div>

  <script>
    var correctAnswers = ${JSON.stringify(questions.map(q => q.correctAnswer || q.correct || 0))};
    var masteryScore = 80;

    document.addEventListener('DOMContentLoaded', function() {
      ScormAPI.initialize();
    });

    document.getElementById('quiz-form').addEventListener('submit', function(e) {
      e.preventDefault();

      var score = 0;
      var total = correctAnswers.length;

      correctAnswers.forEach(function(correct, i) {
        var selected = document.querySelector('input[name="q' + i + '"]:checked');
        if (selected && parseInt(selected.value) === correct) {
          score++;
        }
      });

      var percentage = Math.round((score / total) * 100);
      var passed = percentage >= masteryScore;

      // Enregistrer le score SCORM
      ScormAPI.setScore(percentage, 0, 100);
      ScormAPI.setLessonStatus(passed ? 'passed' : 'failed');
      ScormAPI.commit();

      // Afficher les résultats
      document.getElementById('quiz-form').classList.add('hidden');
      document.getElementById('results').classList.remove('hidden');
      document.getElementById('score-value').textContent = score;
      document.getElementById('result-message').textContent = passed
        ? 'Félicitations ! Vous avez réussi l\\'évaluation.'
        : 'Vous n\\'avez pas atteint le score minimum requis (' + masteryScore + '%).';
    });

    window.addEventListener('beforeunload', function() {
      ScormAPI.terminate();
    });
  </script>
</body>
</html>`;
}

// Générer le wrapper JavaScript SCORM API
function generateScormApiWrapper(version: "SCORM_1_2" | "SCORM_2004"): string {
  if (version === "SCORM_2004") {
    return `// SCORM 2004 API Wrapper
var ScormAPI = (function() {
  var api = null;
  var initialized = false;

  function findAPI(win) {
    var attempts = 0;
    while ((!win.API_1484_11) && (win.parent) && (win.parent != win) && (attempts < 500)) {
      attempts++;
      win = win.parent;
    }
    return win.API_1484_11 || null;
  }

  function getAPI() {
    if (api) return api;
    api = findAPI(window);
    if (!api && window.opener) {
      api = findAPI(window.opener);
    }
    return api;
  }

  return {
    initialize: function() {
      var scormApi = getAPI();
      if (scormApi) {
        var result = scormApi.Initialize("");
        initialized = (result === "true" || result === true);
      }
      return initialized;
    },

    terminate: function() {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        scormApi.Terminate("");
        initialized = false;
      }
    },

    getValue: function(element) {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        return scormApi.GetValue(element);
      }
      return "";
    },

    setValue: function(element, value) {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        return scormApi.SetValue(element, value);
      }
      return "false";
    },

    commit: function() {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        return scormApi.Commit("");
      }
      return "false";
    },

    setLessonStatus: function(status) {
      this.setValue("cmi.completion_status", status);
    },

    getLessonStatus: function() {
      return this.getValue("cmi.completion_status");
    },

    setLessonLocation: function(location) {
      this.setValue("cmi.location", location);
    },

    setScore: function(raw, min, max) {
      this.setValue("cmi.score.raw", raw);
      this.setValue("cmi.score.min", min);
      this.setValue("cmi.score.max", max);
      this.setValue("cmi.score.scaled", (raw - min) / (max - min));
    },

    setProgress: function(progress) {
      this.setValue("cmi.progress_measure", progress / 100);
    }
  };
})();`;
  } else {
    // SCORM 1.2
    return `// SCORM 1.2 API Wrapper
var ScormAPI = (function() {
  var api = null;
  var initialized = false;

  function findAPI(win) {
    var attempts = 0;
    while ((!win.API) && (win.parent) && (win.parent != win) && (attempts < 500)) {
      attempts++;
      win = win.parent;
    }
    return win.API || null;
  }

  function getAPI() {
    if (api) return api;
    api = findAPI(window);
    if (!api && window.opener) {
      api = findAPI(window.opener);
    }
    return api;
  }

  return {
    initialize: function() {
      var scormApi = getAPI();
      if (scormApi) {
        var result = scormApi.LMSInitialize("");
        initialized = (result === "true" || result === true);
      }
      return initialized;
    },

    terminate: function() {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        scormApi.LMSFinish("");
        initialized = false;
      }
    },

    getValue: function(element) {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        return scormApi.LMSGetValue(element);
      }
      return "";
    },

    setValue: function(element, value) {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        return scormApi.LMSSetValue(element, value);
      }
      return "false";
    },

    commit: function() {
      var scormApi = getAPI();
      if (scormApi && initialized) {
        return scormApi.LMSCommit("");
      }
      return "false";
    },

    setLessonStatus: function(status) {
      this.setValue("cmi.core.lesson_status", status);
    },

    getLessonStatus: function() {
      return this.getValue("cmi.core.lesson_status");
    },

    setLessonLocation: function(location) {
      this.setValue("cmi.core.lesson_location", location);
    },

    setScore: function(raw, min, max) {
      this.setValue("cmi.core.score.raw", raw);
      this.setValue("cmi.core.score.min", min);
      this.setValue("cmi.core.score.max", max);
    },

    setProgress: function(progress) {
      // SCORM 1.2 doesn't have progress_measure, store in suspend_data
      var data = this.getValue("cmi.suspend_data") || "{}";
      try {
        var parsed = JSON.parse(data);
        parsed.progress = progress;
        this.setValue("cmi.suspend_data", JSON.stringify(parsed));
      } catch(e) {
        this.setValue("cmi.suspend_data", JSON.stringify({progress: progress}));
      }
    }
  };
})();`;
  }
}

// Générer les styles CSS
function generateStylesCSS(): string {
  return `/* SCORM Package Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  min-height: 100vh;
  box-shadow: 0 0 40px rgba(0,0,0,0.1);
}

.header {
  text-align: center;
  padding: 2rem 0;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
  font-size: 1.1rem;
}

.breadcrumb {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.breadcrumb a {
  color: #667eea;
  text-decoration: none;
}

.content {
  padding: 1rem 0;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.module-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.module-card:hover {
  border-color: #667eea;
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.module-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 1rem;
}

.module-info {
  flex: 1;
}

.module-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.module-duration {
  font-size: 0.85rem;
  color: #888;
}

.module-arrow {
  font-size: 1.5rem;
  color: #667eea;
}

.duration-badge {
  display: inline-block;
  background: #e8f4fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.module-content {
  min-height: 300px;
  padding: 2rem;
  background: #fafbfc;
  border-radius: 12px;
  margin: 1rem 0;
}

.placeholder-content {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.navigation {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem 0;
  border-top: 2px solid #f0f0f0;
  margin-top: 2rem;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.nav-btn.prev {
  background: #f0f0f0;
  color: #333;
}

.nav-btn.next,
.nav-btn.complete {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.nav-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.nav-btn.disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

.footer {
  text-align: center;
  padding: 1.5rem 0;
  border-top: 2px solid #f0f0f0;
  margin-top: 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: #666;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9rem;
}

/* Quiz Styles */
.quiz-content {
  padding: 2rem;
}

.question {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.question h3 {
  color: #667eea;
  margin-bottom: 0.5rem;
}

.question-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.answers {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.answer-option:hover {
  border-color: #667eea;
}

.answer-option input {
  margin-right: 1rem;
  transform: scale(1.2);
}

.submit-btn {
  display: block;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2rem;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.results {
  text-align: center;
  padding: 3rem;
}

.score-display {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin: 1.5rem 0;
}

.hidden {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .navigation {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-btn {
    width: 100%;
    text-align: center;
  }
}`;
}

// Helper: Échapper les caractères XML
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Helper: Échapper les caractères HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Helper: Extraire le texte depuis un JSON TipTap
function extractTextFromTipTap(content: any): string {
  if (!content || !content.content) return "";

  let html = "";

  function processNode(node: any): string {
    if (!node) return "";

    if (node.type === "text") {
      let text = escapeHtml(node.text || "");
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === "bold") text = `<strong>${text}</strong>`;
          if (mark.type === "italic") text = `<em>${text}</em>`;
          if (mark.type === "underline") text = `<u>${text}</u>`;
        });
      }
      return text;
    }

    if (node.type === "paragraph") {
      const inner = (node.content || []).map(processNode).join("");
      return `<p>${inner}</p>`;
    }

    if (node.type === "heading") {
      const level = node.attrs?.level || 2;
      const inner = (node.content || []).map(processNode).join("");
      return `<h${level}>${inner}</h${level}>`;
    }

    if (node.type === "bulletList" || node.type === "orderedList") {
      const tag = node.type === "bulletList" ? "ul" : "ol";
      const inner = (node.content || []).map(processNode).join("");
      return `<${tag}>${inner}</${tag}>`;
    }

    if (node.type === "listItem") {
      const inner = (node.content || []).map(processNode).join("");
      return `<li>${inner}</li>`;
    }

    if (node.content) {
      return (node.content || []).map(processNode).join("");
    }

    return "";
  }

  if (Array.isArray(content.content)) {
    html = content.content.map(processNode).join("");
  }

  return html || "";
}
