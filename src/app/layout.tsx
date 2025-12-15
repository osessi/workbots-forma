import { Outfit } from 'next/font/google';
import './globals.css';

// Clerk sera activé quand les clés seront configurées
// import { ClerkProvider } from '@clerk/nextjs';
// import { frFR } from '@clerk/localizations';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import type { Metadata } from 'next';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Automate - Créez vos formations en quelques clics',
  description: 'Plateforme SaaS pour créer des formations professionnelles avec l\'IA',
  icons: {
    icon: '/images/logo/icone-automate.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Activer ClerkProvider quand les clés sont configurées dans .env
  // return (
  //   <ClerkProvider localization={frFR}>
  //     <html lang="fr">
  //       <body className={`${outfit.className} dark:bg-gray-900`}>
  //         <ThemeProvider>
  //           <SidebarProvider>{children}</SidebarProvider>
  //         </ThemeProvider>
  //       </body>
  //     </html>
  //   </ClerkProvider>
  // );

  return (
    <html lang="fr">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
