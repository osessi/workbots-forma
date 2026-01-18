import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

const IMPERSONATION_COOKIE = "impersonating_user_id";

export interface CurrentUser {
  id: string;
  supabaseId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  organizationId: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
    email: string | null;
    telephone: string | null;
  } | null;
  // Informations d'impersonation
  isImpersonating: boolean;
  impersonatedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();

    // Créer le client Supabase
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

    // Vérifier l'authentification
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return null;
    }

    // Récupérer l'utilisateur réel (admin)
    const realUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
      },
    });

    if (!realUser) {
      return null;
    }

    // Vérifier s'il y a une impersonation en cours
    const impersonatedUserId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

    // Si l'utilisateur est super admin et qu'il y a un cookie d'impersonation
    if (realUser.isSuperAdmin && impersonatedUserId) {
      const impersonatedUser = await prisma.user.findUnique({
        where: { id: impersonatedUserId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              primaryColor: true,
              email: true,
              telephone: true,
            },
          },
        },
      });

      if (impersonatedUser) {
        return {
          id: impersonatedUser.id,
          supabaseId: impersonatedUser.supabaseId,
          email: impersonatedUser.email,
          firstName: impersonatedUser.firstName,
          lastName: impersonatedUser.lastName,
          phone: impersonatedUser.phone,
          avatar: impersonatedUser.avatar,
          role: impersonatedUser.role,
          isSuperAdmin: false, // Important: l'utilisateur impersonné n'est PAS super admin
          isActive: impersonatedUser.isActive,
          organizationId: impersonatedUser.organizationId,
          organization: impersonatedUser.organization,
          isImpersonating: true,
          impersonatedBy: {
            id: realUser.id,
            email: realUser.email,
            firstName: realUser.firstName,
            lastName: realUser.lastName,
          },
        };
      }
    }

    // Pas d'impersonation, retourner l'utilisateur normal
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            email: true,
            telephone: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isActive: user.isActive,
      organizationId: user.organizationId,
      organization: user.organization,
      isImpersonating: false,
      impersonatedBy: null,
    };
  } catch (error) {
    console.error("Erreur getCurrentUser:", error);
    return null;
  }
}

// Fonction helper pour vérifier si l'utilisateur courant est en mode impersonation
export async function isCurrentlyImpersonating(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isImpersonating ?? false;
}

// Fonction helper pour obtenir l'admin réel pendant l'impersonation
export async function getRealAdmin(): Promise<{ id: string; email: string } | null> {
  const user = await getCurrentUser();
  return user?.impersonatedBy ?? null;
}

// ===========================================
// AUTHENTIFICATION POUR LES APIs (avec support impersonation)
// ===========================================
// Cette fonction remplace les fonctions `authenticateUser` locales dans les APIs
// Elle retourne l'utilisateur avec son organisation, en tenant compte de l'impersonation

export interface AuthenticatedUser {
  id: string;
  supabaseId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  organizationId: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
    email: string | null;
    telephone: string | null;
  } | null;
  // Contexte d'impersonation
  isImpersonating: boolean;
  impersonatedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

/**
 * Authentifie l'utilisateur courant pour les APIs
 * Gère automatiquement l'impersonation si un super admin est en mode impersonation
 *
 * @returns L'utilisateur authentifié ou null si non connecté
 */
export async function authenticateUser(): Promise<AuthenticatedUser | null> {
  return getCurrentUser();
}
