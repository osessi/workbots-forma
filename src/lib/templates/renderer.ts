// ===========================================
// MOTEUR DE RENDU DES TEMPLATES
// ===========================================
// Remplace les variables {{variable}} par leurs valeurs reelles

import {
  TemplateContext,
  FormationData,
  JourneeData,
  ModuleData,
  OrganisationData,
  EntrepriseData,
  ParticulierData,
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

      // Si c'est une variable de type logo/image (URL), afficher une balise img
      if (isImageVariable(trimmedPath) && typeof value === "string" && isValidImageUrl(value)) {
        // Ajouter onerror pour cacher l'image si elle ne charge pas
        return `<img src="${escapeHtml(value)}" alt="Logo" style="max-height: 80px; max-width: 200px; height: auto; width: auto;" onerror="this.style.display='none'" />`;
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

/**
 * Verifier si une variable est de type image/logo
 */
function isImageVariable(path: string): boolean {
  const imageVariables = [
    "organisation.logo",
    "entreprise.logo",
    "formateur.photo",
    "participant.photo",
    "signature.responsable_organisme",
  ];
  return imageVariables.includes(path) || path.endsWith(".logo") || path.endsWith(".image") || path.endsWith(".photo") || path.startsWith("signature.");
}

/**
 * Verifier si une URL est une URL d'image valide
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  // Verifier que c'est une URL
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:image/")) {
    return false;
  }
  return true;
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
 * Supporte:
 * - {{#if variable}} - verifie si la variable existe et est truthy
 * - {{#if variable === "valeur"}} - comparaison d'egalite
 * - {{#if variable !== "valeur"}} - comparaison de difference
 * - {{#if client.type === "entreprise"}} - comparaison avec chemin de variable
 */
function replaceConditions(
  content: string,
  context: TemplateContext,
  previewMode: boolean
): string {
  // Pattern pour {{#if condition}}...{{else}}...{{/if}}
  // On gere aussi {{#elseif condition}} pour les conditions multiples
  const conditionPattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

  return content.replace(conditionPattern, (match, condition, ifContent, elseContent = "") => {
    const trimmedCondition = condition.trim();

    // Evaluer la condition (simple ou avec comparaison)
    const isTruthy = evaluateAdvancedCondition(trimmedCondition, context);

    if (isTruthy) {
      // Rendre le contenu du if (recursif pour les conditions imbriquees)
      let result = replaceConditions(ifContent, context, previewMode);
      result = replaceSimpleVariables(result, context, previewMode);
      return result;
    } else if (elseContent) {
      // Rendre le contenu du else (recursif pour les conditions imbriquees)
      let result = replaceConditions(elseContent, context, previewMode);
      result = replaceSimpleVariables(result, context, previewMode);
      return result;
    }

    return "";
  });
}

/**
 * Evaluer une condition avancee avec support des comparaisons
 * Exemples:
 * - "client.type" -> verifie si la variable existe
 * - "client.type === 'entreprise'" -> comparaison egalite
 * - "client.type !== 'particulier'" -> comparaison difference
 * - "formation.prix > 1000" -> comparaison numerique
 */
function evaluateAdvancedCondition(condition: string, context: TemplateContext): boolean {
  // Pattern pour detecter les comparaisons
  // Supporte: ===, !==, ==, !=, >, <, >=, <=
  const comparisonPattern = /^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/;
  const match = condition.match(comparisonPattern);

  if (match) {
    const [, leftPath, operator, rightValue] = match;
    const leftTrimmed = leftPath.trim();
    let rightTrimmed = rightValue.trim();

    // Obtenir la valeur de gauche depuis le contexte
    const leftValue = getValueFromPath(context, leftTrimmed);

    // Determiner la valeur de droite
    let rightParsed: unknown;

    // Verifier si c'est une string entre quotes (simples ou doubles)
    if ((rightTrimmed.startsWith('"') && rightTrimmed.endsWith('"')) ||
        (rightTrimmed.startsWith("'") && rightTrimmed.endsWith("'"))) {
      rightParsed = rightTrimmed.slice(1, -1);
    }
    // Verifier si c'est un nombre
    else if (!isNaN(Number(rightTrimmed))) {
      rightParsed = Number(rightTrimmed);
    }
    // Verifier si c'est un booleen
    else if (rightTrimmed === "true") {
      rightParsed = true;
    } else if (rightTrimmed === "false") {
      rightParsed = false;
    }
    // Sinon c'est peut-etre une autre variable
    else {
      rightParsed = getValueFromPath(context, rightTrimmed);
    }

    // Effectuer la comparaison
    switch (operator) {
      case "===":
      case "==":
        return leftValue === rightParsed;
      case "!==":
      case "!=":
        return leftValue !== rightParsed;
      case ">":
        return Number(leftValue) > Number(rightParsed);
      case "<":
        return Number(leftValue) < Number(rightParsed);
      case ">=":
        return Number(leftValue) >= Number(rightParsed);
      case "<=":
        return Number(leftValue) <= Number(rightParsed);
      default:
        return false;
    }
  }

  // Pas de comparaison, evaluer comme condition simple (verifie existence/truthiness)
  const value = getValueFromPath(context, condition);
  return evaluateCondition(value);
}

// ===========================================
// HELPERS
// ===========================================

/**
 * Obtenir une valeur depuis un chemin (ex: "formation.titre")
 * Supporte les variables speciales calculees dynamiquement
 */
function getValueFromPath(context: TemplateContext, path: string): unknown {
  // Variables speciales calculees dynamiquement
  if (path === "journees.premiere_date") {
    const journees = context.journees;
    if (journees && journees.length > 0) {
      return journees[0].date;
    }
    return context.formation?.date_debut || undefined;
  }

  if (path === "journees.derniere_date") {
    const journees = context.journees;
    if (journees && journees.length > 0) {
      return journees[journees.length - 1].date; // Derniere journee dynamique !
    }
    return context.formation?.date_fin || undefined;
  }

  if (path === "journees.count") {
    const journees = context.journees;
    if (journees) {
      return journees.length;
    }
    return context.formation?.nombre_jours || 0;
  }

  if (path === "participants.count") {
    const participants = context.participants;
    if (participants) {
      return participants.length;
    }
    return 0;
  }

  // Variables calculees pour le particulier
  if (path === "particulier.nom_complet" && context.particulier) {
    const p = context.particulier;
    if (!p.nom_complet && p.prenom && p.nom) {
      return `${p.prenom} ${p.nom}`;
    }
  }

  if (path === "particulier.adresse_complete" && context.particulier) {
    const p = context.particulier;
    if (!p.adresse_complete && p.adresse) {
      return `${p.adresse}, ${p.code_postal || ""} ${p.ville || ""}`.trim();
    }
  }

  // Variables calculees pour le formateur
  if (path === "formateur.nom_complet" && context.formateur) {
    const f = context.formateur;
    return `${f.prenom || ""} ${f.nom || ""}`.trim();
  }

  // Variables calculees pour l'organisation
  if (path === "organisation.adresse_complete" && context.organisation) {
    const o = context.organisation;
    if (!o.adresse_complete && o.adresse) {
      return `${o.adresse}, ${o.code_postal || ""} ${o.ville || ""}`.trim();
    }
  }

  // Variables calculees pour l'entreprise
  if (path === "entreprise.adresse_complete" && context.entreprise) {
    const e = context.entreprise;
    if (!e.adresse_complete && e.adresse) {
      return `${e.adresse}, ${e.code_postal || ""} ${e.ville || ""}`.trim();
    }
  }

  // Variables numerotees pour les journees (journee1.date, journee2.horaires_matin, etc.)
  const journeeMatch = path.match(/^journee(\d+)\.(.+)$/);
  if (journeeMatch) {
    const index = parseInt(journeeMatch[1], 10) - 1; // Index 0-based
    const field = journeeMatch[2];
    const journees = context.journees;
    if (journees && journees[index]) {
      const journee = journees[index];
      switch (field) {
        case "date":
          return journee.date;
        case "date_courte":
          return journee.date_courte;
        case "horaires_matin":
          return journee.horaires_matin;
        case "horaires_apres_midi":
          return journee.horaires_apres_midi;
        case "numero":
          return journee.numero;
        default:
          return undefined;
      }
    }
    return undefined;
  }

  // Variables numerotees pour les salaries (salarie1.nom, salarie2.email, etc.)
  const salarieMatch = path.match(/^salarie(\d+)\.(.+)$/);
  if (salarieMatch) {
    const index = parseInt(salarieMatch[1], 10) - 1; // Index 0-based
    const field = salarieMatch[2];
    const participants = context.participants;
    if (participants && participants[index]) {
      const participant = participants[index];
      switch (field) {
        case "nom":
          return participant.nom;
        case "prenom":
          return participant.prenom;
        case "nom_complet":
          return `${participant.prenom || ""} ${participant.nom || ""}`.trim();
        case "email":
          return participant.email;
        case "telephone":
          return participant.telephone;
        case "adresse":
          return participant.adresse;
        case "code_postal":
          return participant.code_postal;
        case "ville":
          return participant.ville;
        case "adresse_complete":
          if (participant.adresse) {
            return `${participant.adresse}, ${participant.code_postal || ""} ${participant.ville || ""}`.trim();
          }
          return undefined;
        case "date_naissance":
          return participant.date_naissance;
        case "lieu_naissance":
          return participant.lieu_naissance;
        default:
          return undefined;
      }
    }
    return undefined;
  }

  // Chemin standard
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
    journees: "journee",
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
    case "pageBreak":
      return '<div data-type="page-break" class="page-break"></div>';
    case "conditionalBlock":
      const condition = attrs?.condition as string || "";
      // Generer le contenu du bloc conditionnel avec les balises handlebars
      return `{{#if ${condition}}}${childrenHtml}{{/if}}`;
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
      nombre_jours: 2,
      prix: 1500,
      prix_format: "1 500,00 EUR HT",
      prix_ttc: "1 800,00 EUR TTC",
      tva: "300,00",
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
      adresse: "15 rue de la Formation",
      code_postal: "75001",
      ville: "Paris",
      date_debut: "15/01/2025",
      date_fin: "16/01/2025",
      horaires_matin: "09:00 - 12:30",
      horaires_apres_midi: "14:00 - 17:30",
      reference: "FORM-2025-001",
      methodes_pedagogiques: "Apports theoriques, exercices pratiques, mises en situation, etudes de cas",
      moyens_techniques: "Salle equipee, videoprojecteur, supports de cours remis aux participants",
      modalites_evaluation: "QCM d'evaluation des acquis, mise en situation pratique, evaluation continue",
      accessibilite: "Formation accessible aux personnes en situation de handicap. Contactez-nous pour etudier les adaptations possibles.",
      delai_acces: "14 jours ouvrables avant le debut de la formation",
    },
    journees: [
      {
        numero: 1,
        date: "15 janvier 2025",
        date_courte: "15/01/2025",
        horaires_matin: "09:00 - 12:30",
        horaires_apres_midi: "14:00 - 17:30",
      },
      {
        numero: 2,
        date: "16 janvier 2025",
        date_courte: "16/01/2025",
        horaires_matin: "09:00 - 12:30",
        horaires_apres_midi: "14:00 - 17:30",
      },
    ],
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
      adresse_complete: "15 rue de la Formation, 75001 Paris",
      telephone: "01 23 45 67 89",
      email: "contact@automate-formation.fr",
      site_web: "www.automate-formation.fr",
      numero_da: "11 75 12345 67",
      logo: "https://example.com/logo.png",
      representant: "Jean DUPONT",
      fonction_representant: "Directeur General",
      tva_intra: "FR12345678901",
      capital: "10 000 EUR",
      forme_juridique: "SAS",
      rcs: "Paris B 123 456 789",
    },
    entreprise: {
      id: "ENT-001",
      nom: "ACME Corporation",
      siret: "987 654 321 00098",
      adresse: "100 avenue des Champs-Elysees",
      code_postal: "75008",
      ville: "Paris",
      adresse_complete: "100 avenue des Champs-Elysees, 75008 Paris",
      telephone: "01 98 76 54 32",
      email: "contact@acme.fr",
      representant: "Marie MARTIN",
      fonction_representant: "Directrice des Ressources Humaines",
    },
    particulier: {
      civilite: "M.",
      nom: "DURAND",
      prenom: "Pierre",
      nom_complet: "Pierre DURAND",
      adresse: "25 rue de la Paix",
      code_postal: "75002",
      ville: "Paris",
      adresse_complete: "25 rue de la Paix, 75002 Paris",
      email: "pierre.durand@email.com",
      telephone: "06 12 34 56 78",
      date_naissance: "15/03/1985",
      lieu_naissance: "Paris",
      statut: "Demandeur d'emploi",
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
    signature: {
      responsable_organisme: "https://example.com/signature.png",
    },
  };
}

// ===========================================
// EXPORTS
// ===========================================

export type { TemplateContext, RenderOptions };
