'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { formatCurrency } from '@/app/_common/lib/utils'
import { formatLabel, formatRevenueType } from '@/app/_common/lib/labels'
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  RefreshCw,
  AlertCircle,
  Info,
  ChevronRight,
  Lightbulb,
  PiggyBank,
  Home,
  BarChart3,
  FileText,
  Plus,
  Play
} from 'lucide-react'
import type { 
  FiscaliteData, 
  IRData,
  IFIData,
  RevenueSource,
  DeductibleCharge,
  TaxBracket,
  IFIAsset,
  TaxOptimization,
  TaxSimulation,
  ClientDetail 
} from '@/app/_common/types/client360'
import { 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface TabFiscaliteProps {
  clientId: string
  client: ClientDetail
  onTabChange?: (tabId: string) => void
}

// Colors for charts
const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  teal: '#14B8A6',
  orange: '#F97316',
}

const BRACKET_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#EF4444']

export function TabFiscalite({ clientId, client: _client, onTabChange }: TabFiscaliteProps) {
  const [fiscaliteData, setFiscaliteData] = useState<FiscaliteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('ir')

  // Fetch fiscalite data
  const fetchFiscaliteData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/advisor/clients/${clientId}/taxation/data`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch taxation data')
      }
      
      const result = await response.json()
      setFiscaliteData(result.data)
    } catch (err) {
      console.error('Error fetching taxation data:', err)
      setError('Impossible de charger les données fiscales')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchFiscaliteData()
  }, [fetchFiscaliteData])

  // Loading state
  if (loading) {
    return <TabFiscaliteSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive font-medium">{error}</p>
        <button 
          onClick={fetchFiscaliteData}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!fiscaliteData) {
    return null
  }

  const { ir, ifi, simulations } = fiscaliteData

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fiscalité</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Impôt sur le revenu, IFI et simulations fiscales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFiscaliteData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Impôt sur le Revenu"
          value={formatCurrency(ir.annualTax)}
          subtitle={`TMI: ${ir.marginalRate}%`}
          icon={Calculator}
          variant="primary"
        />
        <SummaryCard
          title="Prélèvement mensuel"
          value={formatCurrency(ir.monthlyPayment)}
          subtitle="À la source"
          icon={Wallet}
          variant="default"
        />
        <SummaryCard
          title="IFI"
          value={ifi.amount > 0 ? formatCurrency(ifi.amount) : 'Non assujetti'}
          subtitle={ifi.amount > 0 ? ifi.bracket : `Seuil: ${formatCurrency(1300000)}`}
          icon={Building2}
          variant={ifi.amount > 0 ? 'warning' : 'success'}
        />
        <SummaryCard
          title="Parts fiscales"
          value={ir.fiscalShares.toString()}
          subtitle={getSharesLabel(ir.fiscalShares)}
          icon={PiggyBank}
          variant="default"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ir">
            <Calculator className="h-4 w-4 mr-2" />
            Impôt sur le Revenu
          </TabsTrigger>
          <TabsTrigger value="ifi">
            <Building2 className="h-4 w-4 mr-2" />
            IFI
          </TabsTrigger>
          <TabsTrigger value="simulations">
            <Play className="h-4 w-4 mr-2" />
            Simulations
            {simulations.length > 0 && (
              <Badge variant="secondary" className="ml-2">{simulations.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* IR Tab */}
        <TabsContent value="ir" className="space-y-6">
          <IRSection ir={ir} />
        </TabsContent>

        {/* IFI Tab */}
        <TabsContent value="ifi" className="space-y-6">
          <IFISection ifi={ifi} />
        </TabsContent>

        {/* Simulations Tab */}
        <TabsContent value="simulations" className="space-y-6">
          <SimulationsSection 
            simulations={simulations} 
            ir={ir} 
            ifi={ifi}
            onRefresh={fetchFiscaliteData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  title: string
  value: string
  subtitle: string
  icon: typeof Calculator
  variant: 'success' | 'destructive' | 'primary' | 'warning' | 'default'
}

function SummaryCard({ title, value, subtitle, icon: Icon, variant }: SummaryCardProps) {
  const variantStyles = {
    success: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-700',
    destructive: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-700',
    primary: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    warning: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-orange-700',
    default: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-700'
  }

  const iconStyles = {
    success: 'text-green-600',
    destructive: 'text-red-600',
    primary: 'text-blue-600',
    warning: 'text-orange-600',
    default: 'text-gray-600'
  }

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-5 w-5 ${iconStyles[variant]}`} />
          <span className="text-sm text-gray-700">{title}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// IR Section Component
