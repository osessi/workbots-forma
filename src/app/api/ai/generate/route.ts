// ===========================================
// API ROUTE: GENERATION IA CONTEXTUELLE
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIPromptType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import {
  isAIConfigured,
  generateWithContext,
  DynamicPromptContext,
  templateContextToPromptContext,
  checkAllLimits,
  htmlToTiptapJson,
} from "@/lib/ai";
import { generateTestContext } from "@/lib/templates/renderer";

// Schema de validation de la requete
const ContextSchema = z.object({
  formation: z.object({
    titre: z.string().optional(),
    description: z.string().optional(),
    duree: z.string().optional(),
    dureeHeures: z.number().optional(),
    objectifs: z.array(z.string()).optional(),
    prerequis: z.array(z.string()).optional(),
    publicCible: z.string().optional(),
    modalites: z.string().optional(),
  }).optional(),
  metadata: z.object({
    typeSession: z.string().optional(),
    nombreParticipants: z.string().optional(),
    tarifEntreprise: z.string().optional(),
    tarifIndependant: z.string().optional(),
    tarifParticulier: z.string().optional(),
  }).optional(),
  modules: z.array(z.object({
    titre: z.string(),
    description: z.string().optional(),
    duree: z.string().optional(),
    objectifs: z.array(z.string()).optional(),
    contenu: z.array(z.string()).optional(),
  })).optional(),
  organisation: z.object({
    nom: z.string(),
    siret: z.string().optional(),
    numeroDa: z.string().optional(),
    adresse: z.string().optional(),
    telephone: z.string().optional(),
    email: z.string().optional(),
  }).optional(),
  formateur: z.object({
    nom: z.string(),
    prenom: z.string().optional(),
    email: z.string().optional(),
    telephone: z.string().optional(),
    specialites: z.array(z.string()).optional(),
  }).optional(),
  participants: z.array(z.object({
    nom: z.string(),
    prenom: z.string(),
    email: z.string().optional(),
    entreprise: z.string().optional(),
    fonction: z.string().optional(),
  })).optional(),
  session: z.object({
    dateDebut: z.string(),
    dateFin: z.string(),
    lieu: z.string().optional(),
    isDistanciel: z.boolean().optional(),
    horaires: z.string().optional(),
  }).optional(),
  entreprise: z.object({
    nom: z.string(),
    siret: z.string().optional(),
    adresse: z.string().optional(),
    representant: z.string().optional(),
  }).optional(),
}).optional();

const RequestSchema = z.object({
  promptType: z.nativeEnum(AIPromptType),
  promptId: z.string().optional(), // ID du prompt admin specifique
  context: ContextSchema,
  formationId: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  customUserPrompt: z.string().optional(),
  outputFormat: z.enum(["text", "html", "tiptap", "json"]).optional().default("html"),
});

