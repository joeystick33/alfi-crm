"use client"

import { Suspense, useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  useComplianceDocuments,
  useValidateComplianceDocument,
  useRejectComplianceDocument,
  useDeleteComplianceDocument,
} from '@/app/_common/hooks/api/use-compliance-api'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { DataTable, type Column } from '@/app/_common/components/ui/DataTable'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn } from '@/app/_common/lib/utils'
import {
  FileCheck,
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Download,
  ChevronDown,
  X,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { ClientLink } from '@/app/_common/components/ClientLink'
import {
  KYC_DOCUMENT_TYPES,
  KYC_DOCUMENT_STATUS,
  KYC_DOCUMENT_TYPE_LABELS,
  KYC_DOCUMENT_STATUS_LABELS,
  type KYCDocument,
  type KYCDocumentType,
  type KYCDocumentStatus,
} from '@/lib/compliance/types'
import DocumentUploadDialog from './components/DocumentUploadDialog'
import DocumentValidationDialog from './components/DocumentValidationDialog'
import DocumentRejectionDialog from './components/DocumentRejectionDialog'
import { useConfirmDialog } from '@/app/_common/components/ui/ConfirmDialog'

// ============================================================================
// Types
// ============================================================================

interface DocumentFiltersState {
  status: KYCDocumentStatus[]
  type: KYCDocumentType[]
  clientId: string | null
  expiringSoon: boolean
}

// ============================================================================
// Status Badge Component
// ============================================================================

const statusColors: Record<KYCDocumentStatus, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  VALIDE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJETE: 'bg-rose-100 text-rose-700 border-rose-200',
  EXPIRE: 'bg-gray-100 text-gray-700 border-gray-200',
}

