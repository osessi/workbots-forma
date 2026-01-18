// NOTE: Cette API utilise directement Supabase car elle a besoin des métadonnées pour créer l'utilisateur

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ isSuperAdmin: false }, { status: 401 });
    }

    // Synchroniser l'utilisateur si necessaire
    let user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { isSuperAdmin: true },
    });

    // Si l'utilisateur n'existe pas dans Prisma, le creer
    if (!user) {
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          email: supabaseUser.email || "",
          firstName: supabaseUser.user_metadata?.firstName || supabaseUser.user_metadata?.full_name?.split(" ")[0] || "",
          lastName: supabaseUser.user_metadata?.lastName || supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
          isSuperAdmin: false,
        },
        select: { isSuperAdmin: true },
      });
    }

    return NextResponse.json({ isSuperAdmin: user.isSuperAdmin });
  } catch (error) {
    console.error("Erreur lors de la verification super admin:", error);
    return NextResponse.json({ isSuperAdmin: false }, { status: 500 });
  }
}
