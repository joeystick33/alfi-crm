"use client"

/**
 * TabRegulatoryDocuments - Regulatory Documents section for Client 360
 * 
 * Features:
 * - Display list of generated regulatory documents with dates
 * - Quick action buttons to generate each document type
 * - Missing documents indicator
 * 
 * @requirements 15.1-15.4
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn, formatDate } from '@/app/_common/lib/utils'
import {
  useClientRegulatoryDocuments,
  useRegulatoryTemplates,
} from '@/app/_common/hooks/api/use-regulatory-documents-api'
import {
  FileText,
  Plus,
  Download,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  FileOutput,
  ChevronRight,
  Loader2,
  PenTool,
  RefreshCw,
} from 'lucide-react'
import {
  REGULATORY_DOCUMENT_TYPES,
  REGULATORY_DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  type RegulatoryDocumentType,
  type GeneratedDocument,
  type DocumentStatus,
} from '@/lib/documents/types'
import DocumentGeneratorDialog from '../documents/DocumentGeneratorDialog'
import DocumentExportDialog from '../documents/DocumentExportDialog'

// ============================================================================
// Props
// ============================================================================

interface TabRegulatoryDocumentsProps {
  clientId: string
  clientName: string
}

// ============================================================================
// Document Status Badge
// ============================================================================

const statusColors: Record<DocumentStatus, string> = {
  DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
  FINAL: 'bg-blue-100 text-blue-700 border-blue-200',
  SIGNED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const statusIcons: Record<DocumentStatus, React.ReactNode> = {
  DRAFT: <Clock className="h-3 w-3" />,
  FINAL: <FileCheck className="h-3 w-3" />,
  SIGNED: <CheckCircle className="h-3 w-3" />,
}

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <Badge className={cn('border gap-1', statusColors[status])}>
      {statusIcons[status]}
      {DOCUMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

// ============================================================================
// Document Categories for Quick Actions
// ============================================================================

const QUICK_ACTION_DOCUMENTS: RegulatoryDocumentType[] = [
  'DER',
  'RECUEIL_INFORMATIONS',
  'LETTRE_MISSION',
  'RAPPORT_MISSION',
  'QUESTIONNAIRE_MIFID',
]

// ============================================================================
// Document Row Component
// ============================================================================

interface DocumentRowProps {
  document: GeneratedDocument
  onView: () => void
  onExport: () => void
}

function DocumentRow({ document, onView, onExport }: DocumentRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      <div className={cn(
        'p-2 rounded-lg',
        document.status === 'SIGNED' ? 'bg-emerald-50' : 'bg-gray-100'
      )}>
        <FileText className={cn(
          'h-5 w-5',
          document.status === 'SIGNED' ? 'text-emerald-600' : 'text-gray-500'
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">
            {REGULATORY_DOCUMENT_TYPE_LABELS[document.documentType as RegulatoryDocumentType]}
          </p>
          <DocumentStatusBadge status={document.status as DocumentStatus} />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          Généré le {formatDate(document.generatedAt)}
          {document.signedAt && ` • Signé le ${formatDate(document.signedAt)}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onView} className="gap-1">
          <Eye className="h-4 w-4" />
          Voir
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              Visualiser
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </DropdownMenuItem>
            {document.status !== 'SIGNED' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <PenTool className="h-4 w-4 mr-2" />
                  Envoyer pour signature
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ============================================================================
// Missing Documents Alert
// ============================================================================

interface MissingDocumentsAlertProps {
  missingTypes: RegulatoryDocumentType[]
  onGenerate: (type: RegulatoryDocumentType) => void
}

function MissingDocumentsAlert({ missingTypes, onGenerate }: MissingDocumentsAlertProps) {
  if (missingTypes.length === 0) return null

  return (
    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-800">Documents manquants</p>
          <p className="text-sm text-amber-700 mt-1">
            Les documents suivants n'ont pas encore été générés pour ce client:
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {missingTypes.map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => onGenerate(type)}
                className="gap-1 bg-white hover:bg-amber-100 border-amber-300"
              >
                <Plus className="h-3 w-3" />
                {REGULATORY_DOCUMENT_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function TabRegulatoryDocuments({ clientId, clientName }: TabRegulatoryDocumentsProps) {
  // State
  const [generatorDialog, setGeneratorDialog] = useState<{
    open: boolean
    preselectedType?: RegulatoryDocumentType
  }>({ open: false })
  const [exportDialog, setExportDialog] = useState<{
    open: boolean
    documents: GeneratedDocument[]
  }>({ open: false, documents: [] })

  // Fetch data
  const { data: documentsData, isLoading, refetch } = useClientRegulatoryDocuments(clientId)
  const { data: templatesData } = useRegulatoryTemplates({ isActive: true })

  const documents = documentsData?.data || []

  // Calculate missing documents
  const missingDocuments = useMemo(() => {
    const generatedTypes = new Set(documents.map((d) => d.documentType))
    const availableTypes = new Set(templatesData?.data?.map((t) => t.documentType) || [])
    
    return QUICK_ACTION_DOCUMENTS.filter(
      (type) => availableTypes.has(type) && !generatedTypes.has(type)
    )
  }, [documents, templatesData?.data])

  // Group documents by type
  const documentsByType = useMemo(() => {
    return documents.reduce<Record<string, GeneratedDocument[]>>((acc, doc) => {
      const type = doc.documentType
      if (!acc[type]) acc[type] = []
      acc[type].push(doc)
      return acc
    }, {})
  }, [documents])

  // Get latest document for each type
  const latestDocuments = useMemo(() => {
    return Object.entries(documentsByType).map(([type, docs]) => {
      const sorted = [...docs].sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      )
      return sorted[0]
    })
  }, [documentsByType])

  // Handlers
  const handleGenerateDocument = (type?: RegulatoryDocumentType) => {
    setGeneratorDialog({ open: true, preselectedType: type })
  }

  const handleExportDocument = (document: GeneratedDocument) => {
    setExportDialog({ open: true, documents: [document] })
  }

  const handleViewDocument = (document: GeneratedDocument) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileOutput className="h-5 w-5 text-[#7373FF]" />
            Documents Réglementaires
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Documents générés pour la conformité réglementaire
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={() => handleGenerateDocument()} className="gap-2">
            <Plus className="h-4 w-4" />
            Générer un document
          </Button>
        </div>
      </div>

      {/* Missing Documents Alert */}
      <MissingDocumentsAlert
        missingTypes={missingDocuments}
        onGenerate={handleGenerateDocument}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_ACTION_DOCUMENTS.map((type) => {
              const hasDocument = documentsByType[type]?.length > 0
              const hasTemplate = templatesData?.data?.some((t) => t.documentType === type)

              return (
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => handleGenerateDocument(type)}
                  disabled={!hasTemplate}
                  className={cn(
                    'flex flex-col items-center gap-2 h-auto py-4 px-3',
                    hasDocument && 'border-emerald-200 bg-emerald-50/50'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    hasDocument ? 'bg-emerald-100' : 'bg-gray-100'
                  )}>
                    {hasDocument ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs text-center leading-tight">
                    {REGULATORY_DOCUMENT_TYPE_LABELS[type].split(' ').slice(0, 2).join(' ')}
                  </span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documents générés</CardTitle>
            <Badge variant="secondary">{documents.length} document(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {latestDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun document généré"
              description="Commencez par générer un document réglementaire pour ce client."
              action={{
                label: "Générer un document",
                onClick: () => handleGenerateDocument(),
              }}
              className="py-12"
            />
          ) : (
            <div className="divide-y">
              {latestDocuments.map((document) => (
                <DocumentRow
                  key={document.id}
                  document={document}
                  onView={() => handleViewDocument(document)}
                  onExport={() => handleExportDocument(document)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Documents by Type */}
      {Object.entries(documentsByType).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique par type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(documentsByType).map(([type, docs]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {REGULATORY_DOCUMENT_TYPE_LABELS[type as RegulatoryDocumentType]}
                  </p>
                  <Badge variant="outline" size="xs">{docs.length} version(s)</Badge>
                </div>
                <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                  {docs
                    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                    .slice(0, 3)
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <div className="flex items-center gap-2">
                          <DocumentStatusBadge status={doc.status as DocumentStatus} />
                          <span className="text-gray-500">
                            {formatDate(doc.generatedAt)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                          className="h-7 gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Voir
                        </Button>
                      </div>
                    ))}
                  {docs.length > 3 && (
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                      Voir {docs.length - 3} autre(s) version(s)
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Generator Dialog */}
      <DocumentGeneratorDialog
        open={generatorDialog.open}
        onOpenChange={(open) => setGeneratorDialog({ open, preselectedType: undefined })}
        clientId={clientId}
        clientName={clientName}
        preselectedType={generatorDialog.preselectedType}
        onSuccess={() => {
          setGeneratorDialog({ open: false })
          refetch()
        }}
      />

      {/* Export Dialog */}
      <DocumentExportDialog
        open={exportDialog.open}
        onOpenChange={(open) => setExportDialog({ open, documents: [] })}
        documents={exportDialog.documents}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
