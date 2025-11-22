/**
 * Example component showing how to use PDF export functionality
 * This demonstrates the integration with ExportModal and useExport hook
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ExportModal } from './ExportModal'
import { useExport } from '@/hooks/use-export'
import { FileDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExportPDFExampleProps {
  clientId: string
  clientName: string
}

/**
 * Example: Export client report as PDF
 */
export function ExportClientPDF({ clientId, clientName }: ExportPDFExampleProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const { toast } = useToast()

  const { executeExport, isExporting } = useExport({
    exportType: 'clients',
    clientId,
    onSuccess: () => {
      toast({
        title: 'Export réussi',
        description: `Le rapport client pour ${clientName} a été téléchargé.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setExportModalOpen(true)}
        disabled={isExporting}
      >
        <FileDown className="h-4 w-4 mr-2" />
        Exporter le rapport client
      </Button>

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Exporter le rapport client"
        description={`Générer un rapport PDF professionnel pour ${clientName}`}
        exportType="clients"
        onExport={executeExport}
      />
    </>
  )
}

/**
 * Example: Export patrimoine report as PDF
 */
export function ExportPatrimoinePDF({ clientId, clientName }: ExportPDFExampleProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const { toast } = useToast()

  const { executeExport, isExporting } = useExport({
    exportType: 'patrimoine',
    clientId,
    onSuccess: () => {
      toast({
        title: 'Export réussi',
        description: `Le rapport patrimoine pour ${clientName} a été téléchargé.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setExportModalOpen(true)}
        disabled={isExporting}
      >
        <FileDown className="h-4 w-4 mr-2" />
        Exporter le patrimoine
      </Button>

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Exporter le patrimoine"
        description={`Générer un rapport PDF avec actifs, passifs et contrats pour ${clientName}`}
        exportType="patrimoine"
        onExport={executeExport}
      />
    </>
  )
}

/**
 * Example: Export documents list as PDF
 */
export function ExportDocumentsPDF({ clientId, clientName }: ExportPDFExampleProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const { toast } = useToast()

  const { executeExport, isExporting } = useExport({
    exportType: 'documents',
    clientId,
    onSuccess: () => {
      toast({
        title: 'Export réussi',
        description: `La liste des documents pour ${clientName} a été téléchargée.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'export',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setExportModalOpen(true)}
        disabled={isExporting}
      >
        <FileDown className="h-4 w-4 mr-2" />
        Exporter les documents
      </Button>

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Exporter les documents"
        description={`Générer un inventaire PDF des documents pour ${clientName}`}
        exportType="documents"
        onExport={executeExport}
      />
    </>
  )
}

/**
 * Example: Direct PDF download without modal
 */
export function DirectPDFDownload({ clientId }: { clientId: string }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const handleDirectDownload = async () => {
    setIsDownloading(true)
    try {
      // Call the PDF API directly
      const response = await fetch(`/api/exports/pdf/client?clientId=${clientId}&locale=fr`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }

      // Get the blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `client-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Téléchargement réussi',
        description: 'Le rapport PDF a été téléchargé.',
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="primary"
      onClick={handleDirectDownload}
      loading={isDownloading}
      disabled={isDownloading}
    >
      <FileDown className="h-4 w-4 mr-2" />
      Télécharger PDF
    </Button>
  )
}

/**
 * Example: Export with locale selection
 */
export function ExportWithLocale({ clientId, clientName }: ExportPDFExampleProps) {
  const [locale, setLocale] = useState<'fr' | 'en'>('fr')
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(
        `/api/exports/pdf/client?clientId=${clientId}&locale=${locale}`
      )
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `client-report-${locale}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Export réussi',
        description: `Rapport généré en ${locale === 'fr' ? 'français' : 'anglais'}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={locale}
        onChange={(e: any) => setLocale(e.target.value as 'fr' | 'en')}
        className="px-3 py-2 border rounded-md"
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>

      <Button
        variant="primary"
        onClick={handleDownload}
        loading={isDownloading}
        disabled={isDownloading}
      >
        <FileDown className="h-4 w-4 mr-2" />
        Exporter PDF
      </Button>
    </div>
  )
}
