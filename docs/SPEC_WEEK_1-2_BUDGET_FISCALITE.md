# SPEC TECHNIQUE - SEMAINE 1-2 : BUDGET & FISCALITÉ

**Version** : 1.0  
**Durée** : 10 jours  
**Objectif** : Créer TabBudget (0% → 100%) et TabTaxation (0% → 100%)

---

## 📋 PLANNING DÉTAILLÉ

| Jour | Focus | Livrables |
|------|-------|-----------|
| **J1** | Budget Service | budget-service.ts complet |
| **J2** | Budget API | 4 endpoints fonctionnels |
| **J3** | TabBudget UI (Partie 1) | KPI + Graphiques |
| **J4** | TabBudget UI (Partie 2) | Formulaires revenus/charges |
| **J5** | TabBudget Tests | E2E complet |
| **J6** | Tax Service | tax-service.ts complet |
| **J7** | Tax API | 3 endpoints fonctionnels |
| **J8** | TabTaxation UI (Partie 1) | IR + IFI |
| **J9** | TabTaxation UI (Partie 2) | PS + Optimisations |
| **J10** | Tax Tests + Intégration | E2E + Client360 |

---

## 🔧 SEMAINE 1 : TABBUDGET

### JOUR 1 : Budget Service

#### Fichier : `app/_common/lib/services/budget-service.ts` (CRÉER)

```typescript
import { ClientBudget } from '../api-types';

/**
 * Calcul des métriques budgétaires complètes
 */
export function calculateBudgetMetrics(budget: ClientBudget) {
  // Revenus mensuels
  const profIncome = budget.professionalIncome || {};
  const assetInc = budget.assetIncome || {};
  const spouseInc = budget.spouseIncome || {};
  const pension = budget.retirementPensions || {};
  const allow = budget.allowances || {};

  const revenusMensuels =
    (profIncome.netSalary || 0) +
    (spouseInc.netSalary || 0) +
    ((profIncome.bonuses || 0) / 12) +
    ((assetInc.rentalIncome || 0) / 12) +
    ((assetInc.dividends || 0) / 12) +
    ((assetInc.interest || 0) / 12) +
    ((pension.total || 0) / 12) +
    ((allow.total || 0) / 12);

  // Charges mensuelles
  const expenses = budget.monthlyExpenses || {};
  const chargesMensuelles =
    (expenses.housing?.total || 0) +
    (expenses.utilities?.total || 0) +
    (expenses.food?.total || 0) +
    (expenses.transportation?.total || 0) +
    (expenses.insurance?.total || 0) +
    (expenses.leisure?.total || 0) +
    (expenses.health?.total || 0) +
    (expenses.education?.total || 0) +
    (expenses.loans?.total || 0) +
    (expenses.other?.total || 0);

  // Calculs
  const revenusAnnuels = revenusMensuels * 12;
  const chargesAnnuelles = chargesMensuelles * 12;
  const capaciteEpargneMensuelle = revenusMensuels - chargesMensuelles;
  const capaciteEpargneAnnuelle = capaciteEpargneMensuelle * 12;
  const tauxEpargne = revenusMensuels > 0 
    ? (capaciteEpargneMensuelle / revenusMensuels) * 100 
    : 0;

  return {
    revenusMensuels: Math.round(revenusMensuels),
    revenusAnnuels: Math.round(revenusAnnuels),
    chargesMensuelles: Math.round(chargesMensuelles),
    chargesAnnuelles: Math.round(chargesAnnuelles),
    capaciteEpargneMensuelle: Math.round(capaciteEpargneMensuelle),
    capaciteEpargneAnnuelle: Math.round(capaciteEpargneAnnuelle),
    tauxEpargne: Math.round(tauxEpargne * 10) / 10,
    epargneSecuriteMin: Math.round(chargesMensuelles * 3),
    epargneSecuriteMax: Math.round(chargesMensuelles * 6),
    resteAVivre: Math.round(capaciteEpargneMensuelle),
  };
}

/**
 * Détection anomalies budgétaires
 */
export function detectBudgetAnomalies(budget: ClientBudget, metrics: any) {
  const alerts = [];

  // Épargne négative
  if (metrics.capaciteEpargneMensuelle < 0) {
    alerts.push({
      severity: 'CRITICAL',
      category: 'SAVINGS',
      message: `Capacité d'épargne négative de ${Math.abs(metrics.capaciteEpargneMensuelle).toLocaleString('fr-FR')} €/mois`,
      recommendation: 'Réduire les dépenses ou augmenter les revenus urgently',
    });
  }

  // Taux épargne faible
  if (metrics.tauxEpargne >= 0 && metrics.tauxEpargne < 5) {
    alerts.push({
      severity: 'WARNING',
      category: 'SAVINGS',
      message: `Taux d'épargne très faible (${metrics.tauxEpargne}%)`,
      recommendation: 'Objectif recommandé : minimum 10% des revenus',
    });
  }

  // Logement > 35%
  const housingExpenses = budget.monthlyExpenses?.housing?.total || 0;
  const housingRate = metrics.revenusMensuels > 0 
    ? (housingExpenses / metrics.revenusMensuels) * 100 
    : 0;
  if (housingRate > 35) {
    alerts.push({
      severity: 'WARNING',
      category: 'HOUSING',
      message: `Logement représente ${housingRate.toFixed(1)}% des revenus`,
      recommendation: 'Optimiser ou renégocier les charges de logement',
    });
  }

  // Endettement > 33%
  const loansExpenses = budget.monthlyExpenses?.loans?.total || 0;
  const debtRate = metrics.revenusMensuels > 0 
    ? (loansExpenses / metrics.revenusMensuels) * 100 
    : 0;
  if (debtRate > 33) {
    alerts.push({
      severity: 'CRITICAL',
      category: 'DEBT',
      message: `Taux d'endettement ${debtRate.toFixed(1)}% (>33%)`,
      recommendation: 'Réduction ou restructuration de dette urgente',
    });
  }

  return alerts;
}

