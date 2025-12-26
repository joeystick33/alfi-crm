'use client'

/**
 * Client 360 Container - Version Professionnelle
 * 
 * Structure optimisée pour les conseillers en gestion de patrimoine :
 * 1. Vue d'ensemble (fusion Overview + Synthèse)
 * 2. Profil & Famille (fusion Profil + Famille)
 * 3. Patrimoine & Reporting (Actifs, Passifs, Reporting)
 * 4. Budget
 * 5. Fiscalité (IR + IFI)
 * 6. Contrats
 * 7. Documents & Conformité (fusion Documents + KYC)
 * 8. Objectifs & Projets
 * 9. Opportunités
 * 10. Activités & Historique
 * 11. Paramètres
 * 
 * Design: Thème light solid (pas de glassmorphism)
 */

import { useState, useCallback, useEffect, Suspense, lazy, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Button } from '@/app/_common/components/ui/Button'
import { Keyboard } from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import { useClient360Keyboard } from '@/app/(advisor)/(frontend)/hooks/use-client360-keyboard'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import {
  TabOverviewSkeleton,
  TabProfileSkeleton,
  TabPatrimoineSkeleton,
  TabBudgetSkeleton,
  TabTaxationSkeleton,
  TabContractsSkeleton,
  TabDocumentsSkeleton,
  TabObjectivesSkeleton,
  TabOpportunitiesSkeleton,
  TabActivitesSkeleton,
  TabParametresSkeleton,
  TabGenericSkeleton,
} from './skeletons/TabSkeleton'
import { Client360ErrorBoundary } from './Client360ErrorBoundary'
import {
  LayoutDashboard,
  Users,
  Wallet,
  PiggyBank,
  Calculator,
  Clock,
  FileText,
  FolderOpen,
  Target,
  Lightbulb,
  History,
  Settings,
} from 'lucide-react'

// Lazy load tab components for better performance - Version professionnelle fusionnée
const TabVueEnsemble = lazy(() => import('./tabs/TabVueEnsemble').then(m => ({ default: m.TabVueEnsemble })))
const TabProfilFamille = lazy(() => import('./tabs/TabProfilFamille').then(m => ({ default: m.TabProfilFamille })))
const TabPatrimoineReporting = lazy(() => import('./tabs/TabPatrimoineReporting').then(m => ({ default: m.TabPatrimoineReporting })))
const TabBudgetComplet = lazy(() => import('./tabs/TabBudgetComplet').then(m => ({ default: m.TabBudgetComplet })))
const TabFiscaliteComplete = lazy(() => import('./tabs/TabFiscaliteComplete').then(m => ({ default: m.TabFiscaliteComplete })))
const TabRetraite = lazy(() => import('./tabs/TabRetraiteComplete').then(m => ({ default: m.TabRetraiteComplete })))
const TabContratsComplet = lazy(() => import('./tabs/TabContratsComplet').then(m => ({ default: m.TabContratsComplet })))
const TabDocumentsConformite = lazy(() => import('./tabs/TabDocumentsConformite').then(m => ({ default: m.TabDocumentsConformite })))
const TabObjectifsProjets = lazy(() => import('./tabs/TabObjectifsProjets').then(m => ({ default: m.TabObjectifsProjets })))
const TabOpportunitesComplet = lazy(() => import('./tabs/TabOpportunitesComplet').then(m => ({ default: m.TabOpportunitesComplet })))
const TabActivitesHistorique = lazy(() => import('./tabs/TabActivitesHistorique').then(m => ({ default: m.TabActivitesHistorique })))
const TabParametresComplet = lazy(() => import('./tabs/TabParametresComplet').then(m => ({ default: m.TabParametresComplet })))

