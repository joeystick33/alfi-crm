'use client'

/**
 * Client360ContainerV2 - Vue client simplifiée
 * 
 * Architecture épurée avec 6 tabs:
 * 1. Synthèse - Vue d'ensemble + KPIs
 * 2. Profil - Informations personnelles
 * 3. Patrimoine - Actifs/Passifs/Budget/Fiscalité/Retraite (sous-tabs)
 * 4. Documents - Tous les documents
 * 5. Projets - Objectifs + Opportunités
 * 6. Historique - Timeline des activités
 */

import { useState, useCallback, useEffect, Suspense, lazy } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/app/_common/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import {
  LayoutDashboard,
  User,
  Wallet,
  FolderOpen,
  Target,
  History,
  Settings,
} from 'lucide-react'

// Lazy load des tabs
const TabVueEnsemble = lazy(() => import('../client360/tabs/TabVueEnsemble').then(m => ({ default: m.TabVueEnsemble })))
const TabProfilFamille = lazy(() => import('../client360/tabs/TabProfilFamille').then(m => ({ default: m.TabProfilFamille })))
const TabPatrimoineUnified = lazy(() => import('./tabs/TabPatrimoineUnified'))
const TabDocumentsConformite = lazy(() => import('../client360/tabs/TabDocumentsConformite').then(m => ({ default: m.TabDocumentsConformite })))
const TabProjetsUnified = lazy(() => import('./tabs/TabProjetsUnified'))
const ActivityTimelineTab = lazy(() => import('./tabs/ActivityTimelineTab'))
const TabParametresComplet = lazy(() => import('../client360/tabs/TabParametresComplet').then(m => ({ default: m.TabParametresComplet })))

// Configuration des 6 tabs simplifiés
const TAB_CONFIG = [
  { id: 'synthese', label: 'Synthèse', icon: LayoutDashboard },
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'patrimoine', label: 'Patrimoine', icon: Wallet },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'projets', label: 'Projets', icon: Target },
  { id: 'historique', label: 'Historique', icon: History },
]

// Sous-onglets de patrimoine - pour redirection automatique
const PATRIMOINE_SUBTABS = ['actifs', 'budget', 'fiscalite', 'retraite', 'contrats']

// Sous-onglets de projets - pour redirection automatique
const PROJETS_SUBTABS = ['objectifs', 'opportunites']

// Sous-onglets de profil - pour redirection automatique
const PROFIL_SUBTABS = ['profil-famille', 'profil-contact', 'profil-professionnel', 'profil-kyc']

// =============================================================================
// Types
// =============================================================================

interface Client360ContainerV2Props {
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

export function Client360ContainerV2({
  clientId,
  client,
  wealth,
}: Client360ContainerV2Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // État du tab actif
  const [activeTab, setActiveTab] = useState<string>('synthese')

  // Sync avec URL - gérer les redirections de sous-onglets
  useEffect(() => {
    const tab = searchParams.get('tab')

    if (tab) {
      // Si le tab est un sous-onglet de patrimoine, rediriger vers patrimoine avec le subtab
      if (PATRIMOINE_SUBTABS.includes(tab)) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', 'patrimoine')
        params.set('subtab', tab)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        setActiveTab('patrimoine')
        // Si le tab est un sous-onglet de projets, rediriger vers projets avec le subtab
      } else if (PROJETS_SUBTABS.includes(tab)) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', 'projets')
        params.set('subtab', tab)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        setActiveTab('projets')
        // Si le tab est un sous-onglet de profil, rediriger vers profil avec le subtab
      } else if (PROFIL_SUBTABS.includes(tab)) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', 'profil')
        params.set('subtab', tab)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        setActiveTab('profil')
      } else if (TAB_CONFIG.some(t => t.id === tab)) {
        setActiveTab(tab)
      }
    }
  }, [searchParams, router, pathname])

  // Navigation par tab
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  return (
    <div className="space-y-6">
      {/* Navigation principale - thème clair cohérent avec le reste du CRM */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full h-auto p-1.5 bg-[#171936] border border-white/5 rounded-xl justify-start gap-1 shadow-lg shadow-black/20">
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
          {/* Bouton paramètres */}
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
            <TabVueEnsemble clientId={clientId} client={client} wealth={wealth} onTabChange={handleTabChange} />
          </Suspense>
        </TabsContent>

        <TabsContent value="profil" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabProfilFamille clientId={clientId} client={client} />
          </Suspense>
        </TabsContent>

        <TabsContent value="patrimoine" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabPatrimoineUnified clientId={clientId} client={client} wealth={wealth} />
          </Suspense>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabDocumentsConformite clientId={clientId} client={client} />
          </Suspense>
        </TabsContent>

        <TabsContent value="projets" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <TabProjetsUnified clientId={clientId} client={client} />
          </Suspense>
        </TabsContent>

        <TabsContent value="historique" className="mt-4">
          <Suspense fallback={<SectionSkeleton />}>
            <ActivityTimelineTab client={client} />
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

export default Client360ContainerV2
