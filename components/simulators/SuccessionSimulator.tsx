'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TimelineTemplate } from '@/components/ui/bento/TimelineTemplate';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { 
  Users, 
  Plus,
  Trash2,
  CheckCircle, 
  Info,
  DollarSign,
  AlertCircle,
  TrendingDown,
  Home,
  Briefcase,
  PiggyBank,
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

const ASSET_TYPES = [
  { value: 'real_estate', label: 'Immobilier', icon: Home },
  { value: 'financial', label: 'Financier', icon: DollarSign },
  { value: 'business', label: 'Entreprise', icon: Briefcase },
  { value: 'other', label: 'Autre', icon: PiggyBank }
];

interface Asset {
  id: number;
  name: string;
  type: string;
  value: string;
  debt: string;
}

interface Heir {
  id: number;
  name: string;
  relationship: string;
  share: string;
  previousDonations: string;
  disabled?: boolean;
}

export function SuccessionSimulator() {
  // Assets state
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 1,
      name: 'Résidence principale',
      type: 'real_estate',
      value: '500000',
      debt: '0'
    }
  ]);

  // Heirs state
  const [heirs, setHeirs] = useState<Heir[]>([
    {
      id: 1,
      name: 'Héritier 1',
      relationship: 'child',
      share: '100',
      previousDonations: '0',
      disabled: false
    }
  ]);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateSuccession();
    }, 500);

    return () => clearTimeout(timer);
  }, [assets, heirs]);

  const addAsset = () => {
    const newId = Math.max(...assets.map((a: any) => a.id), 0) + 1;
    setAssets([
      ...assets,
      {
        id: newId,
        name: `Actif ${newId}`,
        type: 'other',
        value: '0',
        debt: '0'
      }
    ]);
  };

  const removeAsset = (id: number) => {
    if (assets.length > 1) {
      setAssets(assets.filter((a: any) => a.id !== id));
    }
  };

  const updateAsset = (id: number, field: keyof Asset, value: string) => {
    setAssets(assets.map((a: any) => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

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
        previousDonations: '0',
        disabled: false
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

  const updateHeir = (id: number, field: keyof Heir, value: string | boolean) => {
    setHeirs(heirs.map((h: any) => 
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  const simulateSuccession = async () => {
    // Validate assets
    const validAssets = assets.filter((a: any) => {
      const value = parseFloat(a.value) || 0;
      return value > 0;
    });

    if (validAssets.length === 0) {
      setError('Ajoutez au moins un actif avec une valeur positive');
      setResult(null);
      return;
    }

    // Validate heirs
    const validHeirs = heirs.filter((h: any) => {
      const share = parseFloat(h.share) || 0;
      return share > 0;
    });

    if (validHeirs.length === 0) {
      setError('Ajoutez au moins un héritier avec une part positive');
      setResult(null);
      return;
    }

    // Check total shares
    const totalShares = validHeirs.reduce((sum: any, h: any) => sum + (parseFloat(h.share) || 0), 0);
    if (Math.abs(totalShares - 100) > 0.1) {
      setError(`Les parts doivent totaliser 100% (actuellement ${totalShares.toFixed(1)}%)`);
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/simulators/succession/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: validAssets.map((a: any) => ({
            id: a.id.toString(),
            name: a.name,
            type: a.type,
            value: parseFloat(a.value) || 0,
            debt: parseFloat(a.debt) || 0
          })),
          heirs: validHeirs.map((h: any) => ({
            id: h.id.toString(),
            name: h.name,
            relationship: h.relationship,
            share: (parseFloat(h.share) || 0) / 100,
            disabled: h.disabled,
            previousDonations: parseFloat(h.previousDonations) || 0
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la simulation');
      }

      const data = await response.json();
      setResult(data.simulation);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la simulation de succession');
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

  const getAssetTypeInfo = (type: string) => {
    return ASSET_TYPES.find(t => t.value === type) || ASSET_TYPES[ASSET_TYPES.length - 1];
  };

  // Prepare heir tax chart data
  const heirTaxData = result?.heirs ? result.heirs.map((h: any) => ({
    name: h.name,
    'Héritage brut': h.grossInheritance,
    'Droits de succession': h.tax,
    'Héritage net': h.netInheritance
  })) : [];

  // Calculate total estate value
  const totalEstateValue = assets.reduce((sum: any, a: any) => {
    const value = parseFloat(a.value) || 0;
    const debt = parseFloat(a.debt) || 0;
    return sum + (value - debt);
  }, 0);

  // Prepare KPIs for Timeline Template
  const kpis = result ? [
    {
      title: 'Patrimoine brut',
      value: formatCurrency(result.grossEstate),
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Droits totaux',
      value: formatCurrency(result.totalTax),
      change: { value: result.effectiveTaxRate * 100, trend: 'down' as const },
      icon: <TrendingDown className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Patrimoine net transmis',
      value: formatCurrency(result.netEstate),
      icon: <CheckCircle className="h-5 w-5" />,
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
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Simulateur de Succession</CardTitle>
              <CardDescription>
                Calculez les droits de succession et optimisez la transmission de votre patrimoine
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Estate Assets */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Patrimoine à transmettre
                </h3>
                <Button onClick={addAsset} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un actif
                </Button>
              </div>

              <div className="space-y-3">
                {assets.map((asset: any) => {
                  const AssetIcon = getAssetTypeInfo(asset.type).icon;
                  return (
                    <div
                      key={asset.id}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <Input
                            label="Nom de l'actif"
                            type="text"
                            value={asset.name}
                            onChange={(e: any) => updateAsset(asset.id, 'name', e.target.value)}
                            placeholder="Ex: Résidence principale"
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Type d'actif
                            </label>
                            <select
                              value={asset.type}
                              onChange={(e: any) => updateAsset(asset.id, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                              {ASSET_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <Input
                            label="Valeur (€)"
                            type="number"
                            value={asset.value}
                            onChange={(e: any) => updateAsset(asset.id, 'value', e.target.value)}
                            placeholder="500000"
                          />

                          <Input
                            label="Dettes associées (€)"
                            type="number"
                            value={asset.debt}
                            onChange={(e: any) => updateAsset(asset.id, 'debt', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <button
                          onClick={() => removeAsset(asset.id)}
                          className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer l'actif"
                          disabled={assets.length === 1}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Estate Value */}
              <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Valeur nette du patrimoine</span>
                  <span className="text-2xl font-bold text-green-900">
                    {formatCurrency(totalEstateValue)}
                  </span>
                </div>
              </div>
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
                  timelineTitle="Répartition par héritier"
                  timelineDescription="Distribution du patrimoine et droits de succession"
                  timeline={
                    heirTaxData.length > 0 ? (
                      <ModernBarChart
                        data={heirTaxData}
                        dataKeys={['Héritage brut', 'Droits de succession', 'Héritage net']}
                        formatValue={formatCurrency}
                        stacked={false}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Aucune donnée disponible
                      </div>
                    )
                  }
                  kpis={kpis}
                  feasibility={
                    result.effectiveTaxRate < 0.15
                      ? { status: 'FEASIBLE', message: 'Taux de taxation favorable' }
                      : result.effectiveTaxRate < 0.30
                      ? { status: 'CHALLENGING', message: 'Taux de taxation modéré - optimisation possible' }
                      : { status: 'NOT_FEASIBLE', message: 'Taux de taxation élevé - optimisation recommandée' }
                  }
                  recommendations={recommendationsComponent}
                  loading={loading}
                />

                {/* Heirs Details Table */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-4">Détail par héritier</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-left text-sm font-semibold text-gray-700 border">Héritier</th>
                          <th className="p-3 text-left text-sm font-semibold text-gray-700 border">Lien</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Part</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Héritage brut</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Abattement</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Droits</th>
                          <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Héritage net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.heirs.map((heir: any, index: number) => {
                          const relationshipInfo = getRelationshipInfo(heir.relationship);
                          return (
                            <tr key={index} className="bg-white hover:bg-gray-50">
                              <td className="p-3 border font-semibold text-gray-900">{heir.name}</td>
                              <td className="p-3 border">
                                <span className={`text-sm ${relationshipInfo.color}`}>
                                  {relationshipInfo.label}
                                </span>
                              </td>
                              <td className="p-3 text-right border">{formatPercent(heir.share)}</td>
                              <td className="p-3 text-right border font-semibold">{formatCurrency(heir.grossInheritance)}</td>
                              <td className="p-3 text-right border text-green-600">{formatCurrency(heir.allowance)}</td>
                              <td className="p-3 text-right border font-semibold text-red-600">{formatCurrency(heir.tax)}</td>
                              <td className="p-3 text-right border font-bold text-green-600">{formatCurrency(heir.netInheritance)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de la simulation</p>
                      <p>
                        Cette simulation utilise les barèmes fiscaux français en vigueur pour 2024.
                        Les abattements sont renouvelables tous les 15 ans. Les donations antérieures
                        sont prises en compte dans le calcul. Pour une analyse personnalisée et des
                        stratégies d'optimisation, consultez un notaire ou un conseiller en gestion de patrimoine.
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
