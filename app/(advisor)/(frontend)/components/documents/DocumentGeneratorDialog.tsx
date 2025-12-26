"use client"

/**
 * DocumentGeneratorDialog - Dialog for generating regulatory documents
 * 
 * Features:
 * - Document type selection
 * - Preview before generation
 * - Pre-filled data from client profile
 * 
 * @requirements 14.6-14.7, 16.7
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'
import {
  useRegulatoryTemplates,
  useGenerateDocument,
  usePreviewDocument,
} from '@/app/_common/hooks/api/use-regulatory-documents-api'
import {
  FileText,
  Eye,
  FileOutput,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Info,
} from 'lucide-react'
import {
  REGULATORY_DOCUMENT_TYPES,
  REGULATORY_DOCUMENT_TYPE_LABELS,
  DOCUMENT_FORMATS,
  type RegulatoryDocumentType,
  type DocumentFormat,
  type DocumentTemplate,
} from '@/lib/documents/types'

// ============================================================================
// Schema
// ============================================================================

const generateDocumentSchema = z.object({
  documentType: z.enum(REGULATORY_DOCUMENT_TYPES as unknown as [string, ...string[]]),
  templateId: z.string().min(1, 'Sélectionnez un template'),
  format: z.enum(DOCUMENT_FORMATS as unknown as [string, ...string[]]),
})

type GenerateDocumentFormData = z.infer<typeof generateDocumentSchema>

// ============================================================================
// Props
// ============================================================================

interface DocumentGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  affaireId?: string
  operationId?: string
  preselectedType?: RegulatoryDocumentType
  onSuccess?: (documentId: string) => void
}

// ============================================================================
// Document Type Categories
// ============================================================================

const DOCUMENT_CATEGORIES = {
  'Entrée en Relation': ['DER', 'RECUEIL_INFORMATIONS', 'LETTRE_MISSION'],
  'Conseil': ['RAPPORT_MISSION', 'ATTESTATION_CONSEIL', 'DECLARATION_ADEQUATION'],
  'Contractuel': ['CONVENTION_HONORAIRES', 'MANDAT_GESTION', 'BULLETIN_SOUSCRIPTION'],
  'Opérations': ['ORDRE_ARBITRAGE', 'DEMANDE_RACHAT', 'BULLETIN_VERSEMENT'],
  'Réglementaire': ['QUESTIONNAIRE_MIFID', 'SIMULATION_FISCALE'],
} as const

// ============================================================================
// Component
// ============================================================================

export default function DocumentGeneratorDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  affaireId,
  operationId,
  preselectedType,
  onSuccess,
}: DocumentGeneratorDialogProps) {
  const [activeTab, setActiveTab] = useState<'select' | 'preview'>('select')
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useRegulatoryTemplates(
    { isActive: true },
    { enabled: open }
  )

  // Mutations
  const generateMutation = useGenerateDocument()
  const previewMutation = usePreviewDocument()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerateDocumentFormData>({
    resolver: zodResolver(generateDocumentSchema),
    defaultValues: {
      documentType: preselectedType || '',
      templateId: '',
      format: 'PDF',
    },
  })

  const selectedType = watch('documentType') as RegulatoryDocumentType
  const selectedTemplateId = watch('templateId')
  const selectedFormat = watch('format') as DocumentFormat

  // Filter templates by selected document type
  const availableTemplates = templatesData?.data?.filter(
    (t) => t.documentType === selectedType
  ) || []

  // Auto-select first template when type changes
  useEffect(() => {
    if (availableTemplates.length > 0 && !selectedTemplateId) {
      setValue('templateId', availableTemplates[0].id)
    }
  }, [availableTemplates, selectedTemplateId, setValue])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        documentType: preselectedType || '',
        templateId: '',
        format: 'PDF',
      })
      setActiveTab('select')
      setPreviewContent(null)
    }
  }, [open, preselectedType, reset])

  // Handle preview
  const handlePreview = async () => {
    if (!selectedTemplateId || !selectedType) return

    setPreviewLoading(true)
    try {
      const result = await previewMutation.mutateAsync({
        templateId: selectedTemplateId,
        clientId,
      })
      setPreviewContent(result.previewUrl || 'Prévisualisation générée')
      setActiveTab('preview')
    } catch {
      // Error handled by mutation
    } finally {
      setPreviewLoading(false)
    }
  }

  // Handle generate
  const onSubmit = async (data: GenerateDocumentFormData) => {
    try {
      const result = await generateMutation.mutateAsync({
        clientId,
        affaireId,
        operationId,
        templateId: data.templateId,
        documentType: data.documentType as RegulatoryDocumentType,
        format: data.format as DocumentFormat,
      })
      onSuccess?.(result.id)
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    reset()
    setPreviewContent(null)
    setActiveTab('select')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5 text-[#7373FF]" />
            Générer un document réglementaire
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le type de document à générer pour {clientName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'select' | 'preview')} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select" className="gap-2">
              <FileText className="h-4 w-4" />
              Sélection
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2" disabled={!selectedTemplateId}>
              <Eye className="h-4 w-4" />
              Prévisualisation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="flex-1 overflow-auto mt-4">
            <form id="generate-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Document Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Type de document *</Label>
                
                {templatesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(DOCUMENT_CATEGORIES).map(([category, types]) => (
                      <div key={category} className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {category}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {types.map((type) => {
                            const hasTemplate = templatesData?.data?.some(
                              (t) => t.documentType === type
                            )
                            const isSelected = selectedType === type

                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setValue('documentType', type)
                                  setValue('templateId', '')
                                }}
                                disabled={!hasTemplate}
                                className={cn(
                                  'flex items-center gap-2 p-3 rounded-lg border text-left transition-all',
                                  isSelected
                                    ? 'border-[#7373FF] bg-[#7373FF]/5 ring-1 ring-[#7373FF]'
                                    : 'border-gray-200 hover:border-gray-300',
                                  !hasTemplate && 'opacity-50 cursor-not-allowed'
                                )}
                              >
                                <FileCheck className={cn(
                                  'h-4 w-4 flex-shrink-0',
                                  isSelected ? 'text-[#7373FF]' : 'text-gray-400'
                                )} />
                                <span className={cn(
                                  'text-sm',
                                  isSelected ? 'font-medium text-gray-900' : 'text-gray-700'
                                )}>
                                  {REGULATORY_DOCUMENT_TYPE_LABELS[type as RegulatoryDocumentType]}
                                </span>
                                {!hasTemplate && (
                                  <Badge variant="secondary" size="xs" className="ml-auto">
                                    Indisponible
                                  </Badge>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.documentType && (
                  <p className="text-xs text-rose-500">{errors.documentType.message}</p>
                )}
              </div>

              {/* Template Selection */}
              {selectedType && availableTemplates.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="templateId">Template *</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(value) => setValue('templateId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.name}</span>
                            <Badge variant="outline" size="xs">
                              {template.associationType}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.templateId && (
                    <p className="text-xs text-rose-500">{errors.templateId.message}</p>
                  )}
                </div>
              )}

              {/* Format Selection */}
              {selectedTemplateId && (
                <div className="space-y-2">
                  <Label>Format d'export</Label>
                  <div className="flex gap-3">
                    {DOCUMENT_FORMATS.map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setValue('format', format)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                          selectedFormat === format
                            ? 'border-[#7373FF] bg-[#7373FF]/5 ring-1 ring-[#7373FF]'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <FileText className={cn(
                          'h-4 w-4',
                          selectedFormat === format ? 'text-[#7373FF]' : 'text-gray-400'
                        )} />
                        <span className={cn(
                          'text-sm',
                          selectedFormat === format ? 'font-medium' : ''
                        )}>
                          {format}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box */}
              {selectedTemplateId && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Données pré-remplies</p>
                    <p className="mt-1 text-blue-700">
                      Le document sera automatiquement pré-rempli avec les informations du client
                      (identité, coordonnées, situation patrimoniale, profil de risque).
                    </p>
                  </div>
                </div>
              )}
            </form>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#7373FF]" />
                <p className="mt-3 text-sm text-gray-500">Génération de la prévisualisation...</p>
              </div>
            ) : previewContent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-900">
                      Prévisualisation prête
                    </span>
                  </div>
                  <Badge variant="outline">
                    {REGULATORY_DOCUMENT_TYPE_LABELS[selectedType]}
                  </Badge>
                </div>
                
                <div className="border rounded-lg p-6 bg-white min-h-[300px]">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-600 text-center">
                      Aperçu du document pour <strong>{clientName}</strong>
                    </p>
                    <div className="mt-4 p-4 bg-gray-50 rounded border border-dashed border-gray-300">
                      <p className="text-xs text-gray-500 text-center">
                        Le document sera généré avec les données actuelles du client.
                        <br />
                        Cliquez sur "Générer" pour créer le document final.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Eye className="h-8 w-8 mb-3" />
                <p className="text-sm">Cliquez sur "Prévisualiser" pour voir un aperçu</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          
          {activeTab === 'select' && selectedTemplateId && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={previewLoading}
              className="gap-2"
            >
              {previewLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Prévisualiser
            </Button>
          )}
          
          <Button
            type="submit"
            form="generate-form"
            disabled={!selectedTemplateId || isSubmitting || generateMutation.isPending}
            className="gap-2"
          >
            {(isSubmitting || generateMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileOutput className="h-4 w-4" />
            )}
            Générer le document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
