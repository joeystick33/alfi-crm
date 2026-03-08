"use client"

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  useAffaire, 
  useAffaireHistory,
  useUpdateAffaireStatus,
  usePauseAffaire,
  useResumeAffaire,
  useDeleteAffaire,
} from '@/app/_common/hooks/api/use-operations-api'
import { useProvider } from '@/app/_common/hooks/api/use-providers-api'
import { useAffaireDocuments } from '@/app/_common/hooks/api/use-regulatory-documents-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn } from '@/app/_common/lib/utils'
import {
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  Pause,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Package,
  Euro,
  Calendar,
  FileText,
  History,
  AlertTriangle,
  ChevronRight,
  Download,
  Eye,
} from 'lucide-react'
import { ClientLink } from '@/app/_common/components/ClientLink'
import {
  AFFAIRE_STATUS_LABELS,
  AFFAIRE_STATUS_TRANSITIONS,
  PRODUCT_TYPE_LABELS,
  AFFAIRE_SOURCE_LABELS,
  type AffaireStatus,
} from '@/lib/operations/types'

// ============================================================================
// Status Badge Variants
// ============================================================================

const statusBadgeVariants: Record<AffaireStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  PROSPECT: 'default',
  QUALIFICATION: 'info',
  CONSTITUTION: 'primary',
  SIGNATURE: 'warning',
  ENVOYE: 'warning',
  EN_TRAITEMENT: 'warning',
  VALIDE: 'success',
  REJETE: 'danger',
  ANNULE: 'default',
}

const statusIcons: Record<AffaireStatus, React.ElementType> = {
  PROSPECT: Clock,
  QUALIFICATION: FileText,
  CONSTITUTION: FileText,
  SIGNATURE: Edit,
  ENVOYE: Send,
  EN_TRAITEMENT: Clock,
  VALIDE: CheckCircle2,
  REJETE: XCircle,
  ANNULE: XCircle,
}

// ============================================================================
// Status Change Dialog
// ============================================================================

