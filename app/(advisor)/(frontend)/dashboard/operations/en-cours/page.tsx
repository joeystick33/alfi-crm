"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useAffairesEnCours,
  useResumeAffaire,
  usePauseAffaire,
  useSendAffaireReminder,
  useUpdateAffaireStatus,
} from '@/app/_common/hooks/api/use-operations-api'
import { useProviders } from '@/app/_common/hooks/api/use-providers-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Label } from '@/app/_common/components/ui/Label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { cn } from '@/app/_common/lib/utils'
import {
  Clock,
  Play,
  Pause,
  Send,
  XCircle,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  FileText,
  Building2,
  Euro,
  Calendar,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { ClientLink } from '@/app/_common/components/ClientLink'
import {
  AFFAIRE_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  type AffaireStatus,
  type ProductType,
  type InactivityCategory,
} from '@/lib/operations/types'

// ============================================================================
// Types
// ============================================================================

interface AffaireEnCours {
  id: string
  reference: string
  clientId: string
  productType: ProductType
  providerId: string
  status: AffaireStatus
  estimatedAmount: number
  lastActivityAt: Date
  pausedAt: Date | null
  pauseReason: string | null
  daysSinceActivity: number
  inactivityCategory: InactivityCategory
  missingDocumentsCount: number
  blockingIssues: string[]
  createdAt: Date
}

// ============================================================================
// Inactivity Colors
// ============================================================================

const inactivityColors: Record<InactivityCategory, { bg: string; text: string; border: string }> = {
  GREEN: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ORANGE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  RED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

const inactivityLabels: Record<InactivityCategory, string> = {
  GREEN: 'Récent',
  ORANGE: 'À surveiller',
  RED: 'Critique',
}

// ============================================================================
// Cancel Dialog
// ============================================================================

function CancelDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  reference,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isPending: boolean
  reference: string
}) {
  const [reason, setReason] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler l'affaire</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="font-medium text-rose-900">Confirmer l'annulation</p>
              <p className="text-sm text-rose-700 mt-1">
                L'affaire {reference} sera définitivement annulée.
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="cancel-reason">Raison de l'annulation *</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez pourquoi cette affaire est annulée..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Retour
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              onConfirm(reason)
              setReason('')
            }} 
            disabled={isPending || !reason}
          >
            {isPending ? 'Annulation...' : 'Annuler l\'affaire'}
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
            L'affaire sera marquée comme intentionnellement en pause.
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
// Affaire Card Component
// ============================================================================

