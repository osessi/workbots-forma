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
  ClipboardList,
  Newspaper,
  Eye,
  MessageSquareWarning,
  TrendingUp as TrendingUpIcon,
  Workflow,
  Mail,
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
  external?: boolean;
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
        name: "Mes sessions",
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
    name: "CRM",
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
      {
        icon: <ClipboardList size={18} strokeWidth={1.5} />,
        name: "Évaluations",
        path: "/automate/catalogue/evaluations",
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
    name: "Auditeur IA",
    path: "/automate/qualiopi",
  },
  {
    icon: <Workflow size={20} strokeWidth={1.5} />,
    name: "Automatisations",
    path: "/automate/automatisations",
  },
  {
    icon: <Mail size={20} strokeWidth={1.5} />,
    name: "Emails",
    path: "/automate/emails",
  },
  {
    icon: <Newspaper size={20} strokeWidth={1.5} />,
    name: "Outils",
    subItems: [
      {
        icon: <Eye size={18} strokeWidth={1.5} />,
        name: "Veille",
        path: "/automate/outils/veille",
      },
      {
        icon: <MessageSquareWarning size={18} strokeWidth={1.5} />,
        name: "Réclamations",
        path: "/automate/outils/reclamations",
      },
      {
        icon: <TrendingUpIcon size={18} strokeWidth={1.5} />,
        name: "Améliorations",
        path: "/automate/outils/ameliorations",
      },
    ],
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

const bottomNavItems: NavItem[] = [
  {
    icon: <BookOpen size={20} strokeWidth={1.5} />,
    name: "Documentation",
    path: "/docs",
    external: true,
  },
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

    // Correspondance exacte du chemin
    const isExactMatch = pathname === basePath;

    // Vérifier si c'est un vrai sous-chemin (pas juste un préfixe)
    // Ex: /automate/catalogue/evaluations est un sous-chemin de /automate/catalogue
    // mais /automate/catalogueX n'est pas un sous-chemin de /automate/catalogue
    const isChildPath = pathname.startsWith(basePath + "/");

    // Pour les liens de sous-menu, on veut une correspondance exacte
    // sauf pour certains cas spéciaux
    if (!isExactMatch && !isChildPath) {
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
      return isExactMatch; // Pour les liens avec query params, correspondance exacte seulement
    }

    // Pour le calendrier sans tab, vérifier qu'on n'a pas ?tab=emargement
    if (basePath === "/automate/calendrier" && !queryString) {
      const tab = searchParams.get("tab");
      return !tab || tab === "calendrier";
    }

    // Pour éviter la double surbrillance: si on est sur un sous-chemin,
    // seul le sous-chemin doit être actif, pas le parent
    // Ex: sur /automate/catalogue/evaluations, /automate/catalogue ne doit pas être actif
    if (isChildPath && !isExactMatch) {
      return false;
    }

    return isExactMatch;
  };

  // Vérifier si un sous-menu contient la page active
  const isSubMenuActive = (subItems: SubNavItem[]) => {
    return subItems.some((item) => {
      const [basePath] = item.path.split("?");
      return pathname.startsWith(basePath);
    });
  };

  // Toggle sous-menu - un seul menu ouvert à la fois
  const toggleSubMenu = (menuName: string) => {
    setOpenSubMenu(openSubMenu === menuName ? null : menuName);
  };

  // Ouvrir automatiquement le sous-menu qui contient la page active
  // et fermer les autres quand on navigue
  React.useEffect(() => {
    // Trouver le menu qui contient la page active
    let activeMenu: string | null = null;
    mainNavItems.forEach((nav) => {
      if (nav.subItems && isSubMenuActive(nav.subItems)) {
        activeMenu = nav.name;
      }
    });
    // Mettre à jour le menu ouvert (ferme les autres automatiquement)
    setOpenSubMenu(activeMenu);
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
    const linkClasses = `flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
      isActive(nav.path!)
        ? "bg-brand-500 text-white border-brand-500 shadow-md"
        : isDisabled
        ? "text-gray-400 cursor-not-allowed border-transparent"
        : "text-gray-600 border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300 dark:text-gray-300 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:bg-gray-800 dark:hover:border-gray-600"
    } ${!isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center lg:px-3" : ""}`;

    const linkContent = (
      <>
        <span className={isActive(nav.path!) ? "text-white" : "text-gray-500 dark:text-gray-400"}>
          {nav.icon}
        </span>
        {(isExpanded || isHovered || isMobileOpen) && (
          <span className="text-sm font-medium">{nav.name}</span>
        )}
      </>
    );

    // Lien externe (nouvel onglet)
    if (nav.external) {
      return (
        <li key={nav.name}>
          <a
            href={nav.path!}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            {linkContent}
          </a>
        </li>
      );
    }

    // Lien interne
    return (
      <li key={nav.name}>
        <Link href={nav.path!} className={linkClasses}>
          {linkContent}
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
        className={`py-4 px-4 flex flex-col ${
          !isExpanded && !isHovered && !isMobileOpen ? "lg:items-center" : "items-center"
        }`}
      >
        <Link href="/automate" className="flex items-center gap-2">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <Image
              src={theme === "dark" ? "/logo-workbots-dark.svg" : "/logo-workbots.svg"}
              alt="Workbots"
              width={200}
              height={50}
              className="h-[70px] w-auto"
            />
          ) : (
            <Image
              src={theme === "dark" ? "/logo-workbots-dark.svg" : "/logo-workbots.svg"}
              alt="Workbots"
              width={40}
              height={40}
              className="h-[40px] w-[40px]"
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