// ============================================================================

interface IRSectionProps {
  ir: IRData
}

function IRSection({ ir }: IRSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Sources */}
        <RevenueSourcesCard revenueSources={ir.revenueSources} taxableIncome={ir.taxableIncome} />
        
        {/* Tax Brackets Visualization */}
        <TaxBracketsCard brackets={ir.brackets} marginalRate={ir.marginalRate} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deductible Charges */}
        <DeductibleChargesCard charges={ir.deductibleCharges} />
        
        {/* IR Summary */}
        <IRSummaryCard ir={ir} />
      </div>
    </div>
  )
}

interface RevenueSourcesCardProps {
  revenueSources: RevenueSource[]
  taxableIncome: number
}

function RevenueSourcesCard({ revenueSources, taxableIncome }: RevenueSourcesCardProps) {
  const chartData = revenueSources.map((source, index) => ({
    name: source.label,
    value: source.amount,
    color: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <span>Sources de revenus</span>
          </div>
          <span className="text-success font-bold">{formatCurrency(taxableIncome)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {revenueSources.length === 0 ? (
          <div className="py-8 text-center">
            <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucune source de revenu enregistrée</p>
          </div>
        ) : (
          <>
            <div className="h-48 min-w-[220px] mb-4">
              <ResponsiveContainer width={220} height={192}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {revenueSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{formatRevenueType(source.type)}</Badge>
                    <span className="text-sm">{source.label}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(source.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface TaxBracketsCardProps {
  brackets: TaxBracket[]
  marginalRate: number
}

function TaxBracketsCard({ brackets, marginalRate }: TaxBracketsCardProps) {
  const chartData = brackets.map((bracket, index) => ({
    name: `${bracket.rate}%`,
    rate: bracket.rate,
    min: bracket.min,
    max: bracket.max === Infinity ? 200000 : bracket.max,
    isCurrent: bracket.isCurrentBracket,
    color: BRACKET_COLORS[index % BRACKET_COLORS.length]
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Tranches marginales d'imposition</span>
          </div>
          <Badge variant="default">TMI: {marginalRate}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {brackets.map((bracket, index) => {
            const maxDisplay = bracket.max === Infinity ? '∞' : formatCurrency(bracket.max)
            const progress = bracket.isCurrentBracket ? 100 : (bracket.rate < marginalRate ? 100 : 0)
            
            return (
              <div key={`bracket-${bracket.rate}-${bracket.min}`} className={`p-3 rounded-lg border ${bracket.isCurrentBracket ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${bracket.isCurrentBracket ? 'text-primary' : ''}`}>
                      {bracket.rate}%
                    </span>
                    {bracket.isCurrentBracket && (
                      <Badge variant="default" className="text-xs">Votre tranche</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(bracket.min)} - {maxDisplay}
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className="h-2"
                  style={{ 
                    '--progress-background': BRACKET_COLORS[index % BRACKET_COLORS.length] 
                  } as React.CSSProperties}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface DeductibleChargesCardProps {
  charges: DeductibleCharge[]
}

function DeductibleChargesCard({ charges }: DeductibleChargesCardProps) {
  const totalDeductions = charges.reduce((sum, c) => sum + c.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-success" />
            <span>Charges déductibles</span>
          </div>
          <span className="text-success font-bold">-{formatCurrency(totalDeductions)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {charges.length === 0 || totalDeductions === 0 ? (
          <div className="py-8 text-center">
            <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucune charge déductible enregistrée</p>
            <Button size="sm" variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une déduction
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {charges.filter(c => c.amount > 0).map((charge) => (
              <div key={charge.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{formatLabel(charge.type)}</Badge>
                  <span className="text-sm">{charge.label}</span>
                </div>
                <span className="font-medium text-success">-{formatCurrency(charge.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface IRSummaryCardProps {
  ir: IRData
}

function IRSummaryCard({ ir }: IRSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <span>Synthèse IR</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Revenu imposable</span>
            <span className="font-medium">{formatCurrency(ir.taxableIncome)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Nombre de parts</span>
            <span className="font-medium">{ir.fiscalShares}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Quotient familial</span>
            <span className="font-medium">{formatCurrency(ir.taxableIncome / ir.fiscalShares)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Taux marginal (TMI)</span>
            <Badge variant="default">{ir.marginalRate}%</Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Impôt annuel</span>
            <span className="font-bold text-lg text-primary">{formatCurrency(ir.annualTax)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Prélèvement mensuel</span>
            <span className="font-medium">{formatCurrency(ir.monthlyPayment)}/mois</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


// ============================================================================
// IFI Section Component
// ============================================================================

interface IFISectionProps {
  ifi: IFIData
}

function IFISection({ ifi }: IFISectionProps) {
  const isSubjectToIFI = ifi.amount > 0
  const IFI_THRESHOLD = 1300000

  return (
    <div className="space-y-6">
      {/* IFI Status Banner */}
      <Card className={isSubjectToIFI ? 'border-warning bg-warning/5' : 'border-success bg-success/5'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isSubjectToIFI ? 'bg-warning/20' : 'bg-success/20'}`}>
              <Building2 className={`h-6 w-6 ${isSubjectToIFI ? 'text-warning' : 'text-success'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {isSubjectToIFI ? 'Assujetti à l\'IFI' : 'Non assujetti à l\'IFI'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSubjectToIFI 
                  ? `Base taxable: ${formatCurrency(ifi.taxableBase)} • ${ifi.bracket}`
                  : `Patrimoine immobilier net inférieur au seuil de ${formatCurrency(IFI_THRESHOLD)}`
                }
              </p>
            </div>
            {isSubjectToIFI && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Montant IFI</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(ifi.amount)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Taxable Assets */}
        <IFIAssetsCard 
          title="Actifs taxables (IFI)" 
          assets={ifi.taxableAssets} 
          variant="taxable"
        />
        
        {/* Non-Taxable Assets */}
        <IFIAssetsCard 
          title="Actifs hors IFI" 
          assets={ifi.nonTaxableAssets} 
          variant="non-taxable"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* IFI Calculation Summary */}
        <IFICalculationCard ifi={ifi} />
        
        {/* Optimizations */}
        <IFIOptimizationsCard optimizations={ifi.optimizations} />
      </div>
    </div>
  )
}

interface IFIAssetsCardProps {
  title: string
  assets: IFIAsset[]
  variant: 'taxable' | 'non-taxable'
}

function IFIAssetsCard({ title, assets, variant }: IFIAssetsCardProps) {
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0)
  const Icon = variant === 'taxable' ? Building2 : Wallet
  const iconColor = variant === 'taxable' ? 'text-warning' : 'text-success'
  const valueColor = variant === 'taxable' ? 'text-warning' : 'text-success'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <span>{title}</span>
            <Badge variant="secondary">{assets.length}</Badge>
          </div>
          <span className={`font-bold ${valueColor}`}>{formatCurrency(totalValue)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <div className="py-8 text-center">
            <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun actif dans cette catégorie</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  {asset.reason && (
                    <p className="text-xs text-muted-foreground mt-1">{asset.reason}</p>
                  )}
                </div>
                <span className={`font-bold ${valueColor}`}>{formatCurrency(asset.value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface IFICalculationCardProps {
  ifi: IFIData
}

function IFICalculationCard({ ifi }: IFICalculationCardProps) {
  const totalTaxableAssets = ifi.taxableAssets.reduce((sum, a) => sum + a.value, 0)
  const IFI_THRESHOLD = 1300000

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <span>Calcul IFI</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Patrimoine immobilier brut</span>
            <span className="font-medium">{formatCurrency(totalTaxableAssets)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Dettes déductibles</span>
            <span className="font-medium text-success">-{formatCurrency(ifi.deductibleLiabilities)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Base taxable nette</span>
            <span className="font-bold">{formatCurrency(ifi.taxableBase)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Seuil d'assujettissement</span>
            <span className="font-medium">{formatCurrency(IFI_THRESHOLD)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Tranche applicable</span>
            <Badge variant="outline">{ifi.bracket}</Badge>
          </div>
          <div className="flex justify-between items-center py-2 bg-muted/50 rounded-lg px-3">
            <span className="font-semibold">Montant IFI</span>
            <span className="text-xl font-bold text-warning">{formatCurrency(ifi.amount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface IFIOptimizationsCardProps {
  optimizations: TaxOptimization[]
}

function IFIOptimizationsCard({ optimizations }: IFIOptimizationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            <span>Optimisations IFI</span>
          </div>
          {optimizations.length > 0 && (
            <Badge variant="warning">{optimizations.length} suggestion(s)</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {optimizations.length === 0 ? (
          <div className="py-8 text-center">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucune optimisation détectée</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les optimisations sont générées automatiquement selon votre situation
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {optimizations.map((opt) => (
              <div key={opt.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{formatLabel(opt.type)}</Badge>
                      <Badge 
                        variant={opt.complexity === 'BASSE' ? 'success' : opt.complexity === 'MOYENNE' ? 'warning' : 'destructive'}
                        className="text-xs"
                      >
                        {opt.complexity === 'BASSE' ? 'Simple' : opt.complexity === 'MOYENNE' ? 'Modéré' : 'Complexe'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-2">{opt.description}</p>
                  </div>
                  {opt.potentialSavings > 0 && (
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">Économie potentielle</p>
                      <p className="font-bold text-success">{formatCurrency(opt.potentialSavings)}</p>
                    </div>
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

// ============================================================================
// Simulations Section Component
// ============================================================================

interface SimulationsSectionProps {
  simulations: TaxSimulation[]
  ir: IRData
  ifi: IFIData
  onRefresh: () => void
}

function SimulationsSection({ simulations, ir, ifi, onRefresh }: SimulationsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Quick Simulation Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SimulationActionCard
          title="Simuler versement PER"
          description="Calculer l'impact d'un versement sur votre IR"
          icon={PiggyBank}
          variant="primary"
        />
        <SimulationActionCard
          title="Simuler investissement immobilier"
          description="Impact sur l'IFI d'un nouvel achat"
          icon={Building2}
          variant="warning"
        />
        <SimulationActionCard
          title="Comparer scénarios"
          description="Analyser différentes stratégies fiscales"
          icon={BarChart3}
          variant="success"
        />
      </div>

      {/* Current Situation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Situation fiscale actuelle</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Revenu imposable</p>
              <p className="text-xl font-bold">{formatCurrency(ir.taxableIncome)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">IR annuel</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(ir.annualTax)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Base IFI</p>
              <p className="text-xl font-bold">{formatCurrency(ifi.taxableBase)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">IFI annuel</p>
              <p className="text-xl font-bold text-warning">{formatCurrency(ifi.amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Simulations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              <span>Simulations enregistrées</span>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle simulation
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {simulations.length === 0 ? (
            <div className="py-12 text-center">
              <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucune simulation enregistrée</p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez des simulations pour comparer différents scénarios fiscaux
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {simulations.map((sim) => (
                <div key={sim.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{sim.name}</h4>
                      <Badge variant="outline" className="text-xs">{sim.scenario}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créée le {new Date(sim.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Actuel</p>
                      <p className="font-medium">{formatCurrency(sim.currentTax)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Simulé</p>
                      <p className="font-medium">{formatCurrency(sim.simulatedTax)}</p>
                    </div>
                    <div className={`text-center px-3 py-1 rounded-lg ${sim.delta < 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      <p className="text-xs text-muted-foreground">Différence</p>
                      <p className={`font-bold ${sim.delta < 0 ? 'text-success' : 'text-destructive'}`}>
                        {sim.delta < 0 ? '' : '+'}{formatCurrency(sim.delta)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SimulationActionCardProps {
  title: string
  description: string
  icon: typeof Calculator
  variant: 'primary' | 'warning' | 'success'
}

function SimulationActionCard({ title, description, icon: Icon, variant }: SimulationActionCardProps) {
  const variantStyles = {
    primary: 'hover:border-primary hover:bg-primary/5',
    warning: 'hover:border-warning hover:bg-warning/5',
    success: 'hover:border-success hover:bg-success/5',
  }

  const iconStyles = {
    primary: 'text-primary',
    warning: 'text-warning',
    success: 'text-success',
  }

  return (
    <Card className={`cursor-pointer transition-all ${variantStyles[variant]}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-muted`}>
            <Icon className={`h-5 w-5 ${iconStyles[variant]}`} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

function TabFiscaliteSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-96" />

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSharesLabel(shares: number): string {
  if (shares === 1) return 'Célibataire'
  if (shares === 2) return 'Couple'
  if (shares === 2.5) return 'Couple + 1 enfant'
  if (shares === 3) return 'Couple + 2 enfants'
  return `Foyer fiscal`
}
