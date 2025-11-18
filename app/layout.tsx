import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "ALFI CRM - Gestion de Patrimoine",
  description: "CRM pour conseillers en gestion de patrimoine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
