'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { Building2, Info, AlertCircle } from 'lucide-react';

interface WealthTaxResult {
  totalWealth: number;
  taxableWealth: number;
  wealthTax: number;
  effectiveRate: number;
  breakdown: Array<{
    bracket: number;
    min: number;
    max: number | null;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
}

export function WealthTaxCalculator() {
  const [totalWealth, setTotalWealth] = useState<string>('2000000');
  const [result, setResult] = useState<WealthTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTax();
    }, 500);

    return () => clearTimeout(timer);
  }, [totalWealth]);

  const calculateTax = async () => {
    const wealth = parseFloat(totalWealth) || 0;

    if (wealth < 0) {
      setError('Veuillez entrer une valeur valide');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/tax/wealth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalWealth: wealth,
          year: 2024
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError('Erreur lors du calcul de l\'IFI');
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
    return `${(value * 100).toFixed(3)}%`;
  };

  const isSubjectToIFI = parseFloat(totalWealth) >= 1300000;
  const isInReductionZone = parseFloat(totalWealth) >= 800000 && parseFloat(totalWealth) < 1300000;

  // Prepare chart data
  const chartData = result?.breakdown
    .filter(b => b.taxAmount > 0)
    .map(b => ({
      name: `${formatPercent(b.rate)}`,
      'Patrimoine': b.taxableAmount,
      'IFI': b.taxAmount
    })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Calculateur IFI (Impôt sur la Fortune Immobilière)</CardTitle>
              <CardDescription>
                Calculez votre IFI sur votre patrimoine immobilier net
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <Input
              label="Patrimoine immobilier net taxable"
              type="number"
              value={totalWealth}
              onChange={(e) => setTotalWealth(e.target.value)}
              placeholder="2000000"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Valeur totale de vos biens immobiliers après déduction des dettes
            </p>
          </div>

          {/* Threshold Alerts */}
          {!isSubjectToIFI && parseFloat(totalWealth) > 0 && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900 dark:text-green-100">
                  <p className="font-medium mb-1">Non assujetti à l'IFI</p>
                  <p>
                    Votre patrimoine est inférieur au seuil d'imposition de 1 300 000 €.
                    {isInReductionZone && ' Vous bénéficiez d\'une décote entre 800 000 € et 1 300 000 €.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSubjectToIFI && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-900 dark:text-orange-100">
                  <p className="font-medium mb-1">Assujetti à l'IFI</p>
                  <p>
                    Votre patrimoine dépasse le seuil d'imposition de 1 300 000 €.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Patrimoine total</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(result.totalWealth)}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">IFI à payer</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(result.wealthTax)}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">Taux effectif</div>
                  <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                    {formatPercent(result.effectiveRate)}
                  </div>
                </div>
              </div>

              {/* Breakdown Chart */}
              {chartData.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4">Répartition par tranche</h4>
                  <ModernBarChart
                    data={chartData}
                    dataKeys={['Patrimoine', 'IFI']}
                    formatValue={formatCurrency}
                    title=""
                  />
                </div>
              )}

              {/* Breakdown Table */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Barème IFI 2024</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Tranche</th>
                        <th className="px-4 py-3 text-left font-medium">Taux</th>
                        <th className="px-4 py-3 text-right font-medium">Patrimoine taxable</th>
                        <th className="px-4 py-3 text-right font-medium">IFI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.breakdown.map((bracket, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            {formatCurrency(bracket.min)} - {bracket.max ? formatCurrency(bracket.max) : '∞'}
                          </td>
                          <td className="px-4 py-3">{formatPercent(bracket.rate)}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(bracket.taxableAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(bracket.taxAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted border-t-2">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 font-bold">Total IFI</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(result.wealthTax)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-2">À propos de l'IFI</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>L'IFI s'applique uniquement au patrimoine immobilier net</li>
                      <li>Seuil d'imposition: 1 300 000 € (avec décote entre 800 000 € et 1 300 000 €)</li>
                      <li>Les dettes liées aux biens immobiliers sont déductibles</li>
                      <li>La résidence principale bénéficie d'un abattement de 30%</li>
                      <li>Déclaration annuelle obligatoire si patrimoine ≥ 1 300 000 €</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
