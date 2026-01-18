import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth";

// Clé de chiffrement
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production-32ch";

// Fonction de chiffrement
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, provider, key, isGlobal, organizationId, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (provider !== undefined) updateData.provider = provider;
    if (key) updateData.encryptedKey = encrypt(key);
    if (isGlobal !== undefined) {
      updateData.isGlobal = isGlobal;
      updateData.organizationId = isGlobal ? null : organizationId || null;
    }
    if (organizationId !== undefined && !isGlobal) {
      updateData.organizationId = organizationId || null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const apiKey = await prisma.serviceApiKey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      provider: apiKey.provider,
      isGlobal: apiKey.isGlobal,
      isActive: apiKey.isActive,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.serviceApiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
