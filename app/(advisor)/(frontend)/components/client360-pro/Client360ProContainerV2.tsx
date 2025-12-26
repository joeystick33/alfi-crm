'use client'

/**
 * Client360ProContainerV2 - Vue client professionnel harmonisée
 * 
 * Architecture alignée avec Client360ContainerV2 (particuliers) :
 * 6 onglets principaux + paramètres
 * 
 * 1. Synthèse - Vue d'ensemble entreprise + KPIs SIRENE
 * 2. Contacts - Interlocuteurs (dirigeants, DAF, DRH)
 * 3. Patrimoine Pro - Sous-tabs (Diagnostic, Épargne salariale, Protection, Financements, Immobilier)
 * 4. Documents - Kbis, statuts, bilans, contrats
 * 5. Opportunités - Cross-sell, alertes commerciales
 * 6. Activités - Historique des échanges
 */

import { useState, useCallback, useEffect, Suspense, lazy } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Badge } from '@/app/_common/components/ui/Badge'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import {
  LayoutDashboard,
  Users,
  Wallet,
  FolderOpen,
  Lightbulb,
  History,
  Settings,
  Building2,
} from 'lucide-react'

// Lazy load des tabs
const TabSyntheseEntreprise = lazy(() => import('./tabs/TabSyntheseEntreprise'))
const TabInterlocuteurs = lazy(() => import('./tabs/TabInterlocuteurs'))
const TabPatrimoineProUnified = lazy(() => import('./tabs/TabPatrimoineProUnified'))
const TabDocumentsPro = lazy(() => import('./tabs/TabDocumentsPro'))
const TabOpportunitesPro = lazy(() => import('./tabs/TabOpportunitesPro'))
const TabActivitesPro = lazy(() => import('./tabs/TabActivitesPro'))
const TabParametresComplet = lazy(() => import('../client360/tabs/TabParametresComplet').then(m => ({ default: m.TabParametresComplet })))

// Configuration des 6 tabs (alignée avec Client360ContainerV2)
const TAB_CONFIG = [
  { id: 'synthese', label: 'Synthèse', icon: LayoutDashboard },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'patrimoine', label: 'Patrimoine Pro', icon: Wallet },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'opportunites', label: 'Opportunités', icon: Lightbulb },
  { id: 'activites', label: 'Activités', icon: History },
]

// Sous-onglets de patrimoine pro - pour redirection automatique
const PATRIMOINE_SUBTABS = ['diagnostic', 'epargne-salariale', 'protection-sociale', 'financements', 'immobilier', 'patrimoine-financier']

// =============================================================================
// Types
// =============================================================================

interface Client360ProContainerV2Props {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
  onBack?: () => void
}

// =============================================================================
// Skeleton pour le chargement
// =============================================================================

function SectionSkeleton() {
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

// =============================================================================
// Composant Principal
// =============================================================================

export function Client360ProContainerV2({
  clientId,
  client,
  wealth,
}: Client360ProContainerV2Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // État du tab actif
  const [activeTab, setActiveTab] = useState<string>('synthese')

  // Sync avec URL - gérer les redirections de sous-onglets
  useEffect(() => {
    const tab = searchParams.get('tab')

    if (tab) {
      // Si le tab est un sous-onglet de patrimoine pro, rediriger vers patrimoine avec le subtab
      if (PATRIMOINE_SUBTABS.includes(tab)) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', 'patrimoine')
        params.set('subtab', tab)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        setActiveTab('patrimoine')
      } else if (TAB_CONFIG.some(t => t.id === tab) || tab === 'parametres') {
        setActiveTab(tab)
      }
    }
  }, [searchParams, router, pathname])

  // Navigation par tab
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    // Supprimer le subtab si on change de tab principal
    if (!PATRIMOINE_SUBTABS.includes(tab)) {
      params.delete('subtab')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  // Nom de la société pour l'affichage
  const companyName = client.companyName || `${client.firstName} ${client.lastName}`
  const siret = client.siret

  return (
    <div className="space-y-6">
      {/* Badge Dossier Professionnel */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 px-3 py-1.5">
          <Building2 className="w-4 h-4 mr-1.5" />
          Dossier Professionnel
        </Badge>
        <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
        {siret && (
          <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
            SIRET: {siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
          </span>
        )}
        {client.legalForm && (
          <Badge variant="outline" className="text-xs">
            {client.legalForm}
          </Badge>
        )}
      </div>

      {/* Navigation principale - MÊME STYLE que Client360ContainerV2 */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full h-auto p-1.5 bg-[#0f0f2d] border border-[#ffffff0d] rounded-xl justify-start gap-1 shadow-sm">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-[#7373FF] text-white font-semibold shadow-sm shadow-[#7373FF]/20'
                    : 'text-slate-400 hover:text-white hover:bg-[#ffffff0d] font-medium'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{tab.label}</span>
              </TabsTrigger>
            )
          })}
          {/* Bouton paramètres à droite */}
          <TabsTrigger
            value="parametres"
            className={cn(
              'flex items-center px-3 py-2.5 rounded-lg ml-auto transition-all duration-200',
              activeTab === 'parametres'
                ? 'bg-[#7373FF] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#ffffff0d]'
            )}
          >
            <Settings className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        {/* Contenu des tabs */}
        <TabsContent value="synthese" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabSyntheseEntreprise clientId={clientId} client={client} wealthSummary={wealth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabInterlocuteurs clientId={clientId} client={client} wealthSummary={wealth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="patrimoine" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabPatrimoineProUnified clientId={clientId} client={client} wealthSummary={wealth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabDocumentsPro clientId={clientId} client={client} wealthSummary={wealth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="opportunites" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabOpportunitesPro clientId={clientId} client={client} wealthSummary={wealth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="activites" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabActivitesPro clientId={clientId} client={client} wealthSummary={wealth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="parametres" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabParametresComplet clientId={clientId} client={client} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Client360ProContainerV2