// Tab configuration - Structure professionnelle pour CGP
export interface TabConfig {
  id: string
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export const CLIENT360_TAB_CONFIG: TabConfig[] = [
  { 
    id: 'vue-ensemble', 
    label: 'Vue d\'ensemble', 
    shortLabel: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    description: 'Vision complète du client: patrimoine, budget, objectifs, alertes'
  },
  { 
    id: 'profil-famille', 
    label: 'Profil & Famille', 
    shortLabel: 'Profil',
    icon: Users,
    description: 'Informations civiles, familiales, situation matrimoniale'
  },
  { 
    id: 'patrimoine', 
    label: 'Patrimoine & Reporting', 
    shortLabel: 'Patrimoine',
    icon: Wallet,
    description: 'Actifs, passifs, répartition, rapports patrimoniaux'
  },
  { 
    id: 'budget', 
    label: 'Budget', 
    shortLabel: 'Budget',
    icon: PiggyBank,
    description: 'Revenus, dépenses, solde mensuel, projections'
  },
  { 
    id: 'fiscalite', 
    label: 'Fiscalité', 
    shortLabel: 'Fiscalité',
    icon: Calculator,
    description: 'Impôt sur le revenu, IFI, simulations fiscales'
  },
  { 
    id: 'retraite', 
    label: 'Retraite', 
    shortLabel: 'Retraite',
    icon: Clock,
    description: 'Simulation retraite, projections, épargne'
  },
  { 
    id: 'contrats', 
    label: 'Contrats', 
    shortLabel: 'Contrats',
    icon: FileText,
    description: 'Assurance-vie, PER, prévoyance, comptes bancaires'
  },
  { 
    id: 'documents', 
    label: 'Documents & Conformité', 
    shortLabel: 'Documents',
    icon: FolderOpen,
    description: 'KYC, justificatifs, diligences, conformité réglementaire'
  },
  { 
    id: 'objectifs', 
    label: 'Objectifs & Projets', 
    shortLabel: 'Objectifs',
    icon: Target,
    description: 'Objectifs personnels, projets structurés, simulations'
  },
  { 
    id: 'opportunites', 
    label: 'Opportunités', 
    shortLabel: 'Opportunités',
    icon: Lightbulb,
    description: 'Opportunités patrimoniales, optimisations fiscales'
  },
  { 
    id: 'activites', 
    label: 'Activités & Historique', 
    shortLabel: 'Activités',
    icon: History,
    description: 'Historique des interactions, timeline chronologique'
  },
  { 
    id: 'parametres', 
    label: 'Paramètres', 
    shortLabel: 'Paramètres',
    icon: Settings,
    description: 'Préférences client, notifications, accès'
  },
]

// Storage key for tab state persistence
const TAB_STATE_KEY = 'client360_tab_state'

interface TabState {
  activeTab: string
  scrollPositions: Record<string, number>
  filterStates: Record<string, unknown>
}

// Map tab IDs to their specific skeleton components - Version professionnelle
const TAB_SKELETONS: Record<string, React.ComponentType> = {
  'vue-ensemble': TabOverviewSkeleton,
  'profil-famille': TabProfileSkeleton,
  'patrimoine': TabPatrimoineSkeleton,
  'budget': TabBudgetSkeleton,
  'fiscalite': TabTaxationSkeleton,
  'contrats': TabContractsSkeleton,
  'documents': TabDocumentsSkeleton,
  'objectifs': TabObjectivesSkeleton,
  'opportunites': TabOpportunitiesSkeleton,
  'activites': TabActivitesSkeleton,
  'parametres': TabParametresSkeleton,
}

// Get skeleton component for a specific tab
function getTabSkeleton(tabId: string): React.ComponentType {
  return TAB_SKELETONS[tabId] || TabGenericSkeleton
}

interface Client360ContainerProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
}

