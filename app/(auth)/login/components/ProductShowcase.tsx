'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Users, Shield, TrendingUp, Bell, CheckCircle2,
  PieChart, FileText, ArrowUpRight, Search, Mail, Sparkles
} from 'lucide-react'
import { useEffect, useState } from 'react'

const SCENES = [
  {
    id: 'client',
    title: "Vue Client 360°",
    description: "Centralisez toutes les données patrimoniales. Assurance vie, immobilier, comptes titres : une vision globale instantanée.",
    color: "from-blue-500 to-indigo-600"
  },
  {
    id: 'simulation',
    title: "Simulations Expertes",
    description: "Projetez l'avenir financier de vos clients. Retraite, succession, fiscalité : des calculs précis en temps réel.",
    color: "from-indigo-500 to-purple-600"
  },
  {
    id: 'reporting',
    title: "Reporting Automatisé",
    description: "Générez des bilans patrimoniaux professionnels en un clic. Impressionnez vos clients avec des rapports clairs.",
    color: "from-purple-500 to-pink-600"
  }
]

export function ProductShowcase() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % SCENES.length)
    }, 6000) // Change scene every 6 seconds
    return () => clearInterval(timer)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    const x = (clientX / innerWidth - 0.5) * 20 // Range -10 to 10
    const y = (clientY / innerHeight - 0.5) * 20 // Range -10 to 10
    setMousePosition({ x, y })
  }

  const scene = SCENES[currentSceneIndex]

  return (
    <div
      className="relative w-full h-full bg-[#0f0f2d] overflow-hidden flex flex-col items-center justify-center p-8 border-r border-[#ffffff0d]"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Gradients with Parallax - Darker & more subtle */}
      <motion.div
        animate={{
          x: mousePosition.x * -2,
          y: mousePosition.y * -2,
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          rotate: [0, 90, 0]
        }}
        transition={{
          x: { type: "spring", stiffness: 50, damping: 20 },
          y: { type: "spring", stiffness: 50, damping: 20 },
          scale: { duration: 20, repeat: Infinity, ease: "linear" },
          opacity: { duration: 10, repeat: Infinity, ease: "linear" },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
        className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#7373FF] rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: mousePosition.x * 2,
          y: mousePosition.y * 2,
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          x: { type: "spring", stiffness: 50, damping: 20 },
          y: { type: "spring", stiffness: 50, damping: 20 },
          scale: { duration: 15, repeat: Infinity, ease: "linear" },
          opacity: { duration: 12, repeat: Infinity, ease: "linear" },
        }}
        className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-500 rounded-full blur-[120px]"
      />

      {/* 3D Perspective Container with Parallax */}
      <motion.div
        className="relative z-10 w-full max-w-xl aspect-[4/3] perspective-1000"
        animate={{
          rotateX: mousePosition.y * 0.5,
          rotateY: mousePosition.x * 0.5,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, rotateX: 10, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: -10, y: -50, scale: 0.9 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {scene.id === 'client' && <ClientScene />}
            {scene.id === 'simulation' && <SimulationScene />}
            {scene.id === 'reporting' && <ReportingScene />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Narrative Text */}
      <div className="relative z-10 mt-12 text-center max-w-md h-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <h2 className="text-3xl font-bold text-white tracking-tight">{scene.title}</h2>
            <p className="text-slate-400 text-lg leading-relaxed">{scene.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-3 mt-8">
          {SCENES.map((s, i) => (
            <div key={s.id} className="relative h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
              {i === currentSceneIndex && (
                <motion.div
                  layoutId="progress"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 6, ease: "linear" }}
                  className={`absolute inset-0 bg-gradient-to-r ${s.color}`}
                />
              )}
              {i < currentSceneIndex && (
                <div className={`absolute inset-0 bg-gradient-to-r ${s.color}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════ SCENE COMPONENTS (Dark Mode) ════════

function ClientScene() {
  return (
    <div className="w-full h-full bg-[#0b0b26] border border-[#ffffff1a] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col relative group">
      {/* Search Bar Simulation */}
      <div className="h-14 border-b border-[#ffffff0d] flex items-center px-6 gap-4 bg-[#0f0f2d]">
        <Search className="w-4 h-4 text-slate-500" />
        <div className="h-2 w-32 bg-[#ffffff0d] rounded-full" />
        <div className="flex-1" />
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffffff05] flex items-center justify-center border border-[#ffffff0d]">
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#ffffff05] flex items-center justify-center border border-[#ffffff0d]">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-3 gap-4 flex-1">
        {/* Profile Card - Main */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-1 bg-[#0f0f2d] rounded-xl p-4 border border-[#ffffff0d] shadow-sm flex flex-col items-center text-center space-y-3"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#0b0b26] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">JD</span>
            </div>
          </div>
          <div>
            <div className="h-3 w-24 bg-[#ffffff1a] rounded-full mx-auto mb-2" />
            <div className="h-2 w-16 bg-[#ffffff0d] rounded-full mx-auto" />
          </div>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Actif</span>
            <span className="px-2 py-1 rounded text-[10px] bg-[#7373FF]/10 text-[#7373FF] border border-[#7373FF]/20">VIP</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-[#0f0f2d] rounded-xl p-4 border border-[#ffffff0d] shadow-sm flex flex-col justify-between hover:border-[#7373FF]/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#ffffff05] mb-2" />
              <div className="h-2 w-12 bg-[#ffffff1a] rounded-full mb-1" />
              <div className="h-4 w-20 bg-[#ffffff0d] rounded-full" />
            </motion.div>
          ))}
        </div>

        {/* Bottom Chart */}
        <div className="col-span-3 bg-[#0f0f2d] rounded-xl p-4 border border-[#ffffff0d] shadow-sm h-24 flex items-end justify-between gap-2">
          {[30, 50, 40, 70, 50, 80, 60, 90, 75, 65, 85, 95].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: "10%" }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.8, delay: 0.5 + (i * 0.05) }}
              className="flex-1 bg-gradient-to-t from-[#7373FF]/20 to-[#7373FF] rounded-t-sm"
            />
          ))}
        </div>
      </div>

      {/* Cursor simulation */}
      <motion.div
        animate={{
          x: [20, 100, 300, 150],
          y: [20, 200, 150, 300],
          opacity: [0, 1, 1, 0]
        }}
        transition={{ duration: 5, ease: "easeInOut" }}
        className="absolute w-4 h-4 pointer-events-none z-50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#7373FF" stroke="white" strokeWidth="2" />
        </svg>
      </motion.div>
    </div>
  )
}

function SimulationScene() {
  return (
    <div className="w-full h-full bg-[#0b0b26] border border-[#ffffff1a] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-[#ffffff1a] rounded-full" />
            <div className="h-2 w-32 bg-[#ffffff0d] rounded-full" />
          </div>
          <div className="px-3 py-1 bg-[#7373FF]/10 border border-[#7373FF]/20 text-[#7373FF] rounded-full text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            IA Optimization
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center">
          {/* Circular Chart Animation */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="88" fill="none" stroke="#ffffff0d" strokeWidth="12" />
              <motion.circle
                cx="96" cy="96" r="88" fill="none" stroke="#6366f1" strokeWidth="12"
                strokeDasharray="553"
                initial={{ strokeDashoffset: 553 }}
                animate={{ strokeDashoffset: 100 }}
                transition={{ duration: 2, ease: "easeOut" }}
                strokeLinecap="round"
              />
              <motion.circle
                cx="96" cy="96" r="88" fill="none" stroke="#8b5cf6" strokeWidth="12"
                strokeDasharray="553"
                initial={{ strokeDashoffset: 553 }}
                animate={{ strokeDashoffset: 350 }}
                transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="text-3xl font-bold"
              >
                +42%
              </motion.span>
              <span className="text-xs text-slate-400">Projection</span>
            </div>
          </div>

          {/* Floating Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 20 }}
            transition={{ delay: 1.2 }}
            className="absolute right-0 top-10 bg-[#0f0f2d] p-3 rounded-lg border border-[#ffffff1a] shadow-xl"
          >
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-300">Retraite: 2,500€/mois</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: -20 }}
            transition={{ delay: 1.4 }}
            className="absolute left-0 bottom-10 bg-[#0f0f2d] p-3 rounded-lg border border-[#ffffff1a] shadow-xl"
          >
            <div className="flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-xs text-slate-300">Capital: 450k€</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ReportingScene() {
  return (
    <div className="w-full h-full bg-[#0b0b26] border border-[#ffffff1a] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col items-center justify-center relative">

      {/* Document Generation Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-48 h-64 bg-[#0f0f2d] rounded-lg shadow-2xl relative overflow-hidden border border-[#ffffff1a]"
      >
        <div className="h-full w-full p-6 flex flex-col space-y-4">
          <div className="h-4 w-24 bg-[#ffffff1a] rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-2 w-full bg-[#ffffff0d] rounded" />
            <div className="h-2 w-full bg-[#ffffff0d] rounded" />
            <div className="h-2 w-2/3 bg-[#ffffff0d] rounded" />
          </div>
          <div className="flex-1 bg-[#ffffff05] rounded-lg border border-[#ffffff0d] flex items-center justify-center">
            <PieChart className="w-12 h-12 text-slate-700" />
          </div>
        </div>

        {/* Scan effect */}
        <motion.div
          initial={{ top: "-100%" }}
          animate={{ top: "200%" }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-blue-400/20 to-transparent transform -skew-y-12"
        />

        {/* Success Check */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.5, type: "spring" }}
          className="absolute inset-0 flex items-center justify-center bg-[#0b0b26]/90"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </motion.div>
      </motion.div>

      {/* Sending Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="absolute bottom-12 flex items-center gap-2 px-4 py-2 bg-[#0f0f2d] rounded-full border border-[#ffffff1a] text-green-400 text-sm font-medium shadow-xl"
      >
        <Mail className="w-4 h-4" />
        <span>Rapport envoyé au client</span>
      </motion.div>
    </div>
  )
}
