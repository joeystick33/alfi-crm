'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { useDashboardCounters } from '@/hooks/use-api'
import {
  Home,
  Activity,
  Users,
  UserPlus,
  FolderKanban,
  Target,
  Sparkles,
  Calendar,
  ListChecks,
  Mail,
  Calculator,
  Wallet,
  PiggyBank,
  Layers,
  Scale,
  Handshake,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Landmark,
  ChevronRight,
  Settings,
  LogOut,
} from 'lucide-react'

interface NavigationSidebarProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function NavigationSidebar({ expanded, onExpandedChange }: NavigationSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: counters } = useDashboardCounters()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  // TODO: Get user from session
  const user = { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' }

  // Navigation structure
  const navigationSections = useMemo(() => [
    {
      id: 'pilotage',
      title: 'Pilotage',
      color: 'blue',
      items: [
        {
          id: 'dashboard',
          name: 'Tableau de bord',
          href: '/dashboard',
          icon: Home,
          description: 'Vue d\'ensemble & alertes',
        },
        {
          id: 'mon-activite',
          name: 'Mon activité',
          href: '/dashboard/mon-activite',
          icon: Activity,
          description: 'CA, objectifs & performance',
        },
      ],
    },
    {
      id: 'portefeuille',
      title: 'Portefeuille',
      color: 'cyan',
      items: [
        {
          id: 'clients',
          name: 'Mes clients',
          href: '/dashboard/clients',
          icon: Users,
          description: 'Portefeuille clients & vue 360°',
          badge: counters?.clients.total,
        },
        {
          id: 'prospects',
          name: 'Mes prospects',
          href: '/dashboard/prospects',
          icon: UserPlus,
          description: 'Pipeline prospects & conversions',
        },
        {
          id: 'dossiers',
          name: 'Mes dossiers',
          href: '/dashboard/dossiers',
          icon: FolderKanban,
          description: 'Missions & suivi d\'avancement',
          subItems: [
            {
              name: 'Vue liste',
              href: '/dashboard/dossiers',
              description: 'Tous les dossiers actifs',
            },
            {
              name: 'Vue Kanban',
              href: '/dashboard/dossiers/kanban',
              description: 'Organisation visuelle par statut',
            },
            {
              name: 'Dossiers archivés',
              href: '/dashboard/dossiers/archives',
              description: 'Historique & missions terminées',
            },
          ],
        },
      ],
    },
    {
      id: 'commercial',
      title: 'Actions commerciales',
      color: 'emerald',
      items: [
        {
          id: 'campagnes',
          name: 'Campagnes & Actions',
          href: '/dashboard/campagnes',
          icon: Target,
          description: 'Campagnes, relances & scénarios',
          subItems: [
            {
              name: 'Campagnes en cours',
              href: '/dashboard/campagnes',
              description: 'Suivi des actions actives',
            },
            {
              name: 'Scénarios automatiques',
              href: '/dashboard/scenarios',
              description: 'Workflows & automation',
            },
            {
              name: 'Templates emails',
              href: '/dashboard/templates',
              description: 'Bibliothèque modèles',
            },
          ],
        },
        {
          id: 'opportunites',
          name: 'Opportunités IA',
          href: '/dashboard/opportunites',
          icon: Sparkles,
          description: 'Cross-sell & upsell détectés',
          badge: counters?.opportunities.total,
        },
      ],
    },
    {
      id: 'organisation',
      title: 'Organisation',
      color: 'violet',
      items: [
        {
          id: 'agenda',
          name: 'Mon agenda',
          href: '/dashboard/agenda',
          icon: Calendar,
          description: 'Rendez-vous & planning',
          badge: counters?.appointments.today,
        },
        {
          id: 'taches',
          name: 'Mes tâches',
          href: '/dashboard/taches',
          icon: ListChecks,
          description: 'To-do & rappels',
          badge: counters?.tasks.overdue,
        },
        {
          id: 'emails',
          name: 'Boîte email',
          href: '/dashboard/emails',
          icon: Mail,
          description: 'Gmail / Outlook synchronisé',
        },
      ],
    },
    {
      id: 'outils',
      title: 'Outils patrimoniaux',
      color: 'amber',
      items: [
        {
          id: 'simulateurs',
          name: 'Simulateurs',
          href: '/dashboard/simulators',
          icon: Calculator,
          description: 'Retraite, AV, Immo, Fiscalité',
          subItems: [
            {
              name: 'Plan Épargne Retraite',
              href: '/dashboard/simulators/retirement',
              icon: PiggyBank,
              description: 'Simulation retraite & défiscalisation',
            },
            {
              name: 'Assurance Vie',
              href: '/dashboard/simulators/assurance-vie',
              icon: Layers,
              description: 'Allocation & bénéficiaires',
            },
            {
              name: 'Immobilier locatif',
              href: '/dashboard/simulators/immobilier',
              icon: Home,
              description: 'TRI & cashflow projet',
            },
            {
              name: 'Optimisation fiscale',
              href: '/dashboard/calculators',
              icon: Scale,
              description: 'Calcul IR & IFI',
            },
            {
              name: 'Transmission',
              href: '/dashboard/simulators/succession',
              icon: Handshake,
              description: 'Donation & succession',
            },
          ],
        },
        {
          id: 'portefeuilles',
          name: 'Suivi portefeuilles',
          href: '/dashboard/portefeuilles',
          icon: Wallet,
          description: 'Allocations & performance',
          subItems: [
            {
              name: 'Vue consolidée',
              href: '/dashboard/portefeuilles',
              description: 'Valorisation globale',
            },
            {
              name: 'Performance',
              href: '/dashboard/portefeuilles/performance',
              description: 'Analyse vs benchmarks',
            },
            {
              name: 'Arbitrages suggérés',
              href: '/dashboard/portefeuilles/arbitrages',
              description: 'Alertes & recommandations IA',
            },
          ],
        },
      ],
    },
    {
      id: 'conformite',
      title: 'Conformité',
      color: 'red',
      items: [
        {
          id: 'kyc',
          name: 'KYC & MIF',
          href: '/dashboard/conformite',
          icon: ShieldCheck,
          description: 'Contrôles réglementaires',
          badge: counters?.alerts.kycExpiring,
          subItems: [
            {
              name: 'KYC clients',
              href: '/dashboard/conformite/kyc',
              description: 'Questionnaires & mises à jour',
            },
            {
              name: 'Documents manquants',
              href: '/dashboard/conformite/documents',
              description: 'Pièces à collecter',
            },
            {
              name: 'Contrôles ACPR',
              href: '/dashboard/conformite/controles',
              description: 'Audits & reporting',
            },
          ],
        },
        {
          id: 'reclamations',
          name: 'Réclamations',
          href: '/dashboard/reclamations',
          icon: AlertTriangle,
          description: 'Gestion SLA & traçabilité',
        },
        {
          id: 'documents',
          name: 'Documents & GED',
          href: '/dashboard/documents',
          icon: FileText,
          description: 'Bibliothèque & signatures',
          subItems: [
            {
              name: 'Tous les documents',
              href: '/dashboard/documents',
              description: 'GED centralisée',
            },
            {
              name: 'À signer',
              href: '/dashboard/documents/a-signer',
              description: 'Signature électronique en attente',
            },
            {
              name: 'Templates',
              href: '/dashboard/documents/templates',
              description: 'Modèles prêts à l\'emploi',
            },
          ],
        },
      ],
    },
  ], [counters])

  // Detect active item
  const activeItem = useMemo(() => {
    for (const section of navigationSections) {
      for (const item of section.items) {
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
          return item.id
        }
        if (item.subItems?.some(sub => pathname === sub.href || pathname.startsWith(`${sub.href}/`))) {
          return item.id
        }
      }
    }
    return null
  }, [navigationSections, pathname])

  // Auto-expand active item
  useEffect(() => {
    if (activeItem && !expandedItems.includes(activeItem)) {
      const hasSubItems = navigationSections
        .flatMap(section => section.items)
        .find(item => item.id === activeItem)?.subItems?.length > 0
      
      if (hasSubItems) {
        setExpandedItems(prev => [...prev, activeItem])
      }
    }
  }, [activeItem, navigationSections, expandedItems])

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const sectionColors = {
    blue: {
      activeBg: 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-l-4 border-l-blue-500',
      iconBg: 'bg-blue-500/15',
      text: 'text-blue-500',
    },
    cyan: {
      activeBg: 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border-l-4 border-l-cyan-500',
      iconBg: 'bg-cyan-500/15',
      text: 'text-cyan-500',
    },
    emerald: {
      activeBg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-l-4 border-l-emerald-500',
      iconBg: 'bg-emerald-500/15',
      text: 'text-emerald-500',
    },
    violet: {
      activeBg: 'bg-gradient-to-r from-violet-500/20 to-violet-600/20 border-l-4 border-l-violet-500',
      iconBg: 'bg-violet-500/15',
      text: 'text-violet-500',
    },
    amber: {
      activeBg: 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-l-4 border-l-amber-500',
      iconBg: 'bg-amber-500/15',
      text: 'text-amber-500',
    },
    red: {
      activeBg: 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-l-4 border-l-red-500',
      iconBg: 'bg-red-500/15',
      text: 'text-red-500',
    },
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-gradient-to-b from-card via-card to-muted/20 transition-all duration-300',
        expanded ? 'w-72' : 'w-20'
      )}
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center px-4 py-5 border-b',
        expanded ? 'gap-3' : 'justify-center'
      )}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
          <Landmark className="h-5 w-5" />
        </div>
        {expanded && (
          <div>
            <p className="text-sm font-bold">ALFI CRM</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Gestion de Patrimoine
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={50}>
        <nav className={cn(
          'flex-1 overflow-y-auto py-4',
          expanded ? 'px-3 space-y-6' : 'px-2 space-y-4'
        )}>
          {navigationSections.map((section) => {
            const colors = sectionColors[section.color as keyof typeof sectionColors]

            return (
              <div key={section.id} className="space-y-1">
                {expanded && (
                  <div className="px-3 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {section.title}
                    </p>
                  </div>
                )}

                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeItem === item.id
                  const isExpanded = expandedItems.includes(item.id)
                  const hasSubItems = item.subItems && item.subItems.length > 0

                  const itemContent = (
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer group',
                        isActive
                          ? cn(colors.activeBg, 'shadow-lg')
                          : 'border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border'
                      )}
                      onClick={() => {
                        if (hasSubItems) {
                          toggleItemExpanded(item.id)
                        } else {
                          router.push(item.href)
                        }
                      }}
                    >
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-all',
                        isActive ? colors.iconBg : 'bg-muted group-hover:bg-accent'
                      )}>
                        <Icon className={cn('h-5 w-5 transition-colors', isActive ? colors.text : '')} />
                      </div>

                      {expanded && (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-sm font-semibold truncate',
                                isActive ? 'text-foreground' : ''
                              )}>
                                {item.name}
                              </span>
                              {item.badge !== undefined && item.badge > 0 && (
                                <Badge className="text-[10px] px-1.5 py-0 h-5">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>

                          {hasSubItems && (
                            <ChevronRight className={cn(
                              'h-4 w-4 transition-transform shrink-0',
                              isExpanded ? 'rotate-90' : '',
                              isActive ? colors.text : 'text-muted-foreground'
                            )} />
                          )}
                        </>
                      )}
                    </div>
                  )

                  return (
                    <div key={item.id}>
                      {expanded ? (
                        itemContent
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {itemContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="w-60">
                            <div className="space-y-1">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                              {item.badge !== undefined && item.badge > 0 && (
                                <Badge className="text-[10px] mt-2">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Sub-items */}
                      <AnimatePresence>
                        {expanded && isExpanded && hasSubItems && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-12 mt-1 space-y-1 border-l-2 border-border pl-3">
                              {item.subItems!.map((subItem) => {
                                const SubIcon = subItem.icon || Icon
                                const isSubActive = pathname === subItem.href

                                return (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    className={cn(
                                      'flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all',
                                      isSubActive
                                        ? 'bg-accent text-accent-foreground border border-border'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                    )}
                                  >
                                    {subItem.icon && (
                                      <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{subItem.name}</p>
                                      {subItem.description && (
                                        <p className="text-[10px] text-muted-foreground truncate">{subItem.description}</p>
                                      )}
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </TooltipProvider>

      {/* Footer */}
      <div className="mt-auto border-t p-3 space-y-2">
        <Link href="/dashboard/settings">
          <div className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent',
            expanded ? '' : 'justify-center'
          )}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            {expanded && <span className="text-sm font-medium">Paramètres</span>}
          </div>
        </Link>

        <div className={cn(
          'flex items-center rounded-xl border bg-muted/50 px-3 py-2.5',
          expanded ? 'gap-3' : 'justify-center'
        )}>
          <Avatar className="h-9 w-9 border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
