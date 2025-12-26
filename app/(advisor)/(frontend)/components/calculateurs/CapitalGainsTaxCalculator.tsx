'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Label } from '@/app/_common/components/ui/Label';
import { ModernPieChart } from '@/app/_common/components/charts/ModernPieChart';
import { ChartHeroTemplate } from '@/app/_common/components/ui/bento/ChartHeroTemplate';
import { 
  TrendingUp, 
  Info, 
  Calculator, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  Euro,
  Clock
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

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

// Types d'actifs avec leurs spécificités
const ASSET_TYPES = [
  { value: 'stocks', label: 'Actions / Valeurs mobilières', icon: '📈', description: 'PFU 30% ou barème IR' },
  { value: 'real_estate', label: 'Immobilier', icon: '🏠', description: 'Abattement sur durée' },
  { value: 'other', label: 'Autres actifs', icon: '💼', description: 'Régime général' }
];

// Presets de montants
const GAIN_PRESETS = [
  { label: '10 K€', value: 10000 },
  { label: '50 K€', value: 50000 },
  { label: '100 K€', value: 100000 },
  { label: '200 K€', value: 200000 },
  { label: '500 K€', value: 500000 },
];

// Presets de durées
const HOLDING_PRESETS = [
  { label: '1 an', value: 1 },
  { label: '2 ans', value: 2 },
  { label: '5 ans', value: 5 },
  { label: '10 ans', value: 10 },
  { label: '22 ans', value: 22 },
  { label: '30 ans', value: 30 },
];

export function CapitalGainsTaxCalculator() {
  const [grossGain, setGrossGain] = useState<number>(100000);
  const [holdingPeriod, setHoldingPeriod] = useState<number>(5);
  const [assetType, setAssetType] = useState<string>('stocks');
  const [result, setResult] = useState<CapitalGainsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateTax = async () => {
    if (grossGain <= 0) {
      setError('Veuillez entrer une plus-value valide');
      return;
    }

    setError('');
    setLoading(true);
    setHasCalculated(true);

    try {
      const response = await fetch('/api/advisor/calculators/tax/capital-gains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossGain,
          holdingPeriod,
          assetType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result || data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul de la plus-value');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGrossGain(100000);
    setHoldingPeriod(5);
    setAssetType('stocks');
    setResult(null);
    setError('');
    setHasCalculated(false);
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

        <CardContent className="pt-6">
          {/* Type d'actif */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Type d'actif cédé</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ASSET_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAssetType(type.value)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    assetType === type.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Presets de montant */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Montants courants</Label>
            <div className="flex flex-wrap gap-2">
              {GAIN_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setGrossGain(preset.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    grossGain === preset.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Presets de durée */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Durée de détention</Label>
            <div className="flex flex-wrap gap-2">
              {HOLDING_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setHoldingPeriod(preset.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    holdingPeriod === preset.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champs de saisie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Plus-value brute */}
            <div className="space-y-2">
              <Label htmlFor="grossGain" className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-emerald-600" />
                Montant de la plus-value
              </Label>
              <div className="relative">
                <input
                  id="grossGain"
                  type="number"
                  value={grossGain}
                  onChange={(e) => setGrossGain(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-lg font-semibold"
                  placeholder="100000"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Prix de cession - Prix d'acquisition</p>
            </div>

            {/* Durée de détention */}
            <div className="space-y-2">
              <Label htmlFor="holdingPeriod" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Durée de détention
              </Label>
              <div className="relative">
                <input
                  id="holdingPeriod"
                  type="number"
                  value={holdingPeriod}
                  onChange={(e) => setHoldingPeriod(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-16 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-lg font-semibold"
                  placeholder="5"
                  min="0"
                  step="0.5"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">années</span>
              </div>
            </div>
          </div>

          {/* Bouton Calculer */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 border-t">
            <Button 
              onClick={calculateTax} 
              disabled={loading || grossGain <= 0}
              size="lg"
              className="w-full sm:w-auto min-w-[220px] h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculer l'impôt
                </>
              )}
            </Button>
            
            {hasCalculated && (
              <Button variant="outline" size="lg" onClick={resetForm}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <span className="text-destructive font-medium">{error}</span>
            </div>
          )}

          {result && (
            <ChartHeroTemplate
              mainChart={
                <ModernPieChart
                  data={pieData}
                  formatValue={formatCurrency}
                  title=""
                />
              }
              chartTitle="Répartition de la plus-value"
              chartDescription="Gain net après impôts et prélèvements sociaux"
              kpis={[
                {
                  title: 'Plus-value brute',
                  value: formatCurrency(result.grossGain),
                  variant: 'default' as const,
                },
                {
                  title: 'Abattement',
                  value: formatCurrency(result.abatement),
                  description: `${result.holdingPeriod} ans de détention`,
                  variant: 'default' as const,
                },
                {
                  title: 'Impôt total',
                  value: formatCurrency(result.totalTax),
                  description: `Taux: ${formatPercent(result.effectiveRate)}`,
                  variant: 'accent' as const,
                },
                {
                  title: 'Plus-value nette',
                  value: formatCurrency(result.netGain),
                  variant: 'default' as const,
                },
              ]}
              details={
                <div className="space-y-6">
                  {/* Details Table */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Détail du calcul</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground">Plus-value brute</span>
                        <span className="font-bold">{formatCurrency(result.grossGain)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                        <span className="text-muted-foreground">Abattement pour durée de détention</span>
                        <span className="font-bold text-purple-600">
                          - {formatCurrency(result.abatement)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 rounded-lg border-t-2 border-blue-300">
                        <span className="font-medium">Plus-value imposable</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(result.taxableGain)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground">Impôt sur la plus-value (12,8%)</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(result.capitalGainsTax)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground">Prélèvements sociaux (17,2%)</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(result.socialContributions)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-orange-50 rounded-lg border-t-2 border-orange-300">
                        <span className="font-medium">Impôt total</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(result.totalTax)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-green-50 rounded-lg border-t-2 border-green-300">
                        <span className="font-bold">Plus-value nette</span>
                        <span className="font-bold text-green-600 text-lg">
                          {formatCurrency(result.netGain)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
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
              }
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
