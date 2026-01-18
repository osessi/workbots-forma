// ===========================================
// API ENVOI FICHE D'ADAPTABILITÉ - Qualiopi IND 10
// ===========================================
// POST /api/adaptation-parcours/send-fiche - Envoyer la fiche par email

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { sendEmail } from "@/lib/services/email";
import { authenticateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST - Envoyer la fiche d'adaptabilité par email
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { apprenantId, formationId, ficheData, notifyFormateur = true } = body;

    if (!apprenantId || !formationId || !ficheData) {
      return NextResponse.json(
        { error: "apprenantId, formationId et ficheData requis" },
        { status: 400 }
      );
    }

    // Récupérer l'apprenant
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId: user.organizationId,
      },
    });

    if (!apprenant || !apprenant.email) {
      return NextResponse.json(
        { error: "Apprenant non trouvé ou email manquant" },
        { status: 404 }
      );
    }

    // Récupérer la formation
    const formation = await prisma.formation.findFirst({
      where: {
        id: formationId,
        organizationId: user.organizationId,
      },
      include: {
        modules: {
          where: { isModuleZero: true },
        },
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les infos de l'organisation
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    // Récupérer le référent pédagogique
    const referentPedagogique = await prisma.organigrammePoste.findFirst({
      where: {
        organizationId: user.organizationId,
        type: "REFERENT_PEDAGOGIQUE",
      },
    });

    const moduleZero = formation.modules[0];
    const primaryColor = organization?.primaryColor || "#4277FF";

    // Construire l'email HTML pour l'apprenant
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fiche d'Adaptabilité - ${formation.titre}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); padding: 30px; border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                    Adaptation de votre parcours
                  </h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    Formation : ${formation.titre}
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                    Bonjour ${apprenant.prenom},
                  </p>

                  <p style="margin: 0 0 20px 0; color: #555; font-size: 15px; line-height: 1.6;">
                    ${ficheData.messageApprenant || "Suite à votre test de positionnement, nous avons préparé une adaptation de votre parcours de formation pour vous accompagner au mieux."}
                  </p>

                  <!-- Score -->
                  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Résultat du positionnement</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Score obtenu : <strong style="color: ${primaryColor};">${ficheData.analyseLacunes?.scorePositionnement || "N/A"}</strong>
                    </p>
                    ${ficheData.analyseLacunes?.domainesAmeliorer?.length > 0 ? `
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                      Domaines à renforcer :
                    </p>
                    <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #666; font-size: 14px;">
                      ${ficheData.analyseLacunes.domainesAmeliorer.map((d: string) => `<li>${d}</li>`).join("")}
                    </ul>
                    ` : ""}
                  </div>

                  <!-- Module 0 -->
                  ${moduleZero || ficheData.recommandations?.moduleZeroRecommande ? `
                  <div style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 16px;">
                      Module de mise à niveau recommandé
                    </h3>
                    <p style="margin: 0; color: #33691e; font-size: 14px;">
                      ${ficheData.recommandations?.descriptionModule || "Un module de mise à niveau est disponible pour vous aider à acquérir les bases nécessaires avant de commencer la formation."}
                    </p>
                    ${ficheData.recommandations?.dureeEstimee ? `
                    <p style="margin: 10px 0 0 0; color: #558b2f; font-size: 13px;">
                      Durée estimée : ${ficheData.recommandations.dureeEstimee}
                    </p>
                    ` : ""}
                  </div>
                  ` : ""}

                  <!-- Prochaines étapes -->
                  ${ficheData.prochainesEtapes?.length > 0 ? `
                  <div style="margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Prochaines étapes</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
                      ${ficheData.prochainesEtapes.map((etape: string) => `<li>${etape}</li>`).join("")}
                    </ol>
                  </div>
                  ` : ""}

                  <!-- Contact -->
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Pour toute question, n'hésitez pas à contacter :
                    </p>
                    <p style="margin: 5px 0 0 0; color: ${primaryColor}; font-size: 14px; font-weight: 500;">
                      ${referentPedagogique ? `${referentPedagogique.prenom} ${referentPedagogique.nom}` : "Notre équipe pédagogique"}
                      ${referentPedagogique?.email ? ` - ${referentPedagogique.email}` : ""}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="margin: 0; color: #999; font-size: 12px;">
                    ${organization?.name || "Votre organisme de formation"}
                  </p>
                  <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">
                    Qualiopi - Indicateur 10 : Adaptation du parcours
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // Envoyer l'email à l'apprenant
    const emailResult = await sendEmail(
      {
        to: apprenant.email,
        subject: `Adaptation de votre parcours - ${formation.titre}`,
        html: emailHtml,
        type: "ADAPTATION_PARCOURS",
        toName: `${apprenant.prenom} ${apprenant.nom}`,
        apprenantId: apprenant.id,
        formationId: formation.id,
        sentByUserId: user.id,
      },
      user.organizationId
    );

    const results = {
      apprenantEmail: emailResult,
      formateurNotification: null as unknown,
    };

    // Notifier le formateur si demandé
    if (notifyFormateur) {
      // Trouver le formateur principal via les sessions de la formation
      const session = await prisma.session.findFirst({
        where: { formationId: formation.id },
        include: {
          formateur: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const intervenant = session?.formateur;

      if (intervenant?.email) {
        const formateurEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Notification - Adaptation parcours apprenant</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: ${primaryColor}; padding: 25px; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 20px;">
                        Adaptation de parcours
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px;">
                      <p style="margin: 0 0 15px 0; color: #333; font-size: 15px;">
                        Bonjour ${intervenant.prenom || ""},
                      </p>
                      <p style="margin: 0 0 15px 0; color: #555; font-size: 14px; line-height: 1.6;">
                        Un apprenant de la formation <strong>${formation.titre}</strong> a reçu une fiche d'adaptabilité suite à son test de positionnement.
                      </p>

                      <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0;">
                        <p style="margin: 0; color: #333; font-size: 14px;">
                          <strong>Apprenant :</strong> ${apprenant.prenom} ${apprenant.nom}
                        </p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                          <strong>Score positionnement :</strong> ${ficheData.analyseLacunes?.scorePositionnement || "N/A"}
                        </p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                          <strong>Recommandation :</strong> Module 0 de mise à niveau
                        </p>
                      </div>

                      <p style="margin: 15px 0 0 0; color: #555; font-size: 14px;">
                        Vous pouvez suivre la progression de cet apprenant depuis votre espace formateur.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; background: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        ${organization?.name || ""}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `;

        const formateurResult = await sendEmail(
          {
            to: intervenant.email,
            subject: `[Notification] Adaptation parcours - ${apprenant.prenom} ${apprenant.nom}`,
            html: formateurEmailHtml,
            type: "ADAPTATION_PARCOURS",
            toName: `${intervenant.prenom || ""} ${intervenant.nom}`,
            formationId: formation.id,
            sentByUserId: user.id,
          },
          user.organizationId
        );

        results.formateurNotification = formateurResult;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: "Fiche d'adaptabilité envoyée avec succès",
    });
  } catch (error) {
    console.error("Erreur envoi fiche adaptabilité:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de l'envoi: ${errorMessage}` },
      { status: 500 }
    );
  }
}
