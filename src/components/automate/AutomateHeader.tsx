"use client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { useSidebar } from "@/context/SidebarContext";
import { useAutomate } from "@/context/AutomateContext";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Mail, Send, HelpCircle, Sparkles } from "lucide-react";

const AutomateHeader: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [sentEmailsCount, setSentEmailsCount] = useState(0);
  const [devEmailsCount, setDevEmailsCount] = useState(0);
  const [isDev, setIsDev] = useState(false);
  const [credits, setCredits] = useState<{ formatted: string; statusColor: "green" | "yellow" | "red" } | null>(null);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user, formations, searchQuery, setSearchQuery } = useAutomate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=1");
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.pagination?.unread || 0);
      }
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    }
  }, []);

  // Fetch sent emails count (from database)
  const fetchSentEmailsCount = useCallback(async () => {
    try {
      const res = await fetch("/api/emails?limit=1");
      const data = await res.json();
      setSentEmailsCount(data.stats?.total || 0);
    } catch (error) {
      // Silently ignore - this is just for the counter
      setSentEmailsCount(0);
    }
  }, []);

  // Fetch dev emails count (dev mode only)
  const fetchDevEmailsCount = useCallback(async () => {
    try {
      const res = await fetch("/api/dev/emails");
      if (res.ok) {
        const data = await res.json();
        setDevEmailsCount(data.emails?.length || 0);
        setIsDev(true);
      } else if (res.status === 403) {
        setIsDev(false);
      }
    } catch (error) {
      setIsDev(false);
    }
  }, []);

  // Fetch credits balance
  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits({
          formatted: data.creditsFormatted,
          statusColor: data.statusColor,
        });
      }
    } catch (error) {
      // Silently ignore - credits display is optional
    }
  }, []);

  // Load counts on mount and periodically
  useEffect(() => {
    fetchNotificationCount();
    fetchSentEmailsCount();
    fetchDevEmailsCount();
    fetchCredits();

    const interval = setInterval(() => {
      fetchNotificationCount();
      fetchSentEmailsCount();
      fetchDevEmailsCount();
      fetchCredits();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotificationCount, fetchSentEmailsCount, fetchDevEmailsCount, fetchCredits]);

  // Filter formations based on local search query
  const searchResults = localSearchQuery.length > 0
    ? formations.filter((f) =>
        f.titre.toLowerCase().includes(localSearchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // Detect platform for keyboard shortcut display (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsMac(navigator.platform?.includes("Mac") ?? false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchFocus = () => {
    setIsSearchOpen(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
    setIsSearchOpen(true);
  };

  const handleFormationClick = (id: string) => {
    setLocalSearchQuery("");
    setIsSearchOpen(false);
    router.push(`/create?id=${id}`);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/signin");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-40 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex items-center justify-between w-full px-4 py-3 lg:px-6 lg:py-4">
        {/* Left: Menu toggle */}
        <div className="flex items-center gap-4">
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 border border-gray-200 rounded-xl dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600 active:scale-[0.97] transition-all"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor"/>
              </svg>
            )}
          </button>

          {/* Search bar */}
          <div className="hidden lg:block" ref={searchRef}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <svg className="fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill=""/>
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={localSearchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Rechercher une formation..."
                className="h-11 w-[320px] rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-12 pr-20 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-600 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                  K
                </kbd>
              </span>

              {/* Search Results Dropdown */}
              {isSearchOpen && localSearchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <ul className="py-2">
                      {searchResults.map((formation) => (
                        <li key={formation.id}>
                          <button
                            onClick={() => handleFormationClick(formation.id)}
                            className="w-full px-4 py-3 text-left hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {formation.titre}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {formation.status === "complete" ? "Complète" : formation.status === "en_cours" ? "En cours" : "Brouillon"} • {formation.dateCreation}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Aucune formation trouvée pour "{localSearchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Credits + Theme toggle + User dropdown */}
        <div className="flex items-center gap-3">
          {/* Credits indicator - discret */}
          {credits && (
            <Link
              href="/settings/credits"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              title="Voir les détails des crédits"
            >
              <Sparkles className={`w-4 h-4 ${
                credits.statusColor === "green"
                  ? "text-emerald-500"
                  : credits.statusColor === "yellow"
                    ? "text-amber-500"
                    : "text-red-500"
              }`} />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {credits.formatted}
              </span>
            </Link>
          )}

          <ThemeToggleButton />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <div className="relative">
                <UserAvatar
                  src={user.avatarUrl}
                  seed={user.email}
                  alt={`${user.prenom} ${user.nom}`}
                  size="medium"
                  className="ring-2 ring-transparent hover:ring-brand-100 dark:hover:ring-brand-500/20 transition-all"
                />
                {/* Badge notification - uniquement les notifications non lues */}
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </div>
              <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 lg:block">
                {user.prenom}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800 animate-in fade-in slide-in-from-top-2 duration-200">
                <a href="/account" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50/50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors">
                  Mon compte
                </a>
                <a href="/billing" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50/50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors">
                  Facturation
                </a>
                <hr className="my-1.5 border-gray-100 dark:border-gray-700" />
                <a href="/notifications" className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50/50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors">
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </span>
                  {unreadNotifications > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </a>
                <a href="/emails" className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50/50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors">
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Emails envoyés
                  </span>
                  {sentEmailsCount > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {sentEmailsCount}
                    </span>
                  )}
                </a>
                {isDev && (
                  <a href="/dev/emails" className="flex items-center justify-between px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-colors">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Dev Emails (mémoire)
                    </span>
                    {devEmailsCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                        {devEmailsCount > 99 ? "99+" : devEmailsCount}
                      </span>
                    )}
                  </a>
                )}
                <hr className="my-1.5 border-gray-100 dark:border-gray-700" />
                <a href="/docs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50/50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  Documentation
                </a>
                <hr className="my-1.5 border-gray-100 dark:border-gray-700" />
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AutomateHeader;
