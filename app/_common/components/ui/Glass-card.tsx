"use client";

import { motion } from "framer-motion";
import { cn } from "@/app/_common/lib/utils";

/**
 * Composants cards avec design solid light
 * Version sans glassmorphism pour le CRM
 */

/**
 * Carte avec style solid
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
        "bg-white",
        "border border-gray-200",
        "shadow-lg",
        hover && "transition-all duration-300 hover:shadow-xl",
        glow && "hover:shadow-blue-100",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container principal solid
 */
export function GlassContainer({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl",
        "bg-white",
        "border border-gray-200",
        "shadow-xl",
        className
      )}
      {...props}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Panneau solid avec accent coloré
 */
export function GlassPanel({ children, className, accent = "blue", ...props }) {
  const accents = {
    blue: "border-l-blue-500",
    purple: "border-l-purple-500",
    emerald: "border-l-emerald-500",
    amber: "border-l-amber-500",
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl overflow-hidden",
        "bg-white",
        "border border-gray-200 border-l-4",
        accents[accent],
        "shadow-md hover:shadow-lg transition-shadow",
        className
      )}
      {...props}
    >
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Badge solid
 */
export function GlassBadge({ children, className, variant = "default", ...props }) {
  const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
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
 * Input solid
 */
export function GlassInput({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full px-4 py-2 rounded-lg",
        "bg-white",
        "border border-gray-300",
        "text-gray-900",
        "placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

/**
 * Barre de navigation solid
 */
export function GlassNavbar({ children, className, ...props }) {
  return (
    <motion.nav
      className={cn(
        "sticky top-0 z-50",
        "bg-white",
        "border-b border-gray-200",
        "shadow-sm",
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
 * Sidebar solid
 */
export function GlassSidebar({ children, className, position = "left", ...props }) {
  return (
    <motion.aside
      className={cn(
        "fixed top-0 h-full z-40",
        position === "left" ? "left-0" : "right-0",
        "bg-white",
        "border-r border-gray-200",
        position === "right" && "border-l border-gray-200",
        "shadow-lg",
        className
      )}
      initial={{ x: position === "left" ? -300 : 300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      <div className="relative z-10 h-full overflow-y-auto">
        {children}
      </div>
    </motion.aside>
  );
}

/**
 * Modal solid
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal content */}
      <motion.div
        className={cn(
          "relative max-w-2xl w-full rounded-2xl overflow-hidden",
          "bg-white",
          "border border-gray-200",
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
