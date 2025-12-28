// ===========================================
// API DEV EMAILS - GET/DELETE /api/dev/emails
// ===========================================
// Endpoint pour voir les emails en développement
// ATTENTION: Ne pas utiliser en production

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDevEmails, deleteDevEmail, clearDevEmails } from "@/lib/dev/devEmailStore";

export const dynamic = "force-dynamic";

// Détecter le type d'email à partir du sujet
function detectEmailType(subject: string): string {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes("code de vérification")) return "VERIFICATION_CODE";
  if (lowerSubject.includes("document à signer")) return "SIGNATURE_INVITATION";
  if (lowerSubject.includes("bienvenue") || lowerSubject.includes("espace apprenant")) return "INVITATION_APPRENANT";
  if (lowerSubject.includes("pré-inscription") || lowerSubject.includes("pre-inscription")) return "PRE_INSCRIPTION";
  if (lowerSubject.includes("nouvelle pré-inscription")) return "NOTIFICATION_ADMIN";
  if (lowerSubject.includes("document")) return "DOCUMENT";

  return "OTHER";
}

export async function GET() {
  // Vérifier qu'on est en développement
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Cette API n'est pas disponible en production" },
      { status: 403 }
    );
  }

  // Récupérer aussi les dernières pré-inscriptions pour voir les emails qui auraient dû partir
  const recentPreInscriptions = await prisma.preInscription.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      statut: true,
      createdAt: true,
      formation: {
        select: { titre: true },
      },
      organization: {
        select: { name: true, nomCommercial: true },
      },
    },
  });

  const devEmails = getDevEmails();

  // Enrichir les emails avec leur type détecté
  const enrichedEmails = devEmails.slice(-50).reverse().map(email => ({
    ...email,
    type: email.type || detectEmailType(email.subject),
  }));

  return NextResponse.json({
    emails: enrichedEmails,
    recentPreInscriptions,
    info: "Les emails sont stockés en mémoire. Redémarrer le serveur les efface.",
    stats: {
      total: devEmails.length,
      byType: enrichedEmails.reduce((acc, email) => {
        acc[email.type] = (acc[email.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
  });
}

// DELETE - Effacer tous les emails dev
export async function DELETE(request: NextRequest) {
  // Vérifier qu'on est en développement
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Cette API n'est pas disponible en production" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const emailId = url.searchParams.get("id");

  if (emailId) {
    // Supprimer un email spécifique
    deleteDevEmail(emailId);
    return NextResponse.json({ success: true, message: "Email supprimé" });
  } else {
    // Supprimer tous les emails
    clearDevEmails();
    return NextResponse.json({ success: true, message: "Tous les emails ont été supprimés" });
  }
}
