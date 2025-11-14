'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ModernPieChart } from '@/components/charts/ModernPieChart';
import { TrendingUp, Info } from 'lucide-react';

interface CapitalGainsResult {
  grossGain: number;
  holdingPeriod: number;
  assetType: string;
  abatement: number;
  taxableGain: number;
  capitalGainsTax: number;
  socialContributions: number;
  totalTax: number;
  netGain: number;
  effectiveRate: number;
}

export function CapitalGainsTaxCalculator() {
  const [grossGain, setGrossGain] = useState<string>('100000');
  const [holdingPeriod, setHoldingPeriod] = useState<string>('5');
  const [assetType, setAssetType] = useState<string>('stocks');
  const [result, setResult] = useState<CapitalGainsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const assetTypeOptions = [
    { value: 'stocks', label: 'Actions / Valeurs mobilières' },
    { value: 'real_estate', label: 'Immobilier' },
    { value: 'other', label: 'Autres actifs' }
  ];

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTax();
    }, 500);

    return () => clearTimeout(timer);
  }, [grossGain, holdingPeriod, assetType]);

  const calculateTax = async () => {
    const gain = parseFloat(grossGain) || 0;
    const period = parseFloat(holdingPeriod) || 0;

    if (gain < 0 || period < 0) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/tax/capital-gains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossGain: gain,
          holdingPeriod: period,
          assetType
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError('Erreur lors du calcul de la plus-value');
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

  // Prepare pie chart data
  const pieData = result ? [
    { name: 'Impôt sur la plus-value', value: result.capitalGainsTax },
    { name: 'Prélèvements sociaux', value: result.socialContributions },
    { name: 'Plus-value nette', value: result.netGain }
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Calculateur de Plus-Values</CardTitle>
              <CardDescription>
                Calculez l'impôt sur vos plus-values mobilières et immobilières
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              label="Montant de la plus-value"
              type="number"
              value={grossGain}
              onChange={(e) => setGrossGain(e.target.value)}
              placeholder="100000"
              required
            />

            <div>
              <Input
                label="Durée de détention (années)"
                type="number"
                value={holdingPeriod}
                onChange={(e) => setHoldingPeriod(e.target.value)}
                placeholder="5"
                min="0"
                step="0.5"
                required
              />
            </div>

            <Select value={assetType} onValueChange={setAssetType}>
              <SelectTrigger label="Type d'actif">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Plus-value brute</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(result.grossGain)}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Abattement</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(result.abatement)}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {result.holdingPeriod} ans de détention
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">Impôt total</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {formatCurrency(result.totalTax)}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Taux effectif: {formatPercent(result.effectiveRate)}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Plus-value nette</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(result.netGain)}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Répartition</h4>
                  <ModernPieChart
                    data={pieData}
                    formatValue={formatCurrency}
                    title=""
                  />
                </div>

                {/* Details Table */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Détail du calcul</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground">Plus-value brute</span>
                      <span className="font-bold">{formatCurrency(result.grossGain)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <span className="text-muted-foreground">Abattement pour durée de détention</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        - {formatCurrency(result.abatement)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-t-2 border-blue-300 dark:border-blue-700">
                      <span className="font-medium">Plus-value imposable</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(result.taxableGain)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground">Impôt sur la plus-value (12,8%)</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(result.capitalGainsTax)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground">Prélèvements sociaux (17,2%)</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(result.socialContributions)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border-t-2 border-orange-300 dark:border-orange-700">
                      <span className="font-medium">Impôt total</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(result.totalTax)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border-t-2 border-green-300 dark:border-green-700">
                      <span className="font-bold">Plus-value nette</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                        {formatCurrency(result.netGain)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-2">Abattements pour durée de détention</p>
                    {assetType === 'stocks' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Actions: 50% après 2 ans, 65% après 8 ans</li>
                        <li>Flat tax de 30% (12,8% + 17,2% de prélèvements sociaux)</li>
                      </ul>
                    )}
                    {assetType === 'real_estate' && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>Immobilier: 6% par an de la 6ème à la 21ème année</li>
                        <li>Puis 4% par an de la 22ème à la 30ème année</li>
                        <li>Exonération totale après 30 ans de détention</li>
                      </ul>
                    )}
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
