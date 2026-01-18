import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth/getCurrentUser";

// Client Supabase avec service role pour les opérations storage
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Récupérer un package SCORM spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const scormPackage = await prisma.sCORMPackage.findFirst({
      where: {
        id: packageId,
        organizationId: user.organizationId,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        trackingData: {
          include: {
            apprenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
          orderBy: { lastAccessAt: "desc" },
        },
      },
    });

    if (!scormPackage) {
      return NextResponse.json({ error: "Package non trouvé" }, { status: 404 });
    }

    // Générer l'URL de lancement via notre route proxy
    let launchUrl: string | null = null;
    if (scormPackage.status === "VALID" && scormPackage.launchUrl) {
      // Utiliser notre route proxy pour servir les fichiers avec les bons headers
      launchUrl = `/api/lms/scorm/serve/${scormPackage.id}/${scormPackage.launchUrl}`;
    }

    // Stats de tracking
    const trackingStats = {
      totalLearners: scormPackage.trackingData.length,
      completed: scormPackage.trackingData.filter(
        t => t.lessonStatus === "COMPLETED" || t.lessonStatus === "PASSED"
      ).length,
      inProgress: scormPackage.trackingData.filter(
        t => t.lessonStatus === "INCOMPLETE"
      ).length,
      avgScore: scormPackage.trackingData.length > 0
        ? scormPackage.trackingData
            .filter(t => t.scoreRaw !== null)
            .reduce((acc, t) => acc + (t.scoreRaw || 0), 0) /
          scormPackage.trackingData.filter(t => t.scoreRaw !== null).length
        : null,
    };

    return NextResponse.json({
      package: scormPackage,
      launchUrl,
      trackingStats,
    });
  } catch (error) {
    console.error("Erreur récupération package SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du package" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un package SCORM
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { titre, description, formationId, moduleId, status } = body;

    // Vérifier que le package existe et appartient à l'organisation
    const existingPackage = await prisma.sCORMPackage.findFirst({
      where: {
        id: packageId,
        organizationId: user.organizationId,
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package non trouvé" }, { status: 404 });
    }

    const updatedPackage = await prisma.sCORMPackage.update({
      where: { id: packageId },
      data: {
        ...(titre !== undefined && { titre }),
        ...(description !== undefined && { description }),
        ...(formationId !== undefined && { formationId }),
        ...(moduleId !== undefined && { moduleId }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({ package: updatedPackage });
  } catch (error) {
    console.error("Erreur mise à jour package SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du package" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un package SCORM
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Vérifier que le package existe et appartient à l'organisation
    const existingPackage = await prisma.sCORMPackage.findFirst({
      where: {
        id: packageId,
        organizationId: user.organizationId,
      },
      include: {
        _count: {
          select: {
            trackingData: true,
          },
        },
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package non trouvé" }, { status: 404 });
    }

    // Vérifier si le package est utilisé
    if (existingPackage._count.trackingData > 0) {
      return NextResponse.json(
        {
          error: "Ce package est utilisé par des apprenants. Archivez-le plutôt que de le supprimer.",
          usageCount: existingPackage._count.trackingData,
        },
        { status: 400 }
      );
    }

    // Supprimer les fichiers du storage (utiliser admin pour bypass RLS)
    if (existingPackage.storagePath) {
      const { data: files } = await supabaseAdmin.storage
        .from("lms-content")
        .list(existingPackage.storagePath, { limit: 1000 });

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${existingPackage.storagePath}/${f.name}`);
        await supabaseAdmin.storage.from("lms-content").remove(filePaths);
      }
    }

    // Supprimer le package de la DB
    await prisma.sCORMPackage.delete({
      where: { id: packageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression package SCORM:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du package" },
      { status: 500 }
    );
  }
}
