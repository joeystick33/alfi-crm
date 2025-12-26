"use client"

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  useComplianceControls,
  useCreateComplianceControl,
  useCompleteComplianceControl,
  useDeleteComplianceControl,
} from '@/app/_common/hooks/api/use-compliance-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Slider } from '@/app/_common/components/ui/Slider'
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
  ClipboardCheck,
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Eye,
  Trash2,
  ChevronDown,
  X,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import {
  CONTROL_TYPES,
  CONTROL_STATUS,
  CONTROL_PRIORITY,
  CONTROL_TYPE_LABELS,
  CONTROL_STATUS_LABELS,
  CONTROL_PRIORITY_LABELS,
  RISK_LEVEL_LABELS,
  calculateRiskLevel,
  type ComplianceControl,
  type ControlType,
  type ControlStatus,
  type ControlPriority,
  type RiskLevel,
} from '@/lib/compliance/types'
import { useConfirmDialog } from '@/app/_common/components/ui/ConfirmDialog'

// ============================================================================
// Types & Schemas
// ============================================================================

interface ControlFiltersState {
  status: ControlStatus[]
  type: ControlType[]
  priority: ControlPriority[]
  isACPRMandatory: boolean | null
  overdueOnly: boolean
}

const createControlSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  type: z.enum(CONTROL_TYPES as unknown as [string, ...string[]], {
    message: 'Le type de contrôle est requis',
  }),
  priority: z.enum(CONTROL_PRIORITY as unknown as [string, ...string[]], {
    message: 'La priorité est requise',
  }),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'La date d\'échéance est requise'),
  isACPRMandatory: z.boolean().default(false),
})

const completeControlSchema = z.object({
  findings: z.string().min(10, 'Les conclusions doivent contenir au moins 10 caractères'),
  recommendations: z.string().optional(),
  score: z.number().min(0).max(100),
})

type CreateControlFormData = {
  clientId: string
  type: string
  priority: string
  dueDate: string
  description?: string
  isACPRMandatory: boolean
}
type CompleteControlFormData = z.infer<typeof completeControlSchema>

// ============================================================================
// Status & Risk Badge Components
// ============================================================================

const statusColors: Record<ControlStatus, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-700 border-gray-200',
  EN_COURS: 'bg-blue-100 text-blue-700 border-blue-200',
  TERMINE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EN_RETARD: 'bg-rose-100 text-rose-700 border-rose-200',
}

const priorityColors: Record<ControlPriority, string> = {
  BASSE: 'bg-gray-100 text-gray-600',
  MOYENNE: 'bg-blue-100 text-blue-600',
  HAUTE: 'bg-orange-100 text-orange-600',
  URGENTE: 'bg-rose-100 text-rose-600',
}

const riskColors: Record<RiskLevel, string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-rose-100 text-rose-700',
}