function AffaireEnCoursCard({
  affaire,
  providerName,
  onView,
  onResume,
  onPause,
  onRemind,
  onCancel,
}: {
  affaire: AffaireEnCours
  providerName: string
  onView: () => void
  onResume: () => void
  onPause: () => void
  onRemind: () => void
  onCancel: () => void
}) {
  const colors = inactivityColors[affaire.inactivityCategory]
  const isPaused = !!affaire.pausedAt

  return (
    <Card className={cn('relative overflow-hidden', colors.border, 'border-l-4')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <button 
                onClick={onView}
                className="text-base font-semibold text-[#7373FF] hover:underline"
              >
                {affaire.reference}
              </button>
              <Badge variant="default" size="sm">
                {AFFAIRE_STATUS_LABELS[affaire.status]}
              </Badge>
              {isPaused && (
                <Badge variant="warning" size="xs">
                  <Pause className="h-3 w-3 mr-1" />
                  En pause
                </Badge>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <ClientLink
                clientId={affaire.clientId}
                showAvatar={true}
                avatarSize="sm"
              />
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{PRODUCT_TYPE_LABELS[affaire.productType]}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{providerName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Euro className="h-4 w-4 text-gray-400" />
                <span>{affaire.estimatedAmount.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                })}</span>
              </div>
            </div>

            {/* Inactivity & Issues */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                colors.bg, colors.text
              )}>
                <Clock className="h-3 w-3" />
                {affaire.daysSinceActivity} jour{affaire.daysSinceActivity > 1 ? 's' : ''} d'inactivité
              </div>
              
              {affaire.missingDocumentsCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                  <FileText className="h-3 w-3" />
                  {affaire.missingDocumentsCount} document{affaire.missingDocumentsCount > 1 ? 's' : ''} manquant{affaire.missingDocumentsCount > 1 ? 's' : ''}
                </div>
              )}

              {affaire.blockingIssues.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                  <AlertTriangle className="h-3 w-3" />
                  {affaire.blockingIssues.length} problème{affaire.blockingIssues.length > 1 ? 's' : ''} bloquant{affaire.blockingIssues.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Pause Reason */}
            {isPaused && affaire.pauseReason && (
              <div className="mt-3 p-2 bg-amber-50 rounded text-sm text-amber-700">
                <span className="font-medium">Raison:</span> {affaire.pauseReason}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isPaused ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onResume}
                className="gap-1"
              >
                <Play className="h-4 w-4" />
                Reprendre
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onView}
                className="gap-1"
              >
                <Play className="h-4 w-4" />
                Reprendre
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRemind}>
                  <Send className="h-4 w-4 mr-2" />
                  Relancer client
                </DropdownMenuItem>
                {!isPaused && (
                  <DropdownMenuItem onClick={onPause}>
                    <Pause className="h-4 w-4 mr-2" />
                    Mettre en pause
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCancel} className="text-rose-600">
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Summary Cards
// ============================================================================

function SummaryCards({
  affaires,
  loading,
}: {
  affaires: AffaireEnCours[]
  loading: boolean
}) {
  const counts = useMemo(() => {
    const green = affaires.filter(a => a.inactivityCategory === 'GREEN').length
    const orange = affaires.filter(a => a.inactivityCategory === 'ORANGE').length
    const red = affaires.filter(a => a.inactivityCategory === 'RED').length
    const withMissingDocs = affaires.filter(a => a.missingDocumentsCount > 0).length
    return { green, orange, red, withMissingDocs, total: affaires.length }
  }, [affaires])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Récentes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.green}</p>
          <p className="text-xs text-emerald-600 mt-1">&lt; 7 jours</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">À surveiller</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.orange}</p>
          <p className="text-xs text-amber-600 mt-1">7-30 jours</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-rose-500">
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Critiques</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.red}</p>
          <p className="text-xs text-rose-600 mt-1">&gt; 30 jours</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-gray-400">
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Docs manquants</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{counts.withMissingDocs}</p>
          <p className="text-xs text-gray-500 mt-1">affaires</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function AffairesEnCoursPage() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterCategory, setFilterCategory] = useState<InactivityCategory | 'ALL'>('ALL')
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [selectedAffaire, setSelectedAffaire] = useState<AffaireEnCours | null>(null)

  // Fetch data
  const { 
    data: affairesData, 
    isLoading, 
    refetch 
  } = useAffairesEnCours()
  
  const { data: providersData } = useProviders()

  const affaires = (affairesData?.data || []) as AffaireEnCours[]
  const providers = providersData?.data || []

  // Create provider lookup map
  const providerMap = useMemo(() => {
    const map = new Map<string, string>()
    providers.forEach(p => map.set(p.id, p.name))
    return map
  }, [providers])

  // Filter affaires
  const filteredAffaires = useMemo(() => {
    if (filterCategory === 'ALL') return affaires
    return affaires.filter(a => a.inactivityCategory === filterCategory)
  }, [affaires, filterCategory])

  // Mutations
  const resumeAffaire = useResumeAffaire()
  const pauseAffaire = usePauseAffaire()
  const sendReminder = useSendAffaireReminder()
  const updateStatus = useUpdateAffaireStatus()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }

  const handleResume = async (id: string) => {
    await resumeAffaire.mutateAsync(id)
  }

  const handlePause = (affaire: AffaireEnCours) => {
    setSelectedAffaire(affaire)
    setPauseDialogOpen(true)
  }

  const confirmPause = async (reason: string) => {
    if (!selectedAffaire) return
    await pauseAffaire.mutateAsync({ id: selectedAffaire.id, data: { pauseReason: reason } })
    setPauseDialogOpen(false)
    setSelectedAffaire(null)
  }

  const handleRemind = async (id: string) => {
    await sendReminder.mutateAsync(id)
  }

  const handleCancel = (affaire: AffaireEnCours) => {
    setSelectedAffaire(affaire)
    setCancelDialogOpen(true)
  }

  const confirmCancel = async (reason: string) => {
    if (!selectedAffaire) return
    await updateStatus.mutateAsync({
      id: selectedAffaire.id,
      data: { status: 'ANNULE', cancellationReason: reason },
    })
    setCancelDialogOpen(false)
    setSelectedAffaire(null)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            Affaires en Cours
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Affaires nécessitant une action ou en attente de documents
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Actualiser
        </Button>
      </header>

      {/* Summary Cards */}
      <SummaryCards affaires={affaires} loading={isLoading} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Filtrer par urgence:</span>
            <div className="flex gap-2">
              {(['ALL', 'GREEN', 'ORANGE', 'RED'] as const).map((category) => (
                <Button
                  key={category}
                  variant={filterCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className={cn(
                    category !== 'ALL' && filterCategory === category && 
                    inactivityColors[category].bg
                  )}
                >
                  {category === 'ALL' ? 'Toutes' : inactivityLabels[category]}
                  {category !== 'ALL' && (
                    <span className="ml-1.5 text-xs">
                      ({affaires.filter(a => a.inactivityCategory === category).length})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affaires List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredAffaires.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={filterCategory !== 'ALL' ? "Aucune affaire dans cette catégorie" : "Aucune affaire en cours"}
          description={
            filterCategory !== 'ALL'
              ? "Modifiez le filtre pour voir d'autres affaires"
              : "Toutes vos affaires sont à jour ou ont été finalisées"
          }
          action={
            filterCategory !== 'ALL'
              ? { label: "Voir toutes", onClick: () => setFilterCategory('ALL') }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAffaires.map((affaire) => (
            <AffaireEnCoursCard
              key={affaire.id}
              affaire={affaire}
              providerName={providerMap.get(affaire.providerId) || 'N/A'}
              onView={() => router.push(`/dashboard/operations/affaires-nouvelles/${affaire.id}`)}
              onResume={() => handleResume(affaire.id)}
              onPause={() => handlePause(affaire)}
              onRemind={() => handleRemind(affaire.id)}
              onCancel={() => handleCancel(affaire)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && filteredAffaires.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {filteredAffaires.length} affaire{filteredAffaires.length > 1 ? 's' : ''} en cours
        </p>
      )}

      {/* Dialogs */}
      <PauseDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        onConfirm={confirmPause}
        isPending={pauseAffaire.isPending}
      />

      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={confirmCancel}
        isPending={updateStatus.isPending}
        reference={selectedAffaire?.reference || ''}
      />
    </div>
  )
}
