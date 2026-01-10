"use client";
import React, { useState, useEffect } from "react";
import UserAvatar from "@/components/ui/avatar/UserAvatar";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  organization: {
    id: string;
    name: string;
  } | null;
}

interface SyncStatus {
  isLoading: boolean;
  message: string | null;
  type: "success" | "error" | null;
}

const ROLES = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-red-500" },
  ORG_ADMIN: { label: "Admin Org", color: "bg-orange-500" },
  FORMATEUR: { label: "Formateur", color: "bg-blue-500" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    message: null,
    type: null,
  });

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/admin/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.map((org: { id: string; name: string }) => ({ id: org.id, name: org.name })));
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSyncUsers = async () => {
    setSyncStatus({ isLoading: true, message: null, type: null });
    try {
      const response = await fetch("/api/admin/sync-users", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setSyncStatus({
          isLoading: false,
          message: data.message,
          type: "success",
        });
        // Recharger la liste des utilisateurs
        fetchUsers();
      } else {
        setSyncStatus({
          isLoading: false,
          message: data.error || "Erreur lors de la synchronisation",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setSyncStatus({
        isLoading: false,
        message: "Erreur lors de la synchronisation",
        type: "error",
      });
    }

    // Effacer le message apres 5 secondes
    setTimeout(() => {
      setSyncStatus((prev) => ({ ...prev, message: null, type: null }));
    }, 5000);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleImpersonate = async (userId: string, userName: string) => {
    if (!confirm(`Voulez-vous vous connecter en tant que "${userName}" ?\n\nVous serez redirige vers l'application avec les droits de cet utilisateur.`)) return;

    setImpersonatingId(userId);
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Rediriger vers l'application principale
        window.location.href = "/";
      } else {
        alert(data.error || "Erreur lors de l'impersonation");
        setImpersonatingId(null);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'impersonation");
      setImpersonatingId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesOrg = filterOrg === "all" || user.organization?.id === filterOrg;
    return matchesSearch && matchesRole && matchesOrg;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerez tous les utilisateurs de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </span>
          <button
            onClick={handleSyncUsers}
            disabled={syncStatus.isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncStatus.isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Synchronisation...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 4V10H17M1 20V14H7M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sync Supabase
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Status Message */}
      {syncStatus.message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            syncStatus.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >
          {syncStatus.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
        >
          <option value="all">Tous les roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ORG_ADMIN">Admin Org</option>
          <option value="FORMATEUR">Formateur</option>
        </select>
        <select
          value={filterOrg}
          onChange={(e) => setFilterOrg(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
        >
          <option value="all">Toutes les organisations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <th className="px-6 py-4 font-medium">Utilisateur</th>
                <th className="px-6 py-4 font-medium">Organisation</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Derniere connexion</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-400">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun utilisateur trouve
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
                  const canImpersonate = !user.isSuperAdmin;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <UserAvatar
                              src={user.avatar}
                              seed={user.email}
                              alt={userName}
                              size="medium"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {userName}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {user.organization?.name || (
                          <span className="text-gray-500">Aucune</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full text-white ${
                            user.isSuperAdmin
                              ? "bg-red-500"
                              : ROLES[user.role as keyof typeof ROLES]?.color || "bg-gray-500"
                          }`}
                        >
                          {user.isSuperAdmin
                            ? "Super Admin"
                            : ROLES[user.role as keyof typeof ROLES]?.label || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            user.isActive
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Jamais"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Bouton Impersonation - plus visible */}
                          <button
                            onClick={() => handleImpersonate(user.id, userName)}
                            disabled={!canImpersonate || impersonatingId === user.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              canImpersonate
                                ? impersonatingId === user.id
                                  ? "bg-orange-500 text-white cursor-wait"
                                  : "bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/30"
                                : "bg-gray-800 text-gray-600 cursor-not-allowed"
                            }`}
                            title={canImpersonate ? `Se connecter en tant que ${userName}` : "Impossible d'usurper un super admin"}
                          >
                            {impersonatingId === user.id ? (
                              <>
                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connexion...
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M19 8L21 10L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M21 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Usurper
                              </>
                            )}
                          </button>

                          {/* Toggle actif/inactif */}
                          <button
                            onClick={() => handleToggleActive(user.id, user.isActive)}
                            disabled={user.isSuperAdmin}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isSuperAdmin
                                ? "text-gray-600 cursor-not-allowed"
                                : user.isActive
                                ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                : "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            }`}
                            title={
                              user.isSuperAdmin
                                ? "Impossible de desactiver un super admin"
                                : user.isActive
                                ? "Desactiver l'utilisateur"
                                : "Activer l'utilisateur"
                            }
                          >
                            {user.isActive ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64M12 2V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
