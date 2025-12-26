'use client';
 

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Label } from '@/app/_common/components/ui/Label';
import { ModernBarChart } from '@/app/_common/components/charts/ModernBarChart';
import { ChartHeroTemplate } from '@/app/_common/components/ui/bento/ChartHeroTemplate';
import { 
  Gift, 
  Info, 
  Calculator, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  Euro,
  History
} from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';

interface DonationTaxResult {
  donationAmount: number;
  relationship: string;
  allowance: number;
  previousDonations: number;
  remainingAllowance: number;
  taxableAmount: number;
  donationTax: number;
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

const RELATIONSHIP_OPTIONS = [
  { value: 'child', label: 'Enfant', abattement: '100 000 €', icon: '👶' },
  { value: 'grandchild', label: 'Petit-enfant', abattement: '31 865 €', icon: '👧' },
  { value: 'sibling', label: 'Frère / Sœur', abattement: '15 932 €', icon: '👫' },
  { value: 'nephew', label: 'Neveu / Nièce', abattement: '7 967 €', icon: '🧒' },
  { value: 'other', label: 'Autre personne', abattement: '1 594 €', icon: '👤' },
];

const AMOUNT_PRESETS = [
  { label: '50 K€', value: 50000 },
  { label: '100 K€', value: 100000 },
  { label: '150 K€', value: 150000 },
  { label: '200 K€', value: 200000 },
  { label: '300 K€', value: 300000 },
];

export function DonationTaxCalculator() {
  const [donationAmount, setDonationAmount] = useState<number>(100000);
  const [relationship, setRelationship] = useState<string>('child');
  const [previousDonations, setPreviousDonations] = useState<number>(0);
  const [result, setResult] = useState<DonationTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateTax = async () => {
    if (donationAmount <= 0) {
      setError('Veuillez entrer un montant de donation valide');
      return;
    }

    setError('');
    setLoading(true);
    setHasCalculated(true);

    try {
      const response = await fetch('/api/advisor/calculators/tax/donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationAmount,
          relationship,
          previousDonations
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result || data.data || data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul des droits de donation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDonationAmount(100000);
    setRelationship('child');
    setPreviousDonations(0);
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
    .filter((b: any) => b.taxAmount > 0)
    .map((b: any) => ({
      name: `Tranche ${formatPercent(b.rate)}`,
      'Montant taxable': b.taxableAmount,
      'Droits': b.taxAmount
    })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/10 rounded-lg">
              <Gift className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <CardTitle>Calculateur de Droits de Donation</CardTitle>
              <CardDescription>
                Calculez les droits de donation selon le lien de parenté
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Sélection du lien de parenté */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Lien de parenté avec le bénéficiaire</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRelationship(option.value)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    relationship === option.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
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
                  onClick={() => setDonationAmount(preset.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                    donationAmount === preset.value
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champs de saisie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Montant de la donation */}
            <div className="space-y-2">
              <Label htmlFor="donationAmount" className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-pink-600" />
                Montant de la donation
              </Label>
              <div className="relative">
                <input
                  id="donationAmount"
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 text-lg font-semibold"
                  placeholder="100000"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
            </div>

            {/* Donations antérieures */}
            <div className="space-y-2">
              <Label htmlFor="previousDonations" className="flex items-center gap-2">
                <History className="h-4 w-4 text-amber-600" />
                Donations antérieures (15 ans)
              </Label>
              <div className="relative">
                <input
                  id="previousDonations"
                  type="number"
                  value={previousDonations}
                  onChange={(e) => setPreviousDonations(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-12 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-lg font-semibold"
                  placeholder="0"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              </div>
              <p className="text-xs text-muted-foreground">Rappel fiscal des 15 dernières années</p>
            </div>
          </div>

          {/* Bouton Calculer */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 border-t">
            <Button 
              onClick={calculateTax} 
              disabled={loading || donationAmount <= 0}
              size="lg"
              className="w-full sm:w-auto min-w-[220px] h-14 text-lg font-semibold bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 shadow-lg hover:shadow-xl transition-all"
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
                chartData.length > 0 ? (
                  <ModernBarChart
                    data={chartData}
                    dataKeys={['Montant taxable', 'Droits']}
                    formatValue={formatCurrency}
                    title=""
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucune donnée à afficher
                  </div>
                )
              }
              chartTitle="Droits de donation par tranche"
              chartDescription="Calcul selon le lien de parenté et l'abattement"
              kpis={[
                {
                  title: 'Montant donné',
                  value: formatCurrency(result.donationAmount),
                  variant: 'default' as const,
                },
                {
                  title: 'Abattement disponible',
                  value: formatCurrency(result.remainingAllowance),
                  description: `sur ${formatCurrency(result.allowance)} total`,
                  variant: 'default' as const,
                },
                {
                  title: 'Droits à payer',
                  value: formatCurrency(result.donationTax),
                  description: `Taux: ${formatPercent(result.effectiveRate)}`,
                  variant: 'accent' as const,
                },
                {
                  title: 'Montant net reçu',
                  value: formatCurrency(result.donationAmount - result.donationTax),
                  variant: 'default' as const,
                },
              ]}
              details={
                <div className="space-y-6">
                  {/* Allowance Progress */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Utilisation de l'abattement</span>
                      <span className="text-sm font-bold">
                        {formatCurrency(result.previousDonations + Math.min(result.donationAmount, result.remainingAllowance))} / {formatCurrency(result.allowance)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((result.previousDonations + Math.min(result.donationAmount, result.remainingAllowance)) / result.allowance) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Donations antérieures: {formatCurrency(result.previousDonations)}</span>
                      <span>Restant: {formatCurrency(Math.max(0, result.allowance - result.previousDonations - result.donationAmount))}</span>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  {result.breakdown.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Détail par tranche</h4>
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
                                <td className="px-4 py-3 text-right font-bold text-pink-600">
                                  {formatCurrency(bracket.taxAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted border-t-2">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 font-bold">Total droits</td>
                              <td className="px-4 py-3 text-right font-bold text-pink-600">
                                {formatCurrency(result.donationTax)}
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
                        <p className="font-medium mb-2">Abattements sur les donations (2024)</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Enfant: 100 000 € tous les 15 ans</li>
                          <li>Petit-enfant: 31 865 € tous les 15 ans</li>
                          <li>Arrière-petit-enfant: 5 310 € tous les 15 ans</li>
                          <li>Frère/Sœur: 15 932 € tous les 15 ans</li>
                          <li>Neveu/Nièce: 7 967 € tous les 15 ans</li>
                          <li>Personne handicapée: 159 325 € supplémentaires</li>
                        </ul>
                        <p className="mt-2 font-medium">
                          Les abattements se renouvellent tous les 15 ans entre le même donateur et le même bénéficiaire.
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
