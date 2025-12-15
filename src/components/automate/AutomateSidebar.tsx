"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  FileBox,
  User,
  CreditCard,
  HelpCircle,
  LogOut,
} from "lucide-react";


type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
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
    path: "/automate/create",
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
];

const isActiveOrChild = (path: string, pathname: string) => {
  if (path === "/automate") {
    return pathname === "/automate";
  }
  return pathname.startsWith(path);
};

const bottomNavItems: NavItem[] = [
  {
    icon: <User size={20} strokeWidth={1.5} />,
    name: "Mon compte",
    path: "/automate/account",
  },
  {
    icon: <CreditCard size={20} strokeWidth={1.5} />,
    name: "Facturation",
    path: "/automate/billing",
  },
  {
    icon: <HelpCircle size={20} strokeWidth={1.5} />,
    name: "FAQ",
    path: "/automate/faq",
  },
];

const AutomateSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { theme } = useTheme();

  const isActive = (path: string) => isActiveOrChild(path, pathname);

  const renderNavItem = (nav: NavItem, isDisabled?: boolean) => (
    <li key={nav.name}>
      <Link
        href={nav.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
          isActive(nav.path)
            ? "bg-brand-500 text-white border-brand-500 shadow-md"
            : isDisabled
            ? "text-gray-400 cursor-not-allowed border-transparent"
            : "text-gray-600 border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300 dark:text-gray-300 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:bg-gray-800 dark:hover:border-gray-600"
        } ${!isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center lg:px-3" : ""}`}
      >
        <span className={isActive(nav.path) ? "text-white" : "text-gray-500 dark:text-gray-400"}>
          {nav.icon}
        </span>
        {(isExpanded || isHovered || isMobileOpen) && (
          <span className="text-sm font-medium">{nav.name}</span>
        )}
      </Link>
    </li>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
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
            {bottomNavItems.map((nav) => renderNavItem(nav, false))}
            <li className="mt-2">
              <button
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border w-full transition-all duration-200 text-gray-600 border-gray-200 bg-gray-50/50 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:text-gray-300 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 ${
                  !isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center lg:px-3" : ""
                }`}
              >
                <span className="text-gray-500 dark:text-gray-400 group-hover:text-red-500">
                  <LogOut size={20} strokeWidth={1.5} />
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="text-sm font-medium">Se déconnecter</span>
                )}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AutomateSidebar;
