'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { useDashboardCounters } from '@/hooks/use-api'
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
  Bell,
  Calendar,
  CheckSquare,
  Mail,
  BarChart3,
  Zap,
  MessageSquare,
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
  LineChart,
  TrendingDown,
  Layers,
  Activity,
  DollarSign,
  UserPlus,
  Filter,
  Download,
  Kanban,
  Archive,
  Send,
  BookTemplate,
  Sparkles,
  UserCog,
  Wallet,
  TrendingUpDown,
  CreditCard,
  User,
  Key,
  Globe,
  Command
} from 'lucide-react'

interface NavItem {
  name: string
  href?: string
  icon: any
  badge?: number | string
  children?: NavItem[]
}

const navigationStructure: NavItem[] = [
  // 1. Pilotage
  {
    name: 'Pilotage',
    icon: Home,
    children: [
      { name: 'Tableau de bord', href: '/dashboard', icon: BarChart3 },
      { name: 'Mon activité', href: '/dashboard/activity', icon: Activity },
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
      { name: 'Mes prospects', href: '/dashboard/prospects', icon: UserPlus },
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
      {
        name: 'Campagnes & Actions',
        icon: Zap,
        children: [
          { name: 'Campagnes en cours', href: '/dashboard/campagnes/actives', icon: Zap },
          { name: 'Scénarios automatiques', href: '/dashboard/scenarios', icon: Sparkles },
          { name: 'Templates emails', href: '/dashboard/templates/emails', icon: Mail },
        ]
      },
      { name: 'Opportunités IA', href: '/dashboard/opportunites', icon: Lightbulb },
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
      {
        name: 'Simulateurs',
        icon: TrendingUp,
        children: [
          { name: 'Plan Épargne Retraite', href: '/dashboard/simulators/retirement', icon: PiggyBank },
          { name: 'Assurance Vie', href: '/dashboard/simulators/assurance-vie', icon: Shield },
          { name: 'Immobilier locatif', href: '/dashboard/simulators/immobilier', icon: Building },
          { name: 'Optimisation fiscale', href: '/dashboard/simulators/tax-projector', icon: Percent },
          { name: 'Transmission', href: '/dashboard/simulators/succession', icon: Gift },
        ]
      },
      {
        name: 'Suivi portefeuilles',
        icon: Wallet,
        children: [
          { name: 'Vue consolidée', href: '/dashboard/patrimoine', icon: Layers },
          { name: 'Performance', href: '/dashboard/patrimoine/performance', icon: TrendingUp },
          { name: 'Arbitrages suggérés', href: '/dashboard/patrimoine/arbitrages', icon: TrendingUpDown },
        ]
      },
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

  // 7. Paramètres & Abonnement
  {
    name: 'Paramètres & Abonnement',
    icon: Settings,
    children: [
      { name: 'Mon profil', href: '/dashboard/settings/profil', icon: User },
      { name: 'Abonnement & Quotas', href: '/dashboard/settings/abonnement', icon: CreditCard },
      { name: 'Gestion des utilisateurs', href: '/dashboard/settings/users', icon: UserCog },
      { name: 'Paramètres globaux', href: '/dashboard/settings', icon: Settings },
      { name: 'Gestion des accès', href: '/dashboard/settings/acces', icon: Key },
    ]
  },
]

function NavSection({ item, level = 0 }: { item: NavItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(level === 0)
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0

  if (item.href && !hasChildren) {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
          level === 0 && "text-base",
          level === 1 && "ml-3 text-sm",
          level === 2 && "ml-6 text-xs",
          isActive 
            ? "bg-primary/10 text-primary shadow-sm" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon 
            className={cn(
              "flex-shrink-0 transition-colors",
              isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-700",
              level === 0 ? "h-5 w-5" : "h-4 w-4"
            )} 
          />
          <span>{item.name}</span>
        </div>
        {item.badge && (
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={cn("ml-auto text-[10px] h-5 px-1.5", isActive && "bg-primary text-primary-foreground")}
          >
            {item.badge}
          </Badge>
        )}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-primary rounded-r-full" />
        )}
      </Link>
    )
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200",
          level === 0 ? "text-slate-800 dark:text-slate-200" : "text-slate-600 dark:text-slate-400 ml-3",
          "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className={cn(
            "flex-shrink-0 text-slate-500", 
            level === 0 ? "h-5 w-5" : "h-4 w-4"
          )} />
          <span>{item.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.badge && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {item.badge}
            </Badge>
          )}
          <ChevronRight 
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-300 ease-out",
              isOpen && "rotate-90"
            )} 
          />
        </div>
      </button>
      
      <div 
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-1 pb-2 space-y-0.5">
            {item.children!.map((child, index) => (
              <NavSection key={index} item={child} level={level + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NavigationSidebar() {
  const { data: counters } = useDashboardCounters()

  const getBadgeForHref = (href: string) => {
    if (!counters) return undefined
    
    if (href === '/dashboard/taches') return (counters?.tasks?.total || 0) > 0 ? counters.tasks.total : undefined
    if (href === '/dashboard/emails') return (counters?.notifications?.unread || 0) > 0 ? counters.notifications.unread : undefined
    // Autres badges dynamiques possibles ici
    return undefined
  }

  return (
    <div className="flex flex-col h-full w-72 bg-white/80 dark:bg-gray-900/80 border-r border-slate-200 dark:border-slate-700 backdrop-blur-xl shadow-sm">
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Command className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">ALFI CRM</h2>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Cabinet Gestion & Associés</p>
        </div>
      </div>
      
      {/* Navigation Scroll Area */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {navigationStructure.map((item, index) => {
          // Clone item to avoid mutating static structure
          const dynamicItem = { ...item }
          
          // Update badge for top-level items
          if (dynamicItem.href) {
            const badge = getBadgeForHref(dynamicItem.href)
            if (badge) dynamicItem.badge = badge
          }

          // Update badges for children
          if (dynamicItem.children) {
            dynamicItem.children = dynamicItem.children.map(child => {
               const childBadge = child.href ? getBadgeForHref(child.href) : undefined
               return childBadge ? { ...child, badge: childBadge } : child
            })
          }

          return <NavSection key={index} item={dynamicItem} />
        })}
      </nav>

      {/* User Profile Footer (Optional, if needed at bottom) */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="h-4 w-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">Mon Compte</p>
            <p className="text-[10px] text-slate-500 truncate">Configuration</p>
          </div>
          <Settings className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  )
}
