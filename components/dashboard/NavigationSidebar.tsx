'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
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
  Globe
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
      { name: 'Mes tâches', href: '/dashboard/taches', icon: CheckSquare, badge: 4 },
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
          "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
          level === 0 && "font-medium",
          level === 1 && "ml-4 text-sm",
          level === 2 && "ml-8 text-xs",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <item.icon className={cn("flex-shrink-0", level === 0 ? "h-5 w-5" : "h-4 w-4")} />
          <span>{item.name}</span>
        </div>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
          level === 0 && "font-semibold",
          level === 1 && "ml-4 font-medium",
          "text-foreground hover:bg-accent"
        )}
      >
        <div className="flex items-center gap-2">
          <item.icon className={cn("flex-shrink-0", level === 0 ? "h-5 w-5" : "h-4 w-4")} />
          <span>{item.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.badge && (
            <Badge variant="secondary">
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>
      
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child, index) => (
            <NavSection key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function NavigationSidebar() {
  return (
    <div className="flex flex-col h-full w-64 bg-background border-r overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold">ALFI CRM</h2>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigationStructure.map((item, index) => (
          <NavSection key={index} item={item} />
        ))}
      </nav>
    </div>
  )
}
