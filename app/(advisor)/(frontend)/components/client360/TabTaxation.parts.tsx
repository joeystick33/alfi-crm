/**
 * TabTaxation.parts - Hooks, constantes et sous-composants
 * Partie 2/2 de TabTaxation
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Separator } from '@/app/_common/components/ui/Separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import {
  Calculator,
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  Target,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ============================================================================
// Types exportés
// ============================================================================

export interface TaxationData {
  id?: string
  anneeFiscale: number
  incomeTax?: {
    fiscalReferenceIncome: number
    taxShares: number
    quotientFamilial: number
    taxBracket: number
    annualAmount: number
    monthlyPayment: number
    taxCredits: number
    taxReductions: number
  }
  ifi?: {
    taxableRealEstateAssets: number
    deductibleLiabilities: number
    netTaxableIFI: number
    ifiAmount: number
    bracket: string
    threshold: number
  }
  socialContributions?: {
    taxableAssetIncome: number
    rate: number
    amount: number
  }
}

export interface TaxOptimization {
  id: string
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE'
  category: string
  title: string
  description: string
  potentialSavings?: number
  recommendation: string
  status: 'DETECTEE' | 'DETECTEE' | 'EN_COURS' | 'TERMINE' | 'REJETEE'
  reviewedAt?: Date
  completedAt?: Date
  dismissedAt?: Date
  createdAt: Date
}

// ============================================================================
// Constantes exportées
// ============================================================================

export const TAX_BRACKETS_2024 = [
  { limit: 11294, rate: 0, label: '0 - 11 294 €', color: '#e5e7eb' },
  { limit: 28797, rate: 11, label: '11 294 - 28 797 €', color: '#bfdbfe' },
  { limit: 82341, rate: 30, label: '28 797 - 82 341 €', color: '#93c5fd' },
  { limit: 177106, rate: 41, label: '82 341 - 177 106 €', color: '#60a5fa' },
  { limit: Infinity, rate: 45, label: '> 177 106 €', color: '#3b82f6' },
]

export const IFI_BRACKETS_2024 = [
  { limit: 800000, rate: 0, label: '< 800 000 €' },
  { limit: 1300000, rate: 0, label: '800k - 1.3M €' },
  { limit: 1400000, rate: 0.5, label: '1.3M - 1.4M €' },
  { limit: 2570000, rate: 0.7, label: '1.4M - 2.57M €' },
  { limit: 5000000, rate: 1, label: '2.57M - 5M €' },
  { limit: 10000000, rate: 1.25, label: '5M - 10M €' },
  { limit: Infinity, rate: 1.5, label: '> 10M €' },
]

export const STATUS_CONFIG = {
  DETECTED: {
    label: 'Détectée',
    icon: Lightbulb,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  REVIEWED: {
    label: 'Revue',
    icon: CheckCircle2,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  EN_COURS: {
    label: 'En cours',
    icon: Clock,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  TERMINE: {
    label: 'Réalisée',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  DISMISSED: {
    label: 'Écartée',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

export const PRIORITY_CONFIG = {
  HAUTE: {
    label: 'Haute',
    dotColor: 'bg-red-500',
    textColor: 'text-red-600',
  },
  MOYENNE: {
    label: 'Moyenne',
    dotColor: 'bg-orange-500',
    textColor: 'text-orange-600',
  },
  BASSE: {
    label: 'Basse',
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-600',
  },
}

// ============================================================================
// Custom Hooks
// ============================================================================

export function useTaxationData(clientId: string) {
  const [taxation, setTaxation] = useState<TaxationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadTaxation() {
    try {
      setError(null)
      const res = await fetch(`/api/advisor/clients/${clientId}/taxation`)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur chargement')
      }

      const data = await res.json()
      // Handle null data gracefully - return default structure
      if (!data.data) {
        setTaxation({ 
          anneeFiscale: new Date().getFullYear(),
          incomeTax: undefined,
          ifi: undefined,
          socialContributions: undefined
        })
      } else {
        setTaxation(data.data)
      }
    } catch (error) {
      console.error('Erreur chargement taxation:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
      // Set default data on error
      setTaxation({ 
        anneeFiscale: new Date().getFullYear(),
        incomeTax: undefined,
        ifi: undefined,
        socialContributions: undefined
      })
    }
  }

  return { taxation, error, loadTaxation }
}

export function useTaxationCalculations(clientId: string) {
  async function calculateTax() {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/taxation/calculations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalReferenceIncome: 50000,
          netTaxableWealth: 1500000,
          taxableAssetIncome: 10000,
        }),
      })

      if (!res.ok) throw new Error('Erreur calcul')

      const data = await res.json()
      return data
    } catch (error) {
      console.error('Erreur calcul fiscal:', error)
      return null
    }
  }

  return { calculateTax }
}

export function useTaxOptimizations(clientId: string) {
  const [optimizations, setOptimizations] = useState<TaxOptimization[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  async function loadOptimizations() {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterPriority !== 'all') params.append('priority', filterPriority)

      const res = await fetch(
        `/api/advisor/clients/${clientId}/tax-optimizations?${params}`
      )
      if (!res.ok) throw new Error('Erreur chargement optimisations')

      const data = await res.json()
      setOptimizations(data.data || [])
    } catch (error) {
      console.error('Erreur chargement optimisations:', error)
    }
  }

  async function updateOptimizationStatus(optimizationId: string, status: string) {
    try {
      const res = await fetch(
        `/api/advisor/clients/${clientId}/tax-optimizations/${optimizationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      )

      if (!res.ok) throw new Error('Erreur mise à jour')

      await loadOptimizations()
    } catch (error) {
      console.error('Erreur update optimisation:', error)
    }
  }

  const filteredOptimizations = useMemo(() => {
    return optimizations.filter((opt) => {
      if (filterStatus !== 'all' && opt.status !== filterStatus) return false
      if (filterPriority !== 'all' && opt.priority !== filterPriority) return false
      return true
    })
  }, [optimizations, filterStatus, filterPriority])

  return {
    optimizations,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filteredOptimizations,
    loadOptimizations,
    updateOptimizationStatus,
  }
}

// ============================================================================
// Composants Sections
// ============================================================================

export function TaxIRSection({ taxation }: { taxation: TaxationData | null }) {
  const taxBreakdownData = useMemo(() => {
    if (!taxation?.incomeTax) return []
    const { annualAmount, taxCredits, taxReductions } = taxation.incomeTax
    return [
      { name: 'IR brut', value: annualAmount, color: '#3b82f6' },
      { name: 'Crédits', value: taxCredits, color: '#10b981' },
      { name: 'Réductions', value: taxReductions, color: '#8b5cf6' },
      {
        name: 'IR net',
        value: annualAmount - taxCredits - taxReductions,
        color: '#ef4444',
      },
    ]
  }, [taxation])

  if (!taxation?.incomeTax) {
    return (
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-8 text-center">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Aucune donnée fiscale. Cliquez sur "Calculer" pour obtenir une estimation.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barème progressif */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Barème progressif 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TAX_BRACKETS_2024.map((bracket, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  taxation.incomeTax?.taxBracket === bracket.rate
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bracket.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{bracket.label}</span>
                </div>
                <Badge className="text-xs bg-white border border-gray-300 text-gray-700">
                  {bracket.rate}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Détail IR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Calcul détaillé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Revenu fiscal référence :</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(taxation.incomeTax.fiscalReferenceIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Nombre de parts :</span>
              <span className="font-semibold text-gray-900">
                {taxation.incomeTax.taxShares}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Quotient familial :</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(taxation.incomeTax.quotientFamilial)}
              </span>
            </div>
            <Separator className="bg-gray-200" />
            <div className="flex justify-between text-lg">
              <span className="text-gray-900 font-semibold">IR annuel :</span>
              <span className="text-blue-600 font-bold">
                {formatCurrency(taxation.incomeTax.annualAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Prélèvement mensuel :</span>
              <span className="text-gray-900">
                {formatCurrency(taxation.incomeTax.monthlyPayment)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Graphique répartition */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Répartition IR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taxBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => entry.name}
                >
                  {taxBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function TaxIFISection({ taxation }: { taxation: TaxationData | null }) {
  const ifiBreakdownData = useMemo(() => {
    if (!taxation?.ifi) return []
    const { taxableRealEstateAssets, deductibleLiabilities, netTaxableIFI } = taxation.ifi
    return [
      { name: 'Patrimoine brut', value: taxableRealEstateAssets },
      { name: 'Dettes déductibles', value: -deductibleLiabilities },
      { name: 'Net taxable', value: netTaxableIFI },
    ]
  }, [taxation])

  if (!taxation?.ifi) {
    return (
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Aucune donnée IFI. Le patrimoine net taxable est en dessous du seuil
            d'assujettissement.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerte IFI */}
      {taxation.ifi.netTaxableIFI > taxation.ifi.threshold && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <AlertDescription className="ml-2">
            <div className="font-medium text-orange-900">Assujetti à l'IFI</div>
            <div className="text-sm text-orange-700 mt-1">
              Patrimoine net taxable supérieur au seuil de{' '}
              {formatCurrency(taxation.ifi.threshold)}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calcul IFI */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Calcul IFI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Patrimoine immobilier brut :</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(taxation.ifi.taxableRealEstateAssets)}
              </span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Dettes déductibles :</span>
              <span className="font-semibold">
                - {formatCurrency(taxation.ifi.deductibleLiabilities)}
              </span>
            </div>
            <Separator className="bg-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-900 font-semibold">Patrimoine net taxable :</span>
              <span className="text-purple-600 font-bold">
                {formatCurrency(taxation.ifi.netTaxableIFI)}
              </span>
            </div>
            <Separator className="bg-gray-200" />
            <div className="flex justify-between text-lg">
              <span className="text-gray-900 font-semibold">IFI dû :</span>
              <span className="text-red-600 font-bold">
                {formatCurrency(taxation.ifi.ifiAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Graphique IFI */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Composition patrimoine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ifiBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function TaxOptimizationsSection({
  optimizations,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  updateOptimizationStatus,
}: {
  optimizations: TaxOptimization[]
  filterStatus: string
  setFilterStatus: (status: string) => void
  filterPriority: string
  setFilterPriority: (priority: string) => void
  updateOptimizationStatus: (id: string, status: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-white border-gray-300">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="DETECTED">Détectées</SelectItem>
            <SelectItem value="REVIEWED">Revues</SelectItem>
            <SelectItem value="IN_PROGRESS">En cours</SelectItem>
            <SelectItem value="COMPLETED">Réalisées</SelectItem>
            <SelectItem value="DISMISSED">Écartées</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px] bg-white border-gray-300">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            <SelectItem value="HIGH">Haute</SelectItem>
            <SelectItem value="MEDIUM">Moyenne</SelectItem>
            <SelectItem value="LOW">Basse</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-gray-600 ml-auto">
          {optimizations.length} optimisation(s)
        </span>
      </div>

      {/* Liste optimisations */}
      {optimizations.length > 0 ? (
        optimizations.map((opt) => {
          const statusConfig = STATUS_CONFIG[opt.status]
          const priorityConfig = PRIORITY_CONFIG[opt.priority]
          const StatusIcon = statusConfig.icon

          return (
            <Card key={opt.id} className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={cn('w-3 h-3 rounded-full mt-1', priorityConfig.dotColor)}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={cn('text-xs border', statusConfig.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <span className={cn('text-xs font-medium', priorityConfig.textColor)}>
                        {priorityConfig.label}
                      </span>
                      <span className="text-xs text-gray-500">{opt.category}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{opt.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{opt.description}</p>
                    {opt.potentialSavings && (
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded mb-2">
                        <Target className="w-4 h-4" />
                        Économie potentielle : {formatCurrency(opt.potentialSavings)}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded mt-2">
                      💡 {opt.recommendation}
                    </div>
                    {opt.status === 'DETECTEE' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOptimizationStatus(opt.id, 'DETECTEE')}
                          className="text-xs border-gray-300"
                        >
                          Marquer comme revue
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOptimizationStatus(opt.id, 'EN_COURS')}
                          className="text-xs border-gray-300"
                        >
                          Mettre en cours
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      ) : (
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-8 text-center">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Aucune optimisation fiscale détectée pour le moment. Utilisez l'outil de calcul pour
              découvrir des opportunités d'optimisation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
