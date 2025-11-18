'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { DualChartsTemplate } from '@/components/ui/bento/DualChartsTemplate';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  DollarSign,
  Percent,
  Calendar
} from 'lucide-react';

export function DebtCapacityCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState('4000');
  const [currentDebts, setCurrentDebts] = useState('800');
  const [interestRate, setInterestRate] = useState('3.5');
  const [loanTerm, setLoanTerm] = useState('20');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateDebtCapacity();
    }, 500);

    return () => clearTimeout(timer);
  }, [monthlyIncome, currentDebts, interestRate, loanTerm]);

  const calculateDebtCapacity = async () => {
    const income = parseFloat(monthlyIncome) || 0;
    const debts = parseFloat(currentDebts) || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseFloat(loanTerm) || 0;

    if (income <= 0) {
      setError('Le revenu mensuel doit être positif');
      setResult(null);
      return;
    }

    if (debts < 0 || rate < 0 || term <= 0) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/budget/debt-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: income,
          currentDebts: debts,
          interestRate: rate / 100,
          loanTerm: term
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors du calcul de la capacité d\'endettement');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

        <CardContent>
          <div className="space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Revenu mensuel net"
                type="number"
                value={monthlyIncome}
                onChange={(e: any) => setMonthlyIncome(e.target.value)}
                placeholder="4000"
              />

              <Input
                label="Charges de dettes actuelles"
                type="number"
                value={currentDebts}
                onChange={(e: any) => setCurrentDebts(e.target.value)}
                placeholder="800"
              />

              <Input
                label="Taux d'intérêt annuel (%)"
                type="number"
                value={interestRate}
                onChange={(e: any) => setInterestRate(e.target.value)}
                placeholder="3.5"
                step="0.1"
              />

              <Input
                label="Durée du prêt (années)"
                type="number"
                value={loanTerm}
                onChange={(e: any) => setLoanTerm(e.target.value)}
                placeholder="20"
              />
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                {error}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
