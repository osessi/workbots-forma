// ===========================================
// API DOCUMENTS GÉNÉRÉS PAR FORMATION
// ===========================================
// GET /api/formations/[id]/documents - Liste des documents générés pour une formation
// Avec filtre optionnel par apprenant

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Helper pour authentifier l'utilisateur
async function authenticateUser() {
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
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  return user;
}

// GET - Récupérer les documents générés pour une formation
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
    const { searchParams } = new URL(request.url);
    const apprenantId = searchParams.get("apprenantId");

    // Vérifier que la formation appartient à l'organisation
    const formation = await prisma.formation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        titre: true,
      },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation non trouvée" }, { status: 404 });
    }

    // Récupérer les documents générés (dans la table File liés à la formation)
    // Si apprenantId est fourni, on filtre via le dossier lié à l'apprenant
    const files = await prisma.file.findMany({
      where: {
        formationId: id,
        organizationId: user.organizationId,
        ...(apprenantId && {
          folder: {
            apprenantId,
          },
        }),
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        category: true,
        mimeType: true,
        size: true,
        publicUrl: true,
        storagePath: true,
        createdAt: true,
        folder: {
          select: {
            apprenantId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer aussi les documents de signature liés à cette formation
    const signatureDocuments = await prisma.signatureDocument.findMany({
      where: {
        organizationId: user.organizationId,
        session: {
          formationId: id,
        },
        ...(apprenantId && { apprenantId }),
      },
      select: {
        id: true,
        titre: true,
        documentType: true,
        status: true,
        createdAt: true,
        apprenantId: true,
        signatures: {
          select: {
            id: true,
            signedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les documents de session (générés par le wizard)
    const sessionDocuments = await prisma.sessionDocument.findMany({
      where: {
        session: {
          formationId: id,
        },
        ...(apprenantId && { apprenantId }),
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        status: true,
        content: true,
        createdAt: true,
        apprenantId: true,
        clientId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Helper pour nettoyer le nom (retirer .html)
    const cleanName = (name: string) => name.replace(/\.html$/i, "");

    // Formater les documents
    const documents = [
      // Documents uploadés/générés
      ...files.map((file) => ({
        id: file.id,
        type: file.category || "AUTRE",
        titre: cleanName(file.originalName || file.name),
        status: "GENERATED",
        createdAt: file.createdAt,
        formationId: id,
        apprenantId: file.folder?.apprenantId || null,
        signatureStatus: "UNSIGNED" as const,
        fileUrl: file.publicUrl,
        storagePath: file.storagePath,
      })),
      // Documents de signature
      ...signatureDocuments.map((doc) => ({
        id: doc.id,
        type: doc.documentType,
        titre: cleanName(doc.titre),
        status: doc.status,
        createdAt: doc.createdAt,
        formationId: id,
        apprenantId: doc.apprenantId,
        signatureStatus: doc.signatures.length > 0 ? "SIGNED" as const :
                        doc.status === "PENDING_SIGNATURE" ? "PENDING" as const : "UNSIGNED" as const,
        signedAt: doc.signatures[0]?.signedAt || null,
      })),
      // Documents de session (wizard)
      ...sessionDocuments.map((doc) => {
        const hasContent = doc.content && typeof doc.content === "object" && (doc.content as { html?: string }).html;
        return {
          id: doc.id,
          type: doc.type,
          titre: cleanName(doc.fileName || doc.type),
          status: hasContent ? (doc.status === "sent" ? "SENT" : "GENERATED") : "PENDING",
          createdAt: doc.createdAt,
          formationId: id,
          apprenantId: doc.apprenantId,
          signatureStatus: "UNSIGNED" as const,
        };
      }),
    ];

    return NextResponse.json({
      formation,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Erreur récupération documents formation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}
