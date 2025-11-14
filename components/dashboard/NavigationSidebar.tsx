'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { useDashboardCounters } from '@/hooks/use-api'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CheckSquare,
  Calendar,
  Calculator,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: NavigationItem[]
}

interface NavigationSidebarProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function NavigationSidebar({ expanded, onExpandedChange }: NavigationSidebarProps) {
  const pathname = usePathname()
  const { data: counters } = useDashboardCounters()
  const [expandedSections, setExpandedSections] = useState<string[]>(['pilotage'])

  const toggleSection = (label: string) => {
    setExpandedSections(prev =>
      prev.includes(label)
        ? prev.filter(s => s !== label)
        : [...prev, label]
    )
  }

  const navigationSections: Array<{
    title: string
    items: NavigationItem[]
  }> = [
    {
      title: 'Pilotage',
      items: [
        {
          label: 'Tableau de bord',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Portefeuille',
      items: [
        {
          label: 'Clients',
          href: '/dashboard/clients',
          icon: Users,
          badge: counters?.clients.total,
        },
      ],
    },
    {
      title: 'Commercial',
      items: [
        {
          label: 'Opportunités',
          href: '/dashboard/opportunites',
          icon: TrendingUp,
          badge: counters?.opportunities.total,
        },
      ],
    },
    {
      title: 'Organisation',
      items: [
        {
          label: 'Tâches',
          href: '/dashboard/taches',
          icon: CheckSquare,
          badge: counters?.tasks.overdue,
        },
        {
          label: 'Agenda',
          href: '/dashboard/agenda',
          icon: Calendar,
          badge: counters?.appointments.today,
        },
      ],
    },
    {
      title: 'Outils',
      items: [
        {
          label: 'Calculateurs',
          href: '/dashboard/calculators',
          icon: Calculator,
        },
        {
          label: 'Documents',
          href: '/dashboard/documents',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Conformité',
      items: [
        {
          label: 'KYC',
          href: '/dashboard/kyc',
          icon: Shield,
          badge: counters?.alerts.kycExpiring,
        },
      ],
    },
  ]

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        expanded ? 'w-64' : 'w-16'
      )}
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          {expanded && (
            <span className="font-semibold text-lg">ALFI CRM</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navigationSections.map((section) => (
          <div key={section.title} className="mb-4">
            {expanded && (
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedSections.includes(item.label)

                return (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault()
                          toggleSection(item.label)
                        }
                      }}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {expanded && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge variant={isActive ? 'secondary' : 'default'} className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                          {hasChildren && (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )
                          )}
                        </>
                      )}
                    </Link>

                    {/* Sub-items */}
                    {hasChildren && isExpanded && expanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children!.map((child) => {
                          const isChildActive = pathname === child.href
                          const ChildIcon = child.icon

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                isChildActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" />
                              <span className="flex-1">{child.label}</span>
                              {child.badge !== undefined && child.badge > 0 && (
                                <Badge variant="outline" className="ml-auto">
                                  {child.badge}
                                </Badge>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            JD
          </div>
          {expanded && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Jean Dupont</p>
              <p className="text-xs text-muted-foreground truncate">Conseiller</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
