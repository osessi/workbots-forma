"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  Users,
  Mail,
  User,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";

interface Apprenant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  entreprise: string | null;
}

interface GroupeData {
  apprenants: Apprenant[];
  formationTitre: string;
  totalApprenants: number;
}

// =====================================
// COMPOSANT APPRENANT CARD
// =====================================

function ApprenantCard({ apprenant, index, isCurrentUser }: { apprenant: Apprenant; index: number; isCurrentUser: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border ${
        isCurrentUser
          ? "border-brand-500 ring-2 ring-brand-500/20"
          : "border-gray-200 dark:border-gray-700"
      } p-4 hover:border-brand-500 dark:hover:border-brand-500 transition-all`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
          isCurrentUser
            ? "bg-gradient-to-br from-brand-500 to-brand-600"
            : "bg-gradient-to-br from-gray-400 to-gray-500"
        }`}>
          {apprenant.prenom[0]}
          {apprenant.nom[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {apprenant.prenom} {apprenant.nom}
            </h3>
            {isCurrentUser && (
              <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 rounded-full">
                Vous
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1 truncate">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{apprenant.email}</span>
            </span>
            {apprenant.entreprise && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                {apprenant.entreprise}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function GroupePage() {
  const { token, apprenant: currentApprenant, selectedInscription } = useApprenantPortal();
  const [data, setData] = useState<GroupeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupe = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
        }

        const res = await fetch(`/api/apprenant/groupe?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement du groupe");
        }

        const groupeData = await res.json();
        setData(groupeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupe();
  }, [token, selectedInscription?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du groupe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Apprenants
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Les participants de votre formation
        </p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{data?.formationTitre || "Formation"}</h2>
            <p className="text-white/80 text-sm mt-1">
              {data?.totalApprenants || 0} participant{(data?.totalApprenants || 0) > 1 ? "s" : ""} inscrit{(data?.totalApprenants || 0) > 1 ? "s" : ""}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Liste des apprenants */}
      {data?.apprenants && data.apprenants.length > 0 ? (
        <div className="grid gap-3">
          {data.apprenants.map((apprenant, index) => (
            <ApprenantCard
              key={apprenant.id}
              apprenant={apprenant}
              index={index}
              isCurrentUser={apprenant.id === currentApprenant?.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun autre participant pour le moment
          </p>
        </div>
      )}
    </div>
  );
}
