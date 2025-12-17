// ===========================================
// MOTEUR DE RENDU DES TEMPLATES
// ===========================================
// Remplace les variables {{variable}} par leurs valeurs reelles

import {
  TemplateContext,
  FormationData,
  ModuleData,
  OrganisationData,
  EntrepriseData,
  ParticipantData,
  FormateurData,
  DatesData,
  DocumentData,
  RenderOptions,
} from "./types";

// ===========================================
// FONCTION PRINCIPALE DE RENDU
// ===========================================

/**
 * Rendre un template en remplacant les variables par leurs valeurs
 * @param content - Contenu du template (HTML ou JSON TipTap)
 * @param context - Contexte de donnees
 * @param options - Options de rendu
 * @returns Contenu avec variables remplacees
 */
export function renderTemplate(
  content: string,
  context: TemplateContext,
  options: RenderOptions = {}
): string {
  const { previewMode = false } = options;

  // Si le contenu est du JSON TipTap, le convertir en HTML d'abord
  let htmlContent = content;
  if (content.startsWith("{")) {
    try {
      const json = JSON.parse(content);
      htmlContent = tiptapJsonToHtml(json);
    } catch {
      htmlContent = content;
    }
  }

  // Remplacer les variables simples
  htmlContent = replaceSimpleVariables(htmlContent, context, previewMode);

  // Remplacer les boucles {{#each}}
  htmlContent = replaceLoops(htmlContent, context, previewMode);

  // Remplacer les conditions {{#if}}
  htmlContent = replaceConditions(htmlContent, context, previewMode);

  return htmlContent;
}

// ===========================================
// REMPLACEMENT DES VARIABLES SIMPLES
// ===========================================

/**
 * Remplacer les variables simples {{variable.path}}
 */
