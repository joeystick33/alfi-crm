# Export Components

Composants React pour gérer les exports de données (CSV, Excel, PDF) avec téléchargement automatique.

## Composants

### ExportButton

Bouton simple pour déclencher l'ouverture du modal d'export.

```tsx
import { ExportButton } from '@/app/(advisor)/(frontend)/components/exports'

<ExportButton onClick={() => setExportModalOpen(true)} />
```

**Props:**
- `onClick`: Fonction appelée au clic
- `variant`: Style du bouton ('primary' | 'secondary' | 'outline' | 'ghost')
- `size`: Taille du bouton ('sm' | 'md' | 'lg')
- `disabled`: Désactiver le bouton
- `loading`: Afficher un spinner de chargement
- `children`: Texte du bouton (défaut: "Exporter")

### ExportModal

Modal avec sélection de format d'export (CSV, Excel, PDF).

```tsx
import { ExportModal } from '@/app/(advisor)/(frontend)/components/exports'
import { useExport } from '@/app/(advisor)/(frontend)/hooks/use-export'

const { executeExport } = useExport({
  exportType: 'clients',
  filters: { status: 'ACTIVE' }
})

<ExportModal
  open={exportModalOpen}
  onOpenChange={setExportModalOpen}
  exportType="clients"
  onExport={executeExport}
  title="Exporter les clients"
  description="Sélectionnez le format d'export"
  filters={{ status: 'ACTIVE' }}
/>
```

**Props:**
- `open`: État d'ouverture du modal
- `onOpenChange`: Callback pour changer l'état d'ouverture
- `exportType`: Type d'export ('clients' | 'patrimoine' | 'documents' | 'simulations')
- `onExport`: Fonction async qui exécute l'export
- `title`: Titre du modal (optionnel)
- `description`: Description du modal (optionnel)
- `filters`: Filtres appliqués à afficher (optionnel)

## Hook useExport

Hook pour gérer la logique d'export avec téléchargement automatique.

```tsx
import { useExport } from '@/app/(advisor)/(frontend)/hooks/use-export'

const { executeExport, isExporting, error } = useExport({
  exportType: 'clients',
  clientId: 'client-123', // Optionnel
  filters: { status: 'ACTIVE' },
  onSuccess: () => console.log('Export réussi!'),
  onError: (error) => console.error('Erreur:', error)
})
```

**Options:**
- `exportType`: Type d'export ('clients' | 'patrimoine' | 'documents' | 'simulations')
- `clientId`: ID du client (optionnel, pour exports spécifiques à un client)
- `filters`: Filtres à appliquer à l'export
- `onSuccess`: Callback appelé après succès
- `onError`: Callback appelé en cas d'erreur

**Retour:**
- `executeExport(format)`: Fonction pour exécuter l'export
- `isExporting`: État de chargement
- `error`: Message d'erreur éventuel

## Exemples d'utilisation

### Export de la liste des clients

```tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/app/(advisor)/(frontend)/components/exports'
import { useExport } from '@/app/(advisor)/(frontend)/hooks/use-export'

export function ClientsPage() {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [filters, setFilters] = useState({ status: 'ACTIVE' })

  const { executeExport } = useExport({
    exportType: 'clients',
    filters,
    onSuccess: () => {
      // Afficher un toast de succès
      console.log('Export réussi!')
    }
  })

  return (
    <div>
      <ExportButton onClick={() => setExportModalOpen(true)} />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        exportType="clients"
        onExport={executeExport}
        filters={filters}
      />
    </div>
  )
}
```

### Export du patrimoine d'un client

```tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/app/(advisor)/(frontend)/components/exports'
import { useExport } from '@/app/(advisor)/(frontend)/hooks/use-export'

export function Client360Page({ clientId }: { clientId: string }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'patrimoine',
    clientId,
  })

  return (
    <div>
      <ExportButton 
        onClick={() => setExportModalOpen(true)}
        variant="outline"
      >
        Exporter le patrimoine
      </ExportButton>

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Exporter le patrimoine"
        description="Exporter les actifs, passifs et contrats du client"
        exportType="patrimoine"
        onExport={executeExport}
      />
    </div>
  )
}
```

### Export des documents

```tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/app/(advisor)/(frontend)/components/exports'
import { useExport } from '@/app/(advisor)/(frontend)/hooks/use-export'

export function DocumentsTab({ clientId }: { clientId: string }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'documents',
    clientId,
  })

  return (
    <div>
      <ExportButton 
        onClick={() => setExportModalOpen(true)}
        size="sm"
      />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        exportType="documents"
        onExport={executeExport}
      />
    </div>
  )
}
```

### Export des simulations

```tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/app/(advisor)/(frontend)/components/exports'
import { useExport } from '@/app/(advisor)/(frontend)/hooks/use-export'

export function SimulationsTab({ clientId }: { clientId: string }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'simulations',
    clientId,
  })

  return (
    <div>
      <ExportButton onClick={() => setExportModalOpen(true)} />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Exporter les simulations"
        exportType="simulations"
        onExport={executeExport}
      />
    </div>
  )
}
```

## Routes API utilisées

Les composants s'intègrent avec les routes API suivantes:

- `GET /api/exports/clients?format=csv&status=ACTIVE`
- `GET /api/exports/patrimoine?clientId=xxx&format=csv`
- `GET /api/exports/documents?clientId=xxx&format=csv`
- `GET /api/exports/simulations?clientId=xxx&format=csv`

## Formats supportés

### CSV (✅ Implémenté)
- Téléchargement direct depuis l'API
- En-têtes traduits en français
- Encodage UTF-8 avec BOM

### Excel (⚠️ Placeholder)
- Actuellement fallback sur CSV
- TODO: Implémenter avec la bibliothèque `xlsx`

### PDF (⚠️ Placeholder)
- Actuellement fallback sur CSV
- TODO: Implémenter avec `jsPDF` ou `react-pdf`

## Notes techniques

- Les exports CSV sont générés côté serveur pour de meilleures performances
- Les exports Excel et PDF nécessitent des bibliothèques supplémentaires
- Le téléchargement est automatique après génération
- Les erreurs sont gérées et affichées dans le modal
- Tous les exports respectent le RLS (Row Level Security) par cabinetId
- Les actions d'export sont loggées dans l'audit trail

## Prochaines étapes

1. Implémenter l'export Excel avec `xlsx`
2. Implémenter l'export PDF avec `jsPDF` ou `react-pdf`
3. Ajouter le branding cabinet dans les exports PDF
4. Ajouter des graphiques dans les exports PDF
5. Support multi-langue (FR/EN)
