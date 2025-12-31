// ===========================================
// API: AUDIT QUALIOPI
// GET /api/qualiopi/audit - Liste des audits
// POST /api/qualiopi/audit - Créer un audit ou simulation
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import {
  simulerAudit,
  analyserConformiteOrganisation,
} from "@/lib/services/qualiopi";

// Helper pour créer le client Supabase
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

// ===========================================
// GET - Liste des audits
// ===========================================

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les audits
    const audits = await prisma.auditQualiopi.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { dateAudit: "desc" },
      include: {
        indicateurs: {
          select: {
            numeroIndicateur: true,
            status: true,
            score: true,
          },
        },
      },
    });

    // Formater les résultats
    const auditsFormatted = audits.map((audit) => ({
      id: audit.id,
      type: audit.type,
      dateAudit: audit.dateAudit,
      auditeur: audit.auditeur,
      resultat: audit.resultat,
      scoreGlobal: audit.scoreGlobal,
      indicateursConformes: audit.indicateursConformes,
      indicateursTotal: audit.indicateursTotal,
      notes: audit.notes,
      rapportUrl: audit.rapportUrl,
      indicateurs: audit.indicateurs,
      createdAt: audit.createdAt,
    }));

    return NextResponse.json({
      audits: auditsFormatted,
      total: audits.length,
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/audit error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Créer un audit ou simulation
// ===========================================

export async function POST(request: NextRequest) {
  try {
    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, dateAudit, auditeur, isSimulation } = body;

    if (isSimulation) {
      // Lancer une simulation d'audit
      const simulation = await simulerAudit(dbUser.organizationId);

      // Sauvegarder la simulation
      const { score } = await analyserConformiteOrganisation(
        dbUser.organizationId
      );

      const audit = await prisma.auditQualiopi.create({
        data: {
          organizationId: dbUser.organizationId,
          type: "SIMULATION",
          dateAudit: new Date(),
          resultat: score.scoreGlobal >= 80 ? "REUSSI" : "PARTIEL",
          scoreGlobal: score.scoreGlobal,
          indicateursConformes: score.indicateursConformes,
          indicateursTotal: 32,
          notes: simulation.rapport,
          pointsForts: simulation.pointsForts.map((p) => ({
            description: p,
          })),
          pointsAmeliorer: simulation.pointsAmeliorer.map((p) => ({
            description: p,
            priorite: "MOYENNE",
          })),
        },
      });

      return NextResponse.json({
        audit,
        simulation: {
          rapport: simulation.rapport,
          pointsForts: simulation.pointsForts,
          pointsAmeliorer: simulation.pointsAmeliorer,
          risques: simulation.risques,
          score: simulation.score,
        },
      });
    }

    // Créer un audit réel planifié
    if (!type || !dateAudit) {
      return NextResponse.json(
        { error: "Type et date d'audit requis" },
        { status: 400 }
      );
    }

    const audit = await prisma.auditQualiopi.create({
      data: {
        organizationId: dbUser.organizationId,
        type,
        dateAudit: new Date(dateAudit),
        auditeur,
        resultat: "EN_ATTENTE",
      },
    });

    return NextResponse.json(audit);
  } catch (error) {
    console.error("[API] POST /api/qualiopi/audit error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// PATCH - Modifier un audit (date, auditeur, etc.)
// ===========================================

export async function PATCH(request: NextRequest) {
  try {
    // Authentification
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { auditId, dateAudit, auditeur, type } = body;

    if (!auditId) {
      return NextResponse.json(
        { error: "ID de l'audit requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'audit appartient à l'organisation
    const existingAudit = await prisma.auditQualiopi.findFirst({
      where: {
        id: auditId,
        organizationId: dbUser.organizationId,
      },
    });

    if (!existingAudit) {
      return NextResponse.json(
        { error: "Audit non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour l'audit
    const updatedAudit = await prisma.auditQualiopi.update({
      where: { id: auditId },
      data: {
        ...(dateAudit && { dateAudit: new Date(dateAudit) }),
        ...(auditeur !== undefined && { auditeur }),
        ...(type && { type }),
      },
    });

    return NextResponse.json(updatedAudit);
  } catch (error) {
    console.error("[API] PATCH /api/qualiopi/audit error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
