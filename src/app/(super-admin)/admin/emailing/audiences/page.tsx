"use client";

// ===========================================
// PAGE SUPER ADMIN - Audiences email
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Users, Search, RefreshCw, MoreVertical,
  Eye, Trash2, Target, Download, Upload
} from "lucide-react";

interface Audience {
  id: string;
  name: string;
  description: string | null;
  totalContacts: number;
  activeContacts: number;
  bouncedContacts: number;
  unsubscribedContacts: number;
  createdAt: string;
  organization?: { name: string };
  _count?: { campaigns: number };
}

export default function AdminAudiencesPage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchAudiences();
  }, []);

  const fetchAudiences = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/audiences?global=true");
      if (res.ok) {
        const data = await res.json();
        setAudiences(data.audiences || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAudience = async (id: string) => {
    if (!confirm("Supprimer cette audience et tous ses contacts ?")) return;
    try {
      await fetch(`/api/emailing/audiences/${id}`, { method: "DELETE" });
      fetchAudiences();
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const filteredAudiences = audiences.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalContacts = audiences.reduce((acc, a) => acc + a.totalContacts, 0);
  const activeContacts = audiences.reduce((acc, a) => acc + a.activeContacts, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-500" />
            Audiences
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {totalContacts.toLocaleString()} contacts totaux · {activeContacts.toLocaleString()} actifs
          </p>
        </div>
        <Link
          href="/admin/emailing/audiences/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Nouvelle audience
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une audience..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={fetchAudiences}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : filteredAudiences.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune audience</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudiences.map((audience) => (
            <div
              key={audience.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all relative group"
            >
              {/* Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setOpenMenuId(openMenuId === audience.id ? null : audience.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                {openMenuId === audience.id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <Link
                      href={`/admin/emailing/audiences/${audience.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                      Voir contacts
                    </Link>
                    <button
                      onClick={() => deleteAudience(audience.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>

              <Link href={`/admin/emailing/audiences/${audience.id}`}>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-8">
                  {audience.name}
                </h3>
                {audience.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {audience.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mb-3">
                  {audience.organization?.name || "Global"}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {audience.activeContacts.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Actifs</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {audience._count?.campaigns || 0}
                    </p>
                    <p className="text-xs text-gray-500">Campagnes</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
