// ===========================================
// API SIGNATURE ÉLECTRONIQUE - Envoi Document
// ===========================================
// POST /api/signatures/[id]/send - Envoyer le document pour signature

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

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
            name: true,
            logo: true,
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

    // TODO: Envoyer l'email au destinataire
    console.log(`[SIGNATURE] Envoi email à ${document.destinataireEmail}`);
    console.log(`[SIGNATURE] URL de signature: ${signatureUrl}`);

    /*
    await sendEmail({
      to: document.destinataireEmail,
      subject: `Document à signer : ${document.titre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${document.organization?.logo ? `<img src="${document.organization.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 20px;">` : ""}

          <h1 style="color: #1e3a5f; font-size: 24px;">Document à signer</h1>

          <p>Bonjour ${document.destinataireNom},</p>

          <p>${document.organization?.name || "Un organisme de formation"} vous invite à signer le document suivant :</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #333;">${document.titre}</h2>
            <p style="margin: 0; color: #666;">Type : ${document.documentType}</p>
          </div>

          <p>Ce document expire le <strong>${document.expiresAt?.toLocaleDateString("fr-FR")}</strong>.</p>

          <a href="${signatureUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Signer le document
          </a>

          <p style="color: #666; font-size: 14px;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
            <a href="${signatureUrl}">${signatureUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px;">
            Cet email a été envoyé par ${document.organization?.name || "l'organisme de formation"}.
            Si vous n'êtes pas le destinataire prévu, veuillez ignorer cet email.
          </p>
        </div>
      `,
    });
    */

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
