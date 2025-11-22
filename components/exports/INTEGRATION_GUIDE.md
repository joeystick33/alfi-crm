# Guide d'intégration des composants d'export

Ce guide montre comment intégrer les composants d'export dans les différentes pages de l'application.

## 1. Page Liste des Clients

Ajouter un bouton d'export dans le header de la page clients:

```tsx
// alfi-crm/app/dashboard/clients/page.tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/components/exports'
import { useExport } from '@/hooks/use-export'

export default function ClientsPage() {
  const [filters, setFilters] = useState({ status: 'ACTIVE' })
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'clients',
    filters,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <div className="flex gap-2">
          <ExportButton onClick={() => setExportModalOpen(true)} />
          <Button onClick={() => setCreateModalOpen(true)}>
            Nouveau client
          </Button>
        </div>
      </div>

      {/* ... reste du contenu ... */}

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

## 2. Vue Client 360° - Onglet Patrimoine

Ajouter l'export du patrimoine dans l'onglet:

```tsx
// alfi-crm/components/client360/TabWealth.tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/components/exports'
import { useExport } from '@/hooks/use-export'

export function TabWealth({ clientId }: { clientId: string }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'patrimoine',
    clientId,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Patrimoine</h2>
        <ExportButton 
          onClick={() => setExportModalOpen(true)}
          variant="outline"
          size="sm"
        >
          Exporter
        </ExportButton>
      </div>

      {/* ... contenu patrimoine ... */}

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Exporter le patrimoine"
        description="Exporter les actifs, passifs et contrats"
        exportType="patrimoine"
        onExport={executeExport}
      />
    </div>
  )
}
```

## 3. Vue Client 360° - Onglet Documents

```tsx
// alfi-crm/components/client360/TabDocuments.tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/components/exports'
import { useExport } from '@/hooks/use-export'

export function TabDocuments({ clientId }: { clientId: string }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'documents',
    clientId,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>
        <ExportButton 
          onClick={() => setExportModalOpen(true)}
          size="sm"
        />
      </div>

      {/* ... liste documents ... */}

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

## 4. Onglet Reporting (à créer)

```tsx
// alfi-crm/components/client360/TabReporting.tsx
'use client'

import { useState } from 'react'
import { ExportButton, ExportModal } from '@/components/exports'
import { useExport } from '@/hooks/use-export'

export function TabReporting({ clientId }: { clientId: string }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportType, setExportType] = useState<'patrimoine' | 'documents' | 'simulations'>('patrimoine')

  const { executeExport } = useExport({
    exportType,
    clientId,
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Reporting</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carte Patrimoine */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Rapport Patrimoine</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Actifs, passifs et contrats
          </p>
          <ExportButton
            onClick={() => {
              setExportType('patrimoine')
              setExportModalOpen(true)
            }}
            variant="outline"
            size="sm"
          >
            Générer
          </ExportButton>
        </div>

        {/* Carte Documents */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Liste Documents</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tous les documents du client
          </p>
          <ExportButton
            onClick={() => {
              setExportType('documents')
              setExportModalOpen(true)
            }}
            variant="outline"
            size="sm"
          >
            Générer
          </ExportButton>
        </div>

        {/* Carte Simulations */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Historique Simulations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Toutes les simulations sauvegardées
          </p>
          <ExportButton
            onClick={() => {
              setExportType('simulations')
              setExportModalOpen(true)
            }}
            variant="outline"
            size="sm"
          >
            Générer
          </ExportButton>
        </div>
      </div>

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        exportType={exportType}
        onExport={executeExport}
      />
    </div>
  )
}
```

## 5. Intégration avec Toast notifications

Pour afficher des notifications de succès/erreur:

```tsx
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

const { executeExport } = useExport({
  exportType: 'clients',
  onSuccess: () => {
    toast({
      title: 'Export réussi',
      description: 'Le fichier a été téléchargé',
      variant: 'success',
    })
  },
  onError: (error) => {
    toast({
      title: 'Erreur d\'export',
      description: error.message,
      variant: 'destructive',
    })
  },
})
```

## Checklist d'intégration

- [ ] Importer les composants `ExportButton` et `ExportModal`
- [ ] Importer le hook `useExport`
- [ ] Créer un state pour contrôler l'ouverture du modal
- [ ] Configurer le hook avec le bon `exportType` et les filtres
- [ ] Ajouter le bouton dans l'UI
- [ ] Ajouter le modal avec les bonnes props
- [ ] Tester l'export CSV
- [ ] (Optionnel) Ajouter les notifications toast

## Notes importantes

1. **Permissions**: Les exports respectent automatiquement les permissions RLS
2. **Audit**: Tous les exports sont loggés dans l'audit trail
3. **Filtres**: Les filtres actifs sont automatiquement appliqués à l'export
4. **Formats**: CSV fonctionne immédiatement, Excel et PDF sont en placeholder
