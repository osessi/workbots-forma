// ===========================================
// API DOCUMENTS - Envoi par Email
// ===========================================
// POST /api/documents/send - Envoyer un document par email

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { sendEmail, generateDocumentSendEmail } from "@/lib/services/email";
import { authenticateUser } from "@/lib/auth";

// POST - Envoyer un document par email
export async function POST(request: NextRequest) {
  try {
    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Récupérer les infos de l'organisation pour l'email
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        nomCommercial: true,
        logo: true,
        primaryColor: true,
      },
    });

    const body = await request.json();
    const { documentId, email, subject, message, content } = body;

    // Validation
    if (!documentId || !email) {
      return NextResponse.json(
        { error: "documentId et email sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'email est valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email invalide" },
        { status: 400 }
      );
    }

    // Chercher le document (d'abord dans SessionDocument, puis File, puis SignatureDocument)
    let documentInfo: { id: string; titre: string; type: string } | null = null;

    // Chercher dans SessionDocument
    const sessionDoc = await prisma.sessionDocument.findFirst({
      where: {
        id: documentId,
        session: {
          formation: {
            organizationId: user.organizationId,
          },
        },
      },
    });

    if (sessionDoc) {
      let titre = sessionDoc.fileName || sessionDoc.type;
      titre = titre.replace(/\.html$/i, "");
      documentInfo = { id: sessionDoc.id, titre, type: sessionDoc.type };
    }

    // Chercher dans File
    if (!documentInfo) {
      const file = await prisma.file.findFirst({
        where: {
          id: documentId,
          organizationId: user.organizationId,
        },
      });

      if (file) {
        documentInfo = { id: file.id, titre: file.name, type: file.category || "DOCUMENT" };
      }
    }

    // Chercher dans SignatureDocument
    if (!documentInfo) {
      const signatureDoc = await prisma.signatureDocument.findFirst({
        where: {
          id: documentId,
          organizationId: user.organizationId,
        },
      });

      if (signatureDoc) {
        documentInfo = { id: signatureDoc.id, titre: signatureDoc.titre, type: signatureDoc.documentType };
      }
    }

    // Chercher dans SessionDocumentNew (nouveau système)
    if (!documentInfo) {
      const sessionDocNew = await prisma.sessionDocumentNew.findFirst({
        where: {
          id: documentId,
          session: {
            organization: {
              id: user.organizationId,
            },
          },
        },
      });

      if (sessionDocNew) {
        let titre = sessionDocNew.titre || sessionDocNew.type;
        titre = titre.replace(/\.html$/i, "");
        documentInfo = { id: sessionDocNew.id, titre, type: sessionDocNew.type };
      }
    }

    // Si document pas trouvé en base, accepter quand même (document généré en local non sauvegardé)
    // Dans ce cas, utiliser le documentId comme titre
    if (!documentInfo) {
      // Si on a reçu un titre dans la requête, l'utiliser
      const { documentTitre } = body;
      if (documentTitre) {
        documentInfo = { id: documentId, titre: documentTitre, type: "DOCUMENT" };
      } else {
        return NextResponse.json(
          { error: "Document non trouvé" },
          { status: 404 }
        );
      }
    }

    // Envoyer l'email avec le document
    console.log(`[DOCUMENT] Envoi email à ${email}`);
    console.log(`[DOCUMENT] Sujet: ${subject || `Document: ${documentInfo.titre}`}`);
    console.log(`[DOCUMENT] Message: ${message || "(aucun message personnalisé)"}`);
    console.log(`[DOCUMENT] Document: ${documentInfo.titre} (${documentInfo.type})`);

    const orgName = organization?.nomCommercial || organization?.name || "Organisme de formation";

    const emailContent = generateDocumentSendEmail({
      documentTitre: documentInfo.titre,
      documentType: documentInfo.type,
      customSubject: subject,
      customMessage: message,
      organizationName: orgName,
      organizationLogo: organization?.logo,
      primaryColor: organization?.primaryColor || undefined,
    });

    // Préparer les pièces jointes si contenu fourni
    const attachments = content ? [{
      filename: `${documentInfo.titre}.pdf`,
      content: Buffer.from(content, "base64"),
      contentType: "application/pdf",
    }] : undefined;

    // Correction 570: Envoyer l'email avec traçabilité complète
    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments,
      // Options étendues pour traçabilité
      type: "DOCUMENT" as const,
      toName: body.toName || undefined,
      sessionId: body.sessionId || undefined,
      apprenantId: body.apprenantId || undefined,
    }, user.organizationId);

    // Mettre à jour le statut du document si c'est un SessionDocument
    if (sessionDoc) {
      await prisma.sessionDocument.update({
        where: { id: documentId },
        data: {
          status: "sent",
          updatedAt: new Date(),
        },
      });
    }

    // Correction 570: Retourner l'ID de l'email pour le suivi
    return NextResponse.json({
      success: true,
      message: `Document envoyé à ${email}`,
      documentId: documentInfo.id,
      documentTitre: documentInfo.titre,
      sentEmailId: emailResult.sentEmailId || null,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur envoi document:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du document" },
      { status: 500 }
    );
  }
}
