 
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Label } from '@/app/_common/components/ui/Label';
import { ModernBarChart } from '@/app/_common/components/charts/ModernBarChart';
import { DualChartsTemplate } from '@/app/_common/components/ui/bento/DualChartsTemplate';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  DollarSign,
  Percent,
  Loader2,
  RefreshCw,
  AlertCircle,
  Euro,
  CreditCard,
  Clock
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

// Presets de durées courantes
const DURATION_PRESETS = [
  { label: '10 ans', value: 10 },
  { label: '15 ans', value: 15 },
  { label: '20 ans', value: 20 },
  { label: '25 ans', value: 25 },
];

// Presets de taux
const RATE_PRESETS = [
  { label: '3%', value: 3 },
  { label: '3.5%', value: 3.5 },
  { label: '4%', value: 4 },
  { label: '4.5%', value: 4.5 },
];

export function DebtCapacityCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(4000);
  const [currentDebts, setCurrentDebts] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(3.5);
  const [loanTerm, setLoanTerm] = useState<number>(20);
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateDebtCapacity = async () => {
    if (monthlyIncome <= 0) {
      setError('Le revenu mensuel doit être positif');
      return;
    }

    if (loanTerm <= 0) {
      setError('La durée du prêt doit être positive');
      return;
    }

    setError('');
    setLoading(true);
    setHasCalculated(true);

    try {
      const response = await fetch('/api/advisor/calculators/budget/debt-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome,
          currentDebts,
          interestRate: interestRate / 100,
          loanTerm
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.data || data.result || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul de la capacité d\'endettement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMonthlyIncome(4000);
    setCurrentDebts(0);
    setInterestRate(3.5);
    setLoanTerm(20);
    setResult(null);
    setError('');
    setHasCalculated(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getAffordabilityColor = (affordability: string) => {
    switch (affordability) {
      case 'excellent':
        return 'green';
      case 'good':
        return 'blue';
      case 'limited':
        return 'orange';
      case 'insufficient':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getAffordabilityIcon = (affordability: string) => {
    switch (affordability) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-6 w-6" />;
      case 'limited':
      case 'insufficient':
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  const getAffordabilityLabel = (affordability: string) => {
    switch (affordability) {
      case 'excellent':
        return 'Excellente capacité';
      case 'good':
        return 'Bonne capacité';
      case 'limited':
        return 'Capacité limitée';
      case 'insufficient':
        return 'Capacité insuffisante';
      default:
        return 'Inconnue';
    }
  };

  // Prepare chart data
  const debtChartData = result ? [
    {
      name: 'Endettement',
      'Dettes actuelles': result.currentDebts,
      'Capacité restante': result.remainingCapacity,
      'Maximum autorisé': result.maxMonthlyPayment
    }
  ] : [];

  const loanBreakdownData = result ? [
    {
      name: 'Coût du prêt',
      'Capital emprunté': result.loanDetails.maxLoanAmount,
      'Intérêts totaux': result.loanDetails.totalInterest
    }
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Calculateur de Capacité d'Endettement</CardTitle>
              <CardDescription>
                Calculez votre capacité d'emprunt maximale selon les normes bancaires françaises (33%)
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Presets de durée */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Durée du prêt</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setLoanTerm(preset.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    loanTerm === preset.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Presets de taux */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Taux d'intérêt</Label>
            <div className="flex flex-wrap gap-2">
              {RATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setInterestRate(preset.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    interestRate === preset.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champs de saisie */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Revenu mensuel */}
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome" className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-emerald-600" />
                Revenu mensuel net
              </Label>
              <div className="relative">
                <input
                  id="monthlyIncome"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-lg font-semibold"
                  placeholder="4000"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
            </div>

            {/* Dettes actuelles */}
            <div className="space-y-2">
              <Label htmlFor="currentDebts" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-red-600" />
                Charges mensuelles
              </Label>
              <div className="relative">
                <input
                  id="currentDebts"
                  type="number"
                  value={currentDebts}
                  onChange={(e) => setCurrentDebts(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-lg font-semibold"
                  placeholder="0"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Crédits en cours, loyers...</p>
            </div>

            {/* Taux d'intérêt */}
            <div className="space-y-2">
              <Label htmlFor="interestRate" className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-600" />
                Taux d'intérêt
              </Label>
              <div className="relative">
                <input
                  id="interestRate"
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-lg font-semibold"
                  placeholder="3.5"
                  min="0"
                  step="0.1"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
              </div>
            </div>

            {/* Durée */}
            <div className="space-y-2">
              <Label htmlFor="loanTerm" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                Durée du prêt
              </Label>
              <div className="relative">
                <input
                  id="loanTerm"
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-lg font-semibold"
                  placeholder="20"
                  min="1"
                  max="30"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">ans</span>
              </div>
            </div>
          </div>

          {/* Taux d'endettement actuel (preview) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Taux d'endettement actuel</span>
              <span className={cn(
                "text-xl font-bold",
                monthlyIncome > 0 && (currentDebts / monthlyIncome) <= 0.33 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {monthlyIncome > 0 ? ((currentDebts / monthlyIncome) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all",
                  monthlyIncome > 0 && (currentDebts / monthlyIncome) <= 0.33 ? 'bg-emerald-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(monthlyIncome > 0 ? (currentDebts / monthlyIncome) * 100 : 0, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span className="font-medium text-amber-600">33% (limite)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Bouton Calculer */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 border-t">
            <Button 
              onClick={calculateDebtCapacity} 
              disabled={loading || monthlyIncome <= 0}
              size="lg"
              className="w-full sm:w-auto min-w-[220px] h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculer ma capacité
                </>
              )}
            </Button>
            
            {hasCalculated && (
              <Button variant="outline" size="lg" onClick={resetForm}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <span className="text-destructive font-medium">{error}</span>
            </div>
          )}

            {result && (
              <DualChartsTemplate
                healthIndicator={
                  <div className="flex items-center gap-4">
                    <div className={`text-${getAffordabilityColor(result.affordability)}-600`}>
                      {getAffordabilityIcon(result.affordability)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Capacité d'endettement</div>
                      <div className={`text-2xl font-bold text-${getAffordabilityColor(result.affordability)}-900`}>
                        {getAffordabilityLabel(result.affordability)}
                      </div>
                    </div>
                  </div>
                }
                chart1={
                  <ModernBarChart
                    data={debtChartData}
                    dataKeys={['Dettes actuelles', 'Capacité restante', 'Maximum autorisé']}
                    formatValue={formatCurrency}
                  />
                }
                chart1Title="Répartition de l'endettement"
                chart1Description="Analyse de votre capacité d'endettement actuelle"
                chart2={
                  <ModernBarChart
                    data={loanBreakdownData}
                    dataKeys={['Capital emprunté', 'Intérêts totaux']}
                    formatValue={formatCurrency}
                  />
                }
                chart2Title="Composition du prêt"
                chart2Description="Répartition entre capital et intérêts"
                kpis={[
                  {
                    title: 'Paiement mensuel max',
                    value: formatCurrency(result.maxMonthlyPayment),
                    description: `${formatPercent(result.maxDebtRatio)} du revenu`,
                    icon: <DollarSign className="h-4 w-4" />,
                    variant: 'default' as const
                  },
                  {
                    title: 'Capacité restante',
                    value: formatCurrency(result.remainingCapacity),
                    description: 'Disponible pour nouveau crédit',
                    icon: <CheckCircle className="h-4 w-4" />,
                    variant: 'default' as const
                  },
                  {
                    title: 'Montant empruntable',
                    value: formatCurrency(result.loanDetails.maxLoanAmount),
                    description: `Sur ${result.loanDetails.loanTerm} ans`,
                    icon: <TrendingUp className="h-4 w-4" />,
                    variant: 'default' as const
                  }
                ]}
                loading={loading}
              />
            )}

            {/* Additional Details Below Bento Grid */}
            {result && (
              <div className="space-y-6 mt-6">
                {/* Loan Details */}
                <div className="p-6 bg-muted rounded-lg border">
                  <h4 className="text-lg font-semibold mb-4">Détails du prêt</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-card rounded border">
                      <span className="text-sm text-muted-foreground">Mensualité</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(result.loanDetails.monthlyPayment)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-card rounded border">
                      <span className="text-sm text-muted-foreground">Durée</span>
                      <span className="text-lg font-bold">
                        {result.loanDetails.loanTerm} ans
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-card rounded border">
                      <span className="text-sm text-muted-foreground">Taux d'intérêt</span>
                      <span className="text-lg font-bold">
                        {formatPercent(result.loanDetails.interestRate)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-card rounded border">
                      <span className="text-sm text-muted-foreground">Intérêts totaux</span>
                      <span className="text-lg font-bold text-orange-600">
                        {formatCurrency(result.loanDetails.totalInterest)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-card rounded border">
                      <span className="text-sm text-muted-foreground">Capital emprunté</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(result.loanDetails.maxLoanAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-card rounded border">
                      <span className="text-sm text-muted-foreground">Coût total</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(result.loanDetails.totalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Debt Ratio */}
                <div className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Taux d'endettement actuel</span>
                    <span className={`text-lg font-bold ${(result.currentDebts / result.monthlyIncome) <= 0.33 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(result.currentDebts / result.monthlyIncome)}
                    </span>
                  </div>
                  <div className="w-full bg-muted-foreground/20 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${(result.currentDebts / result.monthlyIncome) <= 0.33 ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{ width: `${Math.min((result.currentDebts / result.monthlyIncome) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span className="font-medium">33% (limite)</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Recommandations
                    </h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos du calcul</p>
                      <p>
                        Les banques françaises appliquent généralement un taux d'endettement maximum de 33% des revenus nets.
                        Ce calculateur vous aide à déterminer votre capacité d'emprunt en fonction de vos revenus et charges actuelles.
                        Les montants calculés sont indicatifs et peuvent varier selon les établissements bancaires.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
