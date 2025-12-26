
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Fonction pour valider le token apprenant
async function validateApprenantToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const tokenData = JSON.parse(decoded);

    if (Date.now() > tokenData.exp) {
      return null;
    }

    return tokenData;
  } catch {
    return null;
  }
}

// GET - Récupérer les détails d'une formation pour un apprenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formationId } = await params;

    // Récupérer le token depuis le header ou query param
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ||
                  new URL(request.url).searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const tokenData = await validateApprenantToken(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // Vérifier que l'apprenant est inscrit à cette formation
    const inscription = await prisma.lMSInscription.findFirst({
      where: {
        apprenantId: tokenData.apprenantId,
        formationId,
        formation: {
          isPublished: true,
          isArchived: false,
        },
      },
      include: {
        formation: {
          include: {
            modules: {
              select: {
                id: true,
                titre: true,
                description: true,
                ordre: true,
                duree: true,
                contenu: true,
              },
              orderBy: { ordre: "asc" },
            },
            scormPackages: {
              where: {
                status: "VALID",
              },
              select: {
                id: true,
                titre: true,
                description: true,
                version: true,
                launchUrl: true,
                storagePath: true,
                masteryScore: true,
              },
            },
          },
        },
        progressionModules: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!inscription) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette formation" },
        { status: 403 }
      );
    }

    // Récupérer les trackings SCORM de l'apprenant pour cette formation
    const scormTrackings = await prisma.sCORMTracking.findMany({
      where: {
        apprenantId: tokenData.apprenantId,
        package: {
          formationId,
        },
      },
      select: {
        id: true,
        packageId: true,
        lessonStatus: true,
        scoreRaw: true,
        totalTime: true,
        lastAccessAt: true,
      },
    });

    // Générer des URLs signées pour les packages SCORM
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

    const scormPackagesWithUrls = await Promise.all(
      inscription.formation.scormPackages.map(async (pkg) => {
        let signedUrl = null;
        if (pkg.launchUrl && pkg.storagePath) {
          const { data } = await supabase.storage
            .from("lms-content")
            .createSignedUrl(`${pkg.storagePath}/${pkg.launchUrl}`, 3600);
          signedUrl = data?.signedUrl || null;
        }
        return {
          ...pkg,
          signedUrl,
          tracking: scormTrackings.find(t => t.packageId === pkg.id) || null,
        };
      })
    );

    return NextResponse.json({
      inscription: {
        id: inscription.id,
        progression: inscription.progression,
        statut: inscription.statut,
        dateInscription: inscription.dateInscription,
        dateDebut: inscription.dateDebut,
        tempsTotal: inscription.tempsTotal,
      },
      formation: {
        id: inscription.formation.id,
        titre: inscription.formation.titre,
        description: inscription.formation.description,
        image: inscription.formation.image,
        modules: inscription.formation.modules,
      },
      progressionModules: inscription.progressionModules.map(pm => ({
        moduleId: pm.moduleId,
        progression: pm.progression,
        statut: pm.statut,
        dateDebut: pm.dateDebut,
        dateFin: pm.dateFin,
      })),
      scormPackages: scormPackagesWithUrls,
    });
  } catch (error) {
    console.error("Erreur récupération formation apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la formation" },
      { status: 500 }
    );
  }
}
