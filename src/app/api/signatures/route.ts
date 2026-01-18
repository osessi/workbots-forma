// ===========================================
// API SIGNATURE ÉLECTRONIQUE - CRUD Documents
// ===========================================
// GET /api/signatures - Liste des documents à signer
// POST /api/signatures - Créer un document à faire signer

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { DocumentType, SignatureAuthMethod } from "@prisma/client";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth";

// GET - Liste des documents de signature
export async function GET(request: NextRequest) {
  try {
    // Authentification (avec support impersonation)
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    // Paramètres de filtre
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");
    const apprenantId = searchParams.get("apprenantId");

    // Construire le filtre
    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (status) {
      where.status = status;
    }
    if (sessionId) {
      where.sessionId = sessionId;
    }
    if (apprenantId) {
      where.apprenantId = apprenantId;
    }

    const documents = await prisma.signatureDocument.findMany({
      where,
      include: {
        apprenant: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        entreprise: {
          select: {
            id: true,
            raisonSociale: true,
          },
        },
        session: {
          select: {
            id: true,
            formation: {
              select: {
                titre: true,
              },
            },
          },
        },
        signatures: {
          select: {
            id: true,
            signedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        documentId: doc.id,
        documentTitre: doc.titre,
        documentType: doc.documentType,
        destinataireNom: doc.destinataireNom,
        destinataireEmail: doc.destinataireEmail,
        destinataireTel: doc.destinataireTel,
        authMethod: doc.authMethod,
        status: doc.status,
        token: doc.token,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt,
        sentAt: doc.sentAt,
        isSigned: doc.signatures.length > 0,
        signedAt: doc.signatures[0]?.signedAt || null,
        signatureData: doc.signatures[0] ? {
          signataireName: doc.destinataireNom,
          ipAddress: null, // sera ajouté quand on récupère les détails
          signedAt: doc.signatures[0].signedAt,
        } : null,
        apprenant: doc.apprenant,
        entreprise: doc.entreprise,
        session: doc.session,
      })),
    });
  } catch (error) {
    console.error("Erreur liste documents signature:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}

// POST - Créer un document à faire signer
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

    const body = await request.json();
    const {
      titre,
      documentType,
      contenuHtml,
      destinataireNom,
      destinataireEmail,
      destinataireTel,
      apprenantId,
      entrepriseId,
      sessionId,
      authMethod = "EMAIL_SMS",
      expiresInDays = 7,
      sendNow = false,
    } = body;

    // Validation
    if (!titre || !documentType || !contenuHtml || !destinataireNom || !destinataireEmail) {
      return NextResponse.json(
        { error: "Champs requis manquants: titre, documentType, contenuHtml, destinataireNom, destinataireEmail" },
        { status: 400 }
      );
    }

    // Valider le type de document (utiliser AUTRE si le type n'est pas reconnu)
    let validDocType = documentType;
    if (!Object.values(DocumentType).includes(documentType)) {
      console.log(`[SIGNATURE] Type de document "${documentType}" non reconnu, utilisation de AUTRE`);
      validDocType = "AUTRE";
    }

    // Valider la méthode d'auth
    if (!Object.values(SignatureAuthMethod).includes(authMethod)) {
      return NextResponse.json(
        { error: `Méthode d'authentification invalide: ${authMethod}` },
        { status: 400 }
      );
    }

    // Générer un token unique
    const token = crypto.randomUUID();

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Vérifier que la session existe si un sessionId est fourni
    let validSessionId = sessionId;
    if (sessionId) {
      const sessionExists = await prisma.documentSession.findUnique({
        where: { id: sessionId },
        select: { id: true },
      });
      if (!sessionExists) {
        console.log(`[SIGNATURE] Session "${sessionId}" non trouvée, sessionId sera null`);
        validSessionId = null;
      }
    }

    // Créer le document
    const document = await prisma.signatureDocument.create({
      data: {
        titre,
        documentType: validDocType as DocumentType,
        contenuHtml,
        destinataireNom,
        destinataireEmail: destinataireEmail.toLowerCase(),
        destinataireTel,
        apprenantId: apprenantId || null,
        entrepriseId: entrepriseId || null,
        sessionId: validSessionId || null,
        authMethod: authMethod as SignatureAuthMethod,
        expiresAt,
        token,
        organizationId: user.organizationId,
        status: sendNow ? "PENDING_SIGNATURE" : "DRAFT",
        sentAt: sendNow ? new Date() : null,
        sentBy: sendNow ? user.id : null,
      },
    });

    // Si sendNow, envoyer l'email (TODO: implémenter l'envoi d'email)
    if (sendNow) {
      // TODO: Envoyer email avec le lien de signature
      console.log(`[SIGNATURE] Document ${document.id} créé et prêt à envoyer à ${destinataireEmail}`);
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        token: document.token,
        status: document.status,
        signatureUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"}/signer/${document.token}`,
      },
    });
  } catch (error) {
    console.error("Erreur création document signature:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors de la création du document: ${errorMessage}` },
      { status: 500 }
    );
  }
}
