# Architecture Backend - Automate

## Phase 1 : Configuration Base (Semaine 1)

### 1.1 Installation des dépendances

```bash
# Base de données
npm install prisma @prisma/client

# AI SDK (supporte Claude, OpenAI, Gemini)
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google

# Génération PDF
npm install @react-pdf/renderer puppeteer

# Stockage fichiers
npm install @supabase/supabase-js
# OU
npm install @aws-sdk/client-s3

# Tâches en arrière-plan
npm install inngest

# Utilitaires
npm install zod uuid
```

### 1.2 Variables d'environnement (.env.local)

```env
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/automate"

# IA - Un seul suffit, ou plusieurs pour fallback
ANTHROPIC_API_KEY="sk-ant-..."      # Claude (recommandé)
OPENAI_API_KEY="sk-..."              # GPT-4
GOOGLE_AI_API_KEY="..."              # Gemini

# Choix du provider IA par défaut
AI_PROVIDER="anthropic"  # anthropic | openai | google

# Gamma API pour slides
GAMMA_API_KEY="..."
GAMMA_WORKSPACE_ID="..."

# Stockage
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."

# OU AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="automate-files"
AWS_REGION="eu-west-3"
```

### 1.3 Structure des dossiers

```
src/
├── app/
│   └── api/
│       ├── ai/
│       │   ├── generate-fiche/route.ts
│       │   ├── generate-evaluation/route.ts
│       │   └── generate-qcm/route.ts
│       ├── gamma/
│       │   ├── create-presentation/route.ts
│       │   └── webhook/route.ts
│       ├── documents/
│       │   ├── generate-pdf/route.ts
│       │   └── generate-convention/route.ts
│       └── storage/
│           ├── upload/route.ts
│           └── download/[id]/route.ts
├── lib/
│   ├── ai/
│   │   ├── config.ts          # Configuration multi-provider
│   │   ├── prompts.ts         # Prompts pour chaque génération
│   │   └── schemas.ts         # Schémas Zod pour les réponses
│   ├── gamma/
│   │   └── client.ts          # Client API Gamma
│   ├── pdf/
│   │   ├── templates/         # Templates PDF React
│   │   └── generator.ts
│   ├── storage/
│   │   └── client.ts          # Client Supabase/S3
│   └── db/
│       └── prisma.ts          # Client Prisma
├── prisma/
│   └── schema.prisma
└── types/
    └── generation.ts
```

---

## Phase 2 : Intégration IA Multi-Provider (Semaine 2)

### 2.1 Configuration IA (src/lib/ai/config.ts)

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export type AIProvider = 'anthropic' | 'openai' | 'google';

export function getAIProvider(provider?: AIProvider) {
  const selectedProvider = provider || process.env.AI_PROVIDER || 'anthropic';

  switch (selectedProvider) {
    case 'anthropic':
      return anthropic('claude-sonnet-4-20250514');
    case 'openai':
      return openai('gpt-4o');
    case 'google':
      return google('gemini-1.5-pro');
    default:
      return anthropic('claude-sonnet-4-20250514');
  }
}

