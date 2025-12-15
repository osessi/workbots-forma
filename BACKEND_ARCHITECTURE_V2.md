# Architecture Backend V2 - Automate SaaS Multi-Tenant

## Vue d'ensemble du Système

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN (Toi)                                │
│  • Gestion des organisations (clients)                                  │
│  • Création de templates de documents                                   │
│  • Configuration des clés API globales                                  │
│  • Impersonation (connexion en 1 clic)                                  │
│  • Analytics globales                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│   ORGANISATION A     │ │   ORGANISATION B     │ │   ORGANISATION C     │
│   (Client Marque     │ │   (Client Marque     │ │   (Client Direct)    │
│    Blanche)          │ │    Blanche)          │ │                      │
│                      │ │                      │ │                      │
│  Admin Org:          │ │  Admin Org:          │ │  Admin Org:          │
│  • Gère formateurs   │ │  • Gère formateurs   │ │  • Gère formateurs   │
│  • Voit analytics    │ │  • Voit analytics    │ │  • Voit analytics    │
│  • Config propre     │ │  • Config propre     │ │  • Config propre     │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
          │                       │                       │
    ┌─────┴─────┐           ┌─────┴─────┐           ┌─────┴─────┐
    ▼           ▼           ▼           ▼           ▼           ▼
┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐
│Form. 1│ │Form. 2│   │Form. 1│ │Form. 2│   │Form. 1│ │Form. 2│
│       │ │       │   │       │ │       │   │       │ │       │
│Voit   │ │Voit   │   │Voit   │ │Voit   │   │Voit   │ │Voit   │
│SEUL.  │ │SEUL.  │   │SEUL.  │ │SEUL.  │   │SEUL.  │ │SEUL.  │
│ses    │ │ses    │   │ses    │ │ses    │   │ses    │ │ses    │
│données│ │données│   │données│ │données│   │données│ │données│
└───────┘ └───────┘   └───────┘ └───────┘   └───────┘ └───────┘
```

---

## Hiérarchie des Rôles

| Rôle | Accès | Capacités |
|------|-------|-----------|
| **super_admin** | Tout | Tout + impersonation + config globale |
| **org_admin** | Son organisation | Gère ses formateurs, voit toutes les formations de son org |
| **formateur** | Ses données uniquement | Crée/édite ses propres formations |

---

## Stack Technique Complète

| Besoin | Solution | Justification |
|--------|----------|---------------|
| **Framework** | Next.js 16 (App Router) | Déjà en place |
| **Auth** | Supabase Auth + RLS | Multi-tenant natif |
| **BDD** | Supabase (PostgreSQL) | RLS pour isolation |
| **Storage** | Supabase Storage | Buckets par org |
| **IA** | Vercel AI SDK | Gratuit, multi-provider |
| **Éditeur docs** | TipTap ou Plate.js | WYSIWYG comme Word |
| **PDF Export** | @react-pdf/renderer | Templates React |
| **DOCX Export** | docx.js | Export Word natif |
| **Slides** | Gamma API | Présentations pro |
| **Prévisualisation** | react-doc-viewer | PDF/DOCX preview |
| **Background Jobs** | Supabase Edge Functions + pg_cron | Tâches longues |

---

## Phase 1 : Schéma Base de Données Multi-Tenant

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// MULTI-TENANT : ORGANISATIONS
// ============================================

model Organization {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique  // pour URL marque blanche: monorg.automate.fr
  logo            String?
  primaryColor    String    @default("#4277FF")

  // Configuration marque blanche
  customDomain    String?   @unique  // formations.monentreprise.com
  whitelabelEnabled Boolean @default(false)

  // Limites du plan
  plan            Plan      @default(STARTER)
  maxFormateurs   Int       @default(5)
  maxFormations   Int       @default(50)

  // Relations
  users           User[]
  formations      Formation[]
  templates       Template[]  // Templates propres à l'org
  apiKeys         ApiKey[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum Plan {
  STARTER
  PROFESSIONAL
  ENTERPRISE
  UNLIMITED
}

// ============================================
// UTILISATEURS
// ============================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  supabaseId      String    @unique  // ID Supabase Auth

  // Profil
  firstName       String
  lastName        String
  avatar          String?
  phone           String?

  // Infos pro
  company         String?
  siret           String?
  vatNumber       String?
  address         String?
  city            String?
  postalCode      String?
  trainerNumber   String?   // N° déclaration formateur

  // Rôle et organisation
  role            UserRole  @default(FORMATEUR)
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id])

  // Pour super_admin : peut impersonner
  canImpersonate  Boolean   @default(false)

  // Relations
  formations      Formation[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginAt     DateTime?
}

enum UserRole {
  SUPER_ADMIN     // Toi uniquement
  ORG_ADMIN       // Admin d'une organisation
  FORMATEUR       // Utilisateur standard
}

// ============================================
// FORMATIONS
// ============================================

model Formation {
  id              String    @id @default(cuid())

  // Appartenance multi-tenant
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  // Données de base
  title           String
  description     String?
  image           String?
  status          FormationStatus @default(DRAFT)

  // Contexte
  durationHours   Int?
  durationDays    Int?
  modality        String?   // Présentiel, Distanciel, Hybride
  price           Decimal?
  maxParticipants Int?

  // Contenu généré (JSON)
  fichePedagogique Json?

  // Relations
  modules         Module[]
  documents       Document[]
  participants    Participant[]

  currentStep     String    @default("contexte")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum FormationStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}

model Module {
  id              String    @id @default(cuid())
  formationId     String
  formation       Formation @relation(fields: [formationId], references: [id], onDelete: Cascade)

  title           String
  content         String[]
  order           Int

  // Documents générés
  slidesUrl       String?
  slidesContent   Json?     // Contenu éditable des slides
  supportUrl      String?
  supportContent  Json?     // Contenu éditable du support
  qcmContent      Json?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ============================================
// DOCUMENTS ÉDITABLES
// ============================================

model Document {
  id              String    @id @default(cuid())
  formationId     String
  formation       Formation @relation(fields: [formationId], references: [id], onDelete: Cascade)

  type            DocumentType
  name            String

  // Contenu éditable (TipTap JSON)
  content         Json

  // Fichier exporté
  exportedUrl     String?
  exportedFormat  String?   // pdf, docx

  // Template utilisé
  templateId      String?
  template        Template? @relation(fields: [templateId], references: [id])

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum DocumentType {
  FICHE_PEDAGOGIQUE
  CONVENTION
  CONTRAT
  PROGRAMME
  EMARGEMENT
  ATTESTATION
  EVALUATION
  REGLEMENT_INTERIEUR
  CUSTOM
}

// ============================================
// TEMPLATES (Créés par Super Admin)
// ============================================

model Template {
  id              String    @id @default(cuid())

  // Peut être global ou spécifique à une org
  organizationId  String?   // null = template global
  organization    Organization? @relation(fields: [organizationId], references: [id])

  name            String
  description     String?
  type            DocumentType

  // Contenu du template (TipTap JSON avec variables)
  content         Json

  // Variables disponibles dans ce template
  // Ex: {{formation.titre}}, {{entreprise.nom}}, {{date}}
  variables       String[]

  // Statut
  isActive        Boolean   @default(true)
  isDefault       Boolean   @default(false)  // Template par défaut pour ce type

  // Relations
  documents       Document[]

  createdBy       String    // ID du super_admin
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ============================================
// PARTICIPANTS
// ============================================

model Participant {
  id              String    @id @default(cuid())
  formationId     String
  formation       Formation @relation(fields: [formationId], references: [id], onDelete: Cascade)

  type            ParticipantType

  // Pour SALARIE
  firstName       String?
  lastName        String?
  email           String?
  address         String?
  city            String?
  postalCode      String?

  // Pour INDEPENDANT ou ENTREPRISE
  companyName     String?
  managerName     String?
  siret           String?
  companyAddress  String?

  createdAt       DateTime  @default(now())
}

enum ParticipantType {
  SALARIE
  INDEPENDANT
  ENTREPRISE
}

// ============================================
// CONFIGURATION
// ============================================

model ApiKey {
  id              String    @id @default(cuid())

  // Peut être global ou par org
  organizationId  String?
  organization    Organization? @relation(fields: [organizationId], references: [id])

  provider        String    // anthropic, openai, google, gamma
  key             String    // Chiffré en BDD
  isActive        Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model GlobalConfig {
  id              String    @id @default(cuid())
  key             String    @unique
  value           Json
  updatedAt       DateTime  @updatedAt
}

// ============================================
// AUDIT LOG (pour impersonation)
// ============================================

model AuditLog {
  id              String    @id @default(cuid())

  userId          String    // Qui a fait l'action
  targetUserId    String?   // Sur qui (si impersonation)

  action          String    // login, impersonate, create_formation, etc.
  details         Json?
  ipAddress       String?

  createdAt       DateTime  @default(now())
}
```

