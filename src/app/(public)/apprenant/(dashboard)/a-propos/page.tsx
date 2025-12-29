"use client";

import React, { useState, useEffect } from "react";
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
  Users,
  Accessibility,
  GraduationCap,
  UserCircle,
} from "lucide-react";
import Image from "next/image";

// Types pour l'organigramme
interface OrganigrammePoste {
  id: string;
  type: "DIRIGEANT" | "REFERENT_HANDICAP" | "REFERENT_PEDAGOGIQUE" | "REFERENT_QUALITE" | "FORMATEUR" | "ADMINISTRATIF" | "AUTRE";
  titre: string;
  nom: string;
  prenom: string;
  email?: string | null;
  telephone?: string | null;
  photo?: string | null;
  description?: string | null;
  niveau: number;
  ordre: number;
  parentId?: string | null;
}

// Couleurs et gradients par type de poste
const POSTE_STYLES: Record<OrganigrammePoste["type"], { bg: string; text: string; gradient: string; icon: React.ReactNode }> = {
  DIRIGEANT: { bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", gradient: "from-purple-500 to-purple-600", icon: <UserCircle className="w-4 h-4" /> },
  REFERENT_HANDICAP: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", gradient: "from-blue-500 to-blue-600", icon: <Accessibility className="w-4 h-4" /> },
  REFERENT_PEDAGOGIQUE: { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", gradient: "from-green-500 to-green-600", icon: <GraduationCap className="w-4 h-4" /> },
  REFERENT_QUALITE: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", gradient: "from-amber-500 to-amber-600", icon: <Award className="w-4 h-4" /> },
  FORMATEUR: { bg: "bg-cyan-50 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", gradient: "from-cyan-500 to-cyan-600", icon: <GraduationCap className="w-4 h-4" /> },
  ADMINISTRATIF: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", gradient: "from-gray-500 to-gray-600", icon: <Users className="w-4 h-4" /> },
  AUTRE: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", gradient: "from-slate-500 to-slate-600", icon: <Users className="w-4 h-4" /> },
};

const POSTE_LABELS: Record<OrganigrammePoste["type"], string> = {
  DIRIGEANT: "Dirigeant",
  REFERENT_HANDICAP: "Referent Handicap",
  REFERENT_PEDAGOGIQUE: "Referent Pedagogique",
  REFERENT_QUALITE: "Referent Qualite",
  FORMATEUR: "Formateur",
  ADMINISTRATIF: "Administratif",
  AUTRE: "Equipe",
};

// Composant carte de poste pyramidale
function PyramidPosteCard({ poste, index }: { poste: OrganigrammePoste; index: number }) {
  const style = POSTE_STYLES[poste.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative overflow-hidden rounded-2xl border-2 border-white/50 dark:border-gray-700/50 ${style.bg} shadow-lg hover:shadow-xl transition-all duration-300 min-w-[160px] max-w-[200px]`}
    >
      {/* Gradient header */}
      <div className={`h-1.5 bg-gradient-to-r ${style.gradient}`} />

      {/* Contenu */}
      <div className="p-4">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${style.gradient} text-white shadow-lg ring-3 ring-white dark:ring-gray-800`}>
            {poste.photo ? (
              <Image
                src={poste.photo}
                alt={`${poste.prenom} ${poste.nom}`}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold">
                {poste.prenom.charAt(0)}{poste.nom.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Badge type */}
        <div className="flex justify-center mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide bg-white dark:bg-gray-800 ${style.text} shadow-sm`}>
            {style.icon}
            {POSTE_LABELS[poste.type]}
          </span>
        </div>

        {/* Nom */}
        <h4 className="text-center font-bold text-gray-900 dark:text-white text-sm">
          {poste.prenom} {poste.nom}
        </h4>
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {poste.titre}
        </p>

        {/* Contact */}
        {poste.email && (
          <a
            href={`mailto:${poste.email}`}
            className="text-center text-[10px] text-brand-600 dark:text-brand-400 hover:underline mt-2 block truncate"
          >
            {poste.email}
          </a>
        )}
      </div>
    </motion.div>
  );
}

// =====================================
// PAGE PRINCIPALE
// =====================================

export default function AProposPage() {
  const { organization, selectedInscription } = useApprenantPortal();
  const [organigramme, setOrganigramme] = useState<OrganigrammePoste[]>([]);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);

  // Charger l'organigramme
  useEffect(() => {
    const loadOrganigramme = async () => {
      if (!organization?.id) return;

      try {
        const response = await fetch(`/api/public/organigramme?organizationId=${organization.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrganigramme(data.flatPostes || []);
        }
      } catch (error) {
        console.error("Erreur chargement organigramme:", error);
      } finally {
        setIsLoadingOrg(false);
      }
    };

    loadOrganigramme();
  }, [organization?.id]);

  // Organiser par niveau pour la pyramide
  const postesByLevel = organigramme.reduce((acc, poste) => {
    const level = poste.niveau || 0;
    if (!acc[level]) acc[level] = [];
    acc[level].push(poste);
    return acc;
  }, {} as Record<number, OrganigrammePoste[]>);

  const levels = Object.keys(postesByLevel).map(Number).sort((a, b) => a - b);

  const LEVEL_LABELS = ["Direction", "Referents", "Equipe", "Support"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          A propos
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
          {/* Coordonnees */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-500" />
                Coordonnees
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
                      Numero de declaration d&apos;activite
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

      {/* Organigramme pyramidal - Qualiopi IND 9 */}
      {!isLoadingOrg && organigramme.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-500" />
              Notre equipe
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              L&apos;equipe a votre service pour votre reussite
            </p>
          </div>

          {/* Pyramide */}
          <div className="p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800">
            <div className="space-y-6">
              {levels.map((level, levelIndex) => {
                const levelPostes = postesByLevel[level].sort((a, b) => a.ordre - b.ordre);
                let cardIndex = 0;
                for (let i = 0; i < levelIndex; i++) {
                  cardIndex += postesByLevel[levels[i]]?.length || 0;
                }

                return (
                  <div key={level} className="relative">
                    {/* Connecteur vertical */}
                    {levelIndex > 0 && (
                      <div className="absolute left-1/2 -top-3 w-0.5 h-3 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500" />
                    )}

                    {/* Label du niveau */}
                    <div className="flex justify-center mb-3">
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                        {LEVEL_LABELS[level] || `Niveau ${level}`}
                      </span>
                    </div>

                    {/* Cartes du niveau */}
                    <div className="flex flex-wrap justify-center gap-4">
                      {levelPostes.map((poste, idx) => (
                        <PyramidPosteCard
                          key={poste.id}
                          poste={poste}
                          index={cardIndex + idx}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info referent handicap */}
          {organigramme.some(p => p.type === "REFERENT_HANDICAP") && (
            <div className="mx-6 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Accessibility className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Accessibilite et handicap
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Notre referent handicap est a votre disposition pour adapter votre parcours de formation
                    a vos besoins specifiques. N&apos;hesitez pas a le contacter.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Documents legaux */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-500" />
          Documents legaux
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          <a
            href="#"
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-brand-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Reglement interieur
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Consultez les regles de la formation
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
                Conditions generales
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
                Politique de confidentialite
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Protection de vos donnees
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
                Mentions legales
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Informations legales
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
