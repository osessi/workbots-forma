// ===========================================
// API: ENVOYER LES ENQUÊTES DE SATISFACTION
// POST /api/satisfaction/enquetes/envoyer - Envoyer emails
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { EvaluationSatisfactionType } from "@prisma/client";

// Helper pour créer le client Supabase
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, organizationId: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sessionId, type, enqueteIds } = body;

    // Soit on envoie pour une session entière, soit pour des enquêtes spécifiques
    let enquetesToSend;

    if (enqueteIds && Array.isArray(enqueteIds)) {
      // Enquêtes spécifiques
      enquetesToSend = await prisma.evaluationSatisfaction.findMany({
        where: {
          id: { in: enqueteIds },
          organizationId: dbUser.organizationId,
          status: "PENDING",
          sentAt: null,
        },
        include: {
          apprenant: {
            select: {
              nom: true,
              prenom: true,
              email: true,
            },
          },
          session: {
            include: {
              formation: {
                select: {
                  titre: true,
                },
              },
            },
          },
        },
      });
    } else if (sessionId) {
      // Toutes les enquêtes d'une session
      const whereClause: Record<string, unknown> = {
        sessionId,
        organizationId: dbUser.organizationId,
        status: "PENDING",
        sentAt: null,
      };

      if (type) {
        whereClause.type = type as EvaluationSatisfactionType;
      }

      enquetesToSend = await prisma.evaluationSatisfaction.findMany({
        where: whereClause,
        include: {
          apprenant: {
            select: {
              nom: true,
              prenom: true,
              email: true,
            },
          },
          session: {
            include: {
              formation: {
                select: {
                  titre: true,
                },
              },
            },
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: "sessionId ou enqueteIds requis" },
        { status: 400 }
      );
    }

    if (enquetesToSend.length === 0) {
      return NextResponse.json(
        { message: "Aucune enquête à envoyer", sent: 0 }
      );
    }

    // Récupérer les informations de l'organisation pour l'email
    const organization = await prisma.organization.findUnique({
      where: { id: dbUser.organizationId },
      select: {
        name: true,
        email: true,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.workbots.io";
    let sentCount = 0;
    const errors: string[] = [];

    for (const enquete of enquetesToSend) {
      if (!enquete.apprenant.email) {
        errors.push(`${enquete.apprenant.prenom} ${enquete.apprenant.nom}: pas d'email`);
        continue;
      }

      try {
        // Construire le lien vers l'enquête
        const enqueteUrl = `${baseUrl}/satisfaction/${enquete.token}`;

        // Créer l'enregistrement d'email envoyé
        await prisma.sentEmail.create({
          data: {
            organizationId: dbUser.organizationId,
            toEmail: enquete.apprenant.email,
            toName: `${enquete.apprenant.prenom} ${enquete.apprenant.nom}`,
            subject: enquete.type === "CHAUD"
              ? `Votre avis sur la formation "${enquete.session.formation.titre}"`
              : `Évaluation à froid - Formation "${enquete.session.formation.titre}"`,
            htmlContent: generateSatisfactionEmailHtml({
              prenom: enquete.apprenant.prenom,
              formationTitre: enquete.session.formation.titre,
              organizationName: organization?.name || "Notre organisme",
              enqueteUrl,
              type: enquete.type,
            }),
            type: "OTHER",
            sessionId: enquete.sessionId,
            apprenantId: enquete.apprenantId,
            sentByUserId: dbUser.id,
          },
        });

        // Mettre à jour l'enquête
        await prisma.evaluationSatisfaction.update({
          where: { id: enquete.id },
          data: { sentAt: new Date() },
        });

        sentCount++;
      } catch (err) {
        console.error(`Erreur envoi enquête ${enquete.id}:`, err);
        errors.push(`${enquete.apprenant.prenom} ${enquete.apprenant.nom}: erreur technique`);
      }
    }

    return NextResponse.json({
      sent: sentCount,
      total: enquetesToSend.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${sentCount} enquête(s) envoyée(s) sur ${enquetesToSend.length}`,
    });
  } catch (error) {
    console.error("[API] POST /api/satisfaction/enquetes/envoyer error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Génère le contenu HTML de l'email
function generateSatisfactionEmailHtml(params: {
  prenom: string;
  formationTitre: string;
  organizationName: string;
  enqueteUrl: string;
  type: EvaluationSatisfactionType;
}): string {
  const { prenom, formationTitre, organizationName, enqueteUrl, type } = params;

  const intro = type === "CHAUD"
    ? `Vous venez de terminer la formation "${formationTitre}". Votre avis est essentiel pour nous permettre d'améliorer nos formations.`
    : `Il y a 3 mois, vous avez suivi la formation "${formationTitre}". Nous aimerions savoir comment vous avez pu mettre en pratique vos acquis.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">
      ${type === "CHAUD" ? "📝 Évaluation de satisfaction" : "📊 Évaluation à froid"}
    </h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Bonjour ${prenom},</p>

    <p>${intro}</p>

    <p>Cette enquête ne prend que <strong>2-3 minutes</strong> et vos réponses resteront anonymes.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${enqueteUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Donner mon avis
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <a href="${enqueteUrl}" style="color: #667eea;">${enqueteUrl}</a>
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="color: #666; font-size: 14px; margin: 0;">
      Merci de votre confiance,<br>
      L'équipe ${organizationName}
    </p>
  </div>
</body>
</html>
  `.trim();
}
