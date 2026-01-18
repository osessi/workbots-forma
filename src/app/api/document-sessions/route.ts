// ===========================================
// API DOCUMENT SESSIONS - Persistance du wizard Documents
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { ApprenantStatus, SessionModalite, DocumentType } from "@prisma/client";
import { authenticateUser } from "@/lib/auth";

// Interface pour les données du wizard
interface WizardClient {
  id: string;
  type: string;
  entrepriseId?: string;
  apprenants?: Array<{ id: string }>;
}

interface WizardTarif {
  clientId: string;
  tarifHT?: number;
  financements?: Array<{
    financeurId: string;
    montant: number;
  }>;
}

interface WizardLieu {
  modalite?: string;
  lieuId?: string | null;
  adresseLibre?: string;
  lienConnexion?: string;
  journees?: Array<{
    id: string;
    date: string;
    horaireMatin?: string;
    horaireApresMidi?: string;
  }>;
}

interface WizardFormateurs {
  formateurPrincipalId?: string | null;
  coformateursIds?: string[];
}

interface WizardGeneratedDoc {
  id?: string;
  type: string;
  titre: string;
  clientId?: string;
  apprenantId?: string;
  entrepriseId?: string;
  renderedContent: string;
  jsonContent?: string;
  savedToDrive?: boolean;
}

