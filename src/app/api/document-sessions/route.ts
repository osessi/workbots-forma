// ===========================================
// API DOCUMENT SESSIONS - Persistance du wizard Documents
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { ApprenantStatus, SessionModalite } from "@prisma/client";

// POST - Créer ou mettre à jour une session documentaire
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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      formationId,
      sessionId, // Si fourni, on met à jour
      clients,
      tarifs,
      lieu,
      formateurs,
      generatedDocs,
    } = body;

    if (!formationId) {
      return NextResponse.json({ error: "formationId requis" }, { status: 400 });
    }

    // Vérifier que la formation appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Convertir la modalité
    const modaliteMap: Record<string, SessionModalite> = {
      PRESENTIEL: "PRESENTIEL",
      DISTANCIEL: "DISTANCIEL",
      MIXTE: "MIXTE",
    };

    // Créer ou mettre à jour la session
    const sessionData = {
      formationId,
      organizationId: user.organizationId!,
      modalite: modaliteMap[lieu?.modalite] || "PRESENTIEL",
      lieuId: lieu?.lieuId || null,
      lieuTexteLibre: lieu?.adresseLibre || null,
      lienConnexion: lieu?.lienConnexion || null,
      formateurId: formateurs?.formateurPrincipal || null,
      status: "en_cours",
    };

    let session;

    if (sessionId) {
      // Mise à jour
      session = await prisma.documentSession.update({
        where: { id: sessionId },
        data: sessionData,
      });

      // Supprimer les anciennes données pour les recréer
      await prisma.sessionClient.deleteMany({ where: { sessionId } });
      await prisma.sessionJournee.deleteMany({ where: { sessionId } });
      await prisma.sessionCoFormateur.deleteMany({ where: { sessionId } });
      await prisma.sessionDocument.deleteMany({ where: { sessionId } });
    } else {
      // Création
      session = await prisma.documentSession.create({
        data: sessionData,
      });
    }

    // Créer les journées
    if (lieu?.journees && lieu.journees.length > 0) {
      for (let i = 0; i < lieu.journees.length; i++) {
        const j = lieu.journees[i];
        if (j.date) {
          // Parser les horaires
          const parseHoraire = (horaire: string) => {
            if (!horaire) return { debut: null, fin: null };
            const parts = horaire.split(" - ");
            return { debut: parts[0] || null, fin: parts[1] || null };
          };

          const matin = parseHoraire(j.horaireMatin);
          const aprem = parseHoraire(j.horaireApresMidi);

          await prisma.sessionJournee.create({
            data: {
              sessionId: session.id,
              ordre: i + 1,
              date: new Date(j.date),
              heureDebutMatin: matin.debut,
              heureFinMatin: matin.fin,
              heureDebutAprem: aprem.debut,
              heureFinAprem: aprem.fin,
            },
          });
        }
      }
    }

    // Créer les co-formateurs
    if (formateurs?.coFormateurs && formateurs.coFormateurs.length > 0) {
      for (const coFormateurId of formateurs.coFormateurs) {
        await prisma.sessionCoFormateur.create({
          data: {
            sessionId: session.id,
            intervenantId: coFormateurId,
          },
        });
      }
    }

    // Créer les clients avec leurs participants et financements
    if (clients && clients.length > 0) {
      for (const client of clients) {
        // Convertir le type de client
        const typeClientMap: Record<string, ApprenantStatus> = {
          ENTREPRISE: "SALARIE",
          INDEPENDANT: "INDEPENDANT",
          PARTICULIER: "PARTICULIER",
        };

        const tarif = tarifs?.find((t: { clientId: string }) => t.clientId === client.id);

        const sessionClient = await prisma.sessionClient.create({
          data: {
            sessionId: session.id,
            typeClient: typeClientMap[client.type] || "PARTICULIER",
            entrepriseId: client.entrepriseId || null,
            tarifHT: tarif?.tarifHT || null,
          },
        });

        // Créer les participants (apprenants)
        if (client.apprenants && client.apprenants.length > 0) {
          for (const apprenant of client.apprenants) {
            await prisma.sessionParticipant.create({
              data: {
                clientId: sessionClient.id,
                apprenantId: apprenant.id,
              },
            });
          }
        }

        // Créer le financement si présent
        if (tarif?.financeurId && tarif.montantFinance > 0) {
          await prisma.sessionClientFinancement.create({
            data: {
              clientId: sessionClient.id,
              financeurId: tarif.financeurId,
              montantFinanceHT: tarif.montantFinance || 0,
            },
          });
        }
      }
    }

    // Créer les documents générés
    if (generatedDocs && generatedDocs.length > 0) {
      for (const doc of generatedDocs) {
        // Mapper le type de document
        const docTypeMap: Record<string, string> = {
          convention: "CONVENTION",
          contrat: "CONTRAT_FORMATION",
          convocation: "CONVOCATION",
          attestation: "ATTESTATION_FIN",
          emargement: "ATTESTATION_PRESENCE",
          facture: "FACTURE",
        };

        await prisma.sessionDocument.create({
          data: {
            sessionId: session.id,
            type: (docTypeMap[doc.type] as import("@prisma/client").DocumentType) || "AUTRE",
            clientId: doc.clientId || null,
            apprenantId: doc.apprenantId || null,
            content: { html: doc.renderedContent, json: doc.jsonContent },
            fileName: doc.titre,
            status: "generated",
            generatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: sessionId ? "Session mise à jour" : "Session créée",
    });
  } catch (error) {
    console.error("Erreur sauvegarde session documentaire:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde de la session" },
      { status: 500 }
    );
  }
}

