// ===========================================
// API DOCUMENTS - Envoi par Email
// ===========================================
// POST /api/documents/send - Envoyer un document par email

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { sendEmail, generateDocumentSendEmail } from "@/lib/services/email";

// POST - Envoyer un document par email
export async function POST(request: NextRequest) {
  try {
    // Authentification
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            nomCommercial: true,
            logo: true,
            primaryColor: true,
          },
        },
      },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

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

    if (!documentInfo) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Envoyer l'email avec le document
    console.log(`[DOCUMENT] Envoi email à ${email}`);
    console.log(`[DOCUMENT] Sujet: ${subject || `Document: ${documentInfo.titre}`}`);
    console.log(`[DOCUMENT] Message: ${message || "(aucun message personnalisé)"}`);
    console.log(`[DOCUMENT] Document: ${documentInfo.titre} (${documentInfo.type})`);

    const orgName = user.organization?.nomCommercial || user.organization?.name || "Organisme de formation";

    const emailContent = generateDocumentSendEmail({
      documentTitre: documentInfo.titre,
      documentType: documentInfo.type,
      customSubject: subject,
      customMessage: message,
      organizationName: orgName,
      organizationLogo: user.organization?.logo,
      primaryColor: user.organization?.primaryColor || undefined,
    });

    // Préparer les pièces jointes si contenu fourni
    const attachments = content ? [{
      filename: `${documentInfo.titre}.pdf`,
      content: Buffer.from(content, "base64"),
      contentType: "application/pdf",
    }] : undefined;

    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments,
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

    return NextResponse.json({
      success: true,
      message: `Document envoyé à ${email}`,
      documentId: documentInfo.id,
      documentTitre: documentInfo.titre,
    });
  } catch (error) {
    console.error("Erreur envoi document:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du document" },
      { status: 500 }
    );
  }
}
