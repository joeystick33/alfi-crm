'use client'

/**
 * TabProjetsUnified - Vue projets unifiée
 * 
 * Regroupe en sous-tabs:
 * - Objectifs
 * - Opportunités
 */

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import { Target, Lightbulb } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'

// Lazy load des sous-composants existants
const TabObjectifsProjets = lazy(() => import('../../client360/tabs/TabObjectifsProjets').then(m => ({ default: m.TabObjectifsProjets })))
const TabOpportunitesComplet = lazy(() => import('../../client360/tabs/TabOpportunitesComplet').then(m => ({ default: m.TabOpportunitesComplet })))

// Sous-tabs configuration
const SUB_TABS = [
  { id: 'objectifs', label: 'Objectifs', icon: Target },
  { id: 'opportunites', label: 'Opportunités', icon: Lightbulb },
]

interface TabProjetsUnifiedProps {
  clientId: string
  client: ClientDetail
}

function SubTabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-100 rounded-lg" />
      <div className="h-48 bg-gray-100 rounded-lg" />
    </div>
  )
}

export function TabProjetsUnified({ clientId, client }: TabProjetsUnifiedProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // État synchronisé avec URL
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const subTab = searchParams.get('subtab')
    if (subTab && SUB_TABS.some(t => t.id === subTab)) return subTab
    return 'objectifs'
  })

  // Sync avec URL
  useEffect(() => {
    const subTab = searchParams.get('subtab')
    if (subTab && SUB_TABS.some(t => t.id === subTab)) {
      setActiveSubTab(subTab)
    }
  }, [searchParams])

  // Navigation avec URL
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
        {activeSubTab === 'objectifs' && (
          <Suspense fallback={<SubTabSkeleton />}>
            <TabObjectifsProjets clientId={clientId} client={client} />
          </Suspense>
        )}
        {activeSubTab === 'opportunites' && (
          <Suspense fallback={<SubTabSkeleton />}>
            <TabOpportunitesComplet clientId={clientId} client={client} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default TabProjetsUnified
