'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { Calculator, TrendingUp, Info } from 'lucide-react';

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
    .filter(b => b.taxAmount > 0)
    .map(b => ({
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
              onChange={(e) => setGrossIncome(e.target.value)}
              placeholder="50000"
              required
            />

            <Input
              label="Déductions"
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              placeholder="5000"
            />

            <div>
              <Input
                label="Nombre de parts"
                type="number"
                value={familyQuotient}
                onChange={(e) => setFamilyQuotient(e.target.value)}
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
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Revenu imposable</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(result.taxableIncome)}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Impôt sur le revenu</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(result.incomeTax)}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">Prélèvements sociaux</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {formatCurrency(result.socialContributions)}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Revenu net</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(result.netIncome)}
                  </div>
                </div>
              </div>

              {/* Tax Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taux marginal d'imposition</span>
                    <span className="text-lg font-bold">
                      {formatPercent(result.marginalRate)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taux effectif d'imposition</span>
                    <span className="text-lg font-bold">
                      {formatPercent(result.effectiveRate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown Chart */}
              {chartData.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Répartition par tranche
                  </h4>
                  <ModernBarChart
                    data={chartData}
                    dataKeys={['Montant imposable', 'Impôt']}
                    formatValue={formatCurrency}
                  />
                </div>
              )}

              {/* Breakdown Table */}
              <div className="mt-6">
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
                      {result.breakdown.map((bracket, index) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
