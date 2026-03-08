'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  ArrowLeft,
  Brain,
  Loader2,
  Shield,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileWarning,
  TrendingUp,
  ListChecks,
  Activity,
  Zap,
  BookOpen,
  Target,
  Scale,
  MessageSquare,
  Settings2,
  Play,
  Eye,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useRouter } from 'next/navigation'

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

interface AssistantProfile {
  id: string
  name: string
  description: string | null
  tone: string
  enabledDomains: string[]
  enabledFeatures: Record<string, boolean> | null
  customSystemPrompt: string | null
  maxToolCallsPerRun: number
  maxRunSteps: number
  requireConfirmForWrites: boolean
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: { sessions: number }
}

interface BackgroundStatus {
  status: 'active' | 'inactive'
  backgroundEnabled: boolean
  hasConnection: boolean
  provider: string | null
  profileName: string | null
  lastScanAt: string | null
  lastScanDurationMs: number
  insights: BackgroundInsight[]
  quickStats: {
    totalClients: number
    clientsSansContact: number
    kycExpirant: number
    tachesEnRetard: number
    reclamationsOuvertes: number
  }
}

interface BackgroundInsight {
  id: string
  type: 'anomaly' | 'opportunity' | 'warning' | 'info'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  clientId?: string
  clientName?: string
  suggestedAction?: string
  jobType: string
}

interface ScanResult {
  success: boolean
  summary: {
    jobsExecuted: number
    insightsFound: number
    actionsProposed: number
    durationMs: number
  }
  insights: BackgroundInsight[]
  proposedActions: unknown[]
}

// ══════════════════════════════════════════════════════════════
// TONE & DOMAIN LABELS
// ══════════════════════════════════════════════════════════════

const TONE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PROFESSIONNEL: { label: 'Professionnel', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  PEDAGOGIQUE: { label: 'Pédagogique', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
  DIRECT: { label: 'Direct', icon: Zap, color: 'text-red-600 bg-red-50' },
  AMICAL: { label: 'Amical', icon: MessageSquare, color: 'text-green-600 bg-green-50' },
}

const DOMAIN_LABELS: Record<string, string> = {
  fiscal: 'Fiscalité',
  patrimoine: 'Patrimoine',
  retraite: 'Retraite',
  prevoyance: 'Prévoyance',
  immobilier: 'Immobilier',
  succession: 'Succession',
  assurance_vie: 'Assurance Vie',
  epargne: 'Épargne',
  compliance: 'Conformité',
  kyc: 'KYC',
  rgpd: 'RGPD',
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Critique' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Haute' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Moyenne' },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Basse' },
}

const INSIGHT_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  anomaly: { icon: AlertTriangle, color: 'text-red-500' },
  opportunity: { icon: TrendingUp, color: 'text-emerald-500' },
  warning: { icon: FileWarning, color: 'text-amber-500' },
  info: { icon: Eye, color: 'text-blue-500' },
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════

