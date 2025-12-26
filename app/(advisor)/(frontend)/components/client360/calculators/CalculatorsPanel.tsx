'use client'

/**
 * CalculatorsPanel - Panneau affichant tous les résultats des calculateurs
 * Connecté automatiquement aux APIs backend
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { formatCurrency, formatPercentage, cn } from '@/app/_common/lib/utils'
import { useClientCalculators } from '../../../hooks/useClientCalculators'
import { KPICard } from '../../charts'
import {
  Calculator, TrendingDown, PiggyBank, Home, Shield,
  AlertTriangle, CheckCircle, Info, ChevronRight, RefreshCw,
  Wallet, Target, Clock, Lightbulb, CreditCard, Building2, Loader2, Euro
} from 'lucide-react'

interface CalculatorsPanelProps {
  clientId: string
  defaultTab?: string
  showTabs?: ('budget' | 'fiscal' | 'retraite' | 'objectifs')[]
}

// ============================================================================
// Composant Principal
// ============================================================================

export function CalculatorsPanel({ 
  clientId, 
  defaultTab = 'budget',
  showTabs = ['budget', 'fiscal', 'retraite', 'objectifs']
}: CalculatorsPanelProps) {
  const calculators = useClientCalculators(clientId)
  const [activeTab, setActiveTab] = useState(defaultTab)

  if (calculators.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-gray-500">Calcul en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <span className="font-medium text-gray-900">Résultats des calculateurs</span>
          {calculators.lastUpdate && (
            <span className="text-xs text-gray-400">
              Mis à jour à {calculators.lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={calculators.refresh}
          disabled={calculators.isLoading}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', calculators.isLoading && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          {showTabs.includes('budget') && (
            <TabsTrigger value="budget">
              <PiggyBank className="h-4 w-4 mr-2" />
              Budget & Endettement
            </TabsTrigger>
          )}
          {showTabs.includes('fiscal') && (
            <TabsTrigger value="fiscal">
              <Euro className="h-4 w-4 mr-2" />
              Fiscalité
            </TabsTrigger>
          )}
          {showTabs.includes('retraite') && (
            <TabsTrigger value="retraite">
              <Clock className="h-4 w-4 mr-2" />
              Retraite
            </TabsTrigger>
          )}
          {showTabs.includes('objectifs') && (
            <TabsTrigger value="objectifs">
              <Target className="h-4 w-4 mr-2" />
              Objectifs
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB BUDGET */}
        {showTabs.includes('budget') && (
          <TabsContent value="budget" className="space-y-6 mt-4">
            <BudgetCalculatorsSection calculators={calculators} />
          </TabsContent>
        )}

        {/* TAB FISCAL */}
        {showTabs.includes('fiscal') && (
          <TabsContent value="fiscal" className="space-y-6 mt-4">
            <FiscalCalculatorsSection calculators={calculators} />
          </TabsContent>
        )}

        {/* TAB RETRAITE */}
        {showTabs.includes('retraite') && (
          <TabsContent value="retraite" className="space-y-6 mt-4">
            <RetirementCalculatorsSection calculators={calculators} />
          </TabsContent>
        )}

        {/* TAB OBJECTIFS */}
        {showTabs.includes('objectifs') && (
          <TabsContent value="objectifs" className="space-y-6 mt-4">
            <ObjectivesCalculatorsSection calculators={calculators} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ============================================================================
// Section Budget & Endettement
// ============================================================================

function BudgetCalculatorsSection({ calculators }: { calculators: ReturnType<typeof useClientCalculators> }) {
  const { debtCapacity, budgetAnalysis, emergencyFund, clientData } = calculators

  return (
    <div className="space-y-6">
      {/* KPIs rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Taux d'endettement"
          value={debtCapacity?.currentDebtRatio || 0}
          format="percent"
          icon={<CreditCard className="h-5 w-5" />}
          colorScheme={
            (debtCapacity?.currentDebtRatio || 0) > 35 ? 'rose' :
            (debtCapacity?.currentDebtRatio || 0) > 30 ? 'amber' : 'green'
          }
          description={`Max recommandé: 35%`}
        />
        <KPICard
          title="Capacité d'emprunt"
          value={debtCapacity?.maxLoanAmount || 0}
          format="currency"
          icon={<Home className="h-5 w-5" />}
          colorScheme="blue"
          description={`Mensualité max: ${formatCurrency(debtCapacity?.maxMonthlyPayment || 0)}`}
        />
        <KPICard
          title="Taux d'épargne"
          value={budgetAnalysis?.savingsRate || 0}
          format="percent"
          icon={<PiggyBank className="h-5 w-5" />}
          colorScheme={(budgetAnalysis?.savingsRate || 0) >= 20 ? 'green' : 'amber'}
          description="Recommandé: 20%+"
        />
        <KPICard
          title="Épargne de précaution"
          value={emergencyFund?.targetAmount || 0}
          format="currency"
          icon={<Shield className="h-5 w-5" />}
          colorScheme="purple"
          description={`${emergencyFund?.recommendedMonths || 6} mois de charges`}
        />
      </div>

      {/* Capacité d'endettement détaillée */}
      {debtCapacity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Capacité d'endettement
            </CardTitle>
            <CardDescription>Analyse de votre capacité à emprunter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Jauge visuelle */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taux d'endettement actuel</span>
                <span className={cn(
                  'font-semibold',
                  debtCapacity.currentDebtRatio > 35 ? 'text-red-600' :
                  debtCapacity.currentDebtRatio > 30 ? 'text-amber-600' : 'text-green-600'
                )}>
                  {formatPercentage(debtCapacity.currentDebtRatio)}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={Math.min(debtCapacity.currentDebtRatio, 50)} 
                  className="h-3"
                />
                {/* Marqueur 35% */}
                <div 
                  className="absolute top-0 w-0.5 h-3 bg-red-500"
                  style={{ left: '70%' }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span className="text-red-500">35% (limite)</span>
                <span>50%</span>
              </div>
            </div>

            {/* Détails */}
            <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(debtCapacity.maxLoanAmount)}
                </p>
                <p className="text-sm text-blue-600">Montant empruntable max</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(debtCapacity.maxMonthlyPayment)}
                </p>
                <p className="text-sm text-green-600">Mensualité max</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(debtCapacity.availableDebtCapacity)}
                </p>
                <p className="text-sm text-purple-600">Capacité disponible</p>
              </div>
            </div>

            {/* Recommandation */}
            {debtCapacity.recommendation && (
              <div className={cn(
                'flex items-start gap-3 p-4 rounded-lg',
                debtCapacity.status === 'critical' ? 'bg-red-50 border border-red-100' :
                debtCapacity.status === 'warning' ? 'bg-amber-50 border border-amber-100' :
                'bg-green-50 border border-green-100'
              )}>
                {debtCapacity.status === 'critical' ? (
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                ) : debtCapacity.status === 'warning' ? (
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                <p className="text-sm">{debtCapacity.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analyse budget */}
      {budgetAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Analyse du budget
            </CardTitle>
            <CardDescription>Score de santé financière: {budgetAnalysis.healthScore}/100</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score visuel */}
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
                budgetAnalysis.healthScore >= 80 ? 'bg-green-100 text-green-700' :
                budgetAnalysis.healthScore >= 60 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              )}>
                {budgetAnalysis.healthScore}
              </div>
              <div>
                <Badge variant={
                  budgetAnalysis.status === 'excellent' ? 'default' :
                  budgetAnalysis.status === 'good' ? 'secondary' :
                  budgetAnalysis.status === 'fair' ? 'outline' : 'destructive'
                }>
                  {budgetAnalysis.status === 'excellent' ? 'Excellent' :
                   budgetAnalysis.status === 'good' ? 'Bon' :
                   budgetAnalysis.status === 'fair' ? 'Correct' : 'À améliorer'}
                </Badge>
                <p className="text-sm text-gray-500 mt-1">
                  Revenu net: {formatCurrency(budgetAnalysis.netIncome)}/mois
                </p>
              </div>
            </div>

            {/* Répartition */}
            <div className="grid gap-3 md:grid-cols-3 pt-4 border-t">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">Revenus</span>
                <span className="font-semibold text-green-700">{formatCurrency(budgetAnalysis.totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-700">Dépenses</span>
                <span className="font-semibold text-red-700">{formatCurrency(budgetAnalysis.totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">Crédits</span>
                <span className="font-semibold text-blue-700">{formatCurrency(budgetAnalysis.totalDebts)}</span>
              </div>
            </div>

            {/* Recommandations */}
            {budgetAnalysis.recommendations && budgetAnalysis.recommendations.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700">Recommandations</h4>
                {budgetAnalysis.recommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Section Fiscalité
// ============================================================================

function FiscalCalculatorsSection({ calculators }: { calculators: ReturnType<typeof useClientCalculators> }) {
  const { incomeTax, wealthTax, taxOptimization } = calculators

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Impôt sur le revenu"
          value={incomeTax?.totalTax || 0}
          format="currency"
          icon={<Euro className="h-5 w-5" />}
          colorScheme="rose"
          description={`TMI: ${incomeTax?.tmi || 'N/A'}`}
        />
        <KPICard
          title="Taux effectif"
          value={incomeTax?.effectiveRate || 0}
          format="percent"
          icon={<TrendingDown className="h-5 w-5" />}
          colorScheme="amber"
        />
        <KPICard
          title="IFI"
          value={wealthTax?.taxAmount || 0}
          format="currency"
          icon={<Building2 className="h-5 w-5" />}
          colorScheme={wealthTax?.isSubject ? 'rose' : 'green'}
          description={wealthTax?.isSubject ? 'Assujetti' : 'Non assujetti'}
        />
        <KPICard
          title="Économies possibles"
          value={taxOptimization?.totalPotentialSavings || 0}
          format="currency"
          icon={<Lightbulb className="h-5 w-5" />}
          colorScheme="green"
          description="Optimisation fiscale"
        />
      </div>

      {/* Détail IR */}
      {incomeTax && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-rose-600" />
              Impôt sur le revenu 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenu brut</span>
                  <span className="font-semibold">{formatCurrency(incomeTax.grossIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenu imposable</span>
                  <span className="font-semibold">{formatCurrency(incomeTax.taxableIncome)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Impôt dû</span>
                  <span className="font-bold text-rose-600">{formatCurrency(incomeTax.totalTax)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tranche marginale (TMI)</span>
                  <Badge variant="outline">{incomeTax.tmi}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux marginal</span>
                  <span className="font-semibold">{formatPercentage(incomeTax.marginalRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux effectif</span>
                  <span className="font-semibold">{formatPercentage(incomeTax.effectiveRate)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimisations */}
      {taxOptimization && taxOptimization.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Optimisations fiscales recommandées
            </CardTitle>
            <CardDescription>
              Économie potentielle: {formatCurrency(taxOptimization.totalPotentialSavings)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taxOptimization.recommendations.map((rec, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Euro className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{rec.name}</p>
                      <p className="text-sm text-gray-500">{rec.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">-{formatCurrency(rec.taxSaving)}</p>
                    <p className="text-xs text-gray-400">Max: {formatCurrency(rec.maxAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Section Retraite
// ============================================================================

function RetirementCalculatorsSection({ calculators }: { calculators: ReturnType<typeof useClientCalculators> }) {
  const { retirementSimulation } = calculators

  if (!retirementSimulation) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Données insuffisantes pour la simulation retraite</p>
        <p className="text-sm">Vérifiez que la date de naissance du client est renseignée</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Capital à la retraite"
          value={retirementSimulation.savingsAtRetirement}
          format="currency"
          icon={<PiggyBank className="h-5 w-5" />}
          colorScheme="blue"
        />
        <KPICard
          title="Revenu annuel durable"
          value={retirementSimulation.sustainableAnnualIncome}
          format="currency"
          icon={<Wallet className="h-5 w-5" />}
          colorScheme={retirementSimulation.isRetirementFeasible ? 'green' : 'amber'}
        />
        <KPICard
          title="Taux de remplacement"
          value={retirementSimulation.replacementRate || ((retirementSimulation.sustainableAnnualIncome / retirementSimulation.desiredAnnualIncome) * 100)}
          format="percent"
          icon={<Target className="h-5 w-5" />}
          colorScheme={retirementSimulation.isRetirementFeasible ? 'green' : 'rose'}
        />
        <KPICard
          title="Déficit annuel"
          value={retirementSimulation.incomeShortfall}
          format="currency"
          icon={<AlertTriangle className="h-5 w-5" />}
          colorScheme={retirementSimulation.incomeShortfall > 0 ? 'rose' : 'green'}
        />
      </div>

      {/* Statut */}
      <Card className={retirementSimulation.isRetirementFeasible ? 'border-green-200' : 'border-amber-200'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {retirementSimulation.isRetirementFeasible ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-amber-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {retirementSimulation.isRetirementFeasible 
                  ? 'Votre retraite est sur la bonne voie !' 
                  : 'Des ajustements sont nécessaires'}
              </h3>
              <p className="text-gray-600">
                À {retirementSimulation.retirementAge} ans, vous aurez accumulé {formatCurrency(retirementSimulation.savingsAtRetirement)}.
                {!retirementSimulation.isRetirementFeasible && ` Il manque ${formatCurrency(retirementSimulation.incomeShortfall)}/an.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      {retirementSimulation.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {retirementSimulation.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Section Objectifs
// ============================================================================

function ObjectivesCalculatorsSection({ calculators }: { calculators: ReturnType<typeof useClientCalculators> }) {
  const { homePurchase, emergencyFund } = calculators

  return (
    <div className="space-y-6">
      {/* Épargne de précaution */}
      {emergencyFund && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Épargne de précaution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(emergencyFund.targetAmount)}
                </p>
                <p className="text-sm text-purple-600">Montant recommandé</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900">
                  {emergencyFund.recommendedMonths} mois
                </p>
                <p className="text-sm text-gray-600">De charges couvertes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(emergencyFund.monthlyExpenses)}
                </p>
                <p className="text-sm text-blue-600">Charges mensuelles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder pour achat immobilier - à compléter avec un formulaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            Simulateur d'achat immobilier
          </CardTitle>
          <CardDescription>
            Calculez votre plan d'épargne pour un achat immobilier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Utilisez le simulateur d'achat immobilier</p>
            <Button className="mt-4" variant="outline">
              Lancer une simulation
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CalculatorsPanel
