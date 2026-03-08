"use client"

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  useComplianceReclamations,
  useCreateComplianceReclamation,
  useResolveComplianceReclamation,
  useDeleteComplianceReclamation,
} from '@/app/_common/hooks/api/use-compliance-api'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { DataTable, type Column } from '@/app/_common/components/ui/DataTable'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn } from '@/app/_common/lib/utils'
import {
  MessageSquareWarning,
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Eye,
  Trash2,
  ChevronDown,
  X,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Calendar,
} from 'lucide-react'
import { ClientLink } from '@/app/_common/components/ClientLink'
import {
  RECLAMATION_TYPES,
  RECLAMATION_STATUS,
  SLA_SEVERITY,
  RECLAMATION_TYPE_LABELS,
  RECLAMATION_STATUS_LABELS,
  SLA_SEVERITY_LABELS,
  SLA_DEADLINES,
  type Reclamation,
  type ReclamationType,
  type ReclamationStatus,
  type SLASeverity,
} from '@/lib/compliance/types'
import { useConfirmDialog } from '@/app/_common/components/ui/ConfirmDialog'

// ============================================================================
// Types & Schemas
// ============================================================================

interface ReclamationFiltersState {
  status: ReclamationStatus[]
  type: ReclamationType[]
  slaBreachOnly: boolean
}

const createReclamationSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères'),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères'),
  type: z.enum(RECLAMATION_TYPES as unknown as [string, ...string[]], {
    message: 'Le type est requis',
  }),
  severity: z.enum(SLA_SEVERITY as unknown as [string, ...string[]], {
    message: 'La sévérité est requise',
  }),
  internalNotes: z.string().optional(),
})

const resolveReclamationSchema = z.object({
  responseText: z.string().min(20, 'La réponse doit contenir au moins 20 caractères'),
  internalNotes: z.string().optional(),
})

type CreateReclamationFormData = z.infer<typeof createReclamationSchema>
type ResolveReclamationFormData = z.infer<typeof resolveReclamationSchema>

// ============================================================================
// Status & SLA Badge Components
// ============================================================================

const statusColors: Record<ReclamationStatus, string> = {
  RECUE: 'bg-blue-100 text-blue-700 border-blue-200',
  EN_COURS: 'bg-amber-100 text-amber-700 border-amber-200',
  EN_ATTENTE_INFO: 'bg-purple-100 text-purple-700 border-purple-200',
  RESOLUE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOTUREE: 'bg-gray-100 text-gray-700 border-gray-200',
}

const severityColors: Record<SLASeverity, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  CRITICAL: 'bg-rose-100 text-rose-600',
}

function ReclamationStatusBadge({ status }: { status: ReclamationStatus }) {
  return (
    <Badge className={cn('border', statusColors[status])}>
      {RECLAMATION_STATUS_LABELS[status]}
    </Badge>
  )
}

