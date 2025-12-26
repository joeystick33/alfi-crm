 
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Input } from '@/app/_common/components/ui/Input';
import { ModernBarChart } from '@/app/_common/components/charts/ModernBarChart';
import { 
  TrendingUp, 
  CheckCircle, 
  Info,
  DollarSign,
  Percent,
  AlertCircle,
  Award,
  XCircle,
  PiggyBank
} from 'lucide-react';

const VEHICLE_INFO: Record<string, { icon: string; color: string }> = {
  'PEA (Plan d\'Épargne en Actions)': { icon: '📈', color: 'blue' },
  'Assurance-vie': { icon: '🛡️', color: 'green' },
  'Compte-titres ordinaire': { icon: '💼', color: 'gray' },
  'PER (Plan Épargne Retraite)': { icon: '🏦', color: 'purple' },
  'SCPI (Pierre-papier)': { icon: '🏠', color: 'orange' }
};

export function InvestmentVehicleComparison() {
  const [investmentAmount, setInvestmentAmount] = useState('50000');
  const [holdingPeriod, setHoldingPeriod] = useState('10');
  const [expectedReturn, setExpectedReturn] = useState('5');
  
  const [result, setResult] = useState<{ comparisons?: { name: string; grossReturn: number; taxOnReturn: number; netReturn: number; effectiveTaxRate: number; investmentAmount?: number; advantages?: string[]; constraints?: string[] }[]; recommendation?: string; bestVehicle?: string; maxNetReturn?: number } | null>(null);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      compareVehicles();
    }, 500);

    return () => clearTimeout(timer);
  }, [investmentAmount, holdingPeriod, expectedReturn]);

  const compareVehicles = async () => {
    const amount = parseFloat(investmentAmount) || 0;
    const period = parseInt(holdingPeriod) || 0;
    const returnRate = parseFloat(expectedReturn) || 0;

    if (amount <= 0) {
      setError('Veuillez entrer un montant d\'investissement positif');
      setResult(null);
      return;
    }

    if (period < 1 || period > 50) {
      setError('La durée de détention doit être entre 1 et 50 ans');
      setResult(null);
      return;
    }

    if (returnRate < -50 || returnRate > 50) {
      setError('Le rendement attendu doit être entre -50% et 50%');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/advisor/simulators/tax/investment-vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentAmount: amount,
          holdingPeriod: period,
          expectedAnnualReturn: returnRate / 100
        })
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        const message = payload?.error || payload?.message || 'Erreur lors de la comparaison';
        throw new Error(message);
      }

      setResult(payload.data || payload.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la comparaison des véhicules');
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

  // Prepare comparison chart data
  const comparisonChartData = result?.comparisons ? result.comparisons.map((v) => ({
    name: v.name.split(' ')[0], // Shortened name
    'Rendement brut': v.grossReturn,
    'Impôt': v.taxOnReturn,
    'Rendement net': v.netReturn
  })) : [];

  // Prepare tax rate chart data
  const taxRateChartData = result?.comparisons ? result.comparisons.map((v) => ({
    name: v.name.split(' ')[0],
    'Taux d\'imposition': v.effectiveTaxRate
  })) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <PiggyBank className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Comparaison des Véhicules d'Investissement</CardTitle>
              <CardDescription>
                Comparez l'efficacité fiscale de différents véhicules d'investissement
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
                Paramètres d'investissement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Montant à investir (€)"
                  type="number"
                  value={investmentAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvestmentAmount(e.target.value)}
                  placeholder="50000"
                  min={1}
                  required
                />

                <Input
                  label="Durée de détention (années)"
                  type="number"
                  value={holdingPeriod}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoldingPeriod(e.target.value)}
                  placeholder="10"
                  min={1}
                  max={50}
                  required
                />

                <Input
                  label="Rendement attendu (%/an)"
                  type="number"
                  value={expectedReturn}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpectedReturn(e.target.value)}
                  placeholder="5"
                  step={0.1}
                  min={-50}
                  max={50}
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
                {/* Best Vehicle Highlight */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-200 rounded-lg">
                      <Award className="h-8 w-8 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-green-600 mb-1">Meilleur véhicule d'investissement</div>
                      <div className="text-2xl font-bold text-green-900 mb-2">{result.bestVehicle}</div>
                      <div className="text-lg font-semibold text-green-800 mb-2">
                        Rendement net: {formatCurrency(result.maxNetReturn)}
                      </div>
                      <div className="text-sm text-green-800">{result.recommendation}</div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Comparison Cards */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                    Comparaison détaillée
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {result.comparisons.map((vehicle: any, index: number) => {
                      const isBest = vehicle.name === result.bestVehicle;
                      const vehicleInfo = VEHICLE_INFO[vehicle.name] || { icon: '📊', color: 'gray' };
                      
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
                            <div className="text-4xl">{vehicleInfo.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h5 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {vehicle.name}
                                    {isBest && (
                                      <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
                                        MEILLEUR CHOIX
                                      </span>
                                    )}
                                  </h5>
                                </div>
                              </div>

                              {/* Metrics Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                <div className="p-3 bg-white rounded border border-gray-200">
                                  <div className="text-xs text-gray-600 mb-1">Investissement</div>
                                  <div className="text-base font-bold text-gray-900">
                                    {formatCurrency(vehicle.investmentAmount)}
                                  </div>
                                </div>

                                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                  <div className="text-xs text-blue-600 mb-1">Rendement brut</div>
                                  <div className="text-base font-bold text-blue-700">
                                    {formatCurrency(vehicle.grossReturn)}
                                  </div>
                                </div>

                                <div className="p-3 bg-red-50 rounded border border-red-200">
                                  <div className="text-xs text-red-600 mb-1">Impôt</div>
                                  <div className="text-base font-bold text-red-700">
                                    {formatCurrency(vehicle.taxOnReturn)}
                                  </div>
                                </div>

                                <div className="p-3 bg-green-50 rounded border border-green-200">
                                  <div className="text-xs text-green-600 mb-1">Rendement net</div>
                                  <div className="text-base font-bold text-green-700">
                                    {formatCurrency(vehicle.netReturn)}
                                  </div>
                                </div>

                                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                                  <div className="text-xs text-purple-600 mb-1">Taux d'imposition</div>
                                  <div className="text-base font-bold text-purple-700">
                                    {formatPercent(vehicle.effectiveTaxRate)}
                                  </div>
                                </div>
                              </div>

                              {/* Advantages */}
                              {vehicle.advantages && vehicle.advantages.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Avantages
                                  </div>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {vehicle.advantages.map((advantage: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                        <span className="text-green-600 flex-shrink-0">✓</span>
                                        <span>{advantage}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Disadvantages */}
                              {vehicle.disadvantages && vehicle.disadvantages.length > 0 && (
                                <div>
                                  <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-orange-600" />
                                    Inconvénients
                                  </div>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {vehicle.disadvantages.map((disadvantage: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                        <span className="text-orange-500 flex-shrink-0">✗</span>
                                        <span>{disadvantage}</span>
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

                {/* Comparison Charts */}
                {comparisonChartData.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Returns Comparison */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                        Comparaison des rendements
                      </h4>
                      <ModernBarChart
                        data={comparisonChartData}
                        dataKeys={['Rendement brut', 'Impôt', 'Rendement net']}
                        title=""
                        formatValue={formatCurrency}
                        stacked={false}
                      />
                    </div>

                    {/* Tax Rate Comparison */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary-600" />
                        Taux d'imposition effectif
                      </h4>
                      <ModernBarChart
                        data={taxRateChartData}
                        dataKeys={['Taux d\'imposition']}
                        title=""
                        formatValue={(value: any) => `${value.toFixed(1)}%`}
                        stacked={false}
                      />
                    </div>
                  </div>
                )}

                {/* Comparison Table */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Tableau comparatif</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-left font-semibold text-gray-700 border">Véhicule</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Investissement</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Durée</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Rendement brut</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Impôt</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Rendement net</th>
                          <th className="p-3 text-right font-semibold text-gray-700 border">Taux effectif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.comparisons.map((vehicle: any, index: number) => {
                          const isBest = vehicle.name === result.bestVehicle;
                          return (
                            <tr 
                              key={index} 
                              className={isBest ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'}
                            >
                              <td className="p-3 border font-semibold text-gray-900">
                                {vehicle.name}
                                {isBest && (
                                  <span className="ml-2 text-xs text-green-600">★</span>
                                )}
                              </td>
                              <td className="p-3 text-right border">{formatCurrency(vehicle.investmentAmount)}</td>
                              <td className="p-3 text-right border">{vehicle.holdingPeriod} ans</td>
                              <td className="p-3 text-right border text-blue-600 font-semibold">
                                {formatCurrency(vehicle.grossReturn)}
                              </td>
                              <td className="p-3 text-right border text-red-600 font-semibold">
                                {formatCurrency(vehicle.taxOnReturn)}
                              </td>
                              <td className="p-3 text-right border text-green-600 font-bold">
                                {formatCurrency(vehicle.netReturn)}
                              </td>
                              <td className="p-3 text-right border font-semibold">
                                {formatPercent(vehicle.effectiveTaxRate)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de la comparaison</p>
                      <p>
                        Cette comparaison est basée sur la législation fiscale française 2024. 
                        Les calculs supposent un rendement constant et ne tiennent pas compte 
                        de la volatilité des marchés. Les avantages fiscaux (PEA après 5 ans, 
                        assurance-vie après 8 ans) sont pris en compte. Pour une analyse 
                        personnalisée tenant compte de votre situation patrimoniale complète, 
                        consultez un conseiller en gestion de patrimoine.
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
