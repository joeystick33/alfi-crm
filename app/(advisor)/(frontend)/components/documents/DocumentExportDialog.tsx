"use client"

/**
 * DocumentExportDialog - Dialog for exporting documents to PDF/DOCX
 * 
 * Features:
 * - Format selection (PDF/DOCX)
 * - Batch export for multiple documents
 * - Cabinet branding application
 * - Signature placeholders option
 * 
 * @requirements 16.1-16.6
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Label } from '@/app/_common/components/ui/Label'
import { Badge } from '@/app/_common/components/ui/Badge'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Progress } from '@/app/_common/components/ui/Progress'
import { cn } from '@/app/_common/lib/utils'
import {
  useExportDocument,
  useBatchExportDocuments,
} from '@/app/_common/hooks/api/use-regulatory-documents-api'
import {
  FileText,
  Download,
  FileType,
  Loader2,
  CheckCircle,
  XCircle,
  Palette,
  PenTool,
  Files,
  AlertTriangle,
} from 'lucide-react'
import {
  DOCUMENT_FORMATS,
  REGULATORY_DOCUMENT_TYPE_LABELS,
  type DocumentFormat,
  type GeneratedDocument,
  type RegulatoryDocumentType,
} from '@/lib/documents/types'

// ============================================================================
// Schema
// ============================================================================

const exportOptionsSchema = z.object({
  format: z.enum(DOCUMENT_FORMATS as unknown as [string, ...string[]]),
  includeSignaturePlaceholders: z.boolean(),
  applyBranding: z.boolean(),
  watermark: z.string().optional(),
})

type ExportOptionsFormData = z.infer<typeof exportOptionsSchema>

// ============================================================================
// Props
// ============================================================================

interface DocumentExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documents: GeneratedDocument[]
  onSuccess?: () => void
}

// ============================================================================
// Export Result Item
// ============================================================================

interface ExportResultItem {
  documentId: string
  documentName: string
  status: 'pending' | 'success' | 'error'
  error?: string
  fileUrl?: string
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentExportDialog({
  open,
  onOpenChange,
  documents,
  onSuccess,
}: DocumentExportDialogProps) {
  const [exportResults, setExportResults] = useState<ExportResultItem[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  const isBatchExport = documents.length > 1

  // Mutations
  const exportMutation = useExportDocument()
  const batchExportMutation = useBatchExportDocuments()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExportOptionsFormData>({
    resolver: zodResolver(exportOptionsSchema),
    defaultValues: {
      format: 'PDF',
      includeSignaturePlaceholders: true,
      applyBranding: true,
      watermark: '',
    },
  })

  const selectedFormat = watch('format') as DocumentFormat
  const includeSignatures = watch('includeSignaturePlaceholders')
  const applyBranding = watch('applyBranding')

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        format: 'PDF',
        includeSignaturePlaceholders: true,
        applyBranding: true,
        watermark: '',
      })
      setExportResults([])
      setExportComplete(false)
    }
  }, [open, reset])

  // Handle export
  const onSubmit = async (data: ExportOptionsFormData) => {
    setIsExporting(true)
    setExportComplete(false)

    // Initialize results
    const initialResults: ExportResultItem[] = documents.map((doc) => ({
      documentId: doc.id,
      documentName: doc.fileName,
      status: 'pending',
    }))
    setExportResults(initialResults)

    try {
      if (isBatchExport) {
        // Batch export
        const result = await batchExportMutation.mutateAsync({
          documentIds: documents.map((d) => d.id),
          options: {
            format: data.format as DocumentFormat,
            includeSignaturePlaceholders: data.includeSignaturePlaceholders,
            applyBranding: data.applyBranding,
            watermark: data.watermark,
          },
        })

        // Update results
        const updatedResults = initialResults.map((item) => {
          const exportResult = result.results.find(
            (r) => r.fileName?.includes(item.documentId) || r.success
          )
          if (exportResult?.success) {
            return {
              ...item,
              status: 'success' as const,
              fileUrl: exportResult.fileUrl,
            }
          }
          return {
            ...item,
            status: 'error' as const,
            error: exportResult?.error || 'Erreur inconnue',
          }
        })
        setExportResults(updatedResults)
      } else {
        // Single export
        const doc = documents[0]
        try {
          const result = await exportMutation.mutateAsync({
            documentId: doc.id,
            options: {
              format: data.format as DocumentFormat,
              includeSignaturePlaceholders: data.includeSignaturePlaceholders,
              applyBranding: data.applyBranding,
              watermark: data.watermark,
            },
          })

          setExportResults([
            {
              documentId: doc.id,
              documentName: doc.fileName,
              status: result.success ? 'success' : 'error',
              fileUrl: result.fileUrl,
              error: result.error,
            },
          ])
        } catch (error) {
          setExportResults([
            {
              documentId: doc.id,
              documentName: doc.fileName,
              status: 'error',
              error: error instanceof Error ? error.message : 'Erreur inconnue',
            },
          ])
        }
      }

      setExportComplete(true)
      onSuccess?.()
    } catch {
      // Error handled by mutation
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    reset()
    setExportResults([])
    setExportComplete(false)
    onOpenChange(false)
  }

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank')
  }

  // Calculate progress
  const completedCount = exportResults.filter((r) => r.status !== 'pending').length
  const successCount = exportResults.filter((r) => r.status === 'success').length
  const progress = documents.length > 0 ? (completedCount / documents.length) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-[#7373FF]" />
            Exporter {isBatchExport ? `${documents.length} documents` : 'le document'}
          </DialogTitle>
          <DialogDescription>
            Choisissez le format et les options d'export
          </DialogDescription>
        </DialogHeader>

        {!exportComplete ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Documents List */}
            {isBatchExport && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Files className="h-4 w-4" />
                  Documents sélectionnés ({documents.length})
                </Label>
                <div className="max-h-32 overflow-auto rounded-lg border border-gray-200 divide-y">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 truncate">{doc.fileName}</span>
                      <Badge variant="outline" size="xs">
                        {REGULATORY_DOCUMENT_TYPE_LABELS[doc.documentType as RegulatoryDocumentType]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Format d'export *</Label>
              <div className="grid grid-cols-2 gap-3">
                {DOCUMENT_FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setValue('format', format)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                      selectedFormat === format
                        ? 'border-[#7373FF] bg-[#7373FF]/5 ring-1 ring-[#7373FF]'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <FileType className={cn(
                      'h-8 w-8',
                      selectedFormat === format ? 'text-[#7373FF]' : 'text-gray-400'
                    )} />
                    <div className="text-center">
                      <p className={cn(
                        'font-medium',
                        selectedFormat === format ? 'text-gray-900' : 'text-gray-700'
                      )}>
                        {format}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format === 'PDF' ? 'Pour signature' : 'Pour édition'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-4">
              <Label>Options d'export</Label>
              
              {/* Signature Placeholders */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <Checkbox
                  id="includeSignatures"
                  checked={includeSignatures}
                  onChange={(checked) => 
                    setValue('includeSignaturePlaceholders', checked)
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="includeSignatures" className="flex items-center gap-2 cursor-pointer">
                    <PenTool className="h-4 w-4 text-gray-500" />
                    Inclure les emplacements de signature
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Ajoute des zones de signature pour le client et le conseiller
                  </p>
                </div>
              </div>

              {/* Cabinet Branding */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <Checkbox
                  id="applyBranding"
                  checked={applyBranding}
                  onChange={(checked) => 
                    setValue('applyBranding', checked)
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="applyBranding" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="h-4 w-4 text-gray-500" />
                    Appliquer le branding du cabinet
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Logo, couleurs et coordonnées du cabinet
                  </p>
                </div>
              </div>
            </div>

            {/* Export Progress */}
            {isExporting && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Export en cours...</span>
                  <span className="font-medium">{completedCount}/{documents.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
                
                <div className="max-h-32 overflow-auto space-y-1">
                  {exportResults.map((result) => (
                    <div
                      key={result.documentId}
                      className="flex items-center gap-2 text-sm"
                    >
                      {result.status === 'pending' && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {result.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                      {result.status === 'error' && (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      )}
                      <span className={cn(
                        'truncate',
                        result.status === 'error' && 'text-rose-600'
                      )}>
                        {result.documentName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Exporter en {selectedFormat}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Export Complete View */
          <div className="space-y-6">
            {/* Summary */}
            <div className={cn(
              'flex items-center gap-4 p-4 rounded-lg',
              successCount === documents.length
                ? 'bg-emerald-50 border border-emerald-200'
                : successCount > 0
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-rose-50 border border-rose-200'
            )}>
              {successCount === documents.length ? (
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              ) : successCount > 0 ? (
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              ) : (
                <XCircle className="h-8 w-8 text-rose-500" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {successCount === documents.length
                    ? 'Export terminé avec succès'
                    : successCount > 0
                    ? 'Export partiellement réussi'
                    : 'Échec de l\'export'}
                </p>
                <p className="text-sm text-gray-600">
                  {successCount}/{documents.length} document(s) exporté(s)
                </p>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-2">
              <Label>Résultats</Label>
              <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 divide-y">
                {exportResults.map((result) => (
                  <div
                    key={result.documentId}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{result.documentName}</p>
                      {result.error && (
                        <p className="text-xs text-rose-600">{result.error}</p>
                      )}
                    </div>
                    {result.status === 'success' && result.fileUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(result.fileUrl!)}
                        className="gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Télécharger
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
