# Design Document - CRM Frontend Complet

## Overview

Ce document décrit l'architecture technique du frontend du CRM ALFI. Le système est construit avec Next.js 14 (App Router), TypeScript, Tailwind CSS, et s'intègre avec le backend Prisma/PostgreSQL existant.

**Principes fondamentaux:**
- ✅ Toutes les données proviennent de PostgreSQL via Prisma
- ✅ Aucune donnée mockée ou hardcodée
- ✅ Utilisation des 56 API routes existantes
- ✅ Respect du schéma Prisma (40+ modèles)
- ✅ Sécurité multi-tenant avec RLS

## Architecture

### Stack Technique

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- Radix UI (composants accessibles)
- Recharts (graphiques)
- React Query (cache & state management)
- Framer Motion (animations)

**Backend (existant):**
- Prisma ORM
- PostgreSQL (Supabase)
- Next.js API Routes
- 19 services métier
- 56 routes API

**Sécurité:**
- Row Level Security (RLS) PostgreSQL
- NextAuth.js
- RBAC (Role-Based Access Control)
- Audit logging

### Structure des Dossiers

```
alfi-crm/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── layout.tsx          # Layout avec 2 sidebars
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── clients/
│   │   │   ├── page.tsx        # Liste clients
│   │   │   ├── nouveau/
│   │   │   │   └── page.tsx    # Création client
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Vue 360°
│   │   │       └── client360.tsx
│   │   ├── prospects/
│   │   ├── projets/
│   │   ├── opportunites/
│   │   ├── taches/
│   │   ├── agenda/
│   │   ├── documents/
│   │   ├── calculators/
│   │   ├── simulators/
│   │   └── settings/
│   ├── api/                    # API routes (existantes)
│   └── globals.css
├── components/
│   ├── ui/                     # Composants de base
│   ├── dashboard/              # Composants dashboard
│   ├── client360/              # Composants vue 360°
│   ├── calculators/            # Calculateurs
│   └── simulators/             # Simulateurs
├── lib/
│   ├── services/               # Services métier (existants)
│   ├── hooks/                  # Custom hooks
│   ├── utils/                  # Utilitaires
│   └── api-client.ts           # Client API
└── prisma/
    ├── schema.prisma           # Schéma (existant)
    └── seed.ts                 # Seed data
```

## Components and Interfaces

### 1. Layout Dashboard

**Fichier:** `app/dashboard/layout.tsx`

**Responsabilités:**
- Afficher 2 sidebars (navigation gauche, services droite)
- Gérer l'état d'expansion des sidebars
- Afficher les compteurs temps réel
- Gérer les raccourcis clavier
- Fournir le contexte utilisateur

**Props:**
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

**État:**
```typescript
const [navExpanded, setNavExpanded] = useState(false);
const [servicesExpanded, setServicesExpanded] = useState(false);
const [counters, setCounters] = useState<Counters | null>(null);
const [user, setUser] = useState<User | null>(null);
```

**API Calls:**
- `GET /api/auth/session` - Session utilisateur
- `GET /api/dashboard/counters` - Compteurs temps réel


### 2. Navigation Sidebar (Gauche)

**Fichier:** `components/dashboard/NavigationSidebar.tsx`

**Structure:**
```typescript
interface NavigationSection {
  id: string;
  title: string;
  color: string;
  items: NavigationItem[];
}

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: {
    value: number;
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
  subItems?: NavigationSubItem[];
}
```

**Sections:**
1. Pilotage (Dashboard, Mon activité)
2. Portefeuille (Clients, Prospects, Dossiers)
3. Commercial (Campagnes, Opportunités)
4. Organisation (Agenda, Tâches, Emails)
5. Outils (Simulateurs, Portefeuilles)
6. Conformité (KYC, Réclamations, Documents)

**API Calls:**
- Compteurs intégrés depuis le layout parent

### 3. Services Sidebar (Droite)

**Fichier:** `components/dashboard/ServicesSidebar.tsx`

**Responsabilités:**
- Afficher les services contextuels
- Actions rapides selon la page active
- Statistiques des services

**Props:**
```typescript
interface ServicesSidebarProps {
  contextualAction?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
  stats: ServiceStats;
}

interface ServiceStats {
  actionsCRM: number;
  documents: number;
  conformiteAlerts: number;
  suggestions: number;
  reclamations: number;
}
```

### 4. Page Liste Clients

**Fichier:** `app/dashboard/clients/page.tsx`

**Responsabilités:**
- Afficher la liste paginée des clients
- Filtrer par type, statut, conseiller
- Recherche par nom, email
- Actions: Créer, Exporter, Filtrer

**État:**
```typescript
const [clients, setClients] = useState<Client[]>([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  type: 'ALL', // ALL | PARTICULIER | PROFESSIONNEL
  status: 'ALL', // ALL | PROSPECT | ACTIVE | INACTIVE
  conseillerId: null,
  search: ''
});
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0
});
```

