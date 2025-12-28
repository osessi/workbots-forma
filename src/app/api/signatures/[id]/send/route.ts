// ===========================================
// API SIGNATURE ÉLECTRONIQUE - Envoi Document
// ===========================================
// POST /api/signatures/[id]/send - Envoyer le document pour signature

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { sendEmail, generateSignatureInvitationEmail } from "@/lib/services/email";

// POST - Envoyer le document pour signature
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer le document
    const document = await prisma.signatureDocument.findUnique({
      where: { id },
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

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à ce document
    if (document.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier le statut
    if (document.status === "SIGNED") {
      return NextResponse.json(
        { error: "Ce document a déjà été signé" },
        { status: 400 }
      );
    }

    if (document.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Ce document a été annulé" },
        { status: 400 }
      );
    }

    // Générer l'URL de signature
    const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/signer/${document.token}`;

    // Envoyer l'email d'invitation au destinataire
    console.log(`[SIGNATURE] Envoi email à ${document.destinataireEmail}`);
    console.log(`[SIGNATURE] URL de signature: ${signatureUrl}`);

    const orgName = document.organization?.nomCommercial || document.organization?.name || "Organisme de formation";

    const emailContent = generateSignatureInvitationEmail({
      destinataireNom: document.destinataireNom,
      destinataireEmail: document.destinataireEmail,
      documentTitre: document.titre,
      documentType: document.documentType,
      signatureUrl,
      expiresAt: document.expiresAt,
      organizationName: orgName,
      organizationLogo: document.organization?.logo,
      primaryColor: document.organization?.primaryColor || undefined,
    });

    await sendEmail({
      to: document.destinataireEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }, document.organizationId);

    // Mettre à jour le document
    await prisma.signatureDocument.update({
      where: { id },
      data: {
        status: "PENDING_SIGNATURE",
        sentAt: new Date(),
        sentBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Document envoyé à ${document.destinataireEmail}`,
      signatureUrl,
    });
  } catch (error) {
    console.error("Erreur envoi document signature:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du document" },
      { status: 500 }
    );
  }
}

// DELETE - Annuler l'envoi / Annuler le document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer le document
    const document = await prisma.signatureDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à ce document
    if (document.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // On ne peut pas annuler un document déjà signé
    if (document.status === "SIGNED") {
      return NextResponse.json(
        { error: "Impossible d'annuler un document déjà signé" },
        { status: 400 }
      );
    }

    // Annuler le document
    await prisma.signatureDocument.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document annulé",
    });
  } catch (error) {
    console.error("Erreur annulation document:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation du document" },
      { status: 500 }
    );
  }
}
