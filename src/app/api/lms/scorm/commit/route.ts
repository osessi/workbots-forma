
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Types pour les données CMI SCORM
interface SCORM12Data {
  "cmi.core.lesson_status"?: string;
  "cmi.core.lesson_location"?: string;
  "cmi.core.score.raw"?: string;
  "cmi.core.score.min"?: string;
  "cmi.core.score.max"?: string;
  "cmi.core.session_time"?: string;
  "cmi.core.total_time"?: string;
  "cmi.core.exit"?: string;
  "cmi.core.entry"?: string;
  "cmi.suspend_data"?: string;
  [key: string]: string | undefined;
}

interface SCORM2004Data {
  "cmi.completion_status"?: string;
  "cmi.success_status"?: string;
  "cmi.lesson_status"?: string;
  "cmi.location"?: string;
  "cmi.score.raw"?: string;
  "cmi.score.min"?: string;
  "cmi.score.max"?: string;
  "cmi.score.scaled"?: string;
  "cmi.session_time"?: string;
  "cmi.total_time"?: string;
  "cmi.exit"?: string;
  "cmi.entry"?: string;
  "cmi.suspend_data"?: string;
  "cmi.progress_measure"?: string;
  [key: string]: string | undefined;
}

// Convertir lesson_status SCORM 1.2 vers notre enum
function mapLessonStatusToEnum(status: string): "NOT_ATTEMPTED" | "INCOMPLETE" | "COMPLETED" | "PASSED" | "FAILED" | "BROWSED" {
  switch (status?.toLowerCase()) {
    case "passed":
      return "PASSED";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "incomplete":
      return "INCOMPLETE";
    case "browsed":
      return "BROWSED";
    case "not attempted":
    default:
      return "NOT_ATTEMPTED";
  }
}

