'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAIv2, type AIConnectionV2 } from '../../../hooks/useAIv2'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalDescription,
} from '@/app/_common/components/ui/Modal'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  Sparkles,
  Settings2,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ExternalLink,
  FlaskConical,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

// ══════════════════════════════════════════════════════════════
// PROVIDER CONFIGS — Production-ready avec liens et instructions
// ══════════════════════════════════════════════════════════════

const PROVIDERS = [
  {
    id: 'OPENAI',
    name: 'OpenAI',
    description: 'GPT-4.1, GPT-4.1 Mini — Meilleur pour le function calling et l\'instruction following',
    icon: '🟢',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    hoverColor: 'hover:bg-emerald-100/60 hover:border-emerald-300',
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1', cost: '~$2/M entrée · $8/M sortie', recommended: true },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', cost: '~$0.40/M entrée · $1.60/M sortie', recommended: true },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', cost: '~$0.10/M entrée · $0.40/M sortie', recommended: false },
      { id: 'gpt-4o', name: 'GPT-4o', cost: '~$2.50/M entrée · $10/M sortie', recommended: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: '~$0.15/M entrée · $0.60/M sortie', recommended: false },
      { id: 'o4-mini', name: 'O4 Mini (Reasoning)', cost: '~$1.10/M entrée · $4.40/M sortie', recommended: false },
      { id: 'o3-mini', name: 'O3 Mini (Reasoning)', cost: '~$1.10/M entrée · $4.40/M sortie', recommended: false },
    ],
    recommended: true,
    dashboardUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-proj-...',
    instructions: [
      'Rendez-vous sur platform.openai.com',
      'Connectez-vous ou créez un compte',
      'Allez dans API Keys → Create new secret key',
      'Copiez la clé générée et collez-la ci-dessous',
    ],
    pricingNote: 'GPT-4.1 : ~$2/M tokens entrée, ~$8/M sortie — contexte 1M tokens',
    costWarning: 'Facturation par token consommé. Un échange typique coûte ~$0.01–$0.05.',
  },
  {
    id: 'ANTHROPIC',
    name: 'Anthropic',
    description: 'Claude Sonnet 4, Claude Haiku 4.5 — Excellent en raisonnement et conformité',
    icon: '🟠',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    badgeColor: 'bg-orange-100 text-orange-700',
    hoverColor: 'hover:bg-orange-100/60 hover:border-orange-300',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', cost: '~$3/M entrée · $15/M sortie', recommended: true },
      { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4.5', cost: '~$1/M entrée · $5/M sortie', recommended: true },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', cost: '~$15/M entrée · $75/M sortie', recommended: false },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', cost: '~$0.25/M entrée · $1.25/M sortie', recommended: false },
    ],
    recommended: true,
    dashboardUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-api03-...',
    instructions: [
      'Rendez-vous sur console.anthropic.com',
      'Connectez-vous ou créez un compte',
      'Allez dans Settings → API Keys → Create Key',
      'Copiez la clé générée et collez-la ci-dessous',
    ],
    pricingNote: 'Claude Sonnet 4 : ~$3/M tokens entrée, ~$15/M sortie — contexte 200K',
    costWarning: 'Opus 4 est très coûteux ($75/M sortie). Préférez Sonnet 4 pour un usage quotidien.',
  },
  {
    id: 'DEEPSEEK',
    name: 'DeepSeek',
    description: 'DeepSeek V3, R1 — Ultra-économique, API compatible OpenAI',
    icon: '🌊',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    hoverColor: 'hover:bg-cyan-100/60 hover:border-cyan-300',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', cost: '~$0.14/M entrée · $0.28/M sortie', recommended: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoning)', cost: '~$0.55/M entrée · $2.19/M sortie', recommended: false },
    ],
    recommended: true,
    dashboardUrl: 'https://platform.deepseek.com/api_keys',
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    instructions: [
      'Rendez-vous sur platform.deepseek.com',
      'Connectez-vous ou créez un compte',
      'Allez dans API Keys → Create new API key',
      'Copiez la clé générée et collez-la ci-dessous',
    ],
    pricingNote: 'DeepSeek V3 : ~$0.14/M tokens — 95% moins cher que GPT-4',
    costWarning: 'Le provider le plus économique du marché. Idéal pour un usage intensif.',
  },
  {
    id: 'MISTRAL',
    name: 'Mistral AI',
    description: 'Mistral Large, Small 3.2, Codestral — Alternative européenne RGPD-friendly',
    icon: '🔵',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-700',
    hoverColor: 'hover:bg-blue-100/60 hover:border-blue-300',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', cost: '~$2/M entrée · $6/M sortie', recommended: true },
      { id: 'mistral-small-latest', name: 'Mistral Small 3.2', cost: '~$0.06/M entrée · $0.18/M sortie', recommended: true },
      { id: 'codestral-latest', name: 'Codestral', cost: '~$0.30/M entrée · $0.90/M sortie', recommended: false },
    ],
    recommended: false,
    dashboardUrl: 'https://console.mistral.ai/api-keys/',
    keyPrefix: '',
    keyPlaceholder: 'Votre clé API Mistral',
    instructions: [
      'Rendez-vous sur console.mistral.ai',
      'Connectez-vous ou créez un compte',
      'Allez dans API Keys → Create new key',
      'Copiez la clé générée et collez-la ci-dessous',
    ],
    pricingNote: 'Mistral Large : ~$2/M tokens — Hébergé en Europe (RGPD)',
    costWarning: 'Small 3.2 est extrêmement économique ($0.06/M). Idéal comme modèle secondaire.',
  },
  {
    id: 'GROQ',
    name: 'Groq',
    description: 'Llama 3.3 70B — Inférence ultra-rapide, idéal pour le mode vocal',
    icon: '⚡',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    hoverColor: 'hover:bg-yellow-100/60 hover:border-yellow-300',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', cost: '~$0.59/M entrée · $0.79/M sortie', recommended: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', cost: '~$0.05/M entrée · $0.08/M sortie', recommended: false },
    ],
    recommended: false,
    dashboardUrl: 'https://console.groq.com/keys',
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
    instructions: [
      'Rendez-vous sur console.groq.com',
      'Connectez-vous avec votre compte Google ou GitHub',
      'Allez dans API Keys → Create API Key',
      'Copiez la clé générée et collez-la ci-dessous',
    ],
    pricingNote: 'Inférence 10x plus rapide que les concurrents — Gratuit jusqu\'à 6000 req/jour',
    costWarning: 'Tier gratuit généreux. Modèles open-source (Llama) hébergés sur hardware Groq.',
  },
  {
    id: 'GOOGLE_VERTEX',
    name: 'Google AI (Gemini)',
    description: 'Gemini 2.5 Pro, Flash — Contexte 1M tokens, multimodal, tier gratuit',
    icon: '🔴',
    color: 'bg-red-50 border-red-200 text-red-700',
    badgeColor: 'bg-red-100 text-red-700',
    hoverColor: 'hover:bg-red-100/60 hover:border-red-300',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', cost: '~$1.25/M entrée · $10/M sortie', recommended: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', cost: '~$0.30/M entrée · $2.50/M sortie', recommended: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', cost: '~$0.075/M entrée · $0.30/M sortie', recommended: false },
    ],
    recommended: false,
    dashboardUrl: 'https://aistudio.google.com/app/apikey',
    keyPrefix: '',
    keyPlaceholder: 'Votre clé API Google AI',
    instructions: [
      'Rendez-vous sur aistudio.google.com',
      'Connectez-vous avec votre compte Google',
      'Cliquez sur "Get API key" → Create API key',
      'Copiez la clé générée et collez-la ci-dessous',
    ],
    pricingNote: 'Gemini 2.5 Flash : ~$0.30/M tokens — Tier gratuit disponible sur tous les modèles',
    costWarning: 'Google offre le meilleur tier gratuit (15 req/min). Idéal pour commencer.',
  },
  {
    id: 'COHERE',
    name: 'Cohere',
    description: 'Command R+ — Spécialisé RAG et recherche',
    icon: '🟣',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-700',
    hoverColor: 'hover:bg-purple-100/60 hover:border-purple-300',
    models: [
      { id: 'command-r-plus', name: 'Command R+', cost: '~$2.50/M entrée · $10/M sortie', recommended: false },
      { id: 'command-r', name: 'Command R', cost: '~$0.15/M entrée · $0.60/M sortie', recommended: false },
    ],
    recommended: false,
    dashboardUrl: 'https://dashboard.cohere.com/api-keys',
    keyPrefix: '',
    keyPlaceholder: 'Votre clé API Cohere',
    instructions: [
      'Rendez-vous sur dashboard.cohere.com',
      'Connectez-vous ou créez un compte',
      'Allez dans API Keys → Create Trial Key ou Production Key',
      'Copiez la clé générée et collez-la ci-dessous',
    ],
    pricingNote: 'Trial key gratuite avec limites, Production payant',
    costWarning: 'Trial key gratuite avec limites. Production payant à l\'usage.',
  },
]

