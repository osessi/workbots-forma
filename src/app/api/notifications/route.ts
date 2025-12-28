// ===========================================
// API NOTIFICATIONS - GET/POST /api/notifications
// ===========================================
// Gestion des notifications internes

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET - Récupérer les notifications de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construire la clause where
    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
      OR: [
        { userId: user.id },
        { userId: null }, // Notifications pour tous les admins
      ],
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    // Récupérer les notifications
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: {
          ...whereClause,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit,
        offset,
        hasMore: offset + notifications.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Erreur GET notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// POST - Marquer des notifications comme lues
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (action === "markAsRead") {
      // Marquer une ou plusieurs notifications comme lues
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: "notificationIds requis" },
          { status: 400 }
        );
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          organizationId: user.organizationId,
          OR: [
            { userId: user.id },
            { userId: null },
          ],
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "Notifications marquées comme lues" });
    }

    if (action === "markAllAsRead") {
      // Marquer toutes les notifications comme lues
      await prisma.notification.updateMany({
        where: {
          organizationId: user.organizationId,
          OR: [
            { userId: user.id },
            { userId: null },
          ],
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "Toutes les notifications marquées comme lues" });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Erreur POST notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications" },
      { status: 500 }
    );
  }
}
