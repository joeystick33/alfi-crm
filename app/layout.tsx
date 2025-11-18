import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { Toaster } from "@/components/ui/Toaster";

// Configuration de la police Inter
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Métadonnées de l'application
export const metadata: Metadata = {
  title: {
    default: "ALFI CRM - Gestion de Patrimoine",
    template: "%s | ALFI CRM",
  },
  description: "CRM professionnel pour conseillers en gestion de patrimoine. Gérez vos clients, leur patrimoine, documents et opportunités commerciales.",
  keywords: ["CRM", "gestion de patrimoine", "conseiller financier", "patrimoine", "clients"],
  authors: [{ name: "ALFI" }],
  creator: "ALFI",
  publisher: "ALFI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "ALFI CRM - Gestion de Patrimoine",
    description: "CRM professionnel pour conseillers en gestion de patrimoine",
    type: "website",
    locale: "fr_FR",
  },
};

// Configuration du viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

/**
 * Layout racine de l'application
 * 
 * Ce layout enveloppe toutes les pages et fournit:
 * - Configuration de la police Inter
 * - Providers globaux (Session, React Query)
 * - Toaster pour les notifications
 * - Configuration HTML de base
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect pour améliorer les performances */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        {/* Provider de session pour l'authentification */}
        <SessionProvider>
          {/* Provider React Query pour la gestion du cache et des requêtes */}
          <QueryProvider>
            {/* Contenu principal de l'application */}
            <main className="relative flex min-h-screen flex-col">
              {children}
            </main>
            
            {/* Toaster pour les notifications toast */}
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
