'use client';
 

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Label } from '@/app/_common/components/ui/Label';
import { ModernBarChart } from '@/app/_common/components/charts/ModernBarChart';
import { ChartHeroTemplate } from '@/app/_common/components/ui/bento/ChartHeroTemplate';
import { 
  Building2, 
  Info, 
  AlertCircle, 
  Calculator, 
  Loader2, 
  RefreshCw, 
  CheckCircle2,
  Home,
  Minus
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

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

// Montants prédéfinis pour aide rapide
const WEALTH_PRESETS = [
  { label: '800 K€', value: 800000 },
  { label: '1,3 M€', value: 1300000 },
  { label: '2 M€', value: 2000000 },
  { label: '3 M€', value: 3000000 },
  { label: '5 M€', value: 5000000 },
  { label: '10 M€', value: 10000000 },
];

export function WealthTaxCalculator() {
  const [totalWealth, setTotalWealth] = useState<number>(2000000);
  const [residencePrincipale, setResidencePrincipale] = useState<number>(0);
  const [dettes, setDettes] = useState<number>(0);
  const [result, setResult] = useState<WealthTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCalculated, setHasCalculated] = useState(false);

  // Calcul du patrimoine net taxable avec abattement RP
  const abattementRP = residencePrincipale * 0.30;
  const patrimoineNetTaxable = Math.max(0, totalWealth - abattementRP - dettes);

  const calculateTax = async () => {
    if (patrimoineNetTaxable <= 0) {
      setError('Le patrimoine net taxable doit être positif');
      return;
    }

    setError('');
    setLoading(true);
    setHasCalculated(true);

    try {
      const response = await fetch('/api/advisor/calculators/tax/wealth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalWealth: patrimoineNetTaxable,
          year: 2024
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result || data.data || data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul de l\'IFI');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTotalWealth(2000000);
    setResidencePrincipale(0);
    setDettes(0);
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
    return `${(value * 100).toFixed(3)}%`;
  };

  const isSubjectToIFI = patrimoineNetTaxable >= 1300000;
  const isInReductionZone = patrimoineNetTaxable >= 800000 && patrimoineNetTaxable < 1300000;

  // Prepare chart data
  const chartData = result?.breakdown
    ?.filter((b: any) => b.taxAmount > 0)
    .map((b: any) => ({
      name: `${formatPercent(b.rate)}`,
      'Patrimoine': b.taxableAmount,
      'IFI': b.taxAmount
    })) || [];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Calculateur IFI 2024</CardTitle>
                <CardDescription>
                  Impôt sur la Fortune Immobilière - Barèmes officiels
                </CardDescription>
              </div>
            </div>
            {hasCalculated && (
              <Button variant="outline" size="sm" onClick={resetForm}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Presets rapides */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Montants prédéfinis</Label>
            <div className="flex flex-wrap gap-2">
              {WEALTH_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setTotalWealth(preset.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    totalWealth === preset.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champs de saisie */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Patrimoine brut */}
            <div className="space-y-2">
              <Label htmlFor="totalWealth" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Patrimoine immobilier brut
              </Label>
              <div className="relative">
                <input
                  id="totalWealth"
                  type="number"
                  value={totalWealth}
                  onChange={(e) => setTotalWealth(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-lg font-semibold"
                  placeholder="2000000"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Total de vos biens immobiliers</p>
            </div>

            {/* Résidence principale */}
            <div className="space-y-2">
              <Label htmlFor="residencePrincipale" className="flex items-center gap-2">
                <Home className="h-4 w-4 text-emerald-600" />
                Dont résidence principale
              </Label>
              <div className="relative">
                <input
                  id="residencePrincipale"
                  type="number"
                  value={residencePrincipale}
                  onChange={(e) => setResidencePrincipale(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-lg font-semibold"
                  placeholder="0"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Abattement de 30% appliqué</p>
            </div>

            {/* Dettes */}
            <div className="space-y-2">
              <Label htmlFor="dettes" className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-red-600" />
                Dettes déductibles
              </Label>
              <div className="relative">
                <input
                  id="dettes"
                  type="number"
                  value={dettes}
                  onChange={(e) => setDettes(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-lg font-semibold"
                  placeholder="0"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Emprunts immobiliers en cours</p>
            </div>
          </div>

          {/* Récapitulatif patrimoine net */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Patrimoine net taxable</span>
              <span className="text-2xl font-bold text-indigo-600">{formatCurrency(patrimoineNetTaxable)}</span>
            </div>
            {residencePrincipale > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Abattement RP appliqué: {formatCurrency(abattementRP)}
              </p>
            )}
          </div>

          {/* Threshold Alerts */}
          {!isSubjectToIFI && patrimoineNetTaxable > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">Non assujetti à l'IFI</p>
                  <p>
                    Votre patrimoine net taxable ({formatCurrency(patrimoineNetTaxable)}) est inférieur au seuil de 1 300 000 €.
                    {isInReductionZone && ' Vous êtes dans la zone de décote (800 K€ - 1,3 M€).'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSubjectToIFI && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Assujetti à l'IFI</p>
                  <p>
                    Votre patrimoine net taxable ({formatCurrency(patrimoineNetTaxable)}) dépasse le seuil de 1 300 000 €.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bouton Calculer */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 border-t">
            <Button 
              onClick={calculateTax} 
              disabled={loading || patrimoineNetTaxable <= 0}
              size="lg"
              className="w-full sm:w-auto min-w-[200px] h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculer l'IFI
                </>
              )}
            </Button>
            
            {result && !loading && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Calcul effectué</span>
              </div>
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
                              <td className="px-4 py-3 text-right font-bold text-indigo-600">
                                {formatCurrency(bracket.taxAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted border-t-2">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 font-bold">Total IFI</td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-600">
                              {formatCurrency(result.wealthTax)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
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
