// ===========================================
// API CRUD DOCUMENT
// ===========================================
// GET /api/documents/[id] - Récupérer un document
// PATCH /api/documents/[id] - Mettre à jour un document
// DELETE /api/documents/[id] - Supprimer un document

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { renderTemplate } from "@/lib/templates";

// GET - Récupérer un document
export async function GET(
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

    // Récupérer le document avec vérification de l'organisation
    const document = await prisma.document.findFirst({
      where: {
        id,
        formation: {
          organizationId: user.organizationId,
        },
      },
      include: {
        formation: {
          include: {
            modules: { orderBy: { ordre: "asc" } },
            organization: true,
            user: true,
          },
        },
        template: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    // Construire le contexte pour le rendu
    const formation = document.formation;
    const fichePedagogique = formation.fichePedagogique as Record<string, unknown> || {};

    const context = {
      formation: {
        titre: formation.titre,
        description: formation.description || "",
        duree: fichePedagogique.duree as string || "",
        duree_heures: fichePedagogique.dureeHeures as number || 0,
        prix: fichePedagogique.prix as number || 0,
        objectifs: fichePedagogique.objectifs as string[] || [],
        prerequis: fichePedagogique.prerequis as string[] || [],
        public_vise: fichePedagogique.publicVise as string[] || [],
        modalites: fichePedagogique.modalites as string || "Présentiel",
        participants_max: fichePedagogique.participantsMax as number || 12,
      },
      modules: formation.modules.map((m, index) => ({
        numero: index + 1,
        titre: m.titre,
        duree: m.duree ? `${Math.floor(m.duree / 60)}h${m.duree % 60 > 0 ? (m.duree % 60).toString().padStart(2, '0') : ''}` : "",
        duree_heures: m.duree || 0,
        objectifs: (m.contenu as Record<string, unknown>)?.objectifs as string[] || [],
        contenu: (m.contenu as Record<string, unknown>)?.contenu as string[] || [],
      })),
      organisation: {
        nom: formation.organization.name,
        siret: formation.organization.siret || "",
        numero_da: formation.organization.numeroFormateur || "",
        adresse: formation.organization.adresse || "",
        code_postal: formation.organization.codePostal || "",
        ville: formation.organization.ville || "",
        telephone: formation.organization.telephone || "",
        logo: formation.organization.logo || "",
      },
      formateur: {
        nom: formation.user.lastName || "",
        prenom: formation.user.firstName || "",
        email: formation.user.email,
      },
      dates: {
        jour: new Date().getDate().toString(),
        mois: (new Date().getMonth() + 1).toString().padStart(2, "0"),
        annee: new Date().getFullYear().toString(),
        date_complete: new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        date_courte: new Date().toLocaleDateString("fr-FR"),
      },
      document: {
        titre: document.titre,
        type: document.type,
        version: document.version.toString(),
        date_creation: new Date().toLocaleDateString("fr-FR"),
      },
      entreprise: { nom: "", siret: "", adresse: "", code_postal: "", ville: "", representant: "" },
      participants: [],
    };

    // Rendre le contenu HTML
    const contentStr = typeof document.content === "string"
      ? document.content
      : JSON.stringify(document.content);

    let renderedContent = "";
    try {
      // Cast to TemplateContext pour compatibilité avec l'ancien format
      renderedContent = renderTemplate(contentStr, context as unknown as Parameters<typeof renderTemplate>[1], { previewMode: false });
    } catch {
      renderedContent = contentStr;
    }

    // Rendre header/footer si template disponible
    let renderedHeader = "";
    let renderedFooter = "";

    if (document.template) {
      if (document.template.headerContent) {
        const headerStr = typeof document.template.headerContent === "string"
          ? document.template.headerContent
          : JSON.stringify(document.template.headerContent);
        try {
          renderedHeader = renderTemplate(headerStr, context as unknown as Parameters<typeof renderTemplate>[1], { previewMode: false });
        } catch {
          renderedHeader = "";
        }
      }

      if (document.template.footerContent) {
        const footerStr = typeof document.template.footerContent === "string"
          ? document.template.footerContent
          : JSON.stringify(document.template.footerContent);
        try {
          renderedFooter = renderTemplate(footerStr, context as unknown as Parameters<typeof renderTemplate>[1], { previewMode: false });
        } catch {
          renderedFooter = "";
        }
      }
    }

    return NextResponse.json({
      ...document,
      renderedContent,
      renderedHeader,
      renderedFooter,
      context,
    });
  } catch (error) {
    console.error("Erreur GET document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du document" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un document
export async function PATCH(
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

    // Vérifier que le document appartient à l'organisation
    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        formation: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { content, titre } = body;

    // Mettre à jour le document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        ...(content && { content }),
        ...(titre && { titre }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Erreur PATCH document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du document" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un document
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

    // Vérifier que le document appartient à l'organisation
    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        formation: {
          organizationId: user.organizationId,
        },
      },
    });

    if (!existingDocument) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du document" },
      { status: 500 }
    );
  }
}
