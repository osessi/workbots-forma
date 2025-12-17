"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { createBrowserClient } from "@supabase/ssr";

// Icons
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 10H6.66667M2.5 10V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H6.66667V10M2.5 10V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H6.66667V10M13.3333 10H17.5M13.3333 10V2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V10M13.3333 10V17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OrganizationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33333 17.5V4.16667C3.33333 3.24619 4.07953 2.5 5 2.5H15C15.9205 2.5 16.6667 3.24619 16.6667 4.16667V17.5M3.33333 17.5H16.6667M3.33333 17.5H1.66667M16.6667 17.5H18.3333M6.66667 5.83333H8.33333M6.66667 9.16667H8.33333M11.6667 5.83333H13.3333M11.6667 9.16667H13.3333M8.33333 17.5V13.3333C8.33333 12.8731 8.70643 12.5 9.16667 12.5H10.8333C11.2936 12.5 11.6667 12.8731 11.6667 13.3333V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.884 12.5 10 12.5H5C4.11594 12.5 3.26809 12.8512 2.64298 13.4763C2.01786 14.1014 1.66667 14.9493 1.66667 15.8333V17.5M18.3333 17.5V15.8333C18.3328 15.0948 18.087 14.3773 17.6345 13.7936C17.182 13.2099 16.5484 12.793 15.8333 12.6083M13.3333 2.60833C14.0503 2.79192 14.6858 3.20892 15.1397 3.79359C15.5935 4.37827 15.8399 5.09736 15.8399 5.8375C15.8399 6.57764 15.5935 7.29673 15.1397 7.88141C14.6858 8.46608 14.0503 8.88308 13.3333 9.06667M10.4167 5.83333C10.4167 7.67428 8.92428 9.16667 7.08333 9.16667C5.24238 9.16667 3.75 7.67428 3.75 5.83333C3.75 3.99238 5.24238 2.5 7.08333 2.5C8.92428 2.5 10.4167 3.99238 10.4167 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TemplateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6667 2.5H3.33333C2.41286 2.5 1.66667 3.24619 1.66667 4.16667V15.8333C1.66667 16.7538 2.41286 17.5 3.33333 17.5H16.6667C17.5871 17.5 18.3333 16.7538 18.3333 15.8333V4.16667C18.3333 3.24619 17.5871 2.5 16.6667 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.66667 7.5H18.3333M7.5 17.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.9167 7.08333C14.2974 7.08333 15.4167 5.96405 15.4167 4.58333C15.4167 3.20262 14.2974 2.08333 12.9167 2.08333C11.5359 2.08333 10.4167 3.20262 10.4167 4.58333C10.4167 5.96405 11.5359 7.08333 12.9167 7.08333ZM12.9167 7.08333L5.41667 14.5833M5.41667 14.5833L2.5 17.5M5.41667 14.5833L7.91667 17.0833M5.41667 14.5833L7.91667 12.0833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.1667 12.5C16.0558 12.7513 16.0227 13.0302 16.0717 13.3005C16.1207 13.5708 16.2496 13.8203 16.4417 14.0167L16.4917 14.0667C16.6467 14.2215 16.7696 14.4053 16.8534 14.6076C16.9373 14.8099 16.9805 15.0268 16.9805 15.2458C16.9805 15.4649 16.9373 15.6817 16.8534 15.8841C16.7696 16.0864 16.6467 16.2702 16.4917 16.425C16.3368 16.58 16.1531 16.7029 15.9507 16.7867C15.7484 16.8706 15.5315 16.9138 15.3125 16.9138C15.0935 16.9138 14.8766 16.8706 14.6743 16.7867C14.4719 16.7029 14.2882 16.58 14.1333 16.425L14.0833 16.375C13.8869 16.183 13.6375 16.054 13.3671 16.005C13.0968 15.956 12.818 15.9892 12.5667 16.1C12.3203 16.2056 12.1103 16.3811 11.9624 16.6046C11.8145 16.8282 11.7352 17.0902 11.7333 17.3583V17.5C11.7333 17.942 11.5577 18.366 11.2452 18.6785C10.9327 18.991 10.5087 19.1667 10.0667 19.1667C9.62464 19.1667 9.20072 18.991 8.88816 18.6785C8.5756 18.366 8.4 17.942 8.4 17.5V17.425C8.39276 17.1492 8.30433 16.8817 8.14508 16.6573C7.98584 16.4328 7.76334 16.2619 7.50667 16.1667C7.25537 16.0559 6.97652 16.0227 6.70619 16.0717C6.43586 16.1207 6.18638 16.2497 5.99 16.4417L5.94 16.4917C5.78517 16.6467 5.60137 16.7696 5.39906 16.8534C5.19675 16.9373 4.97988 16.9805 4.76083 16.9805C4.54179 16.9805 4.32492 16.9373 4.12261 16.8534C3.92029 16.7696 3.7365 16.6467 3.58167 16.4917C3.42667 16.3368 3.30377 16.1531 3.21993 15.9507C3.13608 15.7484 3.09293 15.5315 3.09293 15.3125C3.09293 15.0935 3.13608 14.8766 3.21993 14.6743C3.30377 14.4719 3.42667 14.2882 3.58167 14.1333L3.63167 14.0833C3.82373 13.8869 3.95268 13.6375 4.00167 13.3671C4.05066 13.0968 4.01748 12.818 3.90667 12.5667C3.80108 12.3203 3.62555 12.1103 3.40201 11.9624C3.17847 11.8145 2.91644 11.7352 2.64833 11.7333H2.5C2.05797 11.7333 1.63405 11.5577 1.32149 11.2452C1.00893 10.9326 0.833336 10.5087 0.833336 10.0667C0.833336 9.62464 1.00893 9.20072 1.32149 8.88816C1.63405 8.5756 2.05797 8.4 2.5 8.4H2.575C2.85084 8.39276 3.11838 8.30433 3.34278 8.14508C3.56719 7.98584 3.73806 7.76334 3.83333 7.50667C3.94414 7.25537 3.97732 6.97652 3.92833 6.70619C3.87934 6.43586 3.75039 6.18638 3.55833 5.99L3.50833 5.94C3.35333 5.78517 3.23044 5.60137 3.14659 5.39906C3.06274 5.19675 3.01959 4.97988 3.01959 4.76083C3.01959 4.54179 3.06274 4.32492 3.14659 4.12261C3.23044 3.92029 3.35333 3.7365 3.50833 3.58167C3.66317 3.42667 3.84696 3.30377 4.04928 3.21993C4.25159 3.13608 4.46846 3.09293 4.6875 3.09293C4.90655 3.09293 5.12341 3.13608 5.32573 3.21993C5.52804 3.30377 5.71184 3.42667 5.86667 3.58167L5.91667 3.63167C6.11305 3.82373 6.36253 3.95268 6.63286 4.00167C6.90319 4.05066 7.18204 4.01748 7.43333 3.90667H7.5C7.74645 3.80108 7.95642 3.62555 8.10433 3.40201C8.25224 3.17847 8.33154 2.91644 8.33333 2.64833V2.5C8.33333 2.05797 8.50893 1.63405 8.82149 1.32149C9.13405 1.00893 9.55797 0.833336 10 0.833336C10.442 0.833336 10.866 1.00893 11.1785 1.32149C11.4911 1.63405 11.6667 2.05797 11.6667 2.5V2.575C11.6685 2.84311 11.7478 3.10514 11.8957 3.32868C12.0436 3.55222 12.2536 3.72775 12.5 3.83333C12.7513 3.94414 13.0302 3.97732 13.3005 3.92833C13.5708 3.87934 13.8203 3.75039 14.0167 3.55833L14.0667 3.50833C14.2215 3.35333 14.4053 3.23044 14.6076 3.14659C14.8099 3.06274 15.0268 3.01959 15.2458 3.01959C15.4649 3.01959 15.6818 3.06274 15.8841 3.14659C16.0864 3.23044 16.2702 3.35333 16.425 3.50833C16.58 3.66317 16.7029 3.84696 16.7867 4.04928C16.8706 4.25159 16.9138 4.46846 16.9138 4.6875C16.9138 4.90655 16.8706 5.12341 16.7867 5.32573C16.7029 5.52804 16.58 5.71184 16.425 5.86667L16.375 5.91667C16.183 6.11305 16.054 6.36253 16.005 6.63286C15.956 6.90319 15.9892 7.18204 16.1 7.43333V7.5C16.2056 7.74645 16.3811 7.95642 16.6046 8.10433C16.8282 8.25224 17.0902 8.33154 17.3583 8.33333H17.5C17.942 8.33333 18.366 8.50893 18.6785 8.82149C18.991 9.13405 19.1667 9.55797 19.1667 10C19.1667 10.442 18.991 10.866 18.6785 11.1785C18.366 11.4911 17.942 11.6667 17.5 11.6667H17.425C17.1569 11.6685 16.8949 11.7478 16.6713 11.8957C16.4478 12.0436 16.2722 12.2536 16.1667 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: <DashboardIcon /> },
  { id: "organizations", label: "Organisations", href: "/admin/organizations", icon: <OrganizationIcon /> },
  { id: "users", label: "Utilisateurs", href: "/admin/users", icon: <UsersIcon /> },
  { id: "templates", label: "Templates", href: "/admin/templates", icon: <TemplateIcon /> },
  { id: "api-keys", label: "Cles API", href: "/admin/api-keys", icon: <KeyIcon /> },
  { id: "settings", label: "Configuration", href: "/admin/settings", icon: <SettingsIcon /> },
];

