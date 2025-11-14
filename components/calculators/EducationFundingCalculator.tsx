'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernLineChart } from '@/components/charts/ModernLineChart';
import { 
  GraduationCap, 
  TrendingUp, 
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  Percent,
  User
} from 'lucide-react';

export function EducationFundingCalculator() {
  const [childAge, setChildAge] = useState('5');
  const [educationStartAge, setEducationStartAge] = useState('18');
  const [annualCost, setAnnualCost] = useState('10000');
  const [educationDuration, setEducationDuration] = useState('5');
  const [currentSavings, setCurrentSavings] = useState('5000');
  const [inflationRate, setInflationRate] = useState('2');
  const [expectedReturn, setExpectedReturn] = useState('5');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateEducationFunding();
    }, 500);

    return () => clearTimeout(timer);
  }, [childAge, educationStartAge, annualCost, educationDuration, currentSavings, inflationRate, expectedReturn]);

  const calculateEducationFunding = async () => {
    const age = parseFloat(childAge) || 0;
    const startAge = parseFloat(educationStartAge) || 0;
    const cost = parseFloat(annualCost) || 0;
    const duration = parseFloat(educationDuration) || 0;
    const savings = parseFloat(currentSavings) || 0;
    const inflation = parseFloat(inflationRate) || 0;
    const returnRate = parseFloat(expectedReturn) || 0;

    if (age < 0 || age >= startAge) {
      setError('L\'âge actuel doit être inférieur à l\'âge de début des études');
      setResult(null);
      return;
    }

    if (cost <= 0 || duration <= 0) {
      setError('Le coût annuel et la durée doivent être positifs');
      setResult(null);
      return;
    }

    if (savings < 0 || inflation < 0 || returnRate < 0) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/objectives/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childAge: age,
          educationStartAge: startAge,
          annualCost: cost,
          educationDuration: duration,
          currentSavings: savings,
          inflationRate: inflation,
          expectedReturn: returnRate
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors du calcul du financement des études');
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

  // Prepare cost projection chart data
  const costProjectionData = result ? (() => {
    const data = [];
    const yearsUntilStart = result.yearsUntilStart;
    const monthlyContribution = result.requiredMonthlyContribution;
    const monthlyReturn = result.expectedReturn / 12;
    let balance = result.currentSavings;
    
    // Accumulation phase
    for (let year = 0; year <= yearsUntilStart; year++) {
      data.push({
        year: year,
        'Épargne accumulée': balance,
        'Coût total estimé': result.totalCostInflationAdjusted
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
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Calculateur de Financement des Études</CardTitle>
              <CardDescription>
                Planifiez le financement des études supérieures de votre enfant avec ajustement de l'inflation
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Âge actuel de l'enfant"
                type="number"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                placeholder="5"
                min="0"
                max="25"
                required
                icon={<User className="h-4 w-4" />}
                helperText="Âge de l'enfant aujourd'hui"
              />

              <Input
                label="Âge de début des études"
                type="number"
                value={educationStartAge}
                onChange={(e) => setEducationStartAge(e.target.value)}
                placeholder="18"
                min="1"
                max="30"
                icon={<GraduationCap className="h-4 w-4" />}
                helperText="Âge prévu pour commencer les études"
              />

              <Input
                label="Coût annuel des études (€)"
                type="number"
                value={annualCost}
                onChange={(e) => setAnnualCost(e.target.value)}
                placeholder="10000"
                required
                icon={<DollarSign className="h-4 w-4" />}
                helperText="Coût annuel estimé (valeur actuelle)"
              />

              <Input
                label="Durée des études (années)"
                type="number"
                value={educationDuration}
                onChange={(e) => setEducationDuration(e.target.value)}
                placeholder="5"
                min="1"
                max="10"
                icon={<Calendar className="h-4 w-4" />}
                helperText="Nombre d'années d'études"
              />

              <Input
                label="Épargne actuelle (€)"
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                placeholder="5000"
                icon={<DollarSign className="h-4 w-4" />}
                helperText="Montant déjà épargné"
              />

              <Input
                label="Taux d'inflation (%/an)"
                type="number"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                placeholder="2"
                step="0.1"
                min="0"
                max="10"
                icon={<Percent className="h-4 w-4" />}
                helperText="Inflation prévue des coûts d'éducation"
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
                      Pendant {result.yearsUntilStart} ans
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Coût total ajusté</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(result.totalCostInflationAdjusted)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Avec inflation de {formatPercent(result.inflationRate)}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">Coût annuel futur</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(result.totalCostAtStart / result.educationDuration)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      À l'âge de {result.educationStartAge} ans
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">Chronologie</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Âge actuel de l'enfant</span>
                      <span className="text-lg font-bold text-gray-900">
                        {result.childAge} ans
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Début des études</span>
                      <span className="text-lg font-bold text-gray-900">
                        {result.educationStartAge} ans
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Années avant le début</span>
                      <span className="text-lg font-bold text-blue-600">
                        {result.yearsUntilStart} ans
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Durée des études</span>
                      <span className="text-lg font-bold text-gray-900">
                        {result.educationDuration} ans
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">Détails des coûts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Coût annuel actuel</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.annualCost)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Coût total (valeur actuelle)</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.totalCostAtStart)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Impact de l'inflation</span>
                      <span className="text-lg font-bold text-orange-600">
                        +{formatCurrency(result.totalCostInflationAdjusted - result.totalCostAtStart)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Coût total ajusté</span>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(result.totalCostInflationAdjusted)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Épargne actuelle</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.currentSavings)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Rendement attendu</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPercent(result.expectedReturn)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Projection Chart */}
                {costProjectionData.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      Projection de l'épargne éducation
                    </h4>
                    <ModernLineChart
                      data={costProjectionData}
                      dataKeys={['Épargne accumulée', 'Coût total estimé']}
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
                        Ce calculateur prend en compte l'inflation des coûts d'éducation, qui est généralement
                        plus élevée que l'inflation générale. Les coûts sont ajustés chaque année jusqu'au début
                        des études. Le rendement de l'épargne est composé mensuellement. Les résultats sont
                        indicatifs et peuvent varier selon l'évolution réelle des coûts et des marchés.
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
