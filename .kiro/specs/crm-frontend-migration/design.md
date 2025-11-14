# Design Document - Migration Frontend CRM vers alfi-crm

## Overview

Cette migration vise à transférer l'intégralité du frontend du projet CRM/ vers alfi-crm/ en adaptant le code pour utiliser Prisma/Supabase au lieu de MongoDB, **tout en appliquant le design system Bento Grid** pour moderniser l'interface utilisateur. L'objectif est de conserver toutes les fonctionnalités existantes tout en modernisant à la fois l'infrastructure backend et le design frontend.

**Principes directeurs:**
- Préserver Prisma/Supabase intact (pas de modification du schéma)
- Adapter le frontend pour utiliser les modèles Prisma existants
- **Appliquer Bento Grid sur Dashboard, Client360, Calculateurs et Simulateurs**
- Maintenir toutes les fonctionnalités du CRM source
- Éviter les duplications, fusionner intelligemment
- Garantir la compatibilité avec Next.js 14+ et React 18+
- Créer une hiérarchie visuelle claire avec des layouts asymétriques

**Intégration Bento Grid:**
Cette migration intègre directement le design system Bento Grid (spec: bento-grid-migration) pour les 4 zones prioritaires:
1. **Dashboard Principal** - KPIs et widgets en Bento Grid
2. **Client360** - Onglets Overview et Wealth avec layouts asymétriques
3. **Calculateurs** - Templates Chart Hero et Dual Charts
4. **Simulateurs** - Template Timeline pour projections long terme

## Architecture

### Architecture Globale

```
alfi-crm/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (adaptées pour Prisma)
│   │   ├── clients/       # CRUD clients
│   │   ├── prospects/     # Gestion prospects
│   │   ├── patrimoine/    # Gestion actifs/passifs
│   │   ├── portefeuilles/ # Gestion portefeuilles
│   │   ├── calculators/   # Endpoints calculateurs
│   │   ├── simulators/    # Endpoints simulateurs
│   │   ├── documents/     # GED
│   │   ├── dossiers/      # Gestion dossiers
│   │   ├── exports/       # PDF/Excel
│   │   ├── emails/        # Gestion emails
│   │   ├── campagnes/     # Campagnes marketing
│   │   ├── opportunites/  # Opportunités
│   │   ├── pipeline/      # Pipeline commercial
│   │   ├── taches/        # Tâches
│   │   ├── agenda/        # Rendez-vous
│   │   ├── projets/       # Projets
│   │   ├── objectifs/     # Objectifs
│   │   ├── reclamations/  # Réclamations
│   │   ├── conformite/    # Conformité
│   │   ├── analytics/     # Analytics
│   │   ├── team/          # Gestion équipe
│   │   ├── settings/      # Paramètres
│   │   ├── templates/     # Templates
│   │   ├── workflows/     # Workflows
│   │   ├── notifications/ # Notifications
│   │   └── audit/         # Audit logs
│   └── dashboard/         # Pages dashboard
│       ├── page.tsx       # Dashboard principal
│       ├── clients/       # Gestion clients
│       ├── prospects/     # Gestion prospects
│       ├── portefeuilles/ # Gestion portefeuilles (portfolios)
│       ├── dossiers/      # Gestion dossiers
│       ├── calculators/   # Calculateurs
│       ├── simulateurs/   # Simulateurs
│       ├── succession/    # Succession
│       ├── taxes/         # Fiscalité
│       ├── agenda/        # Calendrier
│       ├── taches/        # Tâches (tasks)
│       ├── opportunites/  # Opportunités (opportunities)
│       ├── pipeline/      # Pipeline commercial
│       ├── projets/       # Projets
│       ├── campagnes/     # Campagnes marketing
│       ├── emails/        # Gestion emails
│       ├── communication/ # Centre de communication
│       ├── documents/     # GED
│       ├── exports/       # Centre d'exports
│       ├── reclamations/  # Réclamations
│       ├── conformite/    # Conformité
│       ├── analytics/     # Analytics/Reporting
│       ├── mon-activite/  # Mon activité
│       ├── team/          # Gestion équipe
│       ├── settings/      # Paramètres
│       ├── templates/     # Templates
│       ├── scenarios/     # Scénarios
│       ├── onboarding/    # Onboarding clients
│       ├── management/    # Management/Admin
│       └── ui-showcase/   # Showcase UI
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   ├── dashboard/        # Composants dashboard
│   ├── client/           # Composants client
│   ├── client360/        # Vue client complète
│   ├── clients/          # Liste clients
│   ├── calculators/      # Calculateurs
│   ├── simulators/       # Simulateurs
│   ├── charts/           # Graphiques
│   ├── common/           # Composants partagés
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   ├── tasks/            # Composants tâches
│   ├── notifications/    # Notifications
│   ├── export/           # Export components
│   ├── activity/         # Activité
│   ├── compliance/       # Conformité
│   ├── security/         # Sécurité
│   ├── settings/         # Paramètres
│   ├── superadmin/       # Super admin
│   ├── workflow/         # Workflows
│   ├── onboarding/       # Onboarding
│   ├── management/       # Management
│   ├── monitoring/       # Monitoring
│   ├── mobile/           # Mobile components
│   ├── accessibility/    # Accessibilité
│   └── examples/         # Exemples
├── lib/                  # Utilitaires et services
│   ├── prisma.ts         # Client Prisma (existant)
│   ├── api-client.ts     # Client API
│   ├── auth.js           # Authentification
│   ├── utils.ts          # Utilitaires
│   ├── services/         # Services métier
│   │   ├── client-service.ts
│   │   ├── patrimoine-service.ts
│   │   ├── email-service.ts
│   │   ├── calendar-sync-service.ts
│   │   ├── notification-service.ts
│   │   ├── document-storage-service.ts
│   │   ├── export-service.ts
│   │   ├── pdf-generator.ts
│   │   ├── opportunities-engine.ts
│   │   ├── automation-service.ts
│   │   └── kyc-compliance-service.ts
│   ├── calculators/      # Logique calculateurs
│   │   ├── budget-calculations.ts
│   │   ├── tax-calculations.ts
│   │   ├── patrimoine-calculations.ts
│   │   ├── wealth-calculations.ts
│   │   ├── family-calculations.ts
│   │   ├── objective-calculations.ts
│   │   └── contract-calculations.ts
│   ├── simulators/       # Logique simulateurs
│   ├── validation/       # Schémas de validation Zod
│   ├── security/         # Sécurité
│   │   ├── encryption.ts
│   │   ├── password-policy.ts
│   │   └── rate-limit.ts
│   ├── middleware/       # Middlewares
│   ├── monitoring/       # Monitoring
│   ├── accessibility/    # Accessibilité
│   ├── mobile/           # Mobile utilities
│   ├── dashboard/        # Dashboard utilities
│   ├── design-system/    # Design system
│   ├── database/         # Database utilities
│   ├── models/           # Type definitions
│   ├── utils/            # Utilitaires divers
│   ├── analytics.ts      # Analytics
│   ├── audit-logger.ts   # Audit logs
│   ├── activity.ts       # Activity tracking
│   ├── alerts-generator.ts
│   ├── advanced-kpis.ts
│   ├── cache.ts
│   ├── compliance-handlers.ts
│   ├── document-categories.ts
│   ├── email.ts
│   ├── emailSync.ts
│   ├── gmailParser.ts
│   ├── outlook-sync-service.ts
│   ├── error-handling.ts
│   ├── gdpr.ts
│   ├── kyc-validator.ts
│   ├── management-handlers.ts
│   ├── mifid.ts
│   ├── notifications.ts
│   ├── performance.ts
│   ├── plan-definitions.ts
│   ├── query-client-config.ts
│   ├── quota-manager.ts
│   ├── realtime-appointments.ts
│   ├── restriction-manager.ts
│   ├── store.ts
│   ├── task-handlers.ts
│   ├── tokenCipher.ts
│   ├── workflow-handlers.ts
│   ├── workflows.ts
│   └── yousign.ts
├── hooks/                # React hooks
│   ├── use-api.ts
│   ├── use-client.ts
│   ├── use-toast.ts
│   ├── useAppointments.js
│   ├── useAutoRecalculate.js
│   ├── useClickOutside.js
│   ├── useDashboardData.js
│   ├── useDashboardLayout.js
│   ├── useDebounce.js
│   ├── useDragAndDrop.js
│   ├── useForm.js
│   ├── useIntersectionObserver.js
│   ├── useKeyboardNavigation.js
│   ├── useKeyboardShortcuts.js
│   ├── useLocalStorage.js
│   ├── useMediaQuery.js
│   ├── use-mobile.jsx
│   ├── useMobileLayout.js
│   ├── useMonitoring.js
│   ├── useOptimisticTasks.js
│   ├── usePerformance.js
│   ├── useRealtimeAppointments.js
│   ├── useStore.js
│   ├── useTasks.js
│   └── useWidgetLoader.js
├── styles/               # Styles
│   ├── globals.css
│   ├── accessibility.css
│   ├── colors-wcag.css
│   ├── mobile.css
│   └── premium-theme.css
└── prisma/               # Prisma (intact)
    └── schema.prisma     # Schéma existant
```

