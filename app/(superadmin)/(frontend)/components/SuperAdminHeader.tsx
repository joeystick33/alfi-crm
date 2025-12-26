'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { useSuperAdminProfile } from '@/app/_common/hooks/api/use-superadmin-profile'
import { Shield, Settings, User, Bell, Search, Plus } from 'lucide-react'
import { LogoutButton } from '@/app/_common/components/auth/LogoutButton'

export function SuperAdminHeader() {
  const router = useRouter()
  const { data: profile } = useSuperAdminProfile()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : 'Super Admin'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-100 bg-white">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100">
            <Shield className="h-4 w-4 text-rose-600" />
            <span className="text-sm font-semibold text-rose-700">Administration Système</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-3 h-9 px-3 w-64 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 transition-all duration-150">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="flex-1 text-left">Rechercher...</span>
            <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono text-gray-400">⌘K</kbd>
          </button>

          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-[18px] w-[18px] text-gray-500" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <Link href="/superadmin/cabinets/create">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau</span>
            </Button>
          </Link>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <Avatar size="md" variant="gradient" src={profile?.avatar || undefined} name={fullName} ring ringColor="primary" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl bg-white border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg" variant="gradient" src={profile?.avatar || undefined} name={fullName} ring ringColor="primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{profile?.email || 'superadmin@aura.fr'}</p>
                    </div>
                  </div>
                  <Badge className="mt-3 bg-rose-100 text-rose-700">SuperAdmin</Badge>
                </div>
                <div className="p-2">
                  <button onClick={() => { router.push('/superadmin/profile'); setShowUserMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors">
                    <User className="h-4 w-4 text-gray-400" />Mon profil
                  </button>
                  <button onClick={() => { router.push('/superadmin/config'); setShowUserMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2.5 transition-colors">
                    <Settings className="h-4 w-4 text-gray-400" />Configuration
                  </button>
                </div>
                <div className="border-t border-gray-100 p-2">
                  <LogoutButton variant="ghost" size="sm" showIcon showText className="w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg" callbackUrl="/login" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
