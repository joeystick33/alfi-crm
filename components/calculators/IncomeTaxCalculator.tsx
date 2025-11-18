'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { ChartHeroTemplate } from '@/components/ui/bento/ChartHeroTemplate';
import { Calculator, Info } from 'lucide-react';

interface TaxResult {
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  incomeTax: number;
  socialContributions: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: Array<{
    bracket: number;
    min: number;
    max: number | null;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
}

export function IncomeTaxCalculator() {
  const [grossIncome, setGrossIncome] = useState<string>('50000');
  const [deductions, setDeductions] = useState<string>('5000');
  const [familyQuotient, setFamilyQuotient] = useState<string>('1');
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Real-time calculation as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTax();
    }, 500);

    return () => clearTimeout(timer);
  }, [grossIncome, deductions, familyQuotient]);

  const calculateTax = async () => {
    const income = parseFloat(grossIncome) || 0;
    const deduct = parseFloat(deductions) || 0;
    const quotient = parseFloat(familyQuotient) || 1;

    if (income < 0 || deduct < 0 || quotient < 1) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/tax/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossIncome: income,
          deductions: deduct,
          familyQuotient: quotient,
          year: 2024
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError('Erreur lors du calcul de l\'impôt');
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
    return `${(value * 100).toFixed(2)}%`;
  };

  // Prepare chart data
  const chartData = result?.breakdown
    .filter((b: any) => b.taxAmount > 0)
    .map((b: any) => ({
      name: `Tranche ${b.bracket} (${formatPercent(b.rate)})`,
      'Montant imposable': b.taxableAmount,
      'Impôt': b.taxAmount
    })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Calculateur d'Impôt sur le Revenu</CardTitle>
              <CardDescription>
                Calculez votre impôt sur le revenu selon les barèmes 2024
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              label="Revenu brut annuel"
              type="number"
              value={grossIncome}
              onChange={(e: any) => setGrossIncome(e.target.value)}
              placeholder="50000"
              required
            />

            <Input
              label="Déductions"
              type="number"
              value={deductions}
              onChange={(e: any) => setDeductions(e.target.value)}
              placeholder="5000"
            />

            <div>
              <Input
                label="Nombre de parts"
                type="number"
                value={familyQuotient}
                onChange={(e: any) => setFamilyQuotient(e.target.value)}
                placeholder="1"
                min="1"
                step="0.5"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Quotient familial (1, 1.5, 2, etc.)</p>
            </div>
          </div>

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
                    dataKeys={['Montant imposable', 'Impôt']}
                    formatValue={formatCurrency}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucune donnée à afficher
                  </div>
                )
              }
              chartTitle="Répartition par tranche"
              chartDescription="Visualisation de votre imposition selon les tranches"
              kpis={[
                {
                  title: 'Revenu imposable',
                  value: formatCurrency(result.taxableIncome),
                  variant: 'default' as const,
                },
                {
                  title: 'Impôt total',
                  value: formatCurrency(result.totalTax),
                  variant: 'accent' as const,
                },
                {
                  title: 'Taux effectif',
                  value: formatPercent(result.effectiveRate),
                  variant: 'default' as const,
                },
                {
                  title: 'Revenu net',
                  value: formatCurrency(result.netIncome),
                  variant: 'default' as const,
                },
              ]}
              details={
                <div className="space-y-6">
                  {/* Tax Rates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Taux marginal</span>
                        <span className="text-lg font-bold">{formatPercent(result.marginalRate)}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Prélèvements sociaux</span>
                        <span className="text-lg font-bold">{formatCurrency(result.socialContributions)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Détail par tranche</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Tranche</th>
                            <th className="px-4 py-3 text-left font-medium">Taux</th>
                            <th className="px-4 py-3 text-right font-medium">Montant imposable</th>
                            <th className="px-4 py-3 text-right font-medium">Impôt</th>
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
                              <td className="px-4 py-3 text-right font-bold text-primary">
                                {formatCurrency(bracket.taxAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted border-t-2">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 font-bold">Total impôt</td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {formatCurrency(result.totalTax)}
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
                        <p className="font-medium mb-1">À propos du calcul</p>
                        <p>
                          Le calcul utilise les barèmes 2024 de l'impôt sur le revenu et inclut les prélèvements sociaux (17,2%).
                          Le quotient familial permet de réduire l'impôt en fonction de la composition du foyer.
                        </p>
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
