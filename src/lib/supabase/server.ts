import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase pour le serveur (Server Components, API Routes, Server Actions)
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            // Ignore les erreurs dans les Server Components en lecture seule
          }
        },
      },
    }
  );
}

// Client avec service role pour les opérations admin (bypass RLS)
export function createSupabaseAdminClient() {
  const { createClient } = require("@supabase/supabase-js");

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
