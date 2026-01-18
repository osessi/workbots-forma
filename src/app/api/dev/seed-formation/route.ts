// ===========================================
// API DEV - Créer une formation exemple complète
// ===========================================
// POST /api/dev/seed-formation
// Crée une formation avec sessions, apprenants, et documents pour les tests

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("🌱 Création de données de test...");

    // 1. Créer une entreprise exemple
    const entreprise = await prisma.entreprise.upsert({
      where: {
        id: `demo-entreprise-${user.organizationId}`,
      },
      update: {},
      create: {
        id: `demo-entreprise-${user.organizationId}`,
        raisonSociale: "TechCorp Solutions",
        siret: "12345678900012",
        adresse: "15 Avenue de la Tech",
        codePostal: "75008",
        ville: "Paris",
        contactNom: "Martin",
        contactPrenom: "Sophie",
        contactEmail: "sophie.martin@techcorp.fr",
        contactTelephone: "01 23 45 67 89",
        organizationId: user.organizationId,
      },
    });

    console.log(`   ✓ Entreprise créée: ${entreprise.raisonSociale}`);

    // 2. Créer des apprenants
    const apprenantsData = [
      { nom: "Dupont", prenom: "Jean", email: "jean.dupont@techcorp.fr", statut: "SALARIE" as const },
      { nom: "Martin", prenom: "Marie", email: "marie.martin@techcorp.fr", statut: "SALARIE" as const },
      { nom: "Bernard", prenom: "Pierre", email: "pierre.bernard@techcorp.fr", statut: "SALARIE" as const },
      { nom: "Durand", prenom: "Claire", email: "claire.durand@gmail.com", statut: "INDEPENDANT" as const },
    ];

    const apprenants = [];
    for (const data of apprenantsData) {
      const apprenant = await prisma.apprenant.upsert({
        where: {
          id: `demo-apprenant-${data.email.replace(/[@.]/g, "-")}`,
        },
        update: {},
        create: {
          id: `demo-apprenant-${data.email.replace(/[@.]/g, "-")}`,
          ...data,
          telephone: "06 12 34 56 78",
          entrepriseId: data.statut === "SALARIE" ? entreprise.id : null,
          organizationId: user.organizationId,
        },
      });
      apprenants.push(apprenant);
    }

    console.log(`   ✓ ${apprenants.length} apprenants créés`);

    // 3. Créer un formateur (intervenant)
    const formateur = await prisma.intervenant.upsert({
      where: {
        id: `demo-formateur-${user.organizationId}`,
      },
      update: {},
      create: {
        id: `demo-formateur-${user.organizationId}`,
        nom: "Leroy",
        prenom: "Antoine",
        email: "antoine.leroy@formation.fr",
        telephone: "06 98 76 54 32",
        fonction: "Formateur Expert",
        specialites: ["Management", "Gestion de projet", "Leadership"],
        organizationId: user.organizationId,
      },
    });

    console.log(`   ✓ Formateur créé: ${formateur.prenom} ${formateur.nom}`);

    // 4. Créer un lieu de formation
    const lieu = await prisma.lieuFormation.upsert({
      where: {
        id: `demo-lieu-${user.organizationId}`,
      },
      update: {},
      create: {
        id: `demo-lieu-${user.organizationId}`,
        nom: "Salle Formation Paris",
        typeLieu: "PRESENTIEL",
        lieuFormation: "25 Rue de la Formation",
        codePostal: "75001",
        ville: "Paris",
        capacite: 15,
        infosPratiques: "Métro: Châtelet (lignes 1, 4, 7, 11, 14). Parking souterrain à 100m.",
        organizationId: user.organizationId,
      },
    });

    console.log(`   ✓ Lieu créé: ${lieu.nom}`);

    // 5. Créer un financeur
    const financeur = await prisma.financeur.upsert({
      where: {
        id: `demo-financeur-${user.organizationId}`,
      },
      update: {},
      create: {
        id: `demo-financeur-${user.organizationId}`,
        nom: "OPCO Atlas",
        type: "OPCO",
        adresse: "10 Rue des OPCO",
        codePostal: "75009",
        ville: "Paris",
        email: "contact@opcoatlas.fr",
        organizationId: user.organizationId,
      },
    });

    console.log(`   ✓ Financeur créé: ${financeur.nom}`);

    // 6. Créer une formation complète
    const formation = await prisma.formation.upsert({
      where: {
        id: `demo-formation-${user.organizationId}`,
      },
      update: {
        isPublished: true,
        publishedAt: new Date(),
        status: "TERMINEE",
      },
      create: {
        id: `demo-formation-${user.organizationId}`,
        titre: "Formation Management d'Équipe",
        description: "Développez vos compétences de leader pour manager efficacement votre équipe",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
        status: "TERMINEE",
        isPublished: true,
        publishedAt: new Date(),
        currentStep: "documents",
        completedSteps: ["contexte", "fiche", "slides", "evaluations", "documents"],
        contexteData: {
          typeSession: ["entreprise", "independant"],
          modalite: "presentiel",
          dureeHeures: "14",
          dureeJours: "2",
          nombreParticipants: "10",
          tarifEntreprise: "1500",
          tarifIndependant: "1200",
          tarifParticulier: "1000",
          description: "Formation intensive de 2 jours pour développer les compétences managériales",
        },
        fichePedagogique: {
          titre: "Formation Management d'Équipe",
          objectifGeneral: "Acquérir les techniques fondamentales du management pour piloter efficacement une équipe",
          objectifs: [
            "Comprendre les différents styles de management",
            "Maîtriser les techniques de communication managériale",
            "Savoir motiver et fédérer une équipe",
            "Gérer les conflits et situations difficiles",
          ],
          publicVise: "Managers, chefs d'équipe, responsables de projet",
          prerequis: "Avoir une expérience en gestion d'équipe ou être en poste de manager",
          duree: "14 heures (2 jours)",
          nombreParticipants: "6 à 12 personnes",
          tarifEntreprise: "1 500 € HT",
          tarifIndependant: "1 200 € HT",
          accessibilite: "Formation accessible aux personnes en situation de handicap",
        },
        organizationId: user.organizationId,
        userId: user.id,
      },
    });

    console.log(`   ✓ Formation créée: ${formation.titre}`);

    // 7. Créer les modules
    const modulesData = [
      {
        titre: "Module 1 - Les fondamentaux du management",
        contenu: {
          items: [
            "Introduction au management moderne",
            "Les différents styles de management",
            "Identifier son propre style",
            "Adapter son management au contexte",
          ],
        },
      },
      {
        titre: "Module 2 - Communication et leadership",
        contenu: {
          items: [
            "Les techniques de communication assertive",
            "Mener des réunions efficaces",
            "Donner du feedback constructif",
            "Développer son leadership",
          ],
        },
      },
    ];

    for (let i = 0; i < modulesData.length; i++) {
      await prisma.module.upsert({
        where: {
          id: `demo-module-${i + 1}-${user.organizationId}`,
        },
        update: {},
        create: {
          id: `demo-module-${i + 1}-${user.organizationId}`,
          formationId: formation.id,
          titre: modulesData[i].titre,
          ordre: i + 1,
          contenu: modulesData[i].contenu,
        },
      });
    }

    console.log(`   ✓ ${modulesData.length} modules créés`);

    // 8. Créer une session documentaire (DocumentSession)
    const today = new Date();
    const dateDebut = new Date(today);
    dateDebut.setDate(today.getDate() + 7); // Dans 7 jours
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateDebut.getDate() + 1); // 2 jours après

    const documentSession = await prisma.documentSession.upsert({
      where: {
        id: `demo-doc-session-${user.organizationId}`,
      },
      update: {},
      create: {
        id: `demo-doc-session-${user.organizationId}`,
        formationId: formation.id,
        organizationId: user.organizationId,
        formateurId: formateur.id,
        lieuId: lieu.id,
        modalite: "PRESENTIEL",
        status: "complete",
      },
    });

    // Créer les journées
    await prisma.sessionJournee.deleteMany({
      where: { sessionId: documentSession.id },
    });

    await prisma.sessionJournee.createMany({
      data: [
        {
          sessionId: documentSession.id,
          ordre: 1,
          date: dateDebut,
          heureDebutMatin: "09:00",
          heureFinMatin: "12:30",
          heureDebutAprem: "14:00",
          heureFinAprem: "17:30",
        },
        {
          sessionId: documentSession.id,
          ordre: 2,
          date: dateFin,
          heureDebutMatin: "09:00",
          heureFinMatin: "12:30",
          heureDebutAprem: "14:00",
          heureFinAprem: "17:00",
        },
      ],
    });

    console.log(`   ✓ Session documentaire créée avec 2 journées`);

    // 9. Créer les clients de session
    await prisma.sessionClient.deleteMany({
      where: { sessionId: documentSession.id },
    });

    // Client entreprise
    const clientEntreprise = await prisma.sessionClient.create({
      data: {
        sessionId: documentSession.id,
        typeClient: "SALARIE",
        entrepriseId: entreprise.id,
        tarifHT: 1500,
      },
    });

    // Ajouter les participants salariés
    const salaries = apprenants.filter((a) => a.statut === "SALARIE");
    for (const apprenant of salaries) {
      await prisma.sessionParticipant.create({
        data: {
          clientId: clientEntreprise.id,
          apprenantId: apprenant.id,
        },
      });
    }

    // Ajouter le financement pour l'entreprise
    await prisma.sessionClientFinancement.create({
      data: {
        clientId: clientEntreprise.id,
        financeurId: financeur.id,
        montantFinanceHT: 1000,
      },
    });

    // Client indépendant
    const independant = apprenants.find((a) => a.statut === "INDEPENDANT");
    if (independant) {
      const clientIndependant = await prisma.sessionClient.create({
        data: {
          sessionId: documentSession.id,
          typeClient: "INDEPENDANT",
          tarifHT: 1200,
        },
      });

      await prisma.sessionParticipant.create({
        data: {
          clientId: clientIndependant.id,
          apprenantId: independant.id,
        },
      });
    }

    console.log(`   ✓ Clients et participants ajoutés (${apprenants.length} apprenants)`);

    // 10. Créer le dossier racine de la formation
    await prisma.folder.upsert({
      where: {
        id: `demo-folder-formation-${user.organizationId}`,
      },
      update: {},
      create: {
        id: `demo-folder-formation-${user.organizationId}`,
        name: formation.titre,
        color: "#4277FF",
        formationId: formation.id,
        folderType: "formation",
        organizationId: user.organizationId,
      },
    });

    console.log(`   ✓ Dossier formation créé`);

    return NextResponse.json({
      success: true,
      message: "Données de test créées avec succès!",
      data: {
        formation: {
          id: formation.id,
          titre: formation.titre,
        },
        entreprise: {
          id: entreprise.id,
          nom: entreprise.raisonSociale,
        },
        apprenants: apprenants.map((a) => ({
          id: a.id,
          nom: `${a.prenom} ${a.nom}`,
        })),
        formateur: {
          id: formateur.id,
          nom: `${formateur.prenom} ${formateur.nom}`,
        },
        session: {
          id: documentSession.id,
        },
      },
    });
  } catch (error) {
    console.error("Erreur création données de test:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création des données de test", details: String(error) },
      { status: 500 }
    );
  }
}