### Couches d'Architecture

**1. Couche Présentation (Frontend)**
- Composants React/Next.js
- Pages dashboard
- Formulaires et interactions utilisateur

**2. Couche API (Backend Next.js)**
- API Routes Next.js
- Validation des données (Zod)
- Gestion des erreurs
- Authentification/Autorisation

**3. Couche Service**
- Services métier
- Logique de calcul
- Transformations de données

**4. Couche Données**
- Prisma Client
- Supabase PostgreSQL
- Row Level Security (RLS)

## Bento Grid Integration

### Design System Bento Grid

**Objectif:** Créer un design system moderne avec layouts asymétriques pour améliorer la hiérarchie visuelle

#### Composants Bento de Base

**1. BentoGrid - Container**
```typescript
interface BentoGridProps {
  cols?: { mobile?: number; tablet?: number; desktop?: number }
  rows?: number
  gap?: number
  className?: string
  children: React.ReactNode
}

// Usage
<BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
  {children}
</BentoGrid>
```

**2. BentoCard - Cellule**
```typescript
interface BentoCardProps {
  span?: { cols?: number; rows?: number }
  variant?: 'default' | 'hero' | 'accent' | 'gradient'
  className?: string
  children: React.ReactNode
  hoverable?: boolean
}

// Usage
<BentoCard span={{ cols: 4, rows: 3 }} variant="hero">
  <Chart />
</BentoCard>
```

**3. BentoKPI - KPI Card**
```typescript
interface BentoKPIProps {
  title: string
  value: string | number
  change?: { value: number; trend: 'up' | 'down' }
  icon?: React.ReactNode
  span?: { cols?: number; rows?: number }
}
```

**4. BentoChart - Chart Wrapper**
```typescript
interface BentoChartProps {
  title: string
  chart: React.ReactNode
  span?: { cols?: number; rows?: number }
  variant?: 'hero' | 'default'
}
```

#### Templates Réutilisables

**1. ChartHeroTemplate - Pour calculateurs simples**
```typescript
interface ChartHeroTemplateProps {
  mainChart: React.ReactNode
  kpis: Array<{ title: string; value: string }>
  details?: React.ReactNode
}

// Layout:
// ┌─────────────┬───┐
// │             │ K │
// │   Chart     │ P │
// │   (Hero)    │ I │
// │             │ s │
// ├─────────────┴───┤
// │    Details      │
// └─────────────────┘
```

**2. DualChartsTemplate - Pour calculateurs complexes**
```typescript
interface DualChartsTemplateProps {
  chart1: React.ReactNode
  chart2: React.ReactNode
  kpis: Array<{ title: string; value: string }>
  healthIndicator?: React.ReactNode
}

// Layout:
// ┌─────────────────┐
// │ Health (Hero)   │
// ├────────┬────────┤
// │ Chart1 │ Chart2 │
// ├────────┴────────┤
// │  KPIs (small)   │
// └─────────────────┘
```

**3. TimelineTemplate - Pour simulateurs**
```typescript
interface TimelineTemplateProps {
  timeline: React.ReactNode
  kpis: Array<{ title: string; value: string }>
  feasibility?: React.ReactNode
  recommendations?: React.ReactNode
}

// Layout:
// ┌─────────────────┐
// │ Feasibility     │
// ├─────────┬───────┤
// │         │ KPIs  │
// │Timeline │ (vert)│
// │ (Hero)  │       │
// ├─────────┴───────┤
// │ Recommendations │
// └─────────────────┘
```

### Application du Bento Grid

#### Dashboard Principal

**Avant (CRM):** Grille uniforme 3x2
**Après (alfi-crm):** Bento Grid asymétrique

```typescript
<BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
  {/* KPI Principal - Plus grand */}
  <BentoCard span={{ cols: 2, rows: 2 }} variant="hero">
    <BentoKPI title="Clients Actifs" value={stats.activeClients} />
  </BentoCard>
  
  {/* KPIs secondaires - Plus petits */}
  <BentoCard span={{ cols: 2, rows: 1 }}>
    <BentoKPI title="Nouveaux Clients" value={stats.newClients} />
  </BentoCard>
  
  <BentoCard span={{ cols: 2, rows: 1 }}>
    <BentoKPI title="Rendez-vous" value={stats.appointments} />
  </BentoCard>
  
  {/* Graphique - Moyen */}
  <BentoCard span={{ cols: 4, rows: 2 }} variant="accent">
    <BentoChart title="Évolution CA" chart={<LineChart />} />
  </BentoCard>
</BentoGrid>
```

#### Client360 - Onglet Overview

```typescript
<BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }}>
  {/* Alertes - Full width si présentes */}
  {alerts.length > 0 && (
    <BentoCard span={{ cols: 6, rows: 1 }} variant="gradient">
      <AlertsList alerts={alerts} />
    </BentoCard>
  )}
  
  {/* KPIs Patrimoine */}
  <BentoCard span={{ cols: 2, rows: 1 }}>
    <BentoKPI title="Total Actifs" value={formatCurrency(totalActifs)} />
  </BentoCard>
  
  <BentoCard span={{ cols: 2, rows: 1 }}>
    <BentoKPI title="Total Passifs" value={formatCurrency(totalPassifs)} />
  </BentoCard>
  
  <BentoCard span={{ cols: 2, rows: 1 }} variant="hero">
    <BentoKPI title="Patrimoine Net" value={formatCurrency(netWealth)} />
  </BentoCard>
  
  {/* Graphiques allocation */}
  <BentoCard span={{ cols: 3, rows: 2 }}>
    <BentoChart title="Répartition Actifs" chart={<PieChart />} />
  </BentoCard>
  
  <BentoCard span={{ cols: 3, rows: 2 }}>
    <BentoChart title="Allocation" chart={<BarChart />} />
  </BentoCard>
</BentoGrid>
```

#### Calculateur avec Chart Hero

```typescript
<ChartHeroTemplate
  mainChart={<LineChart data={taxProjection} />}
  kpis={[
    { title: 'Impôt Total', value: formatCurrency(totalTax) },
    { title: 'Taux Effectif', value: `${effectiveRate}%` },
    { title: 'Économie Possible', value: formatCurrency(savings) }
  ]}
  details={<TaxBreakdownTable data={breakdown} />}
/>
```

#### Simulateur avec Timeline

```typescript
<TimelineTemplate
  feasibility={{
    status: 'FEASIBLE',
    message: 'Objectif atteignable avec épargne mensuelle de 2000€'
  }}
  timeline={<RetirementTimeline data={projection} />}
  kpis={[
    { title: 'Capital Final', value: formatCurrency(finalCapital) },
    { title: 'Rente Mensuelle', value: formatCurrency(monthlyPension) },
    { title: 'Taux Remplacement', value: `${replacementRate}%` }
  ]}
  recommendations={<RecommendationsList items={recommendations} />}
/>
```

### Responsive Behavior

**Mobile (< 768px):**
- 1 colonne
- Tous les cards empilés verticalement
- Charts en pleine largeur

**Tablet (768px - 1024px):**
- 4 colonnes
- Layout adapté avec spans réduits
- Charts côte à côte si possible

**Desktop (> 1024px):**
- 6-8 colonnes
- Layout complet asymétrique
- Hiérarchie visuelle maximale

### Performance Considerations

1. **CSS Grid natif** - Pas de JavaScript pour le layout
2. **GPU acceleration** - Transitions avec transform
3. **Lazy loading** - Charts hors viewport chargés à la demande
4. **Single paint cycle** - Tous les cards rendus ensemble

## Components and Interfaces

### 1. Adaptation des Modèles de Données

#### Mapping MongoDB → Prisma

| MongoDB | Prisma | Notes |
|---------|--------|-------|
| `_id: ObjectId` | `id: String @id @default(cuid())` | CUID au lieu d'ObjectId |
| `ref: 'Model'` | Relations Prisma | Relations explicites |
| `timestamps: true` | `createdAt`, `updatedAt` | Champs explicites |
| Embedded documents | Relations ou Json | Selon le cas |
| Arrays | Relations many-to-many | Tables de jonction |

#### Exemple de Conversion

**MongoDB (CRM source):**
```javascript
const clientSchema = new Schema({
  _id: ObjectId,
  firstName: String,
  lastName: String,
  conseiller: { type: ObjectId, ref: 'User' },
  actifs: [{ type: ObjectId, ref: 'Actif' }]
});
```

**Prisma (alfi-crm):**
```prisma
model Client {
  id           String @id @default(cuid())
  firstName    String
  lastName     String
  conseillerId String
  conseiller   User   @relation(fields: [conseillerId], references: [id])
  actifs       ClientActif[]
}
```

### 2. Adaptation des API Routes

#### Pattern de Migration

**Avant (MongoDB):**
```javascript
// CRM/app/api/clients/route.js
import connectDB from '@/lib/db';
import Client from '@/lib/models/Client';

export async function GET(request) {
  await connectDB();
  const clients = await Client.find()
    .populate('conseiller')
    .sort({ createdAt: -1 });
  return Response.json(clients);
}
```

