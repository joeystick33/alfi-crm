'use client';
 

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Label } from '@/app/_common/components/ui/Label';
import { ModernPieChart } from '@/app/_common/components/charts/ModernPieChart';
import { ModernBarChart } from '@/app/_common/components/charts/ModernBarChart';
import { DualChartsTemplate } from '@/app/_common/components/ui/bento/DualChartsTemplate';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  DollarSign,
  PieChart,
  AlertCircle,
  Loader2,
  RefreshCw,
  Home,
  Car,
  Utensils,
  Heart,
  CreditCard,
  Euro
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

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
  const [hasCalculated, setHasCalculated] = useState(false);
  const [activeSection, setActiveSection] = useState<'income' | 'expenses' | 'debts'>('income');

  // Calculer les totaux en temps réel pour l'affichage
  const totalIncome = Object.values(income).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const totalDebts = Object.values(debts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const balance = totalIncome - totalExpenses - totalDebts;

  const analyzeBudget = async () => {
    if (totalIncome <= 0) {
      setError('Veuillez entrer au moins un revenu');
      return;
    }

    setError('');
    setLoading(true);
    setHasCalculated(true);

    try {
      const response = await fetch('/api/advisor/calculators/budget/analyze', {
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
      setResult(data.data || data.result || data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse du budget');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIncome({ salary: '4000', bonuses: '500', rentalIncome: '0', investmentIncome: '0', otherIncome: '0' });
    setExpenses({ housing: '1200', utilities: '150', food: '400', transportation: '300', insurance: '200', healthcare: '100', education: '0', entertainment: '200', savings: '500', otherExpenses: '100' });
    setDebts({ mortgage: '0', consumerLoans: '0', creditCards: '0', studentLoans: '0', otherDebts: '0' });
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
  ].filter((item: any) => item.value > 0) : [];

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

        <CardContent className="pt-6">
          {/* Résumé en temps réel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-xs text-emerald-600 font-medium">Revenus</div>
              <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-600 font-medium">Dépenses</div>
              <div className="text-xl font-bold text-blue-700">{formatCurrency(totalExpenses)}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xs text-red-600 font-medium">Dettes</div>
              <div className="text-xl font-bold text-red-700">{formatCurrency(totalDebts)}</div>
            </div>
            <div className={cn(
              'p-4 rounded-lg border',
              balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <div className={cn('text-xs font-medium', balance >= 0 ? 'text-green-600' : 'text-red-600')}>Solde</div>
              <div className={cn('text-xl font-bold', balance >= 0 ? 'text-green-700' : 'text-red-700')}>
                {formatCurrency(balance)}
              </div>
            </div>
          </div>

          {/* Navigation par sections */}
          <div className="flex gap-2 mb-6 border-b">
            {[
              { key: 'income', label: 'Revenus', icon: DollarSign, color: 'emerald' },
              { key: 'expenses', label: 'Dépenses', icon: PieChart, color: 'blue' },
              { key: 'debts', label: 'Dettes', icon: CreditCard, color: 'red' },
            ].map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 -mb-[2px] transition-all',
                  activeSection === section.key
                    ? `border-${section.color}-500 text-${section.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </div>

          {/* Section Revenus */}
          {activeSection === 'income' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Revenus mensuels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'salary', label: 'Salaire net', placeholder: '4000' },
                  { key: 'bonuses', label: 'Primes', placeholder: '500' },
                  { key: 'rentalIncome', label: 'Revenus locatifs', placeholder: '0' },
                  { key: 'investmentIncome', label: 'Revenus placements', placeholder: '0' },
                  { key: 'otherIncome', label: 'Autres revenus', placeholder: '0' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-sm">{field.label}</Label>
                    <div className="relative">
                      <input
                        type="number"
                        value={income[field.key as keyof typeof income]}
                        onChange={(e) => setIncome({ ...income, [field.key]: e.target.value })}
                        className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                        placeholder={field.placeholder}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Dépenses */}
          {activeSection === 'expenses' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Dépenses mensuelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { key: 'housing', label: 'Logement', placeholder: '1200', icon: Home },
                  { key: 'utilities', label: 'Charges', placeholder: '150', icon: Euro },
                  { key: 'food', label: 'Alimentation', placeholder: '400', icon: Utensils },
                  { key: 'transportation', label: 'Transport', placeholder: '300', icon: Car },
                  { key: 'insurance', label: 'Assurances', placeholder: '200', icon: Heart },
                  { key: 'healthcare', label: 'Santé', placeholder: '100', icon: Heart },
                  { key: 'education', label: 'Éducation', placeholder: '0', icon: Euro },
                  { key: 'entertainment', label: 'Loisirs', placeholder: '200', icon: Euro },
                  { key: 'savings', label: 'Épargne', placeholder: '500', icon: TrendingUp },
                  { key: 'otherExpenses', label: 'Autres', placeholder: '100', icon: Euro },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-sm flex items-center gap-1">
                      <field.icon className="h-3 w-3" />
                      {field.label}
                    </Label>
                    <div className="relative">
                      <input
                        type="number"
                        value={expenses[field.key as keyof typeof expenses]}
                        onChange={(e) => setExpenses({ ...expenses, [field.key]: e.target.value })}
                        className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        placeholder={field.placeholder}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Dettes */}
          {activeSection === 'debts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-600" />
                Remboursements mensuels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'mortgage', label: 'Crédit immobilier', placeholder: '0' },
                  { key: 'consumerLoans', label: 'Crédits conso', placeholder: '0' },
                  { key: 'creditCards', label: 'Cartes de crédit', placeholder: '0' },
                  { key: 'studentLoans', label: 'Prêt étudiant', placeholder: '0' },
                  { key: 'otherDebts', label: 'Autres dettes', placeholder: '0' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-sm">{field.label}</Label>
                    <div className="relative">
                      <input
                        type="number"
                        value={debts[field.key as keyof typeof debts]}
                        onChange={(e) => setDebts({ ...debts, [field.key]: e.target.value })}
                        className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                        placeholder={field.placeholder}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton Analyser */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-6 mt-6 border-t">
            <Button 
              onClick={analyzeBudget} 
              disabled={loading || totalIncome <= 0}
              size="lg"
              className="w-full sm:w-auto min-w-[220px] h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Analyser mon budget
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

          {/* Résultats */}
          {result && (
            <div className="mt-6">
              <DualChartsTemplate
                healthIndicator={
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
                }
                chart1={
                  <ModernBarChart
                    data={comparisonChartData}
                    dataKeys={['Revenus', 'Dépenses', 'Dettes']}
                    formatValue={formatCurrency}
                  />
                }
                chart1Title="Revenus vs Dépenses"
                chart1Description="Comparaison des revenus, dépenses et dettes mensuelles"
                chart2={
                  <ModernPieChart
                    data={expenseChartData}
                    formatValue={formatCurrency}
                  />
                }
                chart2Title="Répartition des dépenses"
                chart2Description="Distribution des dépenses par catégorie"
                kpis={[
                  {
                    title: 'Revenus totaux',
                    value: formatCurrency(result.income.total),
                    icon: <DollarSign className="h-4 w-4" />,
                    variant: 'default' as const
                  },
                  {
                    title: 'Dépenses totales',
                    value: formatCurrency(result.expenses.total),
                    icon: <TrendingUp className="h-4 w-4" />,
                    variant: 'default' as const
                  },
                  {
                    title: 'Charges de dettes',
                    value: formatCurrency(result.debts.total),
                    icon: <AlertTriangle className="h-4 w-4" />,
                    variant: 'default' as const
                  },
                  {
                    title: 'Revenu disponible',
                    value: formatCurrency(result.metrics.disposableIncome),
                    change: result.metrics.disposableIncome >= 0 ? { value: 0, trend: 'up' as const } : { value: 0, trend: 'down' as const },
                    icon: <CheckCircle className="h-4 w-4" />,
                    variant: 'default' as const
                  },
                  {
                    title: 'Taux d\'épargne',
                    value: formatPercent(result.metrics.savingsRate),
                    change: result.metrics.savingsRate >= 0.10 ? { value: 0, trend: 'up' as const } : { value: 0, trend: 'down' as const },
                    variant: 'default' as const
                  },
                  {
                    title: 'Taux d\'endettement',
                    value: formatPercent(result.metrics.debtRatio),
                    change: result.metrics.debtRatio <= 0.33 ? { value: 0, trend: 'up' as const } : { value: 0, trend: 'down' as const },
                    variant: 'default' as const
                  }
                ]}
                loading={loading}
              />

              {/* Additional Details Below Bento Grid */}
              <div className="space-y-6 mt-6">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
