"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/app/_common/lib/utils";
import { useRef } from "react";

/**
 * Container avec parallax et animations de scroll
 * Utilise les dernières API React 19 et Framer Motion
 */
export function ParallaxContainer({ children, className, speed = 0.5 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container avec effet de révélation au scroll
 */
export function RevealContainer({ 
  children, 
  className,
  direction = "up",
  delay = 0 
}) {
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction]
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container avec effet blur progressif
 */
export function BlurFadeContainer({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container avec effet de scale progressif
 */
export function ScaleContainer({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Grid avec animation stagger
 */
export function StaggerGrid({ children, className, stagger = 0.1 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: 0.2
          }
        }
      }}
      className={cn("grid", className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Item de grid animé
 */
export function StaggerGridItem({ children, className }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
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
 * Container avec effet morphing background
 */
export function MorphingBackground({ children, className }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background morphing animé */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"
          animate={{
            background: [
              "linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))",
              "linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
              "linear-gradient(to bottom right, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))",
              "linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))"
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      {children}
    </div>
  );
}

/**
 * Container avec effet de typing révélation
 */
export function TypingReveal({ text, className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.05,
            delay: delay + index * 0.03
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}
