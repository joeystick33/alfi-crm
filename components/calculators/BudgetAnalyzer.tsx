'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ModernPieChart } from '@/components/charts/ModernPieChart';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  DollarSign,
  PieChart,
  AlertCircle
} from 'lucide-react';

export function BudgetAnalyzer() {
  // Income state
  const [income, setIncome] = useState({
    salary: '4000',
    bonuses: '500',
    rentalIncome: '0',
    investmentIncome: '0',
    otherIncome: '0'
  });

  // Expenses state
  const [expenses, setExpenses] = useState({
    housing: '1200',
    utilities: '150',
    food: '400',
    transportation: '300',
    insurance: '200',
    healthcare: '100',
    education: '0',
    entertainment: '200',
    savings: '500',
    otherExpenses: '100'
  });

  // Debts state
  const [debts, setDebts] = useState({
    mortgage: '0',
    consumerLoans: '0',
    creditCards: '0',
    studentLoans: '0',
    otherDebts: '0'
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeBudget();
    }, 500);

    return () => clearTimeout(timer);
  }, [income, expenses, debts]);

  const analyzeBudget = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/budget/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: {
            salary: parseFloat(income.salary) || 0,
            bonuses: parseFloat(income.bonuses) || 0,
            rentalIncome: parseFloat(income.rentalIncome) || 0,
            investmentIncome: parseFloat(income.investmentIncome) || 0,
            otherIncome: parseFloat(income.otherIncome) || 0
          },
          expenses: {
            housing: parseFloat(expenses.housing) || 0,
            utilities: parseFloat(expenses.utilities) || 0,
            food: parseFloat(expenses.food) || 0,
            transportation: parseFloat(expenses.transportation) || 0,
            insurance: parseFloat(expenses.insurance) || 0,
            healthcare: parseFloat(expenses.healthcare) || 0,
            education: parseFloat(expenses.education) || 0,
            entertainment: parseFloat(expenses.entertainment) || 0,
            savings: parseFloat(expenses.savings) || 0,
            otherExpenses: parseFloat(expenses.otherExpenses) || 0
          },
          debts: {
            mortgage: parseFloat(debts.mortgage) || 0,
            consumerLoans: parseFloat(debts.consumerLoans) || 0,
            creditCards: parseFloat(debts.creditCards) || 0,
            studentLoans: parseFloat(debts.studentLoans) || 0,
            otherDebts: parseFloat(debts.otherDebts) || 0
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors de l\'analyse du budget');
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

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'green';
      case 'good':
        return 'blue';
      case 'warning':
        return 'orange';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-6 w-6" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  const getHealthLabel = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'Excellente';
      case 'good':
        return 'Bonne';
      case 'warning':
        return 'Attention';
      case 'critical':
        return 'Critique';
      default:
        return 'Inconnue';
    }
  };

  // Prepare expense breakdown chart data
  const expenseChartData = result ? [
    { name: 'Logement', value: result.expenses.breakdown.housing },
    { name: 'Alimentation', value: result.expenses.breakdown.food },
    { name: 'Transport', value: result.expenses.breakdown.transportation },
    { name: 'Assurances', value: result.expenses.breakdown.insurance },
    { name: 'Santé', value: result.expenses.breakdown.healthcare },
    { name: 'Loisirs', value: result.expenses.breakdown.entertainment },
    { name: 'Épargne', value: result.expenses.breakdown.savings },
    { name: 'Autres', value: result.expenses.breakdown.utilities + result.expenses.breakdown.education + result.expenses.breakdown.otherExpenses }
  ].filter(item => item.value > 0) : [];

  // Prepare income vs expenses chart data
  const comparisonChartData = result ? [
    {
      name: 'Budget',
      'Revenus': result.income.total,
      'Dépenses': result.expenses.total,
      'Dettes': result.debts.total
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
              <CardTitle>Analyseur de Budget</CardTitle>
              <CardDescription>
                Analysez votre situation budgétaire complète et obtenez des recommandations personnalisées
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-8">
            {/* Income Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Revenus mensuels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Salaire net"
                  type="number"
                  value={income.salary}
                  onChange={(e) => setIncome({ ...income, salary: e.target.value })}
                  placeholder="4000"
                />
                <Input
                  label="Primes"
                  type="number"
                  value={income.bonuses}
                  onChange={(e) => setIncome({ ...income, bonuses: e.target.value })}
                  placeholder="500"
                />
                <Input
                  label="Revenus locatifs"
                  type="number"
                  value={income.rentalIncome}
                  onChange={(e) => setIncome({ ...income, rentalIncome: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Revenus d'investissement"
                  type="number"
                  value={income.investmentIncome}
                  onChange={(e) => setIncome({ ...income, investmentIncome: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Autres revenus"
                  type="number"
                  value={income.otherIncome}
                  onChange={(e) => setIncome({ ...income, otherIncome: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Dépenses mensuelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Logement"
                  type="number"
                  value={expenses.housing}
                  onChange={(e) => setExpenses({ ...expenses, housing: e.target.value })}
                  placeholder="1200"
                />
                <Input
                  label="Charges (eau, électricité)"
                  type="number"
                  value={expenses.utilities}
                  onChange={(e) => setExpenses({ ...expenses, utilities: e.target.value })}
                  placeholder="150"
                />
                <Input
                  label="Alimentation"
                  type="number"
                  value={expenses.food}
                  onChange={(e) => setExpenses({ ...expenses, food: e.target.value })}
                  placeholder="400"
                />
                <Input
                  label="Transport"
                  type="number"
                  value={expenses.transportation}
                  onChange={(e) => setExpenses({ ...expenses, transportation: e.target.value })}
                  placeholder="300"
                />
                <Input
                  label="Assurances"
                  type="number"
                  value={expenses.insurance}
                  onChange={(e) => setExpenses({ ...expenses, insurance: e.target.value })}
                  placeholder="200"
                />
                <Input
                  label="Santé"
                  type="number"
                  value={expenses.healthcare}
                  onChange={(e) => setExpenses({ ...expenses, healthcare: e.target.value })}
                  placeholder="100"
                />
                <Input
                  label="Éducation"
                  type="number"
                  value={expenses.education}
                  onChange={(e) => setExpenses({ ...expenses, education: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Loisirs"
                  type="number"
                  value={expenses.entertainment}
                  onChange={(e) => setExpenses({ ...expenses, entertainment: e.target.value })}
                  placeholder="200"
                />
                <Input
                  label="Épargne"
                  type="number"
                  value={expenses.savings}
                  onChange={(e) => setExpenses({ ...expenses, savings: e.target.value })}
                  placeholder="500"
                />
                <Input
                  label="Autres dépenses"
                  type="number"
                  value={expenses.otherExpenses}
                  onChange={(e) => setExpenses({ ...expenses, otherExpenses: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            {/* Debts Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Charges de dettes mensuelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Crédit immobilier"
                  type="number"
                  value={debts.mortgage}
                  onChange={(e) => setDebts({ ...debts, mortgage: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Crédits à la consommation"
                  type="number"
                  value={debts.consumerLoans}
                  onChange={(e) => setDebts({ ...debts, consumerLoans: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Cartes de crédit"
                  type="number"
                  value={debts.creditCards}
                  onChange={(e) => setDebts({ ...debts, creditCards: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Prêts étudiants"
                  type="number"
                  value={debts.studentLoans}
                  onChange={(e) => setDebts({ ...debts, studentLoans: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="Autres dettes"
                  type="number"
                  value={debts.otherDebts}
                  onChange={(e) => setDebts({ ...debts, otherDebts: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6 mt-8">
                {/* Budget Health Indicator */}
                <div className={`p-6 bg-gradient-to-br from-${getHealthColor(result.budgetHealth)}-50 to-${getHealthColor(result.budgetHealth)}-100 rounded-lg border-2 border-${getHealthColor(result.budgetHealth)}-300`}>
                  <div className="flex items-center gap-4">
                    <div className={`text-${getHealthColor(result.budgetHealth)}-600`}>
                      {getHealthIcon(result.budgetHealth)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Santé budgétaire</div>
                      <div className={`text-2xl font-bold text-${getHealthColor(result.budgetHealth)}-900`}>
                        {getHealthLabel(result.budgetHealth)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">Revenus totaux</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(result.income.total)}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Dépenses totales</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(result.expenses.total)}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-600 font-medium mb-1">Charges de dettes</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {formatCurrency(result.debts.total)}
                    </div>
                  </div>

                  <div className={`p-4 bg-gradient-to-br from-${result.metrics.disposableIncome >= 0 ? 'green' : 'red'}-50 to-${result.metrics.disposableIncome >= 0 ? 'green' : 'red'}-100 rounded-lg border border-${result.metrics.disposableIncome >= 0 ? 'green' : 'red'}-200`}>
                    <div className={`text-sm text-${result.metrics.disposableIncome >= 0 ? 'green' : 'red'}-600 font-medium mb-1`}>Revenu disponible</div>
                    <div className={`text-2xl font-bold text-${result.metrics.disposableIncome >= 0 ? 'green' : 'red'}-900`}>
                      {formatCurrency(result.metrics.disposableIncome)}
                    </div>
                  </div>
                </div>

                {/* Financial Ratios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taux d'épargne</span>
                      <span className={`text-lg font-bold ${result.metrics.savingsRate >= 0.10 ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatPercent(result.metrics.savingsRate)}
                      </span>
                    </div>
                    <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${result.metrics.savingsRate >= 0.10 ? 'bg-green-600' : 'bg-orange-600'}`}
                        style={{ width: `${Math.min(result.metrics.savingsRate * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taux d'endettement</span>
                      <span className={`text-lg font-bold ${result.metrics.debtRatio <= 0.33 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(result.metrics.debtRatio)}
                      </span>
                    </div>
                    <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${result.metrics.debtRatio <= 0.33 ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(result.metrics.debtRatio * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Capacité restante</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(result.metrics.remainingCapacity)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Pour nouveaux crédits
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Income vs Expenses */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Revenus vs Dépenses
                    </h4>
                    <ModernBarChart
                      data={comparisonChartData}
                      dataKeys={['Revenus', 'Dépenses', 'Dettes']}
                      formatValue={formatCurrency}
                    />
                  </div>

                  {/* Expense Breakdown */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Répartition des dépenses
                    </h4>
                    <ModernPieChart
                      data={expenseChartData}
                      formatValue={formatCurrency}
                    />
                  </div>
                </div>

                {/* Alerts */}
                {result.alerts && result.alerts.length > 0 && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Alertes
                    </h4>
                    <ul className="space-y-1">
                      {result.alerts.map((alert: string, index: number) => (
                        <li key={index} className="text-sm text-destructive">
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
