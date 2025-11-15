'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ModernPieChart } from '@/components/charts/ModernPieChart';
import { ChartHeroTemplate } from '@/components/ui/bento/ChartHeroTemplate';
import { Users, Info, AlertCircle } from 'lucide-react';

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

export function InheritanceTaxCalculator() {
  const [inheritanceAmount, setInheritanceAmount] = useState<string>('300000');
  const [relationship, setRelationship] = useState<string>('child');
  const [result, setResult] = useState<InheritanceTaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const relationshipOptions = [
    { value: 'spouse', label: 'Conjoint / Partenaire PACS' },
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
  }, [inheritanceAmount, relationship]);

  const calculateTax = async () => {
    const amount = parseFloat(inheritanceAmount) || 0;

    if (amount < 0) {
      setError('Veuillez entrer une valeur valide');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/tax/inheritance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inheritanceAmount: amount,
          relationship
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError('Erreur lors du calcul des droits de succession');
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

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Montant de l'héritage"
              type="number"
              value={inheritanceAmount}
              onChange={(e) => setInheritanceAmount(e.target.value)}
              placeholder="300000"
              required
            />

            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger label="Lien de parenté avec le défunt">
                <SelectValue placeholder="Sélectionner un lien" />
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spouse Exemption Alert */}
          {isSpouse && parseFloat(inheritanceAmount) > 0 && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900 dark:text-green-100">
                  <p className="font-medium mb-1">Exonération totale</p>
                  <p>
                    Le conjoint survivant et le partenaire de PACS sont totalement exonérés de droits de succession.
                    Aucun impôt n'est dû sur cet héritage.
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
                      <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <span className="text-muted-foreground">Abattement applicable</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          - {result.allowance === Infinity ? 'Exonération totale' : formatCurrency(result.allowance)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-t-2 border-blue-300 dark:border-blue-700">
                        <span className="font-medium">Part taxable</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(result.taxableAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border-t-2 border-purple-300 dark:border-purple-700">
                        <span className="font-medium">Droits de succession</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(result.inheritanceTax)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg border-t-2 border-indigo-300 dark:border-indigo-700">
                        <span className="font-bold">Héritage net reçu</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
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
                            {result.breakdown.map((bracket, index) => (
                              <tr key={index} className="hover:bg-muted/50">
                                <td className="px-4 py-3">
                                  {formatCurrency(bracket.min)} - {bracket.max ? formatCurrency(bracket.max) : '∞'}
                                </td>
                                <td className="px-4 py-3">{formatPercent(bracket.rate)}</td>
                                <td className="px-4 py-3 text-right font-medium">
                                  {formatCurrency(bracket.taxableAmount)}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                                  {formatCurrency(bracket.taxAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted border-t-2">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 font-bold">Total droits</td>
                              <td className="px-4 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                                {formatCurrency(result.inheritanceTax)}
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
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-900 dark:text-orange-100">
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