**Après (Prisma):**
```javascript
// alfi-crm/app/api/clients/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clients = await prisma.client.findMany({
    include: {
      conseiller: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return NextResponse.json(clients);
}
```

#### Patterns de Conversion Courants

**1. Find → findMany**
```javascript
// MongoDB
Model.find({ status: 'ACTIVE' })

// Prisma
prisma.model.findMany({ where: { status: 'ACTIVE' } })
```

**2. FindById → findUnique**
```javascript
// MongoDB
Model.findById(id)

// Prisma
prisma.model.findUnique({ where: { id } })
```

**3. Create → create**
```javascript
// MongoDB
Model.create(data)

// Prisma
prisma.model.create({ data })
```

**4. Update → update**
```javascript
// MongoDB
Model.findByIdAndUpdate(id, data, { new: true })

// Prisma
prisma.model.update({ where: { id }, data })
```

**5. Delete → delete**
```javascript
// MongoDB
Model.findByIdAndDelete(id)

// Prisma
prisma.model.delete({ where: { id } })
```

**6. Populate → include**
```javascript
// MongoDB
Model.find().populate('relation')

// Prisma
prisma.model.findMany({ include: { relation: true } })
```

### 3. Services Métier

#### Structure des Services

```typescript
// lib/services/client-service.ts
import { prisma } from '@/lib/prisma';
import { Client, Prisma } from '@prisma/client';

export class ClientService {
  // Récupérer un client avec toutes ses relations
  static async getClientWithDetails(clientId: string) {
    return prisma.client.findUnique({
      where: { id: clientId },
      include: {
        conseiller: true,
        actifs: {
          include: {
            actif: true
          }
        },
        passifs: true,
        contrats: true,
        objectifs: true,
        documents: {
          include: {
            document: true
          }
        }
      }
    });
  }

  // Calculer le patrimoine net
  static async calculateNetWealth(clientId: string) {
    const actifs = await prisma.clientActif.findMany({
      where: { clientId },
      include: { actif: true }
    });
    
    const passifs = await prisma.passif.findMany({
      where: { clientId }
    });

    const totalActifs = actifs.reduce((sum, ca) => 
      sum + (ca.actif.value.toNumber() * ca.ownershipPercentage.toNumber() / 100), 0
    );
    
    const totalPassifs = passifs.reduce((sum, p) => 
      sum + p.remainingAmount.toNumber(), 0
    );

    return {
      totalActifs,
      totalPassifs,
      netWealth: totalActifs - totalPassifs
    };
  }
}
```

### 4. Composants React

#### Stratégie de Gestion des Duplications

**Objectif:** Gérer intelligemment les composants qui existent dans les deux projets

**Règles de Fusion:**

1. **Composants identiques:** Conserver alfi-crm, ignorer CRM
2. **Composants différents:** Analyser et fusionner les fonctionnalités
3. **Composants CRM uniquement:** Copier vers alfi-crm
4. **Composants alfi-crm uniquement:** Conserver

**Processus de Décision:**

```typescript
// Script d'analyse des duplications
interface ComponentAnalysis {
  name: string;
  existsInCRM: boolean;
  existsInAlfi: boolean;
  action: 'keep-alfi' | 'keep-crm' | 'merge' | 'copy';
  reason: string;
}

function analyzeComponent(name: string): ComponentAnalysis {
  const crmPath = `CRM/components/${name}`;
  const alfiPath = `alfi-crm/components/${name}`;
  
  const existsInCRM = fs.existsSync(crmPath);
  const existsInAlfi = fs.existsSync(alfiPath);
  
  if (!existsInCRM && existsInAlfi) {
    return { name, existsInCRM, existsInAlfi, action: 'keep-alfi', reason: 'Only in alfi-crm' };
  }
  
  if (existsInCRM && !existsInAlfi) {
    return { name, existsInCRM, existsInAlfi, action: 'copy', reason: 'Only in CRM, needs migration' };
  }
  
  if (existsInCRM && existsInAlfi) {
    // Comparer les fichiers
    const crmContent = fs.readFileSync(crmPath, 'utf-8');
    const alfiContent = fs.readFileSync(alfiPath, 'utf-8');
    
    if (crmContent === alfiContent) {
      return { name, existsInCRM, existsInAlfi, action: 'keep-alfi', reason: 'Identical files' };
    }
    
    // Vérifier si alfi-crm utilise Prisma
    if (alfiContent.includes('prisma') && !crmContent.includes('prisma')) {
      return { name, existsInCRM, existsInAlfi, action: 'keep-alfi', reason: 'alfi-crm already uses Prisma' };
    }
    
    // Vérifier si CRM a plus de fonctionnalités
    if (crmContent.length > alfiContent.length * 1.5) {
      return { name, existsInCRM, existsInAlfi, action: 'merge', reason: 'CRM has more features' };
    }
    
    return { name, existsInCRM, existsInAlfi, action: 'keep-alfi', reason: 'alfi-crm is more recent' };
  }
  
  return { name, existsInCRM, existsInAlfi, action: 'keep-alfi', reason: 'Default' };
}
```

**Exemples de Fusion:**

```typescript
// Exemple 1: Composant Button existe dans les deux
// alfi-crm/components/ui/Button.tsx - Plus récent, utilise Prisma
// CRM/components/ui/Button.jsx - Ancien, utilise MongoDB
// DÉCISION: Conserver alfi-crm

// Exemple 2: Composant ClientCard existe dans les deux
// alfi-crm/components/clients/ClientCard.tsx - Basique
// CRM/components/clients/ClientCard.jsx - Avec plus de features
// DÉCISION: Fusionner les features CRM dans alfi-crm

// Exemple 3: Composant TaxCalculator existe uniquement dans CRM
// CRM/components/calculators/TaxCalculator.jsx
// DÉCISION: Copier vers alfi-crm et adapter pour Prisma
```

**Documentation des Fusions:**

```markdown
# COMPONENT_MERGES.md

## Composants Fusionnés

### ClientCard
- **Source:** CRM + alfi-crm
- **Action:** Fusion
- **Raison:** CRM avait des features supplémentaires (opportunités, timeline)
- **Changements:**
  - Ajout de l'onglet opportunités depuis CRM
  - Ajout de la timeline depuis CRM
  - Conservation de la structure Prisma d'alfi-crm
  - Adaptation des appels API pour Prisma

### DashboardWidget
- **Source:** alfi-crm uniquement
- **Action:** Conserver alfi-crm
- **Raison:** Déjà optimisé pour Prisma

### TaxCalculator
- **Source:** CRM uniquement
- **Action:** Copier et adapter
- **Raison:** N'existait pas dans alfi-crm
- **Changements:**
  - Conversion TypeScript
  - Adaptation pour Prisma
  - Mise à jour des imports
```

#### Pattern de Migration des Composants

**Avant (CRM):**
```jsx
// CRM/components/clients/ClientCard.jsx
import { useEffect, useState } from 'react';

export default function ClientCard({ clientId }) {
  const [client, setClient] = useState(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then(res => res.json())
      .then(setClient);
  }, [clientId]);

  if (!client) return <div>Loading...</div>;

  return (
    <div>
      <h2>{client.firstName} {client.lastName}</h2>
      <p>Conseiller: {client.conseiller?.firstName}</p>
    </div>
  );
}
```

**Après (alfi-crm) - Avec TypeScript:**
```tsx
// alfi-crm/components/clients/ClientCard.tsx
import { useEffect, useState } from 'react';
import { Client, User } from '@prisma/client';

type ClientWithConseiller = Client & {
  conseiller: User;
};

interface ClientCardProps {
  clientId: string;
}

export default function ClientCard({ clientId }: ClientCardProps) {
  const [client, setClient] = useState<ClientWithConseiller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then(res => res.json())
      .then(data => {
        setClient(data);
        setLoading(false);
      });
  }, [clientId]);

  if (loading) return <div>Loading...</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <div>
      <h2>{client.firstName} {client.lastName}</h2>
      <p>Conseiller: {client.conseiller?.firstName}</p>
    </div>
  );
}
```

### 5. Hooks Personnalisés

#### Hook pour Fetch avec Prisma