export default function AIProfilesPage() {
  const { toast } = useToast()
  const { isSuperAdmin, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect non-superadmin users
  React.useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/dashboard/settings')
    }
  }, [authLoading, isSuperAdmin, router])

  // State
  const [profiles, setProfiles] = useState<AssistantProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [bgStatus, setBgStatus] = useState<BackgroundStatus | null>(null)
  const [loadingBg, setLoadingBg] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null)

  // ── Load Profiles ──
  const loadProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true)
      const res = await fetch('/api/advisor/ai/v2/profiles')
      if (!res.ok) throw new Error('Failed to load profiles')
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch (err) {
      console.error('[AI Profiles] Load error:', err)
    } finally {
      setLoadingProfiles(false)
    }
  }, [])

  // ── Load Background Status ──
  const loadBackgroundStatus = useCallback(async () => {
    try {
      setLoadingBg(true)
      const res = await fetch('/api/advisor/ai/v2/background')
      if (!res.ok) throw new Error('Failed to load background status')
      const data = await res.json()
      setBgStatus(data)
    } catch (err) {
      console.error('[AI Background] Load error:', err)
    } finally {
      setLoadingBg(false)
    }
  }, [])

  // ── Trigger Manual Scan ──
  const triggerScan = useCallback(async () => {
    try {
      setScanning(true)
      setScanResult(null)
      const res = await fetch('/api/advisor/ai/v2/background', { method: 'POST' })
      if (!res.ok) throw new Error('Scan failed')
      const data: ScanResult = await res.json()
      setScanResult(data)
      toast({
        title: 'Scan terminé',
        description: `${data.summary.insightsFound} insight(s) détecté(s) en ${data.summary.durationMs}ms`,
      })
      // Refresh status
      await loadBackgroundStatus()
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Le scan background a échoué',
        variant: 'destructive',
      })
    } finally {
      setScanning(false)
    }
  }, [toast, loadBackgroundStatus])

  // ── Initial Load ──
  useEffect(() => {
    loadProfiles()
    loadBackgroundStatus()
  }, [loadProfiles, loadBackgroundStatus])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />
              Paramètres
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Assistants IA & Agent Autonome</h1>
              <Badge variant="primary" size="sm">V2</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Profils d'assistant IA, monitoring background et détection automatique
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1 : PROFILS D'ASSISTANT                          */}
      {/* ══════════════════════════════════════════════════════════ */}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100">
              <Brain className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Profils d'assistant
            </h2>
            <Badge variant="default" size="xs">{profiles.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={loadProfiles} disabled={loadingProfiles}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loadingProfiles && 'animate-spin')} />
            Actualiser
          </Button>
        </div>

        {loadingProfiles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : profiles.length === 0 ? (
          <Card className="border-dashed border-2 border-purple-200 bg-purple-50/30">
            <CardContent className="p-8 text-center">
              <Brain className="h-10 w-10 text-purple-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">Aucun profil d'assistant</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                Les profils d'assistant définissent la personnalité, le ton et les domaines d'expertise d'AURA.
                Lancez le seed pour créer les profils par défaut.
              </p>
              <code className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 font-mono">
                npx tsx prisma/seeds/assistant-profiles-seed.ts
              </code>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile) => {
              const toneConf = TONE_CONFIG[profile.tone] || TONE_CONFIG.PROFESSIONNEL
              const ToneIcon = toneConf.icon
              const isExpanded = expandedProfile === profile.id

              return (
                <Card
                  key={profile.id}
                  className={cn(
                    'transition-all duration-200 cursor-pointer',
                    profile.isDefault
                      ? 'border-purple-300 bg-purple-50/40 shadow-sm'
                      : 'border-gray-200 hover:border-purple-200 hover:shadow-sm'
                  )}
                  onClick={() => setExpandedProfile(isExpanded ? null : profile.id)}
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-xl', toneConf.color.split(' ')[1])}>
                          <ToneIcon className={cn('h-5 w-5', toneConf.color.split(' ')[0])} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900">{profile.name}</h3>
                            {profile.isDefault && (
                              <Badge variant="primary" size="xs">Défaut</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Ton {toneConf.label.toLowerCase()} · {profile._count.sessions} session(s)
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" size="xs" className={toneConf.color}>
                        {toneConf.label}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
                      {profile.description || 'Pas de description'}
                    </p>

                    {/* Domains */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {profile.enabledDomains.slice(0, isExpanded ? undefined : 4).map((domain) => (
                        <span
                          key={domain}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600"
                        >
                          {DOMAIN_LABELS[domain] || domain}
                        </span>
                      ))}
                      {!isExpanded && profile.enabledDomains.length > 4 && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-50 text-gray-400">
                          +{profile.enabledDomains.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                        {/* Features */}
                        {profile.enabledFeatures && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Fonctionnalités</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(profile.enabledFeatures).map(([key, enabled]) => (
                                <span
                                  key={key}
                                  className={cn(
                                    'px-2 py-0.5 text-[10px] font-medium rounded-full',
                                    enabled
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-gray-50 text-gray-400 line-through'
                                  )}
                                >
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Limits */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-xs font-bold text-gray-900">{profile.maxToolCallsPerRun}</p>
                            <p className="text-[10px] text-gray-500">Tool calls/run</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-xs font-bold text-gray-900">{profile.maxRunSteps}</p>
                            <p className="text-[10px] text-gray-500">Max steps</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-xs font-bold text-gray-900">
                              {profile.requireConfirmForWrites ? 'Oui' : 'Non'}
                            </p>
                            <p className="text-[10px] text-gray-500">Confirmation</p>
                          </div>
                        </div>

                        {/* Custom Prompt Preview */}
                        {profile.customSystemPrompt && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Prompt personnalisé</p>
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg line-clamp-3 font-mono">
                              {profile.customSystemPrompt}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2 : AGENT AUTONOME BACKGROUND                    */}
      {/* ══════════════════════════════════════════════════════════ */}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Agent Autonome Background
            </h2>
            {bgStatus && (
              <Badge
                variant={bgStatus.status === 'active' ? 'success' : 'default'}
                size="xs"
              >
                {bgStatus.status === 'active' ? 'Actif' : 'Inactif'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadBackgroundStatus}
              disabled={loadingBg}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loadingBg && 'animate-spin')} />
              Actualiser
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={triggerScan}
              disabled={scanning}
              className="gap-1.5"
            >
              {scanning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {scanning ? 'Scan en cours...' : 'Lancer un scan'}
            </Button>
          </div>
        </div>

        {/* Description de l'agent */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p className="font-medium mb-1">Agent autonome always-on</p>
              <p className="text-emerald-700 text-xs leading-relaxed">
                L'agent background surveille en continu votre CRM sans intervention. 
                Il détecte les KYC expirants, les tâches en retard, les incohérences de données, 
                les opportunités commerciales (PER, IFI), et les manquements de conformité. 
                Chaque insight est proposé avec une action concrète — jamais d'action silencieuse.
              </p>
            </div>
          </div>
        </div>

        {loadingBg ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : bgStatus ? (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard
                icon={Users}
                label="Clients actifs"
                value={bgStatus.quickStats.totalClients}
                color="text-blue-600 bg-blue-50"
              />
              <StatCard
                icon={AlertTriangle}
                label="Sans contact"
                value={bgStatus.quickStats.clientsSansContact}
                color="text-red-600 bg-red-50"
                alert={bgStatus.quickStats.clientsSansContact > 0}
              />
              <StatCard
                icon={Shield}
                label="KYC expirant"
                value={bgStatus.quickStats.kycExpirant}
                color="text-amber-600 bg-amber-50"
                alert={bgStatus.quickStats.kycExpirant > 0}
              />
              <StatCard
                icon={ListChecks}
                label="Tâches en retard"
                value={bgStatus.quickStats.tachesEnRetard}
                color="text-orange-600 bg-orange-50"
                alert={bgStatus.quickStats.tachesEnRetard > 0}
              />
              <StatCard
                icon={Scale}
                label="Réclamations"
                value={bgStatus.quickStats.reclamationsOuvertes}
                color="text-purple-600 bg-purple-50"
                alert={bgStatus.quickStats.reclamationsOuvertes > 0}
              />
            </div>

            {/* Connection + Profile Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  bgStatus.hasConnection ? 'bg-emerald-100' : 'bg-gray-200'
                )}>
                  <Zap className={cn(
                    'h-4 w-4',
                    bgStatus.hasConnection ? 'text-emerald-600' : 'text-gray-400'
                  )} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {bgStatus.hasConnection ? `Connecté (${bgStatus.provider})` : 'Non connecté'}
                  </p>
                  <p className="text-[10px] text-gray-500">Connexion IA</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  bgStatus.profileName ? 'bg-purple-100' : 'bg-gray-200'
                )}>
                  <Brain className={cn(
                    'h-4 w-4',
                    bgStatus.profileName ? 'text-purple-600' : 'text-gray-400'
                  )} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {bgStatus.profileName || 'Aucun profil'}
                  </p>
                  <p className="text-[10px] text-gray-500">Profil actif</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  bgStatus.lastScanAt ? 'bg-teal-100' : 'bg-gray-200'
                )}>
                  <Clock className={cn(
                    'h-4 w-4',
                    bgStatus.lastScanAt ? 'text-teal-600' : 'text-gray-400'
                  )} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {bgStatus.lastScanAt
                      ? new Date(bgStatus.lastScanAt).toLocaleString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })
                      : 'Jamais scanné'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {bgStatus.lastScanDurationMs > 0
                      ? `Dernier scan (${bgStatus.lastScanDurationMs}ms)`
                      : 'Dernier scan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Scan Result (after manual trigger) */}
            {scanResult && (
              <Card className="border-emerald-200 bg-emerald-50/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-emerald-900">Résultat du scan</h3>
                    <Badge variant="success" size="xs">
                      {scanResult.summary.durationMs}ms
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-emerald-700">{scanResult.summary.jobsExecuted}</p>
                      <p className="text-[10px] text-emerald-600">Jobs exécutés</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-700">{scanResult.summary.insightsFound}</p>
                      <p className="text-[10px] text-emerald-600">Insights détectés</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-700">{scanResult.summary.actionsProposed}</p>
                      <p className="text-[10px] text-emerald-600">Actions proposées</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights List */}
            {bgStatus.insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Insights détectés ({bgStatus.insights.length})
                </h3>
                <div className="space-y-2">
                  {(bgStatus.insights as BackgroundInsight[]).map((insight, idx) => {
                    const typeConf = INSIGHT_TYPE_CONFIG[insight.type] || INSIGHT_TYPE_CONFIG.info
                    const sevConf = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.low
                    const TypeIcon = typeConf.icon

                    return (
                      <div
                        key={insight.id || idx}
                        className="p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <TypeIcon className={cn('h-4 w-4 mt-0.5 shrink-0', typeConf.color)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {insight.title}
                              </p>
                              <Badge variant="default" size="xs" className={sevConf.color}>
                                {sevConf.label}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">
                              {insight.description}
                            </p>
                            {insight.suggestedAction && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <Target className="h-3 w-3 text-indigo-500 shrink-0" />
                                <p className="text-[10px] text-indigo-600 font-medium">
                                  {insight.suggestedAction}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No Insights */}
            {bgStatus.insights.length === 0 && !scanResult && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Aucun insight en attente</p>
                <p className="text-xs text-gray-400 mt-1">
                  Lancez un scan pour détecter les anomalies, opportunités et alertes
                </p>
              </div>
            )}

            {/* Jobs Description */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Jobs de monitoring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { id: 'kyc_expiry', label: 'Vérification KYC', desc: 'Détecte les KYC expirants sous 30 jours', icon: Shield },
                  { id: 'task_overdue', label: 'Tâches en retard', desc: 'Identifie les tâches dépassant l\'échéance', icon: ListChecks },
                  { id: 'data_inconsistency', label: 'Incohérences données', desc: 'Clients sans coordonnées, sans contrat...', icon: AlertTriangle },
                  { id: 'opportunity_detection', label: 'Opportunités commerciales', desc: 'PER pour TMI élevée, optimisation IFI...', icon: TrendingUp },
                  { id: 'compliance_check', label: 'Conformité', desc: 'Réclamations non traitées >48h', icon: Scale },
                  { id: 'meeting_completion', label: 'Post-meeting', desc: 'Entretiens transcrits sans analyse IA', icon: MessageSquare },
                ].map((job) => {
                  const JobIcon = job.icon
                  return (
                    <div
                      key={job.id}
                      className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <JobIcon className="h-4 w-4 text-gray-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{job.label}</p>
                        <p className="text-[10px] text-gray-500">{job.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* No Connection Warning */}
            {!bgStatus.hasConnection && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">Connexion IA requise</p>
                    <p className="text-xs text-amber-700 mt-1">
                      L'agent autonome nécessite une connexion IA active pour les analyses avancées 
                      (détection d'opportunités, synthèses). Les vérifications basiques (KYC, tâches) 
                      fonctionnent sans connexion.
                    </p>
                    <Link href="/dashboard/settings/ai-connections">
                      <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-100">
                        <Settings2 className="h-3.5 w-3.5" />
                        Configurer une connexion
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">Agent background indisponible</h3>
              <p className="text-sm text-gray-500">Impossible de charger le statut de l'agent background.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  alert = false,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  alert?: boolean
}) {
  const [iconColor, bgColor] = color.split(' ')
  return (
    <div className={cn(
      'p-3 rounded-xl border text-center transition-colors',
      alert ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-white',
    )}>
      <div className={cn('p-1.5 rounded-lg inline-flex mb-1.5', bgColor)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <p className={cn('text-lg font-bold', alert ? 'text-red-700' : 'text-gray-900')}>
        {value}
      </p>
      <p className="text-[10px] text-gray-500 font-medium">{label}</p>
    </div>
  )
}
