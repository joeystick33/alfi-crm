'use client'

/**
 * TabSynthese - Onglet Synthèse du Client 360
 * 
 * Affiche une vue consolidée de la situation client:
 * - Patrimoine (brut, net, répartition)
 * - Budget (revenus, charges, capacité d'épargne)
 * - Objectifs et projets
 * - Indicateurs clés
 * - Alertes
 * 
 * Design: Thème light solid (pas de glassmorphism)
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Progress } from '@/app/_common/components/ui/Progress'
import { useToast } from '@/app/_common/hooks/use-toast'
import { useFeatureAccess } from '@/app/_common/hooks/use-feature-access'
import { formatLabel } from '@/app/_common/lib/labels'
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Home,
  Briefcase,
  PiggyBank,
  AlertTriangle,
  AlertCircle,
  Info,
  Target,
  Calendar,
  Lock,
  BarChart3,
  Loader2,
  Building2,
  Coins,
  CreditCard,
  Sparkles,
  FileDown,
} from 'lucide-react'
import { generateSynthesisPDFContent, openSynthesisReportForPrint } from '@/app/_common/lib/services/synthesis-export-service'

// =============================================================================
// Types (importés du service)
// =============================================================================

interface PatrimoineSummary {
  patrimoineBrut: number
  patrimoineNet: number
  totalActifs: number
  totalPassifs: number
  repartition: {
    immobilier: number
    financier: number
    professionnel: number
    autre: number
  }
  repartitionPourcentage: {
    immobilier: number
    financier: number
    professionnel: number
    autre: number
  }
  actifsGeres: number
  actifsNonGeres: number
  tauxGestion: number
}

interface BudgetSummary {
  revenusMensuels: number
  revenusAnnuels: number
  chargesMensuelles: number
  chargesAnnuelles: number
  capaciteEpargneMensuelle: number
  capaciteEpargneAnnuelle: number
  tauxEpargne: number
  mensualitesCredits: number
  tauxEndettement: number
  resteAVivre: number
}

interface ObjectifSummary {
  id: string
  name: string
  type: string
  priority: string
  targetAmount: number
  currentAmount: number
  progress: number
  targetDate: Date | null
  daysRemaining: number | null
  status: 'ON_TRACK' | 'AT_RISK' | 'EN_RETARD' | 'TERMINE'
}

interface ProjetSummary {
  id: string
  name: string
  type: string
  status: string
  budget: number
  startDate: Date | null
  endDate: Date | null
}

interface AlerteSynthese {
  id: string
  type: 'CRITIQUE' | 'WARNING' | 'INFO'
  category: string
  message: string
  recommendation: string
  value?: number
  threshold?: number
}

interface IndicateurCle {
  id: string
  name: string
  value: number | string
  unit?: string
  trend?: 'UP' | 'DOWN' | 'STABLE'
  status: 'GOOD' | 'WARNING' | 'CRITIQUE' | 'NEUTRAL'
  description?: string
  isPremium: boolean
  estimatedValue?: number
}

interface ClientSynthesis {
  clientId: string
  clientName: string
  calculatedAt: Date
  patrimoine: PatrimoineSummary
  budget: BudgetSummary
  objectifs: ObjectifSummary[]
  projets: ProjetSummary[]
  alertes: AlerteSynthese[]
  indicateurs: IndicateurCle[]
  lastPatrimoineUpdate: Date | null
  lastBudgetUpdate: Date | null
  dataCompleteness: number
}

// =============================================================================
// Props
// =============================================================================

interface TabSyntheseProps {
  clientId: string
  clientName?: string
}

// =============================================================================
// Helpers
// =============================================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value: number) => {
  return `${Math.round(value)}%`
}

const formatDate = (date: Date | string | null) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// =============================================================================
// Composant principal
// =============================================================================

export function TabSynthese({ clientId }: TabSyntheseProps) {
  const { toast } = useToast()
  const featureAccess = useFeatureAccess()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [synthesis, setSynthesis] = useState<ClientSynthesis | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Charger la synthèse
  useEffect(() => {
    loadSynthesis()
     
  }, [clientId])
  
  const loadSynthesis = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    
    try {
      const response = await fetch(`/api/advisor/synthesis/${clientId}`, {
        method: forceRefresh ? 'POST' : 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la synthèse')
      }
      
      const data = await response.json()
      setSynthesis(data.data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  // Chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Calcul de la synthèse...</span>
      </div>
    )
  }
  
  // Erreur
  if (error || !synthesis) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Erreur de chargement</h3>
        <p className="text-gray-500 mt-2">{error || 'Impossible de charger la synthèse'}</p>
        <Button className="mt-4" onClick={() => loadSynthesis()}>
          Réessayer
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Synthèse</h2>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {formatDate(synthesis.calculatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Complétude : {synthesis.dataCompleteness}%
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSynthesis(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (synthesis) {
                const html = generateSynthesisPDFContent(synthesis, {
                  cabinetName: 'Aura Cabinet',
                  includeDisclaimer: true,
                })
                openSynthesisReportForPrint(html)
              }
            }}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>
      
      {/* Alertes */}
      {synthesis.alertes.length > 0 && (
        <AlertesSection alertes={synthesis.alertes} />
      )}
      
      {/* Patrimoine */}
      <PatrimoineSection patrimoine={synthesis.patrimoine} />
      
      {/* Budget */}
      <BudgetSection budget={synthesis.budget} />
      
      {/* Indicateurs clés */}
      <IndicateursSection 
        indicateurs={synthesis.indicateurs} 
        hasAccess={featureAccess.hasAccess}
      />
      
      {/* Objectifs et Projets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ObjectifsSection objectifs={synthesis.objectifs} />
        <ProjetsSection projets={synthesis.projets} />
      </div>
    </div>
  )
}

// =============================================================================
// Sous-composants
// =============================================================================

function AlertesSection({ alertes }: { alertes: AlerteSynthese[] }) {
  const getAlertStyle = (type: AlerteSynthese['type']) => {
    switch (type) {
      case 'CRITIQUE':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'WARNING':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'INFO':
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }
  
  const getAlertIcon = (type: AlerteSynthese['type']) => {
    switch (type) {
      case 'CRITIQUE':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }
  
  return (
    <div className="space-y-2">
      {alertes.map((alerte) => (
        <div
          key={alerte.id}
          className={`flex items-start gap-3 p-4 rounded-lg border ${getAlertStyle(alerte.type)}`}
        >
          {getAlertIcon(alerte.type)}
          <div className="flex-1">
            <p className="font-medium">{alerte.message}</p>
            <p className="text-sm opacity-80 mt-1">{alerte.recommendation}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatLabel(alerte.category)}
          </Badge>
        </div>
      ))}
    </div>
  )
}

function PatrimoineSection({ patrimoine }: { patrimoine: PatrimoineSummary }) {
  const categories = [
    { key: 'immobilier', label: 'Immobilier', icon: Home, color: 'bg-blue-500' },
    { key: 'financier', label: 'Financier', icon: PiggyBank, color: 'bg-green-500' },
    { key: 'professionnel', label: 'Professionnel', icon: Briefcase, color: 'bg-purple-500' },
    { key: 'autre', label: 'Autre', icon: Wallet, color: 'bg-gray-500' },
  ]
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle>Patrimoine</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Métriques principales */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Patrimoine Brut</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(patrimoine.patrimoineBrut)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Passifs</p>
            <p className="text-2xl font-bold text-red-600">
              - {formatCurrency(patrimoine.totalPassifs)}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Patrimoine Net</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(patrimoine.patrimoineNet)}
            </p>
          </div>
        </div>
        
        {/* Répartition */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Répartition par catégorie</h4>
          {categories.map(({ key, label, icon: Icon, color }) => {
            const value = patrimoine.repartition[key as keyof typeof patrimoine.repartition]
            const percent = patrimoine.repartitionPourcentage[key as keyof typeof patrimoine.repartitionPourcentage]
            
            if (value === 0) return null
            
            return (
              <div key={key} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color.replace('500', '50')}`}>
                  <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(value)} ({formatPercent(percent)})
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Actifs gérés */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Actifs gérés par le cabinet</span>
            <span className="font-medium">
              {formatCurrency(patrimoine.actifsGeres)} ({formatPercent(patrimoine.tauxGestion)})
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BudgetSection({ budget }: { budget: BudgetSummary }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-green-600" />
          <CardTitle>Budget mensuel</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenus */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Revenus</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(budget.revenusMensuels)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {formatCurrency(budget.revenusAnnuels)}/an
            </p>
          </div>
          
          {/* Charges */}
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Charges</span>
            </div>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(budget.chargesMensuelles)}
            </p>
            <p className="text-xs text-red-600 mt-1">
              dont crédits: {formatCurrency(budget.mensualitesCredits)}
            </p>
          </div>
          
          {/* Capacité d'épargne */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">Capacité d'épargne</span>
            </div>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(budget.capaciteEpargneMensuelle)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Taux: {formatPercent(budget.tauxEpargne)}
            </p>
          </div>
          
          {/* Taux d'endettement */}
          <div className={`p-4 rounded-lg ${
            budget.tauxEndettement > 35 
              ? 'bg-red-50' 
              : budget.tauxEndettement > 30 
                ? 'bg-amber-50' 
                : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className={`h-4 w-4 ${
                budget.tauxEndettement > 35 
                  ? 'text-red-600' 
                  : budget.tauxEndettement > 30 
                    ? 'text-amber-600' 
                    : 'text-gray-600'
              }`} />
              <span className={`text-sm ${
                budget.tauxEndettement > 35 
                  ? 'text-red-700' 
                  : budget.tauxEndettement > 30 
                    ? 'text-amber-700' 
                    : 'text-gray-700'
              }`}>Endettement</span>
            </div>
            <p className={`text-xl font-bold ${
              budget.tauxEndettement > 35 
                ? 'text-red-700' 
                : budget.tauxEndettement > 30 
                  ? 'text-amber-700' 
                  : 'text-gray-700'
            }`}>
              {formatPercent(budget.tauxEndettement)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Reste à vivre: {formatCurrency(budget.resteAVivre)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IndicateursSection({ 
  indicateurs, 
  hasAccess: _hasAccess 
}: { 
  indicateurs: IndicateurCle[]
  hasAccess: (code: string) => boolean
}) {
  // Note: _hasAccess sera utilisé pour vérifier l'accès aux indicateurs premium
  const getStatusColor = (status: IndicateurCle['status']) => {
    switch (status) {
      case 'GOOD': return 'text-green-600 bg-green-50'
      case 'WARNING': return 'text-amber-600 bg-amber-50'
      case 'CRITIQUE': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <CardTitle>Indicateurs clés</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {indicateurs.map((ind) => (
            <div
              key={ind.id}
              className={`p-4 rounded-lg border ${
                ind.isPremium ? 'bg-gray-50 border-dashed' : getStatusColor(ind.status)
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {ind.name}
                </span>
                {ind.isPremium && (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
              </div>
              
              {ind.isPremium ? (
                <div className="mt-2">
                  <p className="text-lg font-semibold text-gray-400">
                    {ind.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ind.description}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-xs text-primary p-0 h-auto"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Débloquer
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-lg font-semibold">
                    {typeof ind.value === 'number' 
                      ? ind.unit === '€' 
                        ? formatCurrency(ind.value)
                        : `${Math.round(ind.value * 10) / 10}${ind.unit || ''}`
                      : ind.value
                    }
                  </p>
                  {ind.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {ind.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ObjectifsSection({ objectifs }: { objectifs: ObjectifSummary[] }) {
  const getStatusBadge = (status: ObjectifSummary['status']) => {
    switch (status) {
      case 'TERMINE':
        return <Badge className="bg-green-100 text-green-700">Atteint</Badge>
      case 'ON_TRACK':
        return <Badge className="bg-blue-100 text-blue-700">En bonne voie</Badge>
      case 'AT_RISK':
        return <Badge className="bg-amber-100 text-amber-700">À surveiller</Badge>
      case 'EN_RETARD':
        return <Badge className="bg-red-100 text-red-700">En retard</Badge>
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <CardTitle>Objectifs</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {objectifs.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Aucun objectif défini
          </p>
        ) : (
          <div className="space-y-4">
            {objectifs.slice(0, 5).map((obj) => (
              <div key={obj.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{obj.name}</span>
                  {getStatusBadge(obj.status)}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={obj.progress} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground w-10">
                    {formatPercent(obj.progress)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(obj.currentAmount)} / {formatCurrency(obj.targetAmount)}</span>
                  {obj.targetDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(obj.targetDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProjetsSection({ projets }: { projets: ProjetSummary[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TERMINE': return 'bg-green-100 text-green-700'
      case 'EN_COURS': return 'bg-blue-100 text-blue-700'
      case 'PLANIFIE': return 'bg-amber-100 text-amber-700'
      case 'BROUILLON': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-purple-600" />
          <CardTitle>Projets</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {projets.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Aucun projet en cours
          </p>
        ) : (
          <div className="space-y-3">
            {projets.slice(0, 5).map((proj) => (
              <div 
                key={proj.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{proj.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatLabel(proj.type)} • Budget: {formatCurrency(proj.budget)}
                  </p>
                </div>
                <Badge className={getStatusColor(proj.status)}>
                  {proj.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Export
// =============================================================================

export default TabSynthese
