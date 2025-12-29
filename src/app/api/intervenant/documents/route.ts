// ===========================================
// API INTERVENANT DOCUMENTS - GET /api/intervenant/documents
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

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

    // Vérifier l'accès
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        organizationId,
        OR: [
          { formateurId: intervenantId },
          { coFormateurs: { some: { intervenantId } } },
        ],
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
    }

    // Récupérer les documents de la session
    const sessionDocuments = await prisma.sessionDocumentNew.findMany({
      where: { sessionId },
      select: {
        id: true,
        titre: true,
        type: true,
        fileUrl: true,
        isGenerated: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Transformer en format frontend
    const documents = sessionDocuments.map(doc => ({
      id: doc.id,
      nom: doc.titre,
      type: doc.type || "document",
      taille: undefined,
      dateCreation: doc.createdAt.toISOString(),
      url: doc.fileUrl,
      categorie: "session",
      isGenerated: doc.isGenerated,
    }));

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Erreur API documents intervenant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
