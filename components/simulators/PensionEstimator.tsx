'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { TimelineTemplate } from '@/components/ui/bento/TimelineTemplate';
import { 
  Award, 
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  User,
  Briefcase,
  Percent,
  TrendingUp
} from 'lucide-react';

export function PensionEstimator() {
  const [regime, setRegime] = useState('general');
  const [yearsWorked, setYearsWorked] = useState('35');
  const [averageSalary, setAverageSalary] = useState('45000');
  const [currentAge, setCurrentAge] = useState('60');
  const [retirementAge, setRetirementAge] = useState('64');
  const [fullRateAge, setFullRateAge] = useState('67');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      estimatePension();
    }, 500);

    return () => clearTimeout(timer);
  }, [regime, yearsWorked, averageSalary, currentAge, retirementAge, fullRateAge]);

  const estimatePension = async () => {
    const years = parseFloat(yearsWorked) || 0;
    const salary = parseFloat(averageSalary) || 0;
    const age = parseFloat(currentAge) || 0;
    const retAge = parseFloat(retirementAge) || 0;
    const fullAge = parseFloat(fullRateAge) || 67;

    if (years < 0 || years > 50) {
      setError('Les années travaillées doivent être entre 0 et 50');
      setResult(null);
      return;
    }

    if (salary <= 0) {
      setError('Le salaire moyen doit être positif');
      setResult(null);
      return;
    }

    if (age < 18 || age > 100 || retAge < 62 || retAge > 75) {
      setError('Veuillez vérifier les âges saisis');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/simulators/retirement/pension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regime,
          yearsWorked: years,
          averageSalary: salary,
          currentAge: age,
          retirementAge: retAge,
          fullRateAge: fullAge
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'estimation');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors de l\'estimation de la pension');
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

  const getRegimeLabel = (regime: string) => {
    switch (regime) {
      case 'general': return 'Régime général (salariés)';
      case 'public': return 'Fonction publique';
      case 'independent': return 'Travailleurs indépendants';
      case 'multiple': return 'Régimes multiples';
      default: return regime;
    }
  };

  // Prepare pension breakdown chart data
  const pensionBreakdownData = result ? [
    {
      name: 'Pension',
      'Pension de base': result.basePension,
      'Pension complémentaire': result.complementaryPension
    }
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Award className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Estimateur de Pension</CardTitle>
              <CardDescription>
                Estimez votre pension de retraite selon le système français
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Regime Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Régime de retraite
              </label>
              <select
                value={regime}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRegime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="general">Régime général (salariés du privé)</option>
                <option value="public">Fonction publique</option>
                <option value="independent">Travailleurs indépendants</option>
                <option value="multiple">Régimes multiples</option>
              </select>
            </div>

            {/* Work History */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary-600" />
                Historique professionnel
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Années travaillées"
                  type="number"
                  value={yearsWorked}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYearsWorked(e.target.value)}
                  placeholder="35"
                  min="0"
                  max="50"
                  required
                />

                <Input
                  label="Salaire annuel moyen (€)"
                  type="number"
                  value={averageSalary}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAverageSalary(e.target.value)}
                  placeholder="45000"
                  required
                />
              </div>
            </div>

            {/* Age Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Informations d'âge
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Âge actuel"
                  type="number"
                  value={currentAge}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentAge(e.target.value)}
                  placeholder="60"
                  min="18"
                  max="100"
                  required
                />

                <Input
                  label="Âge de départ souhaité"
                  type="number"
                  value={retirementAge}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRetirementAge(e.target.value)}
                  placeholder="64"
                  min="62"
                  max="75"
                />

                <Input
                  label="Âge du taux plein"
                  type="number"
                  value={fullRateAge}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullRateAge(e.target.value)}
                  placeholder="67"
                  min="62"
                  max="75"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6 mt-8">
                <TimelineTemplate
                  timeline={
                    <ModernBarChart
                      data={pensionBreakdownData}
                      dataKeys={['Pension de base', 'Pension complémentaire']}
                      title="Composition de la pension"
                      formatValue={formatCurrency}
                    />
                  }
                  timelineTitle="Estimation de votre pension"
                  timelineDescription={`Régime: ${getRegimeLabel(result.regime)}`}
                  kpis={[
                    {
                      title: 'Pension mensuelle brute',
                      value: formatCurrency(result.monthlyPension),
                      description: `${formatCurrency(result.annualPension)} par an`,
                      icon: <DollarSign className="h-5 w-5" />,
                    },
                    {
                      title: 'Taux de remplacement',
                      value: formatPercent(result.replacementRate),
                      description: 'Du salaire moyen',
                      icon: <Percent className="h-5 w-5" />,
                    },
                    {
                      title: 'Trimestres validés',
                      value: result.quartersValidated,
                      description: `Sur ${result.quartersRequired} requis`,
                      icon: <Calendar className="h-5 w-5" />,
                    },
                    {
                      title: 'Taux de liquidation',
                      value: formatPercent(result.pensionRate),
                      description: result.hasDiscount ? `Décote: -${formatPercent(result.discountRate)}` : result.hasBonus ? `Surcote: +${formatPercent(result.bonusRate)}` : 'Taux plein',
                      icon: <TrendingUp className="h-5 w-5" />,
                    },
                  ]}
                  feasibility={{
                    status: result.missingQuarters === 0 && result.replacementRate >= 0.7 ? 'FEASIBLE' : result.missingQuarters > 8 || result.replacementRate < 0.5 ? 'NOT_FEASIBLE' : 'CHALLENGING',
                    message: result.missingQuarters === 0 
                      ? `Vous avez validé tous les trimestres requis. Taux de remplacement: ${formatPercent(result.replacementRate)}.`
                      : `Il vous manque ${result.missingQuarters} trimestres pour le taux plein. Taux de remplacement estimé: ${formatPercent(result.replacementRate)}.`
                  }}
                  recommendations={
                    result.recommendations && result.recommendations.length > 0 ? (
                      <div>
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
                    ) : undefined
                  }
                  loading={loading}
                />

                {/* Pension Breakdown Details */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4">Détail de la pension</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Pension de base</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.basePension)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Pension complémentaire</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.complementaryPension)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Régime</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {getRegimeLabel(result.regime)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200">
                      <span className="text-sm text-gray-600">Salaire de référence</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.referenceSalary)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de l'estimation</p>
                      <p>
                        Cette estimation est basée sur les règles actuelles du système de retraite français.
                        Le calcul prend en compte la pension de base et la pension complémentaire selon votre régime.
                        Pour le régime général, la pension de base est calculée sur les 25 meilleures années.
                        Les montants sont indicatifs et peuvent varier selon l'évolution de la législation.
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
