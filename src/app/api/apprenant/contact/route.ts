// ===========================================
// API CONTACT APPRENANT - POST /api/apprenant/contact
// ===========================================
// Permet à l'apprenant d'envoyer un message au support
// Le message est créé comme notification dans le dashboard admin

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

    // Vérifier expiration
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

// Mapping des sujets vers des titres lisibles
const subjectTitles: Record<string, string> = {
  question: "Question générale",
  technique: "Problème technique",
  formation: "Question sur la formation",
  document: "Demande de document",
  autre: "Autre demande",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, subject, message } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 401 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Décoder le token
    const decoded = decodeApprenantToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    const { apprenantId, organizationId } = decoded;

    // Récupérer les informations de l'apprenant
    const apprenant = await prisma.apprenant.findUnique({
      where: { id: apprenantId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
      },
    });

    if (!apprenant) {
      return NextResponse.json(
        { error: "Apprenant non trouvé" },
        { status: 404 }
      );
    }

    // Créer la notification pour les admins
    const subjectTitle = subjectTitles[subject] || "Message d'un apprenant";
    const notificationTitre = `${subjectTitle} - ${apprenant.prenom} ${apprenant.nom}`;
    const notificationMessage = `Message de ${apprenant.prenom} ${apprenant.nom} (${apprenant.email}):\n\n${message}`;

    // Correction 422: actionUrl vers l'onglet Messages avec messageId
    const notification = await prisma.notification.create({
      data: {
        organizationId,
        userId: null, // null = notification pour tous les admins
        type: "SYSTEME",
        titre: notificationTitre,
        message: notificationMessage,
        resourceType: "apprenant",
        resourceId: apprenantId,
        actionUrl: `/apprenants/${apprenantId}?tab=messages`, // Sera mis à jour avec messageId
        metadata: {
          direction: "incoming", // Correction 422: Ajouter direction pour cohérence
          subject,
          apprenantEmail: apprenant.email,
          apprenantNom: `${apprenant.prenom} ${apprenant.nom}`,
          messageOriginal: message,
          sentAt: new Date().toISOString(),
          replies: [], // Correction 422: Ajouter replies pour cohérence avec la messagerie
        },
      },
    });

    // Correction 422: Mettre à jour l'actionUrl avec le messageId
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        actionUrl: `/apprenants/${apprenantId}?tab=messages&messageId=${notification.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Message envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur API contact apprenant:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
