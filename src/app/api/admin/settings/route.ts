import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// Paramètres par défaut
const defaultSettings = {
  siteName: "Automate Forma",
  siteDescription: "Plateforme de gestion de formations professionnelles",
  supportEmail: "support@automate-forma.com",
  defaultPlan: "FREE",
  maintenanceMode: false,
  allowSignup: true,
  welcomeEmailSubject: "Bienvenue sur Automate Forma !",
  welcomeEmailBody: "Bonjour {firstName},\n\nBienvenue sur Automate Forma ! Votre compte a été créé avec succès.\n\nCordialement,\nL'équipe Automate Forma",
  passwordResetEmailSubject: "Réinitialisation de votre mot de passe",
  invitationEmailSubject: "Vous êtes invité à rejoindre {organizationName}",
  defaultFormationDescription: "Description de la formation...",
  defaultOrganizationName: "Mon entreprise",
  defaultMaxFormateurs: 3,
  defaultMaxFormations: 10,
  defaultMaxStorage: 1,
};

export async function GET() {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    // Récupérer les paramètres depuis la base de données avec l'ID fixe
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global-settings" }
    });

    if (settings && settings.data) {
      // Fusionner avec les valeurs par défaut pour s'assurer que toutes les clés existent
      return NextResponse.json({ ...defaultSettings, ...(settings.data as object) });
    }

    // Retourner les paramètres par défaut si aucun n'existe
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error("Settings GET - Error:", error);
    // En cas d'erreur, retourner les valeurs par défaut
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(request: NextRequest) {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    console.log("Settings PUT - Received body:", JSON.stringify(body, null, 2));

    // Upsert les paramètres avec une seule opération
    const settings = await prisma.globalSettings.upsert({
      where: { id: "global-settings" },
      update: { data: body },
      create: {
        id: "global-settings",
        data: body
      },
    });

    console.log("Settings PUT - Saved successfully:", settings.id);
    return NextResponse.json({ success: true, id: settings.id });
  } catch (error) {
    console.error("Settings PUT - Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
