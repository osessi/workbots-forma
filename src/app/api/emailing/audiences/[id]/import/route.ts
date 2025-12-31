// ===========================================
// API IMPORT CONTACTS CSV
// POST /api/emailing/audiences/[id]/import
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

// Parser CSV basique
function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Première ligne = en-têtes
  const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;]/).map((v) => v.trim().replace(/"/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

// Mapper les colonnes CSV vers nos champs
function mapCSVRow(row: Record<string, string>): {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, string>;
} {
  // Chercher l'email
  const emailKeys = ["email", "e-mail", "mail", "adresse email", "courriel"];
  const email = emailKeys.map((k) => row[k]).find((v) => v && v.includes("@"));

  // Chercher le prénom
  const firstNameKeys = ["prenom", "prénom", "firstname", "first_name", "first name"];
  const firstName = firstNameKeys.map((k) => row[k]).find((v) => v);

  // Chercher le nom
  const lastNameKeys = ["nom", "lastname", "last_name", "last name", "name"];
  const lastName = lastNameKeys.map((k) => row[k]).find((v) => v);

  // Chercher le téléphone
  const phoneKeys = ["telephone", "téléphone", "phone", "tel", "mobile"];
  const phone = phoneKeys.map((k) => row[k]).find((v) => v);

  // Tags
  const tagsKeys = ["tags", "tag", "labels", "label"];
  const tagsValue = tagsKeys.map((k) => row[k]).find((v) => v);
  const tags = tagsValue ? tagsValue.split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : [];

  // Tous les autres champs comme customFields
  const usedKeys = [...emailKeys, ...firstNameKeys, ...lastNameKeys, ...phoneKeys, ...tagsKeys];
  const customFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!usedKeys.includes(key) && value) {
      customFields[key] = value;
    }
  }

  return {
    email: email?.toLowerCase().trim(),
    firstName,
    lastName,
    phone,
    tags: tags.length > 0 ? tags : undefined,
    customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: audienceId } = await params;
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true, isSuperAdmin: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier l'accès à l'audience
    const audience = await prisma.emailAudience.findFirst({
      where: {
        id: audienceId,
        OR: [
          { organizationId: dbUser.organizationId },
          ...(dbUser.isSuperAdmin ? [{ organizationId: null }] : []),
        ],
      },
    });

    if (!audience) {
      return NextResponse.json({ error: "Audience non trouvée" }, { status: 404 });
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const updateExisting = formData.get("updateExisting") === "true";
    const defaultTags = formData.get("defaultTags")?.toString();

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    // Lire le contenu
    const content = await file.text();
    const rows = parseCSV(content);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Fichier vide ou invalide" }, { status: 400 });
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    const tagsToAdd = defaultTags
      ? defaultTags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    for (const row of rows) {
      const mapped = mapCSVRow(row);

      if (!mapped.email) {
        skipped++;
        continue;
      }

      // Valider l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(mapped.email)) {
        errors.push(`Email invalide: ${mapped.email}`);
        skipped++;
        continue;
      }

      try {
        // Vérifier si le contact existe
        const existing = await prisma.emailAudienceContact.findUnique({
          where: {
            audienceId_email: {
              audienceId,
              email: mapped.email,
            },
          },
        });

        if (existing) {
          if (updateExisting) {
            await prisma.emailAudienceContact.update({
              where: { id: existing.id },
              data: {
                firstName: mapped.firstName || existing.firstName,
                lastName: mapped.lastName || existing.lastName,
                phone: mapped.phone || existing.phone,
                customFields: mapped.customFields || existing.customFields,
                tags: [...new Set([...(existing.tags || []), ...(mapped.tags || []), ...tagsToAdd])],
              },
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await prisma.emailAudienceContact.create({
            data: {
              audienceId,
              email: mapped.email,
              firstName: mapped.firstName,
              lastName: mapped.lastName,
              phone: mapped.phone,
              customFields: mapped.customFields,
              tags: [...(mapped.tags || []), ...tagsToAdd],
              source: "import_csv",
              status: "ACTIVE",
              optInAt: new Date(),
              optInSource: "import_csv",
            },
          });
          added++;
        }
      } catch (err) {
        console.error(`Erreur import ${mapped.email}:`, err);
        errors.push(`Erreur pour ${mapped.email}`);
        skipped++;
      }
    }

    // Mettre à jour les compteurs
    const [totalCount, activeCount] = await Promise.all([
      prisma.emailAudienceContact.count({ where: { audienceId } }),
      prisma.emailAudienceContact.count({ where: { audienceId, status: "ACTIVE" } }),
    ]);

    await prisma.emailAudience.update({
      where: { id: audienceId },
      data: { contactCount: totalCount, activeCount },
    });

    return NextResponse.json({
      success: true,
      processed: rows.length,
      added,
      updated,
      skipped,
      total: totalCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      hasMoreErrors: errors.length > 10,
    });
  } catch (error) {
    console.error("[API] POST /api/emailing/audiences/[id]/import error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
