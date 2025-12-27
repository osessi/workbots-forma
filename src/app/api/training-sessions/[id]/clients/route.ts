// ===========================================
// API SESSION CLIENTS - Gestion des clients d'une session
// ===========================================
// POST /api/training-sessions/[id]/clients - Ajouter un client avec ses participants

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

// POST - Ajouter un client avec ses participants à la session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const {
      typeClient,
      entrepriseId,
      contactNom,
      contactPrenom,
      contactEmail,
      contactTelephone,
      tarifHT,
      tauxTVA = 20,
      apprenantIds,
    } = body;

    // Vérifier que la session existe et appartient à l'organisation
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId: user.organizationId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Valider le type de client
    const validTypes = ["SALARIE", "INDEPENDANT", "PARTICULIER"];
    if (!typeClient || !validTypes.includes(typeClient)) {
      return NextResponse.json({ error: "Type de client invalide" }, { status: 400 });
    }

    // Valider les apprenants
    if (!apprenantIds || !Array.isArray(apprenantIds) || apprenantIds.length === 0) {
      return NextResponse.json({ error: "Au moins un participant est requis" }, { status: 400 });
    }

    // Vérifier que les apprenants existent et appartiennent à l'organisation
    const apprenants = await prisma.apprenant.findMany({
      where: {
        id: { in: apprenantIds },
        organizationId: user.organizationId,
      },
    });

    if (apprenants.length !== apprenantIds.length) {
      return NextResponse.json({ error: "Un ou plusieurs apprenants sont invalides" }, { status: 400 });
    }

    // Créer le client avec ses participants dans une transaction
    const client = await prisma.$transaction(async (tx) => {
      // 1. Créer le client
      const newClient = await tx.sessionClientNew.create({
        data: {
          sessionId,
          typeClient,
          entrepriseId: typeClient === "SALARIE" && entrepriseId ? entrepriseId : null,
          contactNom: contactNom || null,
          contactPrenom: contactPrenom || null,
          contactEmail: contactEmail || null,
          contactTelephone: contactTelephone || null,
          tarifHT: tarifHT ? parseFloat(tarifHT) : null,
          tarifTTC: tarifHT ? parseFloat(tarifHT) * (1 + tauxTVA / 100) : null,
          tauxTVA: parseFloat(tauxTVA),
          // Créer les participants
          participants: {
            create: apprenantIds.map((apprenantId: string) => ({
              apprenantId,
              estConfirme: false,
              aAssiste: false,
            })),
          },
        },
        include: {
          entreprise: {
            select: {
              id: true,
              raisonSociale: true,
            },
          },
          participants: {
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
          },
        },
      });

      // 2. Mettre à jour le compteur de participants de la formation
      await tx.formation.update({
        where: { id: session.formationId },
        data: {
          totalApprenants: { increment: apprenantIds.length },
        },
      });

      return newClient;
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout client:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du client" },
      { status: 500 }
    );
  }
}
