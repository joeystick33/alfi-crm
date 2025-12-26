'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, PieChart, TrendingUp, Users, Calendar, BarChart3, Search, Bell, Monitor, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export function Hero() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0b0b26]">
      {/* Cinematic Background - "Luminous Aurora" */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#7373FF]/20 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[8s]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[10s]" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-indigo-500/15 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[6s]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7373FF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7373FF]"></span>
            </span>
            Nouvelle Version 2.0 • Luminous Midnight
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1] drop-shadow-2xl"
          >
            Le CRM qui simplifie<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7373FF] via-[#a5a5ff] to-[#7373FF] bg-size-200 animate-gradient">votre quotidien de CGP</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto font-light"
          >
            Une expérience fluide, conçue pour l'excellence.
            Gestion clients, conformité automatisée, simulation fiscale — tout en un seul endroit.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#7373FF] to-[#5c5ce6] text-white text-lg font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(115,115,255,0.4)] transition-all flex items-center justify-center gap-2 border border-white/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 text-lg font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-sm group"
            >
              Voir la démo
              <Monitor className="w-5 h-5 ml-2 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          </motion.div>
        </div>

        {/* ULTRA-REALISTIC COMPONENT SIMULATION ("Video-like") */}
        <div className="relative mx-auto max-w-6xl perspective-1000">
          <motion.div
            initial={{ rotateX: 25, y: 100, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, opacity: 1 }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.2 }}
            className="relative bg-[#0f0f2d] rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-[#ffffff1a] overflow-hidden"
          >
            {/* Window Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff0d] bg-[#0b0b26]/90 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="h-4 w-[1px] bg-[#ffffff1a] mx-2" />
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-[#ffffff05] px-3 py-1.5 rounded-full border border-[#ffffff0d]">
                  <Search className="w-3 h-3" />
                  <span>Rechercher... (Cmd+K)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500 font-medium">Aura CRM v2.0</div>
              </div>
            </div>

            <div className="grid grid-cols-12 min-h-[650px] bg-[#0b0b26]">
              {/* Sidebar Animation */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="hidden md:block col-span-2 border-r border-[#ffffff0d] bg-[#171936] p-4 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7373FF] to-[#5c5ce6] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">A</span>
                  </div>
                  <span className="text-white font-bold text-sm">Aura</span>
                </div>

                <div className="space-y-1">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }}
                    className="h-9 w-full bg-[#7373FF]/15 text-[#7373FF] rounded-lg flex items-center px-3 gap-3 border border-[#7373FF]/10"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-medium">Dashboard</span>
                  </motion.div>
                  {[Users, TrendingUp, Calendar, Users].map((Icon, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + (i * 0.1) }}
                      className="h-9 w-full text-slate-400 rounded-lg flex items-center px-3 gap-3 hover:bg-[#ffffff05] hover:text-white transition-colors cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                      <div className="h-2 w-12 bg-slate-700/30 rounded-full" />
                    </motion.div>
                  ))}
                </div>

                {/* Fake User Profile Bottom */}
                <div className="mt-auto pt-4 border-t border-[#ffffff05]">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700" />
                    <div className="space-y-1">
                      <div className="h-2 w-16 bg-slate-700 rounded-full" />
                      <div className="h-1.5 w-10 bg-slate-800 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main Content Animation */}
              <div className="col-span-12 md:col-span-10 p-8 overflow-hidden bg-[#0b0b26] relative">
                {/* Header Text */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-between items-end mb-8"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Tableau de bord</h2>
                    <p className="text-slate-400 text-sm">Aperçu en temps réel de votre cabinet.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 px-4 bg-[#7373FF] rounded-lg flex items-center text-white text-xs font-bold shadow-lg shadow-[#7373FF]/20">
                      + Nouveau client
                    </div>
                  </div>
                </motion.div>

                {/* KPI Cards Staggered */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { val: "1 240 K€", label: "Collecte (YTD)", trend: "+12%", col: "text-emerald-400" },
                    { val: "48", label: "Nouveaux clients", trend: "+8", col: "text-blue-400" },
                    { val: "128", label: "Rendez-vous", trend: "Cette sem.", col: "text-amber-400" },
                    { val: "98%", label: "Satisfaction", trend: "Top 1%", col: "text-purple-400" },
                  ].map((kpi, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1 + (i * 0.1), type: "spring" }}
                      className="bg-[#171936] p-4 rounded-xl border border-[#ffffff0d] hover:border-[#ffffff1a] transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-slate-500 font-medium uppercase">{kpi.label}</div>
                        <span className={`text-[10px] ${kpi.col} bg-white/5 px-1.5 py-0.5 rounded`}>{kpi.trend}</span>
                      </div>
                      <div className="text-xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{kpi.val}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Live Graph Drawing */}
                <div className="grid grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="col-span-2 bg-[#171936] p-6 rounded-xl border border-[#ffffff0d] h-[300px] relative overflow-hidden"
                  >
                    <h3 className="text-sm font-semibold text-white mb-6">Performance Annuelle</h3>
                    {/* SVG PATH DRAWING ANIMATION */}
                    <div className="absolute inset-x-6 bottom-6 top-20 flex items-end">
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7373FF" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#7373FF" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <motion.path
                          d="M0,150 C50,140 100,100 150,110 C200,120 250,80 300,70 C350,60 400,90 450,50 C500,10 550,40 600,20 L600,200 L0,200 Z"
                          fill="url(#chartGradient)"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 2, duration: 1 }}
                        />
                        <motion.path
                          d="M0,150 C50,140 100,100 150,110 C200,120 250,80 300,70 C350,60 400,90 450,50 C500,10 550,40 600,20"
                          fill="none"
                          stroke="#7373FF"
                          strokeWidth="3"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 1.6, duration: 2, ease: "easeInOut" }}
                        />
                      </svg>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="col-span-1 bg-[#171936] p-6 rounded-xl border border-[#ffffff0d] h-[300px]"
                  >
                    <h3 className="text-sm font-semibold text-white mb-4">Activité récente</h3>
                    <div className="space-y-4">
                      {[
                        { name: "Jean Dupont", action: "Nouveau contrat", time: "2 min" },
                        { name: "Marie Curie", action: "Document signé", time: "15 min" },
                        { name: "Pierre Martin", action: "Rendez-vous pris", time: "1h" },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 2 + (i * 0.2) }}
                          className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-white">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.action}</div>
                          </div>
                          <div className="text-[10px] text-slate-500">{item.time}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Fake Cursor Animation */}
                <motion.div
                  className="absolute z-50 w-6 h-6 pointer-events-none drop-shadow-xl"
                  initial={{ x: 800, y: 600, opacity: 0 }}
                  animate={{
                    x: [800, 400, 150, 150],
                    y: [600, 300, 100, 100],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ duration: 3, delay: 2.5, times: [0, 0.4, 0.8, 1] }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="white" stroke="#000" strokeWidth="2" />
                  </svg>
                </motion.div>

              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
