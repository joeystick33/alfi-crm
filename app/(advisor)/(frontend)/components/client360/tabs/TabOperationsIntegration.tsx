'use client'

/**
 * TabOperationsIntegration - Section Opérations intégrée dans Client 360
 * 
 * Affiche:
 * - Affaires en cours du client
 * - Portefeuille de contrats
 * - Historique des opérations
 * - Liens vers le module opérations
 * 
 * @requirements 20.2, 23.6 - Intégration opérations dans Client 360
 */

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn, formatCurrency, formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  useAffaires,
  useAffairesEnCours,
  useOperationsGestion,
  useOperationsStats,
} from '@/app/_common/hooks/api/use-operations-api'
import {
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Plus,
  FileText,
  Wallet,
  PiggyBank,
  Building,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  History,
} from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import Link from 'next/link'

// ============================================================================
// Types
// ============================================================================

interface TabOperationsIntegrationProps {
  clientId: string
  client: ClientDetail
  onTabChange?: (tabId: string) => void
}

// ============================================================================
// Constants
// ============================================================================

const AFFAIRE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  PROSPECT: { label: 'Prospect', color: 'bg-gray-100 text-gray-700', icon: Clock },
  QUALIFICATION: { label: 'Qualification', color: 'bg-blue-100 text-blue-700', icon: FileText },
  CONSTITUTION: { label: 'Constitution', color: 'bg-indigo-100 text-indigo-700', icon: FileText },
  SIGNATURE: { label: 'Signature', color: 'bg-purple-100 text-purple-700', icon: FileText },
  ENVOYE: { label: 'Envoyé', color: 'bg-cyan-100 text-cyan-700', icon: ArrowUpRight },
  EN_TRAITEMENT: { label: 'En traitement', color: 'bg-amber-100 text-amber-700', icon: Clock },
  VALIDE: { label: 'Validé', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  REJETE: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  ANNULE: { label: 'Annulé', color: 'bg-gray-100 text-gray-500', icon: AlertTriangle },
}

const PRODUCT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Wallet; color: string }> = {
  ASSURANCE_VIE: { label: 'Assurance Vie', icon: PiggyBank, color: 'text-emerald-600' },
  PER_INDIVIDUEL: { label: 'PER Individuel', icon: TrendingUp, color: 'text-blue-600' },
  PER_ENTREPRISE: { label: 'PER Entreprise', icon: Building, color: 'text-indigo-600' },
  SCPI: { label: 'SCPI', icon: Building, color: 'text-purple-600' },
  OPCI: { label: 'OPCI', icon: Building, color: 'text-violet-600' },
  COMPTE_TITRES: { label: 'Compte-titres', icon: Wallet, color: 'text-cyan-600' },
  PEA: { label: 'PEA', icon: TrendingUp, color: 'text-green-600' },
  PEA_PME: { label: 'PEA-PME', icon: TrendingUp, color: 'text-lime-600' },
  CAPITALISATION: { label: 'Capitalisation', icon: PiggyBank, color: 'text-amber-600' },
  FCPR: { label: 'FCPR', icon: TrendingUp, color: 'text-orange-600' },
  FCPI: { label: 'FCPI', icon: TrendingUp, color: 'text-red-600' },
  FIP: { label: 'FIP', icon: TrendingUp, color: 'text-rose-600' },
  IMMOBILIER_DIRECT: { label: 'Immobilier', icon: Building, color: 'text-stone-600' },
  CREDIT_IMMOBILIER: { label: 'Crédit Immo', icon: CreditCard, color: 'text-slate-600' },
}

const OPERATION_TYPE_CONFIG: Record<string, { label: string; icon: typeof ArrowUpRight }> = {
  VERSEMENT_COMPLEMENTAIRE: { label: 'Versement', icon: ArrowUpRight },
  ARBITRAGE: { label: 'Arbitrage', icon: Repeat },
  RACHAT_PARTIEL: { label: 'Rachat partiel', icon: ArrowDownRight },
  RACHAT_TOTAL: { label: 'Rachat total', icon: ArrowDownRight },
  AVANCE: { label: 'Avance', icon: CreditCard },
  MODIFICATION_BENEFICIAIRE: { label: 'Modif. bénéficiaire', icon: FileText },
  CHANGEMENT_OPTION_GESTION: { label: 'Changement option', icon: Repeat },
  TRANSFERT: { label: 'Transfert', icon: ArrowUpRight },
}

