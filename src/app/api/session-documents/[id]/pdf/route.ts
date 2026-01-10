// ===========================================
// API SESSION DOCUMENT PDF - GET /api/session-documents/[id]/pdf
// ===========================================
// Génère un PDF à partir du contenu HTML d'un document de session
// Accessible avec un token apprenant ou intervenant

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { generatePDFWithOrganisation, OrganisationInfo } from "@/lib/services/pdf-generator";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Labels pour les types de documents
const DOCUMENT_LABELS: Record<string, string> = {
  CONVENTION: "Convention de formation",
  CONTRAT_FORMATION: "Contrat de formation",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation de présence",
  ATTESTATION_FIN: "Attestation de fin de formation",
  CERTIFICAT: "Certificat",
  FEUILLE_EMARGEMENT: "Feuille d'émargement",
  REGLEMENT_INTERIEUR: "Règlement intérieur",
  CONDITIONS_GENERALES_VENTE: "Conditions générales de vente",
  FACTURE: "Facture",
  AUTRE: "Document",
};

// Décoder le token (apprenant ou intervenant)
function decodeToken(token: string): {
  apprenantId?: string;
  intervenantId?: string;
  organizationId: string;
} | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));

    if (!decoded.organizationId) {
      return null;
    }

    // Vérifier expiration
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }

    return {
      apprenantId: decoded.apprenantId,
      intervenantId: decoded.intervenantId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

// Wrapping HTML avec styles pour le PDF
function wrapHtmlForPdf(html: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 25mm 15mm 30mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 18pt;
      color: #1a1a1a;
      margin-bottom: 15px;
      border-bottom: 2px solid #4277FF;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 14pt;
      color: #333;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 12pt;
      color: #555;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    p {
      margin: 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    .logo {
      max-height: 60px;
    }
    .document-info {
      text-align: right;
      font-size: 10pt;
      color: #666;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .signature-zone {
      margin-top: 40px;
      padding: 20px;
      border: 1px dashed #ccc;
      min-height: 80px;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    li {
      margin: 5px 0;
    }
    strong {
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    // Décoder le token
    const decoded = decodeToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    // Chercher le document dans SessionDocumentNew
    let document = await prisma.sessionDocumentNew.findFirst({
      where: {
        id,
        session: {
          organizationId: decoded.organizationId,
        },
      },
      include: {
        session: {
          include: {
            organization: {
              select: {
                name: true,
                nomCommercial: true,
                siret: true,
                numeroFormateur: true,
                prefectureRegion: true,
                adresse: true,
                codePostal: true,
                ville: true,
                telephone: true,
                email: true,
                logo: true,
                representantNom: true,
                representantPrenom: true,
              },
            },
            formation: {
              select: {
                titre: true,
              },
            },
          },
        },
      },
    });

    // Si pas trouvé, chercher dans l'ancien système SessionDocument
    if (!document) {
      const oldDocument = await prisma.sessionDocument.findFirst({
        where: {
          id,
          session: {
            organizationId: decoded.organizationId,
          },
        },
        include: {
          session: {
            include: {
              organization: {
                select: {
                  name: true,
                  nomCommercial: true,
                  siret: true,
                  numeroFormateur: true,
                  prefectureRegion: true,
                  adresse: true,
                  codePostal: true,
                  ville: true,
                  telephone: true,
                  email: true,
                  logo: true,
                  representantNom: true,
                  representantPrenom: true,
                },
              },
              formation: {
                select: {
                  titre: true,
                },
              },
            },
          },
        },
      });

      if (oldDocument) {
        // Convertir au format attendu
        document = {
          id: oldDocument.id,
          sessionId: oldDocument.sessionId,
          type: oldDocument.type,
          clientId: oldDocument.clientId,
          participantId: oldDocument.apprenantId,
          titre: oldDocument.fileName || DOCUMENT_LABELS[oldDocument.type] || "Document",
          content: oldDocument.content,
          fileUrl: oldDocument.fileUrl,
          isGenerated: oldDocument.status === "generated" || oldDocument.status === "sent",
          generatedAt: oldDocument.generatedAt,
          createdAt: oldDocument.createdAt,
          updatedAt: oldDocument.createdAt,
          session: oldDocument.session,
        } as NonNullable<typeof document>;
      }
    }

    if (!document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    // Si un fileUrl existe (document déjà uploadé), rediriger
    if (document.fileUrl) {
      return NextResponse.redirect(document.fileUrl);
    }

    // Extraire le contenu HTML
    const content = document.content as { html?: string; json?: string } | null;
    const htmlContent = content?.html;

    if (!htmlContent) {
      return NextResponse.json(
        { error: "Contenu du document non disponible" },
        { status: 404 }
      );
    }

    // Générer le titre
    const documentTitle =
      document.titre || DOCUMENT_LABELS[document.type] || "Document";
    const org = document.session.organization;

    // Préparer les infos de l'organisme pour l'en-tête/pied de page
    const organisationInfo: OrganisationInfo = {
      nom: org.name,
      nomCommercial: org.nomCommercial,
      siret: org.siret,
      numeroFormateur: org.numeroFormateur,
      prefectureRegion: org.prefectureRegion,
      adresse: org.adresse,
      codePostal: org.codePostal,
      ville: org.ville,
      telephone: org.telephone,
      email: org.email,
      logo: org.logo,
      representantNom: org.representantNom,
      representantPrenom: org.representantPrenom,
    };

    // Wrapping le HTML
    const fullHtml = wrapHtmlForPdf(htmlContent, documentTitle);

    // Générer le PDF avec en-tête/pied de page de l'organisme
    const pdfBuffer = await generatePDFWithOrganisation(fullHtml, organisationInfo, {
      format: "A4",
      margin: {
        top: "25mm",
        right: "15mm",
        bottom: "30mm",
        left: "15mm",
      },
    });

    // Générer le nom de fichier
    const sanitizedTitle = documentTitle
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
    const fileName = `${sanitizedTitle}.pdf`;

    // Retourner le PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF document session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
