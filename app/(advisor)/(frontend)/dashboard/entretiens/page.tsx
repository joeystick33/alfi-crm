'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useEntretiens, useEntretienStats, useEntretienActions, useSearchEntretiens } from '@/app/_common/hooks/api/use-entretiens-api'
import {
  Mic, Plus, Search, Clock, CheckCircle2, FileText,
  Loader2, Calendar, User, Eye, BarChart3, TrendingUp,
  TrendingDown, AlertCircle, ListChecks, Sparkles, X,
  ArrowRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/app/_common/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  EN_COURS: { label: 'En cours', variant: 'info' },
  TRANSCRIT: { label: 'Transcrit', variant: 'warning' },
  TRAITE: { label: 'Traité', variant: 'success' },
  FINALISE: { label: 'Finalisé', variant: 'default' },
  ARCHIVE: { label: 'Archivé', variant: 'secondary' },
}

const TYPE_CONFIG: Record<string, { label: string }> = {
  DECOUVERTE: { label: 'Découverte' },
  SUIVI_PERIODIQUE: { label: 'Suivi périodique' },
  BILAN_PATRIMONIAL: { label: 'Bilan patrimonial' },
  CONSEIL_PONCTUEL: { label: 'Conseil ponctuel' },
  SIGNATURE: { label: 'Signature' },
  AUTRE: { label: 'Autre' },
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m} min`
}

function isToday(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function isThisWeek(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  return d >= weekAgo && d <= now
}

export default function EntretiensPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({ status: 'ALL', type: 'ALL', search: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [showActions, setShowActions] = useState(false)

  const apiFilters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (filters.status !== 'ALL') f.status = filters.status
    if (filters.type !== 'ALL') f.type = filters.type
    if (filters.search) f.search = filters.search
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useEntretiens(apiFilters)
  const { data: statsData } = useEntretienStats()
  const { data: actionsData } = useEntretienActions()
  const { data: searchData, isLoading: searchLoading } = useSearchEntretiens(searchQuery)

  const entretiens = useMemo(() => {
    if (!data) return []
    const apiData = data as Record<string, unknown>
    const rawData = apiData.data || data
    return Array.isArray(rawData) ? rawData : []
  }, [data])

  const stats: any = useMemo(() => {
    if (!statsData) return { total: 0, thisWeek: 0, avgDureeMinutes: 0, byStatus: {}, tendance: 0, tauxTraitement: 0, actionsEnAttente: 0 }
    const sd = statsData as Record<string, unknown>
    return sd.data || sd
  }, [statsData])

  const actions: any[] = useMemo(() => {
    if (!actionsData) return []
    const ad = actionsData as Record<string, unknown>
    const raw = (ad as any).actions || []
    return Array.isArray(raw) ? raw : []
  }, [actionsData])

  const searchResults: any[] = useMemo(() => {
    if (!searchData) return []
    const sd = searchData as Record<string, unknown>
    const raw = (sd as any).results || []
    return Array.isArray(raw) ? raw : []
  }, [searchData])

  // Groupement par date
  const grouped = useMemo(() => {
    const today: any[] = []
    const thisWeek: any[] = []
    const earlier: any[] = []
    for (const e of entretiens) {
      const d = (e as any).dateEntretien
      if (d && isToday(d)) today.push(e)
      else if (d && isThisWeek(d)) thisWeek.push(e)
      else earlier.push(e)
    }
    return { today, thisWeek, earlier }
  }, [entretiens])

  const renderEntretienRow = (e: any) => {
    const statusCfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.EN_COURS
    const typeCfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.AUTRE
    const clientName = e.client
      ? `${e.client.firstName} ${e.client.lastName}`
      : e.prospectPrenom
        ? `${e.prospectPrenom} ${e.prospectNom || ''}`
        : 'Prospect'

    return (
      <div
        key={e.id}
        className="group flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
        onClick={() => router.push(`/dashboard/entretiens/${e.id}`)}
      >
        <div className={cn(
          'p-2 rounded-lg shrink-0',
          e.status === 'TRAITE' || e.status === 'FINALISE' ? 'bg-emerald-50' : 'bg-indigo-50'
        )}>
          <Mic className={cn('h-4 w-4', e.status === 'TRAITE' || e.status === 'FINALISE' ? 'text-emerald-600' : 'text-indigo-600')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{e.titre}</h3>
            <Badge variant={statusCfg.variant} className="text-[10px] shrink-0">{statusCfg.label}</Badge>
            {e.traitementType && (
              <Badge variant="success" className="text-[10px] shrink-0">
                {e.traitementType === 'RESUME' ? 'Résumé' : 'Bilan'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{clientName}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{e.dateEntretien ? formatDate(new Date(e.dateEntretien)) : '—'}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(e.duree)}</span>
            <span className="text-slate-400">{typeCfg.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {e.status === 'TRANSCRIT' && (
            <Button variant="outline" size="sm" onClick={(ev) => { ev.stopPropagation(); router.push(`/dashboard/entretiens/${e.id}`) }}>
              <Sparkles className="h-3.5 w-3.5 mr-1" />Traiter
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); router.push(`/dashboard/entretiens/${e.id}`) }}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderGroup = (label: string, items: any[]) => {
    if (items.length === 0) return null
    return (
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{label}</h3>
        <Card className="divide-y divide-slate-100">
          {items.map(renderEntretienRow)}
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Mic className="h-6 w-6 text-indigo-600" />
            Mes entretiens
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Enregistrez, transcrivez et analysez vos entretiens clients</p>
        </div>
        <Button onClick={() => router.push('/dashboard/entretiens/nouveau')} className="gap-2">
          <Plus className="h-4 w-4" />Nouvel entretien
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3.5">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xl font-bold mt-0.5 tabular-nums">{stats.total || 0}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-slate-500">Ce mois</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xl font-bold tabular-nums text-indigo-600">{stats.thisMonth || stats.thisWeek || 0}</p>
            {stats.tendance !== 0 && (
              <span className={cn('flex items-center text-xs font-medium', stats.tendance > 0 ? 'text-emerald-600' : 'text-red-500')}>
                {stats.tendance > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(stats.tendance)}%
              </span>
            )}
          </div>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-slate-500">Durée moy.</p>
          <p className="text-xl font-bold mt-0.5 tabular-nums">{stats.avgDureeMinutes || 0}<span className="text-sm font-normal text-slate-400"> min</span></p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs text-slate-500">Taux traitement</p>
          <p className="text-xl font-bold mt-0.5 tabular-nums text-emerald-600">{stats.tauxTraitement || 0}<span className="text-sm font-normal">%</span></p>
        </Card>
        <Card className={cn('p-3.5 cursor-pointer transition-colors', showActions ? 'ring-2 ring-amber-400 bg-amber-50' : 'hover:bg-amber-50/50')} onClick={() => setShowActions(!showActions)}>
          <p className="text-xs text-slate-500">Actions en attente</p>
          <div className="flex items-center gap-1.5">
            <p className={cn('text-xl font-bold mt-0.5 tabular-nums', actions.length > 0 ? 'text-amber-600' : '')}>
              {stats.actionsEnAttente || actions.length || 0}
            </p>
            {actions.length > 0 && <ListChecks className="h-4 w-4 text-amber-500" />}
          </div>
        </Card>
      </div>

      {/* Actions panel */}
      {showActions && actions.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-amber-600" />
              Actions à suivre
              <Badge variant="warning" className="text-[10px]">{actions.length}</Badge>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowActions(false)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {actions.slice(0, 15).map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm bg-white p-2.5 rounded-lg border border-amber-100">
                <Badge variant={a.responsable === 'conseiller' ? 'primary' : 'outline'} className="text-[10px] shrink-0">
                  {a.responsable}
                </Badge>
                <span className="flex-1 truncate">{a.action}</span>
                {a.echeance && <span className="text-xs text-slate-400 shrink-0">{a.echeance}</span>}
                {a.clientNom && <span className="text-xs text-slate-400 shrink-0">{a.clientNom}</span>}
                <Button
                  variant="ghost" size="sm" className="shrink-0"
                  onClick={() => router.push(`/dashboard/entretiens/${a.entretienId}`)}
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters + Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par titre, client, contenu..."
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }))
                setSearchQuery(e.target.value)
              }}
              className="pl-9"
            />
          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => setFilters(prev => ({ ...prev, type: v }))}>
            <SelectTrigger className="w-full md:w-[170px]">
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
            <Button variant="outline" size="sm" onClick={() => { setFilters({ search: '', status: 'ALL', type: 'ALL' }); setSearchQuery('') }}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Cross-interview search results */}
      {searchQuery.length >= 2 && searchResults.length > 0 && (
        <Card className="p-4 border-indigo-200 bg-indigo-50/20">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-indigo-600" />
            Résultats dans les transcriptions
            <Badge variant="secondary" className="text-[10px]">{searchResults.length}</Badge>
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.slice(0, 8).map((r: any) => (
              <div
                key={r.entretienId}
                className="bg-white p-3 rounded-lg border border-indigo-100 cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => router.push(`/dashboard/entretiens/${r.entretienId}`)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{r.titre}</span>
                  {r.clientNom && <span className="text-xs text-slate-500">{r.clientNom}</span>}
                  <span className="text-xs text-slate-400">{r.dateEntretien ? formatDate(new Date(r.dateEntretien)) : ''}</span>
                </div>
                {r.extraits?.slice(0, 2).map((ext: any, j: number) => (
                  <p key={j} className="text-xs text-slate-600 bg-yellow-50 px-2 py-1 rounded mt-1">
                    <span className="font-medium text-slate-500">{ext.speaker === 'conseiller' ? 'Conseiller' : 'Client'} :</span> {ext.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-destructive">
          <p>Erreur lors du chargement</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">Réessayer</Button>
        </Card>
      ) : entretiens.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="Aucun entretien"
          description={
            filters.search || filters.status !== 'ALL' || filters.type !== 'ALL'
              ? 'Aucun entretien ne correspond à vos critères.'
              : 'Commencez par enregistrer votre premier entretien client.'
          }
          action={
            !filters.search && filters.status === 'ALL'
              ? { label: 'Nouvel entretien', onClick: () => router.push('/dashboard/entretiens/nouveau'), icon: Plus }
              : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {renderGroup("Aujourd'hui", grouped.today)}
          {renderGroup('Cette semaine', grouped.thisWeek)}
          {renderGroup('Plus ancien', grouped.earlier)}
        </div>
      )}
    </div>
  )
}
