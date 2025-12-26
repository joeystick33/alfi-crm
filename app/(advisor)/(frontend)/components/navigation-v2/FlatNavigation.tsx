'use client'

/**
 * FlatNavigation - Navigation simplifiée à 2 niveaux max
 * 
 * Structure:
 * - 5 sections principales en haut
 * - Sidebar contextuelle quand un client est sélectionné
 */

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/app/_common/lib/utils'
import { Badge } from '@/app/_common/components/ui/Badge'
import {
  LayoutDashboard,
  Users,
  Calculator,
  Calendar,
  Settings,
  ChevronDown,
  Search,
  Bell,
  User,
  Wallet,
  FileText,
  Target,
  Briefcase,
  Mail,
  CheckSquare,
  BarChart3,
  Lightbulb,
  FolderOpen,
  Building2,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: NavItem[]
}

interface FlatNavigationProps {
  currentPath: string
  clientContext?: {
    id: string
    name: string
    initials: string
  }
  badges?: Record<string, number>
  onSearch?: () => void
  onNotifications?: () => void
}

// =============================================================================
// Configuration de la navigation (2 niveaux max)
// =============================================================================

const mainNavigation: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'clients',
    label: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
    children: [
      { id: 'clients-list', label: 'Mes clients', href: '/dashboard/clients', icon: Users },
      { id: 'prospects', label: 'Prospects', href: '/dashboard/prospects', icon: Briefcase },
      { id: 'dossiers', label: 'Dossiers', href: '/dashboard/dossiers', icon: FolderOpen },
    ]
  },
  {
    id: 'outils',
    label: 'Outils',
    href: '/dashboard/calculateurs',
    icon: Calculator,
    children: [
      { id: 'calculateurs', label: 'Calculateurs', href: '/dashboard/calculateurs', icon: Calculator },
      { id: 'simulateurs', label: 'Simulateurs', href: '/dashboard/simulateurs', icon: BarChart3 },
      { id: 'opportunites', label: 'Opportunités IA', href: '/dashboard/opportunites', icon: Lightbulb },
    ]
  },
  {
    id: 'organisation',
    label: 'Organisation',
    href: '/dashboard/agenda',
    icon: Calendar,
    children: [
      { id: 'agenda', label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
      { id: 'taches', label: 'Tâches', href: '/dashboard/taches', icon: CheckSquare },
      { id: 'emails', label: 'Emails', href: '/dashboard/emails', icon: Mail },
    ]
  },
  {
    id: 'settings',
    label: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

// Navigation contextuelle client
const clientNavigation: NavItem[] = [
  { id: 'overview', label: 'Vue d\'ensemble', href: '', icon: LayoutDashboard },
  { id: 'patrimoine', label: 'Patrimoine', href: '?section=patrimoine', icon: Wallet },
  { id: 'fiscalite', label: 'Fiscalité', href: '?section=fiscalite', icon: Calculator },
  { id: 'projets', label: 'Projets', href: '?section=projets', icon: Target },
  { id: 'documents', label: 'Documents', href: '?section=documents', icon: FileText },
]

// =============================================================================
// Composants internes
// =============================================================================

function NavLink({
  item,
  isActive,
  hasChildren,
  isOpen,
  onToggle,
  badges,
}: {
  item: NavItem
  isActive: boolean
  hasChildren?: boolean
  isOpen?: boolean
  onToggle?: () => void
  badges?: Record<string, number>
}) {
  const Icon = item.icon
  const badge = badges?.[item.id]
  
  const className = cn(
    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  )
  
  const content = (
    <>
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.label}</span>
      {badge && badge > 0 && (
        <Badge variant="error" size="xs">{badge}</Badge>
      )}
      {hasChildren && (
        <ChevronDown className={cn(
          'h-4 w-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      )}
    </>
  )

  if (hasChildren) {
    return (
      <button type="button" onClick={onToggle} className={className}>
        {content}
      </button>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

function ClientContextSidebar({
  client,
  currentSection,
}: {
  client: { id: string; name: string; initials: string }
  currentSection?: string
}) {
  return (
    <div className="fixed left-16 top-0 bottom-0 w-56 bg-white border-r border-gray-200 pt-16 z-40">
      {/* Header client */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{client.initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
            <Link
              href="/dashboard/clients"
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              ← Retour aux clients
            </Link>
          </div>
        </div>
      </div>
      
      {/* Navigation client */}
      <nav className="p-3 space-y-1">
        {clientNavigation.map((item) => {
          const isActive = currentSection === item.id || (!currentSection && item.id === 'overview')
          const Icon = item.icon
          
          return (
            <Link
              key={item.id}
              href={`/dashboard/clients/${client.id}${item.href}`}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// =============================================================================
// Composant Principal - Navigation Top Bar
// =============================================================================

export function FlatNavigationBar({
  currentPath,
  badges,
  onSearch,
  onNotifications,
}: FlatNavigationProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50">
      <div className="h-full max-w-[1600px] mx-auto px-4 flex items-center gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 hidden sm:block">Aura CRM</span>
        </Link>
        
        {/* Navigation principale */}
        <div className="flex items-center gap-1 flex-1">
          {mainNavigation.map((item) => {
            const isActive = currentPath.startsWith(item.href)
            const hasChildren = item.children && item.children.length > 0
            const isOpen = openMenu === item.id
            
            return (
              <div key={item.id} className="relative">
                <NavLink
                  item={item}
                  isActive={isActive}
                  hasChildren={hasChildren}
                  isOpen={isOpen}
                  onToggle={() => setOpenMenu(isOpen ? null : item.id)}
                  badges={badges}
                />
                
                {/* Dropdown */}
                {hasChildren && isOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {item.children!.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={() => setOpenMenu(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                        {badges?.[child.id] && badges[child.id] > 0 && (
                          <Badge variant="error" size="xs" className="ml-auto">
                            {badges[child.id]}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Actions droite */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSearch}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Recherche (Ctrl+K)"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={onNotifications}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {badges?.notifications && badges.notifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
                {badges.notifications > 9 ? '9+' : badges.notifications}
              </span>
            )}
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export { ClientContextSidebar }
export default FlatNavigationBar