export const AI_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
};
```

### 2.2 Prompts structurés (src/lib/ai/prompts.ts)

```typescript
export const PROMPTS = {
  fichePedagogique: (context: ContextData) => `
Tu es un expert en ingénierie pédagogique. Génère une fiche pédagogique complète pour une formation professionnelle.

CONTEXTE DE LA FORMATION:
- Durée: ${context.dureeHeures} heures (${context.dureeJours} jours)
- Modalité: ${context.modalite}
- Nombre de participants: ${context.nombreParticipants}
- Description: ${context.description}

GÉNÈRE UNE FICHE AVEC:
1. Un titre accrocheur et professionnel
2. Une description détaillée (150-200 mots)
3. 4-6 objectifs pédagogiques précis et mesurables (verbes d'action)
4. Le contenu détaillé en modules (3-5 modules)
5. Les prérequis éventuels
6. Les méthodes pédagogiques
7. Les modalités d'évaluation

Réponds en JSON selon ce format:
{
  "titre": "...",
  "description": "...",
  "objectifs": ["...", "..."],
  "modules": [
    {
      "id": "1",
      "titre": "Module 1 - ...",
      "contenu": ["...", "..."]
    }
  ],
  "prerequis": "...",
  "methodesPedagogiques": ["...", "..."],
  "modalitesEvaluation": "..."
}
`,

  qcm: (module: ModuleData) => `
Tu es un expert en évaluation pédagogique. Crée un QCM de 5 questions pour évaluer les acquis du module suivant.

MODULE: ${module.titre}
CONTENU: ${module.contenu.join('\n- ')}

Pour chaque question:
- 4 propositions de réponse
- Une seule bonne réponse
- Des distracteurs plausibles
- Un feedback explicatif

Réponds en JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}
`,

  testPositionnement: (formation: FicheData) => `...`,
  evaluationFinale: (formation: FicheData) => `...`,
};
```

### 2.3 API Route - Génération Fiche (src/app/api/ai/generate-fiche/route.ts)

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';
import { getAIProvider, AI_CONFIG } from '@/lib/ai/config';
import { PROMPTS } from '@/lib/ai/prompts';

const FicheSchema = z.object({
  titre: z.string(),
  description: z.string(),
  objectifs: z.array(z.string()),
  modules: z.array(z.object({
    id: z.string(),
    titre: z.string(),
    contenu: z.array(z.string()),
  })),
  prerequis: z.string(),
  methodesPedagogiques: z.array(z.string()),
  modalitesEvaluation: z.string(),
});

export async function POST(request: Request) {
  try {
    const { contexte, provider } = await request.json();

    const model = getAIProvider(provider);

    const { object } = await generateObject({
      model,
      schema: FicheSchema,
      prompt: PROMPTS.fichePedagogique(contexte),
      ...AI_CONFIG,
    });

    return Response.json({ success: true, data: object });
  } catch (error) {
    console.error('Erreur génération fiche:', error);
    return Response.json(
      { success: false, error: 'Erreur lors de la génération' },
      { status: 500 }
    );
  }
}
```

---

## Phase 3 : Intégration Gamma pour Slides (Semaine 3)

### 3.1 Client Gamma (src/lib/gamma/client.ts)

```typescript
const GAMMA_API_URL = 'https://api.gamma.app/v1';

interface GammaOptions {
  theme?: string;
  chartStyle?: 'modern' | 'classic' | 'minimal';
  fontFamily?: string;
  colorScheme?: string;
  includeImages?: boolean;
  slideCount?: number;
}

interface GammaPresentation {
  id: string;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  previewUrl?: string;
}

export class GammaClient {
  private apiKey: string;
  private workspaceId: string;

  constructor() {
    this.apiKey = process.env.GAMMA_API_KEY!;
    this.workspaceId = process.env.GAMMA_WORKSPACE_ID!;
  }

  async createPresentation(
    content: string,
    options: GammaOptions = {}
  ): Promise<GammaPresentation> {
    const response = await fetch(`${GAMMA_API_URL}/presentations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: this.workspaceId,
        content,
        options: {
          theme: options.theme || 'professional',
          chart_style: options.chartStyle || 'modern',
          font_family: options.fontFamily || 'Inter',
          color_scheme: options.colorScheme || '#4277FF',
          include_images: options.includeImages ?? true,
          slide_count: options.slideCount || 'auto',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getPresentation(id: string): Promise<GammaPresentation> {
    const response = await fetch(`${GAMMA_API_URL}/presentations/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    return response.json();
  }

  async downloadPresentation(id: string, format: 'pptx' | 'pdf' = 'pptx'): Promise<Buffer> {
    const response = await fetch(
      `${GAMMA_API_URL}/presentations/${id}/download?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    return Buffer.from(await response.arrayBuffer());
  }
}

export const gammaClient = new GammaClient();
```

### 3.2 Popup Options Gamma (Composant Frontend)

```typescript
// src/components/automate/GammaOptionsModal.tsx

interface GammaOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: GammaOptions) => void;
  moduleName: string;
}

