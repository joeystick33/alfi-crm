'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useDashboardCounters } from '@/hooks/use-api'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react'
import Tooltip from '@/components/ui/Tooltip'

interface ServicesSidebarProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function ServicesSidebar({ expanded, onExpandedChange }: ServicesSidebarProps) {
  const { data: counters } = useDashboardCounters()
  const [showContent, setShowContent] = useState(false)

  // Delay content appearance for smooth transition
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => setShowContent(true), 150)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [expanded])

  const hasAlerts = (counters?.alerts?.total || 0) > 0
  const hasTasks = (counters?.tasks?.today || 0) > 0
  const hasOverdue = (counters?.tasks?.overdue || 0) > 0

  return (
    <aside
      className={cn(
        'flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-lg z-20',
        expanded ? 'w-80 translate-x-0' : 'w-16 translate-x-0'
      )}
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/50">
        {expanded ? (
          <div className={cn("flex items-center gap-2 transition-opacity duration-300", showContent ? "opacity-100" : "opacity-0")}>
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Tableau de bord</h2>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <LayoutDashboard className="h-5 w-5 text-slate-500" />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {expanded ? (
          <div className={cn(
            "p-4 space-y-4 transition-all duration-500 ease-out transform",
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <QuickActionButton icon={Plus} label="Client" />
              <QuickActionButton icon={FileText} label="Dossier" />
              <QuickActionButton icon={Calendar} label="RDV" />
            </div>

            {/* Alerts Widget */}
            {hasAlerts && (
              <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Alertes Prioritaires
                    <Badge variant="warning" className="ml-auto bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">
                      {counters?.alerts?.total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 pt-0">
                  {(counters?.alerts?.kycExpiring || 0) > 0 && (
                    <AlertItem label="KYC à renouveler" count={counters!.alerts.kycExpiring} />
                  )}
                  {(counters?.alerts?.contractsRenewing || 0) > 0 && (
                    <AlertItem label="Contrats à renouveler" count={counters!.alerts.contractsRenewing} />
                  )}
                  {(counters?.alerts?.documentsExpiring || 0) > 0 && (
                    <AlertItem label="Documents expirant" count={counters!.alerts.documentsExpiring} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Today's Tasks Widget */}
            {hasTasks && (
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Clock className="h-4 w-4" />
                    Aujourd'hui
                    <Badge className="ml-auto bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
                      {counters?.tasks?.today}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 pt-0">
                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                    <span className="text-slate-600 dark:text-slate-400">Tâches</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{counters?.tasks?.today}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                    <span className="text-slate-600 dark:text-slate-400">Rendez-vous</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{counters?.appointments?.today || 0}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overdue Widget */}
            {hasOverdue && (
              <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow bg-red-50/30 dark:bg-red-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    En Retard
                    <Badge variant="destructive" className="ml-auto">
                      {counters?.tasks?.overdue}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs pt-0">
                  <p className="text-red-600/80 dark:text-red-400/80">
                    Tâches nécessitant votre attention immédiate.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Activity Feed Mockup */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Activité Récente
              </h3>
              <div className="space-y-4">
                <ActivityItem 
                  icon={CheckCircle2} 
                  color="text-green-500" 
                  title="Dossier validé" 
                  desc="M. Martin a signé son contrat" 
                  time="2h" 
                />
                <ActivityItem 
                  icon={FileText} 
                  color="text-blue-500" 
                  title="Document ajouté" 
                  desc="RIB ajouté au dossier Durand" 
                  time="4h" 
                />
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Dock Mode */
          <div className="flex flex-col items-center gap-4 py-4">
            <DockIcon 
              icon={Plus} 
              label="Nouveau" 
              color="text-slate-600 hover:text-primary hover:bg-primary/10" 
            />
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
            
            <DockIcon 
              icon={AlertTriangle} 
              label="Alertes" 
              count={counters?.alerts?.total} 
              color={hasAlerts ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-slate-400"} 
            />
            
            <DockIcon 
              icon={Clock} 
              label="Aujourd'hui" 
              count={counters?.tasks?.today} 
              color={hasTasks ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-slate-400"} 
            />
            
            <DockIcon 
              icon={AlertTriangle} 
              label="Retard" 
              count={counters?.tasks?.overdue} 
              color={hasOverdue ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-slate-400"} 
            />
          </div>
        )}
      </div>
    </aside>
  )
}

/* Sub-components for cleaner code */

function QuickActionButton({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{label}</span>
    </button>
  )
}

function AlertItem({ label, count }: { label: string, count: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <Badge variant="outline" className="text-[10px] h-5 px-1.5">{count}</Badge>
    </div>
  )
}

function ActivityItem({ icon: Icon, color, title, desc, time }: any) {
  return (
    <div className="flex gap-3">
      <div className={cn("mt-0.5", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-[10px] text-slate-500 truncate">{desc}</p>
      </div>
      <span className="text-[10px] text-slate-400 whitespace-nowrap">{time}</span>
    </div>
  )
}

function DockIcon({ icon: Icon, label, count, color }: any) {
  const tooltipText = count > 0 ? `${label} (${count})` : label;
  return (
    <Tooltip content={tooltipText} position="left" delay={0} className="z-50">
      <button className={cn(
        "relative h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
        color || "text-slate-500 hover:bg-slate-100"
      )}>
        <Icon className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center border-2 border-white dark:border-gray-900">
            {count}
          </span>
        )}
      </button>
    </Tooltip>
  )
}