function SLAStatusIndicator({ reclamation }: { reclamation: Reclamation }) {
  const deadline = new Date(reclamation.slaDeadline)
  const now = new Date()
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const isResolved = reclamation.status === 'RESOLUE' || reclamation.status === 'CLOTUREE'
  const isBreached = reclamation.slaBreach || (!isResolved && daysRemaining < 0)
  const isAtRisk = !isResolved && !isBreached && daysRemaining <= 3
  
  if (isResolved) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Résolu</span>
      </div>
    )
  }
  
  if (isBreached) {
    return (
      <div className="flex items-center gap-1.5 text-rose-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">SLA dépassé</span>
      </div>
    )
  }
  
  if (isAtRisk) {
    return (
      <div className="flex items-center gap-1.5 text-amber-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm">{daysRemaining}j restants</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-1.5 text-emerald-600">
      <Clock className="h-4 w-4" />
      <span className="text-sm">{daysRemaining}j restants</span>
    </div>
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
// Create Reclamation Dialog
// ============================================================================

function CreateReclamationDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [selectedType, setSelectedType] = useState<ReclamationType | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<SLASeverity | null>(null)
  
  const createMutation = useCreateComplianceReclamation()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateReclamationFormData>({
    resolver: zodResolver(createReclamationSchema),
  })

  const onSubmit = async (data: CreateReclamationFormData) => {
    try {
      await createMutation.mutateAsync({
        clientId: data.clientId,
        subject: data.subject,
        description: data.description,
        type: data.type as ReclamationType,
        severity: data.severity as SLASeverity,
        internalNotes: data.internalNotes,
      })
      reset()
      setSelectedType(null)
      setSelectedSeverity(null)
      onSuccess()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    reset()
    setSelectedType(null)
    setSelectedSeverity(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-amber-500" />
            Nouvelle réclamation
          </DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle réclamation client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Input
              id="clientId"
              placeholder="ID du client"
              {...register('clientId')}
              className={cn(errors.clientId && 'border-rose-500')}
            />
            {errors.clientId && (
              <p className="text-xs text-rose-500">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              placeholder="Sujet de la réclamation"
              {...register('subject')}
              className={cn(errors.subject && 'border-rose-500')}
            />
            {errors.subject && (
              <p className="text-xs text-rose-500">{errors.subject.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-between', errors.type && 'border-rose-500')}
                  >
                    {selectedType ? RECLAMATION_TYPE_LABELS[selectedType] : 'Sélectionner...'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {RECLAMATION_TYPES.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => {
                        setSelectedType(type)
                        setValue('type', type)
                      }}
                    >
                      {RECLAMATION_TYPE_LABELS[type]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Sévérité *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-between', errors.severity && 'border-rose-500')}
                  >
                    {selectedSeverity ? (
                      <span className="flex items-center gap-2">
                        <Badge className={severityColors[selectedSeverity]} size="xs">
                          {SLA_SEVERITY_LABELS[selectedSeverity]}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ({SLA_DEADLINES[selectedSeverity]}j)
                        </span>
                      </span>
                    ) : (
                      'Sélectionner...'
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {SLA_SEVERITY.map((severity) => (
                    <DropdownMenuItem
                      key={severity}
                      onClick={() => {
                        setSelectedSeverity(severity)
                        setValue('severity', severity)
                      }}
                      className="flex items-center justify-between"
                    >
                      <Badge className={severityColors[severity]} size="sm">
                        {SLA_SEVERITY_LABELS[severity]}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        SLA: {SLA_DEADLINES[severity]} jours
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez la réclamation en détail..."
              rows={4}
              {...register('description')}
              className={cn(errors.description && 'border-rose-500')}
            />
            {errors.description && (
              <p className="text-xs text-rose-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Notes internes</Label>
            <Textarea
              id="internalNotes"
              placeholder="Notes internes (non visibles par le client)..."
              rows={2}
              {...register('internalNotes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>
              Créer la réclamation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Resolve Reclamation Dialog
// ============================================================================

function ResolveReclamationDialog({
  open,
  reclamation,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  reclamation: Reclamation | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const resolveMutation = useResolveComplianceReclamation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResolveReclamationFormData>({
    resolver: zodResolver(resolveReclamationSchema),
  })

  const onSubmit = async (data: ResolveReclamationFormData) => {
    if (!reclamation) return

    try {
      await resolveMutation.mutateAsync({
        id: reclamation.id,
        data: {
          responseText: data.responseText,
          internalNotes: data.internalNotes,
        },
      })
      reset()
      onSuccess()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  if (!reclamation) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Résoudre la réclamation
          </DialogTitle>
          <DialogDescription>
            Enregistrez la réponse apportée au client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{reclamation.reference}</span>
              <Badge className={severityColors[reclamation.severity]} size="sm">
                {SLA_SEVERITY_LABELS[reclamation.severity]}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{reclamation.subject}</p>
            <ClientLink
              clientId={reclamation.clientId}
              showAvatar={false}
              className="text-xs"
            />
          </div>

          {reclamation.slaBreach && (
            <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800">
                <p className="font-medium">SLA dépassé</p>
                <p className="mt-1">
                  Cette réclamation a dépassé le délai SLA. Documentez les raisons du retard.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="responseText">Réponse au client *</Label>
            <Textarea
              id="responseText"
              placeholder="Décrivez la réponse apportée au client..."
              rows={5}
              {...register('responseText')}
              className={cn(errors.responseText && 'border-rose-500')}
            />
            {errors.responseText && (
              <p className="text-xs text-rose-500">{errors.responseText.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Notes internes</Label>
            <Textarea
              id="internalNotes"
              placeholder="Notes internes sur la résolution..."
              rows={2}
              {...register('internalNotes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              loading={isSubmitting || resolveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Résoudre la réclamation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

function ReclamationsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; reclamation: Reclamation | null }>({
    open: false,
    reclamation: null,
  })

  const [filters, setFilters] = useState<ReclamationFiltersState>(() => ({
    status: [],
    type: [],
    slaBreachOnly: searchParams.get('slaBreachOnly') === 'true',
  }))

  const { data: reclamationsData, isLoading, refetch } = useComplianceReclamations({
    status: filters.status.length > 0 ? filters.status : undefined,
    type: filters.type.length > 0 ? filters.type : undefined,
    slaBreachOnly: filters.slaBreachOnly || undefined,
  })

  const deleteMutation = useDeleteComplianceReclamation()

  const reclamations = reclamationsData?.data || []

  const columns: Column<Reclamation>[] = [
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
      render: (value, _rec) => (
        <span className="font-mono font-medium text-gray-900">{value as string}</span>
      ),
    },
    {
      key: 'clientId',
      label: 'Client',
      sortable: true,
      render: (_, rec) => (
        <ClientLink
          clientId={rec.clientId}
          showAvatar={false}
        />
      ),
    },
    {
      key: 'subject',
      label: 'Sujet',
      sortable: true,
      render: (value, _rec) => (
        <span className="text-sm text-gray-900 truncate max-w-[200px] block">
          {value as string}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value, _rec) => {
        const type = value as ReclamationType
        return (
          <span className="text-sm text-gray-600">
            {RECLAMATION_TYPE_LABELS[type]}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value, _rec) => {
        const status = value as ReclamationStatus
        return <ReclamationStatusBadge status={status} />
      },
    },
    {
      key: 'slaStatus',
      label: 'SLA',
      render: (_, rec) => <SLAStatusIndicator reclamation={rec} />,
    },
    {
      key: 'slaDeadline',
      label: 'Échéance',
      sortable: true,
      render: (value, _rec) => (
        <span className="text-sm text-gray-600">
          {new Date(value as string | Date).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, rec) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/dashboard/conformite/reclamations/${rec.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
            {rec.status !== 'RESOLUE' && rec.status !== 'CLOTUREE' && (
              <DropdownMenuItem onClick={() => setResolveDialog({ open: true, reclamation: rec })}>
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                Résoudre
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                confirm({
                  title: 'Supprimer la réclamation',
                  description: 'Êtes-vous sûr de vouloir supprimer cette réclamation ? Cette action est irréversible.',
                  variant: 'danger',
                  onConfirm: () => deleteMutation.mutate(rec.id)
                })
              }}
              className="text-rose-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6 pb-8">
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
              <div className="p-2 bg-amber-50 rounded-xl">
                <MessageSquareWarning className="h-6 w-6 text-amber-600" />
              </div>
              Réclamations
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les réclamations clients avec suivi SLA
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle réclamation
        </Button>
      </header>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              Filtres:
            </div>
            
            <FilterDropdown
              label="Statut"
              options={RECLAMATION_STATUS}
              selected={filters.status}
              onChange={(status) => setFilters(prev => ({ ...prev, status }))}
              getLabel={(s) => RECLAMATION_STATUS_LABELS[s]}
            />
            
            <FilterDropdown
              label="Type"
              options={RECLAMATION_TYPES}
              selected={filters.type}
              onChange={(type) => setFilters(prev => ({ ...prev, type }))}
              getLabel={(t) => RECLAMATION_TYPE_LABELS[t]}
            />
            
            <Button
              variant={filters.slaBreachOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, slaBreachOnly: !prev.slaBreachOnly }))}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              SLA dépassé uniquement
            </Button>
          </div>
        </CardContent>
      </Card>

      {reclamations.length === 0 && !isLoading ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="Aucune réclamation trouvée"
          description="Enregistrez une nouvelle réclamation client."
          action={{
            label: "Nouvelle réclamation",
            onClick: () => setCreateDialogOpen(true),
          }}
        />
      ) : (
        <DataTable
          data={reclamations as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          loading={isLoading}
          searchable
        />
      )}

      <CreateReclamationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false)
          refetch()
        }}
      />

      <ResolveReclamationDialog
        open={resolveDialog.open}
        reclamation={resolveDialog.reclamation}
        onOpenChange={(open) => setResolveDialog({ open, reclamation: open ? resolveDialog.reclamation : null })}
        onSuccess={() => {
          setResolveDialog({ open: false, reclamation: null })
          refetch()
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}

export default function ReclamationsPage() {
  return (
    <Suspense fallback={null}>
      <ReclamationsPageInner />
    </Suspense>
  )
}
