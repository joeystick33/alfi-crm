'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Separator } from '@/app/_common/components/ui/Separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_common/components/ui/Dialog'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  ChartSpline,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Share2,
  Target,
  Users,
  UserPlus,
  Workflow,
} from 'lucide-react'
import { api } from '@/app/_common/lib/api-client'
import { formatCurrency } from '@/app/_common/lib/utils'

const CHANNELS = ['EMAIL', 'PHONE', 'MEETING', 'WHATSAPP']

const STATUS_META = {
  DRAFT: {
    label: 'Brouillon',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  SCHEDULED: {
    label: 'Planifiée',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  EN_COURS: {
    label: 'En cours',
    badge: 'bg-emerald-100 text-emerald-600 border border-emerald-200',
  },
  TERMINE: {
    label: 'Terminée',
    badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  ARCHIVED: {
    label: 'Archivée',
    badge: 'bg-slate-100 text-slate-500 border border-slate-200',
  },
}

const CHANNEL_BADGES = {
  EMAIL: { icon: Mail, className: 'bg-blue-50 text-blue-600 border border-blue-200' },
  PHONE: { icon: Phone, className: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  MEETING: { icon: Users, className: 'bg-purple-50 text-purple-600 border border-purple-200' },
  WHATSAPP: { icon: Share2, className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
}

const INITIAL_ACTION_FORM = {
  title: '',
  objective: '',
  segmentKey: '',
  segmentLabel: '',
  channels: [] as string[],
  scheduledAt: '',
  notes: '',
}

export default function ActionsCommercialesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>({ segments: [], actions: [], summary: null })
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_ACTION_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/advisor/clients/actions') as any
      setData({
        segments: response?.segments || [],
        actions: response?.actions || [],
        summary: response?.summary || null,
      })
    } catch (err) {
      console.error('Erreur chargement actions commerciales:', err)
      setError(err instanceof Error ? err.message : 'Impossible de charger les actions commerciales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateModal = (segment?: any) => {
    setForm({
      title: segment ? `${segment.label} – ${new Date().toLocaleDateString('fr-FR')}` : '',
      objective: segment?.callToAction || '',
      segmentKey: segment?.key || '',
      segmentLabel: segment?.label || '',
      channels: segment?.recommendedChannels || [],
      scheduledAt: '',
      notes: '',
    })
    setFormError(null)
    setCreateOpen(true)
  }

  const toggleChannel = (channel: string) => {
    setForm((prev) => {
      const exists = prev.channels.includes(channel)
      return {
        ...prev,
        channels: exists ? prev.channels.filter((ch) => ch !== channel) : [...prev.channels, channel],
      }
    })
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setFormError(null)
      await api.post('/advisor/clients/actions', {
        title: form.title,
        objective: form.objective,
        segmentKey: form.segmentKey,
        segmentLabel: form.segmentLabel,
        channels: form.channels,
        scheduledAt: form.scheduledAt || null,
        notes: form.notes,
      })
      setCreateOpen(false)
      setForm(INITIAL_ACTION_FORM)
      await loadData()
    } catch (err) {
      console.error('Erreur création action commerciale:', err)
      setFormError(err instanceof Error ? err.message : 'Impossible de créer la campagne')
    } finally {
      setSaving(false)
    }
  }

  const summaryCards = useMemo(() => {
    const totalActions = data.summary?.totalActions || 0
    const estimatedPotential = data.summary?.estimatedPotential || 0
    const activeActions = data.summary?.byStatus?.IN_PROGRESS || 0
    const scheduledActions = data.summary?.byStatus?.SCHEDULED || 0

    return [
      {
        label: 'Campagnes totales',
        value: totalActions,
        description: 'Historique cumulé',
        icon: Workflow,
        accent: 'text-slate-900',
      },
      {
        label: 'Potentiel estimé',
        value: formatCurrency(estimatedPotential),
        description: 'Somme audience pondérée',
        icon: BarChart3,
        accent: 'text-emerald-600',
      },
      {
        label: 'Campagnes actives',
        value: activeActions,
        description: 'En cours de diffusion',
        icon: Target,
        accent: 'text-indigo-600',
      },
      {
        label: 'Campagnes planifiées',
        value: scheduledActions,
        description: 'À lancer prochainement',
        icon: Calendar,
        accent: 'text-blue-600',
      },
    ]
  }, [data.summary])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ChartSpline className="h-3.5 w-3.5 text-primary" />
            Actions Commerciales IA
          </div>
          <h1 className="text-3xl font-bold">Actions Commerciales</h1>
          <p className="text-sm text-muted-foreground">
            Identifiez vos segments à fort potentiel et lancez des campagnes multi-canales ciblées.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={loadData} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Rafraîchir
          </Button>
          <Button onClick={() => router.push('/dashboard/clients/actions/nouvelle')} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <card.icon className={`h-4 w-4 ${card.accent}`} />
                  <span className="text-2xl font-semibold">{card.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-primary" />
              Segments détectés
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Générés automatiquement à partir des clients, prospects et opportunités en base.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl border bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data.segments.map((segment) => (
                <div
                  key={segment.key}
                  className="flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="flex flex-1 gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{segment.label}</h3>
                        <Badge variant="outline" className="text-xs uppercase tracking-wide">
                          {segment.key}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{segment.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>
                          Audience : <span className="font-semibold text-foreground">{segment.statistics?.audienceCount || 0}</span>
                        </span>
                        <span>
                          Potentiel :{' '}
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(segment.statistics?.estimatedPotential || 0)}
                          </span>
                        </span>
                        {segment.recommendedChannels?.length ? (
                          <span className="flex items-center gap-1">
                            Canaux :
                            {segment.recommendedChannels.map((channel: string) => {
                              const channelMeta = CHANNEL_BADGES[channel as keyof typeof CHANNEL_BADGES] || CHANNEL_BADGES.EMAIL
                              const Icon = channelMeta.icon
                              return (
                                <Badge key={`${segment.key}-${channel}`} className={`flex items-center gap-1 ${channelMeta.className}`}>
                                  <Icon className="h-3 w-3" />
                                  {channel}
                                </Badge>
                              )
                            })}
                          </span>
                        ) : null}
                      </div>
                      {segment.audience?.length ? (
                        <div className="space-y-1 rounded-lg border bg-muted/50 p-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Exemples ciblés ({Math.min(segment.audience.length, 3)})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {segment.audience.slice(0, 3).map((item: any, index: number) => (
                              <Badge key={`${segment.key}-audience-${index}`} variant="outline" className="text-[11px]">
                                {item.name || item.email || 'Contact'}
                              </Badge>
                            ))}
                            {segment.audience.length > 3 && (
                              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                                +{segment.audience.length - 3} autres
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button size="sm" className="gap-2" onClick={() => openCreateModal(segment)}>
                      <Target className="h-4 w-4" />
                      Lancer une campagne
                    </Button>
                    {segment.callToAction && (
                      <p className="max-w-xs text-right text-[11px] text-muted-foreground">{segment.callToAction}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Workflow className="h-5 w-5 text-primary" />
            Campagnes commerciales
          </CardTitle>
          <p className="text-xs text-muted-foreground">Suivez vos campagnes en cours et à venir.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl border bg-muted/50" />
              ))}
            </div>
          ) : data.actions.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/50 py-12 text-center">
              <Target className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <h3 className="text-base font-semibold">Aucune campagne encore lancée</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Choisissez un segment détecté et lancez votre première action commerciale.
              </p>
              <Button className="mt-4 gap-2" onClick={() => openCreateModal(data.segments[0])} disabled={!data.segments.length}>
                <UserPlus className="h-4 w-4" />
                Créer une campagne
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.actions.map((action) => {
                const meta = STATUS_META[action.status as keyof typeof STATUS_META] || STATUS_META.DRAFT
                return (
                  <div
                    key={action.id}
                    className="rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{action.title}</h3>
                          <Badge className={meta.badge}>{meta.label}</Badge>
                          <Badge variant="outline" className="text-xs uppercase tracking-wide">
                            {action.segmentLabel}
                          </Badge>
                        </div>
                        {action.objective && <p className="text-sm text-muted-foreground">{action.objective}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>
                            Audience : <span className="font-semibold text-foreground">{action.audienceCount || 0}</span>
                          </span>
                          <span>
                            Potentiel :{' '}
                            <span className="font-semibold text-emerald-600">{formatCurrency(action.estimatedPotential || 0)}</span>
                          </span>
                          {action.scheduledAt && (
                            <span>
                              Diffusion :{' '}
                              <span className="font-semibold text-blue-600">
                                {new Date(action.scheduledAt).toLocaleDateString('fr-FR')}
                              </span>
                            </span>
                          )}
                          <span>
                            Créée le{' '}
                            <span className="font-semibold">
                              {new Date(action.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </span>
                        </div>
                        {action.channels?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {action.channels.map((channel: string) => {
                              const channelMeta = CHANNEL_BADGES[channel as keyof typeof CHANNEL_BADGES] || CHANNEL_BADGES.EMAIL
                              const Icon = channelMeta.icon
                              return (
                                <Badge key={`${action.id}-${channel}`} className={`flex items-center gap-1 text-xs ${channelMeta.className}`}>
                                  <Icon className="h-3 w-3" />
                                  {channel}
                                </Badge>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                      {action.notes && <p className="max-w-xs text-sm text-muted-foreground">{action.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle campagne commerciale</DialogTitle>
            <DialogDescription>
              Personnalisez le titre, le message et la diffusion pour la campagne sélectionnée.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Titre de la campagne</label>
              <Input
                value={form.title}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Campagne PER - Décembre"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objectif / message</label>
              <Textarea
                value={form.objective}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, objective: event.target.value }))}
                rows={3}
                placeholder="Proposer un entretien retraite et présenter une solution PER adaptée."
              />
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Segment ciblé</p>
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{form.segmentLabel || 'Segment manuel'}</p>
                  <p className="text-[11px] text-muted-foreground">{form.segmentKey || 'Sélection libre'}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diffusion (optionnel)</p>
                <Input
                  type="date"
                  value={form.scheduledAt}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Canaux utilisés</p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((channel) => {
                  const channelMeta = CHANNEL_BADGES[channel as keyof typeof CHANNEL_BADGES] || CHANNEL_BADGES.EMAIL
                  const Icon = channelMeta.icon
                  const active = form.channels.includes(channel)
                  return (
                    <Button
                      key={channel}
                      type="button"
                      variant={active ? 'primary' : 'outline'}
                      className="h-9 gap-2 rounded-full"
                      onClick={() => toggleChannel(channel)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {channel}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes internes</label>
              <Textarea
                value={form.notes}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                placeholder="Public cible, argumentaire, étapes suivantes…"
              />
            </div>

            {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !form.title || !form.segmentKey} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              Lancer la campagne
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
