 
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { 
  useCampaigns, 
  useCampaignStats, 
  useDeleteCampaign,
  useSendCampaign,
  useCancelCampaign,
  usePauseCampaign,
  useResumeCampaign
} from '@/app/_common/hooks/use-api'
import { 
  Mail, 
  Plus, 
  Search, 
  Send, 
  Calendar, 
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  XCircle,
  MoreVertical
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/app/_common/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  BROUILLON: { label: 'Brouillon', variant: 'secondary' },
  PROGRAMMEE: { label: 'Programmée', variant: 'info' },
  EN_COURS: { label: 'En cours', variant: 'default' },
  EN_PAUSE: { label: 'En pause', variant: 'warning' },
  ENVOYEE: { label: 'Envoyée', variant: 'success' },
  ANNULEE: { label: 'Annulée', variant: 'destructive' },
  TERMINEE: { label: 'Terminée', variant: 'success' },
}

const TYPE_CONFIG: Record<string, { label: string }> = {
  NEWSLETTER: { label: 'Newsletter' },
  PROMOTIONNELLE: { label: 'Promotionnelle' },
  TRANSACTIONNELLE: { label: 'Transactionnelle' },
  RELATIONNELLE: { label: 'Relationnelle' },
  EVENEMENTIELLE: { label: 'Événementielle' },
}

export default function CampagnesPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    search: '',
  })

  const apiFilters = useMemo(() => {
    const f: any = {}
    if (filters.status !== 'ALL') f.status = filters.status
    if (filters.type !== 'ALL') f.type = filters.type
    if (filters.search) f.search = filters.search
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useCampaigns(apiFilters)
  const { data: statsData } = useCampaignStats()
  const deleteMutation = useDeleteCampaign()
  const sendMutation = useSendCampaign()
  const cancelMutation = useCancelCampaign()
  const pauseMutation = usePauseCampaign()
  const resumeMutation = useResumeCampaign()

  const campaigns = data?.data || []
  const stats = statsData || {
    total: 0,
    byStatus: {} as Record<string, number>,
    totals: {
      recipients: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      errors: 0,
    },
    averageRates: {
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
    },
  }

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `${(value * 100).toFixed(1)}%`
  }

  const handleResetFilters = () => {
    setFilters({ status: 'ALL', type: 'ALL', search: '' })
  }

  const handleSendCampaign = async (id: string) => {
    if (confirm('Voulez-vous vraiment envoyer cette campagne maintenant ?')) {
      await sendMutation.mutateAsync(id)
    }
  }

  const handleCancelCampaign = async (id: string) => {
    if (confirm('Voulez-vous vraiment annuler cette campagne ?')) {
      await cancelMutation.mutateAsync(id)
    }
  }

  const handlePauseCampaign = async (id: string) => {
    await pauseMutation.mutateAsync(id)
  }

  const handleResumeCampaign = async (id: string) => {
    await resumeMutation.mutateAsync(id)
  }

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette campagne ? Cette action est irréversible.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campagnes marketing</h1>
          <p className="text-muted-foreground mt-1">Gestion et suivi de vos campagnes email</p>
        </div>
        <Button onClick={() => router.push('/dashboard/campagnes/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total campagnes</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Emails envoyés</p>
              <p className="text-2xl font-bold mt-1">{stats.totals.sent.toLocaleString('fr-FR')}</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10">
              <Send className="h-5 w-5 text-info" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux d'ouverture moyen</p>
              <p className="text-2xl font-bold mt-1">{formatPercent(stats.averageRates.openRate)}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <Eye className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux de clic moyen</p>
              <p className="text-2xl font-bold mt-1">{formatPercent(stats.averageRates.clickRate)}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <TrendingUp className="h-5 w-5 text-warning" />
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
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous statuts</SelectItem>
              <SelectItem value="BROUILLON">Brouillon</SelectItem>
              <SelectItem value="PROGRAMMEE">Programmée</SelectItem>
              <SelectItem value="EN_COURS">En cours</SelectItem>
              <SelectItem value="EN_PAUSE">En pause</SelectItem>
              <SelectItem value="ENVOYEE">Envoyée</SelectItem>
              <SelectItem value="TERMINEE">Terminée</SelectItem>
              <SelectItem value="ANNULEE">Annulée</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous types</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.search || filters.status !== 'ALL' || filters.type !== 'ALL') && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-destructive">
            <p>Erreur lors du chargement des campagnes</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Réessayer</Button>
          </div>
        </Card>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Aucune campagne"
          description={
            filters.search || filters.status !== 'ALL' || filters.type !== 'ALL'
              ? 'Aucune campagne ne correspond à vos critères.'
              : 'Créez votre première campagne marketing.'
          }
          action={
            !filters.search && filters.status === 'ALL'
              ? { label: 'Créer une campagne', onClick: () => router.push('/dashboard/campagnes/new'), icon: Plus }
              : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Destinataires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Envoyés</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Taux ouverture</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Taux clic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((campaign: any) => {
                  const statusConfig = STATUS_CONFIG[campaign.status]
                  const typeConfig = TYPE_CONFIG[campaign.type]
                  return (
                    <tr key={campaign.id} className="hover:bg-muted">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                          {campaign.subject && (
                            <p className="text-xs text-muted-foreground mt-0.5">{campaign.subject}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {typeConfig.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {campaign.recipientsTotal.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {campaign.recipientsSent.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={campaign.openRate && campaign.openRate > 0.2 ? 'text-success font-medium' : 'text-muted-foreground'}>
                          {formatPercent(campaign.openRate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={campaign.clickRate && campaign.clickRate > 0.05 ? 'text-success font-medium' : 'text-muted-foreground'}>
                          {formatPercent(campaign.clickRate)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {campaign.scheduledAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(campaign.scheduledAt)}
                          </div>
                        ) : campaign.sentAt ? (
                          formatDate(campaign.sentAt)
                        ) : (
                          formatDate(campaign.createdAt)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig.variant} className="text-xs">
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/campagnes/${campaign.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            
                            {campaign.status === 'BROUILLON' && (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/campagnes/${campaign.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Envoyer maintenant
                                </DropdownMenuItem>
                              </>
                            )}

                            {campaign.status === 'PROGRAMMEE' && (
                              <DropdownMenuItem onClick={() => handleCancelCampaign(campaign.id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Annuler
                              </DropdownMenuItem>
                            )}

                            {campaign.status === 'EN_COURS' && (
                              <DropdownMenuItem onClick={() => handlePauseCampaign(campaign.id)}>
                                <PauseCircle className="h-4 w-4 mr-2" />
                                Mettre en pause
                              </DropdownMenuItem>
                            )}

                            {campaign.status === 'EN_PAUSE' && (
                              <DropdownMenuItem onClick={() => handleResumeCampaign(campaign.id)}>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Reprendre
                              </DropdownMenuItem>
                            )}

                            {(campaign.status === 'BROUILLON' || campaign.status === 'ANNULEE') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
