import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";
import { authenticateUser } from "@/lib/auth";

// Clé de chiffrement (devrait être dans les variables d'environnement)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production-32ch";

// Fonction de chiffrement simple
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Fonction de déchiffrement
function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Masquer la clé pour l'affichage
function maskKey(encryptedKey: string): string {
  try {
    const key = decrypt(encryptedKey);
    if (key.length <= 8) return "****";
    return key.slice(0, 4) + "..." + key.slice(-4);
  } catch {
    return "****";
  }
}

export async function GET() {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const apiKeys = await prisma.serviceApiKey.findMany({
      orderBy: [{ isGlobal: "desc" }, { createdAt: "desc" }],
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Transformer les données pour l'affichage
    const transformedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      provider: key.provider,
      keyPreview: maskKey(key.encryptedKey),
      isGlobal: key.isGlobal,
      organizationId: key.organizationId,
      organizationName: key.organization?.name || null,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    }));

    return NextResponse.json(transformedKeys);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, provider, key, isGlobal, organizationId, isActive } = body;

    if (!name || !provider || !key) {
      return NextResponse.json(
        { error: "Nom, provider et clé requis" },
        { status: 400 }
      );
    }

    // Chiffrer la clé
    const encryptedKey = encrypt(key);

    const apiKey = await prisma.serviceApiKey.create({
      data: {
        name,
        provider,
        encryptedKey,
        isGlobal: isGlobal ?? true,
        organizationId: isGlobal ? null : organizationId || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      provider: apiKey.provider,
      keyPreview: maskKey(apiKey.encryptedKey),
      isGlobal: apiKey.isGlobal,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