const INACTIVITY_COLOR: Record<string, string> = {
  RECENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  MODERATE: 'bg-amber-100 text-amber-700 border-amber-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}

// ============================================================================
// Component
// ============================================================================

export function TabOperationsIntegration({ clientId, client, onTabChange }: TabOperationsIntegrationProps) {
  const { toast } = useToast()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch operations data
  const { data: affairesData, isLoading: affairesLoading, refetch: refetchAffaires } = useAffaires(
    { clientId },
    { enabled: !!clientId }
  )
  
  const { data: affairesEnCoursData, isLoading: enCoursLoading, refetch: refetchEnCours } = useAffairesEnCours(
    { clientId },
    { enabled: !!clientId }
  )
  
  const { data: operationsData, isLoading: operationsLoading, refetch: refetchOperations } = useOperationsGestion(
    { clientId },
    { enabled: !!clientId }
  )
  
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useOperationsStats(
    { enabled: true }
  )

  const isLoading = affairesLoading || enCoursLoading || operationsLoading || statsLoading

  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    const affaires = affairesData?.data || []
    const validatedAffaires = affaires.filter(a => a.status === 'VALIDE')
    
    const totalValue = validatedAffaires.reduce((sum, a) => sum + (a.actualAmount || a.estimatedAmount || 0), 0)
    const byProductType = validatedAffaires.reduce((acc, a) => {
      const type = a.productType
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0 }
      }
      acc[type].count++
      acc[type].value += a.actualAmount || a.estimatedAmount || 0
      return acc
    }, {} as Record<string, { count: number; value: number }>)

    return {
      totalContracts: validatedAffaires.length,
      totalValue,
      byProductType,
    }
  }, [affairesData])

  // Get active affaires (not validated/rejected/cancelled)
  const activeAffaires = useMemo(() => {
    const affaires = affairesData?.data || []
    return affaires
      .filter(a => !['VALIDE', 'REJETE', 'ANNULE'].includes(a.status))
      .slice(0, 5)
  }, [affairesData])

  // Get affaires en cours with inactivity
  const affairesEnCours = useMemo(() => {
    return (affairesEnCoursData?.data || []).slice(0, 5)
  }, [affairesEnCoursData])

  // Get recent operations
  const recentOperations = useMemo(() => {
    return (operationsData?.data || []).slice(0, 5)
  }, [operationsData])

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refetchAffaires(),
        refetchEnCours(),
        refetchOperations(),
        refetchStats(),
      ])
      toast({ title: 'Données actualisées' })
    } catch {
      toast({ title: 'Erreur lors de l\'actualisation', variant: 'destructive' })
    } finally {
      setRefreshing(false)
    }
  }, [refetchAffaires, refetchEnCours, refetchOperations, refetchStats, toast])

  // Navigate to tab
  const navigateToTab = useCallback((tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    }
  }, [onTabChange])

  if (isLoading) {
    return <OperationsIntegrationSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary-600" />
            </div>
            Opérations
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">
            Affaires, contrats et opérations de gestion
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Actualiser
          </Button>
          <Link href={`/dashboard/operations/affaires-nouvelles/nouvelle?clientId=${clientId}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle affaire
            </Button>
          </Link>
        </div>
      </header>

      {/* Portfolio Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Portefeuille client</h3>
              <p className="text-sm text-gray-600 mt-1">
                {portfolioSummary.totalContracts} contrat{portfolioSummary.totalContracts > 1 ? 's' : ''} actif{portfolioSummary.totalContracts > 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(portfolioSummary.totalValue)}
              </p>
              <p className="text-sm text-gray-500">Encours total</p>
            </div>
          </div>

          {/* Product Type Breakdown */}
          {Object.keys(portfolioSummary.byProductType).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-200">
              {Object.entries(portfolioSummary.byProductType).slice(0, 4).map(([type, data]) => {
                const config = PRODUCT_TYPE_CONFIG[type] || { label: type, icon: Wallet, color: 'text-gray-600' }
                const Icon = config.icon
                
                return (
                  <div key={type} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                    <Icon className={cn("h-5 w-5", config.color)} />
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-gray-500">
                        {data.count} • {formatCurrency(data.value)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-blue-200">
            <Link href={`/dashboard/operations?clientId=${clientId}`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Dashboard Opérations
              </Button>
            </Link>
            <Link href={`/dashboard/operations/gestion/nouvelle?clientId=${clientId}`}>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Opération de gestion
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => navigateToTab('contrats')}>
              <FileText className="h-4 w-4 mr-2" />
              Voir les contrats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Active Affaires & En Cours */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Affaires */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Affaires en cours
                </CardTitle>
                <CardDescription>Affaires actives à suivre</CardDescription>
              </div>
              <Link href={`/dashboard/operations/affaires-nouvelles?clientId=${clientId}`}>
                <Button variant="ghost" size="sm">
                  Voir toutes <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeAffaires.length > 0 ? (
              <div className="space-y-3">
                {activeAffaires.map((affaire) => {
                  const statusConfig = AFFAIRE_STATUS_CONFIG[affaire.status] || AFFAIRE_STATUS_CONFIG.PROSPECT
                  const productConfig = PRODUCT_TYPE_CONFIG[affaire.productType] || { label: affaire.productType, icon: Wallet, color: 'text-gray-600' }
                  const ProductIcon = productConfig.icon
                  
                  return (
                    <Link
                      key={affaire.id}
                      href={`/dashboard/operations/affaires-nouvelles/${affaire.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <ProductIcon className={cn("h-5 w-5", productConfig.color)} />
                          <div>
                            <p className="font-medium text-sm">{affaire.reference}</p>
                            <p className="text-xs text-gray-500">{productConfig.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(affaire.estimatedAmount)}
                          </span>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune affaire en cours</p>
                <Link href={`/dashboard/operations/affaires-nouvelles/nouvelle?clientId=${clientId}`}>
                  <Button size="sm" variant="outline" className="mt-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une affaire
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affaires En Cours (Inactive) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  À reprendre
                </CardTitle>
                <CardDescription>Affaires nécessitant une action</CardDescription>
              </div>
              <Link href={`/dashboard/operations/en-cours?clientId=${clientId}`}>
                <Button variant="ghost" size="sm">
                  Voir toutes <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {affairesEnCours.length > 0 ? (
              <div className="space-y-3">
                {affairesEnCours.map((affaire) => {
                  const inactivityColor = INACTIVITY_COLOR[affaire.inactivityCategory] || INACTIVITY_COLOR.RECENT
                  
                  return (
                    <Link
                      key={affaire.id}
                      href={`/dashboard/operations/affaires-nouvelles/${affaire.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{affaire.reference}</p>
                          <p className="text-xs text-gray-500">
                            {affaire.daysSinceActivity} jours d'inactivité
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {affaire.missingDocumentsCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {affaire.missingDocumentsCount} doc{affaire.missingDocumentsCount > 1 ? 's' : ''} manquant{affaire.missingDocumentsCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge className={inactivityColor}>
                            {affaire.daysSinceActivity}j
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune affaire à reprendre</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Opérations de gestion récentes
              </CardTitle>
              <CardDescription>Dernières opérations sur les contrats</CardDescription>
            </div>
            <Link href={`/dashboard/operations/gestion?clientId=${clientId}`}>
              <Button variant="ghost" size="sm">
                Voir toutes <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOperations.length > 0 ? (
            <div className="space-y-3">
              {recentOperations.map((operation) => {
                const typeConfig = OPERATION_TYPE_CONFIG[operation.type] || { label: operation.type, icon: FileText }
                const TypeIcon = typeConfig.icon
                
                return (
                  <Link
                    key={operation.id}
                    href={`/dashboard/operations/gestion/${operation.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-sm">{operation.reference}</p>
                          <p className="text-xs text-gray-500">{typeConfig.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {operation.amount && (
                          <span className="text-sm font-medium">
                            {formatCurrency(operation.amount)}
                          </span>
                        )}
                        <Badge variant="outline">{operation.status}</Badge>
                        <span className="text-xs text-gray-400">
                          {formatDate(operation.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune opération de gestion</p>
              <Link href={`/dashboard/operations/gestion/nouvelle?clientId=${clientId}`}>
                <Button size="sm" variant="outline" className="mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle opération
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function OperationsIntegrationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default TabOperationsIntegration
