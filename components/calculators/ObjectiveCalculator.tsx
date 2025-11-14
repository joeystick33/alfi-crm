'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernLineChart } from '@/components/charts/ModernLineChart';
import { 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  Percent
} from 'lucide-react';

export function ObjectiveCalculator() {
  const [objectiveName, setObjectiveName] = useState('Épargne retraite');
  const [targetAmount, setTargetAmount] = useState('500000');
  const [currentAmount, setCurrentAmount] = useState('50000');
  const [timeHorizon, setTimeHorizon] = useState('20');
  const [expectedReturn, setExpectedReturn] = useState('5');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateObjective();
    }, 500);

    return () => clearTimeout(timer);
  }, [objectiveName, targetAmount, currentAmount, timeHorizon, expectedReturn]);

  const calculateObjective = async () => {
    const target = parseFloat(targetAmount) || 0;
    const current = parseFloat(currentAmount) || 0;
    const horizon = parseFloat(timeHorizon) || 0;
    const returnRate = parseFloat(expectedReturn) || 0;

    if (target <= 0 || horizon <= 0) {
      setError('Le montant cible et l\'horizon temporel doivent être positifs');
      setResult(null);
      return;
    }

    if (current < 0 || returnRate < 0) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/objectives/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectiveName: objectiveName || 'Objectif financier',
          targetAmount: target,
          currentAmount: current,
          timeHorizon: horizon,
          expectedReturn: returnRate
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors du calcul de l\'objectif');
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

  // Prepare projection chart data
  const projectionData = result ? (() => {
    const data = [];
    const monthlyContribution = result.requiredMonthlyContribution;
    const monthlyReturn = result.expectedReturn / 12;
    let balance = result.currentAmount;
    
    for (let year = 0; year <= result.timeHorizon; year++) {
      const contributions = result.currentAmount + (monthlyContribution * 12 * year);
      data.push({
        year: year,
        'Épargne accumulée': balance,
        'Contributions totales': contributions,
        'Objectif': result.targetAmount
      });
      
      // Calculate next year's balance
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyReturn) + monthlyContribution;
      }
    }
    
    return data;
  })() : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Calculateur d'Objectif Financier</CardTitle>
              <CardDescription>
                Calculez les contributions mensuelles nécessaires pour atteindre votre objectif financier
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nom de l'objectif"
                  type="text"
                  value={objectiveName}
                  onChange={(e) => setObjectiveName(e.target.value)}
                  placeholder="Ex: Épargne retraite, Achat immobilier"
                  icon={<Target className="h-4 w-4" />}
                />
              </div>

              <Input
                label="Montant cible (€)"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="500000"
                required
                icon={<DollarSign className="h-4 w-4" />}
                helperText="Montant que vous souhaitez atteindre"
              />

              <Input
                label="Épargne actuelle (€)"
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="50000"
                icon={<DollarSign className="h-4 w-4" />}
                helperText="Montant déjà épargné"
              />

              <Input
                label="Horizon temporel (années)"
                type="number"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                placeholder="20"
                min="1"
                max="50"
                icon={<Calendar className="h-4 w-4" />}
                helperText="Nombre d'années pour atteindre l'objectif"
              />

              <Input
                label="Rendement attendu (%/an)"
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                placeholder="5"
                step="0.1"
                min="0"
                max="20"
                icon={<Percent className="h-4 w-4" />}
                helperText="Rendement annuel moyen espéré"
              />
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6 mt-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">Contribution mensuelle requise</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(result.requiredMonthlyContribution)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Par mois pendant {result.timeHorizon} ans
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">Contributions totales</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(result.totalContributions)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Capital investi
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Croissance attendue</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(result.expectedGrowth)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Gains d'investissement
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Progression vers l'objectif</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPercent(result.currentAmount / result.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                      className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${Math.min((result.currentAmount / result.targetAmount) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatCurrency(result.currentAmount)}</span>
                    <span className="font-medium">{formatCurrency(result.targetAmount)}</span>
                  </div>
                </div>

                {/* Objective Details */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">Détails de l'objectif</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Montant cible</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.targetAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Épargne actuelle</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.currentAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Horizon temporel</span>
                      <span className="text-lg font-bold text-gray-900">
                        {result.timeHorizon} ans
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Rendement attendu</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPercent(result.expectedReturn)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Montant final</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(result.finalAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Probabilité de succès</span>
                      <span className={`text-lg font-bold ${result.probability >= 0.8 ? 'text-green-600' : result.probability >= 0.6 ? 'text-orange-600' : 'text-red-600'}`}>
                        {formatPercent(result.probability)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Projection Chart */}
                {projectionData.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      Projection de l'épargne
                    </h4>
                    <ModernLineChart
                      data={projectionData}
                      dataKeys={['Épargne accumulée', 'Contributions totales', 'Objectif']}
                      xAxisKey="year"
                      formatValue={formatCurrency}
                      xAxisLabel="Années"
                    />
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
                      {result.recommendations.map((rec, index) => (
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
                        Ce calculateur utilise la formule de la valeur future avec contributions régulières.
                        Le rendement attendu est composé mensuellement. La probabilité de succès est basée
                        sur des simulations historiques de marché. Les résultats sont indicatifs et ne
                        garantissent pas les performances futures.
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
