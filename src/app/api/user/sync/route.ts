// ===========================================
// API ROUTE - Sync User to Prisma
// ===========================================
// Synchronise l'utilisateur Supabase avec la base Prisma
// Crée également l'organisation si les infos workspace sont présentes
// Appelé après connexion email/password ou inscription
// NOTE: Cette API utilise directement Supabase car elle a besoin des métadonnées

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();

    // Récupérer l'utilisateur connecté
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const metadata = supabaseUser.user_metadata || {};

    console.log("[User Sync] User metadata:", JSON.stringify(metadata, null, 2));
    console.log("[User Sync] workspace_name:", metadata.workspace_name);
    console.log("[User Sync] workspace_slug:", metadata.workspace_slug);

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
      console.log("[User Sync] Will create organization");
      // Vérifier si le slug n'existe pas déjà
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: metadata.workspace_slug },
      });

      if (!existingOrg) {
        console.log("[User Sync] Creating new organization with data:", {
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
      } else {
        // Utiliser l'org existante
        organizationId = existingOrg.id;
      }
    }

    // Créer ou mettre à jour l'utilisateur dans Prisma
    // IMPORTANT: Ne pas écraser les données existantes avec les métadonnées OAuth
    const user = await prisma.user.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {
        email: supabaseUser.email!,
        // Garder les données existantes si déjà définies
        firstName: existingUser?.firstName || metadata.first_name || metadata.full_name?.split(' ')[0] || null,
        lastName: existingUser?.lastName || metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || null,
        phone: existingUser?.phone || metadata.phone || null,
        // IMPORTANT: Ne jamais écraser l'avatar personnalisé
        avatar: existingUser?.avatar || metadata.avatar_url || metadata.picture || null,
        organizationId: organizationId || existingUser?.organizationId || undefined,
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
          nomCommercial: user.organization.nomCommercial,
          siret: user.organization.siret,
          villeRcs: user.organization.villeRcs,
          numeroFormateur: user.organization.numeroFormateur,
          prefectureRegion: user.organization.prefectureRegion,
          representantNom: user.organization.representantNom,
          representantPrenom: user.organization.representantPrenom,
          representantFonction: user.organization.representantFonction,
          adresse: user.organization.adresse,
          codePostal: user.organization.codePostal,
          ville: user.organization.ville,
          email: user.organization.email,
          telephone: user.organization.telephone,
          siteWeb: user.organization.siteWeb,
          logo: user.organization.logo,
          signature: user.organization.signature,
          cachet: user.organization.cachet,
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
