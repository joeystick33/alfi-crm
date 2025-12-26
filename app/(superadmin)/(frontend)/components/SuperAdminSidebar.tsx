'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import {
  Home,
  Building2,
  Users,
  Settings,
  BarChart3,
  Shield,
  CreditCard,
  Activity,
  Database,
  FileText,
  Bell,
  ChevronDown,
  ChevronRight,
  Package,
  Zap,
  Globe,
  Command,
  LogOut,
  Plus,
} from 'lucide-react'

// Context pour gérer l'accordion (une seule section ouverte)
interface AccordionContextType {
  openSection: string | null
  setOpenSection: (section: string | null) => void
}

const AccordionContext = createContext<AccordionContextType>({
  openSection: null,
  setOpenSection: () => { }
})

interface NavItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  badgeVariant?: 'default' | 'success' | 'warning' | 'destructive'
  children?: NavItem[]
}

const superadminNavigation: NavItem[] = [
  // Tableau de bord (premier niveau, hors accordion)
  { name: 'Tableau de bord', href: '/superadmin/dashboard', icon: BarChart3 },

  // Vue d'ensemble
  {
    name: 'Vue d\'ensemble',
    icon: Home,
    children: [
      { name: 'Statistiques globales', href: '/superadmin/stats', icon: Activity },
      { name: 'Activité récente', href: '/superadmin/activity', icon: Bell },
    ]
  },

  // Gestion des Cabinets
  {
    name: 'Gestion des Cabinets',
    icon: Building2,
    children: [
      { name: 'Tous les cabinets', href: '/superadmin/cabinets', icon: Building2 },
      { name: 'Créer un cabinet', href: '/superadmin/cabinets/create', icon: Plus },
      { name: 'Demandes d\'inscription', href: '/superadmin/cabinets/requests', icon: Bell, badge: 3, badgeVariant: 'warning' },
    ]
  },

  // Utilisateurs
  {
    name: 'Utilisateurs',
    icon: Users,
    children: [
      { name: 'Tous les utilisateurs', href: '/superadmin/users', icon: Users },
      { name: 'SuperAdmins', href: '/superadmin/users/superadmins', icon: Shield },
      { name: 'Sessions actives', href: '/superadmin/users/sessions', icon: Activity },
    ]
  },

  // Abonnements & Facturation
  {
    name: 'Abonnements & Facturation',
    icon: CreditCard,
    children: [
      { name: 'Plans d\'abonnement', href: '/superadmin/plans', icon: Package },
      { name: 'Facturation', href: '/superadmin/billing', icon: CreditCard },
      { name: 'Quotas globaux', href: '/superadmin/quotas', icon: BarChart3 },
    ]
  },

  // Système
  {
    name: 'Système',
    icon: Settings,
    children: [
      { name: 'Configuration', href: '/superadmin/config', icon: Settings },
      { name: 'Base de données', href: '/superadmin/database', icon: Database },
      { name: 'Logs système', href: '/superadmin/logs', icon: FileText },
      { name: 'Intégrations', href: '/superadmin/integrations', icon: Zap },
      { name: 'API & Webhooks', href: '/superadmin/api', icon: Globe },
    ]
  },
]

// Couleurs pour les sections principales - DARK THEME
const sectionColors: Record<string, { bg: string; icon: string; activeBg: string }> = {
  'Vue d\'ensemble': { bg: 'bg-[#7373FF]/20', icon: 'text-[#7373FF]', activeBg: 'bg-[#7373FF]/15' },
  'Gestion des Cabinets': { bg: 'bg-emerald-500/20', icon: 'text-emerald-400', activeBg: 'bg-emerald-500/15' },
  'Utilisateurs': { bg: 'bg-violet-500/20', icon: 'text-violet-400', activeBg: 'bg-violet-500/15' },
  'Abonnements & Facturation': { bg: 'bg-amber-500/20', icon: 'text-amber-400', activeBg: 'bg-amber-500/15' },
  'Système': { bg: 'bg-rose-500/20', icon: 'text-rose-400', activeBg: 'bg-rose-500/15' },
}