export function Client360Container({ clientId, client, wealth }: Client360ContainerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Get initial tab from URL or localStorage
  const getInitialTab = useCallback(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && CLIENT360_TAB_CONFIG.some(t => t.id === urlTab)) {
      return urlTab
    }
    
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`${TAB_STATE_KEY}_${clientId}`)
        if (stored) {
          const state: TabState = JSON.parse(stored)
          if (CLIENT360_TAB_CONFIG.some(t => t.id === state.activeTab)) {
            return state.activeTab
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    
    return 'vue-ensemble'
  }, [searchParams, clientId])

  const [activeTab, setActiveTab] = useState(getInitialTab)
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({})
  const [filterStates, setFilterStates] = useState<Record<string, unknown>>({})
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['vue-ensemble']))
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  // Tab IDs and labels for keyboard navigation
  const tabIds = useMemo(() => CLIENT360_TAB_CONFIG.map(t => t.id), [])
  const tabLabels = useMemo(() => CLIENT360_TAB_CONFIG.map(t => t.label), [])

  // Persist tab state to localStorage
  const persistState = useCallback((tab: string) => {
    if (typeof window !== 'undefined') {
      try {
        const state: TabState = {
          activeTab: tab,
          scrollPositions,
          filterStates,
        }
        localStorage.setItem(`${TAB_STATE_KEY}_${clientId}`, JSON.stringify(state))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [clientId, scrollPositions, filterStates])

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    // Save current scroll position
    setScrollPositions(prev => ({
      ...prev,
      [activeTab]: window.scrollY,
    }))

    // Update active tab
    setActiveTab(tab)
    
    // Mark tab as loaded for lazy loading
    setLoadedTabs(prev => new Set([...prev, tab]))
    
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    
    // Persist state
    persistState(tab)
  }, [activeTab, searchParams, pathname, router, persistState])

  // Restore scroll position when tab changes
  useEffect(() => {
    const savedPosition = scrollPositions[activeTab]
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition)
      })
    }
  }, [activeTab, scrollPositions])

  // Save filter state for a specific tab
  const saveFilterState = useCallback((tabId: string, state: unknown) => {
    setFilterStates(prev => ({
      ...prev,
      [tabId]: state,
    }))
  }, [])

  // Get filter state for a specific tab
  const getFilterState = useCallback((tabId: string) => {
    return filterStates[tabId]
  }, [filterStates])

  // Keyboard navigation
  const { setShowShortcuts } = useClient360Keyboard({
    tabs: tabIds,
    activeTab,
    onTabChange: handleTabChange,
    enabled: true,
  })

  // Set up keyboard shortcuts modal trigger
  useEffect(() => {
    setShowShortcuts(() => setShowKeyboardShortcuts(true))
  }, [setShowShortcuts])

  // Memoize tab content - Version professionnelle fusionnée
  // Each tab is wrapped with error boundary for contextual error handling
  const tabContent = useMemo(() => ({
    'vue-ensemble': (
      <Client360ErrorBoundary tabName="Vue d'ensemble" clientId={clientId}>
        <Suspense fallback={<TabOverviewSkeleton />}>
          <TabVueEnsemble clientId={clientId} client={client} wealth={wealth} onTabChange={handleTabChange} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'profil-famille': (
      <Client360ErrorBoundary tabName="Profil & Famille" clientId={clientId}>
        <Suspense fallback={<TabProfileSkeleton />}>
          <TabProfilFamille clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'patrimoine': (
      <Client360ErrorBoundary tabName="Patrimoine & Reporting" clientId={clientId}>
        <Suspense fallback={<TabPatrimoineSkeleton />}>
          <TabPatrimoineReporting clientId={clientId} client={client} wealth={wealth} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'budget': (
      <Client360ErrorBoundary tabName="Budget" clientId={clientId}>
        <Suspense fallback={<TabBudgetSkeleton />}>
          <TabBudgetComplet clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'fiscalite': (
      <Client360ErrorBoundary tabName="Fiscalité" clientId={clientId}>
        <Suspense fallback={<TabTaxationSkeleton />}>
          <TabFiscaliteComplete clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'retraite': (
      <Client360ErrorBoundary tabName="Retraite" clientId={clientId}>
        <Suspense fallback={<TabGenericSkeleton />}>
          <TabRetraite clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'contrats': (
      <Client360ErrorBoundary tabName="Contrats" clientId={clientId}>
        <Suspense fallback={<TabContractsSkeleton />}>
          <TabContratsComplet clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'documents': (
      <Client360ErrorBoundary tabName="Documents & Conformité" clientId={clientId}>
        <Suspense fallback={<TabDocumentsSkeleton />}>
          <TabDocumentsConformite clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'objectifs': (
      <Client360ErrorBoundary tabName="Objectifs & Projets" clientId={clientId}>
        <Suspense fallback={<TabObjectivesSkeleton />}>
          <TabObjectifsProjets clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'opportunites': (
      <Client360ErrorBoundary tabName="Opportunités" clientId={clientId}>
        <Suspense fallback={<TabOpportunitiesSkeleton />}>
          <TabOpportunitesComplet clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'activites': (
      <Client360ErrorBoundary tabName="Activités & Historique" clientId={clientId}>
        <Suspense fallback={<TabActivitesSkeleton />}>
          <TabActivitesHistorique clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
    'parametres': (
      <Client360ErrorBoundary tabName="Paramètres" clientId={clientId}>
        <Suspense fallback={<TabParametresSkeleton />}>
          <TabParametresComplet clientId={clientId} client={client} />
        </Suspense>
      </Client360ErrorBoundary>
    ),
  }), [clientId, client, wealth, handleTabChange])

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto pb-1">
            <TabsList className="inline-flex items-center gap-0.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
              {CLIENT360_TAB_CONFIG.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all text-gray-500 hover:text-gray-700 hover:bg-white/60 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                    title={tab.description}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden xl:inline">{tab.shortLabel}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>
          
          {/* Keyboard shortcuts hint */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardShortcuts(true)}
            className="hidden xl:flex items-center gap-1.5 text-gray-400 hover:text-gray-600 shrink-0"
            title="Raccourcis clavier (Shift + ?)"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <kbd className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">?</kbd>
          </Button>
        </div>

        {CLIENT360_TAB_CONFIG.map((tab) => {
          const SkeletonComponent = getTabSkeleton(tab.id)
          return (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {/* Only render content if tab has been loaded (lazy loading) */}
              {loadedTabs.has(tab.id) ? (
                tabContent[tab.id as keyof typeof tabContent]
              ) : (
                <SkeletonComponent />
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        tabLabels={tabLabels}
      />
    </div>
  )
}

// Export context for filter state management
export interface Client360ContextValue {
  saveFilterState: (tabId: string, state: unknown) => void
  getFilterState: (tabId: string) => unknown
}

export { TabGenericSkeleton as TabSkeleton }
