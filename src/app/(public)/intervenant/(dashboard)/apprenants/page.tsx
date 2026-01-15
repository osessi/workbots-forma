"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRequireIntervenantAuth, useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  Users,
  Search,
  Mail,
  Phone,
  User,
  ChevronRight,
  Building2,
  X,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  entrepriseNom?: string;
  progression?: number;
  presenceStatus?: "present" | "absent" | "partiel" | "inconnu";
}

export default function IntervenantApprenantsPage() {
  useRequireIntervenantAuth();
  const { selectedSession, token, isLoading } = useIntervenantPortal();
  const [apprenants, setApprenants] = useState<Apprenant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApprenant, setSelectedApprenant] = useState<Apprenant | null>(null);
  const [loadingApprenants, setLoadingApprenants] = useState(false);

  // Correction 501: useCallback pour garantir la mise à jour automatique
  const fetchApprenants = useCallback(async () => {
    if (!selectedSession || !token) {
      setApprenants([]);
      return;
    }

    setLoadingApprenants(true);
    try {
      const res = await fetch(`/api/intervenant/apprenants?token=${token}&sessionId=${selectedSession.id}`);
      if (res.ok) {
        const data = await res.json();
        setApprenants(data.apprenants || []);
      } else {
        setApprenants([]);
      }
    } catch (error) {
      console.error("Erreur fetch apprenants:", error);
      setApprenants([]);
    } finally {
      setLoadingApprenants(false);
    }
  }, [selectedSession, token]);

  // Correction 501: Recharger les apprenants quand la session change
  useEffect(() => {
    fetchApprenants();
  }, [fetchApprenants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucune session sélectionnée
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Veuillez sélectionner une session pour voir la liste des apprenants.
        </p>
      </div>
    );
  }

  // Filtrer les apprenants
  const filteredApprenants = apprenants.filter(apprenant => {
    const fullName = `${apprenant.prenom} ${apprenant.nom}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           apprenant.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Correction 502: Retourne null pour les statuts inconnus (pas de badge N/A)
  const getPresenceStatusInfo = (status?: string) => {
    switch (status) {
      case "present":
        return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100 dark:bg-green-500/20", label: "Présent" };
      case "absent":
        return { icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/20", label: "Absent" };
      case "partiel":
        return { icon: Clock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20", label: "Partiel" };
      default:
        return null; // Pas de badge pour les statuts inconnus
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Apprenants
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedSession.formation.titre} - {apprenants.length} participant{apprenants.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Recherche */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un apprenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Liste des apprenants */}
      {loadingApprenants ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : filteredApprenants.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? "Aucun apprenant ne correspond à votre recherche" : "Aucun apprenant inscrit à cette session"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredApprenants.map((apprenant) => {
              const statusInfo = getPresenceStatusInfo(apprenant.presenceStatus);

              return (
                <button
                  key={apprenant.id}
                  onClick={() => setSelectedApprenant(apprenant)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {apprenant.prenom[0]}{apprenant.nom[0]}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {apprenant.prenom} {apprenant.nom}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {apprenant.email}
                    </p>
                    {apprenant.entrepriseNom && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {apprenant.entrepriseNom}
                      </p>
                    )}
                  </div>

                  {/* Correction 502: Afficher le badge uniquement si statut connu */}
                  {statusInfo && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bg}`}>
                      <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                      <span className={`text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  )}

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal détail apprenant */}
      {selectedApprenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedApprenant(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
              <button
                onClick={() => setSelectedApprenant(null)}
                className="absolute top-4 right-4 p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedApprenant.prenom[0]}{selectedApprenant.nom[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedApprenant.prenom} {selectedApprenant.nom}
                  </h3>
                  {selectedApprenant.entrepriseNom && (
                    <p className="text-emerald-100 text-sm flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {selectedApprenant.entrepriseNom}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Contact */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Contact
                </h4>
                <a
                  href={`mailto:${selectedApprenant.email}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{selectedApprenant.email}</span>
                </a>
                {selectedApprenant.telephone && (
                  <a
                    href={`tel:${selectedApprenant.telephone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{selectedApprenant.telephone}</span>
                  </a>
                )}
              </div>

              {/* Progression */}
              {selectedApprenant.progression !== undefined && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Progression
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Avancement</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedApprenant.progression}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                        style={{ width: `${selectedApprenant.progression}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedApprenant(null)}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
