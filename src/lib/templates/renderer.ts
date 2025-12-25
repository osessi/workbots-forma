// ===========================================
// MOTEUR DE RENDU DES TEMPLATES
// ===========================================
// Remplace les variables {{variable}} par leurs valeurs reelles
// Nouveau format: {{of_raison_sociale}} au lieu de {{organisation.nom}}

import {
  TemplateContext,
  OrganismeFormationData,
  EntrepriseData,
  ApprenantData,
  FinanceurData,
  IntervenantData,
  LieuData,
  FormationData,
  SessionData,
  JourneeData,
  DatesData,
  TarifsData,
  ClientData,
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

  // Remplacer les conditions {{#if}}...{{/if}} D'ABORD
  htmlContent = replaceConditions(htmlContent, context, previewMode);

  // Remplacer les boucles {{#each}}
  htmlContent = replaceLoops(htmlContent, context, previewMode);

  // Remplacer les variables simples
  htmlContent = replaceSimpleVariables(htmlContent, context, previewMode);

  return htmlContent;
}

// ===========================================
// REMPLACEMENT DES VARIABLES SIMPLES
// ===========================================

/**
 * Remplacer les variables simples {{variable_name}}
 * Nouveau format avec underscores: {{of_raison_sociale}}, {{entreprise_siret}}, etc.
 */