```typescript
// hooks/use-client.ts
import { useEffect, useState } from 'react';
import { Client, User } from '@prisma/client';

type ClientWithRelations = Client & {
  conseiller: User;
  actifs: any[];
  passifs: any[];
};

export function useClient(clientId: string) {
  const [client, setClient] = useState<ClientWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clientId) return;

    setLoading(true);
    fetch(`/api/clients/${clientId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch client');
        return res.json();
      })
      .then(data => {
        setClient(data);
        setError(null);
      })
      .catch(err => {
        setError(err);
        setClient(null);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  return { client, loading, error };
}
```

## Data Models

### Modèles Prisma Existants (À Utiliser)

Le schéma Prisma existant dans alfi-crm contient déjà tous les modèles nécessaires:

- **Multi-tenant**: Cabinet, User, SuperAdmin
- **Clients**: Client, FamilyMember
- **Patrimoine**: Actif, Passif, Contrat, ClientActif
- **Documents**: Document, ClientDocument, KYCDocument
- **Objectifs**: Objectif, Projet
- **Opportunités**: Opportunite
- **Tâches**: Tache, RendezVous
- **Communications**: Email, SyncedEmail, Notification
- **Simulations**: Simulation
- **Audit**: AuditLog

**Pas de modification du schéma Prisma nécessaire.**

### Gestion des Types TypeScript

```typescript
// lib/types/client.ts
import { Prisma } from '@prisma/client';

// Type pour un client avec toutes ses relations
export type ClientWithDetails = Prisma.ClientGetPayload<{
  include: {
    conseiller: true;
    conseillerRemplacant: true;
    actifs: {
      include: {
        actif: true;
      };
    };
    passifs: true;
    contrats: true;
    objectifs: true;
    documents: {
      include: {
        document: true;
      };
    };
  };
}>;

// Type pour la liste des clients
export type ClientListItem = Prisma.ClientGetPayload<{
  include: {
    conseiller: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;
```

## Error Handling

### Stratégie de Gestion des Erreurs

#### 1. Erreurs API

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Middleware de gestion d'erreurs
export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Erreurs Prisma spécifiques
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un enregistrement avec ces données existe déjà' },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Enregistrement non trouvé' },
        { status: 404 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Une erreur interne est survenue' },
    { status: 500 }
  );
}
```

#### 2. Erreurs Frontend

```typescript
// components/common/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-semibold">Une erreur est survenue</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### 1. Tests d'Intégration API

**Objectif:** Valider que toutes les routes API fonctionnent avec Prisma

```typescript
// __tests__/api/clients.test.ts
import { prisma } from '@/lib/prisma';
import { GET, POST } from '@/app/api/clients/route';

describe('Clients API', () => {
  beforeEach(async () => {
    // Nettoyer la base de test
    await prisma.client.deleteMany();
  });

  it('should fetch all clients', async () => {
    // Créer des clients de test
    await prisma.client.create({
      data: {
        firstName: 'Jean',
        lastName: 'Dupont',
        cabinetId: 'test-cabinet',
        conseillerId: 'test-user'
      }
    });

    const request = new Request('http://localhost:3000/api/clients');
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].firstName).toBe('Jean');
  });

  it('should verify no MongoDB dependencies remain', async () => {
    // Vérifier qu'aucun import MongoDB n'existe
    const apiFiles = await getAllApiFiles();
    for (const file of apiFiles) {
      const content = await readFile(file);
      expect(content).not.toContain('mongoose');
      expect(content).not.toContain('connectDB');
      expect(content).not.toContain('mongodb');
    }
  });
});
```

### 2. Tests de Composants

**Objectif:** Valider que tous les composants UI fonctionnent correctement

```typescript
// __tests__/components/ClientCard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import ClientCard from '@/components/clients/ClientCard';

global.fetch = jest.fn();

describe('ClientCard', () => {
  it('should display client information', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        firstName: 'Jean',
        lastName: 'Dupont',
        conseiller: { firstName: 'Marie' }
      })
    });

    render(<ClientCard clientId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText(/Marie/)).toBeInTheDocument();
    });
  });

  it('should maintain responsive design', async () => {
    const { container } = render(<ClientCard clientId="1" />);
    expect(container.firstChild).toHaveClass('responsive-class');
  });

  it('should preserve accessibility features', async () => {
    render(<ClientCard clientId="1" />);
    const element = screen.getByRole('article');
    expect(element).toHaveAttribute('aria-label');
  });
});
```

### 3. Tests de Services

**Objectif:** Valider la logique métier et les calculs

```typescript
// __tests__/services/client-service.test.ts
import { ClientService } from '@/lib/services/client-service';
import { prisma } from '@/lib/prisma';

describe('ClientService', () => {
  it('should calculate net wealth correctly', async () => {
    const client = await prisma.client.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        cabinetId: 'test',
        conseillerId: 'test'
      }
    });

    const wealth = await ClientService.calculateNetWealth(client.id);

    expect(wealth).toHaveProperty('totalActifs');
    expect(wealth).toHaveProperty('totalPassifs');
    expect(wealth).toHaveProperty('netWealth');
  });

  it('should preserve all business logic', async () => {
    // Tester que la logique métier n'a pas changé
    const result = await ClientService.someBusinessLogic();
    expect(result).toMatchSnapshot();
  });
});
```

### 4. Tests des Calculateurs et Simulateurs

**Objectif:** Valider que tous les calculs sont préservés

```typescript
// __tests__/calculators/tax-calculator.test.ts
describe('Tax Calculator', () => {
  it('should calculate income tax correctly', () => {
    const result = calculateIncomeTax(50000);
    expect(result).toBeCloseTo(expectedValue, 2);
  });

  it('should save simulation results to Prisma', async () => {
    const simulation = await saveSimulation({
      type: 'TAX',
      clientId: 'test-client',
      data: { income: 50000 }
    });

    const saved = await prisma.simulation.findUnique({
      where: { id: simulation.id }
    });

    expect(saved).toBeDefined();
    expect(saved.type).toBe('TAX');
  });
});
```

### 5. Tests des 3 Interfaces

**Objectif:** Valider le fonctionnement des 3 interfaces distinctes

```typescript
// __tests__/interfaces/superadmin.test.ts
describe('SuperAdmin Interface', () => {
  it('should authenticate superadmin', async () => {
    const session = await signIn('superadmin@test.com', 'password');
    expect(session.user.role).toBe('SUPERADMIN');
  });

  it('should access all cabinets data', async () => {
    const cabinets = await prisma.cabinet.findMany();
    expect(cabinets.length).toBeGreaterThan(0);
  });

  it('should manage quotas', async () => {
    await updateQuotas('cabinet-id', { maxClients: 100 });
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: 'cabinet-id' }
    });
    expect(cabinet.maxClients).toBe(100);
  });
});

// __tests__/interfaces/advisor.test.ts
describe('Advisor Interface', () => {
  it('should authenticate advisor', async () => {
    const session = await signIn('advisor@test.com', 'password');
    expect(session.user.role).toBe('ADVISOR');
  });

  it('should access only cabinet data (RLS)', async () => {
    const clients = await prisma.client.findMany({
      where: { cabinetId: session.user.cabinetId }
    });
    expect(clients.every(c => c.cabinetId === session.user.cabinetId)).toBe(true);
  });

  it('should perform CRUD operations', async () => {
    const client = await createClient({ firstName: 'Test' });
    expect(client.id).toBeDefined();
  });
});

