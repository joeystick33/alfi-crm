'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useEntretien, useDeleteEntretien, useClientTimeline } from '@/app/_common/hooks/api/use-entretiens-api'
import { useToast } from '@/app/_common/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Mic, Clock, User, Calendar, FileText,
  BarChart3, Trash2, Download, CheckCircle2, Shield,
  Pencil, Sparkles, Tag, MessageSquare, Hash,
  AlertTriangle, ListChecks, ChevronDown, ChevronUp,
  StickyNote,
} from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  EN_COURS: { label: 'En cours', variant: 'info' },
  TRANSCRIT: { label: 'Transcrit', variant: 'warning' },
  TRAITE: { label: 'Traité', variant: 'success' },
  FINALISE: { label: 'Finalisé', variant: 'default' },
  ARCHIVE: { label: 'Archivé', variant: 'secondary' },
}

const TYPE_CONFIG: Record<string, string> = {
  DECOUVERTE: 'Découverte',
  SUIVI_PERIODIQUE: 'Suivi périodique',
  BILAN_PATRIMONIAL: 'Bilan patrimonial',
  CONSEIL_PONCTUEL: 'Conseil ponctuel',
  SIGNATURE: 'Signature',
  AUTRE: 'Autre',
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m} min`
}

function formatTime(ms: number) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function EntretienDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string

  const { data: rawData, isLoading, error } = useEntretien(id)
  const deleteMutation = useDeleteEntretien()
  const [showTranscription, setShowTranscription] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  const entretien: any = useMemo(() => {
    if (!rawData) return null
    const d = rawData as Record<string, unknown>
    return d.data || d
  }, [rawData])

  const segments: any[] = useMemo(() => {
    if (!entretien?.transcription) return []
    return Array.isArray(entretien.transcription) ? entretien.transcription : []
  }, [entretien])

  // Client timeline
  const { data: timelineRaw } = useClientTimeline(entretien?.clientId || null)
  const timeline: any[] = useMemo(() => {
    if (!timelineRaw) return []
    const d = timelineRaw as Record<string, unknown>
    const raw = (d as any).data || []
    return Array.isArray(raw) ? raw.filter((t: any) => t.id !== id) : []
  }, [timelineRaw, id])

  // Analytics
  const analytics = useMemo(() => {
    if (segments.length === 0) return null
    const wordCount = segments.reduce((s: number, seg: any) => s + (seg.text?.split(/\s+/).length || 0), 0)
    const conseillerSegs = segments.filter((s: any) => s.speaker === 'conseiller')
    const clientSegs = segments.filter((s: any) => s.speaker === 'client')
    const ratioClient = Math.round((clientSegs.length / segments.length) * 100)
    return { wordCount, conseillerSegs: conseillerSegs.length, clientSegs: clientSegs.length, ratioClient, totalSegments: segments.length }
  }, [segments])

  // Actions from traitement
  const actions: any[] = useMemo(() => {
    if (!entretien?.traitementResultat?.actionsASuivre) return []
    return entretien.traitementResultat.actionsASuivre
  }, [entretien])

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement cet entretien ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      router.push('/dashboard/entretiens')
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'entretien', variant: 'destructive' })
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/advisor/entretiens/${id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Erreur PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `entretien-${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Erreur', description: 'Génération PDF indisponible', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !entretien) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <p className="text-red-600 mb-4">Entretien non trouvé ou erreur de chargement.</p>
        <Link href="/dashboard/entretiens"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[entretien.status] || STATUS_CONFIG.EN_COURS
  const clientName = entretien.client
    ? `${entretien.client.firstName} ${entretien.client.lastName}`
    : entretien.prospectPrenom
      ? `${entretien.prospectPrenom} ${entretien.prospectNom || ''}`
      : 'Prospect'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/entretiens">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Mic className="h-6 w-6 text-indigo-600" />
              {entretien.titre}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              <span className="text-sm text-slate-500">{TYPE_CONFIG[entretien.type] || entretien.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entretien.status === 'TRANSCRIT' && (
            <Button onClick={() => router.push(`/dashboard/entretiens/${id}/traitement`)}>
              <Sparkles className="h-4 w-4 mr-2" /> Traiter
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-indigo-600" />
            <span className="text-slate-600">Client</span>
          </div>
          <p className="font-semibold mt-1">{clientName}</p>
          {entretien.client?.email && <p className="text-xs text-slate-500">{entretien.client.email}</p>}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span className="text-slate-600">Date</span>
          </div>
          <p className="font-semibold mt-1">
            {entretien.dateEntretien ? new Date(entretien.dateEntretien).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span className="text-slate-600">Durée</span>
          </div>
          <p className="font-semibold mt-1">{formatDuration(entretien.duree)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-amber-600" />
            <span className="text-slate-600">Consentement</span>
          </div>
          <p className="font-semibold mt-1">
            {entretien.consentementRecueilli
              ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Recueilli</span>
              : <span className="text-red-600">Non recueilli</span>
            }
          </p>
        </Card>
      </div>

      {/* Analytics */}
      {analytics && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Métriques de l'entretien</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="text-center p-2.5 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase">Segments</p>
              <p className="text-lg font-bold tabular-nums">{analytics.totalSegments}</p>
            </div>
            <div className="text-center p-2.5 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase">Mots</p>
              <p className="text-lg font-bold tabular-nums">{analytics.wordCount}</p>
            </div>
            <div className="text-center p-2.5 bg-indigo-50 rounded-lg">
              <p className="text-[10px] text-indigo-600 uppercase">Conseiller</p>
              <p className="text-lg font-bold tabular-nums text-indigo-700">{analytics.conseillerSegs}</p>
            </div>
            <div className="text-center p-2.5 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase">Client</p>
              <p className="text-lg font-bold tabular-nums">{analytics.clientSegs}</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Ratio parole</p>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analytics.ratioClient}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{analytics.ratioClient}% client</p>
            </div>
          </div>
        </Card>
      )}

      {/* Notes conseiller */}
      {entretien.notesConseiller && (
        <Card className="p-4 border-amber-100 bg-amber-50/20">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-slate-700">Notes du conseiller</span>
          </div>
          <p className="text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">{entretien.notesConseiller}</p>
        </Card>
      )}

      {/* Transcription (collapsible) */}
      {segments.length > 0 && (
        <Card>
          <button
            type="button"
            onClick={() => setShowTranscription(!showTranscription)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <span className="font-semibold text-base">Transcription</span>
              <Badge variant="secondary" className="text-xs">{segments.length} segments</Badge>
            </div>
            {showTranscription ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showTranscription && (
            <CardContent className="pt-0">
              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                {segments.map((seg: any) => (
                  <div
                    key={seg.id}
                    className={cn(
                      'flex gap-2 items-start',
                      seg.speaker === 'conseiller' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div className={cn(
                      'max-w-[75%] p-3 rounded-xl text-sm',
                      seg.speaker === 'conseiller'
                        ? 'bg-indigo-100 text-indigo-900 rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-70">
                          {seg.speaker === 'conseiller' ? '🧑‍💼 Conseiller' : '👤 Client'}
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums">{formatTime(seg.timestamp)}</span>
                        {seg.edited && <Badge variant="outline" className="text-[9px] px-1">modifié</Badge>}
                      </div>
                      <p className="leading-relaxed">{seg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Traitement Result */}
      {entretien.traitementResultat && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
              {entretien.traitementType === 'RESUME'
                ? <><FileText className="h-5 w-5" /> Résumé de l'entretien</>
                : <><BarChart3 className="h-5 w-5" /> Bilan patrimonial</>
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entretien.traitementType === 'RESUME' && (
              <div className="space-y-4">
                {entretien.traitementResultat.objet && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Objet</h4>
                    <p className="text-sm bg-slate-50 p-3 rounded-lg">{entretien.traitementResultat.objet}</p>
                  </div>
                )}
                {entretien.traitementResultat.pointsCles?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Points clés</h4>
                    <ul className="space-y-1">
                      {entretien.traitementResultat.pointsCles.map((p: string, i: number) => (
                        <li key={i} className="text-sm bg-blue-50 p-2 rounded flex items-start gap-2">
                          <span className="text-blue-600 font-bold shrink-0">•</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entretien.traitementResultat.decisions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Décisions prises</h4>
                    <ul className="space-y-1">
                      {entretien.traitementResultat.decisions.map((d: string, i: number) => (
                        <li key={i} className="text-sm bg-emerald-50 p-2 rounded flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entretien.traitementResultat.actionsASuivre?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Actions à suivre</h4>
                    <div className="space-y-1">
                      {entretien.traitementResultat.actionsASuivre.map((a: any, i: number) => (
                        <div key={i} className="text-sm bg-amber-50 p-2 rounded flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] shrink-0">{a.responsable}</Badge>
                          <span className="flex-1">{a.action}</span>
                          {a.echeance && <span className="text-xs text-slate-500">{a.echeance}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {entretien.traitementResultat.synthese && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Synthèse</h4>
                    <p className="text-sm bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">{entretien.traitementResultat.synthese}</p>
                  </div>
                )}
                {entretien.traitementResultat.motifsAlerte?.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-sm text-red-700 mb-1">⚠ Alertes</h4>
                    <ul className="space-y-1">
                      {entretien.traitementResultat.motifsAlerte.map((m: string, i: number) => (
                        <li key={i} className="text-sm text-red-700">{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {entretien.traitementType === 'BILAN_PATRIMONIAL' && (
              <div className="space-y-4">
                {entretien.traitementResultat.situationFamiliale && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Situation familiale</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(entretien.traitementResultat.situationFamiliale).filter(([_, v]) => v != null).map(([k, v]) => (
                        <div key={k} className="bg-slate-50 p-2 rounded">
                          <span className="text-slate-500 text-xs">{k}</span>
                          <p className="font-medium">{String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {entretien.traitementResultat.patrimoine && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Patrimoine</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {entretien.traitementResultat.patrimoine.totalBrut != null && (
                        <div className="bg-blue-50 p-3 rounded text-center">
                          <span className="text-xs text-blue-600">Brut</span>
                          <p className="font-bold text-blue-700">{Number(entretien.traitementResultat.patrimoine.totalBrut).toLocaleString('fr-FR')} €</p>
                        </div>
                      )}
                      {entretien.traitementResultat.patrimoine.totalDettes != null && (
                        <div className="bg-red-50 p-3 rounded text-center">
                          <span className="text-xs text-red-600">Dettes</span>
                          <p className="font-bold text-red-700">{Number(entretien.traitementResultat.patrimoine.totalDettes).toLocaleString('fr-FR')} €</p>
                        </div>
                      )}
                      {entretien.traitementResultat.patrimoine.totalNet != null && (
                        <div className="bg-emerald-50 p-3 rounded text-center">
                          <span className="text-xs text-emerald-600">Net</span>
                          <p className="font-bold text-emerald-700">{Number(entretien.traitementResultat.patrimoine.totalNet).toLocaleString('fr-FR')} €</p>
                        </div>
                      )}
                    </div>
                    {entretien.traitementResultat.patrimoine.immobilier?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">Immobilier</p>
                        {entretien.traitementResultat.patrimoine.immobilier.map((b: any, i: number) => (
                          <div key={i} className="text-sm bg-slate-50 p-2 rounded mb-1 flex justify-between">
                            <span>{b.type}</span>
                            <span className="font-medium">{Number(b.valeur).toLocaleString('fr-FR')} €</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {entretien.traitementResultat.patrimoine.financier?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">Financier</p>
                        {entretien.traitementResultat.patrimoine.financier.map((b: any, i: number) => (
                          <div key={i} className="text-sm bg-slate-50 p-2 rounded mb-1 flex justify-between">
                            <span>{b.type}</span>
                            <span className="font-medium">{Number(b.montant).toLocaleString('fr-FR')} €</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {entretien.traitementResultat.objectifs?.priorites?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Objectifs du client</h4>
                    <ul className="space-y-1">
                      {entretien.traitementResultat.objectifs.priorites.map((o: string, i: number) => (
                        <li key={i} className="text-sm bg-indigo-50 p-2 rounded">{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {entretien.traitementResultat.preconisationsPreliminaires?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 mb-1">Préconisations préliminaires</h4>
                    <div className="space-y-2">
                      {entretien.traitementResultat.preconisationsPreliminaires.map((p: any, i: number) => (
                        <div key={i} className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{p.priorite || 'moyenne'}</Badge>
                            {p.categorie && <Badge variant="secondary" className="text-[10px]">{p.categorie}</Badge>}
                          </div>
                          <p className="font-medium text-sm">{p.titre}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {entretien.traitementResultat.informationsManquantes?.length > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-semibold text-sm text-orange-700 mb-1">Informations manquantes</h4>
                    <ul className="space-y-1">
                      {entretien.traitementResultat.informationsManquantes.map((m: string, i: number) => (
                        <li key={i} className="text-sm text-orange-700 flex items-start gap-1">
                          <span className="shrink-0">•</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entretien.traitementResultat.scoreCompletude != null && (
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-slate-500">Score de complétude</span>
                    <p className="text-2xl font-bold text-indigo-600">{entretien.traitementResultat.scoreCompletude}/100</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client timeline (other entretiens) */}
      {timeline.length > 0 && (
        <Card>
          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-base">Historique client</span>
              <Badge variant="secondary" className="text-xs">{timeline.length} autre(s)</Badge>
            </div>
            {showTimeline ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showTimeline && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {timeline.map((t: any) => {
                  const tStatus = STATUS_CONFIG[t.status] || STATUS_CONFIG.EN_COURS
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      onClick={() => router.push(`/dashboard/entretiens/${t.id}`)}
                    >
                      <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{t.titre}</span>
                          <Badge variant={tStatus.variant} className="text-[10px] shrink-0">{tStatus.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>{t.dateEntretien ? new Date(t.dateEntretien).toLocaleDateString('fr-FR') : ''}</span>
                          <span>{TYPE_CONFIG[t.type] || t.type}</span>
                          <span>{formatDuration(t.duree)}</span>
                          {t.traitementType && <Badge variant="outline" className="text-[9px]">{t.traitementType === 'RESUME' ? 'Résumé' : 'Bilan'}</Badge>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Tags */}
      {entretien.tags?.length > 0 && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-400" />
          {entretien.tags.map((tag: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}