---

## Phase 2 : Row Level Security (RLS) Supabase

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES POUR FORMATIONS
-- ============================================

-- Super admin voit tout
CREATE POLICY "Super admin full access" ON formations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.supabase_id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Org admin voit toutes les formations de son org
CREATE POLICY "Org admin sees org formations" ON formations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.supabase_id = auth.uid()
      AND users.role = 'ORG_ADMIN'
      AND users.organization_id = formations.organization_id
    )
  );

-- Formateur voit uniquement ses formations
CREATE POLICY "Formateur sees own formations" ON formations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.supabase_id = auth.uid()
      AND users.id = formations.user_id
    )
  );

-- ============================================
-- POLICIES POUR TEMPLATES
-- ============================================

-- Tous peuvent voir les templates globaux actifs
CREATE POLICY "Everyone sees global templates" ON templates
  FOR SELECT
  USING (
    organization_id IS NULL AND is_active = true
  );

-- Org voit ses propres templates
CREATE POLICY "Org sees own templates" ON templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.supabase_id = auth.uid()
      AND users.organization_id = templates.organization_id
    )
  );

-- Seul super admin peut créer/modifier templates globaux
CREATE POLICY "Super admin manages global templates" ON templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.supabase_id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );
```

---

## Phase 3 : Système d'Impersonation (Super Admin)

### src/lib/auth/impersonation.ts

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

const IMPERSONATION_COOKIE = 'impersonating_user_id';

export async function startImpersonation(targetUserId: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // Vérifier que l'utilisateur actuel est super_admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const currentUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (currentUser?.role !== 'SUPER_ADMIN') {
    throw new Error('Seul le super admin peut impersonner');
  }

  // Vérifier que la cible existe
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { organization: true },
  });

  if (!targetUser) throw new Error('Utilisateur cible non trouvé');

  // Logger l'impersonation
  await prisma.auditLog.create({
    data: {
      userId: currentUser.id,
      targetUserId: targetUserId,
      action: 'impersonate_start',
      details: {
        targetEmail: targetUser.email,
        targetOrg: targetUser.organization?.name,
      },
    },
  });

  // Stocker l'ID impersonné dans un cookie sécurisé
  cookieStore.set(IMPERSONATION_COOKIE, targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 heure max
  });

  return { success: true, user: targetUser };
}

export async function stopImpersonation() {
  const cookieStore = cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
  return { success: true };
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Vérifier si on impersonne quelqu'un
  const impersonatingId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (impersonatingId) {
    // Vérifier que le vrai user est super_admin
    const realUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (realUser?.role === 'SUPER_ADMIN') {
      // Retourner l'utilisateur impersonné
      const impersonatedUser = await prisma.user.findUnique({
        where: { id: impersonatingId },
        include: { organization: true },
      });

      return {
        ...impersonatedUser,
        isImpersonated: true,
        realUserId: realUser.id,
      };
    }
  }

  // Retourner l'utilisateur normal
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { organization: true },
  });

  return { ...dbUser, isImpersonated: false };
}
```

