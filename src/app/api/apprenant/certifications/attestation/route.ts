// ===========================================
// API ATTESTATION PDF - GET /api/apprenant/certifications/attestation
// ===========================================
// Correction 479: Génération de l'attestation de fin de formation

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

function generateAttestationHTML(data: {
  nom: string;
  prenom: string;
  formationTitre: string;
  organisme: string;
  dateDebut: string;
  dateFin: string;
  dureeHeures: number;
  sessionReference: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attestation de fin de formation - ${data.prenom} ${data.nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .attestation {
      background: white;
      width: 210mm;
      min-height: 297mm;
      padding: 40px 50px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .border-decoration {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #e2e8f0;
      pointer-events: none;
    }

    .corner-decoration {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 3px solid #3b82f6;
    }

    .corner-decoration.top-left {
      top: 10px;
      left: 10px;
      border-right: none;
      border-bottom: none;
    }

    .corner-decoration.top-right {
      top: 10px;
      right: 10px;
      border-left: none;
      border-bottom: none;
    }

    .corner-decoration.bottom-left {
      bottom: 10px;
      left: 10px;
      border-right: none;
      border-top: none;
    }

    .corner-decoration.bottom-right {
      bottom: 10px;
      right: 10px;
      border-left: none;
      border-top: none;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .organisme {
      font-size: 14px;
      font-weight: 600;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 30px;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    .divider {
      width: 100px;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      margin: 30px auto;
      border-radius: 2px;
    }

    .content {
      text-align: center;
      margin: 50px 0;
    }

    .certify-text {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 20px;
    }

    .participant-name {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 30px;
    }

    .formation-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 10px;
    }

    .formation-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 40px;
      padding: 0 40px;
      line-height: 1.4;
    }

    .details {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin: 40px 0;
    }

    .detail-item {
      text-align: center;
    }

    .detail-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .footer {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .date-lieu {
      text-align: left;
    }

    .date-lieu p {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 5px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      width: 200px;
      height: 1px;
      background: #cbd5e1;
      margin-bottom: 10px;
    }

    .signature-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .reference {
      position: absolute;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: #94a3b8;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .attestation {
        box-shadow: none;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="attestation">
    <div class="border-decoration"></div>
    <div class="corner-decoration top-left"></div>
    <div class="corner-decoration top-right"></div>
    <div class="corner-decoration bottom-left"></div>
    <div class="corner-decoration bottom-right"></div>

    <div class="header">
      <p class="organisme">${data.organisme}</p>
      <h1 class="title">Attestation</h1>
      <p class="subtitle">de fin de formation</p>
    </div>

    <div class="divider"></div>

    <div class="content">
      <p class="certify-text">Nous certifions que</p>
      <p class="participant-name">${data.prenom} ${data.nom}</p>
      <p class="formation-label">a suivi avec succès la formation</p>
      <p class="formation-title">${data.formationTitre}</p>

      <div class="details">
        <div class="detail-item">
          <p class="detail-label">Du</p>
          <p class="detail-value">${data.dateDebut}</p>
        </div>
        <div class="detail-item">
          <p class="detail-label">Au</p>
          <p class="detail-value">${data.dateFin}</p>
        </div>
        <div class="detail-item">
          <p class="detail-label">Durée</p>
          <p class="detail-value">${data.dureeHeures}h</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="date-lieu">
        <p>Fait le ${formatDate(new Date())}</p>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <p class="signature-label">Le Responsable de formation</p>
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
                    titre: true,
                    fichePedagogique: true,
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
    const journees = session.journees;

    // Vérifier que l'attestation est disponible (1h avant fin de session)
    if (journees.length > 0) {
      const derniereJournee = journees[journees.length - 1];
      const heureFinAprem = derniereJournee.heureFinAprem || "17:30";
      const [heureH, heureM] = heureFinAprem.split(":").map(Number);

      const dateFinSession = new Date(derniereJournee.date);
      dateFinSession.setHours(heureH, heureM, 0, 0);

      const dateDisponibilite = new Date(dateFinSession.getTime() - 60 * 60 * 1000);

      if (new Date() < dateDisponibilite) {
        return NextResponse.json(
          { error: "Attestation non encore disponible" },
          { status: 403 }
        );
      }
    }

    // Calculer la durée
    const fichePedagogique = session.formation.fichePedagogique as { dureeHeures?: number } | null;
    const dureeHeures = fichePedagogique?.dureeHeures || journees.length * 7;

    // Générer le HTML
    const html = generateAttestationHTML({
      nom: participation.apprenant.nom,
      prenom: participation.apprenant.prenom,
      formationTitre: session.formation.titre,
      organisme: session.organization?.name || "Organisme de formation",
      dateDebut: journees.length > 0 ? formatDate(new Date(journees[0].date)) : "N/A",
      dateFin: journees.length > 0 ? formatDate(new Date(journees[journees.length - 1].date)) : "N/A",
      dureeHeures,
      sessionReference: session.reference,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="attestation-${session.reference}.html"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération attestation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'attestation" },
      { status: 500 }
    );
  }
}
