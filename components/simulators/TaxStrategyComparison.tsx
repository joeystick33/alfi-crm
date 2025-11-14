'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { 
  Target, 
  CheckCircle, 
  Info,
  DollarSign,
  User,
  AlertCircle,
  TrendingUp,
  Award,
  Lightbulb,
  XCircle
} from 'lucide-react';

const STRATEGY_ICONS: Record<string, string> = {
  'PER (Plan Épargne Retraite)': '🏦',
  'Pinel (Immobilier neuf)': '🏠',
  'FCPI/FIP (Fonds innovation)': '💡',
  'Dons aux associations': '❤️',
  'Assurance-vie': '🛡️'
};

export function TaxStrategyComparison() {
  const [income, setIncome] = useState('80000');
  const [currentDeductions, setCurrentDeductions] = useState('0');
  const [familyQuotient, setFamilyQuotient] = useState('1');
  const [availableBudget, setAvailableBudget] = useState('10000');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      compareStrategies();
    }, 500);

    return () => clearTimeout(timer);
  }, [income, currentDeductions, familyQuotient, availableBudget]);

  const compareStrategies = async () => {
    const incomeValue = parseFloat(income) || 0;
    const deductions = parseFloat(currentDeductions) || 0;
    const quotient = parseFloat(familyQuotient) || 1;
    const budget = parseFloat(availableBudget) || 0;

    if (incomeValue <= 0) {
      setError('Veuillez entrer un revenu positif');
      setResult(null);
      return;
    }

    if (budget < 0) {
      setError('Le budget disponible doit être positif');
      setResult(null);
      return;
    }

    if (quotient < 1 || quotient > 10) {
      setError('Le quotient familial doit être entre 1 et 10');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/simulators/tax/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: incomeValue,
          currentDeductions: deductions,
          familyQuotient: quotient,
          availableBudget: budget
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la comparaison');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la comparaison des stratégies');
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
    return `${(value * 100).toFixed(0)}%`;
  };

  // Prepare tax savings chart data
  const savingsChartData = result?.strategies ? result.strategies.map((s: any) => ({
    name: s.strategyName.split(' ')[0], // Shortened name for chart
    'Investissement': s.investment,
    'Économie d\'impôt': s.taxSavings,
    'Bénéfice net': s.netBenefit
  })) : [];

  // Prepare ROI chart data
  const roiChartData = result?.strategies ? result.strategies.map((s: any) => ({
    name: s.strategyName.split(' ')[0],
    'ROI': s.roi * 100
  })) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Comparaison des Stratégies Fiscales</CardTitle>
              <CardDescription>
                Comparez différentes stratégies d'optimisation fiscale et identifiez la meilleure option
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Input Parameters */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Votre situation fiscale
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Revenu annuel imposable (€)"
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="80000"
                  min={0}
                  required
                />

                <Input
                  label="Déductions actuelles (€)"
                  type="number"
                  value={currentDeductions}
                  onChange={(e) => setCurrentDeductions(e.target.value)}
                  placeholder="0"
                  min={0}
                />

                <Input
                  label="Quotient familial"
                  type="number"
                  value={familyQuotient}
                  onChange={(e) => setFamilyQuotient(e.target.value)}
                  placeholder="1"
                  step={0.5}
                  min={1}
                  max={10}
                />

                <Input
                  label="Budget disponible (€)"
                  type="number"
                  value={availableBudget}
                  onChange={(e) => setAvailableBudget(e.target.value)}
                  placeholder="10000"
                  min={0}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="space-y-6 mt-8">
                {/* Baseline Tax */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Impôt actuel (sans optimisation)</div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        {formatCurrency(result.baselineTax)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-600">Économie maximale possible</div>
                      <div className="text-3xl font-bold text-green-600 mt-1">
                        {formatCurrency(result.maxSavings)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Strategy Highlight */}
                {result.strategies.length > 0 && (
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-200 rounded-lg">
                        <Award className="h-8 w-8 text-green-700" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-600 mb-1">Meilleure stratégie recommandée</div>
                        <div className="text-2xl font-bold text-green-900 mb-2">{result.bestStrategy}</div>
                        <div className="text-sm text-green-800">{result.recommendation}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategy Cards */}
                {result.strategies.length > 0 ? (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary-600" />
                      Stratégies disponibles
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {result.strategies.map((strategy: any, index: number) => {
                        const isBest = strategy.strategyName === result.bestStrategy;
                        const icon = STRATEGY_ICONS[strategy.strategyName] || '📊';
                        
                        return (
                          <div
                            key={index}
                            className={`p-6 rounded-lg border-2 transition-all ${
                              isBest
                                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="text-4xl">{icon}</div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h5 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                      {strategy.strategyName}
                                      {isBest && (
                                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
                                          RECOMMANDÉ
                                        </span>
                                      )}
                                    </h5>
                                    <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                                  </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                  <div className="p-3 bg-white rounded border border-gray-200">
                                    <div className="text-xs text-gray-600 mb-1">Investissement</div>
                                    <div className="text-lg font-bold text-gray-900">
                                      {formatCurrency(strategy.investment)}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-green-50 rounded border border-green-200">
                                    <div className="text-xs text-green-600 mb-1">Économie d'impôt</div>
                                    <div className="text-lg font-bold text-green-700">
                                      {formatCurrency(strategy.taxSavings)}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                    <div className="text-xs text-blue-600 mb-1">Bénéfice net</div>
                                    <div className="text-lg font-bold text-blue-700">
                                      {formatCurrency(strategy.netBenefit)}
                                    </div>
                                  </div>

                                  <div className="p-3 bg-purple-50 rounded border border-purple-200">
                                    <div className="text-xs text-purple-600 mb-1">ROI</div>
                                    <div className="text-lg font-bold text-purple-700">
                                      {formatPercent(strategy.roi)}
                                    </div>
                                  </div>
                                </div>

                                {/* Implementation Steps */}
                                {strategy.implementation && strategy.implementation.length > 0 && (
                                  <div className="mt-4">
                                    <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                                      Mise en œuvre
                                    </div>
                                    <ul className="space-y-1">
                                      {strategy.implementation.map((step: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                          <span>{step}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Constraints */}
                                {strategy.constraints && strategy.constraints.length > 0 && (
                                  <div className="mt-4">
                                    <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-orange-600" />
                                      Contraintes
                                    </div>
                                    <ul className="space-y-1">
                                      {strategy.constraints.map((constraint: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                          <XCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                          <span>{constraint}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Aucune stratégie disponible</p>
                        <p>
                          Avec votre budget actuel de {formatCurrency(parseFloat(availableBudget))}, 
                          aucune stratégie d'optimisation n'est applicable. Augmentez votre budget 
                          disponible pour voir les options possibles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison Charts */}
                {savingsChartData.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tax Savings Chart */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                        Économies d'impôt par stratégie
                      </h4>
                      <ModernBarChart
                        data={savingsChartData}
                        dataKeys={['Investissement', 'Économie d\'impôt', 'Bénéfice net']}
                        title=""
                        formatValue={formatCurrency}
                        stacked={false}
                      />
                    </div>

                    {/* ROI Chart */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary-600" />
                        Retour sur investissement (ROI)
                      </h4>
                      <ModernBarChart
                        data={roiChartData}
                        dataKeys={['ROI']}
                        title=""
                        formatValue={(value) => `${value.toFixed(0)}%`}
                        stacked={false}
                      />
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos des stratégies</p>
                      <p>
                        Ces stratégies sont basées sur la législation fiscale française 2024. 
                        Le ROI représente l'économie d'impôt divisée par l'investissement requis.
                        Certaines stratégies ont des contraintes de durée ou de plafonds. 
                        Consultez un conseiller fiscal pour une analyse personnalisée et pour 
                        vérifier votre éligibilité à chaque dispositif.
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