export async function POST(request: NextRequest) {
  try {
    // Verifier l'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 401 }
      );
    }

    // Verifier que l'IA est configuree
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: "Le service IA n'est pas configure. Contactez l'administrateur." },
        { status: 503 }
      );
    }

    // Verifier le rate limiting
    const rateLimitCheck = checkAllLimits(user.id, "generate");
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite de requetes atteinte",
          retryAfter: rateLimitCheck.retryAfter,
          remaining: rateLimitCheck.remaining,
        },
        { status: 429 }
      );
    }

    // Parser et valider la requete
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Erreur validation API generate:", {
        body,
        issues: validationResult.error.issues,
      });
      return NextResponse.json(
        { error: "Donnees invalides", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { promptType, promptId, context, formationId, customSystemPrompt, customUserPrompt, outputFormat } = validationResult.data;

    // Si un promptId est fourni, charger le prompt specifique depuis la base
    let loadedPrompt: { systemPrompt: string; userPromptTemplate: string } | null = null;
    if (promptId) {
      const adminPrompt = await prisma.aIPrompt.findUnique({
        where: { id: promptId, isActive: true },
        select: { systemPrompt: true, userPromptTemplate: true },
      });
      if (adminPrompt) {
        loadedPrompt = adminPrompt;
      }
    }

    // Construire le contexte
    let promptContext: DynamicPromptContext;

    if (formationId) {
      // Charger le contexte depuis la formation
      const formation = await prisma.formation.findUnique({
        where: { id: formationId },
        include: {
          modules: { orderBy: { ordre: "asc" } },
          organization: true,
          user: true,
          sessions: {
            include: { participants: true },
            take: 1,
            orderBy: { dateDebut: "desc" },
          },
        },
      });

      if (!formation) {
        return NextResponse.json(
          { error: "Formation non trouvee" },
          { status: 404 }
        );
      }

      // Construire le contexte depuis la formation
      promptContext = {
        formation: {
          titre: formation.titre,
          description: formation.description || undefined,
          objectifs: (formation.fichePedagogique as { objectifs?: string[] })?.objectifs,
          prerequis: (formation.fichePedagogique as { prerequis?: string[] })?.prerequis,
          publicCible: (formation.fichePedagogique as { publicCible?: string })?.publicCible,
        },
        modules: formation.modules.map((m) => ({
          titre: m.titre,
          description: m.description || undefined,
          duree: m.duree ? `${Math.floor(m.duree / 60)}h${m.duree % 60 > 0 ? m.duree % 60 : ""}` : undefined,
          objectifs: (m.contenu as { objectifs?: string[] })?.objectifs,
          contenu: (m.contenu as { contenu?: string[] })?.contenu,
        })),
        organisation: formation.organization ? {
          nom: formation.organization.name,
          siret: formation.organization.siret || undefined,
          numeroDa: formation.organization.numeroFormateur || undefined,
          adresse: [
            formation.organization.adresse,
            formation.organization.codePostal,
            formation.organization.ville,
          ].filter(Boolean).join(", ") || undefined,
          telephone: formation.organization.telephone || undefined,
        } : undefined,
        formateur: formation.user ? {
          nom: formation.user.lastName || "",
          prenom: formation.user.firstName || undefined,
          email: formation.user.email,
        } : undefined,
        session: formation.sessions[0] ? {
          dateDebut: formation.sessions[0].dateDebut.toLocaleDateString("fr-FR"),
          dateFin: formation.sessions[0].dateFin.toLocaleDateString("fr-FR"),
          lieu: formation.sessions[0].lieu || undefined,
          isDistanciel: formation.sessions[0].isDistanciel,
        } : undefined,
        participants: formation.sessions[0]?.participants.map((p) => ({
          nom: p.lastName,
          prenom: p.firstName,
          email: p.email,
          entreprise: p.company || undefined,
        })),
      };

      // Fusionner avec le contexte fourni (priorite au contexte fourni)
      if (context) {
        promptContext = { ...promptContext, ...context };
      }
    } else if (context) {
      promptContext = context;
    } else {
      // Utiliser un contexte de test
      const testContext = generateTestContext();
      promptContext = templateContextToPromptContext(testContext);
    }

    // Generer le contenu
    const result = await generateWithContext({
      promptType,
      context: promptContext,
      // Utiliser les prompts charges depuis l'admin si disponibles, sinon les custom
      customSystemPrompt: loadedPrompt?.systemPrompt || customSystemPrompt,
      customUserPrompt: loadedPrompt?.userPromptTemplate || customUserPrompt,
      organizationId: user.organizationId || undefined,
      userId: user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Formater la sortie selon le format demande
    let output: unknown;

    switch (outputFormat) {
      case "tiptap":
        output = htmlToTiptapJson(result.content || "");
        break;
      case "text":
        // Supprimer les balises HTML
        output = (result.content || "").replace(/<[^>]*>/g, "");
        break;
      case "json":
        // Retourner le JSON parsé directement
        output = result.contentJson;
        break;
      case "html":
      default:
        output = result.content;
        break;
    }

    return NextResponse.json({
      success: true,
      content: output,
      contentRaw: result.content,
      contentJson: result.contentJson,
      meta: {
        tokens: result.tokens,
        duration: result.duration,
        promptUsed: result.promptUsed,
        outputFormat,
        rateLimitRemaining: rateLimitCheck.remaining - 1,
      },
    });
  } catch (error) {
    console.error("Erreur API ai/generate:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
