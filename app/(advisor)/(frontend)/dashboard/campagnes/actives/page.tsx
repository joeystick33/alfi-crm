'use client'
 

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/_common/components/ui/Dialog'
import Textarea from '@/app/_common/components/ui/Textarea'
import {
  useCampaigns,
  useCampaignStats,
  useCreateCampaign,
  usePauseCampaign,
  useSendCampaign,
} from '@/app/_common/hooks/use-api'
import type { CampaignFilters, CampaignListItem, CreateCampaignRequest } from '@/app/_common/lib/api-types'
import type { CampaignStatus, CampaignType } from '@prisma/client'
import {
  Zap,
  Plus,
  Search,
  Mail,
  MessageSquare,
  Send,
  Pause,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BarChart3,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useToast } from '@/app/_common/hooks/use-toast'

const STATUS_CONFIG: Record<CampaignStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info'; icon: any }> = {
  BROUILLON: { label: 'Brouillon', variant: 'secondary', icon: Clock },
  PLANIFIEE: { label: 'Planifiée', variant: 'info', icon: Calendar },
  EN_COURS: { label: 'En cours', variant: 'default', icon: Send },
  TERMINEE: { label: 'Terminée', variant: 'success', icon: CheckCircle2 },
  ANNULEE: { label: 'Annulée', variant: 'destructive', icon: XCircle },
  PAUSE: { label: 'En pause', variant: 'warning', icon: Pause },
}

const TYPE_CONFIG: Record<CampaignType, { label: string; icon: any }> = {
  EMAIL: { label: 'Email', icon: Mail },
  SMS: { label: 'SMS', icon: MessageSquare },
  POSTAL: { label: 'Postal', icon: Send },
  MULTI_CANAL: { label: 'Multi-canal', icon: Zap },
}

export default function CampagnesActivesPage() {
  const { toast } = useToast()
  
  // State
  const [filters, setFilters] = useState<Partial<CampaignFilters>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState<CreateCampaignRequest>({
    name: '',
    description: '',
    type: 'EMAIL',
    subject: '',
    htmlContent: '',
  })

  // Build API filters
  const apiFilters = useMemo<CampaignFilters>(() => {
    const f: CampaignFilters = {}
    if (searchTerm) f.search = searchTerm
    if (statusFilter !== 'ALL') f.status = statusFilter as CampaignStatus
    if (typeFilter !== 'ALL') f.type = typeFilter as CampaignType
    return f
  }, [searchTerm, statusFilter, typeFilter])

  // Queries & Mutations
  const { data: campaignsData, isLoading, isError, error, refetch } = useCampaigns(apiFilters)
  const { data: stats, isLoading: statsLoading } = useCampaignStats()
  const createMutation = useCreateCampaign()
  const pauseMutation = usePauseCampaign()
  const sendMutation = useSendCampaign()

  const campaigns: CampaignListItem[] = campaignsData?.data || []

  // Handlers
  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
  }

  const handleOpenCreate = () => {
    setCreateForm({
      name: '',
      description: '',
      type: 'EMAIL',
      subject: '',
      htmlContent: '',
    })
    setShowCreateDialog(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      toast({ title: 'Erreur', description: 'Le nom est requis', variant: 'destructive' })
      return
    }
    try {
      await createMutation.mutateAsync(createForm)
      toast({ title: 'Succès', description: 'Campagne créée avec succès', variant: 'success' })
      setShowCreateDialog(false)
      refetch()
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message || 'Impossible de créer la campagne', variant: 'destructive' })
    }
  }

  const handlePause = async (id: string) => {
    try {
      await pauseMutation.mutateAsync(id)
      toast({ title: 'Campagne mise en pause', variant: 'success' })
      refetch()
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    }
  }

  const handleSend = async (id: string) => {
    if (!confirm('Envoyer cette campagne maintenant ?')) return
    try {
      await sendMutation.mutateAsync(id)
      toast({ title: 'Campagne envoyée', variant: 'success' })
      refetch()
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    }
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0%'
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" />
            Campagnes Marketing
          </h1>
          <p className="text-muted-foreground mt-1">Gérez vos campagnes email, SMS et multi-canal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total campagnes</p>
              <div className="text-2xl font-bold mt-1">
                {statsLoading ? <div className="h-8 w-12"><Skeleton className="h-full w-full" /></div> : stats?.total || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <div className="text-2xl font-bold mt-1 text-info">
                {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.byStatus?.EN_COURS || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-info/10">
              <Send className="h-5 w-5 text-info" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Terminées</p>
              <div className="text-2xl font-bold mt-1 text-success">
                {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.byStatus?.TERMINEE || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Emails envoyés</p>
              <div className="text-2xl font-bold mt-1">
                {statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.totals?.sent?.toLocaleString() || 0}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux ouverture moy.</p>
              <div className="text-2xl font-bold mt-1 text-orange-600">
                {statsLoading ? <Skeleton className="h-8 w-12" /> : formatPercent(stats?.averageRates?.openRate)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, sujet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error as Error} variant={getErrorVariant(error as Error)} onRetry={() => refetch()} />
      ) : campaigns.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Zap}
            title="Aucune campagne"
            description={
              searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Aucune campagne ne correspond à vos critères.'
                : 'Créez votre première campagne marketing pour toucher vos clients.'
            }
            action={
              !searchTerm && statusFilter === 'ALL' && typeFilter === 'ALL'
                ? { label: 'Créer une campagne', onClick: handleOpenCreate, icon: Plus }
                : undefined
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Campagne</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Destinataires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Performance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map((campaign) => {
                  const statusConfig = STATUS_CONFIG[campaign.status]
                  const typeConfig = TYPE_CONFIG[campaign.type]
                  const StatusIcon = statusConfig.icon
                  const TypeIcon = typeConfig.icon

                  return (
                    <tr key={campaign.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{campaign.name}</p>
                          {campaign.subject && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {campaign.subject}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {typeConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.recipientsTotal?.toLocaleString() || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {campaign.sentAt ? (
                          <div className="text-sm space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Ouv.</span>
                              <span className="font-medium">{formatPercent(campaign.openRate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Clic</span>
                              <span className="font-medium">{formatPercent(campaign.clickRate)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {campaign.scheduledAt ? (
                            <div>
                              <p className="text-muted-foreground text-xs">Planifiée</p>
                              <p>{format(new Date(campaign.scheduledAt), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                            </div>
                          ) : campaign.sentAt ? (
                            <div>
                              <p className="text-muted-foreground text-xs">Envoyée</p>
                              <p>{format(new Date(campaign.sentAt), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-xs">
                              Créée {format(new Date(campaign.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/campagnes/${campaign.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {campaign.status === 'BROUILLON' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSend(campaign.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {campaign.status === 'EN_COURS' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePause(campaign.id)}
                              disabled={pauseMutation.isPending}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nouvelle campagne</DialogTitle>
            <DialogDescription>
              Créez une nouvelle campagne marketing email ou SMS.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom de la campagne *</label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Newsletter Novembre 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={createForm.type}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value as CampaignType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet de l'email</label>
              <Input
                value={createForm.subject || ''}
                onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ex: Découvrez nos conseils patrimoniaux"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={createForm.description || ''}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description interne de la campagne..."
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Créer la campagne
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
