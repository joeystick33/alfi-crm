'use client'

/**
 * Client 360 PRO Container - Dossier Client Professionnel
 * 
 * Interface pour CGP/Banquier privé travaillant avec des entreprises clientes
 * 
 * Structure adaptée aux besoins métier :
 * 1. Fiche Entreprise - Données SIRENE, forme juridique, dirigeants
 * 2. Interlocuteurs - Contacts clés (DG, DAF, DRH)
 * 3. Diagnostic - CA, effectifs, masse salariale, santé financière
 * 4. Épargne Salariale - PEE, PERCO, PER Collectif, intéressement
 * 5. Protection Sociale - Santé collective, prévoyance, retraite
 * 6. Financements Pro - RC Pro, crédit-bail, prêts, affacturage
 * 7. Immobilier Pro - Locaux, SCI, investissements
 * 8. Documents - Kbis, statuts, bilans, contrats
 * 9. Opportunités - Cross-sell, alertes commerciales
 * 10. Activités - Historique des échanges
 */

import { useState, useCallback, Suspense, lazy } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Badge } from '@/app/_common/components/ui/Badge'
import { 
  Building2, 
  Users, 
  BarChart3,
  PiggyBank, 
  Shield, 
  Landmark,
  Building,
  FolderOpen, 
  Lightbulb, 
  History,
  TrendingUp,
} from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import { Client360ErrorBoundary } from '../client360/Client360ErrorBoundary'
import { TabGenericSkeleton } from '../client360/skeletons/TabSkeleton'

// Lazy load des onglets spécifiques PRO
const TabFicheEntreprise = lazy(() => import('./tabs/TabFicheEntreprise'))
const TabInterlocuteurs = lazy(() => import('./tabs/TabInterlocuteurs'))
const TabDiagnostic = lazy(() => import('./tabs/TabDiagnostic'))
const TabEpargneSalariale = lazy(() => import('./tabs/TabEpargneSalariale'))
const TabProtectionSociale = lazy(() => import('./tabs/TabProtectionSociale'))
const TabFinancementsPro = lazy(() => import('./tabs/TabFinancementsPro'))
const TabImmobilierPro = lazy(() => import('./tabs/TabImmobilierPro'))
const TabPatrimoineFinancierPro = lazy(() => import('./tabs/TabPatrimoineFinancierPro'))
const TabDocumentsPro = lazy(() => import('./tabs/TabDocumentsPro'))
const TabOpportunitesPro = lazy(() => import('./tabs/TabOpportunitesPro'))
const TabActivitesPro = lazy(() => import('./tabs/TabActivitesPro'))

// Configuration des onglets
interface TabConfig {
  id: string
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string
}