function NavSection({ item, level = 0, sectionId }: { item: NavItem; level?: number; sectionId?: string }) {
  const { openSection, setOpenSection } = useContext(AccordionContext)
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0

  // Pour les sections de niveau 0, utiliser le contexte accordion
  const isOpen = level === 0 ? openSection === sectionId : true
  const colors = level === 0 ? sectionColors[item.name] || sectionColors['Vue d\'ensemble'] : null

  // Vérifier si une des pages enfants est active
  const hasActiveChild = (navItem: NavItem): boolean => {
    if (navItem.href && (pathname === navItem.href || pathname?.startsWith(navItem.href + '/'))) {
      return true
    }
    if (navItem.children) {
      return navItem.children.some(child => hasActiveChild(child))
    }
    return false
  }

  const isActiveSection = hasActiveChild(item)

  // Link item (no children)
  if (item.href && !hasChildren) {
    const isActive = pathname === item.href || (item.href !== '/superadmin/dashboard' && pathname?.startsWith(item.href + '/'))
    const isDashboard = item.href === '/superadmin/dashboard'

    // Style spécial pour le Tableau de bord (niveau 0) - DARK THEME
    if (level === 0 && isDashboard) {
      return (
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-all duration-200",
            isActive
              ? "bg-gradient-to-r from-[#7373FF] to-[#8b8bff] text-white shadow-lg shadow-[#7373FF]/25"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
          )}
        >
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            isActive ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
          )}>
            <item.icon className={cn(
              "h-4 w-4",
              isActive ? "text-white" : "text-[#7373FF]"
            )} />
          </div>
          <span className="font-semibold text-[13px]">{item.name}</span>
        </Link>
      )
    }

    // DARK THEME - Links normaux
    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center justify-between rounded-lg transition-all duration-150",
          level === 1 && "mx-2 px-3 py-2",
          level === 2 && "mx-2 ml-5 px-3 py-1.5",
          isActive
            ? "bg-white/10 text-white"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        )}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={cn(
              "flex-shrink-0 transition-colors",
              isActive ? "text-[#7373FF]" : "text-slate-500 group-hover:text-slate-300",
              "h-4 w-4"
            )}
          />
          <span className={cn(
            "font-medium text-[13px]",
            level === 2 && "text-xs"
          )}>{item.name}</span>
        </div>
        {item.badge && (
          <Badge
            variant={item.badgeVariant === 'warning' ? 'warning' : isActive ? "primary" : "default"}
            size="xs"
            className={cn(
              "ml-auto",
              item.badgeVariant === 'warning'
                ? "bg-amber-500/20 text-amber-400 border-0"
                : isActive
                  ? "bg-[#7373FF] text-white"
                  : "bg-white/10 text-slate-300"
            )}
          >
            {item.badge}
          </Badge>
        )}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-[#7373FF] rounded-r-full" />
        )}
      </Link>
    )
  }

  // Section principale (level 0) - Accordion - DARK THEME
  if (level === 0) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setOpenSection(isOpen ? null : sectionId!)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            isOpen
              ? `${colors?.activeBg} border border-white/5`
              : "hover:bg-white/5",
            isActiveSection && !isOpen && "bg-white/5"
          )}
        >
          {/* Icon avec background coloré */}
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
            isOpen ? colors?.bg : "bg-white/5",
            isActiveSection && !isOpen && colors?.bg
          )}>
            <item.icon className={cn(
              "h-4 w-4 transition-colors",
              isOpen ? colors?.icon : "text-slate-400",
              isActiveSection && !isOpen && colors?.icon
            )} />
          </div>

          {/* Label */}
          <span className={cn(
            "flex-1 text-left text-[13px] font-semibold transition-colors",
            isOpen ? "text-white" : "text-slate-400 group-hover:text-slate-200"
          )}>
            {item.name}
          </span>

          {/* Badge + Chevron */}
          <div className="flex items-center gap-2">
            {item.badge && (
              <Badge variant="primary" size="xs" className="bg-[#7373FF] text-white">
                {item.badge}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180 text-slate-600"
              )}
            />
          </div>
        </button>

        {/* Children avec animation */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="pt-1 pb-1 space-y-0.5">
              {item.children!.map((child, index) => (
                <NavSection key={index} item={child} level={level + 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sous-section avec children (level > 0) - DARK THEME
  return (
    <div className="mx-2">
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <item.icon className="h-3.5 w-3.5" />
        {item.name}
      </div>
      <div className="space-y-0.5">
        {item.children!.map((child, index) => (
          <NavSection key={index} item={child} level={level + 1} />
        ))}
      </div>
    </div>
  )
}

export function SuperAdminSidebar() {
  const pathname = usePathname()

  // État pour l'accordion - une seule section ouverte à la fois
  const [openSection, setOpenSection] = useState<string | null>(() => {
    // Ouvrir automatiquement la section qui contient la page active
    for (let i = 0; i < superadminNavigation.length; i++) {
      const section = superadminNavigation[i]
      const hasActive = (item: NavItem): boolean => {
        if (item.href && (pathname === item.href || pathname?.startsWith(item.href + '/'))) return true
        if (item.children) return item.children.some(hasActive)
        return false
      }
      if (hasActive(section)) return `section-${i}`
    }
    return 'section-1' // Par défaut, ouvrir Vue d'ensemble
  })

  return (
    <AccordionContext.Provider value={{ openSection, setOpenSection }}>
      {/* DARK SIDEBAR - Luminous Midnight */}
      <aside className="flex flex-col h-full w-[280px] bg-[#171936] border-r border-white/5 shadow-2xl">
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#7373FF]/10 to-transparent pointer-events-none" />

        {/* Premium Brand Header - Cliquable vers Dashboard */}
        <Link
          href="/superadmin/dashboard"
          className="flex items-center gap-3 px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors relative z-10"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7373FF] to-[#5c5ce6] flex items-center justify-center shadow-lg shadow-[#7373FF]/25 ring-1 ring-white/10">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white tracking-tight font-display">Aura</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Administration Système</p>
          </div>
          <Badge className="bg-rose-500/10 text-rose-400 text-[10px] font-semibold border-rose-500/20">
            ADMIN
          </Badge>
        </Link>

        {/* Navigation avec scroll */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 relative z-10">
          {superadminNavigation.map((item, index) => (
            <NavSection
              key={index}
              item={item}
              sectionId={`section-${index}`}
            />
          ))}
        </nav>

        {/* Footer avec Paramètres et Profil - DARK THEME */}
        <div className="mt-auto border-t border-white/5 relative z-10">
          {/* Bouton Retour au CRM */}
          <div className="px-2 pt-2">
            <Link
              href="/dashboard"
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg transition-all bg-white/5 group-hover:bg-white/10">
                <LogOut className="h-4 w-4 text-slate-500 group-hover:text-white" />
              </div>
              <span className="text-[13px] font-medium">Retour au CRM</span>
            </Link>
          </div>

          {/* Profil SuperAdmin - DARK THEME */}
          <div className="p-2">
            <Link
              href="/superadmin/profile"
              className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200"
            >
              <Avatar
                name="Super Admin"
                size="sm"
                className="ring-2 ring-white/10 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                  Super Admin
                </p>
                <p className="text-[11px] text-slate-500 truncate">Propriétaire</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </aside>
    </AccordionContext.Provider>
  )
}
