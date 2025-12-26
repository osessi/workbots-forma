import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// Vérifier que l'utilisateur est super admin
async function checkSuperAdmin() {
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
  if (!supabaseUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  if (!user?.isSuperAdmin) return null;
  return user;
}

// POST - Tester une connexion d'intégration
export async function POST(request: NextRequest) {
  try {
    const user = await checkSuperAdmin();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { integrationId, config } = await request.json();

    if (!integrationId || !config) {
      return NextResponse.json(
        { error: "integrationId et config requis" },
        { status: 400 }
      );
    }

    let success = false;
    let message = "";

    switch (integrationId) {
      case "yousign":
        ({ success, message } = await testYousign(config));
        break;

      case "zoom":
        ({ success, message } = await testZoom(config));
        break;

      case "stripe":
        ({ success, message } = await testStripe(config));
        break;

      case "resend":
        ({ success, message } = await testResend(config));
        break;

      case "sendgrid":
        ({ success, message } = await testSendGrid(config));
        break;

      case "xapi-lrs":
        ({ success, message } = await testXAPI(config));
        break;

      case "aws-s3":
        ({ success, message } = await testS3(config));
        break;

      default:
        // Pour les intégrations non implémentées, simuler un test
        success = Object.values(config).every(v => v && String(v).trim() !== "");
        message = success
          ? "Configuration valide (test de connexion non disponible)"
          : "Configuration incomplète";
    }

    // Log le test
    await prisma.auditLog.create({
      data: {
        action: "TEST_INTEGRATION",
        entity: "Integration",
        entityId: integrationId,
        userId: user.id,
        details: { integrationId, success, message },
      },
    });

    return NextResponse.json({ success, message });
  } catch (error) {
    console.error("Erreur test intégration:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors du test" },
      { status: 500 }
    );
  }
}

// Test Yousign
async function testYousign(config: Record<string, string>): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = config.environment === "production"
      ? "https://api.yousign.app"
      : "https://api-sandbox.yousign.app";

    const res = await fetch(`${baseUrl}/v3/users/me`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (res.ok) {
      return { success: true, message: "Connexion Yousign réussie" };
    } else {
      return { success: false, message: `Erreur Yousign: ${res.status}` };
    }
  } catch (error) {
    return { success: false, message: "Impossible de contacter Yousign" };
  }
}

// Test Zoom
async function testZoom(config: Record<string, string>): Promise<{ success: boolean; message: string }> {
  try {
    // Générer un token OAuth
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

    const tokenRes = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${config.accountId}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (tokenRes.ok) {
      return { success: true, message: "Connexion Zoom réussie" };
    } else {
      return { success: false, message: `Erreur Zoom OAuth: ${tokenRes.status}` };
    }
  } catch (error) {
    return { success: false, message: "Impossible de contacter Zoom" };
  }
}

// Test Stripe
async function testStripe(config: Record<string, string>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
      },
    });

    if (res.ok) {
      return { success: true, message: "Connexion Stripe réussie" };
    } else {
      return { success: false, message: `Erreur Stripe: ${res.status}` };
    }
  } catch (error) {
    return { success: false, message: "Impossible de contacter Stripe" };
  }
}

// Test Resend
async function testResend(config: Record<string, string>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (res.ok) {
      return { success: true, message: "Connexion Resend réussie" };
    } else {
      return { success: false, message: `Erreur Resend: ${res.status}` };
    }
  } catch (error) {
    return { success: false, message: "Impossible de contacter Resend" };
  }
}

// Test SendGrid
async function testSendGrid(config: Record<string, string>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.sendgrid.com/v3/user/profile", {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (res.ok) {
      return { success: true, message: "Connexion SendGrid réussie" };
    } else {
      return { success: false, message: `Erreur SendGrid: ${res.status}` };
    }
  } catch (error) {
    return { success: false, message: "Impossible de contacter SendGrid" };
  }
}

// Test xAPI/LRS
async function testXAPI(config: Record<string, string>): Promise<{ success: boolean; message: string }> {
  try {
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString("base64");

    const res = await fetch(`${config.endpoint}about`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        "X-Experience-API-Version": config.version || "1.0.3",
      },
    });

    if (res.ok) {
      return { success: true, message: "Connexion LRS réussie" };
    } else {
      return { success: false, message: `Erreur LRS: ${res.status}` };
    }
  } catch (error) {
    return { success: false, message: "Impossible de contacter le LRS" };
  }
}

// Test AWS S3
async function testS3(config: Record<string, string>): Promise<{ success: boolean; message: string }> {
  // Note: Pour un vrai test S3, il faudrait utiliser le SDK AWS
  // Ici on fait une validation basique
  if (config.accessKeyId && config.secretAccessKey && config.bucket && config.region) {
    return { success: true, message: "Configuration S3 valide (test complet nécessite SDK)" };
  }
  return { success: false, message: "Configuration S3 incomplète" };
}