// ══════════════════════════════════════════════════════════════
// PAGE COMPONENT — Production-ready AI Connections
// ══════════════════════════════════════════════════════════════

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export default function AIConnectionsPage() {
  const ai = useAIv2()
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [label, setLabel] = useState('')
  const [defaultModel, setDefaultModel] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [testModels, setTestModels] = useState<string[]>([])

  useEffect(() => {
    ai.loadConnections()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTest = async () => {
    if (!selectedProvider || !apiKey.trim()) return
    setTestStatus('testing')
    setTestMessage('')
    setTestModels([])

    const result = await ai.testConnection(selectedProvider, apiKey.trim())

    if (result.success) {
      setTestStatus('success')
      setTestMessage(result.message)
      if (result.models) setTestModels(result.models)
    } else {
      setTestStatus('error')
      setTestMessage(result.message)
    }
  }

  const handleCreate = async () => {
    if (!selectedProvider || !apiKey.trim()) return
    setIsCreating(true)
    const result = await ai.createConnection(
      selectedProvider,
      apiKey.trim(),
      label || undefined,
      defaultModel || undefined,
    )
    setIsCreating(false)

    if (result) {
      toast({ title: 'Connexion créée', description: `${providerDisplay(selectedProvider)?.name || selectedProvider} connecté avec succès.` })
      setShowAddModal(false)
      resetForm()
    } else {
      toast({ title: 'Erreur', description: ai.error || 'Impossible de créer la connexion', variant: 'destructive' })
    }
  }

  const handleDelete = async (connectionId: string) => {
    setIsDeleting(true)
    const success = await ai.deleteConnection(connectionId)
    setIsDeleting(false)
    setShowDeleteModal(null)

    if (success) {
      toast({ title: 'Connexion révoquée', description: 'La connexion a été révoquée avec succès.' })
    } else {
      toast({ title: 'Erreur', description: 'Impossible de révoquer la connexion', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setSelectedProvider(null)
    setApiKey('')
    setLabel('')
    setDefaultModel('')
    setShowApiKey(false)
    setTestStatus('idle')
    setTestMessage('')
    setTestModels([])
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Connecté</Badge>
      case 'PENDING_OAUTH':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      case 'EXPIRED':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200"><AlertTriangle className="h-3 w-3 mr-1" />Expiré</Badge>
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Erreur</Badge>
      case 'REVOKED':
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200"><XCircle className="h-3 w-3 mr-1" />Révoqué</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200">{status}</Badge>
    }
  }

  const providerDisplay = (providerId: string) => PROVIDERS.find(p => p.id === providerId)

  // Filter out providers that already have a CONNECTED connection
  const connectedProviders = new Set(
    ai.connections
      .filter(c => c.status === 'CONNECTED')
      .map(c => c.provider)
  )
  const availableProviders = PROVIDERS.filter(p => !connectedProviders.has(p.id))

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Brain className="h-6 w-6 text-violet-600" />
              Connexions IA
              <span className="text-xs font-bold text-violet-400 bg-violet-50 px-2 py-0.5 rounded-md ring-1 ring-violet-100">V2</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Connectez votre clé API pour activer l&apos;agent AURA
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une connexion
        </Button>
      </div>

      {/* How it works — shown only when no connections */}
      {!ai.connectionsLoading && ai.connections.filter(c => c.status === 'CONNECTED').length === 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-100/60">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-200/40">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-violet-900">Comment ça fonctionne ?</h3>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center text-[11px] font-bold text-violet-700">1</span>
                  <p className="text-sm text-violet-800">
                    <strong>Créez un compte</strong> chez un fournisseur IA (OpenAI, Anthropic, Mistral...)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center text-[11px] font-bold text-violet-700">2</span>
                  <p className="text-sm text-violet-800">
                    <strong>Générez une clé API</strong> depuis le tableau de bord du fournisseur
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center text-[11px] font-bold text-violet-700">3</span>
                  <p className="text-sm text-violet-800">
                    <strong>Collez votre clé ici</strong> — elle est chiffrée AES-256-GCM et ne quitte jamais nos serveurs
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-violet-600">
                <Shield className="h-3.5 w-3.5" />
                <span>Vos données client ne sont <strong>jamais</strong> transmises aux fournisseurs IA.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security note — shown when connections exist */}
      {!ai.connectionsLoading && ai.connections.filter(c => c.status === 'CONNECTED').length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
          <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700">
            Clés API chiffrées AES-256-GCM. Les données personnelles client ne sont jamais envoyées aux fournisseurs IA.
          </p>
        </div>
      )}

      {/* Connections List */}
      {ai.connectionsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : ai.connections.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Key className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Aucune connexion IA</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Ajoutez votre clé API pour commencer à utiliser AURA. C&apos;est rapide et sécurisé.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Configurer ma première connexion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ai.connections.map(conn => {
            const provider = providerDisplay(conn.provider)
            return (
              <Card key={conn.id} className="border border-slate-200/80 hover:border-slate-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'h-12 w-12 rounded-xl flex items-center justify-center text-2xl border',
                        provider?.color || 'bg-slate-50 border-slate-200'
                      )}>
                        {provider?.icon || '🤖'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-slate-900">
                            {conn.label || provider?.name || conn.provider}
                          </h3>
                          {getStatusBadge(conn.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {provider?.description || conn.provider}
                        </p>

                        {/* Details */}
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {conn.defaultModel && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Settings2 className="h-3 w-3" />
                              {conn.defaultModel}
                            </span>
                          )}
                          {conn.totalTokensUsed && conn.totalTokensUsed !== '0' && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Sparkles className="h-3 w-3" />
                              {parseInt(conn.totalTokensUsed).toLocaleString('fr-FR')} tokens
                            </span>
                          )}
                          {conn.consecutiveErrors > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              {conn.consecutiveErrors} erreur(s)
                            </span>
                          )}
                        </div>

                        {/* Last error */}
                        {conn.lastError && conn.status === 'ERROR' && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                            {conn.lastError}
                          </div>
                        )}

                        {/* Models chips */}
                        {conn.allowedModels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {conn.allowedModels.map(model => (
                              <span key={model} className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded',
                                model === conn.defaultModel
                                  ? 'bg-violet-100 text-violet-700 font-medium'
                                  : 'bg-slate-50 text-slate-500'
                              )}>
                                {model}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => ai.loadConnections()}
                        className="text-slate-500 hover:text-violet-600"
                        title="Rafraîchir"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteModal(conn.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ══════════════ ADD CONNECTION MODAL — Guided Flow ══════════════ */}
      <Modal open={showAddModal} onOpenChange={() => { setShowAddModal(false); resetForm() }}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-600" />
              {selectedProvider ? `Connexion ${providerDisplay(selectedProvider)?.name}` : 'Nouvelle connexion IA'}
            </ModalTitle>
            <ModalDescription>
              {selectedProvider
                ? 'Entrez votre clé API pour connecter ce fournisseur'
                : 'Choisissez un fournisseur d\'IA parmi ceux disponibles'}
            </ModalDescription>
          </ModalHeader>

          <div className="px-6 py-4 space-y-5">
            {/* Step 1: Provider Selection */}
            {!selectedProvider ? (
              <div className="space-y-2">
                {availableProviders.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">Tous les fournisseurs sont déjà connectés !</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableProviders.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProvider(p.id)
                          const rec = p.models.find(m => m.recommended)
                          setDefaultModel(rec ? rec.id : p.models[0].id)
                          setTestStatus('idle')
                          setTestMessage('')
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                          p.color, p.hoverColor,
                        )}
                      >
                        <span className="text-2xl shrink-0">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{p.name}</span>
                            {p.recommended && (
                              <Badge className={cn('text-[9px]', p.badgeColor)}>Recommandé</Badge>
                            )}
                          </div>
                          <p className="text-xs opacity-80 mt-0.5">{p.description}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">{p.pricingNote}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected provider header */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-2xl shrink-0">{providerDisplay(selectedProvider)?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">{providerDisplay(selectedProvider)?.name}</span>
                    <p className="text-xs text-slate-500">{providerDisplay(selectedProvider)?.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedProvider(null); setTestStatus('idle'); setTestMessage('') }}>
                    Changer
                  </Button>
                </div>

                {/* Step-by-step instructions */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Comment obtenir votre clé API</h4>
                  <ol className="space-y-2">
                    {providerDisplay(selectedProvider)?.instructions.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-700 mt-0.5">{i + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a
                    href={providerDisplay(selectedProvider)?.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ouvrir {providerDisplay(selectedProvider)?.name} Dashboard
                  </a>
                </div>

                {/* API Key input */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    Clé API
                  </Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setTestStatus('idle'); setTestMessage('') }}
                      placeholder={providerDisplay(selectedProvider)?.keyPlaceholder || 'Votre clé API'}
                      className={cn(
                        'pr-10 font-mono text-sm',
                        testStatus === 'success' && 'border-emerald-300 focus:ring-emerald-300',
                        testStatus === 'error' && 'border-red-300 focus:ring-red-300',
                      )}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Test result */}
                  {testStatus === 'success' && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium">{testMessage}</span>
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium">{testMessage}</span>
                    </div>
                  )}
                  {testStatus === 'idle' && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Chiffrée AES-256-GCM — jamais exposée en clair
                    </p>
                  )}
                </div>

                {/* Test button */}
                {apiKey.trim() && testStatus !== 'success' && (
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={testStatus === 'testing'}
                    className="w-full"
                  >
                    {testStatus === 'testing' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FlaskConical className="h-4 w-4 mr-2" />
                    )}
                    {testStatus === 'testing' ? 'Test en cours...' : 'Tester la connexion'}
                  </Button>
                )}

                {/* Model Selection — shown after successful test */}
                {testStatus === 'success' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-sm font-medium text-slate-700">
                        Modèle par défaut
                      </Label>
                      <div className="space-y-1.5">
                        {providerDisplay(selectedProvider)?.models.map(model => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => setDefaultModel(model.id)}
                            className={cn(
                              'w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                              defaultModel === model.id
                                ? 'border-violet-300 bg-violet-50/60 ring-1 ring-violet-200'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900">{model.name}</span>
                                {model.recommended && (
                                  <Badge className="text-[8px] bg-violet-100 text-violet-700 border-violet-200">Recommandé</Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{model.cost}</p>
                            </div>
                            {defaultModel === model.id && (
                              <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                      {/* Cost warning */}
                      {providerDisplay(selectedProvider)?.costWarning && (
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50/80 px-3 py-2 rounded-lg border border-amber-100">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span>{providerDisplay(selectedProvider)?.costWarning}</span>
                        </div>
                      )}
                    </div>

                    {/* Label (optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="label" className="text-sm font-medium text-slate-700">
                        Nom de la connexion <span className="text-slate-400 font-normal">(optionnel)</span>
                      </Label>
                      <Input
                        id="label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={`Mon compte ${providerDisplay(selectedProvider)?.name}`}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {selectedProvider && (
            <ModalFooter>
              <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm() }}>
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!apiKey.trim() || isCreating || testStatus === 'testing'}
                className={cn(
                  'text-white shadow-sm',
                  testStatus === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-violet-600 hover:bg-violet-700',
                )}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : testStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {testStatus === 'success' ? 'Activer la connexion' : 'Connecter'}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {/* ══════════════ DELETE CONFIRMATION MODAL ══════════════ */}
      <Modal open={!!showDeleteModal} onOpenChange={() => setShowDeleteModal(null)}>
        <ModalContent className="max-w-sm">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Révoquer la connexion
            </ModalTitle>
            <ModalDescription>
              La connexion sera révoquée et la clé API supprimée. Les sessions existantes ne seront pas affectées.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => showDeleteModal && handleDelete(showDeleteModal)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Révoquer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
