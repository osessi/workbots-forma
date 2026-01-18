// ===========================================
// API FILE CONTENT - Récupération/Mise à jour du contenu
// ===========================================
// GET /api/files/[id]/content - Récupérer le contenu
// PUT /api/files/[id]/content - Mettre à jour le contenu

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// GET - Récupérer le contenu du fichier ou du document de signature
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Extraire l'ID de base si c'est un ID composite (pour les documents dupliqués)
    // Format des IDs composites: {originalId}-{apprenantId}
    // Les IDs peuvent être soit des UUIDs (5 segments avec tirets) soit des CUIDs (commence par 'c', ~25 chars)
    //
    // Exemples:
    // - UUID simple: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 segments)
    // - UUID composite: uuid1-uuid2 (10 segments)
    // - CUID simple: cmkh4nzr00014wbaaxklgn0q6 (1 segment)
    // - CUID composite: cmkh4nzr00014wbaaxklgn0q6-cmk7ehmf70000n30kt1ean3xb (2 segments)

    let baseId = id;

    // Cas spécial: emargement-{feuilleId}-{apprenantId}
    if (!id.startsWith("emargement-")) {
      const segments = id.split("-");

      // Vérifier si c'est un ID composite CUID (2 segments, chacun commençant par 'c')
      const isCuidComposite = segments.length === 2 &&
        segments[0].startsWith("c") &&
        segments[1].startsWith("c") &&
        segments[0].length >= 20 &&
        segments[1].length >= 20;

      // Vérifier si c'est un ID composite UUID (plus de 5 segments)
      const isUuidComposite = segments.length > 5;

      if (isCuidComposite) {
        baseId = segments[0]; // Premier CUID
      } else if (isUuidComposite) {
        baseId = segments.slice(0, 5).join("-"); // Premier UUID (5 segments)
      }
    }

    // D'abord chercher dans les fichiers (avec ID original ou baseId pour documents dupliqués)
    const file = await prisma.file.findFirst({
      where: {
        id: { in: [id, baseId] },
        organizationId: user.organizationId,
      },
      include: {
        fileContent: true,
      },
    });

    if (file) {
      // Retourner le contenu du fichier
      const content = file.fileContent?.content || null;
      return NextResponse.json({
        id: file.id,
        name: file.name,
        content,
        mimeType: file.mimeType,
        type: "file",
      });
    }

    // Ensuite chercher dans les documents de signature
    const signatureDoc = await prisma.signatureDocument.findFirst({
      where: {
        id: { in: [id, baseId] },
        organizationId: user.organizationId,
      },
    });

    if (signatureDoc) {
      // Utiliser le contenu signé s'il existe, sinon le contenu original
      const content = signatureDoc.signedContenuHtml || signatureDoc.contenuHtml;
      return NextResponse.json({
        id: signatureDoc.id,
        name: signatureDoc.titre,
        content,
        mimeType: "text/html",
        type: "signature",
        status: signatureDoc.status,
      });
    }

    // Ensuite chercher dans les documents de session (générés par wizard - ancien système)
    const sessionDoc = await prisma.sessionDocument.findFirst({
      where: {
        id: { in: [id, baseId] },
        session: {
          formation: {
            organizationId: user.organizationId,
          },
        },
      },
    });

    if (sessionDoc) {
      // Le contenu est stocké comme JSON avec html et json
      const contentData = sessionDoc.content as { html?: string; json?: string } | null;
      const content = contentData?.html || null;

      // Nettoyer le nom du fichier (retirer .html)
      let name = sessionDoc.fileName || `Document ${sessionDoc.type}`;
      name = name.replace(/\.html$/i, "");

      return NextResponse.json({
        id: sessionDoc.id,
        name,
        content,
        mimeType: "text/html",
        type: "session",
        status: sessionDoc.status,
      });
    }

    // Chercher dans les documents de session du NOUVEAU système (SessionDocumentNew)
    const sessionDocNew = await prisma.sessionDocumentNew.findFirst({
      where: {
        id: { in: [id, baseId] },
        session: {
          organizationId: user.organizationId,
        },
      },
    });

    if (sessionDocNew) {
      // Le contenu est stocké comme JSON TipTap
      const contentData = sessionDocNew.content as { html?: string; json?: unknown } | null;
      const content = contentData?.html || null;

      // Nettoyer le titre (retirer .html)
      let name = sessionDocNew.titre || `Document ${sessionDocNew.type}`;
      name = name.replace(/\.html$/i, "");

      return NextResponse.json({
        id: sessionDocNew.id,
        name,
        content,
        mimeType: "text/html",
        type: "session_new",
        isGenerated: sessionDocNew.isGenerated,
      });
    }

    // Vérifier si c'est un ID composite pour les feuilles d'émargement (emargement-{feuilleId}-{apprenantId})
    if (id.startsWith("emargement-")) {
      const parts = id.split("-");
      if (parts.length >= 3) {
        const feuilleId = parts[1];

        const feuille = await prisma.feuilleEmargementNew.findFirst({
          where: {
            id: feuilleId,
            journee: {
              session: {
                organization: {
                  id: user.organizationId,
                },
              },
            },
          },
          include: {
            journee: {
              include: {
                session: {
                  include: {
                    formation: true,
                  },
                },
              },
            },
          },
        });

        if (feuille && feuille.pdfUrl) {
          return NextResponse.json({
            id,
            name: `Feuille d'émargement - ${new Date(feuille.journee.date).toLocaleDateString("fr-FR")}`,
            content: null, // C'est un PDF, pas de contenu HTML
            fileUrl: feuille.pdfUrl,
            mimeType: "application/pdf",
            type: "emargement",
          });
        }
      }
    }

    return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
  } catch (error) {
    console.error("Erreur récupération contenu fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du contenu" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le contenu du fichier ou du document de session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
    }

    // D'abord chercher dans les fichiers
    const file = await prisma.file.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (file) {
      // Créer ou mettre à jour le contenu du fichier
      const fileContent = await prisma.fileContent.upsert({
        where: { fileId: id },
        update: {
          content,
          updatedAt: new Date(),
        },
        create: {
          fileId: id,
          content,
        },
      });

      // Mettre à jour la taille du fichier
      await prisma.file.update({
        where: { id },
        data: {
          size: Buffer.byteLength(content, "utf-8"),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        fileId: id,
        contentId: fileContent.id,
        message: "Contenu mis à jour",
      });
    }

    // Ensuite chercher dans les documents de session
    const sessionDoc = await prisma.sessionDocument.findFirst({
      where: {
        id,
        session: {
          formation: {
            organizationId: user.organizationId,
          },
        },
      },
    });

    if (sessionDoc) {
      // Mettre à jour le contenu du document de session
      const existingContent = (sessionDoc.content as { html?: string; json?: string } | null) || {};

      await prisma.sessionDocument.update({
        where: { id },
        data: {
          content: {
            ...existingContent,
            html: content,
          },
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        documentId: id,
        message: "Document de session mis à jour",
      });
    }

    return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
  } catch (error) {
    console.error("Erreur mise à jour contenu fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du contenu" },
      { status: 500 }
    );
  }
}