### API Route pour impersonation

```typescript
// src/app/api/admin/impersonate/route.ts

import { startImpersonation, stopImpersonation } from '@/lib/auth/impersonation';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { targetUserId } = await request.json();
    const result = await startImpersonation(targetUserId);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur' },
      { status: 403 }
    );
  }
}

export async function DELETE() {
  const result = await stopImpersonation();
  return Response.json(result);
}
```

---

## Phase 4 : Éditeur de Documents WYSIWYG (TipTap)

### Installation

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-table @tiptap/extension-image @tiptap/extension-link @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight
```

### src/components/editor/DocumentEditor.tsx

```typescript
"use client";
import React, { useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

// Extension custom pour les variables de template
import { Node, mergeAttributes } from '@tiptap/core';

const TemplateVariable = Node.create({
  name: 'templateVariable',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      variable: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-variable': HTMLAttributes.variable,
      'class': 'template-variable',
    }), `{{${HTMLAttributes.variable}}}`];
  },
});

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  variables?: string[];  // Variables disponibles pour ce template
  readOnly?: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  content,
  onChange,
  variables = [],
  readOnly = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Commencez à écrire votre document...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TemplateVariable,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  const insertVariable = useCallback((variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent({
        type: 'templateVariable',
        attrs: { variable },
      }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="document-editor border border-gray-200 rounded-xl overflow-hidden dark:border-gray-700">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          {/* Formatage texte */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Gras"
            >
              <BoldIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italique"
            >
              <ItalicIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Souligné"
            >
              <UnderlineIcon />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Titre 1"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Titre 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Titre 3"
            >
              H3
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Alignement */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Aligner à gauche"
            >
              <AlignLeftIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Centrer"
            >
              <AlignCenterIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Aligner à droite"
            >
              <AlignRightIcon />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Listes */}
          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Liste à puces"
            >
              <ListIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Liste numérotée"
            >
              <ListOrderedIcon />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          {/* Table */}
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
            title="Insérer un tableau"
          >
            <TableIcon />
          </ToolbarButton>

          {/* Variables de template */}
          {variables.length > 0 && (
            <>
              <ToolbarDivider />
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      insertVariable(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option value="">Insérer une variable...</option>
                  {variables.map((v) => (
                    <option key={v} value={v}>{`{{${v}}}`}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Contenu éditable */}
      <div className="p-6 min-h-[500px] bg-white dark:bg-gray-900 prose prose-sm max-w-none dark:prose-invert">
        <EditorContent editor={editor} />
      </div>

      {/* Styles pour les variables */}
      <style jsx global>{`
        .template-variable {
          background: linear-gradient(135deg, #4277FF20, #4277FF10);
          border: 1px solid #4277FF40;
          border-radius: 4px;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 0.9em;
          color: #4277FF;
        }

        .ProseMirror {
          outline: none;
        }

        .ProseMirror table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }

        .ProseMirror td, .ProseMirror th {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }

        .ProseMirror th {
          background: #f5f5f5;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

// Composants utilitaires pour la toolbar
const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

const ToolbarGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-0.5">{children}</div>
);

const ToolbarDivider = () => (
  <div className="w-px h-6 bg-gray-200 mx-2 dark:bg-gray-700" />
);

// Icons (simplifiés - utiliser lucide-react en prod)
const BoldIcon = () => <span className="font-bold text-sm">B</span>;
const ItalicIcon = () => <span className="italic text-sm">I</span>;
const UnderlineIcon = () => <span className="underline text-sm">U</span>;
const AlignLeftIcon = () => <span className="text-xs">≡←</span>;
const AlignCenterIcon = () => <span className="text-xs">≡</span>;
const AlignRightIcon = () => <span className="text-xs">→≡</span>;
const ListIcon = () => <span className="text-xs">•••</span>;
const ListOrderedIcon = () => <span className="text-xs">123</span>;
const TableIcon = () => <span className="text-xs">⊞</span>;
```

---

## Phase 5 : Système de Templates

### Variables disponibles dans les templates

```typescript
// src/lib/templates/variables.ts

export const TEMPLATE_VARIABLES = {
  // Formation
  'formation.titre': 'Titre de la formation',
  'formation.description': 'Description',
  'formation.duree_heures': 'Durée en heures',
  'formation.duree_jours': 'Durée en jours',
  'formation.modalite': 'Modalité (présentiel/distanciel)',
  'formation.prix': 'Prix de la formation',
  'formation.max_participants': 'Nombre max de participants',

  // Objectifs (liste)
  'formation.objectifs': 'Liste des objectifs pédagogiques',

  // Modules
  'modules': 'Liste des modules avec contenu',

  // Entreprise cliente
  'entreprise.nom': 'Raison sociale',
  'entreprise.siret': 'Numéro SIRET',
  'entreprise.adresse': 'Adresse complète',
  'entreprise.dirigeant': 'Nom du dirigeant',

  // Participants
  'participants': 'Liste des participants',

  // Formateur
  'formateur.nom': 'Nom du formateur',
  'formateur.prenom': 'Prénom du formateur',
  'formateur.entreprise': 'Organisme de formation',
  'formateur.siret': 'SIRET organisme',
  'formateur.numero_da': 'N° déclaration d\'activité',
  'formateur.adresse': 'Adresse organisme',

  // Dates
  'date.jour': 'Date du jour (01/01/2025)',
  'date.jour_lettres': 'Date en lettres',
  'formation.date_debut': 'Date de début',
  'formation.date_fin': 'Date de fin',

  // Signatures
  'signature.formateur': 'Zone signature formateur',
  'signature.client': 'Zone signature client',
};

export const getVariablesForDocumentType = (type: DocumentType): string[] => {
  const base = [
    'formation.titre',
    'date.jour',
    'formateur.nom',
    'formateur.entreprise',
  ];

  switch (type) {
    case 'CONVENTION':
    case 'CONTRAT':
      return [
        ...base,
        'formation.description',
        'formation.duree_heures',
        'formation.duree_jours',
        'formation.prix',
        'formation.modalite',
        'formation.date_debut',
        'formation.date_fin',
        'entreprise.nom',
        'entreprise.siret',
        'entreprise.adresse',
        'entreprise.dirigeant',
        'formateur.siret',
        'formateur.numero_da',
        'formateur.adresse',
        'participants',
        'signature.formateur',
        'signature.client',
      ];

    case 'FICHE_PEDAGOGIQUE':
      return [
        ...base,
        'formation.description',
        'formation.objectifs',
        'formation.duree_heures',
        'formation.modalite',
        'formation.max_participants',
        'modules',
      ];

    case 'ATTESTATION':
      return [
        ...base,
        'formation.duree_heures',
        'formation.date_debut',
        'formation.date_fin',
        'participants',
        'formateur.numero_da',
        'signature.formateur',
      ];

    default:
      return base;
  }
};
```

### Moteur de rendu des variables

```typescript
// src/lib/templates/renderer.ts

interface RenderContext {
  formation: Formation & { modules: Module[] };
  entreprise?: {
    nom: string;
    siret: string;
    adresse: string;
    dirigeant: string;
  };
  participants?: Participant[];
  formateur: User;
}

export function renderTemplate(
  templateContent: string,
  context: RenderContext
): string {
  let rendered = templateContent;

  // Remplacer les variables simples
  const replacements: Record<string, string> = {
    'formation.titre': context.formation.title,
    'formation.description': context.formation.description || '',
    'formation.duree_heures': String(context.formation.durationHours || ''),
    'formation.duree_jours': String(context.formation.durationDays || ''),
    'formation.modalite': context.formation.modality || '',
    'formation.prix': context.formation.price?.toString() || '',
    'formation.max_participants': String(context.formation.maxParticipants || ''),

    'entreprise.nom': context.entreprise?.nom || '',
    'entreprise.siret': context.entreprise?.siret || '',
    'entreprise.adresse': context.entreprise?.adresse || '',
    'entreprise.dirigeant': context.entreprise?.dirigeant || '',

    'formateur.nom': context.formateur.lastName,
    'formateur.prenom': context.formateur.firstName,
    'formateur.entreprise': context.formateur.company || '',
    'formateur.siret': context.formateur.siret || '',
    'formateur.numero_da': context.formateur.trainerNumber || '',
    'formateur.adresse': `${context.formateur.address || ''}, ${context.formateur.postalCode || ''} ${context.formateur.city || ''}`,

    'date.jour': new Date().toLocaleDateString('fr-FR'),
    'date.jour_lettres': new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  // Remplacer chaque variable
  for (const [variable, value] of Object.entries(replacements)) {
    rendered = rendered.replace(
      new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
      value
    );
  }

  // Gérer les listes (objectifs, modules, participants)
  // ... logique plus complexe pour les boucles

  return rendered;
}
```

---

## Phase 6 : Dashboard Super Admin

### Structure des pages admin

```
src/app/(admin)/admin/
├── layout.tsx              # Layout admin avec vérification super_admin
├── page.tsx                # Dashboard analytics global
├── organizations/
│   ├── page.tsx            # Liste des organisations
│   └── [id]/page.tsx       # Détail organisation
├── users/
│   ├── page.tsx            # Liste tous les utilisateurs
│   └── [id]/page.tsx       # Détail utilisateur + bouton impersonate
├── templates/
│   ├── page.tsx            # Liste des templates
│   ├── new/page.tsx        # Créer un template
│   └── [id]/page.tsx       # Éditer un template
├── api-keys/
│   └── page.tsx            # Gérer les clés API globales
└── settings/
    └── page.tsx            # Configuration globale
```

### Composant liste utilisateurs avec impersonation

```typescript
// src/app/(admin)/admin/users/page.tsx

"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const handleImpersonate = async (userId: string) => {
    setImpersonating(userId);
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (response.ok) {
        // Rediriger vers le dashboard de l'utilisateur
        router.push('/automate');
        router.refresh();
      }
    } catch (error) {
      console.error('Erreur impersonation:', error);
    } finally {
      setImpersonating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <input
          type="search"
          placeholder="Rechercher..."
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Organisation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Formations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.organization?.name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'ORG_ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user._count?.formations || 0}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Voir
                    </button>
                    <button
                      onClick={() => handleImpersonate(user.id)}
                      disabled={impersonating === user.id}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
                    >
                      {impersonating === user.id ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          Connexion...
                        </span>
                      ) : (
                        'Se connecter'
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Bandeau d'impersonation

```typescript
// src/components/admin/ImpersonationBanner.tsx

"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

interface ImpersonationBannerProps {
  impersonatedUser: {
    firstName: string;
    lastName: string;
    email: string;
    organization?: { name: string };
  };
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  impersonatedUser,
}) => {
  const router = useRouter();

  const handleStopImpersonation = async () => {
    await fetch('/api/admin/impersonate', { method: 'DELETE' });
    router.push('/admin/users');
    router.refresh();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <span className="font-medium">
            Vous êtes connecté en tant que{' '}
            <strong>{impersonatedUser.firstName} {impersonatedUser.lastName}</strong>
            {impersonatedUser.organization && (
              <span className="opacity-75"> ({impersonatedUser.organization.name})</span>
            )}
          </span>
        </div>
        <button
          onClick={handleStopImpersonation}
          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Quitter ce compte
        </button>
      </div>
    </div>
  );
};
```

---

## Phase 7 : Export Documents (PDF + DOCX)

### Export PDF

```typescript
// src/lib/export/pdf.ts

import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Enregistrer les fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#4277FF',
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  // ... autres styles
});

export async function generatePDFFromEditor(
  editorContent: any, // TipTap JSON
  metadata: { title: string; author: string }
): Promise<Buffer> {
  // Convertir le contenu TipTap en composants React-PDF
  const content = convertTipTapToPDF(editorContent);

  const PDFDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        {content}
      </Page>
    </Document>
  );

  return renderToBuffer(PDFDocument);
}

function convertTipTapToPDF(node: any): React.ReactNode {
  // Conversion récursive du JSON TipTap vers React-PDF
  // ... logique de conversion
}
```

### Export DOCX

```bash
npm install docx
```

```typescript
// src/lib/export/docx.ts

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell } from 'docx';

export async function generateDOCXFromEditor(
  editorContent: any, // TipTap JSON
  metadata: { title: string; author: string }
): Promise<Buffer> {
  const children = convertTipTapToDocx(editorContent);

  const doc = new Document({
    creator: metadata.author,
    title: metadata.title,
    sections: [{
      properties: {},
      children,
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

function convertTipTapToDocx(node: any): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  if (!node.content) return elements;

  for (const child of node.content) {
    switch (child.type) {
      case 'paragraph':
        elements.push(new Paragraph({
          children: child.content?.map((textNode: any) =>
            new TextRun({
              text: textNode.text || '',
              bold: textNode.marks?.some((m: any) => m.type === 'bold'),
              italics: textNode.marks?.some((m: any) => m.type === 'italic'),
              underline: textNode.marks?.some((m: any) => m.type === 'underline')
                ? {}
                : undefined,
            })
          ) || [],
        }));
        break;

      case 'heading':
        const level = child.attrs?.level || 1;
        elements.push(new Paragraph({
          heading: level === 1 ? HeadingLevel.HEADING_1
                 : level === 2 ? HeadingLevel.HEADING_2
                 : HeadingLevel.HEADING_3,
          children: [new TextRun({ text: child.content?.[0]?.text || '' })],
        }));
        break;

      case 'table':
        elements.push(convertTableToDocx(child));
        break;

      // ... autres types
    }
  }

  return elements;
}

function convertTableToDocx(tableNode: any): Table {
  const rows = tableNode.content?.map((row: any) =>
    new TableRow({
      children: row.content?.map((cell: any) =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell.content?.[0]?.content?.[0]?.text || '' })],
          })],
        })
      ) || [],
    })
  ) || [];

  return new Table({ rows });
}
```

---

## Phase 8 : Prévisualisation Documents

```bash
npm install @react-pdf-viewer/core @react-pdf-viewer/default-layout
```

```typescript
// src/components/preview/DocumentPreview.tsx

