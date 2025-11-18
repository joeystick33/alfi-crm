'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { ChartHeroTemplate } from '@/components/ui/bento/ChartHeroTemplate';
import { Gift, Info, Heart } from 'lucide-react';

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

export function DonationTaxCalculator() {
  const [donationAmount, setDonationAmount] = useState<string>('150000');
  const [relationship, setRelationship] = useState<string>('child');
  const [previousDonations, setPreviousDonations] = useState<string>('0');
  const [result, setResult] = useState<DonationTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const relationshipOptions = [
    { value: 'child', label: 'Enfant' },
    { value: 'grandchild', label: 'Petit-enfant' },
    { value: 'sibling', label: 'Frère / Sœur' },
    { value: 'other', label: 'Autre' }
  ];

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTax();
    }, 500);

    return () => clearTimeout(timer);
  }, [donationAmount, relationship, previousDonations]);

  const calculateTax = async () => {
    const amount = parseFloat(donationAmount) || 0;
    const previous = parseFloat(previousDonations) || 0;

    if (amount < 0 || previous < 0) {
      setError('Veuillez entrer des valeurs valides');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/tax/donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationAmount: amount,
          relationship,
          previousDonations: previous
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError('Erreur lors du calcul des droits de donation');
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

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              label="Montant de la donation"
              type="number"
              value={donationAmount}
              onChange={(e: any) => setDonationAmount(e.target.value)}
              placeholder="150000"
              required
            />

            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger label="Lien de parenté">
                <SelectValue placeholder="Sélectionner un lien" />
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Input
                label="Donations antérieures (15 ans)"
                type="number"
                value={previousDonations}
                onChange={(e: any) => setPreviousDonations(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Donations reçues dans les 15 dernières années
              </p>
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
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border border-green-200 dark:border-green-800">
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
                                <td className="px-4 py-3 text-right font-bold text-pink-600 dark:text-pink-400">
                                  {formatCurrency(bracket.taxAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted border-t-2">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 font-bold">Total droits</td>
                              <td className="px-4 py-3 text-right font-bold text-pink-600 dark:text-pink-400">
                                {formatCurrency(result.donationTax)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900 dark:text-blue-100">
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