**API Calls:**
```typescript
// Charger les clients
GET /api/clients?page=1&limit=20&type=PARTICULIER&status=ACTIVE&search=dupont

Response: {
  clients: Client[],
  pagination: { page, limit, total, totalPages }
}
```

**Composants:**
- `ClientCard` - Carte client avec infos clés
- `ClientFilters` - Filtres et recherche
- `ClientTable` - Tableau responsive
- `CreateClientModal` - Modal création

### 5. Modal Création Client

**Fichier:** `components/clients/CreateClientModal.tsx`

**Étapes:**
1. Sélection type (Particulier / Professionnel)
2. Formulaire adapté au type
3. Validation et création

**Formulaire Particulier:**
```typescript
interface ParticulierForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: Date;
  maritalStatus?: MaritalStatus;
  profession?: string;
  annualIncome?: number;
}
```

**Formulaire Professionnel:**
```typescript
interface ProfessionnelForm extends ParticulierForm {
  companyName: string;
  siret: string;
  legalForm: string;
  activitySector: string;
  numberOfEmployees?: number;
  annualRevenue?: number;
}
```

**API Calls:**
```typescript
// Créer un client
POST /api/clients
Body: {
  clientType: 'PARTICULIER' | 'PROFESSIONNEL',
  ...formData
}

Response: {
  client: Client
}
```

### 6. Vue Client 360°

**Fichier:** `app/dashboard/clients/[id]/page.tsx`

**Responsabilités:**
- Afficher toutes les informations du client
- Navigation par onglets
- Actions contextuelles

**État:**
```typescript
const [client, setClient] = useState<Client | null>(null);
const [activeTab, setActiveTab] = useState('overview');
const [loading, setLoading] = useState(true);
```

**API Calls:**
```typescript
// Charger le client enrichi
GET /api/clients/[id]?include=family,actifs,passifs,contrats,objectifs,documents,kyc

Response: {
  client: Client,
  family: FamilyMember[],
  actifs: Actif[],
  passifs: Passif[],
  contrats: Contrat[],
  objectifs: Objectif[],
  documents: Document[],
  kyc: KYCData,
  timeline: TimelineEvent[]
}
```

**Onglets:**
1. Vue d'ensemble (`TabOverview`)
2. Profil & Famille (`TabProfile`)
3. Patrimoine (`TabWealth`)
4. Objectifs & Projets (`TabObjectives`)
5. Opportunités (`TabOpportunities`)
6. Activité & Historique (`TabTimeline`)
7. Documents (`TabDocuments`)
8. Reporting (`TabReporting`)
9. Conformité & KYC (`TabKYC`)
10. Paramètres (`TabSettings`)

### 7. Onglet Vue d'ensemble

**Fichier:** `components/client360/TabOverview.tsx`

**Sections:**
- KPIs (Patrimoine net, géré, score KYC)
- Graphiques (Allocation, Évolution)
- Alertes prioritaires
- Timeline récente

