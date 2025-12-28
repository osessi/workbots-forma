// ===========================================
// API EMAILS - GET /api/emails
// ===========================================
// Liste des emails envoyés avec recherche et filtres
// Pour traçabilité Qualiopi

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { SentEmailType, SentEmailStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
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
      select: {
        id: true,
        organizationId: true,
        role: true,
      },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Paramètres de requête
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") as SentEmailType | null;
    const status = searchParams.get("status") as SentEmailStatus | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Construire le filtre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      organizationId: user.organizationId,
    };

    // Recherche textuelle (email, sujet, nom)
    if (search) {
      where.OR = [
        { toEmail: { contains: search, mode: "insensitive" } },
        { toName: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtre par type
    if (type) {
      where.type = type;
    }

    // Filtre par statut
    if (status) {
      where.status = status;
    }

    // Filtre par date
    if (dateFrom || dateTo) {
      where.sentAt = {};
      if (dateFrom) {
        where.sentAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Ajouter 1 jour pour inclure toute la journée
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.sentAt.lt = endDate;
      }
    }

    // Vérifier que le modèle SentEmail existe (peut ne pas exister si le serveur n'a pas été redémarré)
    if (!prisma.sentEmail) {
      return NextResponse.json({
        emails: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        stats: { byType: {}, byStatus: {}, total: 0 },
        error: "Le modèle SentEmail n'est pas disponible. Veuillez redémarrer le serveur Next.js.",
      });
    }

    // Récupérer les emails avec pagination
    const [emails, total] = await Promise.all([
      prisma.sentEmail.findMany({
        where,
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          toEmail: true,
          toName: true,
          subject: true,
          type: true,
          status: true,
          sentAt: true,
          resendId: true,
          deliveredAt: true,
          openedAt: true,
          attachments: true,
          apprenantId: true,
          sessionId: true,
          formationId: true,
          preInscriptionId: true,
          sentBySystem: true,
          errorMessage: true,
        },
      }),
      prisma.sentEmail.count({ where }),
    ]);

    // Statistiques par type
    const statsByType = await prisma.sentEmail.groupBy({
      by: ["type"],
      where: { organizationId: user.organizationId },
      _count: { id: true },
    });

    // Statistiques par statut
    const statsByStatus = await prisma.sentEmail.groupBy({
      by: ["status"],
      where: { organizationId: user.organizationId },
      _count: { id: true },
    });

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byType: statsByType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: statsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        total,
      },
    });
  } catch (error) {
    console.error("Erreur API emails:", error);
    // Retourner une réponse vide en cas d'erreur pour éviter les crashs UI
    return NextResponse.json({
      emails: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      stats: { byType: {}, byStatus: {}, total: 0 },
      error: error instanceof Error ? error.message : "Erreur lors de la récupération des emails",
    });
  }
}
