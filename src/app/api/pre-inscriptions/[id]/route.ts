// ===========================================
// API PRÉ-INSCRIPTION (Admin) - GET/PATCH/DELETE /api/pre-inscriptions/[id]
// ===========================================
// Gestion d'une pré-inscription spécifique

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail, generateInvitationApprenantWithTokenEmail } from "@/lib/services/email";
import { notifyInscriptionValidee } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET - Détail d'une pré-inscription
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const preInscription = await prisma.preInscription.findUnique({
      where: { id },
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
            tarifAffiche: true,
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    if (!preInscription) {
      return NextResponse.json(
        { error: "Pré-inscription non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que la pré-inscription appartient à l'organisation
    if (preInscription.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json(preInscription);
  } catch (error) {
    console.error("Erreur GET pré-inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// Schéma de mise à jour
const updateSchema = z.object({
  statut: z.enum(["NOUVELLE", "EN_TRAITEMENT", "ACCEPTEE", "REFUSEE", "ANNULEE"]).optional(),
  noteInterne: z.string().optional(),
  motifRefus: z.string().optional(),
  convertirEnApprenant: z.boolean().optional(),
});

// PATCH - Mettre à jour une pré-inscription
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que la pré-inscription existe et appartient à l'organisation
    const existing = await prisma.preInscription.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
        pays: true,
        situationProfessionnelle: true,
        entreprise: true,
        siret: true,
        statut: true,
        apprenantId: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pré-inscription non trouvée" },
        { status: 404 }
      );
    }

    if (existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    let apprenantId = existing.apprenantId;

    // Si on convertit en apprenant
    if (data.convertirEnApprenant && !existing.apprenantId) {
      // Vérifier si un apprenant avec cet email existe déjà
      let apprenant = await prisma.apprenant.findFirst({
        where: {
          email: existing.email,
          organizationId: user.organizationId,
        },
      });

      if (!apprenant) {
        // Créer un nouvel apprenant
        const statutApprenant = existing.situationProfessionnelle === "SALARIE"
          ? "SALARIE"
          : existing.situationProfessionnelle === "INDEPENDANT"
          ? "INDEPENDANT"
          : "PARTICULIER";

        apprenant = await prisma.apprenant.create({
          data: {
            organizationId: user.organizationId,
            nom: existing.nom,
            prenom: existing.prenom,
            email: existing.email,
            telephone: existing.telephone,
            adresse: existing.adresse,
            codePostal: existing.codePostal,
            ville: existing.ville,
            pays: existing.pays,
            statut: statutApprenant as "SALARIE" | "INDEPENDANT" | "PARTICULIER",
            siret: existing.siret,
            raisonSociale: existing.entreprise,
          },
        });
      }

      apprenantId = apprenant.id;
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};

    if (data.statut) {
      updateData.statut = data.statut;

      // Mettre à jour les dates de traitement
      if (data.statut !== "NOUVELLE" && !existing.apprenantId) {
        updateData.traiteeAt = new Date();
        updateData.traiteePar = user.id;
      }
    }

    if (data.noteInterne !== undefined) {
      updateData.noteInterne = data.noteInterne;
    }

    if (data.motifRefus !== undefined) {
      updateData.motifRefus = data.motifRefus;
    }

    if (apprenantId !== existing.apprenantId) {
      updateData.apprenantId = apprenantId;
    }

    // Mettre à jour la pré-inscription
    const updated = await prisma.preInscription.update({
      where: { id },
      data: updateData,
      include: {
        formation: {
          select: {
            id: true,
            titre: true,
          },
        },
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            nomCommercial: true,
            slug: true,
            logo: true,
            email: true,
            telephone: true,
            primaryColor: true,
          },
        },
      },
    });

    // Si conversion en apprenant réussie, créer un token d'invitation et envoyer l'email
    if (data.convertirEnApprenant && apprenantId && updated.organization) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.workbots.fr";
      const orgDisplayName = updated.organization.nomCommercial || updated.organization.name;

      // 1. Créer un token d'invitation unique (valide 48h)
      let magicLinkUrl = `${baseUrl}/apprenant`;
      try {
        const inviteToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 heures

        await prisma.apprenantInviteToken.create({
          data: {
            apprenantId,
            token: inviteToken,
            expiresAt,
          },
        });

        magicLinkUrl = `${baseUrl}/apprenant?token=${inviteToken}`;
        console.log(`[PRE-INSCRIPTION] Token d'invitation créé pour ${existing.email}`);
      } catch (tokenError) {
        console.error("[PRE-INSCRIPTION] Erreur création token invitation:", tokenError);
        // On continue quand même, l'utilisateur pourra se connecter via code OTP
      }

      // 2. Envoyer l'email d'invitation avec le magic link
      try {
        const invitationEmail = generateInvitationApprenantWithTokenEmail({
          prenom: existing.prenom,
          nom: existing.nom,
          email: existing.email,
          formationTitre: updated.formation.titre,
          organizationName: orgDisplayName,
          organizationLogo: updated.organization.logo,
          organizationEmail: updated.organization.email,
          organizationTelephone: updated.organization.telephone,
          primaryColor: updated.organization.primaryColor || undefined,
          magicLinkUrl,
        });

        await sendEmail({
          to: existing.email,
          toName: `${existing.prenom} ${existing.nom}`,
          subject: invitationEmail.subject,
          html: invitationEmail.html,
          text: invitationEmail.text,
          type: "INVITATION_APPRENANT",
          apprenantId,
          formationId: updated.formation.id,
          preInscriptionId: id,
        }, updated.organization.id);

        console.log(`[PRE-INSCRIPTION] Email invitation espace apprenant envoyé à ${existing.email}`);
      } catch (emailError) {
        console.error("[PRE-INSCRIPTION] Erreur envoi email invitation:", emailError);
      }

      // 3. Créer une notification interne de validation d'inscription
      try {
        await notifyInscriptionValidee({
          organizationId: updated.organization.id,
          apprenantId,
          prenom: existing.prenom,
          nom: existing.nom,
          formationTitre: updated.formation.titre,
        });
        console.log(`[PRE-INSCRIPTION] Notification inscription créée`);
      } catch (notifError) {
        console.error("[PRE-INSCRIPTION] Erreur création notification:", notifError);
      }
    }

    return NextResponse.json({
      success: true,
      preInscription: updated,
      message: data.convertirEnApprenant && apprenantId
        ? "Pré-inscription validée, apprenant créé et email d'invitation envoyé"
        : "Pré-inscription mise à jour",
    });
  } catch (error) {
    console.error("Erreur PATCH pré-inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une pré-inscription
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que la pré-inscription existe et appartient à l'organisation
    const existing = await prisma.preInscription.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pré-inscription non trouvée" },
        { status: 404 }
      );
    }

    if (existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.preInscription.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Pré-inscription supprimée" });
  } catch (error) {
    console.error("Erreur DELETE pré-inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
