import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/premium-theme.css";
import { ThemeProvider } from "@/components/ui/Theme-provider";
import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FIN3 CRM - Gestion Patrimoniale Premium",
  description: "Plateforme moderne de gestion patrimoniale avec animations avancées et design premium",
};

export default function RootLayout({ children }) {
  // SessionProvider will handle session loading on client side
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider defaultTheme="system" defaultAccent="blue" storageKey="fin3-crm-theme">
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}