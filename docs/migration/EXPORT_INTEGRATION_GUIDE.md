# Guide d'intégration des composants d'export

## Vue d'ensemble

Ce guide explique comment intégrer les composants d'export dans les pages du CRM alfi-crm.

## Composants disponibles

### 1. ExportButton
Bouton avec menu déroulant pour choisir le format d'export.

### 2. ExportButtonWithModal
Bouton qui ouvre un modal avec plus d'options.

### 3. ExportModal
Modal autonome pour contrôle total.

## Exemples d'intégration

### Page liste des clients

```tsx
// app/dashboard/clients/page.tsx
'use client'

import { ExportButton } from '@/components/exports'
import { useState } from 'react'

export default function ClientsPage() {
  const [filters, setFilters] = useState({
    status: 'ACTIF',
    clientType: 'PARTICULIER',
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        
        {/* Bouton d'export avec dropdown */}
        <ExportButton
          exportType="clients"
          label="Exporter"
          filters={filters}
          onSuccess={() => {
            console.log('Export réussi!')
            // Afficher une notification
          }}
          onError={(error) => {
            console.error('Erreur export:', error)
            // Afficher une erreur
          }}
        />
      </div>
      
      {/* Liste des clients */}
      {/* ... */}
    </div>
  )
}
```

### Page Client360 - Onglet Patrimoine

```tsx
// components/client360/TabWealth.tsx
'use client'

import { ExportButtonWithModal } from '@/components/exports'

interface TabWealthProps {
  clientId: string
}

export function TabWealth({ clientId }: TabWealthProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Patrimoine</h2>
        
        {/* Export du patrimoine avec modal */}
        <ExportButtonWithModal
          exportType="patrimoine"
          clientId={clientId}
          label="Exporter le patrimoine"
          variant="outline"
        />
      </div>
      
      {/* Affichage du patrimoine */}
      {/* ... */}
    </div>
  )
}
```

### Page Client360 - Onglet Documents

```tsx
// components/client360/TabDocuments.tsx
'use client'

import { ExportButton } from '@/components/exports'

interface TabDocumentsProps {
  clientId: string
}

export function TabDocuments({ clientId }: TabDocumentsProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents</h2>
        
        {/* Export simple en CSV */}
        <ExportButton
          exportType="documents"
          clientId={clientId}
          label="Exporter en CSV"
          showDropdown={false}
          defaultFormat="csv"
          size="sm"
        />
      </div>
      
      {/* Liste des documents */}
      {/* ... */}
    </div>
  )
}
```

### Page Simulations

```tsx
// app/dashboard/simulators/page.tsx
'use client'

import { ExportButton } from '@/components/exports'
import { useParams } from 'next/navigation'

export default function SimulatorsPage() {
  const params = useParams()
  const clientId = params.clientId as string

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Simulations</h1>
        
        {/* Export avec dropdown */}
        <ExportButton
          exportType="simulations"
          clientId={clientId}
          label="Exporter les simulations"
          variant="primary"
        />
      </div>
      
      {/* Liste des simulations */}
      {/* ... */}
    </div>
  )
}
```

### Utilisation avec le hook useExport

Pour un contrôle total, utilisez directement le hook:

```tsx
'use client'

import { useState } from 'react'
import { useExport } from '@/hooks/use-export'
import { ExportModal } from '@/components/exports'
import { Button } from '@/components/ui/Button'

export default function CustomExportPage() {
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'ACTIF',
  })

  const { executeExport, isExporting, error } = useExport({
    exportType: 'clients',
    filters,
    onSuccess: () => {
      console.log('Export réussi!')
      setShowModal(false)
    },
    onError: (err) => {
      console.error('Erreur:', err)
    },
  })

  return (
    <div>
      <Button onClick={() => setShowModal(true)}>
        Exporter
      </Button>

      <ExportModal
        open={showModal}
        onOpenChange={setShowModal}
        exportType="clients"
        onExport={executeExport}
        filters={filters}
      />

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
```

## Props des composants

