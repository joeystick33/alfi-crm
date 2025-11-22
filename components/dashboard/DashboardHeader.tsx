'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Bell, Plus, Eye, EyeOff, Search, Calendar, ListChecks, FolderKanban, AlertTriangle, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { GlobalSearch } from './GlobalSearch'
import { LogoutButton } from '@/components/auth/LogoutButton'
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
  const { user } = useAuth()
  const { data: counters } = useDashboardCounters()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between h-full px-6">
        {/* Spacer for alignment since we removed GlobalSearch */}
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Command Palette Button - Main Search Interaction */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenCommandPalette} 
            className="gap-2 text-muted-foreground hover:text-foreground w-64 justify-between bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Rechercher...</span>
            </div>
            <kbd className="hidden md:inline-flex h-5 px-1.5 items-center gap-1 rounded border bg-white dark:bg-slate-900 text-[10px] font-mono text-muted-foreground">
              ⌘ K
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
            {counters?.tasks?.overdue && (counters.tasks.overdue > 0 || (counters.alerts?.total || 0) > 0) ? (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center animate-pulse">
                {(counters.tasks.overdue || 0) + (counters.alerts?.total || 0)}
              </span>
            ) : null}
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
            variant={presentationMode ? 'primary' : 'ghost'}
            size="sm"
            onClick={onTogglePresentationMode}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {presentationMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {presentationMode ? 'Mode Client' : 'Vue Conseiller'}
            </span>
          </Button>

          {/* User Menu */}
          <div className="relative ml-1" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="gap-2 pl-2 pr-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {user?.firstName?.[0] || 'U'}
                </span>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-card border z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-1">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user?.email}
                    </p>
                    {user?.role && (
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        {user.role}
                      </Badge>
                    )}
                    {user?.cabinetName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.cabinetName}
                      </p>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        router.push('/dashboard/profil')
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Mon profil
                    </button>
                    <button
                      onClick={() => {
                        router.push('/dashboard/parametres')
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t py-1 px-2">
                    <LogoutButton
                      variant="ghost"
                      size="sm"
                      showIcon={true}
                      showText={true}
                      className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                      callbackUrl="/login"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
