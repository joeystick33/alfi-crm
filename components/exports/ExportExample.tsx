'use client'

import { useState } from 'react'
import { ExportButton, ExportButtonWithModal } from './ExportButton'
import { ExportModal } from './ExportModal'
import { useExport } from '@/hooks/use-export'

/**
 * Exemples d'utilisation des composants d'export
 * 
 * Usage dans une page:
 * 
 * ```tsx
 * import { ExportButton, ExportButtonWithModal } from '@/components/exports'
 * 
 * // Exemple 1: Bouton avec dropdown
 * <ExportButton
 *   exportType="clients"
 *   label="Exporter"
 *   filters={{ status: 'ACTIF' }}
 * />
 * 
 * // Exemple 2: Bouton avec modal
 * <ExportButtonWithModal
 *   exportType="patrimoine"
 *   clientId="client-123"
 *   label="Exporter le patrimoine"
 * />
 * 
 * // Exemple 3: Export direct CSV
 * <ExportButton
 *   exportType="clients"
 *   showDropdown={false}
 *   defaultFormat="csv"
 * />
 * ```
 */
export function ExportExample() {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'clients',
    filters: {
      status: 'ACTIF',
      clientType: 'PARTICULIER',
    },
    onSuccess: () => {
      console.log('Export réussi!')
    },
    onError: (error) => {
      console.error('Erreur export:', error)
    },
  })

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">Exemples d'export</h2>
        
        {/* Exemple 1: Bouton avec dropdown */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold">1. Bouton avec dropdown</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Menu déroulant pour choisir le format (CSV, Excel, PDF)
          </p>
          <ExportButton
            exportType="clients"
            label="Exporter les clients"
            filters={{
              status: 'ACTIF',
            }}
            onSuccess={() => console.log('Export réussi!')}
          />
        </div>

        {/* Exemple 2: Bouton simple CSV */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold">2. Export direct CSV</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Export immédiat en CSV sans menu
          </p>
          <ExportButton
            exportType="clients"
            label="Exporter en CSV"
            showDropdown={false}
            defaultFormat="csv"
            variant="primary"
          />
        </div>

        {/* Exemple 3: Bouton avec modal */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold">3. Bouton avec modal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Modal avec plus d'options et informations
          </p>
          <ExportButtonWithModal
            exportType="patrimoine"
            clientId="example-client-id"
            label="Exporter le patrimoine"
            variant="outline"
          />
        </div>

        {/* Exemple 4: Modal personnalisé */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">4. Modal personnalisé</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contrôle total sur le modal
          </p>
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Ouvrir le modal
          </button>

          <ExportModal
            open={exportModalOpen}
            onOpenChange={setExportModalOpen}
            title="Exporter les clients"
            description="Sélectionnez le format d'export pour télécharger la liste des clients"
            exportType="clients"
            onExport={executeExport}
            filters={{
              status: 'ACTIF',
              clientType: 'PARTICULIER',
            }}
          />
        </div>
      </div>
    </div>
  )
}
