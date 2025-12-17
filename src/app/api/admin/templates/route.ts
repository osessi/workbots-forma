import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// Vérifier si l'utilisateur est super admin
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

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    select: { isSuperAdmin: true },
  });

  return user?.isSuperAdmin ? supabaseUser : null;
}

export async function GET() {
  const user = await checkSuperAdmin();

  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 403 }
    );
  }

  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await checkSuperAdmin();

  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, documentType, category, content, headerContent, footerContent, variables, isSystem, isActive } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Nom et catégorie requis" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        documentType: documentType || null,
        category: category as "DOCUMENT" | "EMAIL" | "PDF",
        content: content || {},
        headerContent: headerContent || null,
        footerContent: footerContent || null,
        variables: variables || [],
        isSystem: isSystem ?? false,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
