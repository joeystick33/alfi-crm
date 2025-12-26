 
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Label } from '@/app/_common/components/ui/Label';
import { ModernPieChart } from '@/app/_common/components/charts/ModernPieChart';
import { ChartHeroTemplate } from '@/app/_common/components/ui/bento/ChartHeroTemplate';
import { 
  Users, 
  Info, 
  AlertCircle,
  Calculator,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Euro
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

interface InheritanceTaxResult {
  inheritanceAmount: number;
  relationship: string;
  allowance: number;
  taxableAmount: number;
  inheritanceTax: number;
  netInheritance: number;
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

// Liens de parenté avec abattements
const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Conjoint / PACS', abattement: 'Exonéré', icon: '❤️' },
  { value: 'child', label: 'Enfant', abattement: '100 000 €', icon: '👶' },
  { value: 'grandchild', label: 'Petit-enfant', abattement: '1 594 €', icon: '👧' },
  { value: 'sibling', label: 'Frère / Sœur', abattement: '15 932 €', icon: '👫' },
  { value: 'nephew', label: 'Neveu / Nièce', abattement: '7 967 €', icon: '🧒' },
  { value: 'other', label: 'Autre héritier', abattement: '1 594 €', icon: '👤' },
];

// Montants prédéfinis
const AMOUNT_PRESETS = [
  { label: '100 K€', value: 100000 },
  { label: '200 K€', value: 200000 },
  { label: '300 K€', value: 300000 },
  { label: '500 K€', value: 500000 },
  { label: '1 M€', value: 1000000 },
];

export function InheritanceTaxCalculator() {
  const [inheritanceAmount, setInheritanceAmount] = useState<number>(300000);
  const [relationship, setRelationship] = useState<string>('child');
  const [result, setResult] = useState<InheritanceTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateTax = async () => {
    if (inheritanceAmount <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    setError('');
    setLoading(true);
    setHasCalculated(true);

    try {
      const response = await fetch('/api/advisor/calculators/tax/inheritance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inheritanceAmount,
          relationship
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result || data.data || data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul des droits de succession');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInheritanceAmount(300000);
    setRelationship('child');
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

  const isSpouse = relationship === 'spouse';

  // Prepare pie chart data
  const pieData = result ? [
    { name: 'Droits de succession', value: result.inheritanceTax },
    { name: 'Héritage net', value: result.netInheritance }
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Calculateur de Droits de Succession</CardTitle>
              <CardDescription>
                Calculez les droits de succession selon le lien de parenté avec le défunt
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Lien de parenté */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Lien de parenté avec le défunt</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRelationship(option.value)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    relationship === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <div className="font-medium text-xs">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.abattement}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Montants prédéfinis */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Montants courants</Label>
            <div className="flex flex-wrap gap-2">
              {AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setInheritanceAmount(preset.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    inheritanceAmount === preset.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champ de saisie */}
          <div className="max-w-md mb-6">
            <Label htmlFor="inheritanceAmount" className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-purple-600" />
              Montant de l'héritage
            </Label>
            <div className="relative mt-2">
              <input
                id="inheritanceAmount"
                type="number"
                value={inheritanceAmount}
                onChange={(e) => setInheritanceAmount(Number(e.target.value))}
                className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-lg font-semibold"
                placeholder="300000"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Quote-part reçue par l'héritier</p>
          </div>

          {/* Spouse Exemption Alert */}
          {isSpouse && inheritanceAmount > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">Exonération totale</p>
                  <p>
                    Le conjoint survivant et le partenaire de PACS sont totalement exonérés de droits de succession.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bouton Calculer */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 border-t">
            <Button 
              onClick={calculateTax} 
              disabled={loading || inheritanceAmount <= 0}
              size="lg"
              className="w-full sm:w-auto min-w-[220px] h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculer les droits
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
                !isSpouse && pieData.length > 0 ? (
                  <ModernPieChart
                    data={pieData}
                    formatValue={formatCurrency}
                    title=""
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {isSpouse ? 'Exonération totale' : 'Aucune donnée à afficher'}
                  </div>
                )
              }
              chartTitle="Répartition de la succession"
              chartDescription="Droits de succession selon le lien de parenté"
              kpis={[
                {
                  title: 'Héritage brut',
                  value: formatCurrency(result.inheritanceAmount),
                  variant: 'default' as const,
                },
                {
                  title: 'Abattement',
                  value: result.allowance === Infinity ? '∞' : formatCurrency(result.allowance),
                  variant: 'default' as const,
                },
                {
                  title: 'Droits à payer',
                  value: formatCurrency(result.inheritanceTax),
                  description: `Taux: ${formatPercent(result.effectiveRate)}`,
                  variant: 'accent' as const,
                },
                {
                  title: 'Héritage net',
                  value: formatCurrency(result.netInheritance),
                  variant: 'default' as const,
                },
              ]}
              details={
                <div className="space-y-6">
                  {/* Détail du calcul */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Détail du calcul</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground">Héritage brut</span>
                        <span className="font-bold">{formatCurrency(result.inheritanceAmount)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-muted-foreground">Abattement applicable</span>
                        <span className="font-bold text-green-600">
                          - {result.allowance === Infinity ? 'Exonération totale' : formatCurrency(result.allowance)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 rounded-lg border-t-2 border-blue-300">
                        <span className="font-medium">Part taxable</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(result.taxableAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-purple-50 rounded-lg border-t-2 border-purple-300">
                        <span className="font-medium">Droits de succession</span>
                        <span className="font-bold text-purple-600">
                          {formatCurrency(result.inheritanceTax)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-indigo-50 rounded-lg border-t-2 border-indigo-300">
                        <span className="font-bold">Héritage net reçu</span>
                        <span className="font-bold text-indigo-600 text-lg">
                          {formatCurrency(result.netInheritance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  {result.breakdown.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Barème par tranche</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted border-b">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium">Tranche</th>
                              <th className="px-4 py-3 text-left font-medium">Taux</th>
                              <th className="px-4 py-3 text-right font-medium">Montant taxable</th>
                              <th className="px-4 py-3 text-right font-medium">Droits</th>
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
                                <td className="px-4 py-3 text-right font-bold text-purple-600">
                                  {formatCurrency(bracket.taxAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted border-t-2">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 font-bold">Total droits</td>
                              <td className="px-4 py-3 text-right font-bold text-purple-600">
                                {formatCurrency(result.inheritanceTax)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-2">Abattements sur les successions (2024)</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Conjoint / Partenaire PACS: Exonération totale</li>
                          <li>Enfant: 100 000 €</li>
                          <li>Petit-enfant: 1 594 € (31 865 € si représentation)</li>
                          <li>Arrière-petit-enfant: 1 594 €</li>
                          <li>Frère/Sœur: 15 932 €</li>
                          <li>Neveu/Nièce: 7 967 €</li>
                          <li>Personne handicapée: 159 325 € supplémentaires</li>
                        </ul>
                        <p className="mt-2 font-medium">
                          Les abattements s'appliquent par bénéficiaire et par parent décédé.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning for high tax */}
                  {result.effectiveRate > 0.30 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-900">
                          <p className="font-medium mb-1">Taux d'imposition élevé</p>
                          <p>
                            Le taux effectif de {formatPercent(result.effectiveRate)} est important.
                            Envisagez des donations de votre vivant pour optimiser la transmission et bénéficier
                            des abattements renouvelables tous les 15 ans.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