function replaceSimpleVariables(
  content: string,
  context: TemplateContext,
  previewMode: boolean
): string {
  // Pattern pour capturer {{variable_name}} (exclut les # et / pour conditions/boucles)
  const variablePattern = /\{\{([^#/}][^}]*)\}\}/g;

  return content.replace(variablePattern, (match, variableName) => {
    const trimmedName = variableName.trim();
    const value = getValueFromVariableName(context, trimmedName);

    if (value !== undefined && value !== null && value !== "") {
      // Si c'est un tableau, le formater en liste à puces HTML
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return "";
        }
        // Vérifier si c'est un tableau d'objets
        if (typeof value[0] === "object" && value[0] !== null) {
          return formatArrayOfObjects(value, trimmedName);
        }
        // Tableau de strings - faire une liste à puces
        return `<ul class="template-list">${value.map(item => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
      }

      // Si c'est une variable de type logo/image (URL), afficher une balise img
      if (isImageVariable(trimmedName) && typeof value === "string" && isValidImageUrl(value)) {
        return `<img src="${escapeHtml(value)}" alt="Image" style="max-height: 80px; max-width: 200px; height: auto; width: auto;" onerror="this.style.display='none'" />`;
      }

      return String(value);
    }

    // En mode preview, afficher la variable telle quelle avec style
    if (previewMode) {
      return `<span class="template-variable-unresolved">${match}</span>`;
    }

    // Variable non trouvee - retourner vide
    return "";
  });
}

/**
 * Verifier si une variable est de type image/logo
 */
function isImageVariable(variableName: string): boolean {
  const imageVariables = [
    "of_logo_organisme",
    "of_signature_responsable",
    "of_cachet",
  ];
  return imageVariables.includes(variableName) ||
         variableName.endsWith("_logo") ||
         variableName.endsWith("_image") ||
         variableName.endsWith("_signature") ||
         variableName.endsWith("_cachet");
}

/**
 * Verifier si une URL est une URL d'image valide
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:image/")) {
    return false;
  }
  return true;
}

// ===========================================
// MAPPING DES VARIABLES VERS CONTEXTE
// ===========================================

/**
 * Obtenir une valeur depuis le nom de la variable
 * Gère le nouveau format avec underscores (of_raison_sociale, entreprise_siret, etc.)
 */
function getValueFromVariableName(context: TemplateContext, variableName: string): unknown {
  // ===========================================
  // ORGANISME DE FORMATION (of_)
  // ===========================================
  if (variableName.startsWith("of_")) {
    const field = variableName.replace("of_", "");
    const of = context.of;
    if (!of) return undefined;

    switch (field) {
      case "raison_sociale": return of.raison_sociale;
      case "nom_commercial": return of.nom_commercial;
      case "siret": return of.siret;
      case "ville_rcs": return of.ville_rcs;
      case "nda": return of.nda;
      case "region_enregistrement": return of.region_enregistrement;
      case "adresse": return of.adresse;
      case "code_postal": return of.code_postal;
      case "ville": return of.ville;
      case "pays": return of.pays;
      case "representant_nom": return of.representant_nom;
      case "representant_prenom": return of.representant_prenom;
      case "representant_fonction": return of.representant_fonction;
      case "email": return of.email;
      case "telephone": return of.telephone;
      case "site_web": return of.site_web;
      case "signature_responsable": return of.signature_responsable;
      case "cachet": return of.cachet;
      case "logo_organisme": return of.logo_organisme;
      default: return undefined;
    }
  }

  // ===========================================
  // ENTREPRISE (entreprise_)
  // ===========================================
  if (variableName.startsWith("entreprise_")) {
    const field = variableName.replace("entreprise_", "");
    const entreprise = context.entreprise;
    if (!entreprise) return undefined;

    switch (field) {
      case "raison_sociale": return entreprise.raison_sociale;
      case "siret": return entreprise.siret;
      case "adresse": return entreprise.adresse;
      case "code_postal": return entreprise.code_postal;
      case "ville": return entreprise.ville;
      case "pays": return entreprise.pays;
      case "representant_civilite": return entreprise.representant_civilite;
      case "representant_nom": return entreprise.representant_nom;
      case "representant_prenom": return entreprise.representant_prenom;
      case "representant_fonction": return entreprise.representant_fonction;
      case "email": return entreprise.email;
      case "telephone": return entreprise.telephone;
      case "tva_intracom": return entreprise.tva_intracom;
      // Variables calculées
      case "nombre_apprenants": return entreprise.nombre_apprenants;
      case "liste_apprenants": return entreprise.liste_apprenants;
      default: return undefined;
    }
  }

  // ===========================================
  // APPRENANT (apprenant_)
  // ===========================================
  if (variableName.startsWith("apprenant_")) {
    const field = variableName.replace("apprenant_", "");
    const apprenant = context.apprenant;
    if (!apprenant) return undefined;

    switch (field) {
      case "nom": return apprenant.nom;
      case "prenom": return apprenant.prenom;
      case "statut": return apprenant.statut;
      case "raison_sociale": return apprenant.raison_sociale;
      case "siret": return apprenant.siret;
      case "adresse": return apprenant.adresse;
      case "code_postal": return apprenant.code_postal;
      case "ville": return apprenant.ville;
      case "pays": return apprenant.pays;
      case "email": return apprenant.email;
      case "telephone": return apprenant.telephone;
      default: return undefined;
    }
  }

  // ===========================================
  // FINANCEUR (financeur_)
  // ===========================================
  if (variableName.startsWith("financeur_")) {
    const field = variableName.replace("financeur_", "");
    const financeur = context.financeur;
    if (!financeur) return undefined;

    switch (field) {
      case "nom": return financeur.nom;
      case "type": return financeur.type;
      case "adresse": return financeur.adresse;
      case "code_postal": return financeur.code_postal;
      case "ville": return financeur.ville;
      case "pays": return financeur.pays;
      case "email": return financeur.email;
      case "telephone": return financeur.telephone;
      default: return undefined;
    }
  }

  // ===========================================
  // INTERVENANT (intervenant_)
  // ===========================================
  if (variableName.startsWith("intervenant_")) {
    const field = variableName.replace("intervenant_", "");
    const intervenant = context.intervenant;
    if (!intervenant) return undefined;

    switch (field) {
      case "nom": return intervenant.nom;
      case "prenom": return intervenant.prenom;
      case "adresse": return intervenant.adresse;
      case "code_postal": return intervenant.code_postal;
      case "ville": return intervenant.ville;
      case "pays": return intervenant.pays;
      case "email": return intervenant.email;
      case "telephone": return intervenant.telephone;
      case "specialites":
        return Array.isArray(intervenant.specialites)
          ? intervenant.specialites.join(", ")
          : intervenant.specialites;
      case "raison_sociale": return intervenant.raison_sociale;
      case "siret": return intervenant.siret;
      case "nda": return intervenant.nda;
      default: return undefined;
    }
  }

  // ===========================================
  // LIEU (lieu_)
  // ===========================================
  if (variableName.startsWith("lieu_")) {
    const field = variableName.replace("lieu_", "");
    const lieu = context.lieu;
    if (!lieu) return undefined;

    switch (field) {
      case "type": return lieu.type;
      case "nom": return lieu.nom;
      case "adresse": return lieu.formation;
      case "code_postal": return lieu.code_postal;
      case "ville": return lieu.ville;
      case "informations_pratiques": return lieu.informations_pratiques;
      case "capacite": return lieu.capacite;
      default: return undefined;
    }
  }

  // ===========================================
  // FORMATION (formation_)
  // ===========================================
  if (variableName.startsWith("formation_")) {
    const field = variableName.replace("formation_", "");
    const formation = context.formation;
    if (!formation) return undefined;

    switch (field) {
      case "titre": return formation.titre;
      case "modalite": return formation.modalite;
      case "categorie_action": return formation.categorie_action;
      case "duree_heures": return formation.duree_heures;
      case "duree_jours": return formation.duree_jours;
      case "duree_heures_jours": return formation.duree_heures_jours;
      case "nb_participants_max": return formation.nb_participants_max;
      case "description": return formation.description;
      case "objectifs_pedagogiques": return formation.objectifs_pedagogiques;
      case "prerequis": return formation.prerequis;
      case "public_vise": return formation.public_vise;
      case "contenu_detaille": return formation.contenu_detaille;
      case "suivi_execution_evaluation": return formation.suivi_execution_evaluation;
      case "ressources_pedagogiques": return formation.ressources_pedagogiques;
      case "accessibilite": return formation.accessibilite;
      case "delai_acces": return formation.delai_acces;
      case "tarif_entreprise_ht_fiche_peda": return formation.tarif_entreprise_ht_fiche_peda;
      case "tarif_independant_ht_fiche_peda": return formation.tarif_independant_ht_fiche_peda;
      case "tarif_particulier_ttc_fiche_peda": return formation.tarif_particulier_ttc_fiche_peda;
      default: return undefined;
    }
  }

  // ===========================================
  // SESSION (session_)
  // ===========================================
  if (variableName.startsWith("session_")) {
    const field = variableName.replace("session_", "");
    const session = context.session;
    if (!session) return undefined;

    switch (field) {
      case "modalite": return session.modalite;
      case "date_debut": return session.date_debut;
      case "date_fin": return session.date_fin;
      case "planning_journees_formation": return session.planning_journees_formation;
      default: return undefined;
    }
  }

  // ===========================================
  // JOURNÉES DYNAMIQUES (j1_, j2_, etc.)
  // ===========================================
  const journeeMatch = variableName.match(/^j(\d+)_(.+)$/);
  if (journeeMatch) {
    const index = parseInt(journeeMatch[1], 10) - 1; // Index 0-based
    const field = journeeMatch[2];
    const journees = context.session?.journees;
    if (journees && journees[index]) {
      const journee = journees[index];
      switch (field) {
        case "date": return journee.date;
        case "horaire_matin": return journee.horaire_matin;
        case "horaire_apres_midi": return journee.horaire_apres_midi;
        default: return undefined;
      }
    }
    return undefined;
  }

  // ===========================================
  // DATES (date_)
  // ===========================================
  if (variableName.startsWith("date_")) {
    const field = variableName.replace("date_", "");
    const dates = context.dates;
    if (!dates) {
      // Générer les dates du jour si pas fournies
      const now = new Date();
      const months = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
      ];
      switch (field) {
        case "jour": return String(now.getDate()).padStart(2, "0");
        case "mois": return months[now.getMonth()];
        case "annee": return String(now.getFullYear());
        case "complete_longue": return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        case "complete_courte": return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
        default: return undefined;
      }
    }

    switch (field) {
      case "jour": return dates.jour;
      case "mois": return dates.mois;
      case "annee": return dates.annee;
      case "complete_longue": return dates.complete_longue;
      case "complete_courte": return dates.complete_courte;
      default: return undefined;
    }
  }

  // ===========================================
  // TARIFS (tarifs_)
  // ===========================================
  if (variableName.startsWith("tarifs_")) {
    const field = variableName.replace("tarifs_", "");
    const tarifs = context.tarifs;
    if (!tarifs) return undefined;

    switch (field) {
      // Entreprise
      case "tarif_entreprise_ht_documents": return tarifs.tarif_entreprise_ht_documents;
      case "entreprise_montant_tva": return tarifs.entreprise_montant_tva;
      case "entreprise_prix_ttc": return tarifs.entreprise_prix_ttc;
      case "entreprise_montant_financeur_ht": return tarifs.entreprise_montant_financeur_ht;
      case "entreprise_montant_financeur_ttc": return tarifs.entreprise_montant_financeur_ttc;
      case "entreprise_reste_a_charge_ht": return tarifs.entreprise_reste_a_charge_ht;
      case "entreprise_reste_a_charge_ttc": return tarifs.entreprise_reste_a_charge_ttc;
      // Indépendant
      case "tarif_independant_ht_documents": return tarifs.tarif_independant_ht_documents;
      case "independant_montant_tva": return tarifs.independant_montant_tva;
      case "independant_prix_ttc": return tarifs.independant_prix_ttc;
      case "independant_montant_financeur_ht": return tarifs.independant_montant_financeur_ht;
      case "independant_montant_financeur_ttc": return tarifs.independant_montant_financeur_ttc;
      case "independant_reste_a_charge_ht": return tarifs.independant_reste_a_charge_ht;
      case "independant_reste_a_charge_ttc": return tarifs.independant_reste_a_charge_ttc;
      // Particulier
      case "particulier_prix_ttc": return tarifs.particulier_prix_ttc;
      default: return undefined;
    }
  }

  // ===========================================
  // CLIENT (client_) - pour conditions
  // ===========================================
  if (variableName.startsWith("client_") || variableName.startsWith("client.")) {
    const field = variableName.replace(/^client[._]/, "");
    const client = context.client;
    if (!client) return undefined;

    switch (field) {
      case "type": return client.type;
      default: return undefined;
    }
  }

  // ===========================================
  // VARIABLES CALCULÉES GLOBALES
  // ===========================================
  if (variableName === "apprenants_liste") {
    return context.apprenants_liste;
  }

  if (variableName === "intervenant_equipe_pedagogique") {
    return context.intervenant_equipe_pedagogique;
  }

  // ===========================================
  // SUPPORT ANCIEN FORMAT (pour compatibilité)
  // Chemin avec points: organisation.nom, entreprise.siret, etc.
  // ===========================================
  if (variableName.includes(".")) {
    return getValueFromLegacyPath(context, variableName);
  }

  return undefined;
}

/**
 * Support de l'ancien format avec points pour compatibilité
 */
function getValueFromLegacyPath(context: TemplateContext, path: string): unknown {
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
    const array = getArrayFromContext(context, arrayName);

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

        // Remplacer les proprietes de l'element
        if (typeof item === "object" && item !== null) {
          const singularName = getSingularName(arrayName);

          // Pattern pour {{singulier.propriete}}
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

          // Pattern pour {{propriete}} directement
          const directPattern = /\{\{([a-z_]+)\}\}/g;
          itemContent = itemContent.replace(directPattern, (m: string, prop: string) => {
            const value = (item as Record<string, unknown>)[prop];
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                return value.join(", ");
              }
              return String(value);
            }
            return m;
          });
        }

        return itemContent;
      })
      .join("");
  });
}

/**
 * Obtenir un tableau depuis le contexte
 */
function getArrayFromContext(context: TemplateContext, arrayName: string): unknown[] | undefined {
  switch (arrayName) {
    case "apprenants":
      return context.apprenants;
    case "intervenants":
      return context.intervenants;
    case "journees":
      return context.session?.journees;
    default:
      return (context as Record<string, unknown>)[arrayName] as unknown[] | undefined;
  }
}

// ===========================================
// REMPLACEMENT DES CONDITIONS
// ===========================================

/**
 * Remplacer les conditions {{#if condition}}...{{/if}}
 * Supporte:
 * - {{#if variable}} - verifie si la variable existe et est truthy
 * - {{#if client.type === "entreprise"}} - comparaison d'egalite
 * - {{#if client.type !== "particulier"}} - comparaison de difference
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

    // Evaluer la condition
    const isTruthy = evaluateAdvancedCondition(trimmedCondition, context);

    if (isTruthy) {
      // Rendre le contenu du if (recursif pour les conditions imbriquees)
      let result = replaceConditions(ifContent, context, previewMode);
      result = replaceSimpleVariables(result, context, previewMode);
      return result;
    } else if (elseContent) {
      // Rendre le contenu du else
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
 */
function evaluateAdvancedCondition(condition: string, context: TemplateContext): boolean {
  // Pattern pour detecter les comparaisons
  const comparisonPattern = /^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/;
  const match = condition.match(comparisonPattern);

  if (match) {
    const [, leftPath, operator, rightValue] = match;
    const leftTrimmed = leftPath.trim();
    let rightTrimmed = rightValue.trim();

    // Obtenir la valeur de gauche depuis le contexte
    const leftValue = getValueFromVariableName(context, leftTrimmed);

    // Determiner la valeur de droite
    let rightParsed: unknown;

    // Verifier si c'est une string entre quotes
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
      rightParsed = getValueFromVariableName(context, rightTrimmed);
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
  const value = getValueFromVariableName(context, condition);
  return evaluateCondition(value);
}

// ===========================================
// HELPERS
// ===========================================

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
    apprenants: "apprenant",
    intervenants: "intervenant",
    journees: "journee",
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
      return `{{#if ${condition}}}${childrenHtml}{{/if}}`;
    case "loopBlock":
      const collection = attrs?.collection as string || "items";
      return `{{#each ${collection}}}${childrenHtml}{{/each}}`;
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
  if (variablePath === "apprenants") {
    return array.map((apprenant, index) => {
      const nom = apprenant.nom || "";
      const prenom = apprenant.prenom || "";
      const email = apprenant.email || "";
      return `<p>${index + 1}. ${escapeHtml(String(prenom))} ${escapeHtml(String(nom))}${email ? ` (${escapeHtml(String(email))})` : ""}</p>`;
    }).join("");
  }

  if (variablePath === "intervenants") {
    return array.map((intervenant, index) => {
      const nom = intervenant.nom || "";
      const prenom = intervenant.prenom || "";
      const specialites = intervenant.specialites as string[] || [];
      return `<p>${index + 1}. ${escapeHtml(String(prenom))} ${escapeHtml(String(nom))}${specialites.length > 0 ? ` - ${escapeHtml(specialites.join(", "))}` : ""}</p>`;
    }).join("");
  }

  if (variablePath === "journees") {
    return array.map((journee) => {
      const numero = journee.numero || "";
      const date = journee.date || "";
      const horaire_matin = journee.horaire_matin || "";
      const horaire_apres_midi = journee.horaire_apres_midi || "";
      return `<p><strong>Jour ${numero}:</strong> ${escapeHtml(String(date))} - Matin: ${escapeHtml(String(horaire_matin))}, Après-midi: ${escapeHtml(String(horaire_apres_midi))}</p>`;
    }).join("");
  }

  // Par défaut, lister les objets
  return `<ul>${array.map((obj, index) => {
    const mainValue = obj.titre || obj.nom || obj.name || obj.label || Object.values(obj)[0];
    return `<li>${escapeHtml(String(mainValue || `Item ${index + 1}`))}</li>`;
  }).join("")}</ul>`;
}

// ===========================================
// GENERATION DE CONTEXTE DE TEST
// ===========================================

/**
 * Generer un contexte de donnees de test pour preview
 * Utilise le nouveau format de données
 */
export function generateTestContext(): TemplateContext {
  const now = new Date();
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];

  return {
    // Organisme de Formation
    of: {
      raison_sociale: "Automate Formation SAS",
      nom_commercial: "Automate Formation",
      siret: "123 456 789 00012",
      ville_rcs: "Paris",
      nda: "11 75 12345 67",
      region_enregistrement: "Île-de-France",
      adresse: "15 rue de la Formation",
      code_postal: "75001",
      ville: "Paris",
      pays: "France",
      representant_nom: "DUPONT",
      representant_prenom: "Jean",
      representant_fonction: "Directeur Général",
      email: "contact@automate-formation.fr",
      telephone: "01 23 45 67 89",
      logo_organisme: "https://example.com/logo.png",
    },

    // Entreprise cliente
    entreprise: {
      id: "ENT-001",
      raison_sociale: "ACME Corporation",
      siret: "987 654 321 00098",
      adresse: "100 avenue des Champs-Élysées",
      code_postal: "75008",
      ville: "Paris",
      pays: "France",
      representant_civilite: "Mme",
      representant_nom: "MARTIN",
      representant_prenom: "Marie",
      representant_fonction: "Directrice des Ressources Humaines",
      email: "contact@acme.fr",
      telephone: "01 98 76 54 32",
      tva_intracom: "FR12345678901",
      nombre_apprenants: 3,
      liste_apprenants: "Pierre DURAND, Sophie LEROY, Thomas MOREAU",
    },

    // Apprenant (pour contrat individuel)
    apprenant: {
      id: "APP-001",
      nom: "DURAND",
      prenom: "Pierre",
      statut: "SALARIE",
      adresse: "25 rue de la Paix",
      code_postal: "75002",
      ville: "Paris",
      pays: "France",
      email: "pierre.durand@email.com",
      telephone: "06 12 34 56 78",
    },

    // Liste des apprenants (pour conventions)
    apprenants: [
      {
        id: "APP-001",
        nom: "DURAND",
        prenom: "Pierre",
        statut: "SALARIE" as const,
        email: "p.durand@acme.fr",
        telephone: "06 12 34 56 78",
      },
      {
        id: "APP-002",
        nom: "LEROY",
        prenom: "Sophie",
        statut: "SALARIE" as const,
        email: "s.leroy@acme.fr",
        telephone: "06 23 45 67 89",
      },
      {
        id: "APP-003",
        nom: "MOREAU",
        prenom: "Thomas",
        statut: "SALARIE" as const,
        email: "t.moreau@acme.fr",
        telephone: "06 34 56 78 90",
      },
    ],
    apprenants_liste: "Pierre DURAND, Sophie LEROY, Thomas MOREAU",

    // Financeur
    financeur: {
      id: "FIN-001",
      nom: "OPCO Atlas",
      type: "OPCO",
      adresse: "10 rue de l'OPCO",
      code_postal: "75009",
      ville: "Paris",
      pays: "France",
      email: "contact@opco-atlas.fr",
      telephone: "01 40 50 60 70",
    },

    // Intervenant
    intervenant: {
      id: "INT-001",
      nom: "BERNARD",
      prenom: "Sophie",
      adresse: "30 rue du Formateur",
      code_postal: "75003",
      ville: "Paris",
      pays: "France",
      email: "s.bernard@automate-formation.fr",
      telephone: "06 12 34 56 78",
      specialites: ["Management", "Leadership", "Communication"],
    },

    // Liste des intervenants
    intervenants: [
      {
        id: "INT-001",
        nom: "BERNARD",
        prenom: "Sophie",
        email: "s.bernard@automate-formation.fr",
        specialites: ["Management", "Leadership"],
      },
    ],
    intervenant_equipe_pedagogique: "Sophie BERNARD (Management, Leadership)",

    // Lieu
    lieu: {
      id: "LIEU-001",
      type: "PRESENTIEL",
      nom: "Centre de formation Paris",
      formation: "15 rue de la Formation, 75001 Paris",
      code_postal: "75001",
      ville: "Paris",
      informations_pratiques: "Métro ligne 1 - Louvre Rivoli",
      capacite: 12,
    },

    // Formation
    formation: {
      id: "FORM-001",
      titre: "Management Agile et Leadership",
      modalite: "Présentiel",
      categorie_action: "Action de formation",
      duree_heures: 14,
      duree_jours: 2,
      duree_heures_jours: "14 heures (2 jours)",
      nb_participants_max: 12,
      description: "Cette formation permet de maîtriser les fondamentaux du management agile et de développer ses compétences de leader.",
      objectifs_pedagogiques: "- Comprendre les principes du management agile\n- Développer ses compétences de leader\n- Mettre en place des rituels d'équipe efficaces",
      prerequis: "Aucun prérequis technique. Expérience en management souhaitée.",
      public_vise: "Managers, chefs de projet, responsables d'équipe",
      contenu_detaille: "Module 1: Introduction au management agile\nModule 2: Leadership et communication\nModule 3: Mise en pratique",
      suivi_execution_evaluation: "Feuilles de présence signées, QCM d'évaluation des acquis",
      ressources_pedagogiques: "Supports de cours, exercices pratiques, études de cas",
      accessibilite: "Formation accessible aux personnes en situation de handicap",
      delai_acces: "14 jours ouvrables avant le début de la formation",
      tarif_entreprise_ht_fiche_peda: "1 500,00 € HT",
      tarif_independant_ht_fiche_peda: "1 200,00 € HT",
      tarif_particulier_ttc_fiche_peda: "1 440,00 € TTC",
    },

    // Session
    session: {
      id: "SESS-001",
      modalite: "Présentiel",
      date_debut: "15/01/2025",
      date_fin: "16/01/2025",
      journees: [
        {
          numero: 1,
          date: "15 janvier 2025",
          horaire_matin: "09:00 - 12:30",
          horaire_apres_midi: "14:00 - 17:30",
        },
        {
          numero: 2,
          date: "16 janvier 2025",
          horaire_matin: "09:00 - 12:30",
          horaire_apres_midi: "14:00 - 17:30",
        },
      ],
      planning_journees_formation: "Jour 1: Introduction et fondamentaux\nJour 2: Pratique et mise en application",
    },

    // Dates du jour
    dates: {
      jour: String(now.getDate()).padStart(2, "0"),
      mois: months[now.getMonth()],
      annee: String(now.getFullYear()),
      complete_longue: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
      complete_courte: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
    },

    // Tarifs
    tarifs: {
      tarif_entreprise_ht_documents: "1 500,00 € HT",
      entreprise_montant_tva: "300,00 €",
      entreprise_prix_ttc: "1 800,00 € TTC",
      entreprise_montant_financeur_ht: "1 000,00 € HT",
      entreprise_montant_financeur_ttc: "1 200,00 € TTC",
      entreprise_reste_a_charge_ht: "500,00 € HT",
      entreprise_reste_a_charge_ttc: "600,00 € TTC",
      entreprise_a_financeur: true,
      tarif_independant_ht_documents: "1 200,00 € HT",
      independant_montant_tva: "240,00 €",
      independant_prix_ttc: "1 440,00 € TTC",
      independant_a_financeur: false,
      particulier_prix_ttc: "1 440,00 € TTC",
    },

    // Client (pour conditions)
    client: {
      type: "entreprise",
    },
  };
}

// ===========================================
// EXPORTS
// ===========================================

export type { TemplateContext, RenderOptions };
