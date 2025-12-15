// ===========================================
// API ROUTE - Sync User to Prisma
// ===========================================
// Synchronise l'utilisateur Supabase avec la base Prisma
// Appelé après connexion email/password

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST() {
  try {
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
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    // Récupérer l'utilisateur connecté
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier si c'est le premier utilisateur (sera Super Admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Créer ou mettre à jour l'utilisateur dans Prisma
    const user = await prisma.user.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {
        email: supabaseUser.email!,
        firstName: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
        lastLoginAt: new Date(),
      },
      create: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email!,
        firstName: supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.full_name?.split(' ')[0] || null,
        lastName: supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || null,
        avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
        // Le premier utilisateur devient Super Admin
        role: isFirstUser ? "SUPER_ADMIN" : "FORMATEUR",
        isSuperAdmin: isFirstUser,
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
