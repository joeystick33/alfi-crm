'use client'

import { useState, createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import { Badge } from '@/app/_common/components/ui/Badge'
import { useDashboardCounters } from '@/app/_common/hooks/use-api'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useProfile } from '@/app/_common/hooks/api/use-profile-api'
import { Avatar } from '@/app/_common/components/ui/Avatar'
import {
  Home,
  Users,
  Calculator,
  TrendingUp,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Target,
  Briefcase,
  Calendar,
  CheckSquare,
  Mail,
  BarChart3,
  Zap,
  Lightbulb,
  Shield,
  FileCheck,
  AlertTriangle,
  FileSignature,
  FolderOpen,
  PiggyBank,
  Building,
  Percent,
  Gift,
  Layers,
  Activity,
  DollarSign,
  UserPlus,
  Kanban,
  Archive,
  BookTemplate,
  Sparkles,
  UserCog,
  Wallet,
  CreditCard,
  Globe,
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
  children?: NavItem[]
}

const navigationStructure: NavItem[] = [
  // 0. Tableau de bord (premier niveau, hors accordion)
  { name: 'Tableau de bord', href: '/dashboard', icon: BarChart3 },

  // 1. Pilotage
  {
    name: 'Pilotage',
    icon: Activity,
    children: [
      { name: 'Pilotage Commercial', href: '/dashboard/pilotage', icon: BarChart3 },
      { name: 'Suivi Portefeuilles', href: '/dashboard/pilotage/portefeuille', icon: Layers },
      { name: 'Apporteurs d\'affaires', href: '/dashboard/apporteurs', icon: Users },
      { name: 'Facturation', href: '/dashboard/facturation', icon: DollarSign },
    ]
  },

  // 2. Portefeuille
  {
    name: 'Portefeuille',
    icon: Briefcase,
    children: [
      { name: 'Mes clients', href: '/dashboard/clients', icon: Users },
      { name: 'Mes clients archivés', href: '/dashboard/clients?status=ARCHIVE', icon: Archive },
      { name: 'Mes prospects', href: '/dashboard/prospects', icon: UserPlus },
      { name: 'Mes prospects archivés', href: '/dashboard/prospects?status=PERDU', icon: Archive },
      {
        name: 'Mes dossiers',
        icon: FolderOpen,
        children: [
          { name: 'Vue liste', href: '/dashboard/dossiers', icon: Layers },
          { name: 'Vue Kanban', href: '/dashboard/dossiers/kanban', icon: Kanban },
          { name: 'Dossiers archivés', href: '/dashboard/dossiers/archives', icon: Archive },
        ]
      },
    ]
  },

  // 3. Actions commerciales
  {
    name: 'Actions commerciales',
    icon: Target,
    children: [
      { name: 'Actions commerciales', href: '/dashboard/clients/actions', icon: Zap },
      { name: 'Opportunités détectées', href: '/dashboard/clients/opportunites', icon: Lightbulb },
      {
        name: 'Campagnes & Actions',
        icon: Zap,
        children: [
          { name: 'Campagnes en cours', href: '/dashboard/campagnes/actives', icon: Zap },
          { name: 'Scénarios automatiques', href: '/dashboard/scenarios', icon: Sparkles },
          { name: 'Templates emails', href: '/dashboard/templates/emails', icon: Mail },
        ]
      },
      { name: 'Opportunités', href: '/dashboard/opportunites', icon: Lightbulb },
    ]
  },

  // 4. Organisation
  {
    name: 'Organisation',
    icon: Calendar,
    children: [
      { name: 'Mon agenda', href: '/dashboard/agenda', icon: Calendar },
      { name: 'Mes tâches', href: '/dashboard/taches', icon: CheckSquare },
      { name: 'Boîte email', href: '/dashboard/emails', icon: Mail },
      { name: 'Gestion des conseillers', href: '/dashboard/conseillers', icon: UserCog },
    ]
  },

  // 5. Outils patrimoniaux
  {
    name: 'Outils patrimoniaux',
    icon: Calculator,
    children: [
      // Hub central
      { name: 'Vue d\'ensemble', href: '/dashboard/calculateurs', icon: Calculator },
      // Calculateurs (calculs instantanés)
      {
        name: 'Calculateurs',
        icon: Calculator,
        children: [
          { name: 'Impôt sur le Revenu', href: '/dashboard/calculateurs/impot-revenu', icon: Percent },
          { name: 'IFI', href: '/dashboard/calculateurs/ifi', icon: Building },
          { name: 'Plus-Values', href: '/dashboard/calculateurs/plus-values', icon: TrendingUp },
          { name: 'Droits de Donation', href: '/dashboard/calculateurs/donation', icon: Gift },
          { name: 'Droits de Succession', href: '/dashboard/calculateurs/succession', icon: Users },
          { name: 'Budget & Épargne', href: '/dashboard/calculateurs/budget', icon: Wallet },
          { name: 'Capacité d\'Emprunt', href: '/dashboard/calculateurs/capacite-emprunt', icon: CreditCard },
        ]
      },
      // Simulateurs (projections & optimisations)
      {
        name: 'Simulateurs',
        icon: TrendingUp,
        children: [
          { name: 'Hub Simulateurs', href: '/dashboard/simulateurs', icon: Layers },
          { name: 'Assurance-Vie', href: '/dashboard/simulateurs/assurance-vie', icon: Shield },
          { name: 'PER Salariés', href: '/dashboard/simulateurs/per-salaries', icon: PiggyBank },
          { name: 'PER TNS', href: '/dashboard/simulateurs/per-tns', icon: PiggyBank },
          { name: 'Immobilier', href: '/dashboard/simulateurs/immobilier', icon: Building },
          { name: 'Prévoyance TNS', href: '/dashboard/simulateurs/prevoyance-tns', icon: Shield },
          { name: 'Retraite', href: '/dashboard/simulateurs/retraite', icon: Activity },
          { name: 'Succession', href: '/dashboard/simulateurs/succession', icon: Gift },
          { name: 'PTZ 2025', href: '/dashboard/simulateurs/ptz', icon: Home },
          { name: 'Épargne', href: '/dashboard/simulateurs/epargne', icon: TrendingUp },
        ]
      },
      // Comparateur Java (utilitaire)
      { name: 'Comparateur Java', href: '/dashboard/patrimoine/comparateur-java', icon: Briefcase },
    ]
  },

  // 6. Conformité
  {
    name: 'Conformité',
    icon: Shield,
    children: [
      {
        name: 'KYC & MIF',
        icon: FileCheck,
        children: [
          { name: 'KYC clients', href: '/dashboard/kyc', icon: FileCheck },
          { name: 'Documents manquants', href: '/dashboard/kyc/manquants', icon: AlertTriangle },
          { name: 'Contrôles ACPR', href: '/dashboard/kyc/controles', icon: Shield },
        ]
      },
      { name: 'Réclamations', href: '/dashboard/reclamations', icon: AlertTriangle },
      {
        name: 'Documents & GED',
        icon: FileText,
        children: [
          { name: 'Tous les documents', href: '/dashboard/documents', icon: FileText },
          { name: 'À signer', href: '/dashboard/documents/signature', icon: FileSignature },
          { name: 'Templates', href: '/dashboard/documents/templates', icon: BookTemplate },
        ]
      },
    ]
  },

]

