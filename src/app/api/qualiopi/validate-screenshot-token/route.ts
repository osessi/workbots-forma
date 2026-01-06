// ===========================================
// API: VALIDATION DU TOKEN DE CAPTURE D'ÉCRAN
// POST /api/qualiopi/validate-screenshot-token
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { verifyScreenshotToken } from "@/lib/services/qualiopi/screenshot-token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token manquant" },
        { status: 400 }
      );
    }

    const payload = verifyScreenshotToken(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false, error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      organizationId: payload.organizationId,
      expiresAt: payload.expiresAt,
    });
  } catch (error: any) {
    console.error("[API] validate-screenshot-token error:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
