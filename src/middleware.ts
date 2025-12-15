// ===========================================
// MIDDLEWARE SUPABASE AUTH
// ===========================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Mode développement - désactive l'auth si Supabase n'est pas configuré
const DEV_MODE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("YOUR_PROJECT_REF") ||
                 !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  "/",
  "/signin",
  "/signup",
  "/reset-password",
  "/api/auth/callback",
  "/api/webhooks",
];

// Routes qui nécessitent une authentification
const protectedRoutes = ["/automate", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // En mode dev sans Supabase configuré, autoriser toutes les routes
  if (DEV_MODE) {
    return NextResponse.next();
  }

  // Mettre à jour la session Supabase (refresh tokens)
  const { supabaseResponse, user } = await updateSession(request);

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Vérifier si c'est une route protégée
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si route protégée et pas d'utilisateur, rediriger vers signin
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/signin", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Si l'utilisateur est connecté et essaie d'accéder aux pages auth, rediriger vers automate
  if (user && (pathname === "/signin" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/automate", request.url));
  }

  // Vérifier l'accès admin (seulement pour les super_admin)
  if (pathname.startsWith("/admin") && user) {
    // Note: La vérification du rôle se fera côté serveur dans les pages admin
    // car le middleware n'a pas accès à la base de données Prisma
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions (.svg, .png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
