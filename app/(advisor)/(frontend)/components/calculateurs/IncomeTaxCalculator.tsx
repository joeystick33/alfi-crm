'use client';
 

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Label } from '@/app/_common/components/ui/Label';
import { ModernBarChart } from '@/app/_common/components/charts/ModernBarChart';
import { ChartHeroTemplate } from '@/app/_common/components/ui/bento/ChartHeroTemplate';
import { 
  Calculator, 
  Info, 
  Euro, 
  Users,
  RefreshCw,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

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

// Presets de situations courantes
const SITUATION_PRESETS = [
  { label: 'Célibataire', quotient: 1, description: 'Personne seule' },
  { label: 'Couple sans enfant', quotient: 2, description: 'Marié/Pacsé' },
  { label: 'Couple + 1 enfant', quotient: 2.5, description: 'Marié/Pacsé' },
  { label: 'Couple + 2 enfants', quotient: 3, description: 'Marié/Pacsé' },
  { label: 'Couple + 3 enfants', quotient: 4, description: 'Marié/Pacsé' },
  { label: 'Parent isolé + 1', quotient: 2, description: 'Monoparental' },
];

export function IncomeTaxCalculator() {
  const [grossIncome, setGrossIncome] = useState<number>(50000);
  const [deductions, setDeductions] = useState<number>(0);
  const [familyQuotient, setFamilyQuotient] = useState<number>(1);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCalculated, setHasCalculated] = useState(false);

  const handlePresetChange = (index: number) => {
    setSelectedPreset(index);
    setFamilyQuotient(SITUATION_PRESETS[index].quotient);
  };

  const calculateTax = async () => {
    if (grossIncome <= 0) {
      setError('Veuillez entrer un revenu brut valide');
      return;
    }

    if (familyQuotient < 1) {
      setError('Le nombre de parts doit être au moins 1');
      return;
    }

    setError('');
    setLoading(true);
    setHasCalculated(true);

    try {
      const response = await fetch('/api/advisor/calculators/tax/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grossIncome,
          deductions,
          familyQuotient,
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
      setError(err.message || 'Erreur lors du calcul de l\'impôt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGrossIncome(50000);
    setDeductions(0);
    setFamilyQuotient(1);
    setSelectedPreset(0);
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

  // Prepare chart data
  const chartData = result?.breakdown
    ?.filter((b: any) => b.taxAmount > 0)
    .map((b: any) => ({
      name: `Tranche ${b.bracket} (${formatPercent(b.rate)})`,
      'Montant imposable': b.taxableAmount,
      'Impôt': b.taxAmount
    })) || [];

  return (
    <div className="space-y-6">
      {/* Formulaire de saisie */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Calculateur d'Impôt sur le Revenu 2024</CardTitle>
                <CardDescription>
                  Barèmes officiels avec quotient familial et prélèvements sociaux
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
          {/* Situation familiale (Presets) */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Situation familiale</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {SITUATION_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetChange(index)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all hover:border-primary/50',
                    selectedPreset === index
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="font-medium text-sm">{preset.label}</div>
                  <div className="text-xs text-muted-foreground">{preset.quotient} parts</div>
                </button>
              ))}
            </div>
          </div>

          {/* Champs de saisie */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Revenu brut */}
            <div className="space-y-2">
              <Label htmlFor="grossIncome" className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-primary" />
                Revenu brut annuel
              </Label>
              <div className="relative">
                <input
                  id="grossIncome"
                  type="number"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg font-semibold"
                  placeholder="50000"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Salaires, pensions, revenus fonciers...</p>
            </div>

            {/* Déductions */}
            <div className="space-y-2">
              <Label htmlFor="deductions" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-600" />
                Déductions & abattements
              </Label>
              <div className="relative">
                <input
                  id="deductions"
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg font-semibold"
                  placeholder="0"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Frais réels, pensions, épargne retraite...</p>
            </div>

            {/* Nombre de parts */}
            <div className="space-y-2">
              <Label htmlFor="familyQuotient" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Nombre de parts fiscales
              </Label>
              <div className="relative">
                <input
                  id="familyQuotient"
                  type="number"
                  value={familyQuotient}
                  onChange={(e) => setFamilyQuotient(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg font-semibold"
                  placeholder="1"
                  min="1"
                  step="0.5"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">parts</span>
              </div>
              <p className="text-xs text-muted-foreground">Quotient familial (min. 1)</p>
            </div>
          </div>

          {/* Bouton Calculer */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 border-t">
            <Button 
              onClick={calculateTax} 
              disabled={loading || grossIncome <= 0}
              size="lg"
              className="w-full sm:w-auto min-w-[200px] h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
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
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
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
