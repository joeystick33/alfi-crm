'use client'

/**
 * Client Portal Layout
 * 
 * Layout principal du portail client avec:
 * - Header avec logo cabinet et notifications
 * - Sidebar de navigation
 * - Footer avec informations cabinet
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientNotifications } from '@/app/_common/hooks/use-api'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  Home,
  Briefcase,
  Target,
  FileText,
  Calendar,
  MessageSquare,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

interface ClientPortalLayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/portal', label: 'Tableau de bord', icon: Home },
  { href: '/portal/patrimoine', label: 'Mon Patrimoine', icon: Briefcase },
  { href: '/portal/objectifs', label: 'Mes Objectifs', icon: Target },
  { href: '/portal/contrats', label: 'Mes Contrats', icon: FileText },
  { href: '/portal/documents', label: 'Mes Documents', icon: FileText },
  { href: '/portal/rendez-vous', label: 'Mes Rendez-vous', icon: Calendar },
  { href: '/portal/messages', label: 'Messages', icon: MessageSquare },
  { href: '/portal/profil', label: 'Mon Profil', icon: User },
]

export default function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch notifications for badge
  const { data: notificationsData } = useClientNotifications(
    user?.id || '',
    { unreadOnly: true, limit: 5 }
  )

  const unreadCount = notificationsData?.unreadCount || 0

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Skeleton className="h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo / Cabinet name */}
          <Link href="/portal" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="hidden sm:block font-semibold text-gray-900">
              Espace Client
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Link href="/portal/notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">Client</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/portal' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.href === '/portal/messages' && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Advisor contact */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Votre conseiller</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {/* Would come from API */}
                Conseiller
              </p>
              <Link
                href="/portal/messages"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Contacter <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
