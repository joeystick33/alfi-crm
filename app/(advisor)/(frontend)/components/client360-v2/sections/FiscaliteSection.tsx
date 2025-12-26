 
'use client'

/**
 * FiscaliteSection - Section Fiscalité du Client360 V2
 * 
 * UTILISE LES VRAIES APIS via useClientCalculators
 */

import { useMemo } from 'react'
import { cn } from '@/app/_common/lib/utils'
import { helpers } from '@/app/_common/styles/design-system-v2'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { useToast } from '@/app/_common/hooks/use-toast'
import { useClientCalculators } from '@/app/(advisor)/(frontend)/hooks/useClientCalculators'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import {
  Calculator,
  Building2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface FiscaliteSectionProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
  activeItem?: string
  onNavigate: (sectionId: string, itemId?: string) => void
}

// Barèmes IR 2025 (source Althémis)
const IR_BRACKETS = [
  { min: 0, max: 11497, rate: 0 },
  { min: 11497, max: 29315, rate: 0.11 },
  { min: 29315, max: 83823, rate: 0.30 },
  { min: 83823, max: 180294, rate: 0.41 },
  { min: 180294, max: Infinity, rate: 0.45 },
]

function IRBracketViz({ revenuImposable, parts }: { revenuImposable: number; parts: number }) {
  const revenuParPart = revenuImposable / parts
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Revenu imposable: {helpers.formatMoney(revenuImposable)}</span>
        <span>Par part: {helpers.formatMoney(revenuParPart)}</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {IR_BRACKETS.map((bracket, i) => {
          const inBracket = revenuParPart > bracket.min
          const width = inBracket 
            ? Math.min((Math.min(revenuParPart, bracket.max) - bracket.min) / revenuParPart * 100, 100)
            : 0
          
          const colors = ['bg-gray-200', 'bg-blue-400', 'bg-indigo-500', 'bg-violet-600', 'bg-purple-700']
          
          return width > 0 ? (
            <div
              key={i}
              className={cn('transition-all duration-500', colors[i])}
              style={{ width: `${width}%` }}
              title={`${(bracket.rate * 100).toFixed(0)}%`}
            />
          ) : null
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {IR_BRACKETS.map((bracket, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className={cn(
              'h-2 w-2 rounded-full',
              ['bg-gray-200', 'bg-blue-400', 'bg-indigo-500', 'bg-violet-600', 'bg-purple-700'][i]
            )} />
            <span className="text-gray-600">{(bracket.rate * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OptimizationCard({ 
  title, 
  savings, 
  description, 
  priority,
  onClick 
}: { 
  title: string
  savings: number
  description: string
  priority: 'high' | 'medium' | 'low'
  onClick?: () => void
}) {
  const priorityConfig = {
    high: { label: 'Prioritaire', color: 'bg-red-100 text-red-700' },
    medium: { label: 'Recommandé', color: 'bg-amber-100 text-amber-700' },
    low: { label: 'Optionnel', color: 'bg-gray-100 text-gray-700' },
  }
  
  return (
    <div 
      onClick={onClick}
      className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', priorityConfig[priority].color)}>
          {priorityConfig[priority].label}
        </span>
        <span className="text-lg font-bold text-emerald-600 tabular-nums">
          -{helpers.formatMoney(savings, true)}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      <button className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
        En savoir plus <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// =============================================================================
// Skeleton Loading
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-red-100 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <p className="text-sm text-red-600 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  )
}

// =============================================================================
// Composant Principal
// =============================================================================

export default function FiscaliteSection({
  clientId,
  client,
  wealth,
  activeItem = 'ir',
  onNavigate,
}: FiscaliteSectionProps) {
  const { toast } = useToast()
  
  // Utiliser le hook pour les calculs automatiques
  const calculators = useClientCalculators(clientId)
  const { incomeTax, wealthTax, taxOptimization, isLoading, errors } = calculators
  
  // Données fiscales calculées ou dérivées des vraies données client
  const fiscalite = useMemo(() => {
    // Si on a les résultats de l'API
    if (incomeTax) {
      return {
        revenuBrut: incomeTax.grossIncome || 0,
        revenuImposable: incomeTax.taxableIncome || 0,
        parts: client.familyStatus === 'MARRIED' || client.familyStatus === 'PACS' ? 2 : 1,
        ir: incomeTax.totalTax || 0,
        csgCrds: Math.round((incomeTax.grossIncome || 0) * 0.172), // 17.2% approximatif
        totalImpots: (incomeTax.totalTax || 0) + Math.round((incomeTax.grossIncome || 0) * 0.172),
        tmi: incomeTax.tmi || '-',
        tauxEffectif: incomeTax.effectiveRate || 0,
        ifiPatrimoine: wealthTax?.totalWealth || wealth?.totalActifs || 0,
        ifiMontant: wealthTax?.taxAmount || 0,
        ifiAssujetti: wealthTax?.isSubject || false,
      }
    }
    
    // Fallback avec données client brutes si disponibles
    const revenus = (client as any).incomes || []
    const revenuBrut = revenus.reduce((sum: number, r: any) => sum + (Number(r.montant) || 0) * 12, 0)
    
    return {
      revenuBrut,
      revenuImposable: revenuBrut * 0.9, // Estimation avec 10% d'abattement
      parts: client.familyStatus === 'MARRIED' || client.familyStatus === 'PACS' ? 2 : 1,
      ir: 0,
      csgCrds: 0,
      totalImpots: 0,
      tmi: '-',
      tauxEffectif: 0,
      ifiPatrimoine: wealth?.totalActifs || 0,
      ifiMontant: 0,
      ifiAssujetti: false,
    }
  }, [incomeTax, wealthTax, wealth, client])
  
  // Optimisations fiscales depuis l'API
  const optimisations = useMemo(() => {
    if (taxOptimization?.recommendations) {
      return taxOptimization.recommendations.map((rec, idx) => ({
        id: String(idx + 1),
        title: rec.name || rec.type,
        savings: rec.taxSaving || 0,
        description: rec.description || '',
        priority: rec.taxSaving > 1000 ? 'high' as const : rec.taxSaving > 500 ? 'medium' as const : 'low' as const,
      }))
    }
    
    // Suggestions par défaut si pas de données API
    return [
      {
        id: '1',
        title: 'Versement PER',
        savings: fiscalite.revenuImposable > 0 ? Math.min(fiscalite.revenuImposable * 0.1, 3500) * 0.3 : 0,
        description: 'Versement déductible du revenu imposable (jusqu\'à 10% des revenus).',
        priority: 'high' as const,
      },
      {
        id: '2',
        title: 'Dons aux associations',
        savings: 660,
        description: 'Don de 1 000€ = 66% de réduction d\'impôt (max 20% du revenu).',
        priority: 'medium' as const,
      },
    ]
  }, [taxOptimization, fiscalite])

  return (
    <div className="space-y-4">
      {/* En-tête avec totaux */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Revenu imposable</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {helpers.formatMoney(fiscalite.revenuImposable)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">TMI</p>
              <p className="text-xl font-bold text-indigo-600">{fiscalite.tmi}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IR estimé</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {helpers.formatMoney(fiscalite.ir)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux effectif</p>
              <p className="text-xl font-bold text-gray-900">
                {(fiscalite.tauxEffectif * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeItem} onValueChange={(v) => onNavigate('fiscalite', v)}>
        <TabsList>
          <TabsTrigger value="ir">Impôt sur le Revenu</TabsTrigger>
          <TabsTrigger value="ifi">IFI</TabsTrigger>
          <TabsTrigger value="optimisation">Optimisation</TabsTrigger>
          <TabsTrigger value="calculs">Calculs Auto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ir" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détail de l'imposition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Revenu brut annuel</p>
                  <p className="text-lg font-semibold text-gray-900 tabular-nums">
                    {helpers.formatMoney(fiscalite.revenuBrut)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Parts fiscales</p>
                  <p className="text-lg font-semibold text-gray-900">{fiscalite.parts}</p>
                </div>
              </div>
              
              <IRBracketViz revenuImposable={fiscalite.revenuImposable} parts={fiscalite.parts} />
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Impôt sur le revenu</span>
                  <span className="font-semibold text-gray-900">{helpers.formatMoney(fiscalite.ir)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">CSG/CRDS</span>
                  <span className="font-semibold text-gray-900">{helpers.formatMoney(fiscalite.csgCrds)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium text-gray-900">Total impôts</span>
                  <span className="text-lg font-bold text-gray-900">{helpers.formatMoney(fiscalite.totalImpots)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ifi" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Impôt sur la Fortune Immobilière
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className={cn(
                  'inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4',
                  fiscalite.ifiAssujetti ? 'bg-amber-100' : 'bg-emerald-100'
                )}>
                  {fiscalite.ifiAssujetti ? (
                    <Building2 className="h-8 w-8 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {fiscalite.ifiAssujetti ? 'Assujetti à l\'IFI' : 'Non assujetti à l\'IFI'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Patrimoine immobilier: {helpers.formatMoney(fiscalite.ifiPatrimoine)}
                </p>
                <p className="text-xs text-gray-400">
                  Seuil d'assujettissement: 1 300 000 €
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimisation" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optimisations.map((opt) => (
              <OptimizationCard
                key={opt.id}
                {...opt}
                onClick={() => {
                  // Navigation vers le simulateur approprié selon le type d'optimisation
                  const simulatorMap: Record<string, string> = {
                    'PER': '/dashboard/simulateurs/per-salaries',
                    'Versement PER': '/dashboard/simulateurs/per-salaries',
                    'Assurance-vie': '/dashboard/simulateurs/assurance-vie',
                    'Immobilier': '/dashboard/simulateurs/immobilier',
                    'SCPI': '/dashboard/simulateurs/immobilier',
                    'FIP': '/dashboard/calculateurs/impot-revenu',
                    'FCPI': '/dashboard/calculateurs/impot-revenu',
                    'Donation': '/dashboard/calculateurs/donation',
                  }
                  const matchedKey = Object.keys(simulatorMap).find(k => opt.title.includes(k))
                  window.location.href = matchedKey ? simulatorMap[matchedKey] : '/dashboard/simulateurs'
                }}
              />
            ))}
          </div>
          
          <Card className="mt-4 border-indigo-200 bg-indigo-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Sparkles className="h-8 w-8 text-indigo-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Économies potentielles totales</h4>
                  <p className="text-sm text-gray-600">En appliquant toutes les optimisations</p>
                </div>
                <span className="text-2xl font-bold text-emerald-600 tabular-nums">
                  -{helpers.formatMoney(optimisations.reduce((s, o) => s + o.savings, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calculs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Calculs automatiques connectés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Les calculs sont effectués automatiquement avec les données du client.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['Calcul IR', 'Calcul IFI', 'Optimisation fiscale', 'Simulation donation'].map((calc) => (
                  <Button key={calc} variant="outline" className="justify-start gap-2">
                    <Calculator className="h-4 w-4 text-indigo-600" />
                    {calc}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
