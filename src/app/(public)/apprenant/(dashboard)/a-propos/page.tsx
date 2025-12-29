"use client";

import React from "react";
import { motion } from "framer-motion";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Shield,
  Award,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function AProposPage() {
  const { organization, selectedInscription } = useApprenantPortal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          À propos
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Informations sur votre organisme de formation
        </p>
      </div>

      {/* Organisation card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header avec logo */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {organization?.logoUrl ? (
              <Image
                src={organization.logoUrl}
                alt={organization.nomCommercial || organization.name}
                width={120}
                height={120}
                className="w-24 h-24 bg-white rounded-xl object-contain p-2"
              />
            ) : (
              <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="text-white">
              <h2 className="text-2xl font-bold">
                {organization?.nomCommercial || organization?.name || "Organisme de formation"}
              </h2>
              {organization?.siret && (
                <p className="text-white/80 text-sm mt-1">
                  SIRET: {organization.siret}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Coordonnées */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-500" />
                Coordonnées
              </h3>

              {organization?.adresse && (
                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{organization.adresse}</span>
                </div>
              )}

              {organization?.email && (
                <a
                  href={`mailto:${organization.email}`}
                  className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <Mail className="w-4 h-4 text-gray-400" />
                  {organization.email}
                </a>
              )}

              {organization?.telephone && (
                <a
                  href={`tel:${organization.telephone}`}
                  className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-400" />
                  {organization.telephone}
                </a>
              )}

              {organization?.siteWeb && (
                <a
                  href={organization.siteWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Visiter le site web
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-500" />
                Certifications
              </h3>

              {organization?.numeroFormateur && (
                <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <div>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                      Numéro de déclaration d&apos;activité
                    </p>
                    <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                      {organization.numeroFormateur}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Formation actuelle */}
          {selectedInscription?.formation && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Votre formation
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {selectedInscription.formation.titre}
                </h4>
                {selectedInscription.formation.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {selectedInscription.formation.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Documents légaux */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-500" />
          Documents légaux
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-brand-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Règlement intérieur
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Consultez les règles de la formation
              </p>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-brand-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Conditions générales
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CGV et conditions de formation
              </p>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-brand-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Politique de confidentialité
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Protection de vos données
              </p>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-brand-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Mentions légales
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Informations légales
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
