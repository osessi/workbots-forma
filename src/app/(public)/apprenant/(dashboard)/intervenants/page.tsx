"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import Image from "next/image";

interface Intervenant {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  fonction: string | null;
  specialites: string[];
  bio: string | null;
  photoUrl: string | null;
  role: "formateur" | "tuteur" | "expert";
}

interface IntervenantsData {
  intervenants: Intervenant[];
}

// =====================================
// COMPOSANT INTERVENANT CARD
// =====================================

function IntervenantCard({ intervenant, index }: { intervenant: Intervenant; index: number }) {
  const getRoleBadge = () => {
    switch (intervenant.role) {
      case "formateur":
        return {
          label: "Formateur",
          class: "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400",
        };
      case "tuteur":
        return {
          label: "Tuteur",
          class: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400",
        };
      case "expert":
        return {
          label: "Expert",
          class: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
        };
      default:
        return {
          label: "Intervenant",
          class: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
        };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand-500 dark:hover:border-brand-500 transition-all"
    >
      {/* Header avec photo */}
      <div className="relative h-32 bg-gradient-to-br from-brand-400 to-brand-600">
        {/* Pattern décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Photo */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          {intervenant.photoUrl ? (
            <Image
              src={intervenant.photoUrl}
              alt={`${intervenant.prenom} ${intervenant.nom}`}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">
                {intervenant.prenom[0]}
                {intervenant.nom[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="pt-14 px-6 pb-6">
        {/* Nom et rôle */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {intervenant.prenom} {intervenant.nom}
          </h3>
          {intervenant.fonction && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {intervenant.fonction}
            </p>
          )}
          <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${roleBadge.class}`}>
            {roleBadge.label}
          </span>
        </div>

        {/* Bio */}
        {intervenant.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4 line-clamp-3">
            {intervenant.bio}
          </p>
        )}

        {/* Spécialités */}
        {intervenant.specialites && intervenant.specialites.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Spécialités
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {intervenant.specialites.map((spec, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          {intervenant.email && (
            <a
              href={`mailto:${intervenant.email}`}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="truncate">{intervenant.email}</span>
            </a>
          )}
          {intervenant.telephone && (
            <a
              href={`tel:${intervenant.telephone}`}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {intervenant.telephone}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function IntervenantsPage() {
  const { token, selectedInscription } = useApprenantPortal();
  const [data, setData] = useState<IntervenantsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntervenants = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({ token });
        if (selectedInscription?.id) {
          params.append("inscriptionId", selectedInscription.id);
        }

        const res = await fetch(`/api/apprenant/intervenants?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des intervenants");
        }

        const intervenantsData = await res.json();
        setData(intervenantsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchIntervenants();
  }, [token, selectedInscription?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des intervenants...</p>
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
          Intervenants
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Les experts qui vous accompagnent dans votre formation
        </p>
      </div>

      {/* Liste des intervenants */}
      {data?.intervenants && data.intervenants.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.intervenants.map((intervenant, index) => (
            <IntervenantCard
              key={intervenant.id}
              intervenant={intervenant}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun intervenant disponible pour le moment
          </p>
        </div>
      )}
    </div>
  );
}