// Fonction pour sauvegarder vers le nouveau système Session
async function handleTrainingSessionSave(
  organizationId: string,
  trainingSessionId: string,
  clients: WizardClient[] | undefined,
  tarifs: WizardTarif[] | undefined,
  lieu: WizardLieu | undefined,
  formateurs: WizardFormateurs | undefined,
  generatedDocs: WizardGeneratedDoc[] | undefined
) {
  try {
    // Vérifier que la session existe et appartient à l'organisation
    const session = await prisma.session.findFirst({
      where: {
        id: trainingSessionId,
        organizationId,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Supprimer les anciennes données clients (les documents sont gérés séparément)
    await prisma.sessionClientNew.deleteMany({ where: { sessionId: trainingSessionId } });

    // Créer les clients avec leurs participants et financements
    if (clients && clients.length > 0) {
      for (const client of clients) {
        const typeClientMap: Record<string, ApprenantStatus> = {
          ENTREPRISE: "SALARIE",
          INDEPENDANT: "INDEPENDANT",
          PARTICULIER: "PARTICULIER",
        };

        const tarif = tarifs?.find((t) => t.clientId === client.id);

        const sessionClient = await prisma.sessionClientNew.create({
          data: {
            sessionId: trainingSessionId,
            typeClient: typeClientMap[client.type] || "PARTICULIER",
            entrepriseId: client.entrepriseId || null,
            tarifHT: tarif?.tarifHT || null,
          },
        });

        // Créer les participants
        if (client.apprenants && client.apprenants.length > 0) {
          for (const apprenant of client.apprenants) {
            await prisma.sessionParticipantNew.create({
              data: {
                clientId: sessionClient.id,
                apprenantId: apprenant.id,
              },
            });
          }
        }

        // Créer les financements
        if (tarif?.financements && tarif.financements.length > 0) {
          for (const financement of tarif.financements) {
            if (financement.financeurId && financement.montant > 0) {
              await prisma.sessionFinancementNew.create({
                data: {
                  clientId: sessionClient.id,
                  financeurId: financement.financeurId,
                  montantFinanceHT: financement.montant,
                },
              });
            }
          }
        }
      }
    }

    // Créer/Mettre à jour les documents générés
    // Correction 381: Utiliser entrepriseId au lieu de clientId car les clients sont recréés à chaque sauvegarde
    if (generatedDocs && generatedDocs.length > 0) {
      const docTypeMap: Record<string, DocumentType> = {
        convention: "CONVENTION",
        contrat: "CONTRAT_FORMATION",
        convocation: "CONVOCATION",
        attestation: "ATTESTATION_FIN",
        certificat_realisation: "CERTIFICAT",
        emargement: "ATTESTATION_PRESENCE",
        facture: "FACTURE",
      };

      for (const doc of generatedDocs) {
        const documentType = docTypeMap[doc.type] || ("AUTRE" as DocumentType);

        // Correction 381: Utiliser des identifiants stables pour matcher les documents
        // - CONVENTION : entrepriseId (pour entreprises et indépendants)
        // - CONTRAT_FORMATION : apprenantId (pour particuliers)
        // - FACTURE : entrepriseId si dispo, sinon apprenantId
        // - Documents apprenant (CONVOCATION, ATTESTATION_FIN, CERTIFICAT) : apprenantId

        const isConvention = documentType === "CONVENTION";
        const isContrat = documentType === "CONTRAT_FORMATION";
        const isFacture = documentType === "FACTURE";
        const isApprenantDocument = ["CONVOCATION", "ATTESTATION_FIN", "CERTIFICAT"].includes(documentType);

        // Déterminer l'identifiant stable pour ce document
        let stableClientId: string | null = null;
        let stableParticipantId: string | null = null;

        if (isConvention) {
          // Convention = entrepriseId (entreprise ou indépendant avec SIRET)
          stableClientId = doc.entrepriseId || null;
        } else if (isContrat) {
          // Contrat = apprenantId (particulier sans SIRET)
          stableParticipantId = doc.apprenantId || null;
        } else if (isFacture) {
          // Facture = entrepriseId si dispo, sinon apprenantId
          stableClientId = doc.entrepriseId || null;
          if (!stableClientId) {
            stableParticipantId = doc.apprenantId || null;
          }
        } else if (isApprenantDocument) {
          // Documents par apprenant
          stableParticipantId = doc.apprenantId || null;
        }

        const existingDoc = await prisma.sessionDocumentNew.findFirst({
          where: {
            sessionId: trainingSessionId,
            type: documentType,
            clientId: stableClientId,
            participantId: stableParticipantId,
          },
        });

        if (existingDoc) {
          await prisma.sessionDocumentNew.update({
            where: { id: existingDoc.id },
            data: {
              content: { html: doc.renderedContent, json: doc.jsonContent },
              titre: doc.titre,
              isGenerated: true,
              generatedAt: new Date(),
            },
          });
        } else {
          await prisma.sessionDocumentNew.create({
            data: {
              sessionId: trainingSessionId,
              type: documentType,
              clientId: stableClientId,
              participantId: stableParticipantId,
              titre: doc.titre,
              content: { html: doc.renderedContent, json: doc.jsonContent },
              isGenerated: true,
              generatedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: trainingSessionId,
      message: "Session mise à jour",
    });
  } catch (error) {
    console.error("Erreur sauvegarde session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde de la session" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour une session documentaire
export async function POST(request: NextRequest) {
  try {
    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const {
      formationId,
      sessionId, // Si fourni, on met à jour (ancien système DocumentSession)
      trainingSessionId, // Si fourni, utiliser le nouveau système Session
      clients,
      tarifs,
      lieu,
      formateurs,
      generatedDocs,
    } = body;

    // Si trainingSessionId est fourni, utiliser le nouveau système Session
    if (trainingSessionId) {
      return await handleTrainingSessionSave(
        user.organizationId!,
        trainingSessionId,
        clients,
        tarifs,
        lieu,
        formateurs,
        generatedDocs
      );
    }

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
      formateurId: formateurs?.formateurPrincipalId || null,
      status: "en_cours",
    };

    let session;

    if (sessionId) {
      // Mise à jour
      session = await prisma.documentSession.update({
        where: { id: sessionId },
        data: sessionData,
      });

      // Supprimer les anciennes données pour les recréer (SAUF les documents générés)
      await prisma.sessionClient.deleteMany({ where: { sessionId } });
      await prisma.sessionJournee.deleteMany({ where: { sessionId } });
      await prisma.sessionCoFormateur.deleteMany({ where: { sessionId } });
      // Note: On ne supprime PAS sessionDocument car ils doivent persister
      // Les documents sont gérés via upsert plus bas
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

    // Créer les documents générés (avec upsert pour préserver les existants)
    if (generatedDocs && generatedDocs.length > 0) {
      for (const doc of generatedDocs) {
        // Mapper le type de document
        const docTypeMap: Record<string, string> = {
          convention: "CONVENTION",
          contrat: "CONTRAT_FORMATION",
          convocation: "CONVOCATION",
          attestation: "ATTESTATION_FIN",
          certificat_realisation: "CERTIFICAT",
          emargement: "ATTESTATION_PRESENCE",
          facture: "FACTURE",
        };

        const documentData = {
          sessionId: session.id,
          type: (docTypeMap[doc.type] as import("@prisma/client").DocumentType) || "AUTRE",
          clientId: doc.clientId || null,
          apprenantId: doc.apprenantId || null,
          content: { html: doc.renderedContent, json: doc.jsonContent },
          fileName: doc.titre,
          status: doc.savedToDrive ? "sent" : "generated",
          generatedAt: new Date(),
        };

        // Si l'ID du document existe déjà, on met à jour, sinon on crée
        const existingDoc = await prisma.sessionDocument.findFirst({
          where: {
            sessionId: session.id,
            type: documentData.type,
            clientId: documentData.clientId,
            apprenantId: documentData.apprenantId,
          },
        });

        if (existingDoc) {
          await prisma.sessionDocument.update({
            where: { id: existingDoc.id },
            data: {
              content: documentData.content,
              fileName: documentData.fileName,
              status: documentData.status,
            },
          });
        } else {
          await prisma.sessionDocument.create({
            data: documentData,
          });
        }
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
    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const formationId = searchParams.get("formationId");
    const trainingSessionId = searchParams.get("trainingSessionId");

    if (!formationId && !trainingSessionId) {
      return NextResponse.json({ error: "formationId ou trainingSessionId requis" }, { status: 400 });
    }

    // Récupérer la session avec toutes ses relations
    // Si trainingSessionId est fourni, on cherche par cet ID dans la table Session (nouveau système)
    // Sinon, on cherche par formationId dans DocumentSession (ancien système)

    if (trainingSessionId) {
      // Nouveau système: utiliser la table Session directement
      const trainingSession = await prisma.session.findFirst({
        where: {
          id: trainingSessionId,
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

      if (!trainingSession) {
        return NextResponse.json({ session: null });
      }

      // Transformer les données pour le format attendu par le wizard
      const wizardData = {
        sessionId: trainingSession.id,
        isTrainingSession: true, // Marqueur pour différencier du système DocumentSession
        clients: trainingSession.clients.map((c) => ({
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
        tarifs: trainingSession.clients.map((c) => ({
          clientId: c.id,
          tarifHT: c.tarifHT || 0,
          financeurId: c.financements[0]?.financeurId || null,
          montantFinance: c.financements[0]?.montantFinanceHT || 0,
          resteACharge: (c.tarifHT || 0) - (c.financements[0]?.montantFinanceHT || 0),
        })),
        lieu: {
          modalite: trainingSession.modalite,
          lieuId: trainingSession.lieuId,
          lieu: trainingSession.lieu,
          adresseLibre: trainingSession.lieuTexteLibre || "",
          lienConnexion: trainingSession.lienConnexion || "",
          journees: trainingSession.journees.map((j) => ({
            id: j.id,
            date: j.date.toISOString().split("T")[0],
            horaireMatin: j.heureDebutMatin && j.heureFinMatin ? `${j.heureDebutMatin} - ${j.heureFinMatin}` : "09:00 - 12:30",
            horaireApresMidi: j.heureDebutAprem && j.heureFinAprem ? `${j.heureDebutAprem} - ${j.heureFinAprem}` : "14:00 - 17:30",
          })),
        },
        formateurs: {
          formateurPrincipalId: trainingSession.formateurId,
          formateurPrincipal: trainingSession.formateur,
          coformateursIds: trainingSession.coFormateurs.map((cf) => cf.intervenantId),
          coformateurs: trainingSession.coFormateurs.map((cf) => cf.intervenant),
        },
        // Correction 381: Mapper les documents générés avec les bons clientId actuels
        generatedDocs: trainingSession.documentsGeneres.map((d) => {
          const content = d.content as { html?: string; json?: string } | null;
          const docType = d.type.toLowerCase();

          // Normaliser le type pour le frontend
          const normalizedType = docType === "contrat_formation" ? "contrat" :
                                 docType === "attestation_fin" ? "attestation" :
                                 docType === "certificat" ? "certificat_realisation" :
                                 docType === "attestation_presence" ? "emargement" : docType;

          // Correction 381: Mapper les identifiants stables vers les clientId actuels
          // - Convention : d.clientId = entrepriseId → trouver le client avec cette entrepriseId
          // - Contrat : d.participantId = apprenantId → trouver le client avec cet apprenantId
          // - Facture : d.clientId = entrepriseId OU d.participantId = apprenantId

          let mappedClientId: string | null = null;

          if (d.clientId) {
            // d.clientId contient entrepriseId pour convention/facture
            const matchingClient = trainingSession.clients.find((c) => c.entrepriseId === d.clientId);
            if (matchingClient) {
              mappedClientId = matchingClient.id;
            }
          }

          if (!mappedClientId && d.participantId) {
            // Pour contrat ou si pas trouvé par entreprise, chercher par apprenant
            const matchingClient = trainingSession.clients.find((c) =>
              c.participants.some((p) => p.apprenant.id === d.participantId)
            );
            if (matchingClient) {
              mappedClientId = matchingClient.id;
            }
          }

          return {
            id: d.id,
            type: normalizedType,
            titre: d.titre || `Document ${d.type}`,
            clientId: mappedClientId,
            entrepriseId: d.clientId, // L'entrepriseId stocké
            apprenantId: d.participantId, // L'apprenantId stocké
            renderedContent: content?.html || "",
            jsonContent: content?.json,
            savedToDrive: d.isGenerated,
          };
        }),
      };

      return NextResponse.json({ session: wizardData });
    }

    // Ancien système: DocumentSession
    const session = await prisma.documentSession.findFirst({
      where: {
        formationId: formationId!,
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
        formateurPrincipalId: session.formateurId,
        formateurPrincipal: session.formateur,
        coformateursIds: session.coFormateurs.map((cf) => cf.intervenantId),
        coformateurs: session.coFormateurs.map((cf) => cf.intervenant),
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
