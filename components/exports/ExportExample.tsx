'use client'

import * as React from 'react'
import { useState } from 'react'
import { ExportButton } from './ExportButton'
import { ExportModal, ExportFormat } from './ExportModal'
import { useExport } from '@/hooks/use-export'

/**
 * Exemple d'utilisation des composants d'export
 * 
 * Usage dans une page:
 * 
 * ```tsx
 * import { ExportButton, ExportModal } from '@/components/exports'
 * import { useExport } from '@/hooks/use-export'
 * 
 * function ClientsPage() {
 *   const [exportModalOpen, setExportModalOpen] = useState(false)
 *   const { executeExport } = useExport({
 *     exportType: 'clients',
 *     filters: { status: 'ACTIVE' }
 *   })
 * 
 *   return (
 *     <>
 *       <ExportButton onClick={() => setExportModalOpen(true)} />
 *       <ExportModal
 *         open={exportModalOpen}
 *         onOpenChange={setExportModalOpen}
 *         exportType="clients"
 *         onExport={executeExport}
 *       />
 *     </>
 *   )
 * }
 * ```
 */
export function ExportExample() {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const { executeExport } = useExport({
    exportType: 'clients',
    filters: {
      status: 'ACTIVE',
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
    <div className="space-y-4">
      <ExportButton onClick={() => setExportModalOpen(true)} />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Exporter les clients"
        description="Sélectionnez le format d'export pour télécharger la liste des clients"
        exportType="clients"
        onExport={executeExport}
        filters={{
          status: 'ACTIVE',
          clientType: 'PARTICULIER',
        }}
      />
    </div>
  )
}
