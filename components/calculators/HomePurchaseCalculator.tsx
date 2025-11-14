'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernLineChart } from '@/components/charts/ModernLineChart';
import { ModernPieChart } from '@/components/charts/ModernPieChart';
import { 
  Home, 
  TrendingUp, 
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  Percent
} from 'lucide-react';

export function HomePurchaseCalculator() {
  const [targetPrice, setTargetPrice] = useState('300000');
  const [downPaymentPercent, setDownPaymentPercent] = useState('20');
  const [currentSavings, setCurrentSavings] = useState('30000');
  const [timeHorizon, setTimeHorizon] = useState('5');
  const [priceAppreciation, setPriceAppreciation] = useState('3');
  const [expectedReturn, setExpectedReturn] = useState('4');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateHomePurchase();
    }, 500);

    return () => clearTimeout(timer);
  }, [targetPrice, downPaymentPercent, currentSavings, timeHorizon, priceAppreciation, expectedReturn]);

  const calculateHomePurchase = async () => {
    const price = parseFloat(targetPrice) || 0;
    const downPayment = parseFloat(downPaymentPercent) || 0;
    const savings = parseFloat(currentSavings) || 0;
    const horizon = parseFloat(timeHorizon) || 0;
    const appreciation = parseFloat(priceAppreciation) || 0;
    const returnRate = parseFloat(expectedReturn) || 0;

    if (price <= 0 || horizon <= 0) {
      setError('Le prix cible et l\'horizon temporel doivent être positifs');
      setResult(null);
      return;
    }

    if (downPayment < 0 || downPayment > 100) {
      setError('L\'apport doit être entre 0% et 100%');
      setResult(null);
      return;
    }

    if (savings < 0 || appreciation < 0 || returnRate < 0) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/objectives/home-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPrice: price,
          downPaymentPercent: downPayment,
          currentSavings: savings,
          timeHorizon: horizon,
          priceAppreciation: appreciation,
          expectedReturn: returnRate
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors du calcul de l\'achat immobilier');
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

  // Prepare savings projection chart data
  const savingsProjectionData = result ? (() => {
    const data = [];
    const monthlyContribution = result.requiredMonthlyContribution;
    const monthlyReturn = result.expectedReturn / 12;
    let balance = result.currentSavings;
    
    for (let year = 0; year <= result.timeHorizon; year++) {
      data.push({
        year: year,
        'Épargne accumulée': balance,
        'Objectif': result.adjustedTotalNeeded
      });
      
      // Calculate next year's balance
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyReturn) + monthlyContribution;
      }
    }
    
    return data;
  })() : [];

  // Prepare cost breakdown pie chart data
  const costBreakdownData = result ? [
    { name: 'Apport', value: result.downPaymentAmount, color: '#3b82f6' },
    { name: 'Frais de notaire', value: result.closingCosts, color: '#f59e0b' }
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Calculateur d'Achat Immobilier</CardTitle>
              <CardDescription>
                Planifiez votre achat immobilier avec apport, frais de notaire et appréciation du prix
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prix cible du bien (€)"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="300000"
                required
                icon={<Home className="h-4 w-4" />}
                helperText="Prix actuel du bien immobilier"
              />

              <Input
                label="Apport souhaité (%)"
                type="number"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(e.target.value)}
                placeholder="20"
                min="0"
                max="100"
                step="1"
                icon={<Percent className="h-4 w-4" />}
                helperText="Pourcentage d'apport personnel"
              />

              <Input
                label="Épargne actuelle (€)"
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                placeholder="30000"
                icon={<DollarSign className="h-4 w-4" />}
                helperText="Montant déjà épargné"
              />

              <Input
                label="Horizon temporel (années)"
                type="number"
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                placeholder="5"
                min="1"
                max="30"
                icon={<Calendar className="h-4 w-4" />}
                helperText="Délai avant l'achat prévu"
              />

              <Input
                label="Appréciation du prix (%/an)"
                type="number"
                value={priceAppreciation}
                onChange={(e) => setPriceAppreciation(e.target.value)}
                placeholder="3"
                step="0.1"
                min="0"
                max="10"
                icon={<Percent className="h-4 w-4" />}
                helperText="Hausse annuelle prévue du prix"
              />

              <Input
                label="Rendement de l'épargne (%/an)"
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                placeholder="4"
                step="0.1"
                min="0"
                max="20"
                icon={<Percent className="h-4 w-4" />}
                helperText="Rendement annuel de votre épargne"
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
                      Pendant {result.timeHorizon} ans
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Total nécessaire</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(result.adjustedTotalNeeded)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Apport + frais de notaire
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">Prix ajusté du bien</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(result.adjustedTargetPrice)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Dans {result.timeHorizon} ans
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Progression vers l'objectif</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPercent(result.currentSavings / result.adjustedTotalNeeded)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                      className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${Math.min((result.currentSavings / result.adjustedTotalNeeded) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatCurrency(result.currentSavings)}</span>
                    <span className="font-medium">{formatCurrency(result.adjustedTotalNeeded)}</span>
                  </div>
                </div>

                {/* Purchase Details */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">Détails de l'achat</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Prix actuel du bien</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.targetPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Prix ajusté futur</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(result.adjustedTargetPrice)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Apport ({formatPercent(result.downPaymentPercent)})</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(result.downPaymentAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Frais de notaire (7-8%)</span>
                      <span className="text-lg font-bold text-orange-600">
                        {formatCurrency(result.closingCosts)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Total nécessaire</span>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(result.totalNeeded)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Total ajusté</span>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(result.adjustedTotalNeeded)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Épargne actuelle</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.currentSavings)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Montant à crédit</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.adjustedTargetPrice - result.downPaymentAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Savings Projection */}
                  {savingsProjectionData.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                        Projection de l'épargne
                      </h4>
                      <ModernLineChart
                        data={savingsProjectionData}
                        dataKeys={['Épargne accumulée', 'Objectif']}
                        xAxisKey="year"
                        formatValue={formatCurrency}
                        xAxisLabel="Années"
                      />
                    </div>
                  )}

                  {/* Cost Breakdown */}
                  {costBreakdownData.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary-600" />
                        Répartition des coûts
                      </h4>
                      <ModernPieChart
                        data={costBreakdownData}
                        formatValue={formatCurrency}
                      />
                    </div>
                  )}
                </div>

                {/* Price Appreciation Impact */}
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Impact de l'appréciation du prix
                  </h4>
                  <p className="text-sm text-orange-800">
                    Avec une appréciation annuelle de {formatPercent(result.priceAppreciation)}, 
                    le prix du bien passera de {formatCurrency(result.targetPrice)} à{' '}
                    {formatCurrency(result.adjustedTargetPrice)} dans {result.timeHorizon} ans,
                    soit une augmentation de {formatCurrency(result.adjustedTargetPrice - result.targetPrice)}.
                  </p>
                </div>

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
                        Ce calculateur prend en compte l'appréciation du prix immobilier et les frais de notaire
                        (estimés à 7-8% du prix). L'apport recommandé est généralement de 20% minimum pour obtenir
                        les meilleures conditions de crédit. Le rendement de l'épargne est composé mensuellement.
                        Les résultats sont indicatifs et peuvent varier selon l'évolution du marché immobilier.
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
