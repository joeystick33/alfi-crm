'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { TimelineTemplate } from '@/components/ui/bento/TimelineTemplate';
import { 
  GitCompare, 
  Plus,
  Trash2,
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  Percent,
  User,
  TrendingUp,
  AlertCircle,
  Target
} from 'lucide-react';

interface Scenario {
  id: number;
  name: string;
  description: string;
  retirementAge: string;
  monthlyContribution?: string;
  expectedReturn?: string;
}

export function RetirementComparison() {
  // Base input
  const [currentAge, setCurrentAge] = useState('35');
  const [lifeExpectancy, setLifeExpectancy] = useState('85');
  const [currentSavings, setCurrentSavings] = useState('50000');
  const [currentIncome, setCurrentIncome] = useState('50000');
  const [desiredReplacementRate, setDesiredReplacementRate] = useState('70');
  const [baseMonthlyContribution, setBaseMonthlyContribution] = useState('500');
  const [baseExpectedReturn, setBaseExpectedReturn] = useState('5');
  const [inflationRate, setInflationRate] = useState('2');

  // Scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 1,
      name: 'Retraite à 62 ans',
      description: 'Départ anticipé',
      retirementAge: '62'
    },
    {
      id: 2,
      name: 'Retraite à 65 ans',
      description: 'Départ standard',
      retirementAge: '65'
    },
    {
      id: 3,
      name: 'Retraite à 67 ans',
      description: 'Départ tardif',
      retirementAge: '67'
    }
  ]);
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addScenario = () => {
    const newId = Math.max(...scenarios.map(s => s.id), 0) + 1;
    setScenarios([
      ...scenarios,
      {
        id: newId,
        name: `Scénario ${newId}`,
        description: 'Nouveau scénario',
        retirementAge: '65'
      }
    ]);
  };

  const removeScenario = (id: number) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter(s => s.id !== id));
    }
  };

  const updateScenario = (id: number, field: keyof Scenario, value: string) => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const compareScenarios = async () => {
    const age = parseFloat(currentAge) || 0;
    const lifeExp = parseFloat(lifeExpectancy) || 0;
    const savings = parseFloat(currentSavings) || 0;
    const income = parseFloat(currentIncome) || 0;
    const replacementRate = parseFloat(desiredReplacementRate) || 0;
    const contribution = parseFloat(baseMonthlyContribution) || 0;
    const returnRate = parseFloat(baseExpectedReturn) || 0;
    const inflation = parseFloat(inflationRate) || 0;

    if (age <= 0 || lifeExp <= age || income <= 0 || replacementRate <= 0) {
      setError('Veuillez vérifier les valeurs saisies');
      return;
    }

    if (scenarios.length === 0) {
      setError('Ajoutez au moins un scénario');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/simulators/retirement/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseInput: {
            currentAge: age,
            lifeExpectancy: lifeExp,
            currentSavings: savings,
            monthlyContribution: contribution,
            expectedReturn: returnRate / 100,
            inflationRate: inflation / 100,
            currentIncome: income,
            desiredReplacementRate: replacementRate / 100
          },
          scenarios: scenarios.map(s => ({
            name: s.name,
            description: s.description,
            retirementAge: parseFloat(s.retirementAge),
            monthlyContribution: s.monthlyContribution ? parseFloat(s.monthlyContribution) : undefined,
            expectedReturn: s.expectedReturn ? parseFloat(s.expectedReturn) / 100 : undefined
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la comparaison');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors de la comparaison des scénarios');
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

  // Prepare comparison chart data
  const savingsComparisonData = result?.scenarios ? result.scenarios.map((s: any) => ({
    name: s.name,
    'Capital à la retraite': s.savingsAtRetirement,
    'Contributions totales': s.totalContributions
  })) : [];

  const incomeComparisonData = result?.scenarios ? result.scenarios.map((s: any) => ({
    name: s.name,
    'Revenu souhaité': result.desiredAnnualIncome,
    'Revenu disponible': s.sustainableAnnualIncome
  })) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <GitCompare className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>Comparaison de Scénarios de Retraite</CardTitle>
              <CardDescription>
                Comparez différentes stratégies de retraite côte à côte
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Base Information */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                Informations de base
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Âge actuel"
                  type="number"
                  value={currentAge}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentAge(e.target.value)}
                  placeholder="35"
                  min="18"
                  max="75"
                />

                <Input
                  label="Espérance de vie"
                  type="number"
                  value={lifeExpectancy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLifeExpectancy(e.target.value)}
                  placeholder="85"
                  min="70"
                  max="100"
                />

                <Input
                  label="Épargne actuelle (€)"
                  type="number"
                  value={currentSavings}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentSavings(e.target.value)}
                  placeholder="50000"
                />

                <Input
                  label="Revenu annuel (€)"
                  type="number"
                  value={currentIncome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentIncome(e.target.value)}
                  placeholder="50000"
                />

                <Input
                  label="Contribution mensuelle (€)"
                  type="number"
                  value={baseMonthlyContribution}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseMonthlyContribution(e.target.value)}
                  placeholder="500"
                />

                <Input
                  label="Rendement attendu (%)"
                  type="number"
                  value={baseExpectedReturn}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseExpectedReturn(e.target.value)}
                  placeholder="5"
                  step="0.1"
                />

                <Input
                  label="Taux d'inflation (%)"
                  type="number"
                  value={inflationRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInflationRate(e.target.value)}
                  placeholder="2"
                  step="0.1"
                />

                <Input
                  label="Taux de remplacement (%)"
                  type="number"
                  value={desiredReplacementRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDesiredReplacementRate(e.target.value)}
                  placeholder="70"
                />
              </div>
            </div>

            {/* Scenarios */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Scénarios à comparer</h3>
                <Button onClick={addScenario} variant="outline" size="sm" disabled={scenarios.length >= 10}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un scénario
                </Button>
              </div>

              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Input
                          label="Nom du scénario"
                          type="text"
                          value={scenario.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScenario(scenario.id, 'name', e.target.value)}
                          placeholder="Nom du scénario"
                        />

                        <Input
                          label="Description"
                          type="text"
                          value={scenario.description}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScenario(scenario.id, 'description', e.target.value)}
                          placeholder="Description"
                        />

                        <Input
                          label="Âge de retraite"
                          type="number"
                          value={scenario.retirementAge}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScenario(scenario.id, 'retirementAge', e.target.value)}
                          placeholder="65"
                          min="62"
                          max="75"
                          required
                        />

                        <Input
                          label="Contribution (€) - optionnel"
                          type="number"
                          value={scenario.monthlyContribution || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateScenario(scenario.id, 'monthlyContribution', e.target.value)}
                          placeholder="Utiliser la base"
                        />
                      </div>

                      <button
                        onClick={() => removeScenario(scenario.id)}
                        className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer le scénario"
                        disabled={scenarios.length === 1}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button onClick={compareScenarios} disabled={loading} className="w-full">
                  <GitCompare className="h-4 w-4 mr-2" />
                  {loading ? 'Comparaison en cours...' : 'Comparer les scénarios'}
                </Button>
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
                      data={savingsComparisonData}
                      dataKeys={['Capital à la retraite', 'Contributions totales']}
                      title="Comparaison du capital à la retraite"
                      formatValue={formatCurrency}
                    />
                  }
                  timelineTitle="Comparaison des scénarios de retraite"
                  timelineDescription={`${result.scenarios.length} scénarios analysés`}
                  kpis={result.bestScenario ? [
                    {
                      title: 'Meilleur scénario',
                      value: result.bestScenario.name,
                      description: result.bestScenario.description,
                      icon: <CheckCircle className="h-5 w-5" />,
                    },
                    {
                      title: 'Capital optimal',
                      value: formatCurrency(result.bestScenario.savingsAtRetirement),
                      description: `À ${result.bestScenario.retirementAge} ans`,
                      icon: <DollarSign className="h-5 w-5" />,
                    },
                    {
                      title: 'Revenu disponible',
                      value: formatCurrency(result.bestScenario.sustainableAnnualIncome),
                      description: 'Par an',
                      icon: <TrendingUp className="h-5 w-5" />,
                    },
                    {
                      title: 'Scénarios faisables',
                      value: `${result.scenarios.filter((s: any) => s.isRetirementFeasible).length}/${result.scenarios.length}`,
                      description: 'Objectifs atteignables',
                      icon: <Target className="h-5 w-5" />,
                    },
                  ] : []}
                  feasibility={{
                    status: result.scenarios.some((s: any) => s.isRetirementFeasible) ? 'FEASIBLE' : 'NOT_FEASIBLE',
                    message: result.bestScenario 
                      ? `Le scénario "${result.bestScenario.name}" offre le meilleur équilibre entre capital et revenus.`
                      : 'Aucun scénario ne permet d\'atteindre vos objectifs. Ajustements nécessaires.'
                  }}
                  recommendations={
                    <div>
                      {result.summary && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Résumé de la comparaison
                          </h4>
                          <p className="text-sm text-gray-700">{result.summary}</p>
                        </div>
                      )}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
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
                      )}
                    </div>
                  }
                  loading={loading}
                />

                {/* Scenarios Comparison Table */}
                <div className="overflow-x-auto">
                  <h4 className="text-lg font-semibold mb-4">Comparaison détaillée</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left text-sm font-semibold text-gray-700 border">Scénario</th>
                        <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Âge retraite</th>
                        <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Capital</th>
                        <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Revenu annuel</th>
                        <th className="p-3 text-right text-sm font-semibold text-gray-700 border">Déficit</th>
                        <th className="p-3 text-center text-sm font-semibold text-gray-700 border">Faisable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.scenarios.map((scenario: any, index: number) => (
                        <tr key={index} className={scenario.name === result.bestScenario?.name ? 'bg-green-50' : 'bg-white'}>
                          <td className="p-3 border">
                            <div className="font-semibold text-gray-900">{scenario.name}</div>
                            <div className="text-xs text-gray-500">{scenario.description}</div>
                          </td>
                          <td className="p-3 text-right border">{scenario.retirementAge} ans</td>
                          <td className="p-3 text-right border font-semibold">{formatCurrency(scenario.savingsAtRetirement)}</td>
                          <td className="p-3 text-right border">{formatCurrency(scenario.sustainableAnnualIncome)}</td>
                          <td className={`p-3 text-right border font-semibold ${scenario.incomeShortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {scenario.incomeShortfall > 0 ? formatCurrency(scenario.incomeShortfall) : '—'}
                          </td>
                          <td className="p-3 text-center border">
                            {scenario.isRetirementFeasible ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Income Comparison Chart */}
                {incomeComparisonData.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      Revenus de retraite
                    </h4>
                    <ModernBarChart
                      data={incomeComparisonData}
                      dataKeys={['Revenu souhaité', 'Revenu disponible']}
                      title="Revenus de retraite"
                      formatValue={formatCurrency}
                    />
                  </div>
                )}

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">À propos de la comparaison</p>
                      <p>
                        Cette comparaison vous permet d'évaluer différentes stratégies de retraite en fonction
                        de l'âge de départ, des contributions et des rendements. Le meilleur scénario est celui
                        qui permet d'atteindre vos objectifs de revenu tout en maximisant votre capital.
                        Les résultats sont indicatifs et basés sur les hypothèses fournies.
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
