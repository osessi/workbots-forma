"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  FileBox,
  Settings,
  Database,
  Building2,
  Users,
  UserCheck,
  MapPin,
  Landmark,
  ChevronDown,
  Calendar,
  TrendingUp,
  GraduationCap,
  Video,
  Bot,
  ClipboardCheck,
  FileSignature,
  Globe,
  UserPlus,
  BookOpen,
} from "lucide-react";
import NotificationBell from "./NotificationBell";


type SubNavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubNavItem[];
};

const mainNavItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
    name: "Tableau de bord",
    path: "/automate",
  },
  {
    icon: <PlusCircle size={20} strokeWidth={1.5} />,
    name: "Créer une formation",
    path: "/automate/import",
  },
  {
    icon: <FolderOpen size={20} strokeWidth={1.5} />,
    name: "Mes formations",
    path: "/automate/formations",
  },
  {
    icon: <FileBox size={20} strokeWidth={1.5} />,
    name: "Mes fichiers",
    path: "/automate/files",
  },
  {
    icon: <Calendar size={20} strokeWidth={1.5} />,
    name: "Sessions",
    subItems: [
      {
        icon: <Users size={18} strokeWidth={1.5} />,
        name: "Gestion sessions",
        path: "/automate/sessions",
      },
      {
        icon: <Calendar size={18} strokeWidth={1.5} />,
        name: "Calendrier",
        path: "/automate/calendrier",
      },
      {
        icon: <ClipboardCheck size={18} strokeWidth={1.5} />,
        name: "Émargement",
        path: "/automate/calendrier?tab=emargement",
      },
      {
        icon: <FileSignature size={18} strokeWidth={1.5} />,
        name: "Signatures",
        path: "/automate/signatures",
      },
    ],
  },
  {
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
    name: "CRM Pipeline",
    path: "/automate/crm",
  },
  {
    icon: <Globe size={20} strokeWidth={1.5} />,
    name: "Catalogue",
    subItems: [
      {
        icon: <BookOpen size={18} strokeWidth={1.5} />,
        name: "Mon catalogue",
        path: "/automate/catalogue",
      },
      {
        icon: <UserPlus size={18} strokeWidth={1.5} />,
        name: "Pré-inscriptions",
        path: "/automate/pre-inscriptions",
      },
    ],
  },
  {
    icon: <GraduationCap size={20} strokeWidth={1.5} />,
    name: "LMS",
    path: "/automate/lms",
  },
  {
    icon: <Video size={20} strokeWidth={1.5} />,
    name: "Classe virtuelle",
    path: "/automate/classe-virtuelle",
  },
  {
    icon: <Bot size={20} strokeWidth={1.5} />,
    name: "Agent Qualiopi",
    path: "/automate/agent-qualiopi",
  },
  {
    icon: <Database size={20} strokeWidth={1.5} />,
    name: "Mes données",
    subItems: [
      {
        icon: <Building2 size={18} strokeWidth={1.5} />,
        name: "Entreprises",
        path: "/automate/donnees/entreprises",
      },
      {
        icon: <Users size={18} strokeWidth={1.5} />,
        name: "Apprenants",
        path: "/automate/donnees/apprenants",
      },
      {
        icon: <UserCheck size={18} strokeWidth={1.5} />,
        name: "Intervenants",
        path: "/automate/donnees/intervenants",
      },
      {
        icon: <MapPin size={18} strokeWidth={1.5} />,
        name: "Lieux",
        path: "/automate/donnees/lieux",
      },
      {
        icon: <Landmark size={18} strokeWidth={1.5} />,
        name: "Financeurs",
        path: "/automate/donnees/financeurs",
      },
    ],
  },
];

const isActiveOrChild = (path: string, pathname: string) => {
  if (path === "/automate") {
    return pathname === "/automate";
  }
  return pathname.startsWith(path);
};

const bottomNavItems: NavItem[] = [
  {
    icon: <Settings size={20} strokeWidth={1.5} />,
    name: "Paramètres",
    path: "/automate/settings",
  },
];

const AutomateSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [openSubMenu, setOpenSubMenu] = React.useState<string | null>(null);

  // Fonction améliorée pour gérer les query strings (ex: ?tab=emargement)
  const isActive = (path: string) => {
    // Séparer le chemin et les query params
    const [basePath, queryString] = path.split("?");

    // Si le pathname ne correspond pas au basePath, ce n'est pas actif
    if (!isActiveOrChild(basePath, pathname)) {
      return false;
    }

    // Si le lien a des query params, vérifier s'ils correspondent
    if (queryString) {
      const params = new URLSearchParams(queryString);
      for (const [key, value] of params.entries()) {
        if (searchParams.get(key) !== value) {
          return false;
        }
      }
      return true;
    }

    // Pour le calendrier sans tab, vérifier qu'on n'a pas ?tab=emargement
    if (basePath === "/automate/calendrier" && !queryString) {
      const tab = searchParams.get("tab");
      return !tab || tab === "calendrier";
    }

    return true;
  };

  // Vérifier si un sous-menu contient la page active
  const isSubMenuActive = (subItems: SubNavItem[]) => {
    return subItems.some((item) => {
      const [basePath] = item.path.split("?");
      return pathname.startsWith(basePath);
    });
  };

  // Toggle sous-menu
  const toggleSubMenu = (menuName: string) => {
    setOpenSubMenu(openSubMenu === menuName ? null : menuName);
  };

  // Ouvrir automatiquement le sous-menu si une page enfant est active
  React.useEffect(() => {
    mainNavItems.forEach((nav) => {
      if (nav.subItems && isSubMenuActive(nav.subItems)) {
        setOpenSubMenu(nav.name);
      }
    });
  }, [pathname]);

  const renderNavItem = (nav: NavItem, isDisabled?: boolean) => {
    // Si c'est un item avec sous-menu
    if (nav.subItems) {
      const isSubmenuOpen = openSubMenu === nav.name;
      const hasActiveChild = isSubMenuActive(nav.subItems);

      return (
        <li key={nav.name}>
          <button
            onClick={() => toggleSubMenu(nav.name)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 w-full ${
              hasActiveChild
                ? "bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800"
                : "text-gray-600 border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300 dark:text-gray-300 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:bg-gray-800 dark:hover:border-gray-600"
            } ${!isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center lg:px-3" : ""}`}
          >
            <span className={hasActiveChild ? "text-brand-500" : "text-gray-500 dark:text-gray-400"}>
              {nav.icon}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <>
                <span className="text-sm font-medium flex-1 text-left">{nav.name}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isSubmenuOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>
          {/* Sous-menu */}
          {(isExpanded || isHovered || isMobileOpen) && (
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isSubmenuOpen ? "max-h-96 mt-1" : "max-h-0"
              }`}
            >
              <ul className="pl-4 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.path}>
                    <Link
                      href={subItem.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive(subItem.path)
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className={isActive(subItem.path) ? "text-white" : "text-gray-400"}>
                        {subItem.icon}
                      </span>
                      <span className="text-sm">{subItem.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      );
    }

    // Item simple sans sous-menu
    return (
      <li key={nav.name}>
        <Link
          href={nav.path!}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
            isActive(nav.path!)
              ? "bg-brand-500 text-white border-brand-500 shadow-md"
              : isDisabled
              ? "text-gray-400 cursor-not-allowed border-transparent"
              : "text-gray-600 border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300 dark:text-gray-300 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:bg-gray-800 dark:hover:border-gray-600"
          } ${!isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center lg:px-3" : ""}`}
        >
          <span className={isActive(nav.path!) ? "text-white" : "text-gray-500 dark:text-gray-400"}>
            {nav.icon}
          </span>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="text-sm font-medium">{nav.name}</span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-40 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[260px]"
            : isHovered
            ? "w-[260px]"
            : "w-[80px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 px-4 flex items-center gap-2 ${
          !isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/automate" className="flex items-center gap-2">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <Image
              src={theme === "dark" ? "/images/logo/logo-automate-darkmode.svg" : "/images/logo/logo-automate-lightmode.svg"}
              alt="Automate"
              width={352}
              height={96}
              className="h-[96px] w-auto"
            />
          ) : (
            <Image
              src="/images/logo/icone-automate.svg"
              alt="Automate"
              width={90}
              height={90}
              className="h-[90px] w-[90px]"
            />
          )}
        </Link>
      </div>

      {/* Navigation principale */}
      <div className="flex flex-col flex-1 overflow-y-auto px-3">
        <nav className="flex-1">
          <ul className="flex flex-col gap-2">
            {mainNavItems.map((nav) => renderNavItem(nav, false))}
          </ul>
        </nav>

        {/* Navigation bas */}
        <nav className="mt-auto pb-6">
          <ul className="flex flex-col gap-2">
            {/* Notifications */}
            <li>
              <NotificationBell isExpanded={isExpanded || isHovered || isMobileOpen} />
            </li>
            {bottomNavItems.map((nav) => renderNavItem(nav, false))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AutomateSidebar;