/**
 * Recommandations budgétaires personnalisées
 */
export function generateBudgetRecommendations(
  budget: ClientBudget,
  metrics: any,
  client: { annualIncome?: number; taxBracket?: number }
) {
  const recommendations = [];

  // Automatiser épargne
  if (metrics.capaciteEpargneMensuelle > 500) {
    recommendations.push({
      priority: 'HIGH',
      category: 'SAVINGS',
      title: "Automatiser l'épargne mensuelle",
      description: `Mettre en place un virement automatique de ${Math.round(metrics.capaciteEpargneMensuelle * 0.8).toLocaleString('fr-FR')} €/mois`,
      impact: `${(metrics.capaciteEpargneMensuelle * 12).toLocaleString('fr-FR')} € épargnés sur 1 an`,
    });
  }

  // PER si TMI >= 30%
  if (client.taxBracket && client.taxBracket >= 30 && metrics.capaciteEpargneMensuelle > 300) {
    const perContribution = Math.min(
      metrics.capaciteEpargneMensuelle * 12,
      (client.annualIncome || 0) * 0.10
    );
    const taxSavings = perContribution * (client.taxBracket / 100);

    recommendations.push({
      priority: 'HIGH',
      category: 'TAX',
      title: 'Optimisation fiscale via PER',
      description: `Versement PER de ${perContribution.toLocaleString('fr-FR')} €/an`,
      impact: `Économie fiscale de ${Math.round(taxSavings).toLocaleString('fr-FR')} €`,
    });
  }

  // Réduire loisirs si > 15%
  const leisureExpenses = budget.monthlyExpenses?.leisure?.total || 0;
  const leisureRate = metrics.revenusMensuels > 0 
    ? (leisureExpenses / metrics.revenusMensuels) * 100 
    : 0;
  if (leisureRate > 15) {
    const savings = leisureExpenses * 0.20;
    recommendations.push({
      priority: 'MEDIUM',
      category: 'EXPENSES',
      title: 'Optimiser les dépenses loisirs',
      description: `Réduire de 20% les dépenses loisirs`,
      impact: `${Math.round(savings * 12).toLocaleString('fr-FR')} € économisés/an`,
    });
  }

  return recommendations;
}
```

**Tests** : `tests/services/budget-service.test.ts`

---

### JOUR 2 : Budget API

#### Fichiers API à créer

**Structure** :
```
app/(advisor)/(backend)/api/advisor/clients/[id]/
├── budget/
│   ├── route.ts (GET, POST, PATCH)
│   └── metrics/
│       └── route.ts (GET)
```

#### 1. GET/POST/PATCH `/api/advisor/clients/[id]/budget`

**Fichier** : `route.ts`

```typescript
import { NextRequest } from 'next/server';
import { requireAuth } from '@/app/_common/lib/auth/require-auth';
import { createErrorResponse, createSuccessResponse } from '@/app/_common/lib/api-helpers';
import { prisma } from '@/app/_common/lib/prisma';
import { clientBudgetSchema } from '@/app/_common/lib/validation-schemas';
import { calculateBudgetMetrics } from '@/app/_common/lib/services/budget-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth();
    
    const budget = await prisma.clientBudget.findUnique({
      where: { clientId: params.id },
    });

    if (!budget) {
      return createSuccessResponse(null);
    }

    return createSuccessResponse(budget);
  } catch (error: any) {
    return createErrorResponse(error.message, error.status || 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth();
    const body = await request.json();
    
    const validated = clientBudgetSchema.parse(body);
    
    const budget = await prisma.clientBudget.create({
      data: {
        clientId: params.id,
        ...validated,
      },
    });

    return createSuccessResponse(budget, 201);
  } catch (error: any) {
    return createErrorResponse(error.message, error.status || 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth();
    const body = await request.json();
    
    const validated = clientBudgetSchema.parse(body);
    
    // Calculer métriques
    const metrics = calculateBudgetMetrics({ clientId: params.id, ...validated } as any);
    
    const budget = await prisma.clientBudget.upsert({
      where: { clientId: params.id },
      create: {
        clientId: params.id,
        ...validated,
        totalRevenue: metrics.revenusAnnuels,
        totalExpenses: metrics.chargesAnnuelles,
        savingsCapacity: metrics.capaciteEpargneAnnuelle,
        savingsRate: metrics.tauxEpargne,
      },
      update: {
        ...validated,
        totalRevenue: metrics.revenusAnnuels,
        totalExpenses: metrics.chargesAnnuelles,
        savingsCapacity: metrics.capaciteEpargneAnnuelle,
        savingsRate: metrics.tauxEpargne,
      },
    });

    return createSuccessResponse(budget);
  } catch (error: any) {
    return createErrorResponse(error.message, error.status || 500);
  }
}
```

#### 2. GET `/api/advisor/clients/[id]/budget/metrics`

**Fichier** : `metrics/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { requireAuth } from '@/app/_common/lib/auth/require-auth';
import { createErrorResponse, createSuccessResponse } from '@/app/_common/lib/api-helpers';
import { prisma } from '@/app/_common/lib/prisma';
import { 
  calculateBudgetMetrics, 
  detectBudgetAnomalies,
  generateBudgetRecommendations 
} from '@/app/_common/lib/services/budget-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth();
    
    const [budget, client] = await Promise.all([
      prisma.clientBudget.findUnique({ where: { clientId: params.id } }),
      prisma.client.findUnique({ 
        where: { id: params.id },
        select: { annualIncome: true, taxBracket: true }
      }),
    ]);

    if (!budget) {
      return createSuccessResponse({ metrics: null, alerts: [], recommendations: [] });
    }

    const metrics = calculateBudgetMetrics(budget as any);
    const alerts = detectBudgetAnomalies(budget as any, metrics);
    const recommendations = generateBudgetRecommendations(
      budget as any, 
      metrics,
      { 
        annualIncome: client?.annualIncome ? Number(client.annualIncome) : undefined,
        taxBracket: client?.taxBracket ? parseInt(client.taxBracket) : undefined
      }
    );

    return createSuccessResponse({ metrics, alerts, recommendations });
  } catch (error: any) {
    return createErrorResponse(error.message, error.status || 500);
  }
}
```

**Tests** : `tests/api/budget.test.ts`

---

### JOURS 3-4 : TabBudget UI

#### Fichier : `app/(advisor)/(frontend)/components/client360/TabBudget.tsx` (CRÉER)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Input } from '@/app/_common/components/ui/Input';
import { Label } from '@/app/_common/components/ui/Label';
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, Edit2, Save 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { ClientBudget } from '@/app/_common/lib/api-types';

interface TabBudgetProps {
  clientId: string;
  onRefresh?: () => void;
}

export default function TabBudget({ clientId, onRefresh }: TabBudgetProps) {
  const [budget, setBudget] = useState<ClientBudget | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadBudget();
  }, [clientId]);

  async function loadBudget() {
    try {
      const [budgetRes, metricsRes] = await Promise.all([
        fetch(`/api/advisor/clients/${clientId}/budget`),
        fetch(`/api/advisor/clients/${clientId}/budget/metrics`),
      ]);
      
      const budgetData = await budgetRes.json();
      const metricsData = await metricsRes.json();
      
      setBudget(budgetData.data);
      setMetrics(metricsData.data);
      setFormData(budgetData.data || {});
    } catch (error) {
      console.error('Erreur chargement budget:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/budget`, {
        method: budget ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error('Erreur sauvegarde');
      
      setEditing(false);
      loadBudget();
      onRefresh?.();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const totalRevenue = metrics?.metrics?.revenusAnnuels || 0;
  const totalExpenses = metrics?.metrics?.chargesAnnuelles || 0;
  const savingsCapacity = metrics?.metrics?.capaciteEpargneAnnuelle || 0;
  const savingsRate = metrics?.metrics?.tauxEpargne || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Budget & Cash-Flow
          </h2>
          <p className="text-gray-600 mt-1">Analyse des revenus et charges</p>
        </div>
        
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); setFormData(budget); }}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Revenus annuels</span>
            </div>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-FR')} €</div>
            <div className="text-xs text-gray-500 mt-1">
              {(totalRevenue / 12).toLocaleString('fr-FR')} € / mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Charges annuelles</span>
            </div>
            <div className="text-2xl font-bold">{totalExpenses.toLocaleString('fr-FR')} €</div>
            <div className="text-xs text-gray-500 mt-1">
              {(totalExpenses / 12).toLocaleString('fr-FR')} € / mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <PiggyBank className="w-4 h-4" />
              <span className="text-sm font-medium">Capacité d'épargne</span>
            </div>
            <div className="text-2xl font-bold">{savingsCapacity.toLocaleString('fr-FR')} €</div>
            <div className="text-xs text-gray-500 mt-1">
              {(savingsCapacity / 12).toLocaleString('fr-FR')} € / mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">Taux d'épargne</div>
            <div className="text-2xl font-bold text-purple-600">{savingsRate} %</div>
            <div className="text-xs text-gray-500 mt-1">
              {savingsRate < 10 ? 'Faible' : savingsRate < 20 ? 'Moyen' : 'Élevé'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques - À implémenter */}
      {/* Formulaires revenus/charges - À implémenter */}
      {/* Analyse automatique - À implémenter */}
    </div>
  );
}
```

**Intégration** : Ajouter dans `app/(advisor)/(frontend)/dashboard/clients/[id]/page.tsx`

---

## ✅ CHECKLIST SEMAINE 1

- [ ] budget-service.ts créé et testé
- [ ] 4 endpoints API fonctionnels
- [ ] TabBudget UI créé
- [ ] KPI Cards affichés
- [ ] Graphiques implémentés
- [ ] Formulaires revenus/charges
- [ ] Mode édition fonctionne
- [ ] Analyse automatique
- [ ] Tests E2E passent
- [ ] Intégré dans Client360

---

## 🚀 NEXT: SEMAINE 2 - Fiscalité

Voir suite dans ce document (JOUR 6-10)