"use client";
import React, { useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface DocumentPreviewProps {
  url: string;
  type: 'pdf' | 'docx';
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ url, type }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  if (type === 'pdf') {
    return (
      <div className="h-[700px] border border-gray-200 rounded-xl overflow-hidden">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={url}
            plugins={[defaultLayoutPluginInstance]}
          />
        </Worker>
      </div>
    );
  }

  // Pour DOCX, utiliser un iframe avec Office Online ou Google Docs Viewer
  if (type === 'docx') {
    return (
      <div className="h-[700px] border border-gray-200 rounded-xl overflow-hidden">
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
          className="w-full h-full"
          frameBorder="0"
        />
      </div>
    );
  }

  return null;
};
```

---

## Résumé des Librairies (Mise à jour)

| Catégorie | Librairie | Coût |
|-----------|-----------|------|
| **Auth** | Supabase Auth | Gratuit (50k MAU) |
| **BDD** | Supabase PostgreSQL | Gratuit (500MB) |
| **Storage** | Supabase Storage | Gratuit (1GB) |
| **IA** | Vercel AI SDK | Gratuit (SDK) |
| **IA Providers** | Claude/OpenAI/Gemini | Payant (usage) |
| **Éditeur WYSIWYG** | TipTap | Gratuit (open source) |
| **PDF Generation** | @react-pdf/renderer | Gratuit |
| **DOCX Generation** | docx | Gratuit |
| **PDF Preview** | @react-pdf-viewer | Gratuit |
| **Slides** | Gamma API | Payant (selon plan) |

---

## Plan d'Action Révisé

### Sprint 1 (Setup - 1 semaine)
- [ ] Configurer Supabase (Auth + DB + Storage)
- [ ] Créer le schéma Prisma multi-tenant
- [ ] Configurer RLS policies
- [ ] Créer les API routes d'auth

### Sprint 2 (Multi-tenant - 1 semaine)
- [ ] Implémenter le système de rôles
- [ ] Créer le middleware de vérification org
- [ ] Dashboard super admin basique
- [ ] Système d'impersonation

### Sprint 3 (Éditeur Documents - 2 semaines)
- [ ] Intégrer TipTap
- [ ] Créer les composants toolbar
- [ ] Système de variables/templates
- [ ] Export PDF + DOCX

### Sprint 4 (Templates - 1 semaine)
- [ ] CRUD templates (super admin)
- [ ] Moteur de rendu variables
- [ ] Templates par défaut pour chaque type

### Sprint 5 (IA + Gamma - 2 semaines)
- [ ] Intégrer Vercel AI SDK
- [ ] API génération fiche pédagogique
- [ ] Intégration Gamma pour slides
- [ ] Animations de chargement

### Sprint 6 (Finitions - 1 semaine)
- [ ] Tests end-to-end
- [ ] Optimisations performance
- [ ] Documentation
- [ ] Déploiement

**Total estimé : 8-10 semaines**
