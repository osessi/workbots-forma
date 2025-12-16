// ===========================================
// API ROUTE - Sync User to Prisma
// ===========================================
// Synchronise l'utilisateur Supabase avec la base Prisma
// Crée également l'organisation si les infos workspace sont présentes
// Appelé après connexion email/password ou inscription

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

    const metadata = supabaseUser.user_metadata || {};

    // Vérifier si c'est le premier utilisateur (sera Super Admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    let organizationId = existingUser?.organizationId;

    // Créer l'organisation si workspace_name est fourni et l'utilisateur n'a pas d'org
    if (metadata.workspace_name && metadata.workspace_slug && !organizationId) {
      // Vérifier si le slug n'existe pas déjà
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: metadata.workspace_slug },
      });

      if (!existingOrg) {
        const newOrg = await prisma.organization.create({
          data: {
            name: metadata.workspace_name,
            slug: metadata.workspace_slug,
            siret: metadata.siret || null,
            numeroFormateur: metadata.numero_formateur || null,
            adresse: metadata.adresse || null,
            codePostal: metadata.code_postal || null,
            ville: metadata.ville || null,
            telephone: metadata.telephone || null,
          },
        });
        organizationId = newOrg.id;
      } else {
        // Utiliser l'org existante
        organizationId = existingOrg.id;
      }
    }

    // Créer ou mettre à jour l'utilisateur dans Prisma
    const user = await prisma.user.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {
        email: supabaseUser.email!,
        firstName: metadata.first_name || metadata.full_name?.split(' ')[0] || null,
        lastName: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || null,
        phone: metadata.phone || null,
        avatar: metadata.avatar_url || metadata.picture || null,
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
      include: {
        organization: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        organization: user.organization ? {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          siret: user.organization.siret,
          numeroFormateur: user.organization.numeroFormateur,
          adresse: user.organization.adresse,
          codePostal: user.organization.codePostal,
          ville: user.organization.ville,
          telephone: user.organization.telephone,
          logo: user.organization.logo,
        } : null,
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