function ControlStatusBadge({ status }: { status: ControlStatus }) {
  return (
    <Badge className={cn('border', statusColors[status])}>
      {CONTROL_STATUS_LABELS[status]}
    </Badge>
  )
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge className={riskColors[level]}>
      {RISK_LEVEL_LABELS[level]}
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
// Create Control Dialog
// ============================================================================

function CreateControlDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [selectedType, setSelectedType] = useState<ControlType | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<ControlPriority | null>(null)
  
  const createMutation = useCreateComplianceControl()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateControlFormData>({
    resolver: zodResolver(createControlSchema) as unknown as Parameters<typeof useForm<CreateControlFormData>>[0]['resolver'],
    defaultValues: {
      isACPRMandatory: false,
    },
  })

  const onSubmit = async (data: CreateControlFormData) => {
    try {
      await createMutation.mutateAsync({
        clientId: data.clientId,
        type: data.type as ControlType,
        priority: data.priority as ControlPriority,
        description: data.description,
        dueDate: data.dueDate,
        isACPRMandatory: data.isACPRMandatory,
      })
      reset()
      setSelectedType(null)
      setSelectedPriority(null)
      onSuccess()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    reset()
    setSelectedType(null)
    setSelectedPriority(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-violet-500" />
            Nouveau contrôle
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau contrôle de conformité ACPR
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de contrôle *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-between', errors.type && 'border-rose-500')}
                  >
                    {selectedType ? CONTROL_TYPE_LABELS[selectedType] : 'Sélectionner...'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {CONTROL_TYPES.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => {
                        setSelectedType(type)
                        setValue('type', type)
                      }}
                    >
                      {CONTROL_TYPE_LABELS[type]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Priorité *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-between', errors.priority && 'border-rose-500')}
                  >
                    {selectedPriority ? CONTROL_PRIORITY_LABELS[selectedPriority] : 'Sélectionner...'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {CONTROL_PRIORITY.map((priority) => (
                    <DropdownMenuItem
                      key={priority}
                      onClick={() => {
                        setSelectedPriority(priority)
                        setValue('priority', priority)
                      }}
                    >
                      <Badge className={cn('mr-2', priorityColors[priority])} size="xs">
                        {CONTROL_PRIORITY_LABELS[priority]}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Date d'échéance *</Label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              className={cn(errors.dueDate && 'border-rose-500')}
            />
            {errors.dueDate && (
              <p className="text-xs text-rose-500">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du contrôle..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isACPRMandatory"
              {...register('isACPRMandatory')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isACPRMandatory" className="font-normal">
              Contrôle obligatoire ACPR
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>
              Créer le contrôle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Complete Control Dialog
// ============================================================================

function CompleteControlDialog({
  open,
  control,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  control: ComplianceControl | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [score, setScore] = useState(50)
  const completeMutation = useCompleteComplianceControl()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompleteControlFormData>({
    resolver: zodResolver(completeControlSchema),
    defaultValues: {
      score: 50,
    },
  })

  const riskLevel = calculateRiskLevel(score)

  const onSubmit = async (data: CompleteControlFormData) => {
    if (!control) return

    try {
      await completeMutation.mutateAsync({
        id: control.id,
        data: {
          findings: data.findings,
          recommendations: data.recommendations,
          score: data.score,
        },
      })
      reset()
      setScore(50)
      onSuccess()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    reset()
    setScore(50)
    onOpenChange(false)
  }

  if (!control) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Compléter le contrôle
          </DialogTitle>
          <DialogDescription>
            Enregistrez les résultats du contrôle
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">
              {CONTROL_TYPE_LABELS[control.type]}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Client #{control.clientId.slice(0, 8)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="findings">Conclusions *</Label>
            <Textarea
              id="findings"
              placeholder="Décrivez les conclusions du contrôle..."
              rows={4}
              {...register('findings')}
              className={cn(errors.findings && 'border-rose-500')}
            />
            {errors.findings && (
              <p className="text-xs text-rose-500">{errors.findings.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommandations</Label>
            <Textarea
              id="recommendations"
              placeholder="Recommandations éventuelles..."
              rows={3}
              {...register('recommendations')}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Score de risque: {score}/100</Label>
              <RiskLevelBadge level={riskLevel} />
            </div>
            <Slider
              value={[score]}
              onValueChange={([value]) => {
                setScore(value)
                setValue('score', value)
              }}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Faible</span>
              <span>Moyen</span>
              <span>Élevé</span>
              <span>Critique</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              loading={isSubmitting || completeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Compléter le contrôle
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

export default function ControlesACPRPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [completeDialog, setCompleteDialog] = useState<{ open: boolean; control: ComplianceControl | null }>({
    open: false,
    control: null,
  })

  const [filters, setFilters] = useState<ControlFiltersState>(() => ({
    status: [],
    type: [],
    priority: [],
    isACPRMandatory: null,
    overdueOnly: searchParams.get('overdueOnly') === 'true',
  }))

  const { data: controlsData, isLoading, refetch } = useComplianceControls({
    status: filters.status.length > 0 ? filters.status : undefined,
    type: filters.type.length > 0 ? filters.type : undefined,
    priority: filters.priority.length > 0 ? filters.priority : undefined,
    isACPRMandatory: filters.isACPRMandatory ?? undefined,
    overdueOnly: filters.overdueOnly || undefined,
  })

  const deleteMutation = useDeleteComplianceControl()

  const controls = controlsData?.data || []

  const columns: Column<ComplianceControl>[] = [
    {
      key: 'clientId',
      label: 'Client',
      sortable: true,
      render: (_, control) => (
        <span className="font-medium text-gray-900">
          Client #{control.clientId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value, _control) => {
        const type = value as ControlType
        return (
          <span className="text-sm text-gray-700">
            {CONTROL_TYPE_LABELS[type]}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value, _control) => {
        const status = value as ControlStatus
        return <ControlStatusBadge status={status} />
      },
    },
    {
      key: 'priority',
      label: 'Priorité',
      sortable: true,
      render: (value, _control) => {
        const priority = value as ControlPriority
        return (
          <Badge className={priorityColors[priority]} size="sm">
            {CONTROL_PRIORITY_LABELS[priority]}
          </Badge>
        )
      },
    },
    {
      key: 'dueDate',
      label: 'Échéance',
      sortable: true,
      render: (value, control) => {
        const dueDate = new Date(value as string | Date)
        const now = new Date()
        const isOverdue = control.status !== 'TERMINE' && dueDate < now

        return (
          <div className={cn('flex items-center gap-1.5', isOverdue && 'text-rose-600')}>
            {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
            <span className="text-sm">
              {dueDate.toLocaleDateString('fr-FR')}
            </span>
          </div>
        )
      },
    },
    {
      key: 'riskLevel',
      label: 'Risque',
      sortable: true,
      render: (value, _control) => {
        const level = value as RiskLevel | null
        return level ? <RiskLevelBadge level={level} /> : <span className="text-gray-400">—</span>
      },
    },
    {
      key: 'actions',
      label: '',
      render: (_, control) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/dashboard/conformite/controles/${control.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
            {control.status !== 'TERMINE' && (
              <DropdownMenuItem onClick={() => setCompleteDialog({ open: true, control })}>
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                Compléter
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                confirm({
                  title: 'Supprimer le contrôle',
                  description: 'Êtes-vous sûr de vouloir supprimer ce contrôle ? Cette action est irréversible.',
                  variant: 'danger',
                  onConfirm: () => deleteMutation.mutate(control.id)
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
              <div className="p-2 bg-violet-50 rounded-xl">
                <ClipboardCheck className="h-6 w-6 text-violet-600" />
              </div>
              Contrôles ACPR
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez vos contrôles périodiques de conformité
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau contrôle
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
              options={CONTROL_STATUS}
              selected={filters.status}
              onChange={(status) => setFilters(prev => ({ ...prev, status }))}
              getLabel={(s) => CONTROL_STATUS_LABELS[s]}
            />
            
            <FilterDropdown
              label="Type"
              options={CONTROL_TYPES}
              selected={filters.type}
              onChange={(type) => setFilters(prev => ({ ...prev, type }))}
              getLabel={(t) => CONTROL_TYPE_LABELS[t]}
            />
            
            <FilterDropdown
              label="Priorité"
              options={CONTROL_PRIORITY}
              selected={filters.priority}
              onChange={(priority) => setFilters(prev => ({ ...prev, priority }))}
              getLabel={(p) => CONTROL_PRIORITY_LABELS[p]}
            />
            
            <Button
              variant={filters.isACPRMandatory === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                isACPRMandatory: prev.isACPRMandatory === true ? null : true 
              }))}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              ACPR obligatoire
            </Button>
            
            <Button
              variant={filters.overdueOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, overdueOnly: !prev.overdueOnly }))}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              En retard uniquement
            </Button>
          </div>
        </CardContent>
      </Card>

      {controls.length === 0 && !isLoading ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Aucun contrôle trouvé"
          description="Créez votre premier contrôle de conformité ACPR."
          action={{
            label: "Créer un contrôle",
            onClick: () => setCreateDialogOpen(true),
          }}
        />
      ) : (
        <DataTable
          data={controls as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          loading={isLoading}
          searchable
        />
      )}

      <CreateControlDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false)
          refetch()
        }}
      />

      <CompleteControlDialog
        open={completeDialog.open}
        control={completeDialog.control}
        onOpenChange={(open) => setCompleteDialog({ open, control: open ? completeDialog.control : null })}
        onSuccess={() => {
          setCompleteDialog({ open: false, control: null })
          refetch()
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  )
}
