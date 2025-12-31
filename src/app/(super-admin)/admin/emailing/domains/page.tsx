"use client";

// ===========================================
// PAGE SUPER ADMIN - Gestion des domaines email
// ===========================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Globe, Search, RefreshCw, MoreVertical,
  Check, X, AlertTriangle, Trash2, Shield, Clock, Copy
} from "lucide-react";

interface Domain {
  id: string;
  domain: string;
  status: string;
  dkimVerified: boolean;
  spfVerified: boolean;
  dmarcVerified: boolean;
  dkimRecord: string | null;
  spfRecord: string | null;
  dmarcRecord: string | null;
  verifiedAt: string | null;
  createdAt: string;
  organization?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  VERIFIED: { label: "Vérifié", color: "bg-green-100 text-green-700", icon: Check },
  FAILED: { label: "Échec", color: "bg-red-100 text-red-700", icon: X },
};

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emailing/settings/domains?global=true");
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) return;
    try {
      setAdding(true);
      const res = await fetch("/api/emailing/settings/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      if (res.ok) {
        setNewDomain("");
        setShowAddModal(false);
        fetchDomains();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setAdding(false);
    }
  };

  const verifyDomain = async (id: string) => {
    try {
      setVerifying(id);
      const res = await fetch(`/api/emailing/settings/domains/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchDomains();
        if (data.verified) {
          alert("Domaine vérifié avec succès !");
        } else {
          alert("Vérification en cours... Assurez-vous que les enregistrements DNS sont bien configurés.");
        }
      } else {
        alert(data.error || "Erreur lors de la vérification");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setVerifying(null);
    }
  };

  const deleteDomain = async (id: string) => {
    if (!confirm("Supprimer ce domaine ?")) return;
    try {
      await fetch(`/api/emailing/settings/domains/${id}`, { method: "DELETE" });
      fetchDomains();
    } catch (error) {
      console.error("Erreur:", error);
    }
    setOpenMenuId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papiers !");
  };

  const filteredDomains = domains.filter((d) =>
    !search || d.domain.toLowerCase().includes(search.toLowerCase())
  );

  const verifiedCount = domains.filter((d) => d.status === "VERIFIED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/emailing/settings"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Globe className="w-7 h-7 text-cyan-500" />
            Domaines d&apos;envoi
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {verifiedCount}/{domains.length} domaines vérifiés
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Ajouter un domaine
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un domaine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={fetchDomains}
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
      ) : filteredDomains.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Aucun domaine configuré</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-brand-600 hover:underline"
          >
            Ajouter votre premier domaine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDomains.map((domain) => {
            const statusConfig = STATUS_CONFIG[domain.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusConfig.icon;
            const allVerified = domain.dkimVerified && domain.spfVerified && domain.dmarcVerified;

            return (
              <div
                key={domain.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      allVerified
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-amber-100 dark:bg-amber-900/30"
                    }`}>
                      <Globe className={`w-6 h-6 ${
                        allVerified ? "text-green-600" : "text-amber-600"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {domain.domain}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {domain.organization?.name || "Global"} ·
                        Ajouté le {new Date(domain.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === domain.id ? null : domain.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {openMenuId === domain.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                          <button
                            onClick={() => {
                              verifyDomain(domain.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Vérifier
                          </button>
                          <button
                            onClick={() => deleteDomain(domain.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status des enregistrements */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${
                    domain.dkimVerified
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-gray-50 dark:bg-gray-700/50"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">DKIM</span>
                      {domain.dkimVerified ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Signature des emails</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    domain.spfVerified
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-gray-50 dark:bg-gray-700/50"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">SPF</span>
                      {domain.spfVerified ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Autorisation d&apos;envoi</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    domain.dmarcVerified
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-gray-50 dark:bg-gray-700/50"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">DMARC</span>
                      {domain.dmarcVerified ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Protection anti-spoofing</p>
                  </div>
                </div>

                {/* Enregistrements DNS à configurer */}
                {domain.status === "PENDING" && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Enregistrements DNS à configurer :
                    </p>
                    <div className="space-y-2">
                      {domain.dkimRecord && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                            DKIM: {domain.dkimRecord}
                          </code>
                          <button
                            onClick={() => copyToClipboard(domain.dkimRecord!)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      )}
                      {domain.spfRecord && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                            SPF: {domain.spfRecord}
                          </code>
                          <button
                            onClick={() => copyToClipboard(domain.spfRecord!)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => verifyDomain(domain.id)}
                      disabled={verifying === domain.id}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                    >
                      {verifying === domain.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      Vérifier les enregistrements
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ajout domaine */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Ajouter un domaine
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Entrez le domaine que vous souhaitez utiliser pour envoyer des emails.
            </p>
            <input
              type="text"
              placeholder="exemple.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={addDomain}
                disabled={adding || !newDomain.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {adding && <RefreshCw className="w-4 h-4 animate-spin" />}
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
        <p className="text-sm text-cyan-800 dark:text-cyan-200">
          <strong>Configuration DNS :</strong> Pour vérifier un domaine, vous devez ajouter les enregistrements
          DKIM, SPF et DMARC dans la zone DNS de votre domaine. Ces enregistrements garantissent
          que vos emails ne finissent pas en spam.
        </p>
      </div>
    </div>
  );
}
