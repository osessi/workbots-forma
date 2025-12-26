
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { VirtualRoomStatus } from "@prisma/client";

// Helper pour créer le client Supabase côté serveur
async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
            // Ignore en Server Components
          }
        },
      },
    }
  );
}

// GET - Liste des salles virtuelles
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as VirtualRoomStatus | null;
    const upcoming = searchParams.get("upcoming") === "true";

    const where: Record<string, unknown> = {
      organizationId: dbUser.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (upcoming) {
      where.dateDebut = { gte: new Date() };
      where.status = { in: ["SCHEDULED", "ACTIVE"] };
    }

    const rooms = await prisma.virtualRoom.findMany({
      where,
      orderBy: { dateDebut: "asc" },
    });

    // Compter par statut
    const stats = await prisma.virtualRoom.groupBy({
      by: ["status"],
      where: { organizationId: dbUser.organizationId },
      _count: true,
    });

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      rooms,
      stats: {
        scheduled: statsMap.SCHEDULED || 0,
        active: statsMap.ACTIVE || 0,
        ended: statsMap.ENDED || 0,
        total: rooms.length,
      },
    });
  } catch (error) {
    console.error("Erreur GET virtual-rooms:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle salle
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { organization: true },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();

    const room = await prisma.virtualRoom.create({
      data: {
        titre: body.titre,
        description: body.description || null,
        sessionId: body.sessionId || null,
        hosteNom: body.hosteNom || `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim(),
        hosteEmail: body.hosteEmail || dbUser.email,
        password: body.password || null,
        dateDebut: new Date(body.dateDebut),
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        dureeMinutes: body.dureeMinutes || 60,
        maxParticipants: body.maxParticipants || 50,
        enregistrement: body.enregistrement || false,
        chatActif: body.chatActif !== false,
        ecranPartageActif: body.ecranPartageActif !== false,
        organizationId: dbUser.organizationId,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST virtual-rooms:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une salle
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Vérifier que la salle appartient à l'organisation
    const existingRoom = await prisma.virtualRoom.findFirst({
      where: { id, organizationId: dbUser.organizationId },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Salle non trouvée" }, { status: 404 });
    }

    // Convertir les dates si présentes
    if (updateData.dateDebut) {
      updateData.dateDebut = new Date(updateData.dateDebut);
    }
    if (updateData.dateFin) {
      updateData.dateFin = new Date(updateData.dateFin);
    }

    const room = await prisma.virtualRoom.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Erreur PATCH virtual-rooms:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une salle
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser?.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Vérifier que la salle appartient à l'organisation
    const room = await prisma.virtualRoom.findFirst({
      where: { id, organizationId: dbUser.organizationId },
    });

    if (!room) {
      return NextResponse.json({ error: "Salle non trouvée" }, { status: 404 });
    }

    await prisma.virtualRoom.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE virtual-rooms:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
