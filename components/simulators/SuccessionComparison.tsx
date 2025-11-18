'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TimelineTemplate } from '@/components/ui/bento/TimelineTemplate';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { 
  GitCompare, 
  Plus,
  Trash2,
  CheckCircle, 
  Info,
  DollarSign,
  Users,
  AlertCircle,
  TrendingDown,
  Heart
} from 'lucide-react';

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Conjoint', icon: Heart, color: 'text-pink-600' },
  { value: 'child', label: 'Enfant', icon: Users, color: 'text-blue-600' },
  { value: 'grandchild', label: 'Petit-enfant', icon: Users, color: 'text-purple-600' },
  { value: 'great_grandchild', label: 'Arrière-petit-enfant', icon: Users, color: 'text-indigo-600' },
  { value: 'sibling', label: 'Frère/Sœur', icon: Users, color: 'text-green-600' },
  { value: 'nephew_niece', label: 'Neveu/Nièce', icon: Users, color: 'text-yellow-600' },
  { value: 'other', label: 'Autre', icon: Users, color: 'text-gray-600' }
];

interface Heir {
  id: number;
  name: string;
  relationship: string;
  share: string;
  previousDonations: string;
}

export function SuccessionComparison() {
  // Base input
  const [estateValue, setEstateValue] = useState('1000000');

  // Heirs state
  const [heirs, setHeirs] = useState<Heir[]>([
    {
      id: 1,
      name: 'Enfant 1',
      relationship: 'child',
      share: '50',
      previousDonations: '0'
    },
    {
      id: 2,
      name: 'Enfant 2',
      relationship: 'child',
      share: '50',
      previousDonations: '0'
    }
  ]);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addHeir = () => {
    const newId = Math.max(...heirs.map((h: any) => h.id), 0) + 1;
    // Redistribute shares equally
    const newShare = (100 / (heirs.length + 1)).toFixed(2);
    setHeirs([
      ...heirs.map((h: any) => ({ ...h, share: newShare })),
      {
        id: newId,
        name: `Héritier ${newId}`,
        relationship: 'child',
        share: newShare,
        previousDonations: '0'
      }
    ]);
  };

  const removeHeir = (id: number) => {
    if (heirs.length > 1) {
      const remainingHeirs = heirs.filter((h: any) => h.id !== id);
      // Redistribute shares equally among remaining heirs
      const newShare = (100 / remainingHeirs.length).toFixed(2);
      setHeirs(remainingHeirs.map((h: any) => ({ ...h, share: newShare })));
    }
  };

  const updateHeir = (id: number, field: keyof Heir, value: string) => {
    setHeirs(heirs.map((h: any) => 
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  const compareStrategies = async () => {
    const estate = parseFloat(estateValue) || 0;

    if (estate <= 0) {
      setError('La valeur du patrimoine doit être positive');
      return;
    }

    // Validate heirs
    const validHeirs = heirs.filter((h: any) => {
      const share = parseFloat(h.share) || 0;
      return share > 0;
    });

    if (validHeirs.length === 0) {
      setError('Ajoutez au moins un héritier avec une part positive');
      return;
    }

    // Check total shares
    const totalShares = validHeirs.reduce((sum: any, h: any) => sum + (parseFloat(h.share) || 0), 0);
    if (Math.abs(totalShares - 100) > 0.1) {
      setError(`Les parts doivent totaliser 100% (actuellement ${totalShares.toFixed(1)}%)`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/simulators/succession/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estateValue: estate,
          heirs: validHeirs.map((h: any) => ({
            id: h.id.toString(),
            name: h.name,
            relationship: h.relationship,
            share: (parseFloat(h.share) || 0) / 100,
            previousDonations: parseFloat(h.previousDonations) || 0
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la comparaison');
      }

      const data = await response.json();
      setResult(data.comparison);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la comparaison des stratégies');
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
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRelationshipInfo = (relationship: string) => {
    return RELATIONSHIP_OPTIONS.find(r => r.value === relationship) || RELATIONSHIP_OPTIONS[RELATIONSHIP_OPTIONS.length - 1];
  };

  // Prepare strategy comparison chart data
  const strategyComparisonData = result?.strategies ? result.strategies.map((s: any) => ({
    name: s.name,
    'Droits de succession': s.totalTax,
    'Patrimoine net transmis': s.netEstate
  })) : [];

  // Prepare tax savings chart data
  const taxSavingsData = result?.strategies ? result.strategies.map((s: any) => ({
    name: s.name,
    'Économie fiscale': s.taxSavings || 0
  })) : [];

  // Prepare KPIs for Timeline Template
  const kpis = result && result.bestStrategy ? [
    {
      title: 'Meilleure stratégie',
      value: result.bestStrategy.name,
      icon: <CheckCircle className="h-5 w-5" />,
      variant: 'hero' as const
    },
    {
      title: 'Économie maximale',
      value: formatCurrency(result.bestStrategy.taxSavings || 0),
      icon: <TrendingDown className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Patrimoine net',
      value: formatCurrency(result.bestStrategy.netEstate),
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'default' as const
    }
  ] : [];

  // Prepare recommendations component
  const recommendationsComponent = result?.recommendations && result.recommendations.length > 0 ? (
    <div className="p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Info className="h-5 w-5 text-blue-600" />
        Recommandations
      </h4>
      <ul className="space-y-2">
        {result.recommendations.map((rec: string, index: number) => (
          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
      {result.summary && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700">{result.summary}</p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <GitCompare className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Comparaison de Stratégies de Succession</CardTitle>
              <CardDescription>
                Comparez différentes stratégies pour optimiser la transmission de votre patrimoine
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Estate Value */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Valeur du patrimoine
              </h3>
              <Input
                label="Valeur totale du patrimoine (€)"
                type="number"
                value={estateValue}
                onChange={(e: any) => setEstateValue(e.target.value)}
                placeholder="1000000"
              />
            </div>

            {/* Heirs Configuration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  Héritiers
                </h3>
                <Button onClick={addHeir} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un héritier
                </Button>
              </div>

              <div className="space-y-3">
                {heirs.map((heir: any) => {
                  const relationshipInfo = getRelationshipInfo(heir.relationship);
                  const RelationIcon = relationshipInfo.icon;
                  return (
                    <div
                      key={heir.id}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <Input
                            label="Nom de l'héritier"
                            type="text"
                            value={heir.name}
                            onChange={(e: any) => updateHeir(heir.id, 'name', e.target.value)}
                            placeholder="Ex: Marie Dupont"
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Lien de parenté
                            </label>
                            <select
                              value={heir.relationship}
                              onChange={(e: any) => updateHeir(heir.id, 'relationship', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                              {RELATIONSHIP_OPTIONS.map(rel => (
                                <option key={rel.value} value={rel.value}>
                                  {rel.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Input
                            label="Part (%)"
                            type="number"
                            value={heir.share}
                            onChange={(e: any) => updateHeir(heir.id, 'share', e.target.value)}
                            placeholder="50"
                          />

                          <Input
                            label="Donations antérieures (€)"
                            type="number"
                            value={heir.previousDonations}
                            onChange={(e: any) => updateHeir(heir.id, 'previousDonations', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <button
                          onClick={() => removeHeir(heir.id)}
                          className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer l'héritier"
                          disabled={heirs.length === 1}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Shares Indicator */}
              <div className="mt-4">
                {(() => {
                  const totalShares = heirs.reduce((sum: any, h: any) => sum + (parseFloat(h.share) || 0), 0);
                  const isValid = Math.abs(totalShares - 100) < 0.1;
                  return (
                    <div className={`p-3 rounded-lg border ${isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-red-700'}`}>
                          Total des parts
                        </span>
                        <span className={`text-lg font-bold ${isValid ? 'text-green-900' : 'text-red-900'}`}>
                          {totalShares.toFixed(1)}%
                        </span>
                      </div>
                      {!isValid && (
                        <p className="text-xs text-red-600 mt-1">
                          Les parts doivent totaliser 100%
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4">
                <Button onClick={compareStrategies} disabled={loading} className="w-full">
                  <GitCompare className="h-4 w-4 mr-2" />
                  {loading ? 'Comparaison en cours...' : 'Comparer les stratégies'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="mt-8">
                {/* Timeline Template with Bento Grid */}
                <TimelineTemplate
                  timelineTitle="Comparaison des stratégies"
                  timelineDescription="Analyse comparative des différentes options de transmission"
                  timeline={
                    strategyComparisonData.length > 0 ? (
                      <ModernBarChart
                        data={strategyComparisonData}
                        dataKeys={['Droits de succession', 'Patrimoine net transmis']}
                        formatValue={formatCurrency}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Aucune donnée disponible
                      </div>
                    )
                  }
                  kpis={kpis}
                  feasibility={
                    result.bestStrategy && result.bestStrategy.taxSavings > 0
                      ? { status: 'FEASIBLE', message: result.bestStrategy.description }
                      : { status: 'CHALLENGING', message: 'Optimisation limitée possible' }
                  }
                  recommendations={recommendationsComponent}
                  loading={loading}
                />

                {/* Strategies Comparison Table */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">Comparaison détaillée des stratégies</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-left text-sm font-semibold text-gray-700 border">Stratégie</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Droits totaux</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Taux effectif</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Patrimoine net</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Économie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.strategies.map((strategy: any, index: number) => (
                          <tr 
                            key={index} 
                            className={strategy.name === result.bestStrategy?.name ? 'bg-green-50' : 'bg-white'}
                          >
                            <td className="p-3 border">
                              <div className="font-semibold text-gray-900">{strategy.name}</div>
                              <div className="text-xs text-gray-500">{strategy.description}</div>
                            </td>
                            <td className="p-3 text-right border font-semibold text-red-600">
                              {formatCurrency(strategy.totalTax)}
                            </td>
                            <td className="p-3 text-right border">
                              {formatPercent(strategy.effectiveTaxRate)}
                            </td>
                            <td className="p-3 text-right border font-semibold text-green-600">
                              {formatCurrency(strategy.netEstate)}
                            </td>
                            <td className="p-3 text-right border font-bold text-green-600">
                              {strategy.taxSavings ? formatCurrency(strategy.taxSavings) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tax Savings Chart */}
                {taxSavingsData.length > 0 && taxSavingsData.some((d: any) => d['Économie fiscale'] > 0) && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-green-600" />
                      Économies fiscales par stratégie
                    </h4>
                    <ModernBarChart
                      data={taxSavingsData}
                      dataKeys={['Économie fiscale']}
                      formatValue={formatCurrency}
                    />
                  </div>
                )}

                {/* Strategy Details */}
                {result.strategies.map((strategy: any, index: number) => (
                  <div key={index} className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-3">{strategy.name}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Description</div>
                        <p className="text-sm text-gray-800">{strategy.description}</p>
                      </div>
                      {strategy.details && (
                        <div>
                          <div className="text-sm text-gray-600 mb-2">Détails</div>
                          <ul className="text-sm text-gray-800 space-y-1">
                            {strategy.details.map((detail: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de la comparaison</p>
                      <p>
                        Cette comparaison évalue différentes stratégies de transmission : succession directe,
                        donations anticipées, démembrement de propriété, et assurance-vie. Chaque stratégie
                        présente des avantages fiscaux différents selon votre situation. Les résultats sont
                        indicatifs et basés sur la législation actuelle. Consultez un notaire pour une
                        stratégie personnalisée.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
