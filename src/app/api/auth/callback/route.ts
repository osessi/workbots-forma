// ===========================================
// API ROUTE - OAuth Callback
// ===========================================
// Cette route gère le retour des providers OAuth (Google, Microsoft, LinkedIn)
// et crée/met à jour l'utilisateur dans la base de données Prisma

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/automate";

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Récupérer l'utilisateur connecté
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      if (supabaseUser) {
        // Vérifier si c'est le premier utilisateur (sera Super Admin)
        const userCount = await prisma.user.count();
        const isFirstUser = userCount === 0;

        // Créer ou mettre à jour l'utilisateur dans Prisma
        await prisma.user.upsert({
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
      }

      // Rediriger vers la page demandée ou /automate par défaut
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // En cas d'erreur, rediriger vers la page de connexion avec un message d'erreur
  return NextResponse.redirect(
    new URL("/signin?error=auth_callback_error", requestUrl.origin)
  );
}
