// ===========================================
// API: EXPORT DOSSIER D'AUDIT QUALIOPI
// POST /api/qualiopi/audit/export-dossier - Exporte le dossier complet
// GET /api/qualiopi/audit/export-dossier - Info sur le dernier export
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { analyserConformiteOrganisation } from "@/lib/services/qualiopi";

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
// GET - Info sur les exports disponibles
// ===========================================

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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

    // Récupérer l'organisation avec ses infos
    const organization = await prisma.organization.findUnique({
      where: { id: dbUser.organizationId },
      select: {
        id: true,
        name: true,
        numeroDeclaration: true,
        qualiopiCertifie: true,
        qualiopiDateObtention: true,
        qualiopiDateRenouvellement: true,
      },
    });

    // Compter les indicateurs et leur statut
    const indicateurs = await prisma.indicateurConformite.findMany({
      where: { organizationId: dbUser.organizationId },
      select: { status: true, score: true },
    });

    // Compter les preuves
    const preuves = await prisma.preuveQualiopi.count({
      where: { organizationId: dbUser.organizationId },
    });

    // Dernier audit
    const dernierAudit = await prisma.auditQualiopi.findFirst({
      where: { organizationId: dbUser.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        dateAudit: true,
        resultat: true,
        scoreGlobal: true,
      },
    });

    const conformes = indicateurs.filter((i) => i.status === "CONFORME").length;
    const enCours = indicateurs.filter((i) => i.status === "EN_COURS").length;
    const nonConformes = indicateurs.filter((i) => i.status === "NON_CONFORME").length;

    return NextResponse.json({
      organisation: organization,
      resume: {
        indicateursTotal: indicateurs.length,
        conformes,
        enCours,
        nonConformes,
        aEvaluer: indicateurs.length - conformes - enCours - nonConformes,
        preuvesTotal: preuves,
        scoreGlobal: indicateurs.length > 0
          ? Math.round(indicateurs.reduce((acc, i) => acc + (i.score || 0), 0) / indicateurs.length)
          : 0,
      },
      dernierAudit,
      formatsDisponibles: ["pdf", "zip", "excel"],
      sections: [
        { id: "synthese", nom: "Synthèse globale", description: "Vue d'ensemble de la conformité" },
        { id: "indicateurs", nom: "Détail par indicateur", description: "32 indicateurs avec preuves" },
        { id: "preuves", nom: "Preuves documentaires", description: "Tous les documents de preuve" },
        { id: "actions", nom: "Plan d'actions", description: "Actions correctives en cours" },
        { id: "historique", nom: "Historique audits", description: "Résultats des audits passés" },
      ],
    });
  } catch (error) {
    console.error("[API] GET /api/qualiopi/audit/export-dossier error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ===========================================
// POST - Générer l'export du dossier
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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
    const { format = "pdf", sections = ["synthese", "indicateurs", "preuves"] } = body;

    const organizationId = dbUser.organizationId;

    // Récupérer l'organisation
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        indicateursConformite: {
          orderBy: { numeroIndicateur: "asc" },
          include: {
            preuves: true,
            actionsCorrectivesAssociees: {
              where: { status: { not: "TERMINEE" } },
            },
          },
        },
        preuvesQualiopi: {
          orderBy: { createdAt: "desc" },
        },
        auditsQualiopi: {
          orderBy: { dateAudit: "desc" },
          take: 10,
        },
        alertesQualiopi: {
          where: { estResolue: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Analyser la conformité actuelle
    const { score, analyses } = await analyserConformiteOrganisation(organizationId);

    // Construire le dossier d'export
    const dossierData = {
      metadata: {
        dateExport: new Date().toISOString(),
        format,
        sectionsIncluses: sections,
        version: "1.0",
      },
      organisation: {
        nom: organization.name,
        numeroDeclaration: organization.numeroDeclaration,
        certifie: organization.qualiopiCertifie,
        dateObtention: organization.qualiopiDateObtention,
        dateRenouvellement: organization.qualiopiDateRenouvellement,
      },
      synthese: sections.includes("synthese") ? {
        scoreGlobal: score.scoreGlobal,
        indicateursConformes: score.indicateursConformes,
        indicateursTotal: score.indicateursTotal,
        criteresConformes: score.criteresConformes,
        parCritere: score.parCritere,
        dateAnalyse: new Date().toISOString(),
      } : null,
      indicateurs: sections.includes("indicateurs") ? analyses.map((a) => ({
        numero: a.numero,
        critere: a.critere,
        status: a.status,
        score: a.score,
        description: a.description,
        preuvesCount: organization.indicateursConformite.find(
          (i) => i.numeroIndicateur === a.numero
        )?.preuves.length || 0,
        actionsEnCours: organization.indicateursConformite.find(
          (i) => i.numeroIndicateur === a.numero
        )?.actionsCorrectivesAssociees.length || 0,
      })) : null,
      preuves: sections.includes("preuves") ? organization.preuvesQualiopi.map((p) => ({
        id: p.id,
        nom: p.nom,
        type: p.type,
        indicateur: p.numeroIndicateur,
        dateCreation: p.createdAt,
        url: p.url,
      })) : null,
      actions: sections.includes("actions") ? organization.alertesQualiopi.map((a) => ({
        id: a.id,
        type: a.type,
        priorite: a.priorite,
        titre: a.titre,
        indicateur: a.indicateur,
        dateCreation: a.createdAt,
      })) : null,
      historique: sections.includes("historique") ? organization.auditsQualiopi.map((a) => ({
        id: a.id,
        type: a.type,
        date: a.dateAudit,
        resultat: a.resultat,
        score: a.scoreGlobal,
        auditeur: a.auditeur,
      })) : null,
    };

    // Pour le format JSON, retourner directement les données
    if (format === "json") {
      return NextResponse.json({
        success: true,
        dossier: dossierData,
      });
    }

    // Pour PDF ou ZIP, rediriger vers la route /api/qualiopi/preuves avec full=true
    // qui génère déjà le dossier complet
    if (format === "zip") {
      return NextResponse.json({
        success: true,
        message: "Utilisez POST /api/qualiopi/preuves avec { full: true } pour télécharger le ZIP complet",
        redirectUrl: "/api/qualiopi/preuves",
        dossier: dossierData,
      });
    }

    // Format PDF - retourner les données structurées pour génération côté client
    return NextResponse.json({
      success: true,
      format,
      dossier: dossierData,
    });
  } catch (error) {
    console.error("[API] POST /api/qualiopi/audit/export-dossier error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