// Couleurs pour les sections principales - DARK THEME MIDNIGHT
const sectionColors: Record<string, { bg: string; icon: string; activeBg: string }> = {
  'Pilotage': { bg: 'bg-[#7373FF]/20', icon: 'text-[#7373FF]', activeBg: 'bg-[#7373FF]/15' },
  'Portefeuille': { bg: 'bg-emerald-500/20', icon: 'text-emerald-400', activeBg: 'bg-emerald-500/15' },
  'Actions commerciales': { bg: 'bg-amber-500/20', icon: 'text-amber-400', activeBg: 'bg-amber-500/15' },
  'Organisation': { bg: 'bg-violet-500/20', icon: 'text-violet-400', activeBg: 'bg-violet-500/15' },
  'Outils patrimoniaux': { bg: 'bg-cyan-500/20', icon: 'text-cyan-400', activeBg: 'bg-cyan-500/15' },
  'Conformité': { bg: 'bg-rose-500/20', icon: 'text-rose-400', activeBg: 'bg-rose-500/15' },
}

function NavSection({ item, level = 0, sectionId }: { item: NavItem; level?: number; sectionId?: string }) {
  const { openSection, setOpenSection } = useContext(AccordionContext)
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0

  // Pour les sections de niveau 0, utiliser le contexte accordion
  const isOpen = level === 0 ? openSection === sectionId : true
  const colors = level === 0 ? sectionColors[item.name] || sectionColors['Pilotage'] : null

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
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'))
    const isDashboard = item.href === '/dashboard'

    // Style spécial pour le Tableau de bord (niveau 0) - DARK THEME
    if (level === 0 && isDashboard) {
      return (
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-all duration-200",
            isActive
              ? "bg-gradient-to-r from-[#7373FF] to-[#8b8bff] text-white shadow-lg shadow-[#7373FF]/20"
              : "bg-transparent text-slate-400 hover:bg-white/5 hover:text-white"
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
            variant={isActive ? "primary" : "default"}
            size="xs"
            className={cn("ml-auto", isActive ? "bg-[#7373FF] text-white" : "bg-white/10 text-slate-300")}
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

export function NavigationSidebar() {
  const { data: counters } = useDashboardCounters()
  const { user } = useAuth()
  const { data: profileData } = useProfile()
  const pathname = usePathname()

  // Informations utilisateur
  const userFullName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
  const userRole = user?.role === 'ADMIN' ? 'Administrateur' : user?.role === 'ADVISOR' ? 'Conseiller' : 'Assistant'
  const cabinetName = user && 'cabinetName' in user ? user.cabinetName : 'Cabinet'

  // État pour l'accordion - une seule section ouverte à la fois
  const [openSection, setOpenSection] = useState<string | null>(() => {
    // Ouvrir automatiquement la section qui contient la page active
    for (let i = 0; i < navigationStructure.length; i++) {
      const section = navigationStructure[i]
      const hasActive = (item: NavItem): boolean => {
        if (item.href && (pathname === item.href || pathname?.startsWith(item.href + '/'))) return true
        if (item.children) return item.children.some(hasActive)
        return false
      }
      if (hasActive(section)) return `section-${i}`
    }
    return 'section-0' // Par défaut, ouvrir Pilotage
  })

  const getBadgeForHref = (href: string) => {
    if (!counters) return undefined

    if (href === '/dashboard/taches') return (counters?.tasks?.total || 0) > 0 ? counters.tasks.total : undefined
    if (href === '/dashboard/emails') return (counters?.notifications?.unread || 0) > 0 ? counters.notifications.unread : undefined
    return undefined
  }

  return (
    <AccordionContext.Provider value={{ openSection, setOpenSection }}>
      {/* DARK SIDEBAR - Midnight Premium Design */}
      <aside className="flex flex-col h-full w-[280px] bg-[hsl(var(--sidebar))] border-r border-[#ffffff0d]">
        {/* Premium Brand Header - Cliquable vers Dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-4 border-b border-[#ffffff0d] hover:bg-white/5 transition-colors"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7373FF] to-[#5c5ce6] flex items-center justify-center shadow-lg shadow-[#7373FF]/20 ring-1 ring-white/10">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white tracking-tight font-display">Aura</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{cabinetName}</p>
          </div>
        </Link>

        {/* Navigation avec scroll */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {navigationStructure.map((item, index) => {
            const dynamicItem = { ...item }

            if (dynamicItem.href) {
              const badge = getBadgeForHref(dynamicItem.href)
              if (badge) dynamicItem.badge = badge
            }

            if (dynamicItem.children) {
              dynamicItem.children = dynamicItem.children.map(child => {
                const childBadge = child.href ? getBadgeForHref(child.href) : undefined
                return childBadge ? { ...child, badge: childBadge } : child
              })
            }

            return (
              <NavSection
                key={index}
                item={dynamicItem}
                sectionId={`section-${index}`}
              />
            )
          })}
        </nav>

        {/* Footer avec Paramètres et Profil - DARK THEME */}
        <div className="mt-auto border-t border-[#ffffff0d]">
          {/* Bouton Paramètres */}
          <div className="px-2 pt-2">
            <Link
              href="/dashboard/settings"
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                pathname?.startsWith('/dashboard/settings')
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                pathname?.startsWith('/dashboard/settings')
                  ? "bg-white/10"
                  : "bg-white/5 group-hover:bg-white/10"
              )} >
                <Settings className={cn(
                  "h-4 w-4 transition-colors",
                  pathname?.startsWith('/dashboard/settings')
                    ? "text-[#7373FF]"
                    : "text-slate-400 group-hover:text-white"
                )} />
              </div>
              <span className="text-[13px] font-medium">Paramètres</span>
              {pathname?.startsWith('/dashboard/settings') && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7373FF]" />
              )}
            </Link>
          </div>

          {/* Profil utilisateur - DARK THEME */}
          <div className="p-2">
            <Link
              href="/dashboard/settings/profil"
              className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#ffffff0d] hover:border-white/10 transition-all duration-200"
            >
              <Avatar
                src={profileData?.avatar}
                name={userFullName}
                size="sm"
                className="ring-2 ring-white/10 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                  {userFullName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{userRole}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </aside>
    </AccordionContext.Provider>
  )
}