**API Calls:**
- Données du client parent (pas d'appel supplémentaire)

**Graphiques:**
```typescript
// Pie Chart - Allocation patrimoine
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={[
        { name: 'Immobilier', value: 600000 },
        { name: 'Financier', value: 300000 },
        { name: 'Professionnel', value: 100000 }
      ]}
      dataKey="value"
      nameKey="name"
    />
  </PieChart>
</ResponsiveContainer>

// Line Chart - Évolution patrimoine
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={patrimoineHistory}>
    <Line type="monotone" dataKey="value" stroke="#0047AB" />
    <XAxis dataKey="date" />
    <YAxis />
  </LineChart>
</ResponsiveContainer>
```

### 8. Onglet Documents (GED)

**Fichier:** `components/client360/TabDocuments.tsx`

**Responsabilités:**
- Afficher score de complétude
- Catégoriser les documents
- Upload drag & drop
- Versioning
- Signature électronique
- Liens GED externe

**État:**
```typescript
const [documents, setDocuments] = useState<Document[]>([]);
const [completeness, setCompleteness] = useState<CompletenessScore | null>(null);
const [activeCategory, setActiveCategory] = useState('ENTREE_RELATION');
const [uploading, setUploading] = useState(false);
```

**API Calls:**
```typescript
// Charger les documents
GET /api/clients/[id]/documents

Response: {
  documents: Document[],
  completeness: {
    score: 75,
    status: 'GOOD',
    completed: 8,
    totalRequired: 10,
    missing: 2,
    expiringDocs: Document[],
    missingDocs: DocumentType[]
  }
}

// Upload document
POST /api/clients/[id]/documents
Body: FormData {
  file: File,
  type: DocumentType,
  name: string,
  description?: string
}

Response: {
  document: Document
}
```

**Catégories:**
- Entrée en relation
- Identité
- Fiscal
- Patrimoine
- Réglementaire
- Commercial
- Autre

### 9. Onglet KYC & Conformité

**Fichier:** `components/client360/TabKYC.tsx`

**Responsabilités:**
- Afficher statut KYC
- Score de complétion
- Profil MIF II
- LCB-FT (PEP, origine fonds)
- Documents justificatifs
- Formulaire de mise à jour

**État:**
```typescript
const [kyc, setKyc] = useState<KYCData | null>(null);
const [showKYCForm, setShowKYCForm] = useState(false);
const [saving, setSaving] = useState(false);
```

**API Calls:**
```typescript
// Charger KYC
GET /api/clients/[id]/kyc

Response: {
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'EXPIRED',
  completionRate: 85,
  lastUpdateAt: Date,
  nextUpdateDue: Date,
  riskProfile: {
    profile: 'EQUILIBRE',
    investmentHorizon: 'LONG_TERME',
    score: 75
  },
  pepStatus: false,
  originOfFunds: 'SALARY',
  documents: KYCDocument[],
  mifidOverallScore: 78,
  complianceOfficerNotes: string
}

// Mettre à jour KYC
PATCH /api/clients/[id]/kyc
Body: {
  pepStatus: boolean,
  originOfFunds: string,
  riskProfile: string,
  investmentHorizon: string,
  financialKnowledge: string,
  investmentObjectives: string
}

Response: {
  kyc: KYCData
}
```

### 10. Onglet Patrimoine

**Fichier:** `components/client360/TabWealth.tsx`

**Sous-onglets:**
- Actifs
- Passifs
- Contrats
- Synthèse

**API Calls:**
```typescript
// Charger actifs
GET /api/clients/[id]/actifs

Response: {
  actifs: Actif[],
  totalValue: 1000000,
  byCategory: { IMMOBILIER: 600000, FINANCIER: 400000 }
}

// Charger passifs
GET /api/clients/[id]/passifs

Response: {
  passifs: Passif[],
  totalRemaining: 350000,
  monthlyPayments: 2500
}

// Charger contrats
GET /api/clients/[id]/contrats

Response: {
  contrats: Contrat[],
  totalValue: 500000,
  renewalAlerts: Contrat[]
}
```

## Data Models

### Client (Frontend Types)

```typescript
interface Client {
  id: string;
  cabinetId: string;
  clientType: 'PARTICULIER' | 'PROFESSIONNEL';
  
  // Informations de base
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  
  // Particulier
  birthDate?: Date;
  maritalStatus?: MaritalStatus;
  profession?: string;
  annualIncome?: number;
  
  // Professionnel
  companyName?: string;
  siret?: string;
  legalForm?: string;
  activitySector?: string;
  numberOfEmployees?: number;
  annualRevenue?: number;
  
  // Patrimoine
  wealth?: {
    totalAssets: number;
    totalLiabilities: number;
    netWealth: number;
    managedAssets: number;
  };
  
  // KYC
  kycStatus: KYCStatus;
  kycCompletedAt?: Date;
  riskProfile?: RiskProfile;
  
  // Statut
  status: ClientStatus;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
}
```

### Document (Frontend Types)

```typescript
interface Document {
  id: string;
  cabinetId: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  type: DocumentType;
  category?: DocumentCategory;
  version: number;
  uploadedBy: string;
  uploadedAt: Date;
  signatureStatus?: SignatureStatus;
  expiresAt?: Date;
}

type DocumentType = 
  | 'ID_CARD'
  | 'PASSPORT'
  | 'PROOF_OF_ADDRESS'
  | 'TAX_NOTICE'
  | 'BANK_STATEMENT'
  // ... autres types
```

### KYC Data (Frontend Types)

```typescript
interface KYCData {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'REJECTED';
  completionRate: number;
  lastUpdateAt?: Date;
  nextUpdateDue?: Date;
  
  // MIF II
  riskProfile?: {
    profile: RiskProfile;
    investmentHorizon: InvestmentHorizon;
    score: number;
  };
  financialKnowledge?: string;
  investmentObjectives?: string;
  mifidOverallScore?: number;
  
  // LCB-FT
  pepStatus: boolean;
  originOfFunds?: string;
  
  // Documents
  documents: KYCDocument[];
  
  // Notes
  complianceOfficerNotes?: string;
}
```

## Error Handling

### Pattern Standard

```typescript
const loadData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/clients');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    setClients(data.clients);
  } catch (error) {
    console.error('Erreur chargement clients:', error);
    setError(error instanceof Error ? error.message : 'Erreur inconnue');
    
    // Toast notification
    toast({
      title: 'Erreur',
      description: 'Impossible de charger les clients',
      variant: 'destructive'
    });
  } finally {
    setLoading(false);
  }
};
```

### États de Chargement

```typescript
// Loading skeleton
{loading && (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
)}

// Empty state
{!loading && clients.length === 0 && (
  <div className="text-center py-12">
    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-600">Aucun client trouvé</p>
    <Button onClick={() => setShowCreateModal(true)} className="mt-4">
      Créer un client
    </Button>
  </div>
)}

// Error state
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

## Testing Strategy

### Tests Unitaires

**Composants UI:**
```typescript
// components/ui/Button.test.tsx
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

**Hooks:**
```typescript
// lib/hooks/useClients.test.ts
describe('useClients', () => {
  it('fetches clients from API', async () => {
    const { result } = renderHook(() => useClients());
    
    await waitFor(() => {
      expect(result.current.clients).toHaveLength(5);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### Tests d'Intégration

**Flux complet:**
```typescript
// e2e/client-creation.test.ts
describe('Client Creation Flow', () => {
  it('creates a new particulier client', async () => {
    // 1. Navigate to clients page
    await page.goto('/dashboard/clients');
    
    // 2. Click "Nouveau Client"
    await page.click('button:has-text("Nouveau Client")');
    
    // 3. Select "Particulier"
    await page.click('button:has-text("Particulier")');
    
    // 4. Fill form
    await page.fill('input[name="firstName"]', 'Jean');
    await page.fill('input[name="lastName"]', 'Dupont');
    await page.fill('input[name="email"]', 'jean.dupont@test.fr');
    
    // 5. Submit
    await page.click('button[type="submit"]');
    
    // 6. Verify client created
    await expect(page.locator('text=Jean Dupont')).toBeVisible();
  });
});
```

### Tests de Sécurité

**RLS Enforcement:**
```typescript
describe('Row Level Security', () => {
  it('only shows clients from user cabinet', async () => {
    const response = await fetch('/api/clients', {
      headers: { 'Cookie': userSessionCookie }
    });
    
    const data = await response.json();
    
    // Verify all clients belong to user's cabinet
    data.clients.forEach(client => {
      expect(client.cabinetId).toBe(userCabinetId);
    });
  });
});
```

## Performance Optimizations

### React Query Configuration

```typescript
// lib/react-query-config.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

### Optimistic Updates

```typescript
// Exemple: Mise à jour client
const updateClient = useMutation({
  mutationFn: (data) => fetch(`/api/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['client', id]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['client', id]);
    
    // Optimistically update
    queryClient.setQueryData(['client', id], (old) => ({
      ...old,
      ...newData
    }));
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['client', id], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['client', id]);
  }
});
```

### Lazy Loading

```typescript
// Lazy load heavy components
const TaxProjector = lazy(() => import('@/components/simulators/TaxProjector'));
const RetirementSimulator = lazy(() => import('@/components/simulators/RetirementSimulator'));

