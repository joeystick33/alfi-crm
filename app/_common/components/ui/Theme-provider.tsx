// @ts-nocheck
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => null,
  accentColor: "blue",
  setAccentColor: () => null,
});

/**
 * Provider de thème - Thème light uniquement
 * Compatible React 19 avec transitions fluides
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  defaultAccent = "blue",
  storageKey = "crm-theme",
  ...props
}) {
  const [theme] = useState("light"); // Force light theme
  const [accentColor, setAccentColor] = useState(defaultAccent);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedAccent = localStorage.getItem(`${storageKey}-accent`);
    if (storedAccent) setAccentColor(storedAccent);
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("light"); // Always light

    // Appliquer la couleur d'accent
    const accentColors = {
      blue: {
        primary: "59 130 246",
        primaryForeground: "255 255 255",
      },
      purple: {
        primary: "168 85 247",
        primaryForeground: "255 255 255",
      },
      emerald: {
        primary: "16 185 129",
        primaryForeground: "255 255 255",
      },
      rose: {
        primary: "244 63 94",
        primaryForeground: "255 255 255",
      },
      amber: {
        primary: "245 158 11",
        primaryForeground: "255 255 255",
      },
    };

    const colors = accentColors[accentColor] || accentColors.blue;
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);

    localStorage.setItem(`${storageKey}-accent`, accentColor);
  }, [theme, accentColor, storageKey, mounted]);

  if (!mounted) {
    return null;
  }

  const value = {
    theme,
    setTheme: () => {}, // Disabled - light theme only
    accentColor,
    setAccentColor: (color) => {
      setAccentColor(color);
    },
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

/**
 * Bouton de changement de thème avec animation
 */
export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.svg
            key="sun"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </motion.svg>
        ) : (
          <motion.svg
            key="moon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Sélecteur de couleur d'accent
 */
export function AccentColorPicker({ className }) {
  const { accentColor, setAccentColor } = useTheme();

  const colors = [
    { name: "blue", value: "bg-blue-500" },
    { name: "purple", value: "bg-purple-500" },
    { name: "emerald", value: "bg-emerald-500" },
    { name: "rose", value: "bg-rose-500" },
    { name: "amber", value: "bg-amber-500" },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {colors.map((color) => (
        <motion.button
          key={color.name}
          onClick={() => setAccentColor(color.name)}
          className={`relative h-8 w-8 rounded-full ${color.value} ${
            accentColor === color.name ? "ring-2 ring-offset-2 ring-slate-900" : ""
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {accentColor === color.name && (
            <motion.div
              layoutId="accent-indicator"
              className="absolute inset-0 rounded-full border-2 border-white"
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
