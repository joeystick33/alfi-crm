'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/app/_common/lib/utils'
import { useDashboardCounters } from '@/app/_common/hooks/use-api'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  Calendar,
  X,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiCall } from '@/app/_common/lib/api-client'

interface ServicesSidebarProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function ServicesSidebar({ expanded, onExpandedChange }: ServicesSidebarProps) {
  const { data: counters } = useDashboardCounters()
  const [activities, setActivities] = useState<any[]>([])

  // Load recent activity feed
  useEffect(() => {
    let cancelled = false
    async function loadActivities() {
      try {
        const data = await apiCall('/api/advisor/activity?limit=10')
        // @ts-ignore
        const list = (data && (data.activities || data.data?.activities)) || []
        if (!cancelled) {
          setActivities(Array.isArray(list) ? list : [])
        }
      } catch (e) {
        if (!cancelled) setActivities([])
      }
    }
    loadActivities()
    return () => { cancelled = true }
  }, [])

  const hasAlerts = (counters?.alerts?.total || 0) > 0
  const hasTasks = (counters?.tasks?.today || 0) > 0
  const hasOverdue = (counters?.tasks?.overdue || 0) > 0

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 320 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col border-l border-slate-200 bg-white shadow-xl z-20 h-full"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-slate-100">
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 w-full"
            >
              <div className="p-2 bg-indigo-50 rounded-lg">
                <LayoutDashboard className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Tableau de bord</h2>

              {/* Close Button */}
              <button
                onClick={() => onExpandedChange(false)}
                className="ml-auto p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Fermer le panneau"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onExpandedChange(true)}
              className="w-full flex justify-center p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-400 hover:text-indigo-600"
              title="Ouvrir le panneau"
            >
              <LayoutDashboard className="h-6 w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.1 }}
              className="p-5 space-y-6"
            >
              {/* Quick Actions */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Actions Rapides</h3>
                <div className="grid grid-cols-3 gap-3">
                  <QuickActionButton icon={Plus} label="Client" color="text-indigo-600" bg="bg-indigo-50" />
                  <QuickActionButton icon={FileText} label="Dossier" color="text-blue-600" bg="bg-blue-50" />
                  <QuickActionButton icon={Calendar} label="RDV" color="text-violet-600" bg="bg-violet-50" />
                </div>
              </div>

              {/* Status Widgets */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">État du jour</h3>

                {/* Alerts */}
                <div className="group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Alertes</span>
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">
                      {counters?.alerts?.total || 0}
                    </span>
                  </div>
                  {(counters?.alerts?.total || 0) > 0 ? (
                    <div className="space-y-2 pl-11">
                      <MiniStat label="KYC expité" value={counters?.alerts?.kycExpiring} />
                      <MiniStat label="Contrats" value={counters?.alerts?.contractsRenewing} />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 pl-11">Aucune alerte</p>
                  )}
                </div>

                {/* Tasks */}
                <div className="group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Aujourd'hui</span>
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-100 px-1.5 text-[10px] font-bold text-sky-700">
                      {counters?.tasks?.today || 0}
                    </span>
                  </div>
                  <div className="space-y-2 pl-11">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Tâches prévues</span>
                      <span className="text-xs font-bold text-slate-700">{counters?.tasks?.today || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Rendez-vous</span>
                      <span className="text-xs font-bold text-slate-700">{counters?.appointments?.today || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Overdue */}
                {hasOverdue && (
                  <div className="group p-4 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-rose-900">En Retard</p>
                        <p className="text-[10px] text-rose-600 font-medium">{counters?.tasks?.overdue} tâches urgentes</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Feed */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Activité</h3>
                  <button className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                    Voir tout
                  </button>
                </div>
                <div className="relative border-l border-slate-100 ml-3 space-y-6 pb-2">
                  {activities.length === 0 ? (
                    <div className="pl-6 py-2">
                      <p className="text-xs text-slate-400 italic">Aucune activité récente.</p>
                    </div>
                  ) : (
                    activities.map((activity, idx) => {
                      const { icon: Icon, color } = getActivityIcon(activity.type)
                      const time = formatRelativeTime(activity.createdAt)
                      return (
                        <div key={activity.id} className="relative pl-6">
                          <div className={cn("absolute -left-1.5 top-0 h-3 w-3 rounded-full border-2 border-white ring-1 ring-slate-100", color.replace('text-', 'bg-'))} />
                          <div>
                            <p className="text-xs font-medium text-slate-700 leading-tight mb-0.5">{activity?.title}</p>
                            <p className="text-[10px] text-slate-400 mb-1 line-clamp-1">{activity?.clientName}</p>
                            <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-wide">{time}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            /* Collapsed Dock Mode */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <DockIcon icon={Plus} label="Nouveau" />
              <div className="w-8 h-px bg-slate-100" />
              <DockIcon icon={AlertTriangle} label="Alertes" count={counters?.alerts?.total} alert />
              <DockIcon icon={Clock} label="Aujourd'hui" count={counters?.tasks?.today} info />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

/* --- Optimized Sub-components --- */

function QuickActionButton({ icon: Icon, label, color, bg }: any) {
  return (
    <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200 group">
      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700">{label}</span>
    </button>
  )
}

function MiniStat({ label, value }: any) {
  if (!value) return null
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-700 tabular-nums">{value}</span>
    </div>
  )
}

function DockIcon({ icon: Icon, label, count, alert, info }: any) {
  return (
    <button
      className="relative group p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
      title={label}
    >
      <Icon className="h-5 w-5" />
      {count > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm ring-2 ring-white",
          alert ? "bg-amber-500" : "bg-sky-500"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'CLIENT_CREATED':
    case 'MEETING_HELD':
      return { icon: CheckCircle2, color: 'text-green-500' }
    case 'DOCUMENT_SIGNED':
    case 'KYC_UPDATED':
      return { icon: FileText, color: 'text-blue-500' }
    case 'CONTRACT_SIGNED':
    case 'OPPORTUNITY_CONVERTED':
      return { icon: TrendingUp, color: 'text-emerald-500' }
    default:
      return { icon: Clock, color: 'text-slate-500' }
  }
}

function formatRelativeTime(date: string | Date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return "à l'instant"
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `il y a ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'hier'
  if (diffDays < 7) return `il y a ${diffDays} j`

  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}