// __tests__/interfaces/client-portal.test.ts
describe('Client Portal Interface', () => {
  it('should authenticate client with portalPassword', async () => {
    const session = await clientSignIn('client@test.com', 'portalPassword');
    expect(session.clientId).toBeDefined();
  });

  it('should access only own data (read-only)', async () => {
    const patrimoine = await getClientPatrimoine(session.clientId);
    expect(patrimoine.clientId).toBe(session.clientId);
  });

  it('should not modify patrimoine data', async () => {
    await expect(
      updateClientPatrimoine(session.clientId, {})
    ).rejects.toThrow('Read-only access');
  });

  it('should isolate client data', async () => {
    const otherClientData = await getClientPatrimoine('other-client-id');
    expect(otherClientData).toBeNull();
  });
});
```

### 6. Tests de Migration

**Objectif:** Valider que la migration est complète et sans perte

```typescript
// __tests__/migration/completeness.test.ts
describe('Migration Completeness', () => {
  it('should have migrated all 223 components', async () => {
    const components = await countComponents('alfi-crm/components');
    expect(components).toBeGreaterThanOrEqual(223);
  });

  it('should have migrated all 79 pages', async () => {
    const pages = await countPages('alfi-crm/app/dashboard');
    expect(pages).toBeGreaterThanOrEqual(79);
  });

  it('should have no MongoDB dependencies', async () => {
    const mongoImports = await findMongoDBImports('alfi-crm');
    expect(mongoImports).toHaveLength(0);
  });

  it('should maintain data integrity', async () => {
    // Comparer les données avant/après migration
    const dataIntegrity = await validateDataIntegrity();
    expect(dataIntegrity.valid).toBe(true);
  });
});
```

### 7. Tests de Performance

**Objectif:** Valider que les performances sont maintenues

```typescript
// __tests__/performance/queries.test.ts
describe('Query Performance', () => {
  it('should load client list in under 500ms', async () => {
    const start = Date.now();
    await prisma.client.findMany({ take: 50 });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should avoid N+1 queries', async () => {
    const queries = await trackQueries(async () => {
      await prisma.client.findMany({
        include: { actifs: true, passifs: true }
      });
    });
    expect(queries.length).toBeLessThan(5);
  });
});
```

## Migration Strategy

### Phase 1: Préparation et Audit (Jour 1)
1. Audit complet du code CRM source (223 composants, 79 pages)
2. Identification des dépendances MongoDB
3. Mapping des modèles MongoDB → Prisma
4. Création de la structure de migration
5. Documentation des fichiers à migrer

**Livrables:**
- Liste complète des fichiers à migrer
- Mapping MongoDB → Prisma documenté
- Plan de fusion pour les fichiers dupliqués

### Phase 2: Création du Design System Bento Grid (Jours 2-3)
1. Créer les composants Bento de base (BentoGrid, BentoCard)
2. Créer les composants spécialisés (BentoKPI, BentoChart)
3. Créer les templates réutilisables (ChartHero, DualCharts, Timeline)
4. Configurer le responsive behavior (mobile, tablet, desktop)
5. Implémenter le dark mode support
6. Tests des composants Bento

**Livrables:**
- Design system Bento Grid complet et testé
- 3 templates prêts à l'emploi
- Documentation des composants Bento

### Phase 3: Migration des Composants UI (Jours 4-6)
1. Copie des 223 composants de CRM/components/ vers alfi-crm/components/
2. Identification et fusion des composants dupliqués
3. Mise à jour des imports et chemins
4. Migration des styles et thèmes (CSS, Tailwind)
5. Tests visuels et validation responsive
6. Validation des features d'accessibilité

**Livrables:**
- Tous les composants UI migrés
- Styles fusionnés sans conflits
- Documentation des composants fusionnés

### Phase 4: Migration des Hooks et Utilitaires (Jour 7)
1. Copie de CRM/hooks/ vers alfi-crm/hooks/
2. Copie de CRM/lib/ vers alfi-crm/lib/
3. Fusion des hooks dupliqués
4. Adaptation des utilitaires pour Prisma
5. Mise à jour des imports de base de données
6. Tests unitaires des hooks

**Livrables:**
- Tous les hooks migrés et fonctionnels
- Utilitaires adaptés à Prisma
- Business logic préservée

### Phase 5: Migration des API Routes (Jours 8-10)
1. Copie de CRM/app/api/ vers alfi-crm/app/api/
2. Remplacement de connectDB() par Prisma client
3. Conversion des modèles Mongoose vers Prisma
4. Adaptation des queries (find → findMany, populate → include)
5. Préservation de l'authentification et autorisation
6. Tests d'intégration API
7. Validation des endpoints

**Livrables:**
- Toutes les routes API converties
- Tests d'intégration passants
- Documentation des changements API

### Phase 6: Migration des Pages Dashboard avec Bento Grid (Jours 11-14)
1. Migration du Dashboard Principal avec Bento Grid (6 KPIs en layout asymétrique)
2. Migration du Client360 - Onglet Overview avec Bento Grid
3. Migration du Client360 - Onglet Wealth avec Chart Hero
4. Migration des autres onglets Client360 (Profile, KYC, Documents, Objectives, Opportunities, Timeline)
5. Copie des autres pages dashboard (79 pages)
6. Mise à jour des appels API pour utiliser Prisma endpoints
7. Tests fonctionnels de chaque page
8. Validation UX et navigation

**Livrables:**
- Dashboard principal avec Bento Grid moderne
- Client360 complet avec layouts asymétriques
- Toutes les pages dashboard migrées
- Navigation fluide entre les pages

### Phase 7: Migration des Calculateurs avec Bento Grid (Jours 15-17)
1. Migration des calculateurs simples avec template Chart Hero (IR, IFI, plus-values, succession, donation)
2. Migration des calculateurs complexes avec template Dual Charts (BudgetAnalyzer, DebtCapacity)
3. Migration des simulateurs avec template Timeline (retraite, succession, investissement)
4. Application du layout Bento Grid sur tous les calculateurs/simulateurs
5. Adaptation du stockage des résultats avec Prisma
6. Préservation de toute la logique de calcul
7. Tests de calcul et validation des résultats
8. Tests responsive sur mobile/tablet
9. Intégration avec le système de sauvegarde

**Livrables:**
- Tous les calculateurs avec design Bento Grid moderne
- Tous les simulateurs avec visualisations immersives
- Templates réutilisables pour futurs calculateurs
- Résultats sauvegardés correctement dans Prisma

### Phase 8: Migration de l'Interface SuperAdmin (Jours 18-19)
1. Copie de CRM/app/superadmin/ vers alfi-crm/app/superadmin/
2. Copie de CRM/components/superadmin/ vers alfi-crm/components/superadmin/
3. Adaptation des API SuperAdmin pour Prisma
4. Migration du dashboard avec métriques
5. Migration de la gestion des cabinets
6. Migration de la gestion des quotas et plans
7. Migration des logs d'audit
8. Tests de l'interface SuperAdmin
9. Validation de l'isolation multi-tenant

**Livrables:**
- Interface SuperAdmin complète
- Gestion multi-tenant fonctionnelle
- Métriques et audit logs opérationnels

### Phase 9: Migration de l'Interface Client (Portail Client) (Jours 20-21)
1. Copie de CRM/app/client/ vers alfi-crm/app/client/
2. Migration des 7 sections (dashboard, patrimoine, objectifs, documents, rendez-vous, messages, profil)
3. Adaptation de l'authentification client (portalAccess, portalPassword)
4. Implémentation des permissions read-only
5. Tests de l'interface client
6. Validation de l'isolation des données client

**Livrables:**
- Portail client complet
- Authentification client séparée
- Accès read-only sécurisé

### Phase 10: Migration des Fonctionnalités Transversales (Jours 22-23)
1. Migration du système de notifications
2. Migration de la gestion des documents (GED)
3. Migration des fonctionnalités d'export (PDF, Excel)
4. Migration de l'authentification et sessions
5. Tests des fonctionnalités transversales

**Livrables:**
- Notifications fonctionnelles
- GED opérationnelle
- Exports PDF/Excel fonctionnels
- Authentification sécurisée

### Phase 11: Tests, Validation et Documentation (Jours 24-27)
1. Tests end-to-end des 3 interfaces (SuperAdmin, Conseiller, Client)
2. Tests responsive Bento Grid (mobile, tablet, desktop)
3. Tests d'accessibilité (WCAG 2.1 AA)
4. Tests de performance (FCP < 1.5s, CLS < 0.1)
5. Validation CRUD sur toutes les entités
6. Tests de performance et optimisation
7. Validation de l'intégrité des données
8. Vérification de l'absence de dépendances MongoDB
9. Corrections de bugs
10. Documentation complète de la migration
11. Documentation des changements API
12. Documentation du design system Bento Grid
13. Guide de rollback

**Livrables:**
- Toutes les interfaces testées et validées
- Bento Grid fonctionnel sur tous les devices
- Performance optimale (< 3s TTI)
- Documentation complète (migration + Bento Grid)
- Guide de migration
- Instructions de rollback

## Configuration Management

### 1. Package.json Merging Strategy

**Objectif:** Fusionner les dépendances sans conflits

```typescript
// Script de fusion automatique
import { readFileSync, writeFileSync } from 'fs';