export const CLIENT360_PRO_TAB_CONFIG: TabConfig[] = [
  { 
    id: 'fiche-entreprise', 
    label: 'Fiche Entreprise', 
    shortLabel: 'Entreprise',
    icon: Building2,
    description: 'Données légales, SIRENE, dirigeants, forme juridique',
    badge: 'SIRENE'
  },
  { 
    id: 'interlocuteurs', 
    label: 'Interlocuteurs', 
    shortLabel: 'Contacts',
    icon: Users,
    description: 'Dirigeant, DAF, DRH, contacts clés'
  },
  { 
    id: 'diagnostic', 
    label: 'Diagnostic', 
    shortLabel: 'Diagnostic',
    icon: BarChart3,
    description: 'CA, effectifs, masse salariale, santé financière'
  },
  { 
    id: 'epargne-salariale', 
    label: 'Épargne Salariale', 
    shortLabel: 'Épargne',
    icon: PiggyBank,
    description: 'PEE, PERCO, PER Collectif, intéressement, participation'
  },
  { 
    id: 'protection-sociale', 
    label: 'Protection Sociale', 
    shortLabel: 'Protection',
    icon: Shield,
    description: 'Santé collective, prévoyance, retraite collective'
  },
  { 
    id: 'financements', 
    label: 'Financements Pro', 
    shortLabel: 'Financements',
    icon: Landmark,
    description: 'RC Pro, crédit-bail, prêts, affacturage'
  },
  { 
    id: 'immobilier', 
    label: 'Immobilier Pro', 
    shortLabel: 'Immobilier',
    icon: Building,
    description: 'Locaux professionnels, SCI, investissements'
  },
  { 
    id: 'patrimoine-financier', 
    label: 'Patrimoine Financier', 
    shortLabel: 'Financier',
    icon: TrendingUp,
    description: 'Placements de trésorerie, contrats de capitalisation'
  },
  { 
    id: 'documents', 
    label: 'Documents', 
    shortLabel: 'Documents',
    icon: FolderOpen,
    description: 'Kbis, statuts, bilans, contrats'
  },
  { 
    id: 'opportunites', 
    label: 'Opportunités', 
    shortLabel: 'Opportunités',
    icon: Lightbulb,
    description: 'Détection cross-sell, alertes commerciales'
  },
  { 
    id: 'activites', 
    label: 'Activités', 
    shortLabel: 'Activités',
    icon: History,
    description: 'Historique des échanges et actions'
  },
]

interface Client360ProContainerProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function Client360ProContainer({ clientId, client, wealthSummary }: Client360ProContainerProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && CLIENT360_PRO_TAB_CONFIG.some(t => t.id === urlTab)) {
      return urlTab
    }
    return 'fiche-entreprise'
  })
  
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['fiche-entreprise']))

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    setLoadedTabs(prev => new Set([...prev, tab]))
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  const renderTabContent = useCallback((tabId: string) => {
    if (!loadedTabs.has(tabId) && tabId !== activeTab) {
      return null
    }

    const commonProps = { clientId, client, wealthSummary }

    switch (tabId) {
      case 'fiche-entreprise':
        return <TabFicheEntreprise {...commonProps} />
      case 'interlocuteurs':
        return <TabInterlocuteurs {...commonProps} />
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
      case 'documents':
        return <TabDocumentsPro {...commonProps} />
      case 'opportunites':
        return <TabOpportunitesPro {...commonProps} />
      case 'activites':
        return <TabActivitesPro {...commonProps} />
      default:
        return <div className="p-4 text-gray-500">Onglet non disponible</div>
    }
  }, [clientId, client, wealthSummary, loadedTabs, activeTab])

  return (
    <div className="w-full">
      {/* En-tête Client PRO */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <Badge className="bg-[#7373FF]/15 text-indigo-800 border-[#7373FF]/30 px-3 py-1">
          <Building2 className="w-4 h-4 mr-1.5" />
          Dossier Professionnel
        </Badge>
        {client.companyName && (
          <span className="text-lg font-semibold text-gray-900">{client.companyName}</span>
        )}
        {client.siret && (
          <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
            SIRET: {client.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
          </span>
        )}
        {client.legalForm && (
          <Badge variant="outline" className="text-xs">
            {client.legalForm}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {/* Navigation */}
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex items-center gap-0.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
            {CLIENT360_PRO_TAB_CONFIG.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-[#5c5ce6] shadow-sm border border-indigo-100' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }
                  `}
                  title={tab.description}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#7373FF]' : 'text-gray-400'}`} />
                  <span className="hidden lg:inline">{tab.shortLabel}</span>
                  {tab.badge && isActive && (
                    <Badge variant="outline" className="ml-1 text-xs py-0 px-1.5 hidden xl:inline-flex">
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* Contenu */}
        {CLIENT360_PRO_TAB_CONFIG.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <Client360ErrorBoundary>
              <Suspense fallback={<TabGenericSkeleton />}>
                {renderTabContent(tab.id)}
              </Suspense>
            </Client360ErrorBoundary>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default Client360ProContainer
