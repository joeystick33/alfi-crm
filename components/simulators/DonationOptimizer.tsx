'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TimelineTemplate } from '@/components/ui/bento/TimelineTemplate';
import { ModernLineChart } from '@/components/charts/ModernLineChart';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { 
  Gift, 
  Plus,
  Trash2,
  CheckCircle, 
  Info,
  DollarSign,
  Users,
  AlertCircle,
  Calendar,
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

interface Beneficiary {
  id: number;
  name: string;
  relationship: string;
  share: string;
  previousDonations: string;
}

export function DonationOptimizer() {
  // Donor information
  const [donorAge, setDonorAge] = useState('60');
  const [totalWealth, setTotalWealth] = useState('1000000');
  const [targetAge, setTargetAge] = useState('80');

  // Beneficiaries state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
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

  const addBeneficiary = () => {
    const newId = Math.max(...beneficiaries.map((b: any) => b.id), 0) + 1;
    // Redistribute shares equally
    const newShare = (100 / (beneficiaries.length + 1)).toFixed(2);
    setBeneficiaries([
      ...beneficiaries.map((b: any) => ({ ...b, share: newShare })),
      {
        id: newId,
        name: `Bénéficiaire ${newId}`,
        relationship: 'child',
        share: newShare,
        previousDonations: '0'
      }
    ]);
  };

  const removeBeneficiary = (id: number) => {
    if (beneficiaries.length > 1) {
      const remainingBeneficiaries = beneficiaries.filter((b: any) => b.id !== id);
      // Redistribute shares equally among remaining beneficiaries
      const newShare = (100 / remainingBeneficiaries.length).toFixed(2);
      setBeneficiaries(remainingBeneficiaries.map((b: any) => ({ ...b, share: newShare })));
    }
  };

  const updateBeneficiary = (id: number, field: keyof Beneficiary, value: string) => {
    setBeneficiaries(beneficiaries.map((b: any) => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const optimizeDonations = async () => {
    const age = parseFloat(donorAge) || 0;
    const wealth = parseFloat(totalWealth) || 0;
    const target = parseFloat(targetAge) || 0;

    if (age <= 0 || age >= 100) {
      setError('Veuillez entrer un âge valide');
      return;
    }

    if (wealth <= 0) {
      setError('Le patrimoine doit être positif');
      return;
    }

    if (target <= age) {
      setError('L\'âge cible doit être supérieur à l\'âge actuel');
      return;
    }

    // Validate beneficiaries
    const validBeneficiaries = beneficiaries.filter((b: any) => {
      const share = parseFloat(b.share) || 0;
      return share > 0;
    });

    if (validBeneficiaries.length === 0) {
      setError('Ajoutez au moins un bénéficiaire avec une part positive');
      return;
    }

    // Check total shares
    const totalShares = validBeneficiaries.reduce((sum: any, b: any) => sum + (parseFloat(b.share) || 0), 0);
    if (Math.abs(totalShares - 100) > 0.1) {
      setError(`Les parts doivent totaliser 100% (actuellement ${totalShares.toFixed(1)}%)`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/simulators/succession/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorAge: age,
          totalWealth: wealth,
          targetAge: target,
          beneficiaries: validBeneficiaries.map((b: any) => ({
            id: b.id.toString(),
            name: b.name,
            relationship: b.relationship,
            share: (parseFloat(b.share) || 0) / 100,
            previousDonations: parseFloat(b.previousDonations) || 0
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'optimisation');
      }

      const data = await response.json();
      setResult(data.optimization);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'optimisation des donations');
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

  const getRelationshipInfo = (relationship: string) => {
    return RELATIONSHIP_OPTIONS.find(r => r.value === relationship) || RELATIONSHIP_OPTIONS[RELATIONSHIP_OPTIONS.length - 1];
  };

  // Prepare donation schedule chart data
  const donationScheduleData = result?.donationSchedule ? result.donationSchedule.map((d: any) => ({
    year: d.year,
    age: d.donorAge,
    'Montant de la donation': d.totalDonationAmount,
    'Droits de donation': d.totalTax,
    'Économie fiscale': d.taxSavings || 0
  })) : [];

  // Prepare KPIs for Timeline Template
  const kpis = result ? [
    {
      title: 'Donations totales',
      value: formatCurrency(result.totalDonations),
      icon: <Gift className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Droits de donation',
      value: formatCurrency(result.totalDonationTax),
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Économie fiscale',
      value: formatCurrency(result.totalTaxSavings),
      change: { value: (result.totalTaxSavings / result.totalDonations) * 100, trend: 'up' as const },
      icon: <TrendingDown className="h-5 w-5" />,
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
      {result.strategy && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Stratégie: </span>
            {result.strategy}
          </p>
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
              <Gift className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Optimiseur de Donations</CardTitle>
              <CardDescription>
                Planifiez vos donations pour minimiser les droits de succession
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Donor Information */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                Informations du donateur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Âge actuel"
                  type="number"
                  value={donorAge}
                  onChange={(e: any) => setDonorAge(e.target.value)}
                  placeholder="60"
                />

                <Input
                  label="Patrimoine total (€)"
                  type="number"
                  value={totalWealth}
                  onChange={(e: any) => setTotalWealth(e.target.value)}
                  placeholder="1000000"
                />

                <Input
                  label="Âge cible de transmission"
                  type="number"
                  value={targetAge}
                  onChange={(e: any) => setTargetAge(e.target.value)}
                  placeholder="80"
                />
              </div>
            </div>

            {/* Beneficiaries Configuration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary-600" />
                  Bénéficiaires
                </h3>
                <Button onClick={addBeneficiary} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un bénéficiaire
                </Button>
              </div>

              <div className="space-y-3">
                {beneficiaries.map((beneficiary: any) => {
                  const relationshipInfo = getRelationshipInfo(beneficiary.relationship);
                  const RelationIcon = relationshipInfo.icon;
                  return (
                    <div
                      key={beneficiary.id}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <Input
                            label="Nom du bénéficiaire"
                            type="text"
                            value={beneficiary.name}
                            onChange={(e: any) => updateBeneficiary(beneficiary.id, 'name', e.target.value)}
                            placeholder="Ex: Marie Dupont"
                          />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Lien de parenté
                            </label>
                            <select
                              value={beneficiary.relationship}
                              onChange={(e: any) => updateBeneficiary(beneficiary.id, 'relationship', e.target.value)}
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
                            value={beneficiary.share}
                            onChange={(e: any) => updateBeneficiary(beneficiary.id, 'share', e.target.value)}
                            placeholder="50"
                          />

                          <Input
                            label="Donations antérieures (€)"
                            type="number"
                            value={beneficiary.previousDonations}
                            onChange={(e: any) => updateBeneficiary(beneficiary.id, 'previousDonations', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <button
                          onClick={() => removeBeneficiary(beneficiary.id)}
                          className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le bénéficiaire"
                          disabled={beneficiaries.length === 1}
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
                  const totalShares = beneficiaries.reduce((sum: any, b: any) => sum + (parseFloat(b.share) || 0), 0);
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
                <Button onClick={optimizeDonations} disabled={loading} className="w-full">
                  <Gift className="h-4 w-4 mr-2" />
                  {loading ? 'Optimisation en cours...' : 'Optimiser les donations'}
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
                  timelineTitle="Calendrier des donations recommandé"
                  timelineDescription={`Planification sur ${parseFloat(targetAge) - parseFloat(donorAge)} ans`}
                  timeline={
                    donationScheduleData.length > 0 ? (
                      <ModernLineChart
                        data={donationScheduleData}
                        dataKeys={['Montant de la donation', 'Droits de donation', 'Économie fiscale']}
                        xAxisKey="year"
                        formatValue={formatCurrency}
                        xAxisLabel="Année"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Aucune donnée disponible
                      </div>
                    )
                  }
                  kpis={kpis}
                  feasibility={
                    result.totalTaxSavings > result.totalDonationTax
                      ? { status: 'FEASIBLE', message: 'Stratégie très avantageuse - économies significatives' }
                      : result.totalTaxSavings > 0
                      ? { status: 'CHALLENGING', message: 'Stratégie modérément avantageuse' }
                      : { status: 'NOT_FEASIBLE', message: 'Stratégie peu avantageuse - revoir les paramètres' }
                  }
                  recommendations={recommendationsComponent}
                  loading={loading}
                />

                {/* Donation Schedule Table */}
                {result.donationSchedule && result.donationSchedule.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Détail du calendrier</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-left text-sm font-semibold text-gray-700 border">Année</th>
                            <th className="p-3 text-center text-sm font-semibold text-gray-700 border">Âge</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Montant</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Droits</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Économie</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.donationSchedule.map((donation: any, index: number) => (
                            <tr key={index} className="bg-white hover:bg-gray-50">
                              <td className="p-3 border font-semibold">{donation.year}</td>
                              <td className="p-3 text-center border">{donation.donorAge} ans</td>
                              <td className="p-3 text-right border font-semibold text-blue-600">
                                {formatCurrency(donation.totalDonationAmount)}
                              </td>
                              <td className="p-3 text-right border text-red-600">
                                {formatCurrency(donation.totalTax)}
                              </td>
                              <td className="p-3 text-right border font-semibold text-green-600">
                                {formatCurrency(donation.taxSavings || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Beneficiary Distribution */}
                {result.beneficiaryBreakdown && result.beneficiaryBreakdown.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary-600" />
                      Répartition par bénéficiaire
                    </h4>
                    <ModernBarChart
                      data={result.beneficiaryBreakdown.map((b: any) => ({
                        name: b.name,
                        'Donations totales': b.totalDonations,
                        'Droits payés': b.totalTax,
                        'Montant net reçu': b.netReceived
                      }))}
                      dataKeys={['Donations totales', 'Droits payés', 'Montant net reçu']}
                      formatValue={formatCurrency}
                    />
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de l'optimisation</p>
                      <p>
                        Cette optimisation calcule le calendrier de donations le plus avantageux fiscalement
                        en tenant compte des abattements renouvelables tous les 15 ans. Les donations anticipées
                        permettent de réduire significativement les droits de succession. Les montants et dates
                        sont indicatifs et doivent être adaptés à votre situation personnelle. Consultez un
                        notaire pour mettre en place votre stratégie de transmission.
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
