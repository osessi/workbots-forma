// ===========================================
// API DIPLOME PDF - GET /api/apprenant/certifications/diplome
// ===========================================
// Corrections 480-481: Génération du diplôme de formation
// Disponible si l'apprenant a obtenu au moins la moyenne à l'évaluation finale

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Décoder et valider le token apprenant
function decodeApprenantToken(token: string): { apprenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.apprenantId || !decoded.organizationId) {
      return null;
    }

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

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function generateDiplomeHTML(data: {
  nom: string;
  prenom: string;
  formationTitre: string;
  organisme: string;
  dateDebut: string;
  dateFin: string;
  score: number;
  sessionReference: string;
  dateObtention: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diplôme - ${data.prenom} ${data.nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Great+Vibes&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .diploma {
      background: linear-gradient(135deg, #fefce8 0%, #fef9c3 50%, #fef3c7 100%);
      width: 297mm;
      height: 210mm;
      padding: 30px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      position: relative;
      overflow: hidden;
    }

    /* Bordure ornementale */
    .outer-border {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 3px solid #b45309;
      pointer-events: none;
    }

    .inner-border {
      position: absolute;
      top: 25px;
      left: 25px;
      right: 25px;
      bottom: 25px;
      border: 1px solid #d97706;
      pointer-events: none;
    }

    /* Coins décoratifs */
    .corner {
      position: absolute;
      width: 80px;
      height: 80px;
      pointer-events: none;
    }

    .corner svg {
      width: 100%;
      height: 100%;
      fill: #b45309;
    }

    .corner.top-left { top: 20px; left: 20px; }
    .corner.top-right { top: 20px; right: 20px; transform: rotate(90deg); }
    .corner.bottom-left { bottom: 20px; left: 20px; transform: rotate(-90deg); }
    .corner.bottom-right { bottom: 20px; right: 20px; transform: rotate(180deg); }

    /* Motif de fond */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Great Vibes', cursive;
      font-size: 200px;
      color: rgba(180, 83, 9, 0.05);
      pointer-events: none;
      white-space: nowrap;
    }

    .content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px 60px;
    }

    .organisme {
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 15px;
    }

    .title {
      font-family: 'Cinzel', serif;
      font-size: 52px;
      font-weight: 700;
      color: #78350f;
      text-transform: uppercase;
      letter-spacing: 8px;
      margin-bottom: 5px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }

    .subtitle {
      font-family: 'Cinzel', serif;
      font-size: 16px;
      font-weight: 500;
      color: #92400e;
      letter-spacing: 6px;
      text-transform: uppercase;
      margin-bottom: 30px;
    }

    .decorative-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin: 20px 0;
    }

    .line {
      width: 100px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #b45309, transparent);
    }

    .star {
      font-size: 14px;
      color: #b45309;
    }

    .certify-text {
      font-size: 13px;
      color: #78350f;
      margin-bottom: 15px;
      font-style: italic;
    }

    .participant-name {
      font-family: 'Great Vibes', cursive;
      font-size: 56px;
      color: #78350f;
      margin-bottom: 25px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    }

    .formation-label {
      font-size: 12px;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 10px;
    }

    .formation-title {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      font-weight: 600;
      color: #78350f;
      margin-bottom: 25px;
      max-width: 600px;
      line-height: 1.3;
    }

    .details-row {
      display: flex;
      justify-content: center;
      gap: 50px;
      margin: 20px 0;
    }

    .detail-item {
      text-align: center;
    }

    .detail-label {
      font-size: 10px;
      color: #a16207;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 600;
      color: #78350f;
    }

    .score-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #b45309, #d97706);
      color: white;
      padding: 8px 25px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 600;
      margin: 15px 0;
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      margin-top: 30px;
      padding: 0 40px;
    }

    .date-block {
      text-align: left;
    }

    .date-text {
      font-size: 11px;
      color: #92400e;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      width: 180px;
      height: 1px;
      background: #b45309;
      margin-bottom: 8px;
    }

    .signature-label {
      font-size: 10px;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .seal {
      width: 70px;
      height: 70px;
      border: 3px solid #b45309;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cinzel', serif;
      font-size: 10px;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
      line-height: 1.2;
    }

    .reference {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      color: #a16207;
      letter-spacing: 1px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .diploma {
        box-shadow: none;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="diploma">
    <div class="outer-border"></div>
    <div class="inner-border"></div>

    <!-- Coins décoratifs -->
    <div class="corner top-left">
      <svg viewBox="0 0 80 80">
        <path d="M0,0 L80,0 L80,10 L10,10 L10,80 L0,80 Z M15,15 L70,15 L70,20 L20,20 L20,70 L15,70 Z"/>
      </svg>
    </div>
    <div class="corner top-right">
      <svg viewBox="0 0 80 80">
        <path d="M0,0 L80,0 L80,10 L10,10 L10,80 L0,80 Z M15,15 L70,15 L70,20 L20,20 L20,70 L15,70 Z"/>
      </svg>
    </div>
    <div class="corner bottom-left">
      <svg viewBox="0 0 80 80">
        <path d="M0,0 L80,0 L80,10 L10,10 L10,80 L0,80 Z M15,15 L70,15 L70,20 L20,20 L20,70 L15,70 Z"/>
      </svg>
    </div>
    <div class="corner bottom-right">
      <svg viewBox="0 0 80 80">
        <path d="M0,0 L80,0 L80,10 L10,10 L10,80 L0,80 Z M15,15 L70,15 L70,20 L20,20 L20,70 L15,70 Z"/>
      </svg>
    </div>

    <div class="watermark">Diplôme</div>

    <div class="content">
      <p class="organisme">${data.organisme}</p>
      <h1 class="title">Diplôme</h1>
      <p class="subtitle">de Formation Professionnelle</p>

      <div class="decorative-line">
        <div class="line"></div>
        <span class="star">✦</span>
        <div class="line"></div>
      </div>

      <p class="certify-text">Décerné à</p>
      <p class="participant-name">${data.prenom} ${data.nom}</p>

      <p class="formation-label">Pour avoir complété avec succès la formation</p>
      <p class="formation-title">${data.formationTitre}</p>

      <div class="score-badge">
        Score obtenu : ${Math.round(data.score)}%
      </div>

      <div class="details-row">
        <div class="detail-item">
          <p class="detail-label">Période</p>
          <p class="detail-value">${data.dateDebut} — ${data.dateFin}</p>
        </div>
        <div class="detail-item">
          <p class="detail-label">Date d'obtention</p>
          <p class="detail-value">${data.dateObtention}</p>
        </div>
      </div>

      <div class="footer">
        <div class="date-block">
          <p class="date-text">Fait le ${formatDate(new Date())}</p>
        </div>

        <div class="seal">
          Certifié<br/>Conforme
        </div>

        <div class="signature-block">
          <div class="signature-line"></div>
          <p class="signature-label">Le Directeur</p>
        </div>
      </div>
    </div>

    <p class="reference">Réf: ${data.sessionReference}</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token || !sessionId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId } = decoded;

    // Récupérer la participation
    const participation = await prisma.sessionParticipantNew.findFirst({
      where: {
        apprenantId,
        client: { sessionId },
      },
      include: {
        client: {
          include: {
            session: {
              include: {
                journees: {
                  orderBy: { date: "asc" },
                },
                formation: {
                  select: {
                    id: true,
                    titre: true,
                    evaluations: {
                      where: {
                        type: "EVALUATION_FINALE",
                        isActive: true,
                      },
                    },
                  },
                },
                organization: {
                  select: { name: true },
                },
              },
            },
          },
        },
        apprenant: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 404 }
      );
    }

    const session = participation.client.session;
    const formation = session.formation;
    const journees = session.journees;

    // Vérifier que le diplôme est disponible
    if (formation.evaluations.length === 0) {
      return NextResponse.json(
        { error: "Aucune évaluation finale définie pour cette formation" },
        { status: 403 }
      );
    }

    const evaluationFinale = formation.evaluations[0];

    // Chercher le résultat de l'apprenant
    const resultat = await prisma.evaluationResultat.findFirst({
      where: {
        evaluationId: evaluationFinale.id,
        apprenantId,
        status: { in: ["termine", "valide"] },
      },
      orderBy: {
        tentative: "desc",
      },
    });

    if (!resultat || resultat.score === null) {
      return NextResponse.json(
        { error: "Vous n'avez pas encore passé l'évaluation finale" },
        { status: 403 }
      );
    }

    const scoreMinimum = evaluationFinale.scoreMinimum || 50;

    if (resultat.score < scoreMinimum) {
      return NextResponse.json(
        { error: `Score insuffisant. Minimum requis: ${scoreMinimum}%` },
        { status: 403 }
      );
    }

    // Générer le HTML du diplôme
    const html = generateDiplomeHTML({
      nom: participation.apprenant.nom,
      prenom: participation.apprenant.prenom,
      formationTitre: formation.titre,
      organisme: session.organization?.name || "Organisme de formation",
      dateDebut: journees.length > 0 ? formatDate(new Date(journees[0].date)) : "N/A",
      dateFin: journees.length > 0 ? formatDate(new Date(journees[journees.length - 1].date)) : "N/A",
      score: resultat.score,
      sessionReference: session.reference,
      dateObtention: resultat.completedAt
        ? formatDate(new Date(resultat.completedAt))
        : formatDate(new Date()),
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="diplome-${session.reference}.html"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération diplôme:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du diplôme" },
      { status: 500 }
    );
  }
}
