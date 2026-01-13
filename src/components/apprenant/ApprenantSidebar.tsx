"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useApprenantPortal } from "@/context/ApprenantPortalContext";
import {
  Home,
  BookOpen,
  Users,
  PenLine,
  Star,
  FileText,
  Info,
  Calendar,
  UserCircle,
  Award,
  X,
  Send,
  Loader2,
  MessageCircle,
  MessageSquare,
  ChevronDown,
  Check,
  GraduationCap,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  section?: "main" | "secondary";
}

interface ApprenantSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function ApprenantSidebar({
  isMobileOpen,
  onClose,
}: ApprenantSidebarProps) {
  const pathname = usePathname();
  // Correction 430: Ajout sessions et selectSession
  const { dashboardStats, apprenant, organization, token, sessions, selectedSession, selectSession } = useApprenantPortal();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubject, setContactSubject] = useState("question");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  // Correction 430: État pour le sélecteur de session
  const [isSessionSelectorOpen, setIsSessionSelectorOpen] = useState(false);

  const handleSendMessage = async () => {
    if (!contactMessage.trim() || !token) return;

    setSendingMessage(true);
    try {
      const res = await fetch("/api/apprenant/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          subject: contactSubject,
          message: contactMessage,
        }),
      });

      if (res.ok) {
        setMessageSent(true);
        setContactMessage("");
        setTimeout(() => {
          setShowContactModal(false);
          setMessageSent(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const navItems: NavItem[] = [
    // Section principale
    {
      name: "Accueil",
      href: "/apprenant/accueil",
      icon: Home,
      section: "main",
    },
    {
      name: "Suivi pédagogique",
      href: "/apprenant/suivi",
      icon: MessageSquare, // Correction 431: Changé en icône message
      badge: dashboardStats?.messagesIntervenantNonLus || 0, // Correction 431
      section: "main",
    },
    {
      name: "Programme",
      href: "/apprenant/programme",
      icon: BookOpen,
      section: "main",
    },
    {
      name: "Apprenants",
      href: "/apprenant/groupe",
      icon: Users,
      section: "main",
    },
    {
      name: "Émargements",
      href: "/apprenant/emargements",
      icon: PenLine,
      badge: dashboardStats?.emargementsEnAttente || 0,
      section: "main",
    },
    {
      name: "Évaluations",
      href: "/apprenant/evaluations",
      icon: Star,
      badge: dashboardStats?.evaluationsEnAttente || 0,
      section: "main",
    },
    {
      name: "Documents",
      href: "/apprenant/documents",
      icon: FileText,
      badge: dashboardStats?.documentsDisponibles || 0,
      section: "main",
    },
    {
      name: "Messagerie",
      href: "/apprenant/messages",
      icon: MessageSquare,
      badge: dashboardStats?.messagesNonLus || 0,
      section: "main",
    },
    {
      name: "À propos",
      href: "/apprenant/a-propos",
      icon: Info,
      section: "main",
    },
    // Section secondaire (Ressources)
    {
      name: "Calendrier",
      href: "/apprenant/calendrier",
      icon: Calendar,
      section: "secondary",
    },
    {
      name: "Intervenants",
      href: "/apprenant/intervenants",
      icon: UserCircle,
      section: "secondary",
    },
    {
      name: "Certifications",
      href: "/apprenant/certifications",
      icon: Award,
      section: "secondary",
    },
  ];

  const mainNavItems = navItems.filter((item) => item.section === "main");
  const secondaryNavItems = navItems.filter((item) => item.section === "secondary");

  const isActive = (href: string) => {
    if (href === "/apprenant/accueil") {
      return pathname === "/apprenant/accueil";
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
          active
            ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 ${
            active
              ? "text-white"
              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          }`}
        />
        <span className="flex-1 text-sm font-medium">{item.name}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full ${
              active
                ? "bg-white/20 text-white"
                : "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
            }`}
          >
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  // Correction 430: Formater l'affichage de la session
  const formatSessionDisplay = (session: typeof selectedSession): { titre: string; dates: string } => {
    if (!session) return { titre: "", dates: "" };
    const formationTitre = session.formation.titre;
    const dates = session.dateDebut && session.dateFin
      ? `${new Date(session.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${new Date(session.dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
      : "";
    return { titre: formationTitre, dates };
  };

  // Correction 430: Handler pour sélectionner une session
  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    setIsSessionSelectorOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Correction 430: Sélecteur de session */}
      {sessions.length > 0 && (
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <button
              onClick={() => setIsSessionSelectorOpen(!isSessionSelectorOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 border border-brand-200 dark:border-brand-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
            >
              {selectedSession?.formation.image ? (
                <Image
                  src={selectedSession.formation.image}
                  alt={selectedSession.formation.titre}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedSession ? formatSessionDisplay(selectedSession).titre : "Sélectionner"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selectedSession ? formatSessionDisplay(selectedSession).dates : "une session"}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                  isSessionSelectorOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown des sessions */}
            {isSessionSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                    Vos sessions ({sessions.length})
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {sessions.map((session) => {
                    const display = formatSessionDisplay(session);
                    return (
                      <button
                        key={session.participationId}
                        onClick={() => handleSelectSession(session.sessionId)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                          selectedSession?.sessionId === session.sessionId
                            ? "bg-brand-50 dark:bg-brand-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        {session.formation.image ? (
                          <Image
                            src={session.formation.image}
                            alt={session.formation.titre}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {display.titre}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {display.dates || session.reference}
                          </p>
                        </div>
                        {selectedSession?.sessionId === session.sessionId && (
                          <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Section principale */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Séparateur */}
        <div className="pt-4 pb-2">
          <div className="border-t border-gray-200 dark:border-gray-700" />
        </div>

        {/* Section secondaire */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Ressources
          </p>
          {secondaryNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer sidebar - Aide */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-600/10 rounded-xl p-4">
          <p className="text-sm font-medium text-brand-900 dark:text-brand-100 mb-1">
            Besoin d&apos;aide ?
          </p>
          <p className="text-xs text-brand-700 dark:text-brand-300 mb-3">
            Contactez votre formateur ou notre équipe support.
          </p>
          <button
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            Nous contacter
          </button>
        </div>
      </div>
    </div>
  );

  // Modal de contact
  const contactModal = showContactModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !sendingMessage && setShowContactModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contacter le support
          </h3>
          <button
            onClick={() => !sendingMessage && setShowContactModal(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {messageSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Message envoyé !
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nous vous répondrons dans les plus brefs délais.
              </p>
            </div>
          ) : (
            <>
              {/* Info apprenant */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  De la part de
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {apprenant?.prenom} {apprenant?.nom}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {apprenant?.email}
                </p>
              </div>

              {/* Sujet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sujet
                </label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="question">Question générale</option>
                  <option value="technique">Problème technique</option>
                  <option value="formation">Question sur ma formation</option>
                  <option value="document">Demande de document</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Décrivez votre demande..."
                  rows={4}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!messageSent && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowContactModal(false)}
              disabled={sendingMessage}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!contactMessage.trim() || sendingMessage}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile - Overlay */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar mobile */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 lg:hidden animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Modal de contact */}
      {contactModal}
    </>
  );
}
