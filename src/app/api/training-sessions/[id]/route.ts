// ===========================================
// API TRAINING SESSION - CRUD par ID
// ===========================================
// GET /api/training-sessions/[id] - Récupérer une session
// PATCH /api/training-sessions/[id] - Modifier une session
// DELETE /api/training-sessions/[id] - Supprimer une session

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour authentifier l'utilisateur
async function authenticateUser() {
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
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  return user;
}

// GET - Récupérer une session avec tous ses détails
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer la session avec vérification d'appartenance
    const session = await prisma.session.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            image: true,
            fichePedagogique: true,
            // Qualiopi IND 3 - Certification
            isCertifiante: true,
            numeroFicheRS: true,
            lienFranceCompetences: true,
          },
        },
        lieu: {
          select: {
            id: true,
            nom: true,
            typeLieu: true,
            lieuFormation: true,
          },
        },
        formateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        journees: {
          orderBy: { ordre: "asc" },
        },
        clients: {
          include: {
            entreprise: {
              select: {
                id: true,
                raisonSociale: true,
              },
            },
            participants: {
              select: {
                id: true,
                estConfirme: true,
                aAssiste: true,
                // Qualiopi IND 3 - Certification
                certificationObtenue: true,
                dateCertification: true,
                numeroCertificat: true,
                apprenant: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        coFormateurs: {
          include: {
            intervenant: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        documentsGeneres: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Erreur récupération session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la session" },
      { status: 500 }
    );
  }
}

// PATCH - Modifier une session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Vérifier que la session existe et appartient à l'organisation
    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Construire les données de mise à jour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (body.nom !== undefined) updateData.nom = body.nom;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.modalite !== undefined) updateData.modalite = body.modalite;
    if (body.lieuId !== undefined) updateData.lieuId = body.lieuId || null;
    if (body.lieuTexteLibre !== undefined) updateData.lieuTexteLibre = body.lieuTexteLibre;
    if (body.lienConnexion !== undefined) updateData.lienConnexion = body.lienConnexion;
    if (body.plateformeVisio !== undefined) updateData.plateformeVisio = body.plateformeVisio;
    if (body.formateurId !== undefined) updateData.formateurId = body.formateurId || null;
    if (body.tarifParDefautHT !== undefined) updateData.tarifParDefautHT = body.tarifParDefautHT ? parseFloat(body.tarifParDefautHT) : null;
    if (body.tauxTVA !== undefined) updateData.tauxTVA = parseFloat(body.tauxTVA);
    if (body.notes !== undefined) updateData.notes = body.notes;
    // Qualiopi IND 3 - Certification par session
    if (body.delivreCertification !== undefined) updateData.delivreCertification = body.delivreCertification;

    // Mettre à jour la session
    const session = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        journees: {
          orderBy: { ordre: "asc" },
        },
        lieu: true,
        formateur: true,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Erreur modification session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de la session" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la session existe et appartient à l'organisation
    const existingSession = await prisma.session.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        clients: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Vérifier que la session n'est pas terminée
    if (existingSession.status === "TERMINEE") {
      return NextResponse.json(
        { error: "Impossible de supprimer une session terminée" },
        { status: 400 }
      );
    }

    // Compter les participants pour info
    const participantCount = existingSession.clients.reduce(
      (acc, client) => acc + client.participants.length,
      0
    );

    // Si la session a des participants, supprimer d'abord les participants et clients
    if (participantCount > 0) {
      // Supprimer tous les participants de cette session
      for (const client of existingSession.clients) {
        if (client.participants.length > 0) {
          await prisma.sessionParticipant.deleteMany({
            where: { clientId: client.id },
          });
        }
      }

      // Supprimer tous les clients de cette session
      await prisma.sessionClient.deleteMany({
        where: { sessionId: id },
      });
    }

    // Supprimer les journées de la session
    await prisma.sessionJournee.deleteMany({
      where: { sessionId: id },
    });

    // Supprimer les co-formateurs
    await prisma.sessionCoFormateur.deleteMany({
      where: { sessionId: id },
    });

    // Supprimer les documents générés
    await prisma.sessionDocument.deleteMany({
      where: { sessionId: id },
    });

    // Supprimer la session
    await prisma.session.delete({
      where: { id },
    });

    // Décrémenter le compteur de sessions de la formation
    await prisma.formation.update({
      where: { id: existingSession.formationId },
      data: {
        totalSessions: { decrement: 1 },
      },
    });

    return NextResponse.json({ success: true, message: "Session supprimée" });
  } catch (error) {
    console.error("Erreur suppression session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la session" },
      { status: 500 }
    );
  }
}