function replaceSimpleVariables(
  content: string,
  context: TemplateContext,
  previewMode: boolean
): string {
  // Pattern pour capturer {{variable.path}}
  const variablePattern = /\{\{([^#/][^}]*)\}\}/g;

  return content.replace(variablePattern, (match, variablePath) => {
    const trimmedPath = variablePath.trim();
    const value = getValueFromPath(context, trimmedPath);

    if (value !== undefined && value !== null) {
      // Si c'est un tableau, le formater en liste à puces HTML
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return "";
        }
        // Vérifier si c'est un tableau d'objets (modules, participants)
        if (typeof value[0] === "object" && value[0] !== null) {
          return formatArrayOfObjects(value, trimmedPath);
        }
        // Tableau de strings - faire une liste à puces
        return `<ul class="template-list">${value.map(item => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
      }
      return String(value);
    }

    // En mode preview, afficher la variable telle quelle
    if (previewMode) {
      return `<span class="template-variable-unresolved">${match}</span>`;
    }

    // Variable non trouvee - retourner vide ou la variable
    return "";
  });
}

// ===========================================
// REMPLACEMENT DES BOUCLES
// ===========================================

/**
 * Remplacer les boucles {{#each items}}...{{/each}}
 */
function replaceLoops(
  content: string,
  context: TemplateContext,
  previewMode: boolean
): string {
  // Pattern pour capturer {{#each variable}}...{{/each}}
  const loopPattern = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return content.replace(loopPattern, (match, arrayName, innerContent) => {
    const array = getValueFromPath(context, arrayName);

    if (!Array.isArray(array) || array.length === 0) {
      if (previewMode) {
        return `<span class="template-loop-empty">[Liste ${arrayName} vide]</span>`;
      }
      return "";
    }

    // Generer le contenu pour chaque element
    return array
      .map((item, index) => {
        let itemContent = innerContent;

        // Remplacer {{this}} par l'element courant (si c'est une valeur simple)
        if (typeof item === "string" || typeof item === "number") {
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        }

        // Remplacer {{@index}} par l'index
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
        itemContent = itemContent.replace(/\{\{@number\}\}/g, String(index + 1));

        // Remplacer les proprietes de l'element (ex: {{module.titre}})
        if (typeof item === "object" && item !== null) {
          const singularName = getSingularName(arrayName);
          const itemPattern = new RegExp(`\\{\\{${singularName}\\.([^}]+)\\}\\}`, "g");

          itemContent = itemContent.replace(itemPattern, (m: string, prop: string) => {
            const value = (item as Record<string, unknown>)[prop];
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                return value.join(", ");
              }
              return String(value);
            }
            return previewMode ? m : "";
          });

          // Aussi supporter {{titre}} directement (sans prefixe)
          const directPattern = /\{\{([a-z_]+)\}\}/g;
          itemContent = itemContent.replace(directPattern, (m: string, prop: string) => {
            const value = (item as Record<string, unknown>)[prop];
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                return value.join(", ");
              }
              return String(value);
            }
            // Ne pas remplacer si c'est une variable globale
            return m;
          });
        }

        return itemContent;
      })
      .join("");
  });
}

// ===========================================
// REMPLACEMENT DES CONDITIONS
// ===========================================

/**
 * Remplacer les conditions {{#if condition}}...{{/if}}
 */
function replaceConditions(
  content: string,
  context: TemplateContext,
  previewMode: boolean
): string {
  // Pattern pour {{#if condition}}...{{else}}...{{/if}}
  const conditionPattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

  return content.replace(conditionPattern, (match, condition, ifContent, elseContent = "") => {
    const trimmedCondition = condition.trim();
    const value = getValueFromPath(context, trimmedCondition);

    // Evaluer la condition
    const isTruthy = evaluateCondition(value);

    if (isTruthy) {
      // Rendre le contenu du if
      return replaceSimpleVariables(ifContent, context, previewMode);
    } else if (elseContent) {
      // Rendre le contenu du else
      return replaceSimpleVariables(elseContent, context, previewMode);
    }

    return "";
  });
}

// ===========================================
// HELPERS
// ===========================================

/**
 * Obtenir une valeur depuis un chemin (ex: "formation.titre")
 */
function getValueFromPath(context: TemplateContext, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Evaluer si une valeur est "truthy" pour les conditions
 */
function evaluateCondition(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.length > 0;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return Boolean(value);
}

/**
 * Obtenir le nom singulier d'un nom de collection
 */
function getSingularName(pluralName: string): string {
  const singulars: Record<string, string> = {
    modules: "module",
    participants: "participant",
    objectifs: "objectif",
    prerequis: "prerequis",
    contenus: "contenu",
  };

  return singulars[pluralName] || pluralName.replace(/s$/, "");
}

/**
 * Convertir du JSON TipTap en HTML basique
 * Note: Pour une conversion complete, utiliser l'export de TipTap
 */
function tiptapJsonToHtml(json: unknown): string {
  if (!json || typeof json !== "object") {
    return "";
  }

  const node = json as Record<string, unknown>;
  const type = node.type as string;
  const content = node.content as Array<Record<string, unknown>> | undefined;
  const text = node.text as string | undefined;
  const attrs = node.attrs as Record<string, unknown> | undefined;
  const marks = node.marks as Array<Record<string, unknown>> | undefined;

  // Texte simple
  if (type === "text" && text) {
    let result = escapeHtml(text);

    // Appliquer les marks (gras, italique, etc.)
    if (marks) {
      for (const mark of marks) {
        const markType = mark.type as string;
        switch (markType) {
          case "bold":
            result = `<strong>${result}</strong>`;
            break;
          case "italic":
            result = `<em>${result}</em>`;
            break;
          case "underline":
            result = `<u>${result}</u>`;
            break;
          case "strike":
            result = `<s>${result}</s>`;
            break;
          case "link":
            const href = (mark.attrs as Record<string, unknown>)?.href || "#";
            result = `<a href="${href}">${result}</a>`;
            break;
          case "textStyle":
            const color = (mark.attrs as Record<string, unknown>)?.color;
            if (color) {
              result = `<span style="color: ${color}">${result}</span>`;
            }
            break;
          case "highlight":
            const bgColor = (mark.attrs as Record<string, unknown>)?.color || "yellow";
            result = `<mark style="background-color: ${bgColor}">${result}</mark>`;
            break;
        }
      }
    }

    return result;
  }

  // Variable de template
  if (type === "templateVariable") {
    const variableId = (attrs?.id || attrs?.variableId) as string;
    return `{{${variableId}}}`;
  }

  // Contenu enfant
  const childrenHtml = content
    ? content.map((child) => tiptapJsonToHtml(child)).join("")
    : "";

  // Types de noeuds
  switch (type) {
    case "doc":
      return childrenHtml;
    case "paragraph":
      const align = attrs?.textAlign as string;
      const style = align ? ` style="text-align: ${align}"` : "";
      return `<p${style}>${childrenHtml}</p>`;
    case "heading":
      const level = attrs?.level || 1;
      return `<h${level}>${childrenHtml}</h${level}>`;
    case "bulletList":
      return `<ul>${childrenHtml}</ul>`;
    case "orderedList":
      return `<ol>${childrenHtml}</ol>`;
    case "listItem":
      return `<li>${childrenHtml}</li>`;
    case "blockquote":
      return `<blockquote>${childrenHtml}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${childrenHtml}</code></pre>`;
    case "horizontalRule":
      return "<hr />";
    case "hardBreak":
      return "<br />";
    case "table":
      return `<table>${childrenHtml}</table>`;
    case "tableRow":
      return `<tr>${childrenHtml}</tr>`;
    case "tableCell":
      return `<td>${childrenHtml}</td>`;
    case "tableHeader":
      return `<th>${childrenHtml}</th>`;
    case "image":
      const imgSrc = attrs?.src as string;
      const imgAlt = attrs?.alt as string || "";
      const imgWidth = attrs?.width as number | undefined;
      const imgHeight = attrs?.height as number | undefined;
      const imgStyle = imgWidth ? ` style="width: ${imgWidth}px; height: auto; max-width: 100%;"` : "";
      return `<img src="${imgSrc}" alt="${imgAlt}"${imgStyle} />`;
    case "resizableImage":
      const rImgSrc = attrs?.src as string;
      const rImgAlt = attrs?.alt as string || "";
      const rImgWidth = attrs?.width as number | undefined;
      const rImgAlign = attrs?.align as string || "center";
      const alignClass = rImgAlign === "left" ? "margin-right: auto;" : rImgAlign === "right" ? "margin-left: auto;" : "margin-left: auto; margin-right: auto;";
      const rImgStyle = rImgWidth
        ? ` style="width: ${rImgWidth}px; height: auto; max-width: 100%; display: block; ${alignClass}"`
        : ` style="max-width: 100%; height: auto; display: block; ${alignClass}"`;
      return `<img src="${rImgSrc}" alt="${rImgAlt}"${rImgStyle} />`;
    default:
      return childrenHtml;
  }
}

/**
 * Echapper les caracteres HTML
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Formater un tableau d'objets en HTML
 */
function formatArrayOfObjects(array: Record<string, unknown>[], variablePath: string): string {
  // Cas spéciaux pour certains types de données
  if (variablePath === "modules") {
    return array.map((module, index) => {
      const numero = module.numero || index + 1;
      const titre = module.titre || "";
      const duree = module.duree || "";
      const objectifs = module.objectifs as string[] || [];
      const contenu = module.contenu as string[] || [];

      let html = `<div class="module-section" style="margin-bottom: 1.5rem;">`;
      html += `<h4 style="margin-bottom: 0.5rem;"><strong>Module ${numero} :</strong> ${escapeHtml(String(titre))}</h4>`;
      if (duree) {
        html += `<p><em>Durée : ${escapeHtml(String(duree))}</em></p>`;
      }
      if (objectifs.length > 0) {
        html += `<p><strong>Objectifs :</strong></p>`;
        html += `<ul>${objectifs.map(obj => `<li>${escapeHtml(String(obj))}</li>`).join("")}</ul>`;
      }
      if (contenu.length > 0) {
        html += `<p><strong>Contenu :</strong></p>`;
        html += `<ul>${contenu.map(c => `<li>${escapeHtml(String(c))}</li>`).join("")}</ul>`;
      }
      html += `</div>`;
      return html;
    }).join("");
  }

  if (variablePath === "participants") {
    return array.map((participant, index) => {
      const nom = participant.nom || "";
      const prenom = participant.prenom || "";
      const email = participant.email || "";
      const fonction = participant.fonction || "";
      return `<p>${index + 1}. ${escapeHtml(String(prenom))} ${escapeHtml(String(nom))}${fonction ? ` - ${escapeHtml(String(fonction))}` : ""}${email ? ` (${escapeHtml(String(email))})` : ""}</p>`;
    }).join("");
  }

  // Par défaut, lister les objets
  return array.map((obj, index) => {
    const mainValue = obj.titre || obj.nom || obj.name || obj.label || Object.values(obj)[0];
    return `<li>${escapeHtml(String(mainValue || `Item ${index + 1}`))}</li>`;
  }).join("");
}

// ===========================================
// GENERATION DE CONTEXTE DE TEST
// ===========================================

/**
 * Generer un contexte de donnees de test pour preview
 */
export function generateTestContext(): TemplateContext {
  const now = new Date();
  const months = [
    "janvier", "fevrier", "mars", "avril", "mai", "juin",
    "juillet", "aout", "septembre", "octobre", "novembre", "decembre"
  ];

  return {
    formation: {
      id: "FORM-001",
      titre: "Management Agile et Leadership",
      description: "Cette formation permet de maitriser les fondamentaux du management agile et de developper ses competences de leader.",
      duree: "14 heures (2 jours)",
      duree_heures: 14,
      prix: 1500,
      prix_format: "1 500,00 EUR HT",
      objectifs: [
        "Comprendre les principes du management agile",
        "Developper ses competences de leader",
        "Mettre en place des rituels d'equipe efficaces",
        "Gerer les conflits et la resistance au changement",
      ],
      prerequis: [
        "Aucun prerequis technique",
        "Experience en management souhaitee",
      ],
      public_cible: "Managers, chefs de projet, responsables d'equipe",
      modalites: "Presentiel",
      lieu: "Paris - Centre de formation",
      date_debut: "15/01/2025",
      date_fin: "16/01/2025",
      reference: "FORM-2025-001",
    },
    modules: [
      {
        id: "MOD-001",
        numero: 1,
        titre: "Introduction au Management Agile",
        duree: "3 heures",
        duree_heures: 3,
        objectifs: [
          "Comprendre l'histoire de l'agilite",
          "Connaitre les 4 valeurs du Manifeste Agile",
        ],
        contenu: [
          "Histoire et evolution de l'agilite",
          "Les 4 valeurs du Manifeste Agile",
          "Les 12 principes",
          "Comparaison avec les methodes traditionnelles",
        ],
      },
      {
        id: "MOD-002",
        numero: 2,
        titre: "Leadership et Communication",
        duree: "4 heures",
        duree_heures: 4,
        objectifs: [
          "Developper son style de leadership",
          "Maitriser la communication non-violente",
        ],
        contenu: [
          "Les differents styles de leadership",
          "Communication non-violente",
          "Feedback constructif",
          "Gestion des emotions",
        ],
      },
      {
        id: "MOD-003",
        numero: 3,
        titre: "Mise en Pratique",
        duree: "7 heures",
        duree_heures: 7,
        objectifs: [
          "Appliquer les concepts sur des cas reels",
          "Construire son plan d'action personnel",
        ],
        contenu: [
          "Etudes de cas",
          "Simulations et jeux de roles",
          "Plan d'action personnel",
          "Cloture et evaluation",
        ],
      },
    ],
    organisation: {
      id: "ORG-001",
      nom: "Automate Formation SAS",
      siret: "123 456 789 00012",
      adresse: "15 rue de la Formation",
      code_postal: "75001",
      ville: "Paris",
      telephone: "01 23 45 67 89",
      email: "contact@automate-formation.fr",
      site_web: "www.automate-formation.fr",
      numero_da: "11 75 12345 67",
      representant: "Jean DUPONT",
      fonction_representant: "Directeur General",
    },
    entreprise: {
      id: "ENT-001",
      nom: "ACME Corporation",
      siret: "987 654 321 00098",
      adresse: "100 avenue des Champs-Elysees",
      code_postal: "75008",
      ville: "Paris",
      telephone: "01 98 76 54 32",
      email: "contact@acme.fr",
      representant: "Marie MARTIN",
      fonction_representant: "Directrice des Ressources Humaines",
    },
    participants: [
      {
        id: "PART-001",
        civilite: "M.",
        nom: "DURAND",
        prenom: "Pierre",
        email: "p.durand@acme.fr",
        fonction: "Chef de projet",
        type: "salarie",
      },
      {
        id: "PART-002",
        civilite: "Mme",
        nom: "LEROY",
        prenom: "Sophie",
        email: "s.leroy@acme.fr",
        fonction: "Responsable d'equipe",
        type: "salarie",
      },
      {
        id: "PART-003",
        civilite: "M.",
        nom: "MOREAU",
        prenom: "Thomas",
        email: "t.moreau@acme.fr",
        fonction: "Manager",
        type: "salarie",
      },
    ],
    formateur: {
      id: "FORM-001",
      civilite: "Mme",
      nom: "BERNARD",
      prenom: "Sophie",
      email: "s.bernard@automate-formation.fr",
      telephone: "06 12 34 56 78",
      specialite: "Management et Leadership",
    },
    dates: {
      jour: String(now.getDate()).padStart(2, "0"),
      mois: months[now.getMonth()],
      annee: String(now.getFullYear()),
      date_complete: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
      date_courte: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
    },
    document: {
      reference: "DOC-2025-001",
      date_creation: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
      version: "1.0",
    },
  };
}

// ===========================================
// EXPORTS
// ===========================================

export type { TemplateContext, RenderOptions };