function DocumentStatusBadge({ status }: { status: KYCDocumentStatus }) {
  return (
    <Badge className={cn('border', statusColors[status])}>
      {KYC_DOCUMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

// ============================================================================
// Filter Dropdown Component
// ============================================================================

interface FilterDropdownProps<T extends string> {
  label: string
  options: readonly T[]
  selected: T[]
  onChange: (selected: T[]) => void
  getLabel: (value: T) => string
}

function FilterDropdown<T extends string>({ 
  label, 
  options, 
  selected, 
  onChange,
  getLabel 
}: FilterDropdownProps<T>) {
  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {label}
          {selected.length > 0 && (
            <Badge variant="primary" size="xs">{selected.length}</Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => toggleOption(option)}
            className="flex items-center gap-2"
          >
            <div className={cn(
              'h-4 w-4 rounded border flex items-center justify-center',
              selected.includes(option) 
                ? 'bg-[#7373FF] border-[#7373FF]' 
                : 'border-gray-300'
            )}>
              {selected.includes(option) && (
                <CheckCircle className="h-3 w-3 text-white" />
              )}
            </div>
            {getLabel(option)}
          </DropdownMenuItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange([])}>
              <X className="h-4 w-4 mr-2" />
              Effacer la sélection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Active Filters Display
// ============================================================================

function ActiveFilters({ 
  filters, 
  onRemove, 
  onClearAll 
}: { 
  filters: DocumentFiltersState
  onRemove: (key: keyof DocumentFiltersState, value?: string) => void
  onClearAll: () => void
}) {
  const hasFilters = filters.status.length > 0 || 
    filters.type.length > 0 || 
    filters.clientId || 
    filters.expiringSoon

  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">Filtres actifs:</span>
      
      {filters.status.map(status => (
        <Badge 
          key={status} 
          variant="secondary" 
          className="gap-1 cursor-pointer hover:bg-gray-200"
          onClick={() => onRemove('status', status)}
        >
          {KYC_DOCUMENT_STATUS_LABELS[status]}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      
      {filters.type.map(type => (
        <Badge 
          key={type} 
          variant="secondary" 
          className="gap-1 cursor-pointer hover:bg-gray-200"
          onClick={() => onRemove('type', type)}
        >
          {KYC_DOCUMENT_TYPE_LABELS[type]}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      
      {filters.expiringSoon && (
        <Badge 
          variant="warning" 
          className="gap-1 cursor-pointer hover:bg-amber-200"
          onClick={() => onRemove('expiringSoon')}
        >
          Expire bientôt
          <X className="h-3 w-3" />
        </Badge>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearAll}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Tout effacer
      </Button>
    </div>
  )
}

// ============================================================================
// Document Actions Menu
// ============================================================================

function DocumentActionsMenu({ 
  document,
  onValidate,
  onReject,
  onView,
  onDelete,
}: { 
  document: KYCDocument
  onValidate: () => void
  onReject: () => void
  onView: () => void
  onDelete: () => void
}) {
  const canValidate = document.status === 'EN_ATTENTE'
  const canReject = document.status === 'EN_ATTENTE'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="h-4 w-4 mr-2" />
          Voir le document
        </DropdownMenuItem>
        
        {canValidate && (
          <DropdownMenuItem onClick={onValidate}>
            <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
            Valider
          </DropdownMenuItem>
        )}
        
        {canReject && (
          <DropdownMenuItem onClick={onReject}>
            <XCircle className="h-4 w-4 mr-2 text-rose-600" />
            Rejeter
          </DropdownMenuItem>
        )}
        
        {document.fileUrl && (
          <DropdownMenuItem onClick={() => window.open(document.fileUrl!, '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onDelete} className="text-rose-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

function DocumentsKYCPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [validationDialog, setValidationDialog] = useState<{ open: boolean; document: KYCDocument | null }>({ 
    open: false, 
    document: null 
  })
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; document: KYCDocument | null }>({ 
    open: false, 
    document: null 
  })

  // Initialize filters from URL params
  const [filters, setFilters] = useState<DocumentFiltersState>(() => {
    const statusParam = searchParams.get('status')
    const typeParam = searchParams.get('type')
    const expiringSoon = searchParams.get('expiringSoon') === 'true'
    
    return {
      status: statusParam ? statusParam.split(',') as KYCDocumentStatus[] : [],
      type: typeParam ? typeParam.split(',') as KYCDocumentType[] : [],
      clientId: searchParams.get('clientId'),
      expiringSoon,
    }
  })

  // Fetch documents
  const { data: documentsData, isLoading, refetch } = useComplianceDocuments({
    status: filters.status.length > 0 ? filters.status : undefined,
    type: filters.type.length > 0 ? filters.type : undefined,
    clientId: filters.clientId || undefined,
  })

  // Mutations
  const validateMutation = useValidateComplianceDocument()
  const rejectMutation = useRejectComplianceDocument()
  const deleteMutation = useDeleteComplianceDocument()

  // Filter documents
  const documents = useMemo(() => {
    let docs = documentsData?.data || []
    
    if (filters.expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      docs = docs.filter(doc => 
        doc.expiresAt && 
        doc.status === 'VALIDE' &&
        new Date(doc.expiresAt) <= thirtyDaysFromNow &&
        new Date(doc.expiresAt) > new Date()
      )
    }
    
    return docs
  }, [documentsData?.data, filters.expiringSoon])

  // Table columns
  const columns: Column<KYCDocument>[] = [
    {
      key: 'clientId',
      label: 'Client',
      sortable: true,
      render: (_, doc) => (
        <ClientLink
          clientId={doc.clientId}
          showAvatar={true}
          avatarSize="md"
        />
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value, _doc) => {
        const type = value as KYCDocumentType
        return (
          <span className="text-sm text-gray-700">
            {KYC_DOCUMENT_TYPE_LABELS[type]}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value, _doc) => {
        const status = value as KYCDocumentStatus
        return <DocumentStatusBadge status={status} />
      },
    },
    {
      key: 'createdAt',
      label: 'Date upload',
      sortable: true,
      render: (value, _doc) => (
        <span className="text-sm text-gray-600">
          {new Date(value as string | Date).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      label: 'Expiration',
      sortable: true,
      render: (value, doc) => {
        const date = value as Date | string | null
        if (!date) return <span className="text-sm text-gray-400">—</span>
        
        const expiresAt = new Date(date)
        const now = new Date()
        const daysUntil = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (doc.status === 'EXPIRE' || daysUntil < 0) {
          return (
            <div className="flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-sm">Expiré</span>
            </div>
          )
        }
        
        if (daysUntil <= 30) {
          return (
            <div className="flex items-center gap-1.5 text-amber-600">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-sm">{daysUntil}j</span>
            </div>
          )
        }
        
        return (
          <span className="text-sm text-gray-600">
            {expiresAt.toLocaleDateString('fr-FR')}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      render: (_, doc) => (
        <DocumentActionsMenu
          document={doc}
          onValidate={() => setValidationDialog({ open: true, document: doc })}
          onReject={() => setRejectionDialog({ open: true, document: doc })}
          onView={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
          onDelete={() => {
            confirm({
              title: 'Supprimer le document',
              description: 'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.',
              variant: 'danger',
              onConfirm: () => deleteMutation.mutate(doc.id)
            })
          }}
        />
      ),
    },
  ]

  // Filter handlers
  const handleRemoveFilter = (key: keyof DocumentFiltersState, value?: string) => {
    setFilters(prev => {
      if (key === 'status' && value) {
        return { ...prev, status: prev.status.filter(s => s !== value) }
      }
      if (key === 'type' && value) {
        return { ...prev, type: prev.type.filter(t => t !== value) }
      }
      if (key === 'expiringSoon') {
        return { ...prev, expiringSoon: false }
      }
      if (key === 'clientId') {
        return { ...prev, clientId: null }
      }
      return prev
    })
  }

  const handleClearAllFilters = () => {
    setFilters({
      status: [],
      type: [],
      clientId: null,
      expiringSoon: false,
    })
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/conformite')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <FileCheck className="h-6 w-6 text-blue-600" />
              </div>
              Documents KYC
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les documents de conformité de vos clients
            </p>
          </div>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau document
        </Button>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="h-4 w-4" />
                Filtres:
              </div>
              
              <FilterDropdown
                label="Statut"
                options={KYC_DOCUMENT_STATUS}
                selected={filters.status}
                onChange={(status) => setFilters(prev => ({ ...prev, status }))}
                getLabel={(s) => KYC_DOCUMENT_STATUS_LABELS[s]}
              />
              
              <FilterDropdown
                label="Type"
                options={KYC_DOCUMENT_TYPES}
                selected={filters.type}
                onChange={(type) => setFilters(prev => ({ ...prev, type }))}
                getLabel={(t) => KYC_DOCUMENT_TYPE_LABELS[t]}
              />
              
              <Button
                variant={filters.expiringSoon ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, expiringSoon: !prev.expiringSoon }))}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Expire bientôt
              </Button>
            </div>
            
            <ActiveFilters 
              filters={filters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      {documents.length === 0 && !isLoading ? (
        <EmptyState
          icon={FileCheck}
          title="Aucun document trouvé"
          description={
            filters.status.length > 0 || filters.type.length > 0 || filters.expiringSoon
              ? "Aucun document ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
              : "Commencez par ajouter un document KYC pour un client."
          }
          action={{
            label: "Ajouter un document",
            onClick: () => setUploadDialogOpen(true),
          }}
        />
      ) : (
        <DataTable
          data={documents as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          loading={isLoading}
          searchable
          exportable
          onExport={() => {
            try {
              // Générer le CSV des documents
              const csvLines: string[] = []
              csvLines.push('Référence,Type,Client,Statut,Date Expiration,Date Création')
              
              documents.forEach((doc: any) => {
                const clientName = doc.client ? `${doc.client.firstName || ''} ${doc.client.lastName || ''}`.trim() : ''
                const statusLabel = KYC_DOCUMENT_STATUS_LABELS[doc.status as KYCDocumentStatus] || doc.status
                const typeLabel = KYC_DOCUMENT_TYPE_LABELS[doc.type as KYCDocumentType] || doc.type
                const expiryDate = doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('fr-FR') : '-'
                const createdAt = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '-'
                
                csvLines.push(`${doc.reference || doc.id},${typeLabel},${clientName},${statusLabel},${expiryDate},${createdAt}`)
              })
              
              const csvContent = csvLines.join('\n')
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `documents-conformite-${new Date().toISOString().split('T')[0]}.csv`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
            } catch (error) {
              console.error('Erreur export:', error)
            }
          }}
        />
      )}

      {/* Dialogs */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => {
          setUploadDialogOpen(false)
          refetch()
        }}
      />

      <DocumentValidationDialog
        open={validationDialog.open}
        document={validationDialog.document}
        onOpenChange={(open) => setValidationDialog({ open, document: open ? validationDialog.document : null })}
        onSuccess={() => {
          setValidationDialog({ open: false, document: null })
          refetch()
        }}
      />

      <DocumentRejectionDialog
        open={rejectionDialog.open}
        document={rejectionDialog.document}
        onOpenChange={(open) => setRejectionDialog({ open, document: open ? rejectionDialog.document : null })}
        onSuccess={() => {
          setRejectionDialog({ open: false, document: null })
          refetch()
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}

export default function DocumentsKYCPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsKYCPageInner />
    </Suspense>
  )
}
