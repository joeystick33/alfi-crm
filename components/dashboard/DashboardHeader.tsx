'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Plus, Eye, EyeOff, Search, Calendar, ListChecks, FolderKanban, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { GlobalSearch } from './GlobalSearch'
import { QuickActions } from './QuickActions'
import { CommandPalette } from './CommandPalette'
import { NotificationCenter } from './NotificationCenter'
import { useDashboardCounters } from '@/hooks/use-api'

interface DashboardHeaderProps {
  presentationMode: boolean
  onTogglePresentationMode: () => void
  onOpenQuickActions: () => void
  onOpenCommandPalette: () => void
  onOpenNotifications: () => void
}

export function DashboardHeader({
  presentationMode,
  onTogglePresentationMode,
  onOpenQuickActions,
  onOpenCommandPalette,
  onOpenNotifications,
}: DashboardHeaderProps) {
  const router = useRouter()
  const { data: counters } = useDashboardCounters()

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-card/90 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between h-full px-6">
        {/* Global Search */}
        <div className="flex-1 max-w-xl">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-3">
          {/* Command Palette Button */}
          <Button variant="outline" size="sm" onClick={onOpenCommandPalette} className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Rechercher</span>
            <kbd className="hidden md:inline-flex h-5 px-1.5 items-center gap-1 rounded border bg-muted text-[10px] font-mono text-muted-foreground">
              Ctrl K
            </kbd>
          </Button>

          {/* Notifications Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenNotifications}
            className="gap-2 relative"
          >
            <Bell className="h-4 w-4" />
            {counters && (counters.tasks.overdue > 0 || counters.alerts.total > 0) && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center animate-pulse">
                {counters.tasks.overdue + counters.alerts.total}
              </span>
            )}
          </Button>

          {/* Quick Actions Button */}
          <Button variant="outline" size="sm" onClick={onOpenQuickActions} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau</span>
            <kbd className="hidden md:inline-flex h-5 px-1.5 items-center gap-1 rounded border bg-muted text-[10px] font-mono text-muted-foreground">
              Ctrl N
            </kbd>
          </Button>

          {/* Presentation Mode Toggle */}
          <Button
            variant={presentationMode ? 'primary' : 'outline'}
            size="sm"
            onClick={onTogglePresentationMode}
            className="gap-2"
          >
            {presentationMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {presentationMode ? 'Mode Client' : 'Mode Normal'}
            </span>
          </Button>

          {/* Quick Stats - Desktop Only */}
          <div className="hidden xl:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/dossiers')}
              className="gap-2"
            >
              <FolderKanban className="h-4 w-4" />
              <span>Dossiers</span>
              {counters && counters.tasks.overdue > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {counters.tasks.overdue}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/reclamations')}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Réclamations</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/agenda?view=today')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>RDV</span>
              {counters && counters.appointments.today > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {counters.appointments.today}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/taches')}
              className="gap-2"
            >
              <ListChecks className="h-4 w-4" />
              <span>Tâches</span>
              {counters && counters.tasks.today > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {counters.tasks.today}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