const THEMES = [
  { id: 'professional', name: 'Professionnel', preview: '/themes/pro.png' },
  { id: 'modern', name: 'Moderne', preview: '/themes/modern.png' },
  { id: 'minimal', name: 'Minimaliste', preview: '/themes/minimal.png' },
  { id: 'creative', name: 'Créatif', preview: '/themes/creative.png' },
];

const CHART_STYLES = [
  { id: 'modern', name: 'Moderne' },
  { id: 'classic', name: 'Classique' },
  { id: 'minimal', name: 'Épuré' },
];

const FONTS = [
  { id: 'inter', name: 'Inter' },
  { id: 'roboto', name: 'Roboto' },
  { id: 'poppins', name: 'Poppins' },
  { id: 'montserrat', name: 'Montserrat' },
];

export const GammaOptionsModal: React.FC<GammaOptionsModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  moduleName,
}) => {
  const [options, setOptions] = useState<GammaOptions>({
    theme: 'professional',
    chartStyle: 'modern',
    fontFamily: 'Inter',
    colorScheme: '#4277FF',
    includeImages: true,
    slideCount: undefined,
  });

  // ... Modal UI avec sélecteurs pour chaque option
};
```

---

## Phase 4 : Génération PDF et Documents (Semaine 4)

### 4.1 Templates PDF avec React-PDF (src/lib/pdf/templates/)

```typescript
// src/lib/pdf/templates/ConventionTemplate.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #4277FF',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  // ... autres styles
});

interface ConventionProps {
  entreprise: EntrepriseData;
  formation: FormationData;
  salaries: SalarieData[];
}

