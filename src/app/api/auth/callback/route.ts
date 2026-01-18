// ===========================================
// API ROUTE - OAuth Callback
// ===========================================
// Cette route gère le retour des providers OAuth (Google, Microsoft, LinkedIn)
// et la confirmation d'email après inscription
// Crée/met à jour l'utilisateur dans la base de données Prisma

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

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
        const metadata = supabaseUser.user_metadata || {};

        console.log("[Auth Callback] User metadata:", JSON.stringify(metadata, null, 2));
        console.log("[Auth Callback] workspace_name:", metadata.workspace_name);
        console.log("[Auth Callback] workspace_slug:", metadata.workspace_slug);

        // Vérifier si c'est le premier utilisateur (sera Super Admin)
        const userCount = await prisma.user.count();
        const isFirstUser = userCount === 0;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { supabaseId: supabaseUser.id },
          include: { organization: true },
        });

        let organizationId = existingUser?.organizationId;

        // Créer l'organisation si workspace_name est fourni (depuis le wizard) et pas d'org existante
        if (metadata.workspace_name && metadata.workspace_slug && !organizationId) {
          // Vérifier si le slug n'existe pas déjà
          const existingOrg = await prisma.organization.findUnique({
            where: { slug: metadata.workspace_slug },
          });

          if (!existingOrg) {
            console.log("[Auth Callback] Creating new organization with data:", {
              name: metadata.workspace_name,
              slug: metadata.workspace_slug,
              siret: metadata.siret,
              representantNom: metadata.representant_nom,
            });
            const newOrg = await prisma.organization.create({
              data: {
                // Identité de l'organisme
                name: metadata.workspace_name,
                slug: metadata.workspace_slug,
                nomCommercial: metadata.nom_commercial || null,
                // Informations légales
                siret: metadata.siret || null,
                villeRcs: metadata.ville_rcs || null,
                numeroFormateur: metadata.numero_formateur || null,
                prefectureRegion: metadata.prefecture_region || null,
                // Représentant légal
                representantNom: metadata.representant_nom || null,
                representantPrenom: metadata.representant_prenom || null,
                representantFonction: metadata.representant_fonction || null,
                // Coordonnées
                adresse: metadata.adresse || null,
                codePostal: metadata.code_postal || null,
                ville: metadata.ville || null,
                email: metadata.email_organisme || null,
                telephone: metadata.telephone_organisme || metadata.phone || null,
                siteWeb: metadata.site_web || null,
              },
            });
            organizationId = newOrg.id;
            console.log("[Auth Callback] Organization created:", newOrg.id);
          } else {
            organizationId = existingOrg.id;
            console.log("[Auth Callback] Using existing organization:", existingOrg.id);
          }
        } else {
          console.log("[Auth Callback] No workspace_name or workspace_slug in metadata, skipping org creation");
        }

        // Créer ou mettre à jour l'utilisateur dans Prisma
        await prisma.user.upsert({
          where: { supabaseId: supabaseUser.id },
          update: {
            email: supabaseUser.email!,
            firstName: metadata.first_name || metadata.full_name?.split(' ')[0] || null,
            lastName: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || null,
            phone: metadata.phone || null,
            // Garder l'avatar existant si déjà défini, sinon utiliser celui du provider OAuth
            avatar: existingUser?.avatar || metadata.avatar_url || metadata.picture || null,
            organizationId: organizationId || undefined,
            lastLoginAt: new Date(),
          },
          create: {
            supabaseId: supabaseUser.id,
            email: supabaseUser.email!,
            firstName: metadata.first_name || metadata.full_name?.split(' ')[0] || null,
            lastName: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || null,
            phone: metadata.phone || null,
            avatar: metadata.avatar_url || metadata.picture || null,
            organizationId: organizationId || null,
            // Le premier utilisateur devient Super Admin, sinon ORG_ADMIN s'il crée une org
            role: isFirstUser ? "SUPER_ADMIN" : (organizationId ? "ORG_ADMIN" : "FORMATEUR"),
            isSuperAdmin: isFirstUser,
            lastLoginAt: new Date(),
          },
        });
      }

      // Rediriger vers la page demandée ou / par défaut
      // Note: Le sync se fait aussi côté client au premier chargement via useAutomateContext
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // En cas d'erreur, rediriger vers la page de connexion avec un message d'erreur
  return NextResponse.redirect(
    new URL("/signin?error=auth_callback_error", requestUrl.origin)
  );
}
