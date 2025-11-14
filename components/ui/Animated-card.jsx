"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Carte animée avec effets 3D et glassmorphism avancé
 * Utilise les dernières API Framer Motion 11.15
 */
export function AnimatedCard({ 
  children, 
  className,
  hoverScale = 1.02,
  depth = 20,
  glowColor = "rgba(59, 130, 246, 0.5)",
  ...props 
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [depth, -depth]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-depth, depth]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ 
        scale: hoverScale,
        boxShadow: `0 25px 50px -12px ${glowColor}`,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={cn(
        "relative",
        "rounded-xl",
        "bg-white/80 dark:bg-slate-900/80",
        "backdrop-blur-xl backdrop-saturate-150",
        "border border-slate-200/60 dark:border-slate-700/60",
        "shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {/* Gradient overlay pour effet holographique */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Contenu */}
      <div style={{ transform: "translateZ(50px)" }}>
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Carte avec effet de shimmer/brillance
 */
export function ShimmerCard({ children, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden",
        "rounded-xl",
        "bg-gradient-to-br from-slate-50 to-slate-100/50",
        "dark:from-slate-900 dark:to-slate-800/50",
        "border border-slate-200/60 dark:border-slate-700/60",
        "shadow-lg",
        className
      )}
      {...props}
    >
      {/* Effet shimmer animé */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          translateX: ["100%", "100%", "-100%"],
          translateY: ["100%", "-100%", "-100%"]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: "linear"
        }}
      >
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      </motion.div>
      
      {children}
    </motion.div>
  );
}

/**
 * Carte avec effet de levitation
 */
export function FloatingCard({ children, className, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1] // Easing custom pour mouvement fluide
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className={cn(
        "rounded-xl",
        "bg-white/90 dark:bg-slate-900/90",
        "backdrop-blur-lg",
        "border border-slate-200/60 dark:border-slate-700/60",
        "shadow-lg hover:shadow-2xl",
        "transition-shadow duration-300",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Carte avec bordure gradient animée
 */
export function GradientBorderCard({ children, className, ...props }) {
  return (
    <div className={cn("relative p-[2px] rounded-xl overflow-hidden group", className)}>
      {/* Bordure gradient rotative */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Contenu */}
      <div className={cn(
        "relative rounded-[10px]",
        "bg-white dark:bg-slate-900",
        "backdrop-blur-xl"
      )}>
        {children}
      </div>
    </div>
  );
}

/**
 * Container pour liste animée avec stagger
 */
export function AnimatedList({ children, className, staggerDelay = 0.1 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Item de liste animé
 */
export function AnimatedListItem({ children, className, ...props }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { 
          opacity: 1, 
          x: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
