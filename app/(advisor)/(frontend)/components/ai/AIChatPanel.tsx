'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAIv2, type PageContextV2, type AgentActionV2, type AgentMetaV2, type ChatMessageV2, type AssistantProfileV2 } from '../../hooks/useAIv2'
import { cn } from '@/lib/utils'
import { MarkdownContent } from './MarkdownContent'
import { SourcesBadges } from './SourcesBadges'
import { CopyButton } from './CopyButton'
import { AgentActionBadges, TOOL_ICONS, TOOL_LABELS } from './AgentActionBadges'
import { ASSISTANT_MODES, ASSISTANT_PACKS, GENERAL_MODE, getModeById, getModesByPack, type AssistantMode, type PackId } from './assistant-modes'
import { SLASH_COMMANDS, parseSlashCommand, filterSlashCommands, getSlashCommandPrompt, SLASH_CATEGORY_LABELS, type SlashCommand } from './slash-commands'
import {
  Sparkles, Send, X, Loader2, Minimize2,
  User, Zap,
  CheckCircle2, AlertCircle, Brain,
  ListTodo, CalendarPlus, Search,
  BarChart3, ShieldCheck,
  BookOpen, ArrowUpRight,
  Mic, MicOff, Volume2, VolumeX, Square,
  Globe, TrendingUp, Shield,
  FileText, Database, Navigation,
  RefreshCw, MessageSquare, Plus, Trash2, Clock,
  PhoneCall, Settings2, AlertTriangle, Target,
  Gauge, Workflow, ChevronDown, Cpu, ChevronRight, Hash, Command,
} from 'lucide-react'
import { useSpeechToText } from '../../dashboard/entretiens/_hooks/useSpeechToText'

// ============================================================================
// AIChatPanel V7 — AURA V2 Autonomous Agent
//
// Interface conversationnelle utilisant l'architecture agent AURA V2 :
//   • Agent autonome : Planner → Executor → Critic
//   • Visualisation des plans, tool calls, validation, critic score
//   • Typewriter streaming simulation
//   • Sessions V2 (remplace les threads)
//   • Connexions IA multi-provider
//   • Voice-first : STT + TTS premium
//   • Thinking animation multi-étapes V2
//   • Indicateur de confiance et warnings
// ============================================================================

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
  cabinetId?: string
  userId?: string
  defaultMode?: string
  clientId?: string
  clientName?: string
  /** When true, panel fills its parent container instead of fixed overlay */
  integrated?: boolean
  prefillContext?: {
    clientName?: string
    advisorName?: string
    cabinetName?: string
    notes?: string
    concept?: string
  }
}

// ── Quick action cards ──
const QUICK_ACTIONS = [
  { text: 'Briefing du jour', icon: TrendingUp, gradient: 'from-violet-500 to-indigo-500' },
  { text: 'Mes tâches urgentes', icon: ListTodo, gradient: 'from-amber-500 to-orange-500' },
  { text: 'Alertes KYC', icon: Shield, gradient: 'from-rose-500 to-pink-500' },
  { text: 'Prochains RDV', icon: CalendarPlus, gradient: 'from-emerald-500 to-teal-500' },
]

const SMART_PROMPTS = [
  { text: 'Analyse mon portefeuille client', icon: BarChart3 },
  { text: 'Optimisation fiscale IR + IFI', icon: BookOpen },
  { text: 'Compare PER vs Assurance-vie', icon: ArrowUpRight },
  { text: 'Trouve mon client le plus important', icon: Search },
]

// Follow-up suggestions
const FOLLOWUP_MAP: Record<string, Array<{ text: string; icon: React.ElementType }>> = {
  search_clients: [
    { text: 'Ouvre son dossier', icon: Navigation },
    { text: 'Analyse son patrimoine', icon: Database },
    { text: 'Créer une tâche de suivi', icon: ListTodo },
  ],
  get_client_detail: [
    { text: 'Analyse patrimoniale', icon: Database },
    { text: 'Ses contrats actifs', icon: FileText },
    { text: 'Planifier un RDV', icon: CalendarPlus },
  ],
  get_portfolio_summary: [
    { text: 'Optimiser la fiscalité', icon: BookOpen },
    { text: 'Voir ses contrats', icon: FileText },
  ],
  get_upcoming_tasks: [
    { text: 'Page des tâches', icon: Navigation },
    { text: 'Tâches en retard', icon: AlertCircle },
  ],
  get_dashboard_stats: [
    { text: 'Alertes KYC', icon: ShieldCheck },
    { text: 'Tâches en retard', icon: ListTodo },
    { text: 'Prochains RDV', icon: CalendarPlus },
  ],
  default: [
    { text: 'Briefing du jour', icon: BarChart3 },
    { text: 'Mes tâches', icon: ListTodo },
  ],
}

// ── V2 Thinking steps (matches Planner → Executor → Critic lifecycle) ──
const THINKING_STEPS = [
  { label: 'Chargement mémoire...', icon: Brain },
  { label: 'Classification de l\'intent...', icon: Target },
  { label: 'Planification...', icon: Workflow },
  { label: 'Exécution...', icon: Zap },
  { label: 'Validation critique...', icon: Gauge },
  { label: 'Formulation...', icon: Sparkles },
]

