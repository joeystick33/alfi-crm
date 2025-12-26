'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { ModernBarChart } from '@/app/_common/components/charts/ModernBarChart';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle,
  Info,
  DollarSign,
  TrendingDown,
  Home,
  Briefcase,
  PiggyBank,
  Heart,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- UI Components "Fintech Pro" ---
const FloatingInput = ({ label, value, onChange, type = "text", ...props }: any) => (
  <div className="relative group">
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="peer w-full bg-white border border-slate-200 rounded-xl px-4 pt-6 pb-2 text-slate-900 font-medium placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
      placeholder={label}
      {...props}
    />
    <label className="absolute left-4 top-4 text-xs text-slate-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-emerald-600 pointer-events-none">
      {label}
    </label>
  </div>
);

const HeroCard = ({ title, value, subtext, icon: Icon, color = "indigo" }: any) => {
  const stylesMap = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-red-50 border-red-100 text-red-700",
  };

  const activeStyle = stylesMap[color as keyof typeof stylesMap] || stylesMap.indigo;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-md", activeStyle)}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</p>
          {Icon && <Icon className="w-5 h-5 opacity-60" />}
        </div>
        <h4 className="text-3xl font-bold font-mono tracking-tight tabular-nums">{value}</h4>
        {subtext && <p className="text-sm opacity-70 mt-2">{subtext}</p>}
      </div>
    </div>
  );
};

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Conjoint', icon: Heart, color: 'text-pink-600' },
  { value: 'child', label: 'Enfant', icon: Users, color: 'text-blue-600' },
  { value: 'grandchild', label: 'Petit-enfant', icon: Users, color: 'text-purple-600' },
  { value: 'great_grandchild', label: 'Arr.-petit-enfant', icon: Users, color: 'text-indigo-600' },
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
  const [assets, setAssets] = useState<Asset[]>([
    { id: 1, name: 'Résidence principale', type: 'real_estate', value: '500000', debt: '0' }
  ]);
  const [heirs, setHeirs] = useState<Heir[]>([
    { id: 1, name: 'Héritier 1', relationship: 'child', share: '100', previousDonations: '0', disabled: false }
  ]);

  interface HeirResult {
    name: string;
    relationship: string;
    share: number;
    grossInheritance: number;
    allowance: number;
    tax: number;
    netInheritance: number;
  }

  interface SimulationResult {
    grossEstate: number;
    netEstate: number;
    totalTax: number;
    effectiveTaxRate: number;
    heirs: HeirResult[];
    recommendations?: string[];
  }

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      simulateSuccession();
    }, 600);
    return () => clearTimeout(timer);
  }, [assets, heirs]);

  const addAsset = () => {
    const newId = Math.max(...assets.map((a) => a.id), 0) + 1;
    setAssets([...assets, { id: newId, name: `Actif ${newId}`, type: 'other', value: '0', debt: '0' }]);
  };

  const removeAsset = (id: number) => {
    if (assets.length > 1) setAssets(assets.filter((a) => a.id !== id));
  };

  const updateAsset = (id: number, field: keyof Asset, value: string) => {
    setAssets(assets.map((a) => a.id === id ? { ...a, [field]: value } : a));
  };

  const addHeir = () => {
    const newId = Math.max(...heirs.map((h) => h.id), 0) + 1;
    const newShare = (100 / (heirs.length + 1)).toFixed(2);
    setHeirs([
      ...heirs.map((h) => ({ ...h, share: newShare })),
      { id: newId, name: `Héritier ${newId}`, relationship: 'child', share: newShare, previousDonations: '0', disabled: false }
    ]);
  };

  const removeHeir = (id: number) => {
    if (heirs.length > 1) {
      const remainingHeirs = heirs.filter((h) => h.id !== id);
      const newShare = (100 / remainingHeirs.length).toFixed(2);
      setHeirs(remainingHeirs.map((h) => ({ ...h, share: newShare })));
    }
  };

  const updateHeir = (id: number, field: keyof Heir, value: string | boolean) => {
    setHeirs(heirs.map((h) => h.id === id ? { ...h, [field]: value } : h));
  };

  const simulateSuccession = async () => {
    const validAssets = assets.filter((a) => (parseFloat(a.value) || 0) > 0);
    if (validAssets.length === 0) {
      setError('Ajoutez au moins un actif valorisé');
      setResult(null);
      return;
    }
    const validHeirs = heirs.filter((h) => (parseFloat(h.share) || 0) > 0);
    if (validHeirs.length === 0) {
      setError('Ajoutez au moins un héritier');
      setResult(null);
      return;
    }
    const totalShares = validHeirs.reduce((sum, h) => sum + (parseFloat(h.share) || 0), 0);
    if (Math.abs(totalShares - 100) > 0.1) {
      setError(`Total des parts incorrect (${totalShares.toFixed(1)}%)`);
      setResult(null);
      return;
    }

    setError('');

    try {
      const response = await fetch('/api/advisor/simulators/succession/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: validAssets.map((a) => ({
            id: a.id.toString(),
            name: a.name,
            type: a.type,
            value: parseFloat(a.value) || 0,
            debt: parseFloat(a.debt) || 0
          })),
          heirs: validHeirs.map((h) => ({
            id: h.id.toString(),
            name: h.name,
            relationship: h.relationship,
            share: (parseFloat(h.share) || 0) / 100,
            disabled: h.disabled,
            previousDonations: parseFloat(h.previousDonations) || 0
          }))
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Erreur');
      setResult(payload.simulation || payload.data?.simulation);
    } catch (err: any) {
      setError(err?.message || 'Erreur');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full min-h-[calc(100vh-140px)]">

      {/* LEFT: Inputs Panel */}
      <div className="lg:col-span-5 space-y-8 overflow-y-auto pr-2 pb-20">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
            <span className="text-emerald-600">Simulateur Succession</span>
          </h2>
          <p className="text-slate-500">Estimez les droits de succession et optimisez l'héritage.</p>
        </div>

        {/* ASSETS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Patrimoine
            </h3>
            <Button onClick={addAsset} variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </div>

          <div className="space-y-3">
            {assets.map((asset) => (
              <div key={asset.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group transition-all hover:bg-white hover:shadow-sm">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <FloatingInput
                    label="Nom de l'actif"
                    value={asset.name}
                    onChange={(e: any) => updateAsset(asset.id, 'name', e.target.value)}
                  />
                  <div className="relative">
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                      value={asset.type}
                      onChange={(e) => updateAsset(asset.id, 'type', e.target.value)}
                    >
                      {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FloatingInput
                    label="Valeur (€)"
                    type="number"
                    value={asset.value}
                    onChange={(e: any) => updateAsset(asset.id, 'value', e.target.value)}
                  />
                  <FloatingInput
                    label="Dettes (€)"
                    type="number"
                    value={asset.debt}
                    onChange={(e: any) => updateAsset(asset.id, 'debt', e.target.value)}
                  />
                </div>
                {assets.length > 1 && (
                  <button onClick={() => removeAsset(asset.id)} className="absolute -right-2 -top-2 p-1.5 bg-white shadow-sm border rounded-full text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* HEIRS SECTION */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" /> Héritiers
            </h3>
            <Button onClick={addHeir} variant="ghost" size="sm" className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </div>

          <div className="space-y-3">
            {heirs.map((heir) => (
              <div key={heir.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative group transition-all hover:bg-white hover:shadow-sm">
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-8">
                    <FloatingInput
                      label="Nom"
                      value={heir.name}
                      onChange={(e: any) => updateHeir(heir.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 relative">
                    <select
                      className="w-full h-full bg-white border border-slate-200 rounded-xl px-2 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                      value={heir.relationship}
                      onChange={(e) => updateHeir(heir.id, 'relationship', e.target.value)}
                    >
                      {RELATIONSHIP_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FloatingInput
                    label="Part (%)"
                    type="number"
                    value={heir.share}
                    onChange={(e: any) => updateHeir(heir.id, 'share', e.target.value)}
                  />
                  <FloatingInput
                    label="Donations (€)"
                    type="number"
                    value={heir.previousDonations}
                    onChange={(e: any) => updateHeir(heir.id, 'previousDonations', e.target.value)}
                  />
                </div>
                {heirs.length > 1 && (
                  <button onClick={() => removeHeir(heir.id)} className="absolute -right-2 -top-2 p-1.5 bg-white shadow-sm border rounded-full text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Share Validation */}
          {(() => {
            const total = heirs.reduce((sum, h) => sum + (parseFloat(h.share) || 0), 0);
            const isValid = Math.abs(total - 100) < 0.1;
            return (
              <div className={cn("text-xs font-medium text-right px-2", isValid ? "text-emerald-600" : "text-red-500")}>
                Total parts: {total.toFixed(1)}% {isValid && <CheckCircle className="w-3 h-3 inline ml-1" />}
              </div>
            );
          })()}
        </div>
      </div>

      {/* RIGHT: Results Panel */}
      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <>
            {/* Hero Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <HeroCard
                title="Patrimoine Net"
                value={formatCurrency(result.netEstate)}
                subtext="Après dettes"
                icon={PiggyBank}
                color="indigo"
              />
              <HeroCard
                title="Droits Totaux"
                value={formatCurrency(result.totalTax)}
                subtext={`Taux effectif: ${(result.effectiveTaxRate * 100).toFixed(1)}%`}
                icon={TrendingDown}
                color="rose"
              />
              <HeroCard
                title="Transmis Net"
                value={formatCurrency(result.netEstate - result.totalTax)}
                subtext="Aux héritiers"
                icon={CheckCircle}
                color="emerald"
              />
            </div>

            {/* Main Graph */}
            <Card className="border shadow-lg overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                <CardTitle className="text-base font-semibold text-slate-800">Détail de la transmission</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ModernBarChart
                    data={result.heirs.map(h => ({
                      name: h.name,
                      'Net': h.netInheritance,
                      'Droits': h.tax
                    }))}
                    dataKeys={['Net', 'Droits']}
                    formatValue={formatCurrency}
                    stacked={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Heir Details Table */}
            <Card className="border shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Héritier</th>
                      <th className="px-4 py-3 text-right">Part</th>
                      <th className="px-4 py-3 text-right">Abattement</th>
                      <th className="px-4 py-3 text-right">Droits</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-700">Net Reçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.heirs.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {h.name.charAt(0)}
                          </div>
                          {h.name}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{h.share}%</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">+{formatCurrency(h.allowance)}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">-{formatCurrency(h.tax)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(h.netInheritance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 uppercase tracking-wide">
                  <Info className="w-4 h-4" /> Conseils d'optimisation
                </h4>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 mt-1 shrink-0 opacity-50" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">Configurez votre patrimoine pour lancer la simulation</p>
          </div>
        )}
      </div>
    </div>
  );
}
