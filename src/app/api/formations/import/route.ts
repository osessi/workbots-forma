// ===========================================
// API FORMATIONS - IMPORT
// ===========================================
// POST /api/formations/import - Extraire les données d'une fiche pédagogique

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import mammoth from "mammoth";
import { generateFreeText, isAIConfigured } from "@/lib/ai";
// pdf-parse v2.x utilise un export nommé PDFParse
import { PDFParse } from "pdf-parse";

// Interface pour les données extraites
interface ExtractedData {
  titre?: string;
  description?: string;
  objectifGeneral?: string;
  objectifsSpecifiques?: string[];
  objectifs?: string[];
  publicVise?: string;
  publicCible?: string;
  prerequis?: string[] | string;
  dureeHeures?: string;
  dureeJours?: string;
  modules?: Array<{
    titre: string;
    duree?: string;
    objectifs?: string[];
    contenu?: string[];
  }>;
}

// POST - Extraire les données d'un document uploadé
export async function POST(request: NextRequest) {
  try {
    // Authentification
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Utilisateur ou organisation non trouvé" }, { status: 404 });
    }

    // Récupérer le fichier uploadé
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Vérifier le type de fichier
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Veuillez uploader un fichier PDF ou Word." },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 10 Mo)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux. Maximum 10 Mo." },
        { status: 400 }
      );
    }

    // Extraire le texte du document
    const buffer = Buffer.from(await file.arrayBuffer());
    let textContent = "";

    try {
      if (file.type === "application/pdf") {
        // Extraction PDF avec pdf-parse v2.x
        console.log(`[Import] Extraction PDF: ${file.name} (${file.size} bytes)`);
        const pdfParser = new PDFParse({ data: buffer });
        const pdfResult = await pdfParser.getText();
        // getText() retourne un TextResult avec .text (tout le texte) et .pages (par page)
        textContent = pdfResult.text || "";
        // Nettoyer le parser après utilisation
        await pdfParser.destroy();
        console.log(`[Import] PDF extrait: ${textContent.length} caractères`);
      } else {
        // Extraction DOCX/DOC avec mammoth
        console.log(`[Import] Extraction Word: ${file.name} (${file.size} bytes)`);
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value || "";
        console.log(`[Import] Word extrait: ${textContent.length} caractères`);
      }
    } catch (extractionError) {
      const errorMessage = extractionError instanceof Error ? extractionError.message : String(extractionError);
      console.error("[Import] Erreur d'extraction du contenu:", errorMessage, extractionError);
      return NextResponse.json(
        { error: `Impossible de lire le contenu du fichier: ${errorMessage}` },
        { status: 400 }
      );
    }

    if (!textContent || textContent.trim().length < 50) {
      console.log("[Import] Contenu trop court ou vide:", textContent.length, "caractères");
      return NextResponse.json(
        { error: "Le document semble vide ou ne contient pas assez de texte. Vérifiez que le fichier contient du texte lisible (pas uniquement des images)." },
        { status: 400 }
      );
    }

    // Essayer d'abord l'extraction IA si configurée
    let extractedData: ExtractedData;

    if (isAIConfigured()) {
      try {
        extractedData = await extractWithAI(textContent);
        console.log("Extraction IA réussie");
      } catch (aiError) {
        console.error("Erreur extraction IA, fallback sur règles:", aiError);
        // Fallback sur l'extraction par règles
        extractedData = extractFormationData(textContent);
      }
    } else {
      // Extraction par règles si IA non configurée
      extractedData = extractFormationData(textContent);
    }

    // Si le titre n'a pas été extrait, utiliser le nom du fichier
    if (!extractedData.titre) {
      const fileName = file.name.replace(/\.(pdf|docx?|doc)$/i, "");
      extractedData.titre = fileName.replace(/[-_]/g, " ").trim();
    }

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error("[Import] Erreur extraction document:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'extraction du document: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Fonction d'extraction avec l'IA
async function extractWithAI(textContent: string): Promise<ExtractedData> {
  const systemPrompt = `Tu es un expert en extraction de données structurées à partir de fiches pédagogiques de formation professionnelle.
Tu dois analyser le texte fourni et en extraire les informations clés dans un format JSON structuré.

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.`;

  const userPrompt = `Analyse cette fiche pédagogique et extrais les informations dans le format JSON suivant:

{
  "titre": "Titre de la formation",
  "description": "Description ou objectif général de la formation",
  "objectifGeneral": "L'objectif général de la formation",
  "objectifsSpecifiques": ["Objectif 1", "Objectif 2", "..."],
  "publicVise": "Description du public cible",
  "prerequis": ["Prérequis 1", "Prérequis 2"],
  "dureeHeures": "14",
  "dureeJours": "2",
  "modules": [
    {
      "titre": "Nom du module",
      "duree": "3.5",
      "objectifs": ["Objectif du module 1"],
      "contenu": ["Point 1 du contenu", "Point 2 du contenu"]
    }
  ]
}

TEXTE À ANALYSER:
${textContent.substring(0, 15000)}

Réponds UNIQUEMENT avec le JSON, sans commentaires.`;

  const result = await generateFreeText(systemPrompt, userPrompt, {
    config: {
      maxTokens: 4000,
      temperature: 0.2,
    },
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || "Erreur lors de l'extraction IA");
  }

  // Parser le JSON de la réponse
  let jsonText = result.data.trim();

  // Nettoyer le texte (enlever les balises markdown si présentes)
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsedData = JSON.parse(jsonText);
    return {
      titre: parsedData.titre,
      description: parsedData.description || parsedData.objectifGeneral,
      objectifGeneral: parsedData.objectifGeneral,
      objectifsSpecifiques: parsedData.objectifsSpecifiques,
      objectifs: parsedData.objectifsSpecifiques || parsedData.objectifs,
      publicVise: parsedData.publicVise,
      publicCible: parsedData.publicVise,
      prerequis: parsedData.prerequis,
      dureeHeures: parsedData.dureeHeures?.toString(),
      dureeJours: parsedData.dureeJours?.toString(),
      modules: parsedData.modules,
    };
  } catch {
    console.error("Erreur parsing JSON IA:", jsonText.substring(0, 500));
    throw new Error("Impossible de parser la réponse de l'IA");
  }
}

