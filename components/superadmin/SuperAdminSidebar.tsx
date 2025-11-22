'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
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
  Globe
} from 'lucide-react'

interface NavItem {
  name: string
  href?: string
  icon: any
  badge?: number | string
  children?: NavItem[]
}

const superadminNavigation: NavItem[] = [
  {
    name: 'Vue d\'ensemble',
    icon: Home,
    children: [
      { name: 'Tableau de bord', href: '/superadmin/dashboard', icon: BarChart3 },
      { name: 'Statistiques globales', href: '/superadmin/stats', icon: Activity },
      { name: 'Activité récente', href: '/superadmin/activity', icon: Bell },
    ]
  },
  
  {
    name: 'Gestion des Cabinets',
    icon: Building2,
    children: [
      { name: 'Tous les cabinets', href: '/superadmin/cabinets', icon: Building2 },
      { name: 'Créer un cabinet', href: '/superadmin/cabinets/create', icon: Package },
      { name: 'Demandes d\'inscription', href: '/superadmin/cabinets/requests', icon: Bell, badge: 'NOUVEAU' },
    ]
  },
  
  {
    name: 'Utilisateurs',
    icon: Users,
    children: [
      { name: 'Tous les utilisateurs', href: '/superadmin/users', icon: Users },
      { name: 'SuperAdmins', href: '/superadmin/users/superadmins', icon: Shield },
      { name: 'Sessions actives', href: '/superadmin/users/sessions', icon: Activity },
    ]
  },
  
  {
    name: 'Abonnements & Facturation',
    icon: CreditCard,
    children: [
      { name: 'Plans d\'abonnement', href: '/superadmin/plans', icon: Package },
      { name: 'Facturation', href: '/superadmin/billing', icon: CreditCard },
      { name: 'Quotas globaux', href: '/superadmin/quotas', icon: BarChart3 },
    ]
  },
  
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
          <Badge variant="secondary" className="ml-auto text-xs">
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
            <Badge variant="secondary" className="text-xs">
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

export function SuperAdminSidebar() {
  return (
    <div className="flex flex-col h-full w-64 bg-background border-r overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-bold">ALFI CRM</h2>
          <p className="text-xs text-muted-foreground">SuperAdmin</p>
        </div>
        <Badge variant="destructive" className="text-xs">ADMIN</Badge>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {superadminNavigation.map((item, index) => (
          <NavSection key={index} item={item} />
        ))}
      </nav>
      
      <div className="p-4 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Shield className="h-4 w-4" />
          <span>Retour au CRM</span>
        </Link>
      </div>
    </div>
  )
}
