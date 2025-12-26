'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useProfile } from '@/app/_common/hooks/api/use-profile-api'
import { Bell, Plus, Eye, EyeOff, Search, User, Settings } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import { LogoutButton } from '@/app/_common/components/auth/LogoutButton'
import { useDashboardCounters } from '@/app/_common/hooks/use-api'

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
  const { data: profile } = useProfile()
  const { data: counters } = useDashboardCounters()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    : [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Utilisateur'
  const avatarSrc = profile?.avatar || null

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
    <header className="sticky top-0 z-30 h-16 border-b border-gray-100 bg-white">
      <div className="flex items-center justify-between h-full px-6">
        {/* Spacer */}
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Premium Search Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-3 h-9 px-3 w-72 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 transition-all duration-150"
          >
            <Search className="h-4 w-4 text-gray-400" />
            <span className="flex-1 text-left">Rechercher...</span>
            <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono text-gray-400">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-[18px] w-[18px] text-gray-500" />
            {counters?.tasks?.overdue && (counters.tasks.overdue > 0 || (counters.alerts?.total || 0) > 0) ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            ) : null}
          </button>

          {/* Quick Actions */}
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onOpenQuickActions} 
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </Button>

          {/* Presentation Mode Toggle */}
          <button
            onClick={onTogglePresentationMode}
            className={`p-2 rounded-lg transition-colors ${
              presentationMode 
                ? 'bg-[#7373FF]/15 text-[#7373FF]' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            title={presentationMode ? 'Désactiver mode présentation' : 'Activer mode présentation'}
          >
            {presentationMode ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Avatar
                size="md"
                variant="gradient"
                src={avatarSrc}
                name={fullName}
                ring
                ringColor="primary"
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="lg"
                      variant="gradient"
                      src={avatarSrc}
                      name={fullName}
                      ring
                      ringColor="primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {profile?.email || user?.email}
                      </p>
                    </div>
                  </div>
                  {user?.role && (
                    <Badge variant="default" size="xs" className="mt-3">
                      {user.role}
                    </Badge>
                  )}
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      router.push('/dashboard/profil')
                      setShowUserMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Mon profil
                  </button>
                  <button
                    onClick={() => {
                      router.push('/dashboard/parametres')
                      setShowUserMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Paramètres
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 p-2">
                  <LogoutButton
                    variant="ghost"
                    size="sm"
                    showIcon={true}
                    showText={true}
                    className="w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                    callbackUrl="/login"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
