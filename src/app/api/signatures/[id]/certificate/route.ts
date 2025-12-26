// ===========================================
// API SIGNATURE ÉLECTRONIQUE - Certificat de Signature
// ===========================================
// GET /api/signatures/[id]/certificate - Générer le certificat de signature

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Générer/Afficher le certificat de signature
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le document avec sa signature
    const document = await prisma.signatureDocument.findUnique({
      where: { id },
      include: {
        signatures: {
          orderBy: { signedAt: "desc" },
          take: 1,
        },
        organization: {
          select: {
            name: true,
            logo: true,
          },
        },
        session: {
          select: {
            formation: {
              select: {
                titre: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    if (document.status !== "SIGNED" || document.signatures.length === 0) {
      return NextResponse.json(
        { error: "Ce document n'a pas encore été signé" },
        { status: 400 }
      );
    }

    const signature = document.signatures[0];

    // Générer le HTML du certificat
    const certificateHtml = generateCertificateHtml({
      document,
      signature,
      organization: document.organization,
    });

    // Retourner le HTML ou générer un PDF
    const format = request.nextUrl.searchParams.get("format");

    if (format === "json") {
      return NextResponse.json({
        certificate: {
          documentId: document.id,
          documentTitle: document.titre,
          documentType: document.documentType,
          signataire: {
            name: signature.signataireName,
            email: signature.signataireEmail,
          },
          signature: {
            id: signature.id,
            signedAt: signature.signedAt,
            authMethod: signature.authMethod,
            documentHash: signature.documentHash,
            signatureHash: signature.signatureHash,
            ipAddress: signature.ipAddress,
            consentAccepted: signature.consentAccepted,
          },
          organization: document.organization?.name,
          formation: document.session?.formation?.titre,
        },
      });
    }

    // Par défaut, retourner le HTML
    return new NextResponse(certificateHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
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

// Générer le HTML du certificat
function generateCertificateHtml({
  document,
  signature,
  organization,
}: {
  document: {
    id: string;
    titre: string;
    documentType: string;
  };
  signature: {
    id: string;
    signataireName: string;
    signataireEmail: string;
    signedAt: Date;
    authMethod: string;
    documentHash: string;
    signatureHash: string;
    ipAddress: string | null;
    userAgent: string | null;
    consentText: string;
  };
  organization: {
    name: string;
    logo: string | null;
  } | null;
}): string {
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Europe/Paris",
  }).format(signature.signedAt);

  const authMethodLabel = {
    EMAIL_ONLY: "Validation par email",
    EMAIL_SMS: "Double authentification (Email + SMS)",
    EMAIL_CODE: "Email avec code de vérification",
  }[signature.authMethod] || signature.authMethod;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificat de Signature Électronique</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .certificate {
      max-width: 800px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      border-radius: 8px;
      background: white;
      padding: 10px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
      letter-spacing: 1px;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item.full {
      grid-column: 1 / -1;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }
    .info-value {
      font-weight: 600;
      color: #1e3a5f;
      word-break: break-all;
    }
    .hash-value {
      font-family: monospace;
      font-size: 11px;
      background: #e9ecef;
      padding: 10px;
      border-radius: 4px;
      margin-top: 5px;
    }
    .validity-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #d4edda;
      color: #155724;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .validity-badge svg {
      width: 20px;
      height: 20px;
    }
    .consent-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      border-radius: 4px;
      font-size: 14px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .qr-placeholder {
      width: 100px;
      height: 100px;
      background: #e9ecef;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body { background: white; }
      .certificate { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      ${organization?.logo ? `<img src="${organization.logo}" alt="Logo" class="logo">` : ""}
      <h1>Certificat de Signature Électronique</h1>
      <div class="subtitle">${organization?.name || "Organisme de Formation"}</div>
    </div>

    <div class="content">
      <div style="text-align: center; margin-bottom: 30px;">
        <div class="validity-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Document signé électroniquement
        </div>
      </div>

      <div class="section">
        <div class="section-title">Informations du Document</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Titre du document</div>
            <div class="info-value">${document.titre}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Type de document</div>
            <div class="info-value">${document.documentType}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Identifiant unique</div>
            <div class="info-value">${document.id}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date et heure de signature</div>
            <div class="info-value">${formattedDate}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Signataire</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nom</div>
            <div class="info-value">${signature.signataireName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${signature.signataireEmail}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Méthode d'authentification</div>
            <div class="info-value">${authMethodLabel}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Adresse IP</div>
            <div class="info-value">${signature.ipAddress || "Non disponible"}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Intégrité du Document (SHA-256)</div>
        <div class="info-grid">
          <div class="info-item full">
            <div class="info-label">Empreinte du document</div>
            <div class="hash-value">${signature.documentHash}</div>
          </div>
          <div class="info-item full">
            <div class="info-label">Empreinte de la signature</div>
            <div class="hash-value">${signature.signatureHash}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Consentement</div>
        <div class="consent-box">
          ${signature.consentText}
        </div>
      </div>

      <div class="qr-placeholder">
        QR Code<br>vérification
      </div>
    </div>

    <div class="footer">
      <p>Ce certificat atteste que le document mentionné ci-dessus a été signé électroniquement conformément au règlement (UE) n° 910/2014 (eIDAS) et à l'article 1367 du Code civil français.</p>
      <p style="margin-top: 10px;">Identifiant de signature: <strong>${signature.id}</strong></p>
      <p style="margin-top: 5px;">Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
