// ===========================================
// API CRM ACTIVITÉS - CRUD
// ===========================================
// Gestion des activités/tâches liées aux opportunités

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les activités d'une opportunité
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const opportuniteId = searchParams.get("opportuniteId");

    if (!opportuniteId) {
      return NextResponse.json({ error: "opportuniteId requis" }, { status: 400 });
    }

    // Vérifier que l'opportunité appartient à l'organisation
    const opportunite = await prisma.cRMOpportunite.findFirst({
      where: {
        id: opportuniteId,
        organizationId: user.organizationId,
      },
    });

    if (!opportunite) {
      return NextResponse.json({ error: "Opportunité non trouvée" }, { status: 404 });
    }

    const activites = await prisma.cRMActivite.findMany({
      where: {
        opportuniteId,
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ activites });
  } catch (error) {
    console.error("Erreur récupération activités:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle activité
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { opportuniteId, type, titre, description, date, estFait } = body;

    if (!opportuniteId || !titre) {
      return NextResponse.json(
        { error: "opportuniteId et titre sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'opportunité appartient à l'organisation
    const opportunite = await prisma.cRMOpportunite.findFirst({
      where: {
        id: opportuniteId,
        organizationId: user.organizationId,
      },
    });

    if (!opportunite) {
      return NextResponse.json({ error: "Opportunité non trouvée" }, { status: 404 });
    }

    const activite = await prisma.cRMActivite.create({
      data: {
        opportuniteId,
        type: type || "NOTE",
        titre,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        estFait: estFait || false,
      },
    });

    return NextResponse.json(activite, { status: 201 });
  } catch (error) {
    console.error("Erreur création activité:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une activité
export async function PATCH(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { id, type, titre, description, date, estFait } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Vérifier que l'activité appartient à une opportunité de l'organisation
    const existingActivite = await prisma.cRMActivite.findUnique({
      where: { id },
      include: {
        opportunite: true,
      },
    });

    if (!existingActivite) {
      return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
    }

    if (existingActivite.opportunite.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (type !== undefined) updateData.type = type;
    if (titre !== undefined) updateData.titre = titre;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (estFait !== undefined) updateData.estFait = estFait;

    const activite = await prisma.cRMActivite.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(activite);
  } catch (error) {
    console.error("Erreur mise à jour activité:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une activité
export async function DELETE(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Vérifier que l'activité appartient à une opportunité de l'organisation
    const existingActivite = await prisma.cRMActivite.findUnique({
      where: { id },
      include: {
        opportunite: true,
      },
    });

    if (!existingActivite) {
      return NextResponse.json({ error: "Activité non trouvée" }, { status: 404 });
    }

    if (existingActivite.opportunite.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.cRMActivite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression activité:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
