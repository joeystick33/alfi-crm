'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { ModernLineChart } from '@/components/charts/ModernLineChart';
import { SaveSimulationButton } from '@/components/common/SaveSimulationButton';
import { 
  TrendingUp, 
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  Percent,
  User,
  AlertCircle,
  Target
} from 'lucide-react';

export function RetirementSimulator() {
  const [currentAge, setCurrentAge] = useState('35');
  const [retirementAge, setRetirementAge] = useState('65');
  const [lifeExpectancy, setLifeExpectancy] = useState('85');
  const [currentSavings, setCurrentSavings] = useState('50000');
  const [monthlyContribution, setMonthlyContribution] = useState('500');
  const [expectedReturn, setExpectedReturn] = useState('5');
  const [inflationRate, setInflationRate] = useState('2');
  const [currentIncome, setCurrentIncome] = useState('50000');
  const [desiredReplacementRate, setDesiredReplacementRate] = useState('70');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateRetirement();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentAge, retirementAge, lifeExpectancy, currentSavings, monthlyContribution, expectedReturn, inflationRate, currentIncome, desiredReplacementRate]);

  const simulateRetirement = async () => {
    const age = parseFloat(currentAge) || 0;
    const retAge = parseFloat(retirementAge) || 0;
    const lifeExp = parseFloat(lifeExpectancy) || 0;
    const savings = parseFloat(currentSavings) || 0;
    const contribution = parseFloat(monthlyContribution) || 0;
    const returnRate = parseFloat(expectedReturn) || 0;
    const inflation = parseFloat(inflationRate) || 0;
    const income = parseFloat(currentIncome) || 0;
    const replacementRate = parseFloat(desiredReplacementRate) || 0;

    if (age <= 0 || retAge <= age || lifeExp <= retAge) {
      setError('Veuillez vérifier les âges saisis');
      setResult(null);
      return;
    }

    if (income <= 0 || replacementRate <= 0 || replacementRate > 100) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/simulators/retirement/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAge: age,
          retirementAge: retAge,
          lifeExpectancy: lifeExp,
          currentSavings: savings,
          monthlyContribution: contribution,
          expectedReturn: returnRate / 100,
          inflationRate: inflation / 100,
          currentIncome: income,
          desiredReplacementRate: replacementRate / 100
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la simulation');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors de la simulation de retraite');
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

  // Prepare savings growth chart data
  const savingsGrowthData = result?.projection ? result.projection.map((p: any) => ({
    age: p.age,
    'Épargne accumulée': p.savingsBalance,
    'Contributions totales': p.totalContributions
  })) : [];

  // Prepare retirement income chart data
  const retirementIncomeData = result?.projection ? result.projection
    .filter((p: any) => p.age >= result.retirementAge)
    .map((p: any) => ({
      age: p.age,
      'Revenu souhaité': result.desiredAnnualIncome,
      'Revenu disponible': p.annualWithdrawal || 0
    })) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Simulateur de Retraite</CardTitle>
              <CardDescription>
                Simulez votre épargne retraite et projetez vos revenus futurs
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Âge actuel"
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                  placeholder="35"
                  min="18"
                  max="75"
                  required
                  icon={<User className="h-4 w-4" />}
                />

                <Input
                  label="Âge de départ à la retraite"
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(e.target.value)}
                  placeholder="65"
                  min="62"
                  max="75"
                  icon={<Calendar className="h-4 w-4" />}
                />

                <Input
                  label="Espérance de vie"
                  type="number"
                  value={lifeExpectancy}
                  onChange={(e) => setLifeExpectancy(e.target.value)}
                  placeholder="85"
                  min="70"
                  max="100"
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Situation financière
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Épargne actuelle (€)"
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  placeholder="50000"
                  icon={<DollarSign className="h-4 w-4" />}
                  helperText="Capital déjà constitué"
                />

                <Input
                  label="Contribution mensuelle (€)"
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder="500"
                  icon={<DollarSign className="h-4 w-4" />}
                  helperText="Épargne mensuelle"
                />

                <Input
                  label="Revenu annuel actuel (€)"
                  type="number"
                  value={currentIncome}
                  onChange={(e) => setCurrentIncome(e.target.value)}
                  placeholder="50000"
                  required
                  icon={<DollarSign className="h-4 w-4" />}
                  helperText="Revenu brut annuel"
                />
              </div>
            </div>

            {/* Investment Parameters */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Percent className="h-5 w-5 text-blue-600" />
                Paramètres d'investissement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Rendement attendu (%/an)"
                  type="number"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  placeholder="5"
                  step="0.1"
                  min="0"
                  max="15"
                  icon={<Percent className="h-4 w-4" />}
                  helperText="Rendement annuel moyen"
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
                  helperText="Inflation prévue"
                />

                <Input
                  label="Taux de remplacement souhaité (%)"
                  type="number"
                  value={desiredReplacementRate}
                  onChange={(e) => setDesiredReplacementRate(e.target.value)}
                  placeholder="70"
                  min="30"
                  max="100"
                  icon={<Target className="h-4 w-4" />}
                  helperText="% du revenu actuel"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6 mt-8">
                {/* Retirement Readiness Indicator */}
                <div className={`p-6 bg-gradient-to-br ${result.isRetirementFeasible ? 'from-green-50 to-green-100 border-green-300' : 'from-red-50 to-red-100 border-red-300'} rounded-lg border-2`}>
                  <div className="flex items-center gap-4">
                    <div className={result.isRetirementFeasible ? 'text-green-600' : 'text-red-600'}>
                      {result.isRetirementFeasible ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <AlertCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Faisabilité de la retraite</div>
                      <div className={`text-2xl font-bold ${result.isRetirementFeasible ? 'text-green-900' : 'text-red-900'}`}>
                        {result.isRetirementFeasible ? 'Objectif atteignable' : 'Ajustements nécessaires'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">Capital à la retraite</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(result.savingsAtRetirement)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      À {result.retirementAge} ans
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">Revenu annuel souhaité</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatCurrency(result.desiredAnnualIncome)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {formatPercent(result.desiredReplacementRate)} du revenu actuel
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Années de retraite</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {result.yearsInRetirement} ans
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      De {result.retirementAge} à {result.lifeExpectancy} ans
                    </div>
                  </div>

                  <div className={`p-4 bg-gradient-to-br ${result.incomeShortfall > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-green-50 to-green-100 border-green-200'} rounded-lg border`}>
                    <div className={`text-sm ${result.incomeShortfall > 0 ? 'text-red-600' : 'text-green-600'} font-medium mb-1`}>
                      {result.incomeShortfall > 0 ? 'Déficit annuel' : 'Surplus annuel'}
                    </div>
                    <div className={`text-2xl font-bold ${result.incomeShortfall > 0 ? 'text-red-900' : 'text-green-900'}`}>
                      {formatCurrency(Math.abs(result.incomeShortfall))}
                    </div>
                    <div className={`text-xs ${result.incomeShortfall > 0 ? 'text-red-600' : 'text-green-600'} mt-1`}>
                      Par an
                    </div>
                  </div>
                </div>

                {/* Accumulation Phase Details */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">Phase d'accumulation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Années avant retraite</span>
                      <span className="text-lg font-bold text-gray-900">
                        {result.yearsUntilRetirement} ans
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Contributions totales</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.totalContributions)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Gains d'investissement</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(result.investmentGains)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Savings Growth Chart */}
                  {savingsGrowthData.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                        Croissance de l'épargne
                      </h4>
                      <ModernLineChart
                        data={savingsGrowthData}
                        dataKeys={['Épargne accumulée', 'Contributions totales']}
                        xAxisKey="age"
                        formatValue={formatCurrency}
                        xAxisLabel="Âge"
                      />
                    </div>
                  )}

                  {/* Retirement Income Chart */}
                  {retirementIncomeData.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary-600" />
                        Revenus pendant la retraite
                      </h4>
                      <ModernLineChart
                        data={retirementIncomeData}
                        dataKeys={['Revenu souhaité', 'Revenu disponible']}
                        xAxisKey="age"
                        formatValue={formatCurrency}
                        xAxisLabel="Âge"
                      />
                    </div>
                  )}
                </div>

                {/* Income Shortfall Warning */}
                {result.incomeShortfall > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Déficit de revenu détecté
                    </h4>
                    <p className="text-sm text-red-800 mb-3">
                      Votre épargne ne suffira pas à maintenir le niveau de vie souhaité pendant toute la retraite.
                      Déficit annuel moyen : {formatCurrency(result.incomeShortfall)}
                    </p>
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

                {/* Save Simulation Button */}
                <div className="flex justify-center">
                  <SaveSimulationButton
                    type="RETIREMENT"
                    defaultName={`Simulation retraite - ${new Date().toLocaleDateString('fr-FR')}`}
                    parameters={{
                      currentAge: parseFloat(currentAge),
                      retirementAge: parseFloat(retirementAge),
                      lifeExpectancy: parseFloat(lifeExpectancy),
                      currentSavings: parseFloat(currentSavings),
                      monthlyContribution: parseFloat(monthlyContribution),
                      expectedReturn: parseFloat(expectedReturn),
                      inflationRate: parseFloat(inflationRate),
                      currentIncome: parseFloat(currentIncome),
                      desiredReplacementRate: parseFloat(desiredReplacementRate),
                    }}
                    results={result}
                    recommendations={result.recommendations}
                    feasibilityScore={result.isRetirementFeasible ? 85 : 45}
                  />
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de la simulation</p>
                      <p>
                        Cette simulation utilise la règle des 4% pour les retraits durables et prend en compte
                        l'inflation. Les rendements sont composés annuellement. Les résultats sont indicatifs
                        et ne garantissent pas les performances futures. Consultez un conseiller financier
                        pour une analyse personnalisée.
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