// POST - Commit des données SCORM (appelé par le player)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ result: false, errorCode: 401 }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ result: false, errorCode: 404 }, { status: 404 });
    }

    const body = await request.json();
    const { packageId, apprenantId, inscriptionId, cmi, attemptNumber = 1 } = body;

    if (!packageId || !apprenantId) {
      return NextResponse.json(
        { result: false, errorCode: 400, message: "packageId et apprenantId requis" },
        { status: 400 }
      );
    }

    // Vérifier que le package existe
    const scormPackage = await prisma.sCORMPackage.findFirst({
      where: {
        id: packageId,
        organizationId: user.organizationId,
      },
    });

    if (!scormPackage) {
      return NextResponse.json(
        { result: false, errorCode: 404, message: "Package non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'apprenant existe
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { result: false, errorCode: 404, message: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Extraire les données clés du CMI
    const cmiData = cmi as SCORM12Data | SCORM2004Data;
    const isScorm2004 = scormPackage.version === "SCORM_2004";

    // Déterminer le statut
    let lessonStatus = "NOT_ATTEMPTED";
    if (isScorm2004) {
      // SCORM 2004: combiner completion_status et success_status
      const completionStatus = cmiData["cmi.completion_status"];
      const successStatus = cmiData["cmi.success_status"];

      if (successStatus === "passed") {
        lessonStatus = "PASSED";
      } else if (successStatus === "failed") {
        lessonStatus = "FAILED";
      } else if (completionStatus === "completed") {
        lessonStatus = "COMPLETED";
      } else if (completionStatus === "incomplete") {
        lessonStatus = "INCOMPLETE";
      }
    } else {
      // SCORM 1.2
      lessonStatus = cmiData["cmi.core.lesson_status"] || "not attempted";
    }

    // Extraire les scores
    const scoreRaw = isScorm2004
      ? parseFloat(cmiData["cmi.score.raw"] || "")
      : parseFloat(cmiData["cmi.core.score.raw"] || "");
    const scoreMin = isScorm2004
      ? parseFloat(cmiData["cmi.score.min"] || "")
      : parseFloat(cmiData["cmi.core.score.min"] || "");
    const scoreMax = isScorm2004
      ? parseFloat(cmiData["cmi.score.max"] || "")
      : parseFloat(cmiData["cmi.core.score.max"] || "");
    const scoreScaled = isScorm2004
      ? parseFloat(cmiData["cmi.score.scaled"] || "")
      : undefined;

    // Extraire les temps
    const totalTime = isScorm2004
      ? cmiData["cmi.total_time"]
      : cmiData["cmi.core.total_time"];
    const sessionTime = isScorm2004
      ? cmiData["cmi.session_time"]
      : cmiData["cmi.core.session_time"];

    // Extraire les autres données
    const suspendData = cmiData["cmi.suspend_data"];
    const lessonLocation = isScorm2004
      ? cmiData["cmi.location"]
      : cmiData["cmi.core.lesson_location"];
    const entry = isScorm2004
      ? cmiData["cmi.entry"]
      : cmiData["cmi.core.entry"];
    const exit = isScorm2004
      ? cmiData["cmi.exit"]
      : cmiData["cmi.core.exit"];

    // Extraire les interactions si présentes (SCORM 2004)
    const interactions = extractInteractions(cmiData);
    const objectives = extractObjectives(cmiData);

    // Upsert les données de tracking
    const tracking = await prisma.sCORMTracking.upsert({
      where: {
        packageId_apprenantId_attemptNumber: {
          packageId,
          apprenantId,
          attemptNumber,
        },
      },
      create: {
        packageId,
        apprenantId,
        inscriptionId: inscriptionId || null,
        organizationId: user.organizationId,
        attemptNumber,
        cmiData: cmiData as any,
        lessonStatus: mapLessonStatusToEnum(lessonStatus),
        completionStatus: isScorm2004 ? cmiData["cmi.completion_status"] : null,
        successStatus: isScorm2004 ? cmiData["cmi.success_status"] : null,
        scoreRaw: isNaN(scoreRaw) ? null : scoreRaw,
        scoreMin: isNaN(scoreMin) ? null : scoreMin,
        scoreMax: isNaN(scoreMax) ? null : scoreMax,
        scoreScaled: scoreScaled && !isNaN(scoreScaled) ? scoreScaled : null,
        totalTime,
        sessionTime,
        suspendData,
        lessonLocation,
        entry,
        exit,
        interactions: interactions.length > 0 ? interactions : undefined,
        objectives: objectives.length > 0 ? objectives : undefined,
        completedAt: ["COMPLETED", "PASSED"].includes(mapLessonStatusToEnum(lessonStatus))
          ? new Date()
          : null,
      },
      update: {
        cmiData: cmiData as any,
        lessonStatus: mapLessonStatusToEnum(lessonStatus),
        completionStatus: isScorm2004 ? cmiData["cmi.completion_status"] : undefined,
        successStatus: isScorm2004 ? cmiData["cmi.success_status"] : undefined,
        scoreRaw: isNaN(scoreRaw) ? undefined : scoreRaw,
        scoreMin: isNaN(scoreMin) ? undefined : scoreMin,
        scoreMax: isNaN(scoreMax) ? undefined : scoreMax,
        scoreScaled: scoreScaled && !isNaN(scoreScaled) ? scoreScaled : undefined,
        totalTime,
        sessionTime,
        suspendData,
        lessonLocation,
        entry,
        exit,
        interactions: interactions.length > 0 ? interactions : undefined,
        objectives: objectives.length > 0 ? objectives : undefined,
        lastAccessAt: new Date(),
        completedAt: ["COMPLETED", "PASSED"].includes(mapLessonStatusToEnum(lessonStatus))
          ? new Date()
          : undefined,
      },
    });

    // Mettre à jour l'inscription LMS si liée
    if (inscriptionId) {
      await updateLMSInscription(inscriptionId, tracking);
    }

    return NextResponse.json({
      result: true,
      errorCode: 0,
      trackingId: tracking.id,
    });
  } catch (error) {
    console.error("Erreur commit SCORM:", error);
    return NextResponse.json(
      { result: false, errorCode: 500, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// GET - Récupérer les données SCORM pour un apprenant
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const apprenantId = searchParams.get("apprenantId");
    const attemptNumber = parseInt(searchParams.get("attemptNumber") || "1", 10);

    if (!packageId || !apprenantId) {
      return NextResponse.json(
        { error: "packageId et apprenantId requis" },
        { status: 400 }
      );
    }

    const tracking = await prisma.sCORMTracking.findUnique({
      where: {
        packageId_apprenantId_attemptNumber: {
          packageId,
          apprenantId,
          attemptNumber,
        },
      },
    });

    // Si pas de tracking, retourner des données initiales
    if (!tracking) {
      return NextResponse.json({
        cmi: {},
        isNewAttempt: true,
      });
    }

    return NextResponse.json({
      cmi: tracking.cmiData,
      isNewAttempt: false,
      lastAccessAt: tracking.lastAccessAt,
      lessonStatus: tracking.lessonStatus,
    });
  } catch (error) {
    console.error("Erreur récupération données SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

// Helper: Extraire les interactions du CMI
function extractInteractions(cmi: any): any[] {
  const interactions: any[] = [];
  let i = 0;

  while (cmi[`cmi.interactions.${i}.id`] !== undefined) {
    interactions.push({
      id: cmi[`cmi.interactions.${i}.id`],
      type: cmi[`cmi.interactions.${i}.type`],
      description: cmi[`cmi.interactions.${i}.description`],
      weighting: cmi[`cmi.interactions.${i}.weighting`],
      learnerResponse: cmi[`cmi.interactions.${i}.learner_response`] || cmi[`cmi.interactions.${i}.student_response`],
      result: cmi[`cmi.interactions.${i}.result`],
      latency: cmi[`cmi.interactions.${i}.latency`],
      timestamp: cmi[`cmi.interactions.${i}.timestamp`],
    });
    i++;
  }

  return interactions;
}

// Helper: Extraire les objectifs du CMI (SCORM 2004)
function extractObjectives(cmi: any): any[] {
  const objectives: any[] = [];
  let i = 0;

  while (cmi[`cmi.objectives.${i}.id`] !== undefined) {
    objectives.push({
      id: cmi[`cmi.objectives.${i}.id`],
      successStatus: cmi[`cmi.objectives.${i}.success_status`],
      completionStatus: cmi[`cmi.objectives.${i}.completion_status`],
      progressMeasure: cmi[`cmi.objectives.${i}.progress_measure`],
      scoreScaled: cmi[`cmi.objectives.${i}.score.scaled`],
      scoreRaw: cmi[`cmi.objectives.${i}.score.raw`],
      scoreMin: cmi[`cmi.objectives.${i}.score.min`],
      scoreMax: cmi[`cmi.objectives.${i}.score.max`],
    });
    i++;
  }

  return objectives;
}

// Helper: Mettre à jour l'inscription LMS
async function updateLMSInscription(inscriptionId: string, tracking: any) {
  try {
    // Calculer la progression
    let progression = 0;
    if (tracking.lessonStatus === "COMPLETED" || tracking.lessonStatus === "PASSED") {
      progression = 100;
    } else if (tracking.lessonStatus === "INCOMPLETE") {
      // Essayer d'utiliser progress_measure si disponible
      const cmiData = tracking.cmiData as any;
      const progressMeasure = parseFloat(cmiData?.["cmi.progress_measure"] || "0");
      progression = Math.round(progressMeasure * 100);
    }

    // Déterminer le statut LMS
    let statut: "NON_COMMENCE" | "EN_COURS" | "COMPLETE" = "NON_COMMENCE";
    if (tracking.lessonStatus === "COMPLETED" || tracking.lessonStatus === "PASSED") {
      statut = "COMPLETE";
    } else if (tracking.lessonStatus === "INCOMPLETE" || tracking.lessonStatus === "BROWSED") {
      statut = "EN_COURS";
    }

    await prisma.lMSInscription.update({
      where: { id: inscriptionId },
      data: {
        progression: Math.max(progression, 0),
        statut,
        noteFinale: tracking.scoreRaw,
        ...(statut === "EN_COURS" && !tracking.dateDebut && { dateDebut: new Date() }),
        ...(statut === "COMPLETE" && { dateFin: new Date() }),
      },
    });
  } catch (error) {
    console.error("Erreur mise à jour inscription LMS:", error);
  }
}
