import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { authenticateUser } from "@/lib/auth";

// POST - Synchroniser les utilisateurs Supabase avec Prisma
export async function POST() {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json(
      { error: "Non autorise - Super Admin requis" },
      { status: 403 }
    );
  }

  // Verifier que les variables d'environnement sont definies
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY non configure" },
      { status: 500 }
    );
  }

  try {
    // Creer un client admin Supabase avec la service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Recuperer tous les utilisateurs de Supabase
    const { data: supabaseUsers, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la recuperation des utilisateurs Supabase" },
        { status: 500 }
      );
    }

    const results = {
      total: supabaseUsers.users.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Pour chaque utilisateur Supabase
    for (const supaUser of supabaseUsers.users) {
      try {
        // Verifier s'il existe deja dans Prisma
        const existingUser = await prisma.user.findUnique({
          where: { supabaseId: supaUser.id },
        });

        if (existingUser) {
          // Mettre a jour les informations si necessaire
          const needsUpdate =
            existingUser.email !== supaUser.email ||
            (!existingUser.firstName && supaUser.user_metadata?.first_name) ||
            (!existingUser.lastName && supaUser.user_metadata?.last_name);

          if (needsUpdate) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                email: supaUser.email || existingUser.email,
                firstName: existingUser.firstName || supaUser.user_metadata?.first_name || null,
                lastName: existingUser.lastName || supaUser.user_metadata?.last_name || null,
              },
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // Creer l'utilisateur dans Prisma
          const firstName = supaUser.user_metadata?.first_name ||
                           supaUser.user_metadata?.firstName ||
                           supaUser.user_metadata?.name?.split(" ")[0] ||
                           null;
          const lastName = supaUser.user_metadata?.last_name ||
                          supaUser.user_metadata?.lastName ||
                          supaUser.user_metadata?.name?.split(" ").slice(1).join(" ") ||
                          null;

          await prisma.user.create({
            data: {
              supabaseId: supaUser.id,
              email: supaUser.email || `user_${supaUser.id}@unknown.com`,
              firstName,
              lastName,
              role: "ORG_ADMIN",
              isActive: true,
              isSuperAdmin: false,
            },
          });
          results.created++;
        }
      } catch (userError) {
        console.error(`Erreur pour l'utilisateur ${supaUser.email}:`, userError);
        results.errors.push(supaUser.email || supaUser.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminee: ${results.created} crees, ${results.updated} mis a jour, ${results.skipped} ignores`,
      results,
    });
  } catch (error) {
    console.error("Erreur synchronisation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}

// GET - Comparer les utilisateurs Supabase et Prisma
export async function GET() {
  const user = await authenticateUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json(
      { error: "Non autorise - Super Admin requis" },
      { status: 403 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY non configure" },
      { status: 500 }
    );
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Recuperer les utilisateurs des deux sources
    const [{ data: supabaseUsers }, prismaUsers] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers(),
      prisma.user.findMany({
        select: {
          id: true,
          supabaseId: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      }),
    ]);

    const prismaSupabaseIds = new Set(prismaUsers.map(u => u.supabaseId));
    const supabaseIds = new Set(supabaseUsers?.users.map(u => u.id) || []);

    // Utilisateurs dans Supabase mais pas dans Prisma
    const missingInPrisma = supabaseUsers?.users
      .filter(u => !prismaSupabaseIds.has(u.id))
      .map(u => ({
        supabaseId: u.id,
        email: u.email,
        name: u.user_metadata?.first_name
          ? `${u.user_metadata.first_name} ${u.user_metadata.last_name || ""}`.trim()
          : u.email,
        createdAt: u.created_at,
      })) || [];

    // Utilisateurs dans Prisma mais pas dans Supabase (orphelins)
    const orphanedInPrisma = prismaUsers
      .filter(u => !supabaseIds.has(u.supabaseId))
      .map(u => ({
        id: u.id,
        supabaseId: u.supabaseId,
        email: u.email,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      }));

    return NextResponse.json({
      supabase: {
        total: supabaseUsers?.users.length || 0,
        users: supabaseUsers?.users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.first_name
            ? `${u.user_metadata.first_name} ${u.user_metadata.last_name || ""}`.trim()
            : null,
        })) || [],
      },
      prisma: {
        total: prismaUsers.length,
      },
      missingInPrisma,
      orphanedInPrisma,
    });
  } catch (error) {
    console.error("Erreur comparaison:", error);
    return NextResponse.json(
      { error: "Erreur lors de la comparaison" },
      { status: 500 }
    );
  }
}
