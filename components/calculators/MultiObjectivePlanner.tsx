'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ModernBarChart } from '@/components/charts/ModernBarChart';
import { 
  Target, 
  Plus,
  Trash2,
  GripVertical,
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  Percent,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export function MultiObjectivePlanner() {
  const [totalMonthlyBudget, setTotalMonthlyBudget] = useState('2000');
  const [expectedReturn, setExpectedReturn] = useState('5');
  const [objectives, setObjectives] = useState([
    {
      id: 1,
      name: 'Retraite',
      targetAmount: '500000',
      currentAmount: '50000',
      timeHorizon: '20',
      priority: 'high'
    },
    {
      id: 2,
      name: 'Achat immobilier',
      targetAmount: '100000',
      currentAmount: '20000',
      timeHorizon: '5',
      priority: 'high'
    }
  ]);
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Real-time calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateMultipleObjectives();
    }, 500);

    return () => clearTimeout(timer);
  }, [totalMonthlyBudget, expectedReturn, objectives]);

  const calculateMultipleObjectives = async () => {
    const budget = parseFloat(totalMonthlyBudget) || 0;
    const returnRate = parseFloat(expectedReturn) || 0;

    if (budget <= 0) {
      setError('Le budget mensuel doit être positif');
      setResult(null);
      return;
    }

    if (objectives.length === 0) {
      setError('Ajoutez au moins un objectif');
      setResult(null);
      return;
    }

    // Validate objectives
    for (const obj of objectives) {
      const target = parseFloat(obj.targetAmount) || 0;
      const current = parseFloat(obj.currentAmount) || 0;
      const horizon = parseFloat(obj.timeHorizon) || 0;

      if (target <= 0 || horizon <= 0) {
        setError(`L'objectif "${obj.name}" a des valeurs invalides`);
        setResult(null);
        return;
      }

      if (current < 0) {
        setError(`Le montant actuel de "${obj.name}" ne peut pas être négatif`);
        setResult(null);
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/calculators/objectives/multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectives: objectives.map(obj => ({
            name: obj.name,
            targetAmount: parseFloat(obj.targetAmount) || 0,
            currentAmount: parseFloat(obj.currentAmount) || 0,
            timeHorizon: parseFloat(obj.timeHorizon) || 0,
            priority: obj.priority
          })),
          totalMonthlyBudget: budget,
          expectedReturn: returnRate
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du calcul');
      }

      const data = await response.json();
      setResult(data.data || data.result);
    } catch (err) {
      setError('Erreur lors du calcul des objectifs multiples');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addObjective = () => {
    const newId = Math.max(...objectives.map(o => o.id), 0) + 1;
    setObjectives([
      ...objectives,
      {
        id: newId,
        name: `Objectif ${newId}`,
        targetAmount: '50000',
        currentAmount: '0',
        timeHorizon: '10',
        priority: 'medium'
      }
    ]);
  };

  const removeObjective = (id) => {
    setObjectives(objectives.filter(obj => obj.id !== id));
  };

  const updateObjective = (id, field, value) => {
    setObjectives(objectives.map(obj => 
      obj.id === id ? { ...obj, [field]: value } : obj
    ));
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newObjectives = [...objectives];
    const draggedObjective = newObjectives[draggedItem];
    newObjectives.splice(draggedItem, 1);
    newObjectives.splice(index, 0, draggedObjective);

    setDraggedItem(index);
    setObjectives(newObjectives);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Non définie';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fully_funded': return 'green';
      case 'partially_funded': return 'orange';
      case 'unfunded': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'fully_funded': return 'Entièrement financé';
      case 'partially_funded': return 'Partiellement financé';
      case 'unfunded': return 'Non financé';
      default: return 'Inconnu';
    }
  };

  // Prepare allocation chart data
  const allocationChartData = result ? result.objectives.map(obj => ({
    name: obj.name,
    'Requis': obj.requiredMonthly,
    'Alloué': obj.allocatedMonthly
  })) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Planificateur Multi-Objectifs</CardTitle>
              <CardDescription>
                Gérez plusieurs objectifs financiers avec allocation prioritaire du budget
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Budget Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Input
                label="Budget mensuel total (€)"
                type="number"
                value={totalMonthlyBudget}
                onChange={(e) => setTotalMonthlyBudget(e.target.value)}
                placeholder="2000"
                required
                icon={<DollarSign className="h-4 w-4" />}
                helperText="Budget disponible pour tous les objectifs"
              />

              <Input
                label="Rendement attendu (%/an)"
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                placeholder="5"
                step="0.1"
                min="0"
                max="20"
                icon={<Percent className="h-4 w-4" />}
                helperText="Rendement annuel moyen espéré"
              />
            </div>

            {/* Objectives List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Objectifs financiers</h3>
                <Button onClick={addObjective} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un objectif
                </Button>
              </div>

              <div className="space-y-3">
                {objectives.map((obj, index) => (
                  <div
                    key={obj.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 bg-white border-2 rounded-lg transition-all ${
                      draggedItem === index 
                        ? 'border-primary-400 shadow-lg opacity-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="cursor-move mt-2">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                        <Input
                          label="Nom"
                          type="text"
                          value={obj.name}
                          onChange={(e) => updateObjective(obj.id, 'name', e.target.value)}
                          placeholder="Nom de l'objectif"
                        />

                        <Input
                          label="Montant cible (€)"
                          type="number"
                          value={obj.targetAmount}
                          onChange={(e) => updateObjective(obj.id, 'targetAmount', e.target.value)}
                          placeholder="50000"
                        />

                        <Input
                          label="Épargne actuelle (€)"
                          type="number"
                          value={obj.currentAmount}
                          onChange={(e) => updateObjective(obj.id, 'currentAmount', e.target.value)}
                          placeholder="0"
                        />

                        <Input
                          label="Horizon (années)"
                          type="number"
                          value={obj.timeHorizon}
                          onChange={(e) => updateObjective(obj.id, 'timeHorizon', e.target.value)}
                          placeholder="10"
                          min="1"
                          max="50"
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priorité
                          </label>
                          <select
                            value={obj.priority}
                            onChange={(e) => updateObjective(obj.id, 'priority', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="high">Haute</option>
                            <option value="medium">Moyenne</option>
                            <option value="low">Basse</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => removeObjective(obj.id)}
                        className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer l'objectif"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {objectives.length === 0 && (
                  <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">Aucun objectif défini</p>
                    <Button onClick={addObjective} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter votre premier objectif
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2 text-sm text-blue-800">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Glissez-déposez les objectifs pour ajuster leur ordre de priorité.
                    Les objectifs en haut seront financés en premier.
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6 mt-8">
                {/* Budget Status */}
                <div className={`p-6 bg-gradient-to-br ${result.budgetSufficient ? 'from-green-50 to-green-100 border-green-300' : 'from-red-50 to-red-100 border-red-300'} rounded-lg border-2`}>
                  <div className="flex items-center gap-4">
                    <div className={result.budgetSufficient ? 'text-green-600' : 'text-red-600'}>
                      {result.budgetSufficient ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <AlertCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Statut du budget</div>
                      <div className={`text-2xl font-bold ${result.budgetSufficient ? 'text-green-900' : 'text-red-900'}`}>
                        {result.budgetSufficient ? 'Budget suffisant' : 'Budget insuffisant'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">Budget mensuel</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(result.totalMonthlyBudget)}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">Total requis</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(result.totalRequired)}
                    </div>
                  </div>

                  <div className={`p-4 bg-gradient-to-br ${result.unallocatedBudget >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'} rounded-lg border`}>
                    <div className={`text-sm ${result.unallocatedBudget >= 0 ? 'text-green-600' : 'text-red-600'} font-medium mb-1`}>
                      {result.unallocatedBudget >= 0 ? 'Budget restant' : 'Déficit'}
                    </div>
                    <div className={`text-2xl font-bold ${result.unallocatedBudget >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                      {formatCurrency(Math.abs(result.unallocatedBudget))}
                    </div>
                  </div>
                </div>

                {/* Objectives Allocation */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Allocation par objectif</h4>
                  <div className="space-y-3">
                    {result.objectives.map((obj, index) => (
                      <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-900">{obj.name}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getPriorityColor(obj.priority)}-100 text-${getPriorityColor(obj.priority)}-700`}>
                              {getPriorityLabel(obj.priority)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(obj.status)}-100 text-${getStatusColor(obj.status)}-700`}>
                              {getStatusLabel(obj.status)}
                            </span>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            {formatPercent(obj.fundingPercentage)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">Requis par mois</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(obj.requiredMonthly)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Alloué par mois</div>
                            <div className="text-sm font-semibold text-green-600">
                              {formatCurrency(obj.allocatedMonthly)}
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${getStatusColor(obj.status)}-600`}
                            style={{ width: `${Math.min(obj.fundingPercentage * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allocation Chart */}
                {allocationChartData.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      Comparaison requis vs alloué
                    </h4>
                    <ModernBarChart
                      data={allocationChartData}
                      dataKeys={['Requis', 'Alloué']}
                      formatValue={formatCurrency}
                    />
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Recommandations
                    </h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
