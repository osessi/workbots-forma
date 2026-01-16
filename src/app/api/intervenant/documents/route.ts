// ===========================================
// API INTERVENANT DOCUMENTS - GET /api/intervenant/documents
// ===========================================
// Correction 520: N'afficher que les documents liés à l'intervenant
// - CONTRAT_SOUS_TRAITANCE (signature requise)
// - PROGRAMME_FORMATION (lecture seule)
// - FICHE_PEDAGOGIQUE (lecture seule)
// - FEUILLE_EMARGEMENT (lecture seule)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DocumentType } from "@prisma/client";

export const dynamic = "force-dynamic";

// Types de documents pertinents pour l'intervenant
const INTERVENANT_DOCUMENT_TYPES: DocumentType[] = [
  "CONTRAT_SOUS_TRAITANCE",
  "PROGRAMME_FORMATION",
  "FICHE_PEDAGOGIQUE",
  "FEUILLE_EMARGEMENT",
];

function decodeIntervenantToken(token: string): { intervenantId: string; organizationId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (!decoded.intervenantId || !decoded.organizationId) return null;
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return { intervenantId: decoded.intervenantId, organizationId: decoded.organizationId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    const decoded = decodeIntervenantToken(token);
    if (!decoded) return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    if (!sessionId) return NextResponse.json({ error: "Session ID requis" }, { status: 400 });

    const { intervenantId, organizationId } = decoded;

    // Vérifier l'accès et récupérer l'intervenant
    const [session, intervenant] = await Promise.all([
      prisma.session.findFirst({
        where: {
          id: sessionId,
          organizationId,
          OR: [
            { formateurId: intervenantId },
            { coFormateurs: { some: { intervenantId } } },
          ],
        },
      }),
      prisma.intervenant.findUnique({
        where: { id: intervenantId },
        select: { id: true, email: true, nom: true, prenom: true },
      }),
    ]);

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // 1. Récupérer les documents de session filtrés par type
    const sessionDocuments = await prisma.sessionDocumentNew.findMany({
      where: {
        sessionId,
        type: { in: INTERVENANT_DOCUMENT_TYPES },
      },
      select: {
        id: true,
        titre: true,
        type: true,
        fileUrl: true,
        content: true,
        isGenerated: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Récupérer les contrats de sous-traitance (SignatureDocument) pour cet intervenant
    const contratsSousTraitance = intervenant?.email
      ? await prisma.signatureDocument.findMany({
          where: {
            organizationId,
            documentType: "CONTRAT_SOUS_TRAITANCE",
            destinataireEmail: intervenant.email.toLowerCase(),
            OR: [
              { sessionId: sessionId },
              { sessionId: null }, // Contrats globaux sans session spécifique
            ],
          },
          include: {
            signatures: {
              select: {
                id: true,
                signedAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    // Transformer les documents de session
    const documentsFromSession = sessionDocuments
      .filter(doc => {
        const content = doc.content as { html?: string } | null;
        return doc.fileUrl || content?.html;
      })
      .map(doc => {
        const documentUrl = doc.fileUrl || `/api/session-documents/${doc.id}/pdf?token=${token}`;

        return {
          id: doc.id,
          nom: doc.titre,
          type: doc.type || "document",
          taille: undefined,
          dateCreation: doc.createdAt.toISOString(),
          url: documentUrl,
          categorie: doc.type === "FEUILLE_EMARGEMENT" ? "emargement" : "pedagogique",
          isGenerated: doc.isGenerated,
          requiresSignature: false,
          isSigned: false,
          signatureUrl: null,
        };
      });

    // Transformer les contrats de sous-traitance
    const documentsContrats = contratsSousTraitance.map(contrat => {
      const isSigned = contrat.signatures.length > 0;
      const signatureUrl = isSigned
        ? null
        : `${process.env.NEXT_PUBLIC_APP_URL || ""}/signer/${contrat.token}`;

      return {
        id: contrat.id,
        nom: contrat.titre,
        type: "CONTRAT_SOUS_TRAITANCE",
        taille: undefined,
        dateCreation: contrat.createdAt.toISOString(),
        url: signatureUrl || `/api/signatures/${contrat.id}/pdf`, // URL pour visualiser le PDF
        categorie: "contrat",
        isGenerated: true,
        requiresSignature: true,
        isSigned,
        signedAt: contrat.signatures[0]?.signedAt?.toISOString() || null,
        signatureUrl,
        status: contrat.status,
        expiresAt: contrat.expiresAt?.toISOString() || null,
      };
    });

    // Combiner et trier par date
    const documents = [...documentsContrats, ...documentsFromSession].sort(
      (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Erreur API documents intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