// Fonction d'extraction des données structurées (fallback)
function extractFormationData(text: string): ExtractedData {
  const data: ExtractedData = {};
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Patterns pour identifier les sections
  const patterns = {
    titre: /^(?:titre|intitulé|formation|nom de la formation)\s*:?\s*(.+)/i,
    objectifGeneral: /^(?:objectif\s*général|objectif\s*principal|but|finalité)\s*:?\s*(.+)/i,
    objectifs: /^(?:objectifs?\s*(?:pédagogiques?|spécifiques?|opérationnels?)?|à l'issue de cette formation)\s*:?\s*/i,
    publicVise: /^(?:public\s*(?:visé|cible|concerné)?|participants?|pour qui|destinataires?)\s*:?\s*/i,
    prerequis: /^(?:prérequis?|conditions?\s*(?:d'accès|préalables?)|niveau requis)\s*:?\s*/i,
    duree: /(?:durée|temps)\s*:?\s*(\d+)\s*(?:heures?|h|jours?|j)/i,
    module: /^(?:module|partie|chapitre|séquence|unité)\s*(\d+)?\s*(?:[-]|[:]|[.])?\s*(.+)/i,
  };

  let currentSection: string | null = null;
  let currentModuleIndex = -1;
  const modules: Array<{ titre: string; contenu: string[] }> = [];
  let objectifsList: string[] = [];
  let prerequisList: string[] = [];
  let publicViseContent = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détecter le titre (souvent dans les premières lignes)
    if (!data.titre && i < 10) {
      const titreMatch = line.match(patterns.titre);
      if (titreMatch) {
        data.titre = titreMatch[1].trim();
        continue;
      }
      // Si c'est une ligne longue en début de document, ça pourrait être le titre
      if (i < 3 && line.length > 10 && line.length < 150 && !line.match(/^(objectif|public|prérequis|durée)/i)) {
        if (!data.titre) {
          data.titre = line;
          continue;
        }
      }
    }

    // Détecter l'objectif général
    if (line.match(patterns.objectifGeneral)) {
      const match = line.match(patterns.objectifGeneral);
      if (match && match[1]) {
        data.objectifGeneral = match[1].trim();
      } else {
        currentSection = "objectifGeneral";
      }
      continue;
    }

    // Détecter les objectifs pédagogiques
    if (line.match(patterns.objectifs)) {
      currentSection = "objectifs";
      // Vérifier s'il y a du contenu sur la même ligne
      const rest = line.replace(patterns.objectifs, "").trim();
      if (rest.length > 5) {
        objectifsList.push(cleanBulletPoint(rest));
      }
      continue;
    }

    // Détecter le public visé
    if (line.match(patterns.publicVise)) {
      currentSection = "publicVise";
      const rest = line.replace(patterns.publicVise, "").trim();
      if (rest.length > 5) {
        publicViseContent = rest;
      }
      continue;
    }

    // Détecter les prérequis
    if (line.match(patterns.prerequis)) {
      currentSection = "prerequis";
      const rest = line.replace(patterns.prerequis, "").trim();
      if (rest.length > 5) {
        prerequisList.push(cleanBulletPoint(rest));
      }
      continue;
    }

    // Détecter la durée
    const dureeMatch = line.match(patterns.duree);
    if (dureeMatch) {
      const value = dureeMatch[1];
      if (line.toLowerCase().includes("heure") || line.toLowerCase().includes("h")) {
        data.dureeHeures = value;
        // Estimer les jours (7h/jour)
        const hours = parseInt(value);
        if (hours && !data.dureeJours) {
          data.dureeJours = String(Math.ceil(hours / 7));
        }
      } else if (line.toLowerCase().includes("jour") || line.toLowerCase().includes("j")) {
        data.dureeJours = value;
        // Estimer les heures (7h/jour)
        const days = parseInt(value);
        if (days && !data.dureeHeures) {
          data.dureeHeures = String(days * 7);
        }
      }
      continue;
    }

    // Détecter les modules
    const moduleMatch = line.match(patterns.module);
    if (moduleMatch) {
      currentModuleIndex++;
      modules.push({
        titre: moduleMatch[2] ? moduleMatch[2].trim() : `Module ${currentModuleIndex + 1}`,
        contenu: [],
      });
      currentSection = "module";
      continue;
    }

    // Traiter le contenu selon la section courante
    if (currentSection && line.length > 2) {
      // Détecter si c'est un élément de liste (bullet point)
      const isBullet = /^[-•●○▪▸►◦*]\s*|^\d+[.)]\s*/.test(line);

      if (currentSection === "objectifs") {
        if (isBullet || line.match(/^[A-Z]/)) {
          objectifsList.push(cleanBulletPoint(line));
        }
      } else if (currentSection === "prerequis") {
        if (isBullet || line.match(/^[A-Z]/)) {
          prerequisList.push(cleanBulletPoint(line));
        }
      } else if (currentSection === "publicVise") {
        if (!publicViseContent) {
          publicViseContent = cleanBulletPoint(line);
        } else if (line.length < 100) {
          publicViseContent += " " + cleanBulletPoint(line);
        }
      } else if (currentSection === "objectifGeneral") {
        if (!data.objectifGeneral) {
          data.objectifGeneral = line;
        }
        currentSection = null;
      } else if (currentSection === "module" && currentModuleIndex >= 0) {
        if (isBullet || line.match(/^[A-Z]/)) {
          modules[currentModuleIndex].contenu.push(cleanBulletPoint(line));
        }
      }
    }

    // Réinitialiser la section si on détecte une nouvelle section majeure
    if (line.match(/^(module|partie|chapitre|objectif|public|prérequis|durée|moyens|évaluation|accessibilité)/i)) {
      // Ne pas réinitialiser si c'est la section courante
      if (currentSection !== "module" || !line.match(/^(module|partie|chapitre)/i)) {
        // Section potentiellement terminée par une autre
      }
    }
  }

  // Assigner les données extraites
  if (objectifsList.length > 0) {
    data.objectifsSpecifiques = objectifsList;
    data.objectifs = objectifsList;
  }

  if (prerequisList.length > 0) {
    data.prerequis = prerequisList;
  }

  if (publicViseContent) {
    data.publicVise = publicViseContent;
    data.publicCible = publicViseContent;
  }

  // Utiliser l'objectif général comme description si pas de description
  if (data.objectifGeneral) {
    data.description = data.objectifGeneral;
  }

  // Assigner les modules
  if (modules.length > 0) {
    data.modules = modules.map((m, i) => ({
      titre: m.titre || `Module ${i + 1}`,
      contenu: m.contenu.filter(c => c.length > 5),
    }));
  }

  return data;
}

// Nettoyer les bullet points
function cleanBulletPoint(text: string): string {
  return text
    .replace(/^[-•●○▪▸►◦*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}
