'use client'

/**
 * TabPatrimoineUnified - Vue patrimoine unifiée
 * 
 * Regroupe en sous-tabs:
 * - Actifs & Passifs
 * - Budget
 * - Fiscalité
 * - Retraite
 * - Contrats
 */

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import { Wallet, PiggyBank, Calculator, Clock, FileText } from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

// Lazy load des sous-composants existants
// TabPatrimoineReporting contient les formulaires d'ajout actifs/passifs fonctionnels
const TabPatrimoineReporting = lazy(() => import('../../client360/tabs/TabPatrimoineReporting').then(m => ({ default: m.TabPatrimoineReporting })))
const TabBudgetComplet = lazy(() => import('../../client360/tabs/TabBudgetComplet').then(m => ({ default: m.TabBudgetComplet })))
const TabFiscaliteComplete = lazy(() => import('../../client360/tabs/TabFiscaliteComplete').then(m => ({ default: m.TabFiscaliteComplete })))
const TabRetraite = lazy(() => import('../../client360/tabs/TabRetraiteComplete').then(m => ({ default: m.TabRetraiteComplete })))
const TabContratsComplet = lazy(() => import('../../client360/tabs/TabContratsComplet').then(m => ({ default: m.TabContratsComplet })))

// Sous-tabs configuration
const SUB_TABS = [
  { id: 'actifs', label: 'Actifs & Passifs', icon: Wallet },
  { id: 'budget', label: 'Budget', icon: PiggyBank },
  { id: 'fiscalite', label: 'Fiscalité', icon: Calculator },
  { id: 'retraite', label: 'Retraite', icon: Clock },
  { id: 'contrats', label: 'Contrats', icon: FileText },
]

interface TabPatrimoineUnifiedProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
  initialSubTab?: string
}

function SubTabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-100 rounded-lg" />
      <div className="h-48 bg-gray-100 rounded-lg" />
    </div>
  )
}

export function TabPatrimoineUnified({ clientId, client, wealth, initialSubTab }: TabPatrimoineUnifiedProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // État synchronisé avec URL
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const subTab = searchParams.get('subtab')
    if (subTab && SUB_TABS.some(t => t.id === subTab)) return subTab
    return initialSubTab || 'actifs'
  })

  // Sync avec URL quand searchParams change
  useEffect(() => {
    const subTab = searchParams.get('subtab')
    if (subTab && SUB_TABS.some(t => t.id === subTab)) {
      setActiveSubTab(subTab)
    }
  }, [searchParams])

  // Navigation avec mise à jour URL
  const handleSubTabChange = useCallback((tabId: string) => {
    setActiveSubTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('subtab', tabId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  return (
    <div className="space-y-6">
      {/* Sous-navigation - style pill moderne */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenu */}
      <div className="min-h-[400px]">
        {activeSubTab === 'actifs' && (
          <Suspense fallback={<SubTabSkeleton />}>
            <TabPatrimoineReporting clientId={clientId} client={client} wealth={wealth} />
          </Suspense>
        )}
        {activeSubTab === 'budget' && (
          <Suspense fallback={<SubTabSkeleton />}>
            <TabBudgetComplet clientId={clientId} client={client} />
          </Suspense>
        )}
        {activeSubTab === 'fiscalite' && (
          <Suspense fallback={<SubTabSkeleton />}>
            <TabFiscaliteComplete clientId={clientId} client={client} />
          </Suspense>
        )}
        {activeSubTab === 'retraite' && (
          <Suspense fallback={<SubTabSkeleton />}>
            <TabRetraite clientId={clientId} client={client} />
          </Suspense>
        )}
        {activeSubTab === 'contrats' && (
          <Suspense fallback={<SubTabSkeleton />}>
            <TabContratsComplet clientId={clientId} client={client} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default TabPatrimoineUnified
