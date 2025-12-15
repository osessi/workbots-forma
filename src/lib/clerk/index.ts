// Auth utilities
export {
  getCurrentUser,
  getCurrentUserId,
  isAuthenticated,
  syncUserFromClerk,
  upsertUserFromWebhook,
  hasRole,
  isSuperAdmin,
  isOrgAdmin,
  hasOrgAccess,
  requireAuth,
  requireRole,
  requireSuperAdmin,
} from "./auth";

export type { AuthUser } from "./auth";