### ExportButton

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| exportType | 'clients' \| 'patrimoine' \| 'documents' \| 'simulations' | - | Type de données à exporter |
| clientId | string | - | ID du client (requis pour patrimoine, documents, simulations) |
| filters | Record<string, any> | {} | Filtres à appliquer |
| label | string | 'Exporter' | Texte du bouton |
| variant | 'default' \| 'outline' \| 'ghost' \| 'primary' | 'outline' | Style du bouton |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Taille du bouton |
| showDropdown | boolean | true | Afficher le menu déroulant |
| defaultFormat | 'csv' \| 'xlsx' \| 'pdf' | 'csv' | Format par défaut si pas de dropdown |
| onSuccess | () => void | - | Callback après succès |
| onError | (error: Error) => void | - | Callback en cas d'erreur |

### ExportModal

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| open | boolean | - | État d'ouverture du modal |
| onOpenChange | (open: boolean) => void | - | Callback pour changer l'état |
| exportType | 'clients' \| 'patrimoine' \| 'documents' \| 'simulations' | - | Type de données |
| onExport | (format: ExportFormat) => Promise<void> | - | Fonction d'export |
| filters | Record<string, any> | - | Filtres appliqués |
| title | string | 'Exporter les données' | Titre du modal |
| description | string | 'Sélectionnez le format...' | Description |

### useExport Hook

```typescript
const { executeExport, isExporting, error } = useExport({
  exportType: 'clients',
  clientId: 'optional-client-id',
  filters: { status: 'ACTIF' },
  onSuccess: () => console.log('Success'),
  onError: (err) => console.error(err),
})

// Exécuter l'export
await executeExport('csv') // ou 'xlsx', 'pdf'
```

## Formats supportés

### CSV
- Téléchargement immédiat
- En-têtes en français
- Séparateur: point-virgule (;)
- Encodage: UTF-8

### Excel (XLSX)
- Retourne les données JSON
- Nécessite traitement côté client
- Bibliothèque xlsx recommandée

### PDF
- Téléchargement immédiat
- Formatage professionnel
- Routes dédiées `/api/exports/pdf/*`

## Sécurité

Toutes les routes d'export vérifient:
- ✅ Authentification de l'utilisateur
- ✅ Appartenance au cabinet (RLS)
- ✅ Permissions sur les clients
- ✅ Audit logs automatiques

## Traduction automatique

Les champs sont automatiquement traduits en français:
- `firstName` → `Prénom`
- `lastName` → `Nom`
- `email` → `Email`
- `birthDate` → `Date de Naissance`
- etc.

Plus de 100 champs sont traduits automatiquement.

## Gestion des erreurs

Les erreurs sont automatiquement gérées et affichées:

```tsx
<ExportButton
  exportType="clients"
  onError={(error) => {
    // Afficher une notification toast
    toast.error(`Erreur d'export: ${error.message}`)
  }}
/>
```

## Bonnes pratiques

1. **Toujours fournir clientId** pour patrimoine, documents et simulations
2. **Utiliser des filtres** pour limiter la quantité de données
3. **Gérer les callbacks** onSuccess et onError
4. **Afficher un feedback** à l'utilisateur (toast, notification)
5. **Tester avec des données réelles** avant déploiement

## Dépannage

### L'export ne fonctionne pas
- Vérifier que l'utilisateur est authentifié
- Vérifier que le clientId est valide
- Vérifier les permissions du cabinet
- Consulter les logs serveur

### Le fichier ne se télécharge pas
- Vérifier la console navigateur
- Vérifier que le format est supporté
- Vérifier la réponse de l'API

### Les en-têtes ne sont pas en français
- Vérifier que le service export-service est utilisé
- Vérifier la fonction toCSV()
- Vérifier le mapping FIELD_TRANSLATIONS

## Support

Pour toute question ou problème, consulter:
- Documentation complète: `docs/migration/TASK_23_EXPORT_COMPLETE.md`
- Exemples: `components/exports/ExportExample.tsx`
- Tests: `scripts/test-export-api.ts`