// ── Confidence display ──
const CONFIDENCE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'Haute', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  MED: { label: 'Moyenne', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  LOW: { label: 'Faible', color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
}

// ============================================================================
// Composant Principal — AURA V7 (V2 Architecture)
// ============================================================================

export function AIChatPanel({
  isOpen, onClose, cabinetId, userId, prefillContext,
  clientId: propClientId, clientName: propClientName,
  integrated = false,
}: AIChatPanelProps) {
  const ai = useAIv2()
  const pathname = usePathname()
  const router = useRouter()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [thinkingStep, setThinkingStep] = useState(0)

  // ── Voice ──
  const [isTTSEnabled, setIsTTSEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)
  const sttAutoSendTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSpokenMsgRef = useRef<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  const confirmConfirmingRef = useRef(false)

  // ── Multi-assistant mode ──
  const [activeMode, setActiveMode] = useState<AssistantMode>(GENERAL_MODE)
  const [activePack, setActivePack] = useState<PackId | null>(null)

  // ── Slash commands ──
  const [slashSuggestions, setSlashSuggestions] = useState<SlashCommand[]>([])
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0)
  const [showSlashPanel, setShowSlashPanel] = useState(false)

  // STT with auto-send in voice mode
  const stt = useSpeechToText({
    language: 'fr-FR',
    continuous: true,
    interimResults: true,
    onResult: useCallback((transcript: string, isFinal: boolean) => {
      if (isFinal) {
        setInput(prev => {
          const trimmed = prev.trim()
          return trimmed ? `${trimmed} ${transcript}` : transcript
        })
      }
    }, []),
  })

  // Auto-send after 2s silence in voice mode
  useEffect(() => {
    if (!voiceMode || !stt.isListening) return
    if (sttAutoSendTimerRef.current) clearTimeout(sttAutoSendTimerRef.current)

    sttAutoSendTimerRef.current = setTimeout(() => {
      setInput(prev => {
        const text = prev.trim()
        if (text.length > 2) {
          setTimeout(() => {
            const submitBtn = document.getElementById('aura-submit-btn')
            if (submitBtn && !submitBtn.hasAttribute('disabled')) submitBtn.click()
          }, 50)
        }
        return prev
      })
    }, 2000)

    return () => { if (sttAutoSendTimerRef.current) clearTimeout(sttAutoSendTimerRef.current) }
  }, [input, voiceMode, stt.isListening])

  // OpenAI TTS — natural human voice
  const speakText = useCallback(async (text: string) => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause()
      ttsAudioRef.current = null
    }
    setIsSpeaking(true)
    try {
      const res = await fetch('/api/advisor/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'nova', speed: 1.05 }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      ttsAudioRef.current = audio
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
        ttsAudioRef.current = null
        if (voiceMode && !stt.isListening) {
          setTimeout(() => stt.start(), 300)
        }
      }
      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
        ttsAudioRef.current = null
      }
      if (stt.isListening) stt.stop()
      await audio.play()
    } catch {
      setIsSpeaking(false)
      if ('speechSynthesis' in window) {
        const clean = text
          .replace(/#{1,6}\s/g, '').replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1').replace(/`[^`]+`/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[-•–]\s/g, '')
          .replace(/\n{2,}/g, '. ').replace(/\n/g, '. ').trim()
        if (clean) {
          const utterance = new SpeechSynthesisUtterance(clean)
          utterance.lang = 'fr-FR'
          utterance.rate = 1.05
          const voices = window.speechSynthesis.getVoices()
          const frVoice = voices.find(v => v.lang.startsWith('fr') && !v.localService) || voices.find(v => v.lang.startsWith('fr'))
          if (frVoice) utterance.voice = frVoice
          utterance.onend = () => setIsSpeaking(false)
          utterance.onerror = () => setIsSpeaking(false)
          window.speechSynthesis.speak(utterance)
        }
      }
    }
  }, [voiceMode, stt])

  const stopSpeaking = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause()
      ttsAudioRef.current = null
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  // Auto-speak last assistant message when TTS is enabled
  useEffect(() => {
    if (!isTTSEnabled || ai.isStreaming) return
    const lastMsg = ai.chatHistory[ai.chatHistory.length - 1]
    if (lastMsg?.role === 'assistant' && lastMsg.content !== lastSpokenMsgRef.current) {
      lastSpokenMsgRef.current = lastMsg.content
      speakText(lastMsg.content)
    }
  }, [ai.chatHistory, ai.isStreaming, isTTSEnabled, speakText])

  useEffect(() => {
    if (!isOpen) stopSpeaking()
    return () => stopSpeaking()
  }, [isOpen, stopSpeaking])

  // Load sessions on mount (V2: replaces loadThreads)
  useEffect(() => {
    if (isOpen) ai.loadSessions()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Thinking animation (V2: longer lifecycle) ──
  useEffect(() => {
    if (!ai.isRunning && !ai.isStreaming) { setThinkingStep(0); return }
    if (ai.streamingContent) { setThinkingStep(THINKING_STEPS.length - 1); return }
    const interval = setInterval(() => {
      setThinkingStep(prev => (prev < THINKING_STEPS.length - 1 ? prev + 1 : prev))
    }, 800)
    return () => clearInterval(interval)
  }, [ai.isRunning, ai.isStreaming, ai.streamingContent])

  // ── Context detection ──
  const detectedClientId = useMemo(() => {
    if (propClientId) return propClientId
    const match = pathname?.match(/\/dashboard\/clients\/([a-zA-Z0-9_-]+)/)
    return match?.[1] || undefined
  }, [pathname, propClientId])

  const clientContextName = propClientName || (detectedClientId ? 'Client' : undefined)

  const pageContext = useMemo((): PageContextV2 | undefined => {
    if (!pathname) return undefined
    const ctx: PageContextV2 = { path: pathname }
    if (detectedClientId) {
      ctx.pageType = 'client_detail'
      ctx.clientId = detectedClientId
      ctx.clientName = clientContextName
    } else if (pathname.includes('/dashboard/taches')) {
      ctx.pageType = 'taches'
    } else if (pathname.includes('/dashboard/rendez-vous')) {
      ctx.pageType = 'rendez_vous'
    } else if (pathname.includes('/dashboard/contrats')) {
      ctx.pageType = 'contrats'
    } else if (pathname === '/dashboard' || pathname === '/dashboard/') {
      ctx.pageType = 'dashboard'
    } else if (pathname.includes('/dashboard/clients')) {
      ctx.pageType = 'clients_list'
    } else if (pathname.includes('/dashboard/conformite')) {
      ctx.pageType = 'conformite'
    } else if (pathname.includes('/dashboard/pilotage')) {
      ctx.pageType = 'pilotage'
    }
    // Inject active assistant mode into context
    if (activeMode.id !== 'general' && activeMode.promptInjection) {
      ctx.modeId = activeMode.id
      ctx.modePrompt = activeMode.promptInjection
    }
    return ctx
  }, [pathname, detectedClientId, clientContextName, activeMode])

  // ── Navigation (V2: from lastAgentActions) ──
  useEffect(() => {
    if (!ai.isStreaming && !ai.isRunning && ai.lastAgentActions.length > 0) {
      const navAction = ai.lastAgentActions.find(a => a.navigationUrl && a.status === 'executed')
      if (navAction?.navigationUrl) router.push(navAction.navigationUrl)
    }
  }, [ai.isStreaming, ai.isRunning, ai.lastAgentActions, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ai.chatHistory, ai.streamingContent])

  useEffect(() => {
    if (isOpen && textareaRef.current) textareaRef.current.focus()
  }, [isOpen])

  // ── Handlers ──
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'

    // Slash command autocomplete detection
    if (value.startsWith('/')) {
      const suggestions = filterSlashCommands(value)
      setSlashSuggestions(suggestions)
      setSlashSelectedIndex(0)
    } else {
      setSlashSuggestions([])
    }
  }, [])

  // Execute a slash command: switch mode + send auto-prompt
  const executeSlashCommand = useCallback(async (cmd: SlashCommand, args?: string) => {
    const mode = getModeById(cmd.modeId)
    setActiveMode(mode)
    setActivePack(mode.pack)
    setSlashSuggestions([])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const prompt = getSlashCommandPrompt(cmd, !!detectedClientId, args)
    // Build page context with the newly selected mode
    const slashCtx: PageContextV2 | undefined = pageContext
      ? {
          ...pageContext,
          modeId: mode.id !== 'general' ? mode.id : undefined,
          modePrompt: mode.id !== 'general' ? mode.promptInjection : undefined,
        }
      : undefined
    await ai.sendMessageStream(prompt, detectedClientId, slashCtx)
  }, [ai, detectedClientId, pageContext])

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text || ai.isLoading || ai.isStreaming) return

    // Intercept slash commands
    const parsed = parseSlashCommand(text)
    if (parsed) {
      await executeSlashCommand(parsed.command, parsed.args)
      return
    }

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await ai.sendMessageStream(text, detectedClientId, pageContext)
  }, [input, ai, detectedClientId, pageContext, executeSlashCommand])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Slash command autocomplete keyboard navigation
    if (slashSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashSelectedIndex(prev => Math.min(prev + 1, slashSuggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashSelectedIndex(prev => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault()
        const selected = slashSuggestions[slashSelectedIndex]
        if (selected) {
          executeSlashCommand(selected)
        }
        return
      }
      if (e.key === 'Escape') {
        setSlashSuggestions([])
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const handleSuggestionClick = useCallback(async (text: string) => {
    if (ai.isLoading || ai.isStreaming) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await ai.sendMessageStream(text, detectedClientId, pageContext)
  }, [ai, detectedClientId, pageContext])

  const canSend = useMemo(
    () => input.trim().length > 0 && !ai.isLoading && !ai.isStreaming,
    [input, ai.isLoading, ai.isStreaming]
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className={cn(
      'flex flex-col bg-[#f8f9fb] border-l border-slate-200/40',
      integrated
        ? 'h-full w-full'
        : 'fixed right-0 top-0 h-full w-[520px] shadow-[-20px_0_60px_-12px_rgba(0,0,0,0.12)] z-50'
    )}>

      {/* ═══════════ HEADER — Premium Glassmorphism ═══════════ */}
      <div className="relative flex items-center justify-between px-5 h-[56px] border-b border-white/20 shrink-0 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />

        <div className="relative flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Sparkles className="h-[18px] w-[18px] text-white" />
            </div>
            {ai.isAvailable && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-white tracking-tight">AURA</h2>
              <span className="text-[9px] font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded-md backdrop-blur-sm">V2</span>
              {ai.lastAgentMeta?.connectionMode === 'byok' && (
                <span className="text-[8px] font-bold text-emerald-300 bg-emerald-400/15 px-1.5 py-0.5 rounded-md backdrop-blur-sm">BYOK</span>
              )}
            </div>
            <p className="text-[11px] text-white/50 font-medium leading-none mt-0.5">
              {!ai.isAvailable
                ? 'Connexion requise'
                : ai.isRunning
                  ? '● Analyse en cours...'
                  : ai.isStreaming
                    ? '● Rédaction...'
                    : activeMode.id !== 'general'
                      ? `● ${activeMode.shortName}`
                      : 'Agent patrimonial autonome'}
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-0.5 shrink-0">
          {!ai.isAvailable && (
            <a
              href="/dashboard/settings/ai-connections"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="Configurer une connexion IA"
            >
              <Settings2 className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={() => setShowHistory(prev => !prev)}
            className={cn(
              'p-2 rounded-lg transition-all',
              showHistory ? 'text-white bg-white/15' : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
            title="Historique"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={() => { ai.newConversation(); setShowHistory(false); setActiveMode(GENERAL_MODE); setActivePack(null) }}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Réduire (Ctrl+I)"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══════════ PROFILE SELECTOR + CLIENT CONTEXT ═══════════ */}
      {(detectedClientId || ai.profiles.length > 1) && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50/60 border-b border-slate-100/50 shrink-0">
          {/* Profile selector */}
          {ai.profiles.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileSelector(prev => !prev)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold text-violet-700 bg-violet-50/80 hover:bg-violet-100 border border-violet-100/60 transition-all"
              >
                <Cpu className="h-3 w-3" />
                <span className="max-w-[120px] truncate">
                  {ai.profiles.find(p => p.id === ai.activeProfileId)?.name || 'Profil'}
                </span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', showProfileSelector && 'rotate-180')} />
              </button>
              {showProfileSelector && (
                <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/40 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profils d&apos;assistant</div>
                  {ai.profiles.map(profile => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => { ai.selectProfile(profile.id); setShowProfileSelector(false) }}
                      className={cn(
                        'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors',
                        profile.id === ai.activeProfileId
                          ? 'bg-violet-50/80 text-violet-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <Cpu className={cn(
                        'h-3.5 w-3.5 mt-0.5 shrink-0',
                        profile.id === ai.activeProfileId ? 'text-violet-600' : 'text-slate-400'
                      )} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-semibold truncate">{profile.name}</span>
                          {profile.isDefault && (
                            <span className="text-[8px] font-bold text-violet-500 bg-violet-100 px-1 py-0.5 rounded">Défaut</span>
                          )}
                        </div>
                        {profile.description && (
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{profile.description}</p>
                        )}
                        {profile.enabledDomains.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {profile.enabledDomains.slice(0, 3).map(d => (
                              <span key={d} className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-500">{d}</span>
                            ))}
                            {profile.enabledDomains.length > 3 && (
                              <span className="text-[8px] text-slate-400">+{profile.enabledDomains.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {profile.id === ai.activeProfileId && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Client context */}
          {detectedClientId && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="h-4 w-4 rounded-md bg-indigo-100 flex items-center justify-center">
                <User className="h-2.5 w-2.5 text-indigo-600" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-700">{clientContextName || detectedClientId}</span>
              <span className="text-[9px] text-indigo-400 font-medium">· Contexte actif</span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ SESSION HISTORY ═══════════ */}
      {showHistory && (
        <div className="border-b border-slate-100/60 bg-white max-h-[45%] overflow-y-auto shrink-0">
          <div className="p-3 space-y-0.5">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversations</h3>
              {ai.sessionsLoading && <Loader2 className="h-3 w-3 animate-spin text-violet-400" />}
            </div>
            {ai.sessions.length === 0 && !ai.sessionsLoading && (
              <p className="text-[11px] text-slate-400 py-4 text-center">Aucune conversation</p>
            )}
            {ai.sessions.map(session => (
              <div
                key={session.id}
                onClick={() => { ai.loadSession(session.id); setShowHistory(false) }}
                className={cn(
                  'group flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all',
                  session.id === ai.currentSessionId
                    ? 'bg-violet-50/80 border border-violet-100/60'
                    : 'hover:bg-slate-50 border border-transparent'
                )}
              >
                <div className={cn(
                  'h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                  session.id === ai.currentSessionId
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                )}>
                  <MessageSquare className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className={cn(
                      'text-[12px] font-semibold truncate',
                      session.id === ai.currentSessionId ? 'text-violet-700' : 'text-slate-700'
                    )}>
                      {session.title}
                    </p>
                    {session.client && (
                      <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
                        {session.client.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {session.messagesCount} messages
                    {session.totalToolCalls > 0 && <span className="text-violet-400"> · {session.totalToolCalls} actions</span>}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); ai.deleteSession(session.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 shrink-0 mt-0.5"
                  title="Supprimer"
                >
                  <Trash2 className="h-3 w-3 text-slate-300 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ CONTENT AREA ═══════════ */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {ai.chatHistory.length === 0 ? (
          /* ─── EMPTY STATE — Multi-Assistant Premium Welcome ─── */
          <div className="flex flex-col h-full px-4 py-3 space-y-3">

            {/* No connection banner */}
            {!ai.isAvailable && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/40">
                <div className="shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-amber-900">Connexion IA requise</p>
                  <p className="text-[11px] text-amber-700/70">Ajoutez une clé API pour déverrouiller AURA.</p>
                </div>
                <a href="/dashboard/settings/ai-connections" className="shrink-0 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-3 py-1.5 rounded-lg transition-all">
                  Configurer
                </a>
              </div>
            )}

            {/* ─── Active Mode Indicator (when a specialized mode is selected) ─── */}
            {activeMode.id !== 'general' ? (
              <div className="relative rounded-2xl bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r', activeMode.gradient)} />
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <div className={cn('shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md', activeMode.gradient)}>
                    <activeMode.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-slate-900">{activeMode.name}</p>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r text-white', activeMode.gradient)}>
                        {activeMode.priorityTools.length} outils
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{activeMode.description}</p>
                  </div>
                  <button
                    onClick={() => { setActiveMode(GENERAL_MODE); setActivePack(null) }}
                    className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* ─── Compact Hero (general mode only) ─── */
              <div className="flex items-center gap-3.5 py-1">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  {ai.isAvailable && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-[#f8f9fb] items-center justify-center">
                      <Zap className="h-2 w-2 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-900 tracking-tight">{greeting}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-500">{ASSISTANT_MODES.length} assistants</span> spécialisés à votre disposition.
                  </p>
                </div>
              </div>
            )}

            {/* ─── Pack Tabs ─── */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
              <button
                onClick={() => { setActivePack(null); if (activeMode.id !== 'general') { setActiveMode(GENERAL_MODE) } }}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                  activePack === null
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                )}
              >
                Tous
                <span className={cn(
                  'text-[9px] font-extrabold px-1 rounded',
                  activePack === null ? 'bg-white/20 text-white/80' : 'bg-slate-200/60 text-slate-400'
                )}>
                  {ASSISTANT_MODES.length}
                </span>
              </button>
              {ASSISTANT_PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => setActivePack(activePack === pack.id ? null : pack.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                    activePack === pack.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {pack.label}
                  <span className={cn(
                    'text-[9px] font-extrabold px-1 rounded',
                    activePack === pack.id ? 'bg-white/20 text-white/80' : 'bg-slate-200/60 text-slate-400'
                  )}>
                    {getModesByPack(pack.id).length}
                  </span>
                </button>
              ))}
            </div>

            {/* ─── Assistant Grid ─── */}
            {activeMode.id === 'general' && (
              <div className="grid grid-cols-2 gap-2">
                {(activePack ? getModesByPack(activePack) : ASSISTANT_MODES).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => { setActiveMode(mode); setActivePack(mode.pack) }}
                    className="group relative flex flex-col items-start p-3 rounded-2xl bg-white border border-slate-200/60 hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-200 text-left overflow-hidden"
                  >
                    <div className={cn('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300', mode.gradient)} />
                    <div className="flex items-center gap-2.5 mb-2 w-full">
                      <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200', mode.gradient)}>
                        <mode.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 group-hover:text-slate-900 leading-tight truncate">{mode.shortName}</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">{mode.priorityTools.length} outils</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{mode.description}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ─── Slash Commands Quick Access (general mode only) ─── */}
            {activeMode.id === 'general' && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <Hash className="h-3 w-3" />
                  Commandes rapides
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
                  {SLASH_COMMANDS.slice(0, 6).map((cmd) => {
                    const CmdIcon = cmd.icon
                    return (
                      <button
                        key={cmd.command}
                        onClick={() => executeSlashCommand(cmd)}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300/80 hover:shadow-sm transition-all text-left group"
                      >
                        <div className={cn('h-5 w-5 rounded-md bg-gradient-to-br flex items-center justify-center', cmd.gradient)}>
                          <CmdIcon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 whitespace-nowrap">/{cmd.command}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ─── Mode-specific suggested prompts (when a mode is selected) ─── */}
            {activeMode.id !== 'general' && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Suggestions — {activeMode.shortName}</p>
                <div className="space-y-1.5">
                  {activeMode.suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/60 hover:border-slate-300/80 hover:shadow-md hover:shadow-slate-200/30 transition-all text-left group"
                    >
                      <div className={cn('shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm', activeMode.gradient)}>
                        {i + 1}
                      </div>
                      <span className="flex-1 text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 leading-snug">{prompt}</span>
                      <Send className="h-3 w-3 text-slate-300 group-hover:text-violet-500 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Quick Stats / Insights (always visible, compact) ─── */}
            {ai.backgroundInsights && ai.backgroundInsights.quickStats && (() => {
              const stats = ai.backgroundInsights.quickStats
              const alerts: Array<{ label: string; count: number; prompt: string; gradient: string; icon: typeof AlertTriangle }> = []
              if (stats.tachesEnRetard > 0) alerts.push({ label: 'En retard', count: stats.tachesEnRetard, prompt: 'Montre-moi les tâches en retard avec les détails', gradient: 'from-red-500 to-rose-500', icon: AlertTriangle })
              if (stats.kycExpirant > 0) alerts.push({ label: 'KYC', count: stats.kycExpirant, prompt: 'Liste les clients dont le KYC expire dans 30 jours', gradient: 'from-amber-500 to-orange-500', icon: Shield })
              if (stats.reclamationsOuvertes > 0) alerts.push({ label: 'Réclam.', count: stats.reclamationsOuvertes, prompt: 'Détaille les réclamations ouvertes', gradient: 'from-orange-500 to-red-500', icon: AlertCircle })
              if (stats.clientsSansContact > 0) alerts.push({ label: 'Inactifs', count: stats.clientsSansContact, prompt: 'Quels clients n\'ont pas été contactés depuis longtemps ?', gradient: 'from-slate-500 to-slate-600', icon: User })

              if (alerts.length === 0) return null

              return (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Alertes</p>
                  <div className="flex gap-2">
                    {alerts.map((alert, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(alert.prompt)}
                        className="flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl bg-white border border-slate-200/60 hover:shadow-md transition-all group"
                      >
                        <span className="text-[18px] font-extrabold text-slate-900">{alert.count}</span>
                        <span className="text-[9px] font-semibold text-slate-400 group-hover:text-slate-600 mt-0.5">{alert.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ─── Background insights — properly rendered (NO raw JSON) ─── */}
            {ai.backgroundInsights && ai.backgroundInsights.insights.length > 0 && (
              <div className="space-y-1">
                {ai.backgroundInsights.insights.slice(0, 3).map((insight, i) => {
                  const insightTitle = (insight as Record<string, unknown>).title as string | undefined
                  const insightDesc = (insight as Record<string, unknown>).description as string | undefined
                  const insightMsg = insight.message || insightTitle || ''
                  const insightDetail = insightDesc || ''
                  const insightType = (insight as Record<string, unknown>).type as string | undefined || insight.severity || 'info'

                  if (!insightMsg && !insightDetail) return null

                  const typeConfig: Record<string, { icon: typeof Brain; color: string; bg: string }> = {
                    warning: { icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100/60' },
                    error: { icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-100/60' },
                    opportunity: { icon: TrendingUp, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100/60' },
                    success: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100/60' },
                    info: { icon: Brain, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100/60' },
                  }
                  const cfg = typeConfig[insightType] || typeConfig.info
                  const InsightIcon = cfg.icon

                  return (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(insightMsg || insightDetail)}
                      className={cn('w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all hover:shadow-sm', cfg.bg)}
                    >
                      <InsightIcon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', cfg.color)} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-[11px] font-semibold leading-snug', cfg.color)}>{insightMsg}</p>
                        {insightDetail && <p className={cn('text-[10px] mt-0.5 leading-snug opacity-70', cfg.color)}>{insightDetail}</p>}
                      </div>
                      <ArrowUpRight className={cn('h-3 w-3 shrink-0 mt-0.5 opacity-40', cfg.color)} />
                    </button>
                  )
                })}
              </div>
            )}

            {/* ─── Client context card ─── */}
            {detectedClientId && clientContextName && (
              <div className="relative rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/60 p-3.5 overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[12px] font-bold text-indigo-900">{clientContextName}</span>
                    <span className="text-[8px] font-bold text-indigo-500/60 bg-indigo-100/60 px-1.5 py-0.5 rounded-md">Actif</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { text: 'Analyse dossier', icon: Search },
                      { text: 'Patrimoine', icon: Database },
                      { text: 'Contrats', icon: FileText },
                      { text: 'Suivi', icon: ListTodo },
                    ].map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(`${s.text} de ${clientContextName}`)}
                        className="flex items-center gap-2 text-left text-[10px] font-semibold text-indigo-700 bg-white/70 hover:bg-white px-2.5 py-2 rounded-lg transition-all border border-indigo-100/40 hover:border-indigo-200 hover:shadow-sm"
                      >
                        <s.icon className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── MESSAGES (V2) — Premium Chat ─── */
          <div className="px-4 py-4 space-y-4">
            {ai.chatHistory.map((msg, i) => (
              <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {/* Avatar AURA */}
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200/30">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                )}
                <div className={cn('flex flex-col max-w-[88%] group', msg.role === 'user' ? 'items-end' : 'items-start')}>
                  {/* Message bubble */}
                  <div className={cn(
                    'rounded-2xl px-4 py-3 text-[13px] leading-[1.7]',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-lg shadow-lg shadow-indigo-300/20'
                      : 'bg-white text-slate-800 rounded-bl-lg border border-slate-200/60 shadow-sm'
                  )}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownContent content={msg.content} className="text-slate-700" />
                    )}
                  </div>

                  {/* Assistant message footer */}
                  {msg.role === 'assistant' && (
                    <div className="mt-1.5 pl-0.5 space-y-1.5 w-full">
                      {/* Action toolbar — always visible for actions, hover for utility */}
                      <div className="flex items-center gap-1">
                        <CopyButton text={msg.content} />
                        <button
                          type="button"
                          onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-violet-600"
                          title={isSpeaking ? 'Arrêter' : 'Écouter'}
                        >
                          {isSpeaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </button>
                        {/* Spacer */}
                        <div className="flex-1" />
                        {/* Critic score pill */}
                        {msg.agentMeta?.criticReport && (
                          <span className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                            msg.agentMeta.criticReport.passed
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          )}>
                            {msg.agentMeta.criticReport.passed ? '✓' : '⚠'} {Math.round(msg.agentMeta.criticReport.score * 100)}%
                          </span>
                        )}
                        {/* Model + duration — hover only */}
                        {msg.agentMeta?.modelUsed && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-slate-400 font-mono flex items-center gap-1">
                            {msg.agentMeta.modelUsed.split('/').pop()}
                            {msg.agentMeta.connectionMode === 'byok' && (
                              <span className="text-[7px] font-bold text-emerald-500 bg-emerald-50 px-1 rounded">BYOK</span>
                            )}
                          </span>
                        )}
                        {msg.agentMeta?.durationMs ? (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-slate-300 font-mono">
                            {(msg.agentMeta.durationMs / 1000).toFixed(1)}s
                          </span>
                        ) : null}
                      </div>

                      {/* Agent tool calls */}
                      {msg.agentActions && msg.agentActions.length > 0 && (
                        <AgentActionBadges actions={msg.agentActions} />
                      )}

                      {/* Warnings */}
                      {msg.agentMeta?.warnings && msg.agentMeta.warnings.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.agentMeta.warnings.map((w, wi) => (
                            <span key={wi} className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                              <AlertTriangle className="h-3 w-3" />
                              {w}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Avatar user */}
                {msg.role === 'user' && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* ─── Thinking — Minimal elegant spinner ─── */}
            {(ai.isRunning || (ai.isStreaming && !ai.streamingContent)) && ai.lastAgentActions.length === 0 && (
              <div className="flex gap-2.5">
                <div className="shrink-0 mt-0.5">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200/30">
                    <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-lg px-4 py-3 border border-slate-200/60 shadow-sm min-w-[200px]">
                  <div className="space-y-1.5">
                    {THINKING_STEPS.map((step, i) => {
                      const StepIcon = step.icon
                      const isActive = i === thinkingStep
                      const isDone = i < thinkingStep
                      const isPending = i > thinkingStep
                      return (
                        <div key={i} className={cn(
                          'flex items-center gap-2 text-[12px] transition-all duration-300',
                          isActive && 'text-violet-600 font-medium',
                          isDone && 'text-emerald-500',
                          isPending && 'text-slate-300/70'
                        )}>
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <StepIcon className={cn('h-3 w-3', isActive && 'animate-pulse')} />
                          )}
                          <span className="leading-none">{step.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Agent actions while executing (tool calls in progress) */}
            {(ai.isRunning || ai.isStreaming) && ai.lastAgentActions.length > 0 && !ai.streamingContent && (
              <div className="flex gap-2.5">
                <div className="shrink-0 mt-0.5">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200/30">
                    <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 max-w-[88%]">
                  <AgentActionBadges actions={ai.lastAgentActions} />
                  {ai.lastAgentMeta?.plan && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50/80 rounded-xl border border-violet-100/40">
                      <Workflow className="h-3 w-3 text-violet-400" />
                      <span className="text-[10px] text-violet-600 font-medium truncate">{ai.lastAgentMeta.plan.strategy}</span>
                      <span className="text-[9px] text-violet-400 shrink-0">· {ai.lastAgentMeta.plan.stepsCount} étapes</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Streaming content */}
            {ai.isStreaming && ai.streamingContent && (
              <div className="flex gap-2.5">
                <div className="shrink-0 mt-0.5">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200/30">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <div className="flex flex-col max-w-[88%]">
                  <div className="bg-white rounded-2xl rounded-bl-lg px-4 py-3 text-[13px] border border-slate-200/60 shadow-sm leading-[1.7]">
                    <MarkdownContent content={ai.streamingContent} className="text-slate-700" />
                    <span className="inline-block w-[3px] h-[16px] bg-gradient-to-t from-violet-600 to-indigo-400 rounded-full ml-0.5 animate-pulse align-text-bottom" />
                  </div>
                  {ai.lastAgentActions.length > 0 && (
                    <div className="mt-1.5 pl-0.5">
                      <AgentActionBadges actions={ai.lastAgentActions} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading state */}
            {ai.isLoading && !ai.isRunning && !ai.isStreaming && (
              <div className="flex gap-2.5">
                <div className="shrink-0 mt-0.5">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200/30">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-lg px-4 py-3 border border-slate-200/60 shadow-sm">
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                    <span className="text-[12px] font-medium">Préparation...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation cards */}
            {ai.lastAgentActions.filter(a => a.status === 'pending_confirmation').length > 0 && !ai.isStreaming && !ai.isRunning && (
              <div className="space-y-2">
                {ai.lastAgentActions.filter(a => a.status === 'pending_confirmation').map((action, i) => {
                  const Icon = TOOL_ICONS[action.toolName] || Zap
                  return (
                    <div key={i} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-amber-900">{TOOL_LABELS[action.toolName] || action.toolName}</p>
                          <p className="text-[12px] text-amber-700/80 mt-0.5">{action.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => ai.sendMessageStream('oui, confirme', detectedClientId, pageContext)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirmer
                        </button>
                        <button
                          onClick={() => ai.sendMessageStream('non, annule', detectedClientId, pageContext)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all"
                        >
                          <X className="h-3.5 w-3.5" />
                          Annuler
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Follow-up suggestions — pill style */}
            {!ai.isStreaming && !ai.isRunning && ai.chatHistory.length > 0 && ai.chatHistory[ai.chatHistory.length - 1]?.role === 'assistant' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {((): Array<{ text: string; icon: React.ElementType }> => {
                  const lastTool = ai.lastAgentActions.find(a => a.status === 'executed')?.toolName
                  return FOLLOWUP_MAP[lastTool || ''] || FOLLOWUP_MAP.default
                })().map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s.text)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-white hover:bg-violet-50 hover:text-violet-700 rounded-full transition-all border border-slate-200/80 hover:border-violet-200 shadow-sm hover:shadow group"
                  >
                    <s.icon className="h-3 w-3 text-slate-400 group-hover:text-violet-500 transition-colors" />
                    {s.text}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ═══════════ INPUT AREA — Premium Composer ═══════════ */}
      <div className="border-t border-slate-100 px-4 pt-3 pb-4 bg-gradient-to-t from-slate-50/80 to-white shrink-0">
        {ai.error && (
          <div className="mb-3 text-[12px] text-red-700 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-2.5 rounded-xl border border-red-100/60 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="flex-1">{ai.error}</span>
            <button onClick={() => ai.clearChat()} className="text-red-400 hover:text-red-600 shrink-0 p-1 rounded-md hover:bg-red-100/60 transition-colors">
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* STT interim preview */}
        {stt.isListening && stt.interimTranscript && (
          <div className="mb-2 px-3.5 py-2 bg-violet-50/60 rounded-xl border border-violet-100/40">
            <p className="text-[11px] text-violet-600 italic truncate flex items-center gap-1.5">
              <Mic className="h-3 w-3 animate-pulse shrink-0 text-violet-500" />
              {stt.interimTranscript}
            </p>
          </div>
        )}

        {/* Active mode badge above input */}
        {activeMode.id !== 'general' && ai.chatHistory.length > 0 && (
          <div className="mb-1.5 flex items-center gap-2">
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r text-white text-[10px] font-bold shadow-sm', activeMode.gradient)}>
              <activeMode.icon className="h-3 w-3" />
              {activeMode.shortName}
            </div>
            <button
              onClick={() => { setActiveMode(GENERAL_MODE); setActivePack(null) }}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Retour mode général
            </button>
          </div>
        )}

        {/* ─── Slash command autocomplete dropdown ─── */}
        {slashSuggestions.length > 0 && (
          <div className="mb-2 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/40 py-1.5 max-h-[280px] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-1 flex items-center gap-1.5">
              <Command className="h-3 w-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commandes</span>
              <span className="ml-auto text-[9px] text-slate-300">↑↓ naviguer · ↵ exécuter · Esc fermer</span>
            </div>
            {slashSuggestions.map((cmd, i) => {
              const CmdIcon = cmd.icon
              return (
                <button
                  key={cmd.command}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); executeSlashCommand(cmd) }}
                  onMouseEnter={() => setSlashSelectedIndex(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                    i === slashSelectedIndex
                      ? 'bg-violet-50/80 text-violet-900'
                      : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className={cn('shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', cmd.gradient)}>
                    <CmdIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold">/{cmd.command}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{cmd.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-snug truncate">{cmd.description}</p>
                  </div>
                  {cmd.requiresClient && !detectedClientId && (
                    <span className="shrink-0 text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Client requis</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ─── Slash commands quick panel (toggleable) ─── */}
        {showSlashPanel && slashSuggestions.length === 0 && (
          <div className="mb-2 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/40 py-2 max-h-[320px] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-1 flex items-center gap-1.5 mb-1">
              <Hash className="h-3 w-3 text-violet-500" />
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Commandes rapides</span>
              <button
                type="button"
                onClick={() => setShowSlashPanel(false)}
                className="ml-auto p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 px-2">
              {SLASH_COMMANDS.map((cmd) => {
                const CmdIcon = cmd.icon
                return (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => { setShowSlashPanel(false); executeSlashCommand(cmd) }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className={cn('shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center', cmd.gradient)}>
                      <CmdIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 leading-tight">/{cmd.command}</p>
                      <p className="text-[9px] text-slate-400 truncate">{cmd.label}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-end gap-2 bg-white rounded-2xl p-2 border border-slate-200/80 focus-within:border-violet-400/60 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.08)] transition-all">
          {/* Slash command trigger button */}
          <button
            type="button"
            onClick={() => setShowSlashPanel(prev => !prev)}
            className={cn(
              'shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all',
              showSlashPanel
                ? 'bg-violet-100 text-violet-600'
                : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'
            )}
            title="Commandes /slash"
          >
            <Hash className="h-4 w-4" />
          </button>

          {/* Mic button */}
          {stt.isSupported && (
            <button
              type="button"
              onClick={() => stt.isListening ? stt.stop() : stt.start()}
              className={cn(
                'shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all',
                stt.isListening
                  ? 'bg-red-500 text-white shadow-md shadow-red-200/50 animate-pulse hover:bg-red-600'
                  : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'
              )}
              title={stt.isListening ? 'Arrêter' : 'Dicter'}
            >
              {stt.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              stt.isListening
                ? 'Parlez, je vous écoute...'
                : activeMode.id !== 'general'
                  ? `${activeMode.name} — posez votre question...`
                  : detectedClientId && clientContextName
                    ? `Interroger AURA sur ${clientContextName}...`
                    : 'Tapez / pour les commandes ou posez une question...'
            }
            className="flex-1 bg-transparent border-0 resize-none text-[13px] text-slate-800 placeholder:text-slate-400/80 outline-none px-1.5 py-2 min-h-[40px] max-h-[160px] leading-relaxed"
            rows={1}
          />

          {/* Send button */}
          <button
            id="aura-submit-btn"
            onClick={handleSubmit}
            disabled={!canSend}
            className={cn(
              'shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200',
              canSend
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-300/30 hover:shadow-xl active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            )}
          >
            {ai.isLoading || ai.isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Footer controls — minimal, clean */}
        <div className="mt-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            {/* TTS toggle */}
            <button
              type="button"
              onClick={() => { setIsTTSEnabled(prev => !prev); if (isSpeaking) stopSpeaking() }}
              className={cn(
                'flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-all',
                isTTSEnabled
                  ? 'text-violet-600 bg-violet-50/80'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              )}
            >
              {isTTSEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              Vocal
            </button>

            {/* Voice conversation mode */}
            <button
              type="button"
              onClick={() => {
                const next = !voiceMode
                setVoiceMode(next)
                if (next) {
                  setIsTTSEnabled(true)
                  if (!stt.isListening) stt.start()
                } else {
                  if (stt.isListening) stt.stop()
                  stopSpeaking()
                }
              }}
              className={cn(
                'flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-all',
                voiceMode
                  ? 'text-emerald-600 bg-emerald-50/80 animate-pulse'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              )}
              title={voiceMode ? 'Arrêter la conversation vocale' : 'Conversation vocale'}
            >
              <PhoneCall className="h-3 w-3" />
              {voiceMode ? 'En conversation' : 'Parler'}
            </button>

            {/* STT / TTS indicators */}
            {stt.isListening && (
              <span className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                REC
              </span>
            )}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-1 text-[10px] text-violet-500 font-medium animate-pulse hover:bg-violet-50 px-1.5 py-0.5 rounded-md transition-colors"
                title="Arrêter"
              >
                <Square className="h-2.5 w-2.5" />
                Lecture
              </button>
            )}
          </div>

          {/* Right side: model info */}
          <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
            {ai.lastAgentMeta?.modelUsed && (
              <span className="font-mono">{ai.lastAgentMeta.modelUsed.split('/').pop()}</span>
            )}
            {ai.lastAgentMeta?.durationMs ? (
              <span className="font-mono">{(ai.lastAgentMeta.durationMs / 1000).toFixed(1)}s</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
