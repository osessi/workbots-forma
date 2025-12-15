import { prisma } from "./prisma";
import { Organization, User, UserRole } from "@prisma/client";

// ===========================================
// TYPES
// ===========================================

export interface TenantContext {
  organization: Organization;
  user: User;
  isOrgAdmin: boolean;
  isSuperAdmin: boolean;
}

// ===========================================
// RÉCUPÉRATION DU CONTEXTE TENANT
// ===========================================

/**
 * Récupère le contexte multi-tenant à partir du Clerk userId
 */
export async function getTenantContext(
  clerkUserId: string
): Promise<TenantContext | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: { organization: true },
  });

  if (!user) {
    return null;
  }

  // Super Admin sans organisation
  if (user.isSuperAdmin && !user.organization) {
    return {
      organization: null as unknown as Organization,
      user,
      isOrgAdmin: false,
      isSuperAdmin: true,
    };
  }

  if (!user.organization) {
    return null;
  }

  return {
    organization: user.organization,
    user,
    isOrgAdmin: user.role === UserRole.ORG_ADMIN,
    isSuperAdmin: user.isSuperAdmin,
  };
}

/**
 * Récupère une organisation par son slug
 */
export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
  });
}

/**
 * Récupère une organisation par son domaine personnalisé
 */
export async function getOrganizationByDomain(domain: string) {
  return prisma.organization.findUnique({
    where: { customDomain: domain },
  });
}

// ===========================================
// VÉRIFICATIONS DE PERMISSIONS
// ===========================================

/**
 * Vérifie si l'utilisateur peut accéder à une ressource
 */
export function canAccessResource(
  context: TenantContext,
  resourceOrgId: string
): boolean {
  // Super Admin peut tout voir
  if (context.isSuperAdmin) {
    return true;
  }

  // Sinon, doit appartenir à la même organisation
  return context.organization?.id === resourceOrgId;
}

/**
 * Vérifie si l'utilisateur peut modifier une ressource
 */
export function canModifyResource(
  context: TenantContext,
  resourceOrgId: string,
  resourceUserId?: string
): boolean {
  // Super Admin peut tout modifier
  if (context.isSuperAdmin) {
    return true;
  }

  // Doit appartenir à la même organisation
  if (context.organization?.id !== resourceOrgId) {
    return false;
  }

  // Admin de l'organisation peut tout modifier dans son org
  if (context.isOrgAdmin) {
    return true;
  }

  // Sinon, doit être le propriétaire de la ressource
  return resourceUserId === context.user.id;
}

// ===========================================
// HELPERS POUR LES QUERIES
// ===========================================

/**
 * Retourne le filtre organizationId pour les queries Prisma
 */
export function getOrgFilter(context: TenantContext) {
  // Super Admin peut voir toutes les organisations
  if (context.isSuperAdmin) {
    return {};
  }

  return {
    organizationId: context.organization.id,
  };
}

/**
 * Retourne le filtre pour les ressources de l'utilisateur ou de son org
 */
export function getUserOrOrgFilter(context: TenantContext) {
  // Super Admin peut voir tout
  if (context.isSuperAdmin) {
    return {};
  }

  // Admin de l'organisation voit tout dans son org
  if (context.isOrgAdmin) {
    return {
      organizationId: context.organization.id,
    };
  }

  // Sinon, voit uniquement ses propres ressources
  return {
    organizationId: context.organization.id,
    userId: context.user.id,
  };
}

// ===========================================
// LIMITES PAR PLAN
// ===========================================

/**
 * Vérifie si l'organisation peut créer une nouvelle formation
 */
export async function canCreateFormation(orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: { formations: true },
      },
    },
  });

  if (!org) return false;

  return org._count.formations < org.maxFormations;
}

/**
 * Vérifie si l'organisation peut ajouter un nouveau formateur
 */
export async function canAddFormateur(orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: {
          users: {
            where: {
              role: {
                in: [UserRole.FORMATEUR, UserRole.ORG_ADMIN],
              },
            },
          },
        },
      },
    },
  });

  if (!org) return false;

  return org._count.users < org.maxFormateurs;
}

/**
 * Calcule l'utilisation du stockage d'une organisation
 */
export async function getStorageUsage(
  orgId: string
): Promise<{ used: number; max: number; percentage: number }> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    return { used: 0, max: 0, percentage: 0 };
  }

  const result = await prisma.file.aggregate({
    where: { organizationId: orgId },
    _sum: { size: true },
  });

  const usedBytes = result._sum.size || 0;
  const maxBytes = org.maxStorageGb * 1024 * 1024 * 1024;
  const percentage = maxBytes > 0 ? (usedBytes / maxBytes) * 100 : 0;

  return {
    used: usedBytes,
    max: maxBytes,
    percentage: Math.min(percentage, 100),
  };
}
