"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Composants avec effet glassmorphism avancé
 * Design moderne et sobre pour le CRM
 */

/**
 * Carte avec effet verre transparent
 */
export function GlassCard({ 
  children, 
  className,
  hover = true,
  glow = false,
  ...props 
}) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-white/70 dark:bg-slate-900/70",
        "backdrop-blur-xl backdrop-saturate-150",
        "border border-white/20 dark:border-slate-700/50",
        "shadow-xl shadow-slate-900/5 dark:shadow-black/20",
        hover && "transition-all duration-300 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-900/80",
        glow && "hover:shadow-blue-500/20",
        className
      )}
      {...props}
    >
      {/* Effet de reflet lumineux */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      {children}
    </motion.div>
  );
}

/**
 * Container principal avec glassmorphism
 */
export function GlassContainer({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl",
        "bg-gradient-to-br from-white/60 to-white/40",
        "dark:from-slate-900/60 dark:to-slate-800/40",
        "backdrop-blur-2xl backdrop-saturate-200",
        "border border-white/30 dark:border-slate-700/50",
        "shadow-2xl shadow-slate-900/10 dark:shadow-black/30",
        className
      )}
      {...props}
    >
      {/* Grille de fond subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px] rounded-2xl opacity-30 pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Panneau avec effet verre et bordure gradient
 */
export function GlassPanel({ children, className, accent = "blue", ...props }) {
  const accents = {
    blue: "from-blue-500/20 to-cyan-500/20",
    purple: "from-purple-500/20 to-pink-500/20",
    emerald: "from-emerald-500/20 to-teal-500/20",
    amber: "from-amber-500/20 to-orange-500/20",
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl overflow-hidden",
        "bg-white/60 dark:bg-slate-900/60",
        "backdrop-blur-lg backdrop-saturate-150",
        "border border-white/20 dark:border-slate-700/40",
        "shadow-lg",
        className
      )}
      {...props}
    >
      {/* Bordure gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-30 transition-opacity duration-300",
        accents[accent]
      )} />
      
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Badge avec effet verre
 */
export function GlassBadge({ children, className, variant = "default", ...props }) {
  const variants = {
    default: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    danger: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "backdrop-blur-sm border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Input avec effet verre
 */
export function GlassInput({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full px-4 py-2 rounded-lg",
        "bg-white/50 dark:bg-slate-900/50",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "text-slate-900 dark:text-slate-100",
        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

/**
 * Barre de navigation avec glassmorphism
 */
export function GlassNavbar({ children, className, ...props }) {
  return (
    <motion.nav
      className={cn(
        "sticky top-0 z-50",
        "bg-white/80 dark:bg-slate-900/80",
        "backdrop-blur-xl backdrop-saturate-150",
        "border-b border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg shadow-slate-900/5",
        className
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.nav>
  );
}

/**
 * Sidebar avec glassmorphism
 */
export function GlassSidebar({ children, className, position = "left", ...props }) {
  return (
    <motion.aside
      className={cn(
        "fixed top-0 h-full z-40",
        position === "left" ? "left-0" : "right-0",
        "bg-white/70 dark:bg-slate-900/70",
        "backdrop-blur-2xl backdrop-saturate-150",
        "border-r dark:border-slate-700/50",
        position === "right" && "border-l dark:border-slate-700/50",
        "shadow-2xl shadow-slate-900/10",
        className
      )}
      initial={{ x: position === "left" ? -300 : 300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative z-10 h-full overflow-y-auto">
        {children}
      </div>
    </motion.aside>
  );
}

/**
 * Modal avec glassmorphism
 */
export function GlassModal({ children, className, isOpen, onClose, ...props }) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Backdrop avec blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      
      {/* Modal content */}
      <motion.div
        className={cn(
          "relative max-w-2xl w-full rounded-2xl overflow-hidden",
          "bg-white/90 dark:bg-slate-900/90",
          "backdrop-blur-2xl backdrop-saturate-150",
          "border border-white/30 dark:border-slate-700/50",
          "shadow-2xl",
          className
        )}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