// Theme icons
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M10 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 10 4.2915C9.58579 4.2915 9.25 3.95572 9.25 3.5415V2.2915C9.25 1.87729 9.58579 1.5415 10 1.5415ZM10 6.79327C8.22893 6.79327 6.79317 8.22904 6.79317 10.0001C6.79317 11.7712 8.22893 13.207 10 13.207C11.7711 13.207 13.2068 11.7712 13.2068 10.0001C13.2068 8.22904 11.7711 6.79327 10 6.79327ZM5.29317 10.0001C5.29317 7.40061 7.4005 5.29327 10 5.29327C12.5995 5.29327 14.7068 7.40061 14.7068 10.0001C14.7068 12.5997 12.5995 14.707 10 14.707C7.4005 14.707 5.29317 12.5997 5.29317 10.0001ZM15.9804 5.08035C16.2733 4.78746 16.2733 4.31258 15.9804 4.01969C15.6875 3.7268 15.2127 3.7268 14.9198 4.01969L14.0359 4.90357C13.743 5.19647 13.743 5.67134 14.0359 5.96423C14.3288 6.25713 14.8036 6.25713 15.0965 5.96423L15.9804 5.08035ZM18.4568 10.0001C18.4568 10.4143 18.121 10.7501 17.7068 10.7501H16.4568C16.0426 10.7501 15.7068 10.4143 15.7068 10.0001C15.7068 9.58592 16.0426 9.25013 16.4568 9.25013H17.7068C18.121 9.25013 18.4568 9.58592 18.4568 10.0001ZM14.9198 15.9806C15.2127 16.2735 15.6875 16.2735 15.9804 15.9806C16.2733 15.6877 16.2733 15.2128 15.9804 14.9199L15.0965 14.036C14.8036 13.7431 14.3288 13.7431 14.0359 14.036C13.743 14.3289 13.743 14.8038 14.0359 15.0967L14.9198 15.9806ZM10 15.7088C10.4142 15.7088 10.75 16.0445 10.75 16.4588V17.7088C10.75 18.123 10.4142 18.4588 10 18.4588C9.58579 18.4588 9.25 18.123 9.25 17.7088V16.4588C9.25 16.0445 9.58579 15.7088 10 15.7088ZM5.96271 15.0972C6.2556 14.8043 6.2556 14.3295 5.96271 14.0366C5.66981 13.7437 5.19494 13.7437 4.90205 14.0366L4.01817 14.9204C3.72527 15.2133 3.72527 15.6882 4.01817 15.9811C4.31106 16.274 4.78594 16.274 5.07883 15.9811L5.96271 15.0972ZM4.29138 10.0001C4.29138 10.4143 3.9556 10.7501 3.54138 10.7501H2.29138C1.87717 10.7501 1.54138 10.4143 1.54138 10.0001C1.54138 9.58592 1.87717 9.25013 2.29138 9.25013H3.54138C3.9556 9.25013 4.29138 9.58592 4.29138 10.0001ZM4.90205 5.9637C5.19494 6.25659 5.66981 6.25659 5.96271 5.9637C6.2556 5.6708 6.2556 5.19593 5.96271 4.90303L5.07883 4.01915C4.78594 3.72626 4.31106 3.72626 4.01817 4.01915C3.72527 4.31204 3.72527 4.78692 4.01817 5.07981L4.90205 5.9637Z" fill="currentColor"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.4547 11.97L18.1799 12.1611C18.265 11.8383 18.1265 11.4982 17.8401 11.3266C17.5538 11.1551 17.1885 11.1934 16.944 11.4207L17.4547 11.97ZM8.0306 2.5459L8.57989 3.05657C8.80718 2.81209 8.84554 2.44682 8.67398 2.16046C8.50243 1.8741 8.16227 1.73559 7.83948 1.82066L8.0306 2.5459ZM12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524H5.49707C5.49707 11.1823 8.81835 14.5035 12.9154 14.5035V13.0035ZM16.944 11.4207C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035V14.5035C14.8657 14.5035 16.6418 13.7499 17.9654 12.5193L16.944 11.4207ZM16.7295 11.7789C15.9437 14.7607 13.2277 16.9586 10.0003 16.9586V18.4586C13.9257 18.4586 17.2249 15.7853 18.1799 12.1611L16.7295 11.7789ZM10.0003 16.9586C6.15734 16.9586 3.04199 13.8433 3.04199 10.0003H1.54199C1.54199 14.6717 5.32892 18.4586 10.0003 18.4586V16.9586ZM3.04199 10.0003C3.04199 6.77289 5.23988 4.05695 8.22173 3.27114L7.83948 1.82066C4.21532 2.77574 1.54199 6.07486 1.54199 10.0003H3.04199ZM6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657L7.48132 2.03522C6.25073 3.35885 5.49707 5.13487 5.49707 7.08524H6.99707Z" fill="currentColor"/>
  </svg>
);

// Logout Icon
const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5M13.3333 14.1667L17.5 10M17.5 10L13.3333 5.83333M17.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/admin-login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 w-64
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo - Desktop */}
        <div className="hidden lg:flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Admin</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Super Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Logo - Mobile */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-3" onClick={closeMobileMenu}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Admin</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Super Admin Panel</span>
            </div>
          </Link>
          <button
            onClick={closeMobileMenu}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-500 dark:text-orange-400 border border-orange-500/30"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className={isActive(item.href) ? "text-orange-500 dark:text-orange-400" : ""}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Separator */}
        <div className="px-4">
          <div className="border-t border-gray-200 dark:border-gray-800" />
        </div>

        {/* Bottom section */}
        <div className="px-4 py-4 space-y-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          </button>

          <Link
            href="/automate"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8333 10H4.16667M4.16667 10L9.16667 5M4.16667 10L9.16667 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Retour a l&apos;app</span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            <LogoutIcon />
            <span>{isLoggingOut ? "Deconnexion..." : "Se deconnecter"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