function mergePackageJson() {
  const crmPkg = JSON.parse(readFileSync('CRM/package.json', 'utf-8'));
  const alfiPkg = JSON.parse(readFileSync('alfi-crm/package.json', 'utf-8'));

  // Fusionner les dépendances
  const mergedDeps = {
    ...crmPkg.dependencies,
    ...alfiPkg.dependencies // alfi-crm prend la priorité
  };

  // Fusionner les devDependencies
  const mergedDevDeps = {
    ...crmPkg.devDependencies,
    ...alfiPkg.devDependencies
  };

  // Créer le package.json fusionné
  const merged = {
    ...alfiPkg,
    dependencies: mergedDeps,
    devDependencies: mergedDevDeps,
    scripts: {
      ...crmPkg.scripts,
      ...alfiPkg.scripts // alfi-crm prend la priorité
    }
  };

  writeFileSync('alfi-crm/package.json', JSON.stringify(merged, null, 2));
}
```

**Règles de Fusion:**
- alfi-crm dependencies prennent la priorité (Prisma, Supabase)
- Supprimer les dépendances MongoDB (mongoose, mongodb)
- Conserver les dépendances UI communes (React, Next.js, Tailwind)
- Fusionner les scripts sans duplication

**Dépendances à Supprimer:**
```json
{
  "dependencies": {
    "mongoose": "^X.X.X",  // SUPPRIMER
    "mongodb": "^X.X.X"    // SUPPRIMER
  }
}
```

**Dépendances à Conserver:**
```json
{
  "dependencies": {
    "@prisma/client": "^5.x.x",      // GARDER (alfi-crm)
    "@supabase/supabase-js": "^2.x", // GARDER (alfi-crm)
    "next": "^14.x.x",               // GARDER (version la plus récente)
    "react": "^18.x.x",              // GARDER
    "recharts": "^2.x.x",            // GARDER (graphiques)
    "zod": "^3.x.x",                 // GARDER (validation)
    "next-auth": "^4.x.x"            // GARDER (auth)
  }
}
```

### 2. Next.js Configuration

**Objectif:** Fusionner les configurations Next.js

```javascript
// next.config.js - Configuration fusionnée
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration alfi-crm (base)
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuration CRM (à fusionner)
  images: {
    domains: ['localhost', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Webpack config (si nécessaire)
  webpack: (config, { isServer }) => {
    // Configurations personnalisées
    return config;
  },
};

module.exports = nextConfig;
```

### 3. TypeScript Configuration

**Objectif:** Maintenir la configuration TypeScript stricte

```json
// tsconfig.json - Conserver alfi-crm config
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4. ESLint Configuration

**Objectif:** Fusionner les règles ESLint

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    // Règles communes
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn",
    
    // Règles spécifiques à la migration
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### 5. Environment Variables

**Objectif:** Fusionner les variables d'environnement

```bash
# .env.example - Variables fusionnées

# Database (Prisma/Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ALFI CRM"

# Email (si utilisé)
SMTP_HOST="..."
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."

# Storage (si utilisé)
STORAGE_BUCKET="..."

# SUPPRIMER - Variables MongoDB (ne pas migrer)
# MONGODB_URI="..."  # NE PAS INCLURE
```

### 6. Tailwind Configuration

**Objectif:** Fusionner les configurations Tailwind

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Fusionner les couleurs personnalisées
      colors: {
        // Couleurs alfi-crm
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Couleurs CRM (si différentes)
        // ...
      },
      // Fusionner les animations
      keyframes: {
        // Animations alfi-crm + CRM
      },
      animation: {
        // Animations alfi-crm + CRM
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 7. Prisma Configuration

**Objectif:** Conserver la configuration Prisma intacte

```prisma
// prisma/schema.prisma - NE PAS MODIFIER
// Le schéma Prisma existant doit rester intact
// Toutes les adaptations se font au niveau du code

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Modèles existants - NE PAS MODIFIER
model Client {
  // ...
}
```

## Performance Considerations

### 1. Optimisation des Queries Prisma

```typescript
// Mauvais: N+1 queries
const clients = await prisma.client.findMany();
for (const client of clients) {
  const actifs = await prisma.clientActif.findMany({
    where: { clientId: client.id }
  });
}

// Bon: Single query avec include
const clients = await prisma.client.findMany({
  include: {
    actifs: {
      include: {
        actif: true
      }
    }
  }
});
```

### 2. Pagination

```typescript
// Pagination efficace
const page = 1;
const pageSize = 20;

const [clients, total] = await Promise.all([
  prisma.client.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { conseiller: true }
  }),
  prisma.client.count()
]);
```

### 3. Caching

```typescript
// Utiliser React Query pour le caching
import { useQuery } from '@tanstack/react-query';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      return res.json();
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

## Security Considerations

### 1. Row Level Security (RLS)

Supabase RLS est déjà configuré. S'assurer que toutes les queries incluent le `cabinetId`:

```typescript
// Toujours filtrer par cabinetId
const clients = await prisma.client.findMany({
  where: {
    cabinetId: session.user.cabinetId
  }
});
```

### 2. Validation des Données

```typescript
import { z } from 'zod';

const clientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = clientSchema.parse(body);
  
  const client = await prisma.client.create({
    data: validated
  });
  
  return NextResponse.json(client);
}
```

### 3. Authentification

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    );
  }
  
  // Continuer avec la requête...
}
```


## Les 3 Interfaces du CRM

### 1. Interface SuperAdmin (`/superadmin`)

**Rôle:** Gestion multi-tenant de la plateforme

**Fonctionnalités:**
- Dashboard avec métriques globales (nombre de cabinets, utilisateurs, revenus)
- Liste et gestion des cabinets (organisations)
- Gestion des plans d'abonnement (TRIAL, STARTER, BUSINESS, PREMIUM, ENTERPRISE)
- Gestion des quotas par cabinet
- Gestion des statuts (ACTIVE, RESTRICTED, SUSPENDED, TERMINATED)
- Gestion des features activées par cabinet
- Logs d'audit complets
- Création de nouveaux cabinets
- Création d'utilisateurs SuperAdmin

**Composants principaux:**
- `SuperAdminDashboard` - Dashboard principal
- `CreateOrganizationModal` - Création de cabinets
- `CreateUserModal` - Création d'utilisateurs
- `QuotaEditor` - Éditeur de quotas
- `OrganizationSettingsModal` - Paramètres cabinet
- `AuditLogViewer` - Visualisation des logs

**Routes API:**
```typescript
GET  /api/superadmin/metrics                          // Métriques globales
GET  /api/superadmin/organizations                    // Liste cabinets
POST /api/superadmin/organizations/create             // Créer cabinet
GET  /api/superadmin/organizations/[id]               // Détails cabinet
PUT  /api/superadmin/organizations/[id]               // Modifier cabinet
GET  /api/superadmin/organizations/[id]/quotas        // Quotas cabinet
PUT  /api/superadmin/organizations/[id]/quotas        // Modifier quotas
PUT  /api/superadmin/organizations/[id]/plan          // Modifier plan
PUT  /api/superadmin/organizations/[id]/status        // Modifier statut
PUT  /api/superadmin/organizations/[id]/features      // Modifier features
GET  /api/superadmin/organizations/[id]/audit         // Logs d'audit
POST /api/superadmin/users/create                     // Créer SuperAdmin
```

**Adaptation Prisma:**
```typescript
// Utilise les modèles Prisma existants
- SuperAdmin (table super_admins)
- Cabinet (table cabinets)
- AuditLog (table audit_logs)
- User (table users)
```

### 2. Interface Cabinet/Conseiller (`/dashboard`)

**Rôle:** Interface principale du CRM pour les conseillers

**Fonctionnalités:**
- Dashboard avec KPIs et widgets
- Gestion complète des clients (CRUD, Client360)
- Gestion du patrimoine (actifs, passifs, contrats)
- Calculateurs fiscaux (IR, IFI, plus-values, succession, donation)
- Simulateurs (retraite, succession, investissement)
- Gestion des objectifs et projets
- Détection et suivi des opportunités
- Agenda et rendez-vous
- Gestion des tâches
- GED (Gestion Électronique de Documents)
- Exports PDF/Excel
- Notifications
- Messagerie

**Utilisateurs:**
- ADMIN (administrateur du cabinet)
- ADVISOR (conseiller)
- ASSISTANT (assistant)

**Composants principaux:**
- Tous les composants dashboard existants
- Client360 avec 7 onglets
- Calculateurs et simulateurs
- Composants de gestion

**Routes API:**
```typescript
// Toutes les routes /api/* sauf /api/superadmin et /api/client
GET  /api/clients
POST /api/clients
GET  /api/clients/[id]
PUT  /api/clients/[id]
DELETE /api/clients/[id]
// ... et toutes les autres routes métier
```

**Adaptation Prisma:**
```typescript
// Utilise tous les modèles métier Prisma
- Client, User, Cabinet
- Actif, Passif, Contrat
- Objectif, Projet, Opportunite
- Tache, RendezVous
- Document, Email, Notification
- Simulation
```

### 3. Interface Client (`/client`)

**Rôle:** Portail client pour consultation et interaction

**Fonctionnalités:**
- Dashboard client avec vue d'ensemble
- Consultation du patrimoine (lecture seule)
- Suivi des objectifs
- Accès aux documents partagés
- Consultation des rendez-vous
- Messagerie avec le conseiller
- Gestion du profil

**Pages:**
```
/client/login          - Connexion client
/client/dashboard      - Dashboard client
/client/patrimoine     - Consultation patrimoine
/client/objectifs      - Suivi objectifs
/client/documents      - Documents partagés
/client/rendez-vous    - Rendez-vous planifiés
/client/messages       - Messagerie
/client/profil         - Profil et paramètres
```

**Authentification:**
```typescript
// Utilise les champs Prisma Client
- portalAccess: Boolean    // Accès au portail activé
- portalPassword: String   // Mot de passe portail
- lastPortalLogin: DateTime // Dernière connexion
```

**Routes API:**
```typescript
POST /api/client/auth                    // Authentification client
GET  /api/client/dashboard               // Données dashboard
GET  /api/client/patrimoine              // Patrimoine (read-only)
GET  /api/client/objectifs               // Objectifs
GET  /api/client/documents               // Documents partagés
GET  /api/client/rendez-vous             // Rendez-vous
GET  /api/client/messages                // Messages
POST /api/client/messages                // Envoyer message
GET  /api/client/profil                  // Profil
PUT  /api/client/profil                  // Modifier profil
```

**Permissions Client:**
- Accès READ-ONLY aux données
- Ne peut voir que ses propres données
- Ne peut pas modifier patrimoine, objectifs (gérés par conseiller)
- Peut modifier son profil et envoyer des messages
- Isolation stricte : un client ne voit jamais les données d'autres clients

**Adaptation Prisma:**
```typescript
// Middleware de sécurité pour toutes les routes /api/client/*
export async function clientAuthMiddleware(request: NextRequest) {
  const session = await getClientSession(request);
  
  if (!session || !session.clientId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  
  // Vérifier portalAccess
  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: { portalAccess: true, cabinetId: true }
  });
  
  if (!client || !client.portalAccess) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  
  // Ajouter clientId et cabinetId au contexte
  request.clientId = session.clientId;
  request.cabinetId = client.cabinetId;
  
  return null; // Continue
}

// Exemple de route client
export async function GET(request: NextRequest) {
  const authError = await clientAuthMiddleware(request);
  if (authError) return authError;
  
  // Récupérer uniquement les données du client connecté
  const patrimoine = await prisma.client.findUnique({
    where: { id: request.clientId },
    include: {
      actifs: {
        include: { actif: true }
      },
      passifs: true,
      contrats: true
    }
  });
  
  return NextResponse.json(patrimoine);
}
```

## Documentation Strategy

### 1. Documentation de Migration

**Objectif:** Fournir une documentation complète pour comprendre et maintenir la migration

#### Fichiers de Documentation à Créer

```
alfi-crm/docs/migration/
├── MIGRATION_GUIDE.md           # Guide principal de migration
├── API_CHANGES.md               # Changements d'API MongoDB → Prisma
├── COMPONENT_MAPPING.md         # Mapping des composants migrés
├── BREAKING_CHANGES.md          # Changements cassants
├── ROLLBACK_GUIDE.md            # Instructions de rollback
├── FILE_CHANGES.md              # Liste de tous les fichiers modifiés
└── TESTING_GUIDE.md             # Guide de test post-migration
```

#### Contenu de MIGRATION_GUIDE.md

```markdown
# Guide de Migration CRM → alfi-crm

## Vue d'ensemble
- Nombre de fichiers migrés: 223 composants + 79 pages
- Changement principal: MongoDB/Mongoose → Prisma/Supabase
- Durée estimée: 22 jours

## Changements Majeurs
1. Base de données: MongoDB → PostgreSQL (Supabase)
2. ORM: Mongoose → Prisma
3. Identifiants: ObjectId → CUID
4. Relations: Embedded documents → Relations Prisma

## Structure des Fichiers
[Détails de la structure]

## Commandes de Migration
[Commandes à exécuter]
```

#### Contenu de API_CHANGES.md

```markdown
# Changements d'API

## Patterns de Conversion

### Queries
| MongoDB | Prisma | Notes |
|---------|--------|-------|
| Model.find() | prisma.model.findMany() | |
| Model.findById(id) | prisma.model.findUnique({ where: { id } }) | |
| Model.findOne() | prisma.model.findFirst() | |
| Model.create() | prisma.model.create({ data }) | |
| Model.findByIdAndUpdate() | prisma.model.update({ where, data }) | |
| Model.findByIdAndDelete() | prisma.model.delete({ where }) | |
| .populate() | include: { relation: true } | |
| .sort() | orderBy: { field: 'asc' } | |

### Exemples Détaillés
[Exemples de conversion avec code avant/après]
```

#### Contenu de BREAKING_CHANGES.md

```markdown
# Changements Cassants

## 1. Identifiants
- **Avant:** ObjectId (24 caractères hexadécimaux)
- **Après:** CUID (25 caractères alphanumériques)
- **Impact:** Tous les liens et références doivent être mis à jour

## 2. Relations
- **Avant:** Embedded documents et références
- **Après:** Relations Prisma explicites
- **Impact:** Structure de données modifiée

## 3. Timestamps
- **Avant:** timestamps: true (automatique)
- **Après:** createdAt, updatedAt (explicites)
- **Impact:** Champs explicites dans le schéma

## 4. Connexion Base de Données
- **Avant:** connectDB() avec Mongoose
- **Après:** Prisma Client (singleton)
- **Impact:** Suppression de tous les appels connectDB()
```

#### Contenu de ROLLBACK_GUIDE.md

```markdown
# Guide de Rollback

## Prérequis
- Backup de la base MongoDB
- Backup du code CRM source
- Liste des changements effectués

## Étapes de Rollback

### 1. Restaurer le Code
```bash
git checkout <commit-before-migration>
```

### 2. Restaurer la Base de Données
```bash
mongorestore --uri="mongodb://..." --drop backup/
```

### 3. Vérifier l'Environnement
- Vérifier les variables d'environnement
- Tester les connexions
- Valider les fonctionnalités critiques

### 4. Redémarrer les Services
```bash
npm run dev
```

## Points de Vérification
- [ ] Code restauré
- [ ] Base de données restaurée
- [ ] Connexions fonctionnelles
- [ ] Authentification OK
- [ ] CRUD clients OK
```

### 2. Documentation Inline

**Objectif:** Documenter les changements directement dans le code

```typescript
/**
 * MIGRATION NOTE: Converted from MongoDB to Prisma
 * 
 * Before (MongoDB):
 * const clients = await Client.find().populate('conseiller');
 * 
 * After (Prisma):
 * const clients = await prisma.client.findMany({
 *   include: { conseiller: true }
 * });
 * 
 * Changes:
 * - Replaced Model.find() with prisma.model.findMany()
 * - Replaced .populate() with include option
 * - Removed connectDB() call
 */
export async function GET(request: NextRequest) {
  const clients = await prisma.client.findMany({
    include: { conseiller: true }
  });
  return NextResponse.json(clients);
}
```

### 3. Changelog

**Objectif:** Maintenir un changelog détaillé de la migration

```markdown
# CHANGELOG - Migration CRM → alfi-crm

## [2.0.0] - Migration Prisma

### Added
- 223 composants UI migrés
- 79 pages dashboard migrées
- Support Prisma/Supabase
- Interface SuperAdmin complète
- Portail Client complet
- Documentation de migration

### Changed
- Base de données: MongoDB → PostgreSQL
- ORM: Mongoose → Prisma
- Identifiants: ObjectId → CUID
- Toutes les routes API adaptées pour Prisma

### Removed
- Dépendances MongoDB/Mongoose
- Appels connectDB()
- Modèles Mongoose

### Migration Notes
- Voir MIGRATION_GUIDE.md pour les détails
- Voir API_CHANGES.md pour les changements d'API
- Voir BREAKING_CHANGES.md pour les changements cassants
```

## Flux d'Authentification des 3 Interfaces

### 1. SuperAdmin
```typescript
// Login: /superadmin/login
// Session: NextAuth avec role === 'SUPERADMIN'
// Modèle: SuperAdmin (table super_admins)
// Accès: Toutes les données de tous les cabinets
```

### 2. Cabinet/Conseiller
```typescript
// Login: /login
// Session: NextAuth avec User model
// Modèle: User (table users) avec cabinetId
// Accès: Données du cabinet uniquement (RLS)
```

### 3. Client
```typescript
// Login: /client/login
// Session: Custom session avec clientId
// Modèle: Client (table clients) avec portalAccess
// Accès: Données personnelles uniquement (read-only)
```

## Validation and Quality Assurance

### 1. Checklist de Validation Post-Migration

**Objectif:** S'assurer que la migration est complète et fonctionnelle

#### Validation des Fichiers

```markdown
## Checklist Fichiers

### Composants UI
- [ ] 223 composants migrés de CRM/components/
- [ ] Aucun import MongoDB restant
- [ ] Tous les imports mis à jour
- [ ] Structure de répertoires préservée
- [ ] Composants dupliqués fusionnés intelligemment

### Pages Dashboard
- [ ] 79 pages migrées de CRM/app/dashboard/
- [ ] Toutes les routes fonctionnelles
- [ ] Navigation entre pages OK
- [ ] Appels API adaptés pour Prisma

### Hooks et Utilitaires
- [ ] Tous les hooks migrés de CRM/hooks/
- [ ] Tous les utilitaires migrés de CRM/lib/
- [ ] Logique métier préservée
- [ ] Accès base de données via Prisma

### API Routes
- [ ] Toutes les routes migrées de CRM/app/api/
- [ ] connectDB() remplacé par Prisma
- [ ] Modèles Mongoose remplacés par Prisma
- [ ] Authentification préservée
- [ ] Autorisation préservée

### Styles
- [ ] Tous les CSS migrés
- [ ] Tailwind config fusionné
- [ ] Responsive design préservé
- [ ] Accessibilité préservée

### Configuration
- [ ] package.json fusionné sans conflits
- [ ] Dépendances MongoDB supprimées
- [ ] next.config.js fusionné
- [ ] tsconfig.json maintenu
- [ ] .env.example mis à jour
```

#### Validation Fonctionnelle

```markdown
## Checklist Fonctionnalités

### Interface SuperAdmin
- [ ] Connexion SuperAdmin
- [ ] Dashboard avec métriques
- [ ] Liste des cabinets
- [ ] Création de cabinet
- [ ] Modification des quotas
- [ ] Changement de plan
- [ ] Changement de statut
- [ ] Logs d'audit
- [ ] Isolation multi-tenant

### Interface Conseiller
- [ ] Connexion conseiller (ADMIN, ADVISOR, ASSISTANT)
- [ ] Dashboard avec KPIs
- [ ] Liste clients
- [ ] Création client
- [ ] Modification client
- [ ] Suppression client
- [ ] Client360 - Onglet Profile
- [ ] Client360 - Onglet KYC
- [ ] Client360 - Onglet Wealth
- [ ] Client360 - Onglet Documents
- [ ] Client360 - Onglet Objectives
- [ ] Client360 - Onglet Opportunities
- [ ] Client360 - Onglet Timeline
- [ ] Gestion patrimoine (actifs)
- [ ] Gestion patrimoine (passifs)
- [ ] Gestion patrimoine (contrats)
- [ ] Calculateur IR
- [ ] Calculateur IFI
- [ ] Calculateur plus-values
- [ ] Calculateur succession
- [ ] Calculateur donation
- [ ] Simulateur retraite
- [ ] Simulateur succession
- [ ] Simulateur investissement
- [ ] Gestion objectifs
- [ ] Gestion projets
- [ ] Détection opportunités
- [ ] Gestion tâches
- [ ] Gestion rendez-vous
- [ ] GED (upload documents)
- [ ] GED (catégorisation)
- [ ] GED (versioning)
- [ ] Export PDF
- [ ] Export Excel
- [ ] Notifications
- [ ] Messagerie
- [ ] Isolation RLS (ne voit que son cabinet)

### Interface Client (Portail)
- [ ] Connexion client avec portalPassword
- [ ] Vérification portalAccess
- [ ] Dashboard client
- [ ] Consultation patrimoine (read-only)
- [ ] Consultation objectifs (read-only)
- [ ] Consultation documents partagés
- [ ] Consultation rendez-vous
- [ ] Messagerie avec conseiller
- [ ] Modification profil
- [ ] Isolation données (ne voit que ses données)
- [ ] Permissions read-only (modifications rejetées)

### Fonctionnalités Transversales
- [ ] Authentification NextAuth
- [ ] Sessions sécurisées
- [ ] RBAC (Role-Based Access Control)
- [ ] Multi-tenant isolation (RLS)
- [ ] Notifications temps réel
- [ ] Recherche globale
- [ ] Filtres et tri
- [ ] Pagination
- [ ] Responsive design
- [ ] Accessibilité (WCAG)
```

#### Validation Technique

```markdown
## Checklist Technique

### Base de Données
- [ ] Aucune dépendance MongoDB
- [ ] Toutes les queries utilisent Prisma
- [ ] Relations Prisma correctes
- [ ] RLS Supabase fonctionnel
- [ ] Indexes optimisés
- [ ] Migrations Prisma à jour

### Performance
- [ ] Temps de chargement < 3s
- [ ] Pas de N+1 queries
- [ ] Pagination efficace
- [ ] Caching approprié
- [ ] Images optimisées
- [ ] Bundle size raisonnable

### Sécurité
- [ ] Authentification sécurisée
- [ ] Autorisation correcte
- [ ] Validation des entrées (Zod)
- [ ] Protection CSRF
- [ ] Protection XSS
- [ ] Données sensibles chiffrées
- [ ] RLS activé et testé

### Code Quality
- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'erreurs ESLint
- [ ] Tests unitaires passants
- [ ] Tests d'intégration passants
- [ ] Tests E2E passants
- [ ] Code coverage > 70%

### Documentation
- [ ] MIGRATION_GUIDE.md créé
- [ ] API_CHANGES.md créé
- [ ] COMPONENT_MAPPING.md créé
- [ ] BREAKING_CHANGES.md créé
- [ ] ROLLBACK_GUIDE.md créé
- [ ] FILE_CHANGES.md créé
- [ ] TESTING_GUIDE.md créé
- [ ] README.md mis à jour
- [ ] CHANGELOG.md mis à jour
```

### 2. Scripts de Validation Automatique

```typescript
// scripts/validate-migration.ts
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  category: string;
  test: string;
  passed: boolean;
  message: string;
}

const results: ValidationResult[] = [];

// Validation 1: Aucune dépendance MongoDB
async function validateNoMongoDB() {
  const packageJson = JSON.parse(
    fs.readFileSync('package.json', 'utf-8')
  );
  
  const hasMongoDB = 
    packageJson.dependencies?.mongoose ||
    packageJson.dependencies?.mongodb;
  
  results.push({
    category: 'Dependencies',
    test: 'No MongoDB dependencies',
    passed: !hasMongoDB,
    message: hasMongoDB ? 'MongoDB dependencies found' : 'OK'
  });
}

// Validation 2: Tous les fichiers utilisent Prisma
async function validatePrismaUsage() {
  const apiFiles = getAllFiles('app/api');
  let mongoDBImports = 0;
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('mongoose') || content.includes('connectDB')) {
      mongoDBImports++;
    }
  }
  
  results.push({
    category: 'Code',
    test: 'All API routes use Prisma',
    passed: mongoDBImports === 0,
    message: mongoDBImports > 0 
      ? `${mongoDBImports} files still use MongoDB` 
      : 'OK'
  });
}

// Validation 3: Nombre de composants
async function validateComponentCount() {
  const components = getAllFiles('components');
  const count = components.length;
  
  results.push({
    category: 'Files',
    test: 'Component count >= 223',
    passed: count >= 223,
    message: `Found ${count} components`
  });
}

// Validation 4: Nombre de pages
async function validatePageCount() {
  const pages = getAllFiles('app/dashboard');
  const count = pages.length;
  
  results.push({
    category: 'Files',
    test: 'Page count >= 79',
    passed: count >= 79,
    message: `Found ${count} pages`
  });
}

// Validation 5: Connexion Prisma
async function validatePrismaConnection() {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    
    results.push({
      category: 'Database',
      test: 'Prisma connection',
      passed: true,
      message: 'OK'
    });
  } catch (error) {
    results.push({
      category: 'Database',
      test: 'Prisma connection',
      passed: false,
      message: error.message
    });
  }
}

// Exécuter toutes les validations
async function runValidation() {
  console.log('🔍 Running migration validation...\n');
  
  await validateNoMongoDB();
  await validatePrismaUsage();
  await validateComponentCount();
  await validatePageCount();
  await validatePrismaConnection();
  
  // Afficher les résultats
  console.log('📊 Validation Results:\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} [${result.category}] ${result.test}: ${result.message}`);
  });
  
  console.log(`\n📈 Score: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('\n🎉 Migration validation passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Migration validation failed!');
    process.exit(1);
  }
}

runValidation();
```

### 3. Critères d'Acceptation de la Migration

**La migration est considérée comme réussie si:**

1. ✅ Tous les fichiers sont migrés (223 composants + 79 pages)
2. ✅ Aucune dépendance MongoDB ne reste
3. ✅ Toutes les routes API utilisent Prisma
4. ✅ Les 3 interfaces fonctionnent (SuperAdmin, Conseiller, Client)
5. ✅ Tous les tests passent (unitaires, intégration, E2E)
6. ✅ Les performances sont maintenues (< 3s chargement)
7. ✅ La sécurité est préservée (RLS, auth, validation)
8. ✅ La documentation est complète
9. ✅ Le rollback est possible
10. ✅ L'intégrité des données est validée

## Stratégie de Migration des 3 Interfaces

### Ordre de Migration

1. **Interface Cabinet/Conseiller** (Priorité 1)
   - C'est l'interface principale
   - Contient le plus de fonctionnalités
   - Base pour les autres interfaces

2. **Interface SuperAdmin** (Priorité 2)
   - Nécessaire pour la gestion multi-tenant
   - Relativement simple (CRUD cabinets + métriques)
   - Indépendante de l'interface conseiller

3. **Interface Client** (Priorité 3)
   - Dépend de l'interface conseiller (données)
   - Principalement read-only
   - Peut être migrée en dernier

### Tests des 3 Interfaces

**Tests SuperAdmin:**
- Connexion SuperAdmin avec authentification NextAuth
- Création de cabinets avec validation des données
- Modification des quotas (maxClients, maxUsers, maxStorage)
- Changement de plans (TRIAL, STARTER, BUSINESS, PREMIUM, ENTERPRISE)
- Changement de statuts (ACTIVE, RESTRICTED, SUSPENDED, TERMINATED)
- Visualisation des logs d'audit avec filtrage
- Isolation des données entre cabinets (vérification RLS)
- Métriques globales (nombre de cabinets, utilisateurs, revenus)
- Gestion des features activées par cabinet

**Tests Cabinet/Conseiller:**
- Connexion conseiller avec NextAuth (ADMIN, ADVISOR, ASSISTANT)
- CRUD clients avec validation Prisma
- Gestion patrimoine (actifs, passifs, contrats)
- Calculateurs (IR, IFI, plus-values, succession, donation)
- Simulateurs (retraite, succession, investissement)
- Client360 avec 7 onglets fonctionnels
- Exports PDF et Excel
- Gestion des documents (GED)
- Notifications en temps réel
- Isolation multi-tenant (RLS - ne voit que son cabinet)
- Gestion des tâches et rendez-vous
- Détection d'opportunités

**Tests Client (Portail):**
- Connexion client avec portalPassword (authentification séparée)
- Vérification du flag portalAccess
- Consultation patrimoine (read-only, pas de modification)
- Consultation objectifs (read-only)
- Accès documents partagés uniquement
- Consultation rendez-vous
- Messagerie avec le conseiller
- Modification du profil personnel
- Isolation stricte des données (ne voit que ses propres données)
- Vérification qu'aucune donnée d'autres clients n'est accessible
- Validation des permissions read-only (tentatives de modification rejetées)
