import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/app/_common/components/providers/QueryProvider";
import { Toaster } from "@/app/_common/components/ui/Toaster";
import { ScrollProgress } from "@/app/_common/components/ui/ScrollProgress";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aura - Gestion de Patrimoine Intelligente",
  description: "La plateforme tout-en-un pour les conseillers en gestion de patrimoine modernes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aura CRM",
  },
  other: {
    "theme-color": "#0B0C15", // Deep Navy status bar
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming for native app feel
  viewportFit: "cover", // Handles notch
};

import { CommandPalette } from "@/app/_common/components/ui/CommandPalette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased font-sans bg-[hsl(var(--background))] text-[hsl(var(--foreground))] selection:bg-[hsl(var(--primary)/0.2)] selection:text-[hsl(var(--primary))]">
        <ScrollProgress />
        <QueryProvider>
          <CommandPalette />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
