import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { User, UserRole } from "@prisma/client";

// ===========================================
// TYPES
// ===========================================

export interface AuthUser extends User {
  clerkData?: {
    imageUrl?: string;
    emailAddresses?: { emailAddress: string }[];
    firstName?: string;
    lastName?: string;
  };
}

// ===========================================
// RÉCUPÉRATION DE L'UTILISATEUR
// ===========================================

/**
 * Récupère l'utilisateur courant depuis Clerk et la base de données
 * À utiliser dans les Server Components et Server Actions
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Récupère l'utilisateur depuis la base de données
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  });

  if (!dbUser) {
    return null;
  }

  // Récupère les données supplémentaires de Clerk
  const clerkUser = await currentUser();

  return {
    ...dbUser,
    clerkData: clerkUser
      ? {
          imageUrl: clerkUser.imageUrl,
          emailAddresses: clerkUser.emailAddresses,
          firstName: clerkUser.firstName ?? undefined,
          lastName: clerkUser.lastName ?? undefined,
        }
      : undefined,
  };
}

/**
 * Récupère uniquement l'ID Clerk de l'utilisateur courant
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId;
}

// ===========================================
// SYNCHRONISATION UTILISATEUR
// ===========================================

/**
 * Synchronise un utilisateur Clerk avec la base de données
 * Appelé généralement par le webhook Clerk
 */
export async function syncUserFromClerk(clerkUserId: string): Promise<User> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Utilisateur Clerk non trouvé");
  }

  const email =
    clerkUser.emailAddresses[0]?.emailAddress || `${clerkUserId}@temp.local`;

  // Upsert l'utilisateur
  const user = await prisma.user.upsert({
    where: { clerkId: clerkUserId },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatar: clerkUser.imageUrl,
      lastLoginAt: new Date(),
    },
    create: {
      clerkId: clerkUserId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatar: clerkUser.imageUrl,
      role: UserRole.FORMATEUR,
      lastLoginAt: new Date(),
    },
  });

  return user;
}

/**
 * Crée ou met à jour un utilisateur depuis les données webhook
 */
export async function upsertUserFromWebhook(data: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}): Promise<User> {
  return prisma.user.upsert({
    where: { clerkId: data.clerkId },
    update: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.imageUrl,
      lastLoginAt: new Date(),
    },
    create: {
      clerkId: data.clerkId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.imageUrl,
      role: UserRole.FORMATEUR,
    },
  });
}

// ===========================================
// VÉRIFICATION DES RÔLES
// ===========================================

/**
 * Vérifie si l'utilisateur courant a un rôle spécifique
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Vérifie si l'utilisateur courant est Super Admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isSuperAdmin === true;
}

/**
 * Vérifie si l'utilisateur courant est Admin de son organisation
 */
export async function isOrgAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.ORG_ADMIN;
}

/**
 * Vérifie si l'utilisateur a accès à une organisation spécifique
 */
export async function hasOrgAccess(organizationId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) return false;

  // Super Admin a accès à tout
  if (user.isSuperAdmin) return true;

  // Sinon, doit appartenir à l'organisation
  return user.organizationId === organizationId;
}

// ===========================================
// HELPERS POUR LES ROUTES API
// ===========================================

/**
 * Requiert une authentification pour une route API
 * Lance une erreur si non authentifié
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  return user;
}

/**
 * Requiert un rôle spécifique pour une route API
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== role && !user.isSuperAdmin) {
    throw new Error("Permission refusée");
  }

  return user;
}

/**
 * Requiert le rôle Super Admin
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();

  if (!user.isSuperAdmin) {
    throw new Error("Permission refusée - Super Admin requis");
  }

  return user;
}