export const ConventionTemplate: React.FC<ConventionProps> = ({
  entreprise,
  formation,
  salaries,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>CONVENTION DE FORMATION PROFESSIONNELLE</Text>
        <Text>Article L.6353-1 et suivants du Code du travail</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ENTRE LES SOUSSIGNÉS</Text>
        <Text>
          L'organisme de formation [Votre OF], N° de déclaration d'activité: XXX
        </Text>
        <Text>ET</Text>
        <Text>
          {entreprise.raisonSociale}, représentée par {entreprise.nomDirigeant}
        </Text>
        <Text>SIRET: {entreprise.siret}</Text>
        <Text>Adresse: {entreprise.adresse}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OBJET</Text>
        <Text>
          La présente convention a pour objet la réalisation de l'action de formation:
        </Text>
        <Text style={styles.formationTitle}>{formation.titre}</Text>
      </View>

      {/* ... autres sections */}
    </Page>
  </Document>
);
```

### 4.2 Générateur PDF (src/lib/pdf/generator.ts)

```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { ConventionTemplate } from './templates/ConventionTemplate';
import { ContratTemplate } from './templates/ContratTemplate';
import { FicheTemplate } from './templates/FicheTemplate';

export type DocumentType = 'convention' | 'contrat' | 'fiche' | 'evaluation';

export async function generatePDF(
  type: DocumentType,
  data: Record<string, unknown>
): Promise<Buffer> {
  let document;

  switch (type) {
    case 'convention':
      document = <ConventionTemplate {...data as ConventionProps} />;
      break;
    case 'contrat':
      document = <ContratTemplate {...data as ContratProps} />;
      break;
    case 'fiche':
      document = <FicheTemplate {...data as FicheProps} />;
      break;
    default:
      throw new Error(`Type de document inconnu: ${type}`);
  }

  return renderToBuffer(document);
}
```

### 4.3 API Route PDF (src/app/api/documents/generate-pdf/route.ts)

```typescript
import { generatePDF } from '@/lib/pdf/generator';
import { storageClient } from '@/lib/storage/client';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const { type, data, formationId } = await request.json();

    // Générer le PDF
    const pdfBuffer = await generatePDF(type, data);

    // Sauvegarder dans le storage
    const fileName = `${type}_${formationId}_${Date.now()}.pdf`;
    const fileUrl = await storageClient.upload(pdfBuffer, fileName, 'application/pdf');

    // Enregistrer en base
    const document = await prisma.document.create({
      data: {
        formationId,
        type,
        fileName,
        fileUrl,
        generatedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      document: {
        id: document.id,
        url: fileUrl,
        fileName,
      },
    });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return Response.json(
      { success: false, error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
```

---

## Phase 5 : Stockage et Base de Données (Semaine 5)

### 5.1 Schéma Prisma (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  avatar        String?
  formations    Formation[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Formation {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])

  // Données contexte
  titre           String
  description     String?
  dureeHeures     String?
  dureeJours      String?
  modalite        String?
  tarif           String?
  nombreParticipants String?

  // Fiche pédagogique (JSON)
  fichePedagogique Json?

  // Modules
  modules         Module[]

  // Documents générés
  documents       Document[]

  // Status
  status          FormationStatus @default(BROUILLON)
  currentStep     String          @default("contexte")

  // Métadonnées
  image           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model Module {
  id              String      @id @default(cuid())
  formationId     String
  formation       Formation   @relation(fields: [formationId], references: [id], onDelete: Cascade)

  titre           String
  contenu         String[]
  ordre           Int

  // Slides générées
  slidesUrl       String?
  slidesStatus    GenerationStatus @default(PENDING)

  // Support stagiaire
  supportUrl      String?
  supportStatus   GenerationStatus @default(PENDING)

  // QCM
  qcm             Json?
  qcmStatus       GenerationStatus @default(PENDING)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model Document {
  id              String      @id @default(cuid())
  formationId     String
  formation       Formation   @relation(fields: [formationId], references: [id], onDelete: Cascade)

  type            DocumentType
  fileName        String
  fileUrl         String
  fileSize        Int?

  // Données utilisées pour générer
  inputData       Json?

  generatedAt     DateTime    @default(now())
}

enum FormationStatus {
  BROUILLON
  EN_COURS
  TERMINEE
}

enum GenerationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum DocumentType {
  FICHE_PEDAGOGIQUE
  CONVENTION
  CONTRAT
  SLIDES
  SUPPORT
  QCM
  TEST_POSITIONNEMENT
  EVALUATION_FINALE
}
```

### 5.2 Client Storage (src/lib/storage/client.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BUCKET_NAME = 'formations';

export const storageClient = {
  async upload(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  async download(path: string): Promise<Buffer> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) throw error;

    return Buffer.from(await data.arrayBuffer());
  },

  async delete(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
  },

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  },
};
```

---

## Phase 6 : Animations de Chargement (Semaine 6)

### 6.1 Composant Loading Animation (src/components/automate/GenerationLoader.tsx)

```typescript
"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GenerationLoaderProps {
  isLoading: boolean;
  type: 'fiche' | 'slides' | 'qcm' | 'pdf';
  progress?: number;
}

const MESSAGES = {
  fiche: [
    "Analyse du contexte de formation...",
    "Définition des objectifs pédagogiques...",
    "Structuration des modules...",
    "Rédaction du contenu...",
    "Finalisation de la fiche...",
  ],
  slides: [
    "Connexion à Gamma...",
    "Création du design...",
    "Génération des visuels...",
    "Ajout des animations...",
    "Export de la présentation...",
  ],
  qcm: [
    "Analyse des objectifs...",
    "Création des questions...",
    "Génération des réponses...",
    "Vérification de la cohérence...",
  ],
  pdf: [
    "Préparation du document...",
    "Mise en page...",
    "Génération du PDF...",
  ],
};

export const GenerationLoader: React.FC<GenerationLoaderProps> = ({
  isLoading,
  type,
  progress,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = MESSAGES[type];

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Animation centrale */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            {/* Cercle extérieur */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-brand-200 dark:border-brand-800"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            {/* Cercle intérieur avec progression */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-brand-500"
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * (progress || 50)) / 100}
              />
            </svg>
            {/* Icône centrale */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-brand-500"
              >
                {type === 'fiche' && <DocumentIcon />}
                {type === 'slides' && <PresentationIcon />}
                {type === 'qcm' && <QuizIcon />}
                {type === 'pdf' && <PDFIcon />}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Message animé */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-gray-600 dark:text-gray-400"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {/* Barre de progression */}
        {progress !== undefined && (
          <div className="mt-6">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">{progress}%</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
```

---

## Phase 7 : Hooks Frontend et Intégration (Semaine 7)

### 7.1 Hook useGeneration (src/hooks/useGeneration.ts)

```typescript
import { useState, useCallback } from 'react';

type GenerationType = 'fiche' | 'slides' | 'qcm' | 'pdf' | 'convention' | 'contrat';

interface UseGenerationOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export function useGeneration(options: UseGenerationOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (
    type: GenerationType,
    payload: Record<string, unknown>
  ) => {
    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const endpoint = getEndpoint(type);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }

      const data = await response.json();
      setProgress(100);

      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return { generate, isLoading, progress, error };
}

function getEndpoint(type: GenerationType): string {
  const endpoints: Record<GenerationType, string> = {
    fiche: '/api/ai/generate-fiche',
    slides: '/api/gamma/create-presentation',
    qcm: '/api/ai/generate-qcm',
    pdf: '/api/documents/generate-pdf',
    convention: '/api/documents/generate-convention',
    contrat: '/api/documents/generate-contrat',
  };
  return endpoints[type];
}
```

### 7.2 Intégration dans StepContexte

```typescript
// Mise à jour de StepContexte.tsx
import { useGeneration } from '@/hooks/useGeneration';
import { GenerationLoader } from '@/components/automate/GenerationLoader';

export const StepContexte: React.FC<StepContexteProps> = ({
  data,
  onChange,
  onNext,
  onFicheGenerated,
}) => {
  const { generate, isLoading, progress } = useGeneration({
    onSuccess: (result) => {
      onFicheGenerated(result.data);
      onNext();
    },
  });

  const handleGenerateFiche = async () => {
    await generate('fiche', { contexte: data });
  };

  return (
    <>
      <GenerationLoader
        isLoading={isLoading}
        type="fiche"
        progress={progress}
      />

      {/* ... formulaire existant ... */}

      <button
        onClick={handleGenerateFiche}
        disabled={isLoading}
        className="..."
      >
        {isLoading ? 'Génération en cours...' : 'Générer la fiche pédagogique'}
      </button>
    </>
  );
};
```

---

## Résumé des Librairies

| Catégorie | Librairie | Usage |
|-----------|-----------|-------|
| **IA** | `ai` (Vercel AI SDK) | Intégration Claude/GPT/Gemini |
| **IA** | `@ai-sdk/anthropic` | Provider Claude |
| **IA** | `@ai-sdk/openai` | Provider OpenAI |
| **IA** | `@ai-sdk/google` | Provider Gemini |
| **BDD** | `prisma` | ORM TypeScript |
| **PDF** | `@react-pdf/renderer` | Génération PDF |
| **Storage** | `@supabase/supabase-js` | Stockage fichiers |
| **Animation** | `framer-motion` | Animations loading |
| **Validation** | `zod` | Validation schémas |
| **Background Jobs** | `inngest` | Tâches longues |

---

## Checklist de Déploiement

- [ ] Configurer PostgreSQL (Supabase, Railway, ou Neon)
- [ ] Créer bucket Supabase Storage
- [ ] Obtenir clé API Anthropic (Claude)
- [ ] Obtenir clé API Gamma (si disponible)
- [ ] Configurer variables d'environnement Vercel
- [ ] Initialiser Prisma et migrer la BDD
- [ ] Déployer sur Vercel

---

## Estimation de Coûts Mensuels

| Service | Estimation |
|---------|------------|
| Vercel Pro | 20€/mois |
| Supabase (Pro) | 25€/mois |
| Claude API | ~50-100€/mois (selon usage) |
| Gamma API | À voir selon pricing |
| **Total** | **~100-150€/mois** |
