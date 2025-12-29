// ===========================================
// API SOUMISSION EVALUATION APPRENANT - Qualiopi IND 10
// ===========================================
// POST /api/apprenant/evaluations/submit
// Soumet les réponses d'une évaluation et déclenche le workflow d'adaptation si nécessaire

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/services/email";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_PROMPTS, injectVariablesInPrompt } from "@/lib/ai/dynamic-prompts";

export const dynamic = "force-dynamic";

// Seuil de score pour déclencher l'adaptation (en pourcentage)
const SEUIL_ADAPTATION = 10; // Équivalent à 2/20

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

// Calculer le score d'un QCM
function calculateQCMScore(
  reponses: Array<{ questionIndex: number; selectedAnswer: number }>,
  contenu: { questions: Array<{ correctAnswer: number }> }
): number {
  if (!contenu.questions || contenu.questions.length === 0) return 0;

  let correct = 0;
  for (const reponse of reponses) {
    const question = contenu.questions[reponse.questionIndex];
    if (question && question.correctAnswer === reponse.selectedAnswer) {
      correct++;
    }
  }

  return Math.round((correct / contenu.questions.length) * 100);
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token depuis les query params ou body
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    const body = await request.json();
    const { evaluationId, reponses, tempsPassé } = body;

    if (!evaluationId || !reponses) {
      return NextResponse.json(
        { error: "evaluationId et reponses sont requis" },
        { status: 400 }
      );
    }

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        formation: {
          organizationId,
        },
      },
      include: {
        formation: {
          include: {
            modules: {
              where: { isModuleZero: true },
            },
            organization: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "Évaluation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer l'apprenant
    const apprenant = await prisma.apprenant.findFirst({
      where: {
        id: apprenantId,
        organizationId,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Calculer le score
    const contenu = evaluation.contenu as { questions: Array<{ correctAnswer: number }> };
    const score = calculateQCMScore(reponses, contenu);

    // Déterminer le statut
    const isValidated = evaluation.scoreMinimum
      ? score >= evaluation.scoreMinimum
      : true;

    // Créer ou mettre à jour le résultat
    const existingResultat = await prisma.evaluationResultat.findFirst({
      where: {
        evaluationId,
        apprenantId,
      },
      orderBy: { createdAt: "desc" },
    });

    let resultat;
    if (existingResultat && existingResultat.status === "en_cours") {
      // Mettre à jour le résultat existant
      resultat = await prisma.evaluationResultat.update({
        where: { id: existingResultat.id },
        data: {
          score,
          reponses,
          tempsPassé: tempsPassé || null,
          status: isValidated ? "valide" : "echoue",
          completedAt: new Date(),
        },
      });
    } else {
      // Créer un nouveau résultat
      resultat = await prisma.evaluationResultat.create({
        data: {
          evaluationId,
          apprenantId,
          score,
          reponses,
          tempsPassé: tempsPassé || null,
          status: isValidated ? "valide" : "echoue",
          tentative: (existingResultat?.tentative || 0) + 1,
          completedAt: new Date(),
        },
      });
    }

    // ========================================
    // WORKFLOW ADAPTATION QUALIOPI IND 10
    // ========================================
    let adaptationResult = null;

    // Si c'est un test de POSITIONNEMENT et que le score est insuffisant
    if (evaluation.type === "POSITIONNEMENT" && score < SEUIL_ADAPTATION) {
      console.log(`[Qualiopi IND 10] Score insuffisant (${score}%) - Déclenchement workflow adaptation`);

      try {
        // 1. Vérifier si un Module 0 existe déjà pour cette formation
        let moduleZero = evaluation.formation.modules.find((m) => m.isModuleZero);

        // 2. Si pas de Module 0, le générer automatiquement
        if (!moduleZero && process.env.ANTHROPIC_API_KEY) {
          console.log("[Qualiopi IND 10] Génération automatique du Module 0...");

          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          });

          const moduleZeroPrompt = DEFAULT_PROMPTS.find(
            (p) => p.type === "MODULE_ZERO"
          );

          if (moduleZeroPrompt) {
            const prerequisStr = evaluation.formation.prerequis
              ? typeof evaluation.formation.prerequis === "string"
                ? evaluation.formation.prerequis
                : JSON.stringify(evaluation.formation.prerequis)
              : "Aucun prérequis spécifié";

            // Convertir en tableau pour DynamicPromptContext
            const prerequisArray = prerequisStr.split("\n").filter(Boolean);

            const context = {
              formation: {
                titre: evaluation.formation.titre,
                description: evaluation.formation.description || "",
                prerequis: prerequisArray,
              },
              lacunes: "Lacunes identifiées lors du test de positionnement",
              objectifsPrealables: prerequisStr,
            };

            const userPrompt = injectVariablesInPrompt(
              moduleZeroPrompt.userPromptTemplate,
              context
            );

            const aiResponse = await anthropic.messages.create({
              model: moduleZeroPrompt.model,
              max_tokens: moduleZeroPrompt.maxTokens,
              temperature: moduleZeroPrompt.temperature,
              system: moduleZeroPrompt.systemPrompt,
              messages: [{ role: "user", content: userPrompt }],
            });

            const responseText =
              aiResponse.content[0].type === "text"
                ? aiResponse.content[0].text
                : "";

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const moduleZeroData = JSON.parse(jsonMatch[0]);

              moduleZero = await prisma.module.create({
                data: {
                  formationId: evaluation.formation.id,
                  titre: moduleZeroData.titre || "Module 0 - Mise à niveau",
                  description: moduleZeroData.description || moduleZeroData.objectifGeneral,
                  duree: moduleZeroData.dureeEstimee
                    ? parseInt(moduleZeroData.dureeEstimee) * 60
                    : 120,
                  ordre: -1,
                  isModuleZero: true,
                  contenu: moduleZeroData,
                },
              });

              console.log("[Qualiopi IND 10] Module 0 créé:", moduleZero.id);
            }
          }
        }

        // 3. Générer et envoyer la fiche d'adaptabilité
        if (apprenant.email) {
          console.log("[Qualiopi IND 10] Génération de la fiche d'adaptabilité...");

          // Récupérer le référent pédagogique
          const referentPedagogique = await prisma.organigrammePoste.findFirst({
            where: {
              organizationId,
              type: "REFERENT_PEDAGOGIQUE",
            },
          });

          const fichePrompt = DEFAULT_PROMPTS.find(
            (p) => p.type === "FICHE_ADAPTABILITE"
          );

          let ficheData = {
            titre: "Fiche d'Adaptabilité du Parcours",
            messageApprenant: `Suite à votre test de positionnement, nous avons identifié que certaines bases nécessitent d'être renforcées avant de suivre la formation "${evaluation.formation.titre}". Ne vous inquiétez pas, c'est tout à fait normal ! Nous vous proposons un module de mise à niveau qui vous permettra d'acquérir les fondamentaux nécessaires à votre réussite.`,
            analyseLacunes: {
              scorePositionnement: `${score}%`,
              seuilRequis: `${SEUIL_ADAPTATION}%`,
              domainesAmeliorer: ["Bases à consolider"],
            },
            recommandations: {
              moduleZeroRecommande: true,
              descriptionModule: moduleZero?.description || "Module de mise à niveau adapté à vos besoins",
              dureeEstimee: moduleZero?.duree ? `${Math.floor(moduleZero.duree / 60)}h` : "2-4h",
              modalites: "En ligne / À distance",
            },
            prochainesEtapes: [
              "Consulter le module de mise à niveau dans votre espace apprenant",
              "Suivre le module à votre rythme",
              "Reprendre la formation principale une fois le module terminé",
            ],
          };

          // Si l'IA est configurée, générer une fiche plus personnalisée
          if (process.env.ANTHROPIC_API_KEY && fichePrompt) {
            try {
              const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
              });

              // Préparer les prérequis en tableau
              const fichePrerequisStr = evaluation.formation.prerequis
                ? typeof evaluation.formation.prerequis === "string"
                  ? evaluation.formation.prerequis
                  : JSON.stringify(evaluation.formation.prerequis)
                : "Aucun prérequis spécifié";
              const fichePrerequisArray = fichePrerequisStr.split("\n").filter(Boolean);

              const context = {
                apprenant: {
                  nom: apprenant.nom,
                  prenom: apprenant.prenom,
                  email: apprenant.email,
                },
                formation: {
                  titre: evaluation.formation.titre,
                  description: evaluation.formation.description || "",
                  prerequis: fichePrerequisArray,
                },
                scorePositionnement: score.toString(),
                analyseReponses: "Analyse des réponses au test de positionnement",
                organisation: {
                  nom: evaluation.formation.organization.name || "",
                  email: evaluation.formation.organization.email || "",
                },
                referentPedagogique: referentPedagogique
                  ? `${referentPedagogique.prenom} ${referentPedagogique.nom}`
                  : "Le référent pédagogique",
              };

              const userPrompt = injectVariablesInPrompt(
                fichePrompt.userPromptTemplate,
                context
              );

              const aiResponse = await anthropic.messages.create({
                model: fichePrompt.model,
                max_tokens: fichePrompt.maxTokens,
                temperature: fichePrompt.temperature,
                system: fichePrompt.systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
              });

              const responseText =
                aiResponse.content[0].type === "text"
                  ? aiResponse.content[0].text
                  : "";

              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                ficheData = JSON.parse(jsonMatch[0]);
              }
            } catch (aiError) {
              console.error("[Qualiopi IND 10] Erreur génération fiche IA:", aiError);
              // Utiliser la fiche par défaut
            }
          }

          // Envoyer l'email à l'apprenant
          const primaryColor = evaluation.formation.organization.primaryColor || "#4277FF";

          const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Adaptation de votre parcours</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); padding: 30px; border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                          Adaptation de votre parcours
                        </h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                          Formation : ${evaluation.formation.titre}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px;">
                        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; line-height: 1.6;">
                          Bonjour ${apprenant.prenom},
                        </p>
                        <p style="margin: 0 0 20px 0; color: #555; font-size: 15px; line-height: 1.6;">
                          ${ficheData.messageApprenant}
                        </p>
                        <div style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 8px; padding: 20px; margin: 20px 0;">
                          <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 16px;">
                            Module de mise à niveau disponible
                          </h3>
                          <p style="margin: 0; color: #33691e; font-size: 14px;">
                            ${ficheData.recommandations?.descriptionModule || "Un module de remise à niveau vous attend dans votre espace apprenant."}
                          </p>
                          <p style="margin: 10px 0 0 0; color: #558b2f; font-size: 13px;">
                            Durée estimée : ${ficheData.recommandations?.dureeEstimee || "2-4h"}
                          </p>
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                          <p style="margin: 0; color: #666; font-size: 14px;">
                            Pour toute question, contactez ${referentPedagogique ? `${referentPedagogique.prenom} ${referentPedagogique.nom}` : "notre équipe pédagogique"}.
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 30px; background: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                        <p style="margin: 0; color: #999; font-size: 12px;">
                          ${evaluation.formation.organization.name || ""}
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

          await sendEmail(
            {
              to: apprenant.email,
              subject: `Adaptation de votre parcours - ${evaluation.formation.titre}`,
              html: emailHtml,
              type: "ADAPTATION_PARCOURS",
              toName: `${apprenant.prenom} ${apprenant.nom}`,
              apprenantId: apprenant.id,
              formationId: evaluation.formation.id,
            },
            organizationId
          );

          console.log("[Qualiopi IND 10] Fiche d'adaptabilité envoyée à:", apprenant.email);
        }

        adaptationResult = {
          triggered: true,
          moduleZeroCreated: !!moduleZero,
          ficheEnvoyee: !!apprenant.email,
          reason: `Score de positionnement (${score}%) inférieur au seuil (${SEUIL_ADAPTATION}%)`,
        };
      } catch (adaptError) {
        console.error("[Qualiopi IND 10] Erreur workflow adaptation:", adaptError);
        adaptationResult = {
          triggered: true,
          error: adaptError instanceof Error ? adaptError.message : "Erreur inconnue",
        };
      }
    }

    return NextResponse.json({
      success: true,
      resultat: {
        id: resultat.id,
        score,
        status: resultat.status,
        isValidated,
        tentative: resultat.tentative,
      },
      adaptation: adaptationResult,
    });
  } catch (error) {
    console.error("Erreur soumission évaluation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la soumission de l'évaluation" },
      { status: 500 }
    );
  }
}
