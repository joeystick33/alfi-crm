'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LogoutButton } from './LogoutButton'

interface UserMenuProps {
  variant?: 'outline' | 'ghost' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export function UserMenu({
  variant = 'outline',
  size = 'sm',
  showName = true,
  className = '',
}: UserMenuProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showMenu])

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowMenu(!showMenu)}
        className="gap-2"
      >
        <User className="h-4 w-4" />
        {showName && (
          <span className="hidden sm:inline">
            {user?.firstName || 'Utilisateur'}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </Button>

      {showMenu && (
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
                  {session.user.role}
                </Badge>
              )}
              {user?.cabinetName && (
                <p className="text-xs text-muted-foreground mt-1">
                  {session.user.cabinetName}
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  router.push('/dashboard/profil')
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
              >
                <User className="h-4 w-4" />
                Mon profil
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard/parametres')
                  setShowMenu(false)
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
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
