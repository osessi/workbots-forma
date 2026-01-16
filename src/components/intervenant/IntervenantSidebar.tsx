"use client";

// ===========================================
// CORRECTIONS 495: Sélecteur de session dans sidebar
// ===========================================
// 495: Sélecteur de session ajouté en haut du menu gauche

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useIntervenantPortal } from "@/context/IntervenantPortalContext";
import {
  Home,
  BookOpen,
  Users,
  PenLine,
  Star,
  FileText,
  Calendar,
  X,
  Send,
  Loader2,
  MessageCircle,
  ClipboardList,
  MessageSquare,
  ChevronDown,
  Check,
  Briefcase,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  section?: "main" | "secondary";
}

interface IntervenantSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function IntervenantSidebar({
  isMobileOpen,
  onClose,
}: IntervenantSidebarProps) {
  const pathname = usePathname();
  const { dashboardStats, intervenant, organization, token, sessions, selectedSession, selectSession } = useIntervenantPortal();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubject, setContactSubject] = useState("question");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [isSessionSelectorOpen, setIsSessionSelectorOpen] = useState(false);
  // Badge messages non lus
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Récupérer le nombre de réponses non lues
  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`/api/intervenant/messages/unread-count?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadMessagesCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Erreur récupération messages non lus:", error);
    }
  }, [token]);

  // Récupérer le compteur au montage et toutes les 30 secondes
  useEffect(() => {
    fetchUnreadMessagesCount();
    const interval = setInterval(fetchUnreadMessagesCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadMessagesCount]);

  // Correction 495: Fonction pour sélectionner une session
  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    setIsSessionSelectorOpen(false);
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim() || !token) return;

    setSendingMessage(true);
    try {
      const res = await fetch("/api/intervenant/contact", {
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
      name: "Tableau de bord",
      href: "/intervenant/accueil",
      icon: Home,
      section: "main",
    },
    {
      name: "Programme",
      href: "/intervenant/programme",
      icon: BookOpen,
      section: "main",
    },
    {
      name: "Apprenants",
      href: "/intervenant/apprenants",
      icon: Users,
      badge: dashboardStats?.totalApprenants || 0,
      section: "main",
    },
    {
      name: "Émargements",
      href: "/intervenant/emargements",
      icon: PenLine,
      badge: dashboardStats?.emargementsEnAttente || 0,
      section: "main",
    },
    {
      name: "Évaluations",
      href: "/intervenant/evaluations",
      icon: Star,
      badge: dashboardStats?.evaluationsACorreger || 0,
      section: "main",
    },
    {
      name: "Documents",
      href: "/intervenant/documents",
      icon: FileText,
      section: "main",
    },
    // Correction 530: Messagerie (Organisme + Apprenants)
    {
      name: "Messagerie",
      href: "/intervenant/messagerie",
      icon: MessageSquare,
      badge: unreadMessagesCount,
      section: "main",
    },
    // Section secondaire
    {
      name: "Calendrier",
      href: "/intervenant/calendrier",
      icon: Calendar,
      section: "secondary",
    },
    {
      name: "Suivi pédagogique",
      href: "/intervenant/suivi",
      icon: ClipboardList,
      section: "secondary",
    },
  ];

  const mainNavItems = navItems.filter((item) => item.section === "main");
  const secondaryNavItems = navItems.filter((item) => item.section === "secondary");

  const isActive = (href: string) => {
    if (href === "/intervenant/accueil") {
      return pathname === "/intervenant/accueil";
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
            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
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
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
            }`}
          >
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Correction 495: Sélecteur de session en haut du menu */}
      {sessions.length > 0 && (
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <button
              onClick={() => setIsSessionSelectorOpen(!isSessionSelectorOpen)}
              className="w-full flex items-center gap-3 px-3 py-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl border border-emerald-200 dark:border-emerald-500/30 transition-colors"
            >
              {selectedSession?.formation.image ? (
                <Image
                  src={selectedSession.formation.image}
                  alt={selectedSession.formation.titre}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Session sélectionnée
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {selectedSession?.formation.titre || "Sélectionner"}
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-emerald-500 flex-shrink-0 transition-transform ${
                  isSessionSelectorOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown sessions */}
            {isSessionSelectorOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">
                    Vos sessions
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                        selectedSession?.id === session.id
                          ? "bg-emerald-50 dark:bg-emerald-500/10"
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
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.formation.titre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {session.nombreApprenants} apprenant{session.nombreApprenants > 1 ? "s" : ""}
                        </p>
                      </div>
                      {selectedSession?.id === session.id && (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
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
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/10 dark:to-emerald-600/10 rounded-xl p-4">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-1">
            Besoin d&apos;aide ?
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">
            Contactez le support technique.
          </p>
          <button
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
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
            Contacter l&apos;administration
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
              {/* Info intervenant */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  De la part de
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {intervenant?.prenom} {intervenant?.nom}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {intervenant?.email}
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
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="question">Question générale</option>
                  <option value="technique">Problème technique</option>
                  <option value="session">Question sur une session</option>
                  <option value="apprenant">Question sur un apprenant</option>
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
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
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
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
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
