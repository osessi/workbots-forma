// ===========================================
// API CERTIFICATE - Générer un certificat PDF
// ===========================================
// GET /api/apprenant/certificate/[id] - Télécharger le certificat d'un participant
// Qualiopi IND 3 - Certification

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Récupérer les infos du participant et de sa certification
    const participantData = await prisma.sessionParticipantNew.findUnique({
      where: { id },
      include: {
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        client: {
          include: {
            session: {
              include: {
                formation: {
                  select: {
                    titre: true,
                    fichePedagogique: true,
                    numeroFicheRS: true,
                  },
                },
                organization: {
                  select: {
                    name: true,
                    nomCommercial: true,
                    logo: true,
                    adresse: true,
                    siret: true,
                    numeroFormateur: true,
                  },
                },
                journees: {
                  orderBy: { ordre: "asc" },
                  select: {
                    date: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participantData) {
      return NextResponse.json(
        { error: "Participant non trouvé" },
        { status: 404 }
      );
    }

    if (!participantData.certificationObtenue) {
      return NextResponse.json(
        { error: "Ce participant n'a pas obtenu de certification" },
        { status: 400 }
      );
    }

    const session = participantData.client.session;
    const formation = session.formation;
    const org = session.organization;
    const apprenant = participantData.apprenant;

    // Extraire dureeHeures de fichePedagogique (JSON)
    const fichePedagogique = formation.fichePedagogique as Record<string, unknown> | null;
    const dureeHeures = (fichePedagogique?.dureeHeures as number | null) || null;

    // Calculer les dates de formation
    const journees = session.journees;
    const dateDebut = journees.length > 0 ? new Date(journees[0].date) : null;
    const dateFin = journees.length > 0 ? new Date(journees[journees.length - 1].date) : null;

    // Générer le HTML du certificat
    const certificateHtml = generateCertificateHtml({
      apprenant,
      formation: {
        titre: formation.titre,
        dureeHeures,
        numeroFicheRS: formation.numeroFicheRS,
      },
      org,
      dateCertification: participantData.dateCertification,
      numeroCertificat: participantData.numeroCertificat,
      dateDebut,
      dateFin,
      sessionReference: session.reference,
    });

    // Retourner le HTML (pour l'instant, le PDF nécessiterait une lib comme puppeteer)
    // On retourne un HTML stylé qui peut être imprimé en PDF
    return new NextResponse(certificateHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="certificat-${participantData.numeroCertificat || id}.html"`,
      },
    });

  } catch (error) {
    console.error("Erreur génération certificat:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du certificat" },
      { status: 500 }
    );
  }
}

// Fonction pour générer le HTML du certificat
function generateCertificateHtml({
  apprenant,
  formation,
  org,
  dateCertification,
  numeroCertificat,
  dateDebut,
  dateFin,
  sessionReference,
}: {
  apprenant: { nom: string; prenom: string };
  formation: { titre: string; dureeHeures: number | null; numeroFicheRS: string | null };
  org: { name: string; nomCommercial: string | null; logo: string | null; adresse: string | null; siret: string | null; numeroFormateur: string | null };
  dateCertification: Date | null;
  numeroCertificat: string | null;
  dateDebut: Date | null;
  dateFin: Date | null;
  sessionReference: string;
}) {
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificat - ${apprenant.prenom} ${apprenant.nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #fef3c7 0%, #fef3c7 50%, #fde68a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .certificate {
      background: white;
      width: 100%;
      max-width: 900px;
      padding: 60px;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      position: relative;
      border: 3px solid #d97706;
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      pointer-events: none;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo {
      max-height: 60px;
      margin-bottom: 20px;
    }

    .org-name {
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      color: #d97706;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 16px;
      color: #6b7280;
      font-weight: 300;
    }

    .content {
      text-align: center;
      margin-bottom: 40px;
    }

    .certify-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .recipient {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #1f2937;
      margin-bottom: 20px;
    }

    .completion-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 15px;
    }

    .formation-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
      padding: 15px 30px;
      background: #fef3c7;
      display: inline-block;
      border-radius: 8px;
    }

    .details {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 30px;
      flex-wrap: wrap;
    }

    .detail-item {
      text-align: center;
    }

    .detail-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
    }

    .signature {
      text-align: center;
    }

    .signature-line {
      width: 200px;
      height: 1px;
      background: #d1d5db;
      margin-bottom: 10px;
    }

    .signature-label {
      font-size: 12px;
      color: #6b7280;
    }

    .certificate-number {
      text-align: right;
    }

    .cert-num-label {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
    }

    .cert-num-value {
      font-family: monospace;
      font-size: 14px;
      color: #374151;
    }

    .rs-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 10px;
      padding: 5px 15px;
      background: #ecfdf5;
      color: #059669;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      ${org.logo ? `<img src="${org.logo}" alt="${org.name}" class="logo">` : ''}
      <p class="org-name">${org.nomCommercial || org.name}</p>
      <h1 class="title">Certificat de Réussite</h1>
      <p class="subtitle">Formation Certifiante</p>
    </div>

    <div class="content">
      <p class="certify-text">Nous certifions que</p>
      <h2 class="recipient">${apprenant.prenom} ${apprenant.nom}</h2>
      <p class="completion-text">a suivi avec succès et obtenu la certification pour la formation</p>
      <div class="formation-title">${formation.titre}</div>

      ${formation.numeroFicheRS ? `
        <div class="rs-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Fiche RS : ${formation.numeroFicheRS}
        </div>
      ` : ''}

      <div class="details">
        ${dateDebut && dateFin ? `
          <div class="detail-item">
            <p class="detail-label">Période de formation</p>
            <p class="detail-value">${formatDate(dateDebut)} - ${formatDate(dateFin)}</p>
          </div>
        ` : ''}
        ${formation.dureeHeures ? `
          <div class="detail-item">
            <p class="detail-label">Durée</p>
            <p class="detail-value">${formation.dureeHeures} heures</p>
          </div>
        ` : ''}
        <div class="detail-item">
          <p class="detail-label">Date d'obtention</p>
          <p class="detail-value">${formatDate(dateCertification)}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <p class="signature-label">Le responsable de formation</p>
      </div>

      <div class="certificate-number">
        ${numeroCertificat ? `
          <p class="cert-num-label">N° Certificat</p>
          <p class="cert-num-value">${numeroCertificat}</p>
        ` : ''}
        <p style="font-size: 10px; color: #9ca3af; margin-top: 5px;">Ref: ${sessionReference}</p>
        ${org.numeroFormateur ? `<p style="font-size: 10px; color: #9ca3af;">NDA: ${org.numeroFormateur}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
`;
}