// Usage
<Suspense fallback={<Skeleton className="h-96" />}>
  <TaxProjector />
</Suspense>
```

### Infinite Scroll

```typescript
// lib/hooks/useInfiniteClients.ts
export function useInfiniteClients(filters) {
  return useInfiniteQuery({
    queryKey: ['clients', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => 
      fetch(`/api/clients?page=${pageParam}&limit=20`)
        .then(r => r.json()),
    getNextPageParam: (lastPage) => 
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
  });
}
```

## Accessibility

### ARIA Labels

```typescript
<button
  aria-label="Créer un nouveau client"
  aria-describedby="create-client-description"
>
  <Plus className="h-4 w-4" />
</button>

<span id="create-client-description" className="sr-only">
  Ouvre un formulaire pour créer un nouveau client particulier ou professionnel
</span>
```

### Keyboard Navigation

```typescript
// Raccourcis clavier globaux
useHotkeys('ctrl+k', () => setCommandPaletteOpen(true));
useHotkeys('ctrl+n', () => setQuickActionsOpen(true));
useHotkeys('ctrl+h', () => setPresentationMode(!presentationMode));
useHotkeys('/', () => searchInputRef.current?.focus());
```

### Focus Management

```typescript
// Trap focus dans les modals
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>Créer un client</DialogTitle>
    <form onSubmit={handleSubmit}>
      <Input
        ref={firstInputRef}
        autoFocus
        name="firstName"
      />
      {/* ... */}
    </form>
  </DialogContent>
</Dialog>
```

## Deployment Considerations

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

### Build Optimization

```typescript
// next.config.ts
const config = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['supabase.co']
  },
  experimental: {
    optimizeCss: true
  }
};
```

### Database Migrations

```bash
# Run migrations before deployment
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

---

**Ce design garantit:**
- ✅ Intégration complète avec Prisma/PostgreSQL
- ✅ Aucune donnée mockée
- ✅ Performance optimale
- ✅ Sécurité multi-tenant
- ✅ Accessibilité WCAG 2.1
- ✅ Tests complets
