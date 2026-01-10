// ===========================================
// PROXY - Next.js 16 (replaces middleware.ts)
// Handles: Supabase Auth + API proxying + Custom Domain
// ===========================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Mode développement - désactive l'auth si Supabase n'est pas configuré
const DEV_MODE =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("YOUR_PROJECT_REF") ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Domaines internes (ne pas traiter comme domaine personnalisé)
const INTERNAL_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "automate-forma.com",
  "www.automate-forma.com",
  "app.automate-forma.com",
  "automate-forma.vercel.app",
];

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  "/",
  "/signin",
  "/signup",
  "/reset-password",
  "/admin-login",
  "/api/auth/callback",
  "/api/webhooks",
  "/intervenant/login",
  "/intervenant/register",
  "/apprenant/login",
  "/apprenant/register",
  "/catalogue",
];

// Routes qui nécessitent une authentification
const protectedRoutes = ["/", "/admin"];

// Slides API URL for proxying
const SLIDES_API_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// Routes that need to be proxied to the slides backend
const SLIDES_PROXY_ROUTES = [
  "/api/slides/v1/",
  "/api/slides/presentation/",
  "/api/slides/export/",
];

// Long-running routes that need extended timeout (5 minutes)
const LONG_RUNNING_ROUTES = [
  "/api/slides/v1/ppt/slide-to-html",
  "/api/slides/v1/ppt/html-to-react",
  "/api/slides/v1/ppt/html-edit",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Extraire le domaine sans le port
  const domain = hostname.split(":")[0];

  // Vérifier si c'est un domaine personnalisé
  const isCustomDomain = !INTERNAL_DOMAINS.some(
    (internalDomain) => domain === internalDomain || domain.endsWith(`.${internalDomain}`)
  );

  // Check if this is a slides API route that needs proxying
  const isSlidesRoute = SLIDES_PROXY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isSlidesRoute) {
    return handleSlidesProxy(request, pathname);
  }

  // Handle authentication for other routes (with custom domain support)
  return handleAuth(request, pathname, isCustomDomain, domain);
}

async function handleSlidesProxy(
  request: NextRequest,
  pathname: string
): Promise<Response> {
  // Determine timeout based on route
  const isLongRunning = LONG_RUNNING_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const timeout = isLongRunning ? 300000 : 60000; // 5 min for long-running, 1 min for others

  // Build the upstream URL
  let upstreamPath = pathname;
  if (pathname.startsWith("/api/slides/v1/")) {
    upstreamPath = pathname.replace("/api/slides/v1/", "/api/v1/");
  } else if (pathname.startsWith("/api/slides/presentation/")) {
    upstreamPath = pathname.replace("/api/slides/presentation/", "/api/presentation/");
  } else if (pathname.startsWith("/api/slides/export/")) {
    upstreamPath = pathname.replace("/api/slides/export/", "/api/export/");
  }

  const upstreamUrl = `${SLIDES_API_URL}${upstreamPath}${request.nextUrl.search}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Clone request body if present
    let body: BodyInit | null = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }

    // Forward headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host header as it will be set by fetch
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });

    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Create response with all headers from upstream
    const responseHeaders = new Headers(response.headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Proxy error for ${pathname}:`, error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timed out - the operation is taking too long",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Proxy error",
      },
      { status: 502 }
    );
  }
}

async function handleAuth(
  request: NextRequest,
  pathname: string,
  isCustomDomain: boolean = false,
  customDomainValue: string = ""
): Promise<Response> {
  // En mode dev sans Supabase configuré, autoriser toutes les routes
  if (DEV_MODE) {
    const response = NextResponse.next();

    // Gérer le cookie custom-domain
    if (isCustomDomain) {
      response.cookies.set("custom-domain", customDomainValue, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      response.headers.set("x-custom-domain", customDomainValue);
    } else {
      response.cookies.delete("custom-domain");
    }

    return response;
  }

  // Mettre à jour la session Supabase (refresh tokens)
  const { supabaseResponse, user } = await updateSession(request);

  // Gérer le cookie custom-domain
  if (isCustomDomain) {
    supabaseResponse.cookies.set("custom-domain", customDomainValue, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    supabaseResponse.headers.set("x-custom-domain", customDomainValue);
  } else {
    supabaseResponse.cookies.delete("custom-domain");
  }

  // Vérifier si c'est une route publique (prioritaire)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Si c'est une route publique, laisser passer
  if (isPublicRoute) {
    return supabaseResponse;
  }

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

  // Si l'utilisateur est connecté et essaie d'accéder aux pages auth classiques, rediriger vers automate
  // Note: /admin-login est exclu car il a sa propre logique de redirection
  if (user && (pathname === "/signin" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
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