// GET - Récupérer une session documentaire par formationId
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
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const formationId = searchParams.get("formationId");

    if (!formationId) {
      return NextResponse.json({ error: "formationId requis" }, { status: 400 });
    }

    // Récupérer la session avec toutes ses relations
    const session = await prisma.documentSession.findFirst({
      where: {
        formationId,
        organizationId: user.organizationId,
      },
      include: {
        lieu: true,
        formateur: true,
        journees: {
          orderBy: { ordre: "asc" },
        },
        coFormateurs: {
          include: { intervenant: true },
        },
        clients: {
          include: {
            entreprise: true,
            participants: {
              include: { apprenant: true },
            },
            financements: {
              include: { financeur: true },
            },
          },
        },
        documentsGeneres: true,
      },
    });

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // Transformer les données pour le format attendu par le wizard
    const wizardData = {
      sessionId: session.id,
      clients: session.clients.map((c) => ({
        id: c.id,
        type: c.typeClient === "SALARIE" ? "ENTREPRISE" : c.typeClient,
        entrepriseId: c.entrepriseId,
        entreprise: c.entreprise ? {
          id: c.entreprise.id,
          raisonSociale: c.entreprise.raisonSociale,
          siret: c.entreprise.siret,
        } : null,
        apprenant: c.participants.length === 1 && c.typeClient !== "SALARIE" ? {
          id: c.participants[0].apprenant.id,
          nom: c.participants[0].apprenant.nom,
          prenom: c.participants[0].apprenant.prenom,
          email: c.participants[0].apprenant.email,
        } : null,
        apprenants: c.participants.map((p) => ({
          id: p.apprenant.id,
          nom: p.apprenant.nom,
          prenom: p.apprenant.prenom,
          email: p.apprenant.email,
        })),
      })),
      tarifs: session.clients.map((c) => ({
        clientId: c.id,
        tarifHT: c.tarifHT || 0,
        financeurId: c.financements[0]?.financeurId || null,
        montantFinance: c.financements[0]?.montantFinanceHT || 0,
        resteACharge: (c.tarifHT || 0) - (c.financements[0]?.montantFinanceHT || 0),
      })),
      lieu: {
        modalite: session.modalite,
        lieuId: session.lieuId,
        lieu: session.lieu,
        adresseLibre: session.lieuTexteLibre || "",
        lienConnexion: session.lienConnexion || "",
        journees: session.journees.map((j) => ({
          id: j.id,
          date: j.date.toISOString().split("T")[0],
          horaireMatin: j.heureDebutMatin && j.heureFinMatin ? `${j.heureDebutMatin} - ${j.heureFinMatin}` : "09:00 - 12:30",
          horaireApresMidi: j.heureDebutAprem && j.heureFinAprem ? `${j.heureDebutAprem} - ${j.heureFinAprem}` : "14:00 - 17:30",
        })),
      },
      formateurs: {
        formateurPrincipal: session.formateurId,
        formateur: session.formateur,
        coFormateurs: session.coFormateurs.map((cf) => cf.intervenantId),
        coFormateursDetails: session.coFormateurs.map((cf) => cf.intervenant),
      },
      generatedDocs: session.documentsGeneres.map((d) => {
        const content = d.content as { html?: string; json?: string } | null;
        return {
          id: d.id,
          type: d.type.toLowerCase(),
          titre: d.fileName || `Document ${d.type}`,
          clientId: d.clientId,
          apprenantId: d.apprenantId,
          renderedContent: content?.html || "",
          jsonContent: content?.json,
          savedToDrive: d.status === "sent",
        };
      }),
    };

    return NextResponse.json({ session: wizardData });
  } catch (error) {
    console.error("Erreur récupération session documentaire:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la session" },
      { status: 500 }
    );
  }
}