function StatusChangeDialog({
  open,
  onOpenChange,
  currentStatus,
  targetStatus,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: AffaireStatus
  targetStatus: AffaireStatus | null
  onConfirm: (note: string, reason?: string) => void
  isPending: boolean
}) {
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')

  const needsReason = targetStatus === 'REJETE' || targetStatus === 'ANNULE'

  const handleConfirm = () => {
    onConfirm(note, needsReason ? reason : undefined)
    setNote('')
    setReason('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le statut</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={statusBadgeVariants[currentStatus]}>
              {AFFAIRE_STATUS_LABELS[currentStatus]}
            </Badge>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {targetStatus && (
              <Badge variant={statusBadgeVariants[targetStatus]}>
                {AFFAIRE_STATUS_LABELS[targetStatus]}
              </Badge>
            )}
          </div>

          {needsReason && (
            <div>
              <Label htmlFor="reason">
                Raison {targetStatus === 'REJETE' ? 'du rejet' : 'de l\'annulation'} *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez la raison..."
                className="mt-2"
                rows={3}
              />
            </div>
          )}

          <div>
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajouter une note..."
              className="mt-2"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isPending || (needsReason && !reason)}
          >
            {isPending ? 'Mise à jour...' : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Pause Dialog
// ============================================================================

function PauseDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre en pause</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            L'affaire sera mise en pause et apparaîtra dans les affaires en cours.
          </p>
          <div>
            <Label htmlFor="pause-reason">Raison de la pause *</Label>
            <Textarea
              id="pause-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez pourquoi cette affaire est mise en pause..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={() => {
              onConfirm(reason)
              setReason('')
            }} 
            disabled={isPending || !reason}
          >
            {isPending ? 'Mise en pause...' : 'Mettre en pause'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Delete Confirmation Dialog
// ============================================================================

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  reference,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
  reference: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l'affaire</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="font-medium text-rose-900">Cette action est irréversible</p>
              <p className="text-sm text-rose-700 mt-1">
                L'affaire {reference} et tout son historique seront définitivement supprimés.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm} 
            disabled={isPending}
          >
            {isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Info Card Component
// ============================================================================

function InfoCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ElementType
  label: string
  value: string | React.ReactNode
  subValue?: string
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="font-medium text-gray-900 mt-0.5">{value}</p>
        {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// History Timeline Component
// ============================================================================

function HistoryTimeline({
  history,
  loading,
}: {
  history: Array<{
    id: string
    fromStatus: AffaireStatus | null
    toStatus: AffaireStatus
    note: string | null
    changedAt: Date
  }>
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Aucun historique disponible
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const StatusIcon = statusIcons[entry.toStatus]
        return (
          <div key={entry.id} className="flex gap-4">
            <div className="relative">
              <div className={cn(
                'p-2 rounded-full',
                index === 0 ? 'bg-[#7373FF]/10' : 'bg-gray-100'
              )}>
                <StatusIcon className={cn(
                  'h-4 w-4',
                  index === 0 ? 'text-[#7373FF]' : 'text-gray-500'
                )} />
              </div>
              {index < history.length - 1 && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-200" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                {entry.fromStatus && (
                  <>
                    <Badge variant={statusBadgeVariants[entry.fromStatus]} size="xs">
                      {AFFAIRE_STATUS_LABELS[entry.fromStatus]}
                    </Badge>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </>
                )}
                <Badge variant={statusBadgeVariants[entry.toStatus]} size="xs">
                  {AFFAIRE_STATUS_LABELS[entry.toStatus]}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(entry.changedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {entry.note && (
                <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function AffaireDetailPage() {
  const router = useRouter()
  const params = useParams()
  const affaireId = params.id as string

  // Dialogs state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<AffaireStatus | null>(null)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch data
  const { data: affaire, isLoading: affaireLoading } = useAffaire(affaireId)
  const { data: historyData, isLoading: historyLoading } = useAffaireHistory(affaireId)
  const { data: provider, isLoading: providerLoading } = useProvider(affaire?.providerId || '')
  const { data: documentsData, isLoading: documentsLoading } = useAffaireDocuments(affaireId)

  // Mutations
  const updateStatus = useUpdateAffaireStatus()
  const pauseAffaire = usePauseAffaire()
  const resumeAffaire = useResumeAffaire()
  const deleteAffaire = useDeleteAffaire()

  const history = historyData?.data || []
  const generatedDocuments = documentsData?.data || []

  // Get available next statuses
  const availableTransitions = affaire 
    ? AFFAIRE_STATUS_TRANSITIONS[affaire.status] 
    : []

  const handleStatusChange = (status: AffaireStatus) => {
    setTargetStatus(status)
    setStatusDialogOpen(true)
  }

  const confirmStatusChange = async (note: string, reason?: string) => {
    if (!targetStatus) return
    
    await updateStatus.mutateAsync({
      id: affaireId,
      data: {
        status: targetStatus,
        note: note || undefined,
        rejectionReason: targetStatus === 'REJETE' ? reason : undefined,
        cancellationReason: targetStatus === 'ANNULE' ? reason : undefined,
      },
    })
    setStatusDialogOpen(false)
    setTargetStatus(null)
  }

  const handlePause = async (reason: string) => {
    await pauseAffaire.mutateAsync({ id: affaireId, data: { pauseReason: reason } })
    setPauseDialogOpen(false)
  }

  const handleResume = async () => {
    await resumeAffaire.mutateAsync(affaireId)
  }

  const handleDelete = async () => {
    await deleteAffaire.mutateAsync(affaireId)
    router.push('/dashboard/operations/affaires-nouvelles')
  }

  if (affaireLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!affaire) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Affaire non trouvée</h2>
        <p className="text-sm text-gray-500 mt-1">Cette affaire n'existe pas ou a été supprimée.</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/operations/affaires-nouvelles')}
          className="mt-4"
        >
          Retour à la liste
        </Button>
      </div>
    )
  }

  const isPaused = !!affaire.pausedAt
  const isFinalStatus = ['VALIDE', 'REJETE', 'ANNULE'].includes(affaire.status)

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{affaire.reference}</h1>
              <Badge variant={statusBadgeVariants[affaire.status]} size="md">
                {AFFAIRE_STATUS_LABELS[affaire.status]}
              </Badge>
              {isPaused && (
                <Badge variant="warning" size="sm">
                  <Pause className="h-3 w-3 mr-1" />
                  En pause
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Créée le {new Date(affaire.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFinalStatus && (
            <>
              {isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResume}
                  disabled={resumeAffaire.isPending}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Reprendre
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPauseDialogOpen(true)}
                  className="gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/operations/affaires-nouvelles/${affaireId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-rose-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Cards */}
          <Card>
            <CardHeader bordered>
              <CardTitle size="md">Informations</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <ClientLink
                    clientId={affaire.clientId}
                    showAvatar={true}
                    avatarSize="md"
                  />
                </div>
                <InfoCard
                  icon={Package}
                  label="Produit"
                  value={PRODUCT_TYPE_LABELS[affaire.productType]}
                />
                <InfoCard
                  icon={Building2}
                  label="Fournisseur"
                  value={providerLoading ? <Skeleton className="h-4 w-24" /> : provider?.name || 'N/A'}
                />
                <InfoCard
                  icon={Euro}
                  label="Montant estimé"
                  value={affaire.estimatedAmount.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                  subValue={affaire.actualAmount 
                    ? `Réel: ${affaire.actualAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`
                    : undefined
                  }
                />
                <InfoCard
                  icon={FileText}
                  label="Source"
                  value={AFFAIRE_SOURCE_LABELS[affaire.source]}
                />
                <InfoCard
                  icon={Calendar}
                  label="Date cible"
                  value={affaire.targetDate 
                    ? new Date(affaire.targetDate).toLocaleDateString('fr-FR')
                    : 'Non définie'
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Actions */}
          {!isFinalStatus && availableTransitions.length > 0 && (
            <Card>
              <CardHeader bordered>
                <CardTitle size="md">Actions disponibles</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {availableTransitions.map((status) => {
                    const StatusIcon = statusIcons[status]
                    return (
                      <Button
                        key={status}
                        variant={status === 'ANNULE' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleStatusChange(status)}
                        className={cn(
                          'gap-2',
                          status === 'ANNULE' && 'text-rose-600 border-rose-200 hover:bg-rose-50'
                        )}
                      >
                        <StatusIcon className="h-4 w-4" />
                        Passer à "{AFFAIRE_STATUS_LABELS[status]}"
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pause Info */}
          {isPaused && affaire.pauseReason && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Pause className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Affaire en pause</p>
                    <p className="text-sm text-amber-700 mt-1">{affaire.pauseReason}</p>
                    <p className="text-xs text-amber-600 mt-2">
                      Depuis le {new Date(affaire.pausedAt!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection/Cancellation Info */}
          {affaire.status === 'REJETE' && affaire.rejectionReason && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-rose-900">Affaire rejetée</p>
                    <p className="text-sm text-rose-700 mt-1">{affaire.rejectionReason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {affaire.status === 'ANNULE' && affaire.cancellationReason && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Affaire annulée</p>
                    <p className="text-sm text-gray-700 mt-1">{affaire.cancellationReason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* History */}
          <Card>
            <CardHeader bordered>
              <CardTitle size="md" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <HistoryTimeline history={history} loading={historyLoading} />
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader bordered>
              <CardTitle size="md" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents générés
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {documentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : generatedDocuments.length > 0 ? (
                <div className="space-y-2">
                  {generatedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.generatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            doc.status === 'SIGNED' ? 'success' :
                            doc.status === 'FINAL' ? 'primary' :
                            'default'
                          }
                          size="xs"
                        >
                          {doc.status === 'SIGNED' ? 'Signé' :
                           doc.status === 'FINAL' ? 'Final' : 'Brouillon'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="p-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = doc.fileUrl
                            link.download = doc.fileName
                            link.click()
                          }}
                          className="p-1"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Aucun document généré
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Les documents seront affichés ici une fois générés
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Required Documents Checklist */}
          {affaire.requiredDocuments && affaire.requiredDocuments.length > 0 && (
            <Card>
              <CardHeader bordered>
                <CardTitle size="md" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Documents requis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {affaire.requiredDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{doc.documentType}</span>
                      <Badge 
                        variant={
                          doc.status === 'GENERATED' ? 'success' :
                          doc.status === 'PENDING' ? 'warning' :
                          doc.status === 'MISSING' ? 'danger' : 'default'
                        }
                        size="xs"
                      >
                        {doc.status === 'GENERATED' ? 'Généré' :
                         doc.status === 'PENDING' ? 'En attente' :
                         doc.status === 'MISSING' ? 'Manquant' : doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        currentStatus={affaire.status}
        targetStatus={targetStatus}
        onConfirm={confirmStatusChange}
        isPending={updateStatus.isPending}
      />

      <PauseDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        onConfirm={handlePause}
        isPending={pauseAffaire.isPending}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isPending={deleteAffaire.isPending}
        reference={affaire.reference}
      />
    </div>
  )
}
