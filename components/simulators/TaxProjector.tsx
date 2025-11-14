'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernLineChart } from '@/components/charts/ModernLineChart';
import { 
  TrendingUp, 
  Info,
  DollarSign,
  Calendar,
  Percent,
  User,
  AlertCircle,
  Calculator
} from 'lucide-react';

export function TaxProjector() {
  const [currentIncome, setCurrentIncome] = useState('60000');
  const [incomeGrowthRate, setIncomeGrowthRate] = useState('2');
  const [currentDeductions, setCurrentDeductions] = useState('0');
  const [yearsToProject, setYearsToProject] = useState('10');
  const [familyQuotient, setFamilyQuotient] = useState('1');
  const [currentAge, setCurrentAge] = useState('35');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      projectTaxes();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentIncome, incomeGrowthRate, currentDeductions, yearsToProject, familyQuotient, currentAge]);

  const projectTaxes = async () => {
    const income = parseFloat(currentIncome) || 0;
    const growthRate = parseFloat(incomeGrowthRate) || 0;
    const deductions = parseFloat(currentDeductions) || 0;
    const years = parseInt(yearsToProject) || 0;
    const quotient = parseFloat(familyQuotient) || 1;
    const age = parseInt(currentAge) || 0;

    if (income <= 0) {
      setError('Veuillez entrer un revenu positif');
      setResult(null);
      return;
    }

    if (years < 1 || years > 50) {
      setError('Le nombre d\'années doit être entre 1 et 50');
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
      const response = await fetch('/api/simulators/tax/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentIncome: income,
          incomeGrowthRate: growthRate / 100,
          currentDeductions: deductions,
          yearsToProject: years,
          familyQuotient: quotient,
          currentAge: age > 0 ? age : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la projection');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la projection fiscale');
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
    return `${value.toFixed(1)}%`;
  };

  // Prepare timeline chart data
  const timelineData = result?.projections ? result.projections.map((p: any) => ({
    year: p.year,
    age: p.age,
    'Revenu brut': p.income,
    'Impôt total': p.totalTax,
    'Revenu net': p.netIncome
  })) : [];

  // Prepare tax breakdown chart data
  const taxBreakdownData = result?.projections ? result.projections.map((p: any) => ({
    year: p.year,
    'Impôt sur le revenu': p.incomeTax,
    'Prélèvements sociaux': p.socialContributions
  })) : [];

  // Prepare effective rate chart data
  const effectiveRateData = result?.projections ? result.projections.map((p: any) => ({
    year: p.year,
    'Taux effectif': p.effectiveRate
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
              <CardTitle>Projection Fiscale Multi-Années</CardTitle>
              <CardDescription>
                Projetez vos impôts sur plusieurs années avec croissance des revenus
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Input Parameters */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary-600" />
                Paramètres de projection
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Revenu annuel actuel (€)"
                  type="number"
                  value={currentIncome}
                  onChange={(e) => setCurrentIncome(e.target.value)}
                  placeholder="60000"
                  min={0}
                  required
                />

                <Input
                  label="Croissance annuelle (%)"
                  type="number"
                  value={incomeGrowthRate}
                  onChange={(e) => setIncomeGrowthRate(e.target.value)}
                  placeholder="2"
                  step={0.1}
                  min={-10}
                  max={20}
                />

                <Input
                  label="Déductions actuelles (€)"
                  type="number"
                  value={currentDeductions}
                  onChange={(e) => setCurrentDeductions(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Input
                  label="Nombre d'années"
                  type="number"
                  value={yearsToProject}
                  onChange={(e) => setYearsToProject(e.target.value)}
                  placeholder="10"
                  min={1}
                  max={50}
                  required
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
                  label="Âge actuel (optionnel)"
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                  placeholder="35"
                  min={18}
                  max={100}
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
                {/* Summary Metrics */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-4 mb-4">
                    <Info className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-blue-600">Résumé de la projection</div>
                      <div className="text-lg font-semibold text-blue-900">{result.summary}</div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <div className="text-sm text-red-600 font-medium mb-1">Impôts totaux</div>
                    <div className="text-2xl font-bold text-red-900">
                      {formatCurrency(result.totalTaxOverPeriod)}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Sur {result.input.yearsToProject} ans
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-600 font-medium mb-1">Impôt annuel moyen</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {formatCurrency(result.averageAnnualTax)}
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Par an
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Taux effectif moyen</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatPercent(result.averageEffectiveRate)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Du revenu brut
                    </div>
                  </div>
                </div>

                {/* Timeline Visualization */}
                {timelineData.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      Évolution des revenus et impôts
                    </h4>
                    <ModernLineChart
                      data={timelineData}
                      dataKeys={['Revenu brut', 'Impôt total', 'Revenu net']}
                      xAxisKey="year"
                      formatValue={formatCurrency}
                      xAxisLabel="Année"
                    />
                  </div>
                )}

                {/* Tax Breakdown Chart */}
                {taxBreakdownData.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary-600" />
                      Décomposition de l'impôt
                    </h4>
                    <ModernLineChart
                      data={taxBreakdownData}
                      dataKeys={['Impôt sur le revenu', 'Prélèvements sociaux']}
                      xAxisKey="year"
                      formatValue={formatCurrency}
                      xAxisLabel="Année"
                    />
                  </div>
                )}

                {/* Effective Rate Evolution */}
                {effectiveRateData.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Percent className="h-5 w-5 text-primary-600" />
                      Évolution du taux effectif d'imposition
                    </h4>
                    <ModernLineChart
                      data={effectiveRateData}
                      dataKeys={['Taux effectif']}
                      xAxisKey="year"
                      formatValue={(value) => `${value.toFixed(1)}%`}
                      xAxisLabel="Année"
                    />
                  </div>
                )}

                {/* Detailed Projections Table */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Détail année par année</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-left font-semibold text-gray-700 border">Année</th>
                          {result.projections[0]?.age && (
                            <th className="p-3 text-left font-semibold text-gray-700 border">Âge</th>
                          )}
                          <th className="p-3 text-right font-semibold text-gray-700 border">Revenu brut</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Déductions</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Impôt</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Prélèvements</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Total impôts</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Revenu net</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Taux effectif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.projections.map((projection: any, index: number) => (
                          <tr key={index} className="bg-white hover:bg-gray-50">
                            <td className="p-3 border font-semibold">{projection.year}</td>
                            {projection.age && (
                              <td className="p-3 border text-gray-600">{projection.age} ans</td>
                            )}
                            <td className="p-3 text-right border">{formatCurrency(projection.income)}</td>
                            <td className="p-3 text-right border text-green-600">{formatCurrency(projection.deductions)}</td>
                            <td className="p-3 text-right border text-red-600">{formatCurrency(projection.incomeTax)}</td>
                            <td className="p-3 text-right border text-orange-600">{formatCurrency(projection.socialContributions)}</td>
                            <td className="p-3 text-right border font-semibold text-red-700">{formatCurrency(projection.totalTax)}</td>
                            <td className="p-3 text-right border font-semibold text-green-700">{formatCurrency(projection.netIncome)}</td>
                            <td className="p-3 text-right border">{formatPercent(projection.effectiveRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de la projection</p>
                      <p>
                        Cette projection utilise les barèmes fiscaux français en vigueur pour 2024.
                        Les revenus et déductions croissent au taux indiqué. Les barèmes fiscaux
                        restent constants (pas d'indexation sur l'inflation). Pour une analyse
                        personnalisée et des stratégies d'optimisation, consultez un conseiller fiscal.
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
