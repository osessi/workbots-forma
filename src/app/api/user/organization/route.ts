// ===========================================
// API GESTION ORGANISATION
// ===========================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

// GET - Récupérer les informations de l'organisation
export async function GET() {
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
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son organisation
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      organization: user.organization,
    });
  } catch (error) {
    console.error("Erreur GET organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les informations de l'organisation
export async function PUT(request: NextRequest) {
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
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nomCommercial,
      siret,
      villeRcs,
      numeroFormateur,
      prefectureRegion,
      representantNom,
      representantPrenom,
      representantFonction,
      adresse,
      codePostal,
      ville,
      email,
      telephone,
      siteWeb,
      logo,
      signature,
      cachet,
    } = body;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { organizationId: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    let organization;

    if (user.organizationId) {
      // Mettre à jour l'organisation existante
      organization = await prisma.organization.update({
        where: { id: user.organizationId },
        data: {
          name: name || undefined,
          nomCommercial: nomCommercial || null,
          siret: siret || null,
          villeRcs: villeRcs || null,
          numeroFormateur: numeroFormateur || null,
          prefectureRegion: prefectureRegion || null,
          representantNom: representantNom || null,
          representantPrenom: representantPrenom || null,
          representantFonction: representantFonction || null,
          adresse: adresse || null,
          codePostal: codePostal || null,
          ville: ville || null,
          email: email || null,
          telephone: telephone || null,
          siteWeb: siteWeb || null,
          logo: logo || null,
          signature: signature || null,
          cachet: cachet || null,
        },
      });
    } else {
      // Créer une nouvelle organisation
      const slug = name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || `org-${Date.now()}`;

      organization = await prisma.organization.create({
        data: {
          name: name || "Mon organisme",
          slug,
          nomCommercial: nomCommercial || null,
          siret: siret || null,
          villeRcs: villeRcs || null,
          numeroFormateur: numeroFormateur || null,
          prefectureRegion: prefectureRegion || null,
          representantNom: representantNom || null,
          representantPrenom: representantPrenom || null,
          representantFonction: representantFonction || null,
          adresse: adresse || null,
          codePostal: codePostal || null,
          ville: ville || null,
          email: email || null,
          telephone: telephone || null,
          siteWeb: siteWeb || null,
          logo: logo || null,
          signature: signature || null,
          cachet: cachet || null,
        },
      });

      // Associer l'organisation à l'utilisateur
      await prisma.user.update({
        where: { supabaseId: supabaseUser.id },
        data: { organizationId: organization.id },
      });
    }

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Erreur PUT organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour partielle de l'organisation (ex: toggle catalogue)
export async function PATCH(request: NextRequest) {
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
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: { organizationId: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });
    }

    const body = await request.json();
    console.log("[PATCH organization] Body reçu:", body);
    console.log("[PATCH organization] Organization ID:", user.organizationId);

    // Construire l'objet de mise à jour avec seulement les champs fournis
    const updateData: Record<string, unknown> = {};

    if (typeof body.catalogueActif === "boolean") {
      updateData.catalogueActif = body.catalogueActif;
    }

    if (typeof body.primaryColor === "string") {
      updateData.primaryColor = body.primaryColor;
    }

    // Nouveaux champs Qualiopi
    if (typeof body.certificatQualiopiUrl === "string" || body.certificatQualiopiUrl === null) {
      updateData.certificatQualiopiUrl = body.certificatQualiopiUrl;
    }

    if (typeof body.categorieQualiopi === "string" || body.categorieQualiopi === null) {
      updateData.categorieQualiopi = body.categorieQualiopi || null;
    }

    console.log("[PATCH organization] Update data:", updateData);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
    });

    console.log("[PATCH organization] Mise à jour réussie:", organization.catalogueActif);

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Erreur PATCH organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
