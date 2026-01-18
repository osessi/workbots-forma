import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

export async function GET() {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
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
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
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
