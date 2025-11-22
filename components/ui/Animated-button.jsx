"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Bouton avec animations avancées et micro-interactions
 * Compatible React 19 et Framer Motion 11.15
 */
export function AnimatedButton({ 
  children, 
  className,
  variant = "primary",
  size = "default",
  loading = false,
  disabled = false,
  ripple = true,
  ...props 
}) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30",
    secondary: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30",
    outline: "border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <motion.button
      className={cn(
        "relative inline-flex items-center justify-center",
        "rounded-lg font-medium",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "overflow-hidden",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      {...props}
    >
      {/* Effet de brillance au survol */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {/* Contenu */}
      <span className="relative z-10 flex items-center gap-2">
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {children}
      </span>
      
      {/* Effet ripple */}
      {ripple && !disabled && (
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          <span className="ripple" />
        </span>
      )}
    </motion.button>
  );
}

/**
 * Bouton avec effet magnétique
 */
export function MagneticButton({ children, className, strength = 20, ...props }) {
  return (
    <motion.button
      className={cn(
        "relative px-6 py-3 rounded-lg font-medium",
        "bg-gradient-to-r from-blue-600 to-purple-600",
        "text-white shadow-lg",
        "transition-shadow duration-300",
        "hover:shadow-xl hover:shadow-blue-500/50",
        className
      )}
      whileHover="hover"
      variants={{
        hover: {
          scale: 1.05,
        }
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Bouton avec effet néomorphique
 */
export function NeumorphicButton({ children, className, ...props }) {
  return (
    <motion.button
      className={cn(
        "px-6 py-3 rounded-xl font-medium",
        "bg-slate-100 dark:bg-slate-800",
        "text-slate-900 dark:text-slate-100",
        "shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]",
        "dark:shadow-[6px_6px_12px_#0f172a,-6px_-6px_12px_#1e293b]",
        "transition-all duration-300",
        className
      )}
      whileHover={{ 
        boxShadow: "inset 6px 6px 12px #b8b9be, inset -6px -6px 12px #ffffff"
      }}
      whileTap={{ 
        boxShadow: "inset 4px 4px 8px #b8b9be, inset -4px -4px 8px #ffffff"
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Groupe de boutons animés
 */
export function AnimatedButtonGroup({ children, className }) {
  return (
    <motion.div
      className={cn("inline-flex gap-2", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}
