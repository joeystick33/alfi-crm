'use client'

/**
 * TabPatrimoineProUnified - Patrimoine Professionnel unifié avec sous-onglets
 * 
 * Regroupe en sous-tabs :
 * - Diagnostic (CA, effectifs, santé financière)
 * - Épargne Salariale (PEE, PERCO, PER Collectif)
 * - Protection Sociale (Santé, prévoyance, retraite collective)
 * - Financements (RC Pro, crédit-bail, prêts)
 * - Immobilier Pro (Locaux, SCI)
 */

import { useState, Suspense, lazy } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import {
  BarChart3,
  PiggyBank,
  Shield,
  Landmark,
  Building,
  TrendingUp,
} from 'lucide-react'

// Lazy load des sous-onglets (exports nommés)
const TabDiagnostic = lazy(() => import('./TabDiagnostic').then(m => ({ default: m.TabDiagnostic })))
const TabEpargneSalariale = lazy(() => import('./TabEpargneSalariale').then(m => ({ default: m.TabEpargneSalariale })))
const TabProtectionSociale = lazy(() => import('./TabProtectionSociale').then(m => ({ default: m.TabProtectionSociale })))
const TabFinancementsPro = lazy(() => import('./TabFinancementsPro').then(m => ({ default: m.TabFinancementsPro })))
const TabImmobilierPro = lazy(() => import('./TabImmobilierPro').then(m => ({ default: m.TabImmobilierPro })))
const TabPatrimoineFinancierPro = lazy(() => import('./TabPatrimoineFinancierPro').then(m => ({ default: m.TabPatrimoineFinancierPro })))

// Configuration des sous-onglets
const SUBTABS = [
  { id: 'diagnostic', label: 'Diagnostic', icon: BarChart3 },
  { id: 'epargne-salariale', label: 'Épargne Salariale', icon: PiggyBank },
  { id: 'protection-sociale', label: 'Protection', icon: Shield },
  { id: 'financements', label: 'Financements', icon: Landmark },
  { id: 'immobilier', label: 'Immobilier', icon: Building },
  { id: 'patrimoine-financier', label: 'Patrimoine Financier', icon: TrendingUp },
]

interface TabPatrimoineProUnifiedProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

function SubTabSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  )
}

export default function TabPatrimoineProUnified({ clientId, client, wealthSummary }: TabPatrimoineProUnifiedProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // Récupérer le sous-onglet depuis l'URL ou utiliser 'diagnostic' par défaut
  const initialSubtab = searchParams.get('subtab') || 'diagnostic'
  const [activeSubtab, setActiveSubtab] = useState(
    SUBTABS.some(t => t.id === initialSubtab) ? initialSubtab : 'diagnostic'
  )

  const handleSubtabChange = (subtab: string) => {
    setActiveSubtab(subtab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('subtab', subtab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const renderSubtabContent = () => {
    const commonProps = { clientId, client, wealthSummary }
    
    switch (activeSubtab) {
      case 'diagnostic':
        return <TabDiagnostic {...commonProps} />
      case 'epargne-salariale':
        return <TabEpargneSalariale {...commonProps} />
      case 'protection-sociale':
        return <TabProtectionSociale {...commonProps} />
      case 'financements':
        return <TabFinancementsPro {...commonProps} />
      case 'immobilier':
        return <TabImmobilierPro {...commonProps} />
      case 'patrimoine-financier':
        return <TabPatrimoineFinancierPro {...commonProps} />
      default:
        return <TabDiagnostic {...commonProps} />
    }
  }

  return (
    <div className="space-y-4">
      {/* Navigation sous-onglets - style pills comme Client360 particulier */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {SUBTABS.map((subtab) => {
          const Icon = subtab.icon
          const isActive = activeSubtab === subtab.id
          return (
            <button
              key={subtab.id}
              onClick={() => handleSubtabChange(subtab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-indigo-600' : 'text-gray-400')} />
              <span className="hidden sm:inline">{subtab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenu du sous-onglet actif */}
      <Suspense fallback={<SubTabSkeleton />}>
        {renderSubtabContent()}
      </Suspense>
    </div>
  )
}
