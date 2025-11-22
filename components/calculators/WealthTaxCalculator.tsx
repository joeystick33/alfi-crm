'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { ChartHeroTemplate } from '@/components/ui/bento/ChartHeroTemplate';
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
    .filter((b: any) => b.taxAmount > 0)
    .map((b: any) => ({
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
              onChange={(e: any) => setTotalWealth(e.target.value)}
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
            <ChartHeroTemplate
              mainChart={
                chartData.length > 0 ? (
                  <ModernBarChart
                    data={chartData}
                    dataKeys={['Patrimoine', 'IFI']}
                    formatValue={formatCurrency}
                    title=""
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucune donnée à afficher
                  </div>
                )
              }
              chartTitle="IFI par tranche de patrimoine"
              chartDescription="Calcul de l'Impôt sur la Fortune Immobilière"
              kpis={[
                {
                  title: 'Patrimoine total',
                  value: formatCurrency(result.totalWealth),
                  variant: 'default' as const,
                },
                {
                  title: 'Patrimoine taxable',
                  value: formatCurrency(result.taxableWealth),
                  variant: 'default' as const,
                },
                {
                  title: 'IFI à payer',
                  value: formatCurrency(result.wealthTax),
                  variant: 'accent' as const,
                },
                {
                  title: 'Taux effectif',
                  value: formatPercent(result.effectiveRate),
                  variant: 'default' as const,
                },
              ]}
              details={
                <div className="space-y-6">
                  {/* Breakdown Table */}
                  <div>
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
                          {result.breakdown.map((bracket: any, index: any) => (
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
              }
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
