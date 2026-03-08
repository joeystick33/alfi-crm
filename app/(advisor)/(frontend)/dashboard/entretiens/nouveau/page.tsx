'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Badge } from '@/app/_common/components/ui/Badge'
import { useToast } from '@/app/_common/hooks/use-toast'
import { useClients } from '@/app/_common/hooks/api/use-clients-api'
import { useCreateEntretien, useUpdateEntretien, useTraiterEntretien, useClientBrief } from '@/app/_common/hooks/api/use-entretiens-api'
import { useSpeechToText, type AudioMode, type STTEngine } from '../_hooks/useSpeechToText'
import { useAudioVisualizer } from '../_hooks/useAudioVisualizer'
import { useAISuggestions, type AISuggestion } from '../_hooks/useAISuggestions'
import { useAutoDiarization } from '../_hooks/useAutoDiarization'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ArrowRight, Mic, Square, Pause, Play,
  Search, Check, X, ChevronRight, Shield, Loader2,
  FileText, Pencil, Trash2, RotateCcw, Sparkles, Users, Eye,
  AlertTriangle, ClipboardList, StickyNote, Lightbulb,
  Phone, Video, ChevronUp,
  MessageSquare, Zap, RefreshCw, BarChart3, Volume2,
} from 'lucide-react'
import Link from 'next/link'

// ============================================================================
// Types
// ============================================================================

interface TranscriptionSegment {
  id: string
  speaker: string
  text: string
  timestamp: number
  confidence: number
  edited: boolean
}

type InterviewMode = 'presentiel' | 'visio' | 'telephone'
type WizardStep = 'configuration' | 'consentement' | 'enregistrement' | 'revision' | 'traitement'

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'configuration', label: 'Préparation' },
  { id: 'consentement', label: 'Consentement' },
  { id: 'enregistrement', label: 'Entretien' },
  { id: 'revision', label: 'Révision' },
  { id: 'traitement', label: 'Analyse IA' },
]

const TYPE_OPTIONS = [
  { value: 'DECOUVERTE', label: 'Découverte', icon: '🔍' },
  { value: 'SUIVI_PERIODIQUE', label: 'Suivi périodique', icon: '📅' },
  { value: 'BILAN_PATRIMONIAL', label: 'Bilan patrimonial', icon: '📊' },
  { value: 'CONSEIL_PONCTUEL', label: 'Conseil ponctuel', icon: '💡' },
  { value: 'SIGNATURE', label: 'Signature', icon: '✍️' },
  { value: 'AUTRE', label: 'Autre', icon: '📝' },
]

const MODE_OPTIONS: { value: InterviewMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'presentiel', label: 'Présentiel', icon: <Users className="h-4 w-4" />, desc: 'En face à face au cabinet' },
  { value: 'visio', label: 'Visioconférence', icon: <Video className="h-4 w-4" />, desc: 'Teams, Zoom, Meet — capture audio écran' },
  { value: 'telephone', label: 'Téléphone', icon: <Phone className="h-4 w-4" />, desc: 'Appel téléphonique — suppression bruit' },
]

const CONSENTEMENT_TEXT = `Cet entretien sera transcrit en texte à l'aide d'un outil de reconnaissance vocale intégré au CRM. L'enregistrement audio ne sera pas conservé — seule la transcription textuelle sera sauvegardée pour le suivi de votre dossier. Vous pouvez demander la suppression de cette transcription à tout moment, conformément au RGPD (art. 17).`

const CHECKLISTS: Record<string, string[]> = {
  DECOUVERTE: [
    '1. Situation familiale (état civil, enfants)',
    '1. Situation matrimoniale (régime, DDV)',
    '2. Situation professionnelle',
    '3. Libéralités consenties (donations, testament)',
    '4. Patrimoine immobilier',
    '4. Patrimoine financier (AV, PEA, PER)',
    '4. Valeurs mobilières et épargne',
    '4. Passif et endettement',
    '5. Situation fiscale (IR, IFI, TMI)',
    'Objectifs et horizon',
    'Prévoyance et protection',
    'Profil de risque MiFID II',
  ],
  SUIVI_PERIODIQUE: [
    'Évolutions de situation',
    'Revue des contrats en cours',
    'Performance des placements',
    'Suivi des actions décidées',
    'Évolutions fiscales impactantes',
    'Nouveaux projets ou besoins',
    'Réajustement de l\'allocation',
  ],
  BILAN_PATRIMONIAL: [
    '1. Situation familiale et matrimoniale',
    '2. Situation professionnelle',
    '3. Libéralités consenties',
    '4. Biens d\'usage (RP, RS)',
    '4. Immobilier de rapport (locatif, SCI, SCPI)',
    '4. Valeurs mobilières (PEA, CIF, FCPI)',
    '4. Assurance-vie et capitalisation',
    '4. Épargne retraite (PER, PERP, Madelin)',
    '4. Disponibilités et liquidités',
    '4. Passif (crédits, dettes)',
    '5. Fiscalité IR / IFI / PS',
    'Objectifs patrimoniaux prioritaires',
    'Horizon et profil de risque MiFID II',
  ],
  CONSEIL_PONCTUEL: [
    'Identifier le sujet précis',
    'Contexte et contraintes',
    'Alternatives envisagées',
    'Recommandation et justification',
    'Actions à mettre en œuvre',
  ],
  SIGNATURE: [
    'Rappel des termes de la préconisation',
    'Vérification des documents',
    'Signature des pièces',
    'Prochaines étapes',
  ],
  AUTRE: [],
}

// Speaker colors for visual diarization
const SPEAKER_COLORS: Record<string, { bg: string; text: string; border: string; light: string; dot: string }> = {
  conseiller: { bg: 'bg-[#7373FF]/10', text: 'text-[#5c5ce6]', border: 'border-[#7373FF]/30', light: 'bg-[#7373FF]/5', dot: 'bg-[#7373FF]' },
  client: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-50/50', dot: 'bg-emerald-500' },
  interlocuteur_2: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50/50', dot: 'bg-amber-500' },
  interlocuteur_3: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', light: 'bg-rose-50/50', dot: 'bg-rose-500' },
}

const SPEAKER_LABELS: Record<string, string> = {
  conseiller: 'Conseiller',
  client: 'Client',
  interlocuteur_2: 'Interlocuteur 2',
  interlocuteur_3: 'Interlocuteur 3',
}

function getSpeakerColor(speaker: string) {
  return SPEAKER_COLORS[speaker] || SPEAKER_COLORS.client
}

function getSpeakerDotColor(speaker: string): string {
  if (speaker === 'conseiller') return '#7373FF'
  if (speaker === 'client') return '#10b981'
  if (speaker === 'interlocuteur_2') return '#f59e0b'
  return '#f43f5e'
}

// ============================================================================
// Main Component
// ============================================================================

export default function NouvelEntretienPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createMutation = useCreateEntretien()
  const updateMutation = useUpdateEntretien()
  const traiterMutation = useTraiterEntretien()

  // Wizard state
  const [step, setStep] = useState<WizardStep>('configuration')
  const [entretienId, setEntretienId] = useState<string | null>(null)

  // STT engine
  const [sttEngine, setSttEngine] = useState<STTEngine>('browser')
  const [whisperAvailable, setWhisperAvailable] = useState(false)

  // Vérifier la disponibilité de Whisper au montage
  useEffect(() => {
    fetch('/api/advisor/transcribe')
      .then(r => r.json())
      .then(data => {
        if (data.available) {
          setWhisperAvailable(true)
          setSttEngine('whisper') // Préférer Whisper si disponible
        }
      })
      .catch(() => { /* pas de Whisper dispo */ })
  }, [])

  // Step 1: Configuration
  const [mode, setMode] = useState<InterviewMode>('presentiel')
  const [config, setConfig] = useState({
    type: 'DECOUVERTE',
    titre: '',
    clientId: '',
    isNewProspect: false,
    prospectNom: '',
    prospectPrenom: '',
    prospectEmail: '',
    prospectTel: '',
  })
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Step 2: Consentement
  const [consentement, setConsentement] = useState(false)

  // Step 3: Enregistrement
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [speakers, setSpeakers] = useState<string[]>(['conseiller', 'client'])
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const transcriptionEndRef = useRef<HTMLDivElement>(null)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  // Step 4: Revision
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Step 5: Traitement
  const [traitementType, setTraitementType] = useState<'RESUME' | 'BILAN_PATRIMONIAL' | null>(null)
  const [traitementResult, setTraitementResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<string>('')

  // Notes conseiller
  const [notesConseiller, setNotesConseiller] = useState('')
  const [checklistDone, setChecklistDone] = useState<Set<number>>(new Set())

  // Client data
  const { data: clientsData, isLoading: clientsLoading } = useClients()
  const clients = useMemo(() => {
    if (!clientsData) return []
    const apiData = clientsData as unknown as Record<string, unknown>
    const rawData = apiData.data || apiData.clients || clientsData
    return Array.isArray(rawData) ? rawData : []
  }, [clientsData])

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 8)
    const s = clientSearch.toLowerCase()
    return clients.filter((c: any) =>
      c.firstName?.toLowerCase().includes(s) ||
      c.lastName?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s)
    ).slice(0, 8)
  }, [clients, clientSearch])

  const selectedClient = useMemo(() =>
    config.clientId ? clients.find((c: any) => c.id === config.clientId) : null,
    [clients, config.clientId]
  )

  // Client brief
  const { data: briefRaw, isLoading: briefLoading } = useClientBrief(config.clientId || null)
  const brief: any = useMemo(() => {
    if (!briefRaw) return null
    const d = briefRaw as Record<string, unknown>
    return d.data || d
  }, [briefRaw])

  // Checklist items not yet done
  const checklistItems = CHECKLISTS[config.type] || []
  const checklistRestants = useMemo(
    () => checklistItems.filter((_, i) => !checklistDone.has(i)),
    [checklistItems, checklistDone]
  )

  // Audio visualizer (doit être déclaré AVANT le STT pour fournir micStream)
  const visualizer = useAudioVisualizer({
    barCount: 48,
    mode,
    silenceThreshold: 0.02,
    silenceDurationMs: 2000,
  })

  // ── STT Hook ──
  // Ref stable pour lire le locuteur détecté dans le callback STT (pas de stale closure)
  const diarizationSpeakerRef = useRef<string>('conseiller')

  const stt = useSpeechToText({
    language: 'fr-FR',
    audioMode: mode as AudioMode,
    silenceThresholdMs: 2500,
    engine: sttEngine,
    mediaStream: visualizer.micStream,
    speakerHint: 'conseiller',
    onResult: useCallback((text: string, isFinal: boolean, confidence?: number) => {
      if (isFinal && text.trim()) {
        const now = Date.now()
        const timestamp = startTime ? now - startTime : 0
        const newSegment: TranscriptionSegment = {
          id: `seg-${now}-${Math.random().toString(36).slice(2, 7)}`,
          speaker: diarizationSpeakerRef.current,
          text: text.trim(),
          timestamp,
          confidence: confidence ?? 0.9,
          edited: false,
        }
        setSegments(prev => [...prev, newSegment])
      }
    }, [startTime]),
    // Pipeline Whisper : recevoir les segments diarisés du backend
    onDiarizedSegments: useCallback((pipelineSegments: Array<{ id: string; speaker: string; text: string; start: number; end: number; confidence: number }>) => {
      const baseTimestamp = startTime || Date.now()
      const newSegments: TranscriptionSegment[] = pipelineSegments.map(seg => ({
        id: seg.id,
        speaker: seg.speaker,
        text: seg.text,
        timestamp: baseTimestamp + (seg.start * 1000),
        confidence: seg.confidence,
        edited: false,
      }))
      setSegments(prev => [...prev, ...newSegments])
    }, [startTime]),
  })

  // ── Auto-diarisation : détection automatique des locuteurs ──
  // En mode Whisper pipeline, la diarisation est faite côté serveur — on désactive le hook client
  const diarization = useAutoDiarization({
    mediaStream: visualizer.micStream,
    enabled: recordingState === 'recording' && sttEngine !== 'whisper',
    maxSpeakers: 4,
  })

  // Sync la ref du speaker pour le callback STT
  useEffect(() => {
    diarizationSpeakerRef.current = diarization.currentSpeaker
  }, [diarization.currentSpeaker])

  // Sync les speakers détectés avec l'état local (pour la révision)
  useEffect(() => {
    if (diarization.profiles.length > 0) {
      const detected = diarization.profiles.map(p => p.id)
      setSpeakers(prev => {
        const merged = [...prev]
        for (const sp of detected) {
          if (!merged.includes(sp)) merged.push(sp)
        }
        return merged.length !== prev.length ? merged : prev
      })
    }
  }, [diarization.profiles])

  // AI Suggestions — Aide à la découverte
  const aiSuggestions = useAISuggestions({
    entretienType: config.type,
    checklistRestants,
    clientBrief: brief,
    segments,
    enabled: recordingState === 'recording' && segments.length > 0,
    debounceMs: 25000,
    minNewWords: 25,
  })

  // Auto-generate title
  useEffect(() => {
    if (config.titre) return
    const typeLabel = TYPE_OPTIONS.find(t => t.value === config.type)?.label || ''
    const clientName = selectedClient
      ? `${(selectedClient as any).firstName} ${(selectedClient as any).lastName}`
      : config.prospectPrenom ? `${config.prospectPrenom} ${config.prospectNom}` : ''
    const date = new Date().toLocaleDateString('fr-FR')
    if (clientName) {
      setConfig(prev => ({ ...prev, titre: `${typeLabel} — ${clientName} — ${date}` }))
    }
  }, [config.type, config.clientId, config.prospectPrenom, config.prospectNom, selectedClient])

  // Timer
  useEffect(() => {
    if (recordingState !== 'recording' || !startTime) return
    const interval = setInterval(() => setElapsedMs(Date.now() - startTime), 200)
    return () => clearInterval(interval)
  }, [recordingState, startTime])

  // Auto-scroll transcription
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [segments])

  // Auto-save every 30s
  useEffect(() => {
    if (!entretienId || segments.length === 0 || recordingState !== 'recording') return
    const interval = setInterval(() => {
      updateMutation.mutate({
        id: entretienId,
        data: {
          transcription: segments,
          transcriptionBrute: segments.map(s => `[${SPEAKER_LABELS[s.speaker] || s.speaker}] ${s.text}`).join('\n'),
          duree: Math.floor(elapsedMs / 1000),
        },
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [entretienId, segments, recordingState, elapsedMs])

  // ── Handlers ──

  const handleStartRecording = useCallback(async () => {
    if (recordingState === 'idle') {
      try {
        const result = await createMutation.mutateAsync({
          titre: config.titre || `Entretien — ${new Date().toLocaleDateString('fr-FR')}`,
          type: config.type,
          clientId: config.clientId || undefined,
          prospectNom: config.isNewProspect ? config.prospectNom : undefined,
          prospectPrenom: config.isNewProspect ? config.prospectPrenom : undefined,
          prospectEmail: config.isNewProspect ? config.prospectEmail : undefined,
          prospectTel: config.isNewProspect ? config.prospectTel : undefined,
          consentementRecueilli: consentement,
          consentementDate: new Date().toISOString(),
          consentementTexte: CONSENTEMENT_TEXT,
        } as any)
        const created = (result as any).data || result
        setEntretienId(created.id)
        if (!created.id) {
          console.error('[Entretien] ID manquant dans la réponse:', result)
          toast({ title: 'Avertissement', description: 'Entretien créé mais ID non récupéré. L\'analyse IA pourrait ne pas fonctionner.', variant: 'warning' })
        }
      } catch (err) {
        toast({ title: 'Erreur', description: 'Impossible de créer l\'entretien. Vérifiez votre connexion.', variant: 'destructive' })
        return
      }
    }
    setStartTime(prev => prev || Date.now())
    setRecordingState('recording')
    stt.start()
    visualizer.start()
  }, [recordingState, config, consentement, createMutation, stt, visualizer, toast])

  const handlePause = useCallback(() => {
    setRecordingState('paused')
    stt.pause()
  }, [stt])

  const handleResume = useCallback(() => {
    setRecordingState('recording')
    stt.resume()
  }, [stt])

  const handleStop = useCallback(async () => {
    setRecordingState('stopped')
    stt.stop()
    visualizer.stop()

    if (entretienId) {
      try {
        await updateMutation.mutateAsync({
          id: entretienId,
          data: {
            transcription: segments,
            transcriptionBrute: segments.map(s => `[${SPEAKER_LABELS[s.speaker] || s.speaker}] ${s.text}`).join('\n'),
            duree: Math.floor(elapsedMs / 1000),
            status: 'TRANSCRIT',
            notesConseiller: notesConseiller || undefined,
          },
        })
      } catch {
        toast({ title: 'Avertissement', description: 'La sauvegarde automatique a échoué. Vos données sont en mémoire locale.', variant: 'warning' })
      }
    }
    setStep('revision')
  }, [stt, visualizer, entretienId, segments, elapsedMs, updateMutation, notesConseiller, toast])

  const addSpeaker = useCallback(() => {
    const nextIdx = speakers.length
    if (nextIdx >= 4) return
    const newSpeaker = `interlocuteur_${nextIdx}`
    setSpeakers(prev => [...prev, newSpeaker])
    SPEAKER_LABELS[newSpeaker] = `Interlocuteur ${nextIdx}`
  }, [speakers])

  // Keyboard shortcuts
  useEffect(() => {
    if (step !== 'enregistrement' || recordingState !== 'recording') return
    const handler = (e: KeyboardEvent) => {
      if (e.target !== document.body) return
      if (e.code === 'KeyP' && e.ctrlKey) { e.preventDefault(); handlePause() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, recordingState, handlePause])

  const handleEditSegment = (seg: TranscriptionSegment) => {
    setEditingSegmentId(seg.id)
    setEditText(seg.text)
  }

  const handleSaveEdit = () => {
    if (!editingSegmentId) return
    setSegments(prev => prev.map(s => s.id === editingSegmentId ? { ...s, text: editText, edited: true } : s))
    setEditingSegmentId(null)
    setEditText('')
  }

  const handleDeleteSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id))
  }

  const handleChangeSpeaker = (id: string) => {
    setSegments(prev => prev.map(s => {
      if (s.id !== id) return s
      const idx = speakers.indexOf(s.speaker)
      return { ...s, speaker: speakers[(idx + 1) % speakers.length] }
    }))
  }

  const handleMergeWithPrevious = (id: string) => {
    const idx = segments.findIndex(s => s.id === id)
    if (idx <= 0) return
    const prev = segments[idx - 1]
    const current = segments[idx]
    if (prev.speaker !== current.speaker) return
    setSegments(segs => {
      const next = [...segs]
      next[idx - 1] = { ...prev, text: `${prev.text} ${current.text}`, edited: true }
      next.splice(idx, 1)
      return next
    })
  }

  const handleTraiter = async () => {
    if (!traitementType) {
      toast({ title: 'Sélectionnez un type d\'analyse', variant: 'destructive' })
      return
    }
    if (segments.length === 0) {
      toast({ title: 'Aucun segment à analyser', variant: 'destructive' })
      return
    }

    setIsProcessing(true)
    setProcessingStep('Préparation...')

    try {
      // ── Étape 1 : S'assurer qu'on a un entretien en base ──
      let currentId = entretienId
      if (!currentId) {
        setProcessingStep('Création de l\'entretien...')
        try {
          const createResult = await createMutation.mutateAsync({
            titre: config.titre || `Entretien — ${new Date().toLocaleDateString('fr-FR')}`,
            type: config.type,
            clientId: config.clientId || undefined,
            prospectNom: config.isNewProspect ? config.prospectNom : undefined,
            prospectPrenom: config.isNewProspect ? config.prospectPrenom : undefined,
            consentementRecueilli: consentement,
            consentementDate: new Date().toISOString(),
            consentementTexte: CONSENTEMENT_TEXT,
          } as any)
          const created = (createResult as any).data || createResult
          currentId = created.id
          if (currentId) {
            setEntretienId(currentId)
          } else {
            console.error('[Traitement] Pas d\'ID dans la réponse create:', createResult)
          }
        } catch (createErr) {
          console.error('[Traitement] Erreur création entretien:', createErr)
          toast({ title: 'Impossible de créer l\'entretien', description: createErr instanceof Error ? createErr.message : 'Erreur serveur', variant: 'destructive' })
          setIsProcessing(false)
          setProcessingStep('')
          return
        }
      }

      if (!currentId) {
        console.error('[Traitement] currentId toujours null après tentative de création')
        toast({ title: 'Erreur critique', description: 'Impossible d\'obtenir l\'identifiant de l\'entretien. Rechargez la page et réessayez.', variant: 'destructive' })
        setIsProcessing(false)
        setProcessingStep('')
        return
      }

      // ── Étape 2 : Sauvegarder la transcription ──
      setProcessingStep('Sauvegarde de la transcription...')
      try {
        await updateMutation.mutateAsync({
          id: currentId,
          data: {
            transcription: segments,
            transcriptionBrute: segments.map(s => `[${SPEAKER_LABELS[s.speaker] || s.speaker}] ${s.text}`).join('\n'),
            duree: Math.floor(elapsedMs / 1000),
            status: 'TRANSCRIT',
            notesConseiller: notesConseiller || undefined,
          },
        })
      } catch (saveErr) {
        console.warn('[Traitement] Sauvegarde pré-analyse échouée (non-bloquant):', saveErr)
      }

      // ── Étape 3 : Lancer l'analyse IA ──
      setProcessingStep(traitementType === 'RESUME' ? 'Génération du résumé par l\'IA...' : 'Analyse patrimoniale par l\'IA...')
      const result = await traiterMutation.mutateAsync({
        id: currentId,
        data: { type: traitementType, transcription: segments },
      })

      // Unwrap : createSuccessResponse → { data: { resultat: {...}, ... }, timestamp }
      const responseData = (result as any).data || result
      const parsedResult = responseData.resultat || responseData
      setProcessingStep('Terminé !')
      setTraitementResult(parsedResult)
      toast({ title: 'Analyse terminée', description: `${traitementType === 'RESUME' ? 'Résumé' : 'Bilan patrimonial'} généré avec succès.` })
    } catch (err) {
      console.error('[Traitement] Erreur complète:', err)
      const message = err instanceof Error ? err.message : 'Erreur interne du serveur'
      toast({ title: 'Erreur lors du traitement IA', description: message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  // ── Format helpers ──
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    return h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === step)
  const speakerStats = useMemo(() => {
    const total = segments.length || 1
    const counts: Record<string, number> = {}
    segments.forEach(s => { counts[s.speaker] = (counts[s.speaker] || 0) + 1 })
    return { counts, total }
  }, [segments])

  const canGoNext = () => {
    if (step === 'configuration') return !!(config.clientId || (config.isNewProspect && config.prospectPrenom))
    if (step === 'consentement') return consentement
    if (step === 'revision') return segments.length > 0
    return false
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/entretiens">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Nouvel entretien</h1>
                {config.titre && <p className="text-xs text-slate-500 truncate max-w-md">{config.titre}</p>}
              </div>
            </div>

            {/* Step indicator */}
            <div className="hidden md:flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
                    step === s.id
                      ? 'bg-[#7373FF]/10 text-[#5c5ce6] ring-1 ring-[#7373FF]/30'
                      : i < currentStepIndex
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                  )}>
                    {i < currentStepIndex ? <Check className="h-3 w-3" /> : null}
                    <span>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300 mx-0.5" />}
                </div>
              ))}
            </div>

            {/* Timer badge during recording */}
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <div className="flex items-center gap-2">
                {recordingState === 'recording' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                <span className="text-sm font-mono font-semibold tabular-nums text-slate-800">
                  {formatTime(elapsedMs)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ═══ STEP 1: CONFIGURATION ═══ */}
        {step === 'configuration' && (
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Mode d'entretien */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Mode d&apos;entretien</label>
              <div className="grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left',
                      mode === m.value
                        ? 'border-[#7373FF] bg-[#7373FF]/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      mode === m.value ? 'bg-[#7373FF]/10 text-[#5c5ce6]' : 'bg-slate-100 text-slate-500'
                    )}>
                      {m.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.label}</p>
                      <p className="text-[11px] text-slate-500">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Moteur de transcription */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Moteur de transcription</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSttEngine('browser')}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left',
                    sttEngine === 'browser'
                      ? 'border-[#7373FF] bg-[#7373FF]/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className={cn('p-2 rounded-lg', sttEngine === 'browser' ? 'bg-[#7373FF]/10 text-[#5c5ce6]' : 'bg-slate-100 text-slate-500')}>
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Navigateur</p>
                    <p className="text-[11px] text-slate-500">Web Speech API — gratuit, temps réel</p>
                  </div>
                </button>
                <button
                  onClick={() => whisperAvailable && setSttEngine('whisper')}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left',
                    !whisperAvailable && 'opacity-50 cursor-not-allowed',
                    sttEngine === 'whisper'
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div className={cn('p-2 rounded-lg', sttEngine === 'whisper' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Whisper IA {!whisperAvailable && <span className="text-[10px] text-slate-400 font-normal">(clé API requise)</span>}</p>
                    <p className="text-[11px] text-slate-500">{whisperAvailable ? 'Groq/OpenAI — qualité supérieure, anti-bruit' : 'Ajoutez GROQ_API_KEY dans .env'}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Type d'entretien */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Type d&apos;entretien</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setConfig(prev => ({ ...prev, type: t.value, titre: '' }))}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all',
                      config.type === t.value
                        ? 'border-[#7373FF] bg-[#7373FF]/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <p className="text-sm font-medium text-slate-800 mt-1">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Client selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Client / Prospect</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, isNewProspect: false, prospectNom: '', prospectPrenom: '', prospectEmail: '', prospectTel: '' }))}
                    className={cn('text-xs px-2.5 py-1 rounded-full transition-colors', !config.isNewProspect ? 'bg-[#7373FF]/10 text-[#5c5ce6] font-medium' : 'text-slate-500 hover:bg-slate-100')}
                  >
                    Client existant
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, isNewProspect: true, clientId: '' }))}
                    className={cn('text-xs px-2.5 py-1 rounded-full transition-colors', config.isNewProspect ? 'bg-[#7373FF]/10 text-[#5c5ce6] font-medium' : 'text-slate-500 hover:bg-slate-100')}
                  >
                    Nouveau prospect
                  </button>
                </div>
              </div>

              {!config.isNewProspect ? (
                <>
                  {selectedClient ? (
                    <div className="flex items-center justify-between p-3 bg-[#7373FF]/5 rounded-lg border border-[#7373FF]/20">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#7373FF] flex items-center justify-center text-white text-xs font-semibold">
                          {(selectedClient as any).firstName?.[0]}{(selectedClient as any).lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{(selectedClient as any).firstName} {(selectedClient as any).lastName}</p>
                          <p className="text-xs text-slate-500">{(selectedClient as any).email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setConfig(prev => ({ ...prev, clientId: '' }))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Rechercher un client..."
                        value={clientSearch}
                        onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true) }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="pl-10 h-10"
                      />
                      {showClientDropdown && (
                        <div className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                          {clientsLoading ? (
                            <div className="p-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" /></div>
                          ) : filteredClients.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">Aucun client trouvé</div>
                          ) : (
                            filteredClients.map((c: any) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setConfig(prev => ({ ...prev, clientId: c.id, titre: '' }))
                                  setClientSearch('')
                                  setShowClientDropdown(false)
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left transition-colors"
                              >
                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">{c.firstName?.[0]}{c.lastName?.[0]}</div>
                                <div>
                                  <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                                  <p className="text-[11px] text-slate-500">{c.email}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Prénom *</Label>
                    <Input value={config.prospectPrenom} onChange={(e) => setConfig(prev => ({ ...prev, prospectPrenom: e.target.value, titre: '' }))} placeholder="Jean" className="mt-1 h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Nom</Label>
                    <Input value={config.prospectNom} onChange={(e) => setConfig(prev => ({ ...prev, prospectNom: e.target.value, titre: '' }))} placeholder="Dupont" className="mt-1 h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={config.prospectEmail} onChange={(e) => setConfig(prev => ({ ...prev, prospectEmail: e.target.value }))} placeholder="jean@example.com" className="mt-1 h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Téléphone</Label>
                    <Input value={config.prospectTel} onChange={(e) => setConfig(prev => ({ ...prev, prospectTel: e.target.value }))} placeholder="06 12 34 56 78" className="mt-1 h-9" />
                  </div>
                </div>
              )}
            </div>

            {/* Brief client */}
            {config.clientId && brief && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#5c5ce6]" />
                  <span className="text-sm font-medium text-slate-700">Brief client</span>
                  {briefLoading && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                </div>
                {brief.client && (
                  <div className="flex flex-wrap gap-2">
                    {brief.client.patrimoineNet != null && (
                      <div className="px-3 py-1.5 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Patrimoine net</span>
                        <span className="text-sm font-semibold tabular-nums">{Number(brief.client.patrimoineNet).toLocaleString('fr-FR')} €</span>
                      </div>
                    )}
                    {brief.client.totalRevenus != null && (
                      <div className="px-3 py-1.5 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-500 uppercase block">Revenus</span>
                        <span className="text-sm font-semibold tabular-nums">{Number(brief.client.totalRevenus).toLocaleString('fr-FR')} €</span>
                      </div>
                    )}
                    {brief.client.capaciteEpargne != null && (
                      <div className="px-3 py-1.5 bg-emerald-50 rounded-lg">
                        <span className="text-[10px] text-emerald-600 uppercase block">Épargne</span>
                        <span className="text-sm font-semibold text-emerald-700 tabular-nums">{Number(brief.client.capaciteEpargne).toLocaleString('fr-FR')} €/m</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {brief.client?.maritalStatus && <Badge variant="outline" className="text-[10px]">{brief.client.maritalStatus}</Badge>}
                  {(brief.client?.numberOfChildren as number) > 0 && <Badge variant="outline" className="text-[10px]">{brief.client.numberOfChildren} enfant(s)</Badge>}
                  {brief.client?.profession && <Badge variant="outline" className="text-[10px]">{brief.client.profession}</Badge>}
                  {brief.client?.riskProfile && <Badge variant="secondary" className="text-[10px]">Risque : {brief.client.riskProfile}</Badge>}
                </div>
                {brief.alertes?.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-700">
                      {brief.alertes.map((a: string, i: number) => <p key={i}>{a}</p>)}
                    </div>
                  </div>
                )}
                {brief.actionsEnAttente?.length > 0 && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg">
                    <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 space-y-0.5">
                      {brief.actionsEnAttente.slice(0, 3).map((a: any, i: number) => <p key={i}>{a.action}</p>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <Label className="text-sm font-medium text-slate-700">Titre</Label>
              <Input value={config.titre} onChange={(e) => setConfig(prev => ({ ...prev, titre: e.target.value }))} placeholder="Auto-généré si vide" className="mt-1" />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep('consentement')} disabled={!canGoNext()} className="bg-[#7373FF] hover:bg-[#5c5ce6]">
                Suivant <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: CONSENTEMENT ═══ */}
        {step === 'consentement' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-amber-200 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-lg bg-amber-100"><Shield className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Consentement RGPD</h2>
                  <p className="text-xs text-slate-500">Recueillez le consentement avant l&apos;enregistrement</p>
                </div>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100 text-sm leading-relaxed text-slate-700 mb-4">
                <p className="text-xs font-medium text-amber-700 mb-2">Texte à lire au client :</p>
                <blockquote className="border-l-2 border-amber-400 pl-3 italic text-slate-600">{CONSENTEMENT_TEXT}</blockquote>
              </div>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#7373FF] transition-colors">
                <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#7373FF] focus:ring-[#7373FF]" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Le client a donné son consentement oral</p>
                  <p className="text-xs text-slate-500 mt-0.5">Vous certifiez avoir lu le texte ci-dessus et obtenu l&apos;accord.</p>
                </div>
              </label>
              {consentement && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg mt-3">
                  <Check className="h-3.5 w-3.5" />
                  Recueilli le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('configuration')}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
              <Button onClick={() => setStep('enregistrement')} disabled={!consentement} className="bg-[#7373FF] hover:bg-[#5c5ce6]">
                Lancer l&apos;entretien <Mic className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: ENREGISTREMENT — 2 colonnes ═══ */}
        {step === 'enregistrement' && (
          <div className="flex gap-4 items-start">
            {/* ── Colonne principale ── */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Controls bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {recordingState === 'idle' && (
                      <Button onClick={handleStartRecording} disabled={createMutation.isPending} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                        Démarrer
                      </Button>
                    )}
                    {recordingState === 'recording' && (
                      <>
                        <Button variant="outline" size="sm" onClick={handlePause} className="gap-1.5"><Pause className="h-3.5 w-3.5" /> Pause</Button>
                        <Button size="sm" onClick={handleStop} className="gap-1.5 bg-slate-800 hover:bg-slate-900 text-white"><Square className="h-3.5 w-3.5" /> Terminer</Button>
                      </>
                    )}
                    {recordingState === 'paused' && (
                      <>
                        <Button size="sm" onClick={handleResume} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"><Play className="h-3.5 w-3.5" /> Reprendre</Button>
                        <Button size="sm" onClick={handleStop} className="gap-1.5 bg-slate-800 hover:bg-slate-900 text-white"><Square className="h-3.5 w-3.5" /> Terminer</Button>
                      </>
                    )}
                  </div>

                  {/* Audio visualizer */}
                  <div className="flex-1 mx-4">
                    <div className="flex items-end justify-center gap-[2px] h-8">
                      {visualizer.levels.map((level, i) => (
                        <div
                          key={i}
                          className="w-[3px] rounded-full transition-all duration-75"
                          style={{
                            height: `${Math.max(3, level * 32)}px`,
                            backgroundColor: getSpeakerDotColor(diarization.currentSpeaker),
                            opacity: 0.4 + level * 0.6,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {mode === 'presentiel' ? <Users className="h-3 w-3" /> : mode === 'visio' ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                      {MODE_OPTIONS.find(m => m.value === mode)?.label}
                    </Badge>
                    <Badge variant={sttEngine === 'whisper' ? 'default' : 'outline'} className={cn('text-[10px] gap-1', sttEngine === 'whisper' && 'bg-emerald-600')}>
                      {sttEngine === 'whisper' ? <Sparkles className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                      {sttEngine === 'whisper' ? 'Whisper' : 'Browser'}
                    </Badge>
                    {stt.rejectedCount > 0 && (
                      <span className="text-[10px] text-slate-400" title="Segments rejetés (bruit filtré)">🔇 {stt.rejectedCount}</span>
                    )}
                    {stt.pipelineQuality && (
                      <span className="text-[10px] text-slate-400" title={`Pipeline: ${stt.pipelineQuality.totalSegments} seg, ${stt.pipelineQuality.rejectedSegments} rejetés, LLM: ${stt.pipelineQuality.llmCorrected ? 'oui' : 'non'}`}>
                        {stt.pipelineQuality.llmCorrected && <span className="text-emerald-500">✓ LLM</span>}
                        {' '}📊 {Math.round(stt.pipelineQuality.avgConfidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Auto-diarization status */}
                {recordingState === 'recording' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 shrink-0">Locuteur détecté :</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {speakers.map(sp => {
                        const isActive = diarization.currentSpeaker === sp
                        const color = getSpeakerColor(sp)
                        return (
                          <div
                            key={sp}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                              isActive
                                ? `${color.bg} ${color.text} ring-2 ring-offset-1 ${color.border}`
                                : 'bg-slate-100 text-slate-400'
                            )}
                          >
                            <span className={cn('w-2 h-2 rounded-full', color.dot, !isActive && 'opacity-40')} />
                            {SPEAKER_LABELS[sp] || sp}
                            {isActive && diarization.isSpeaking && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className={cn('w-1.5 h-1.5 rounded-full', diarization.isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
                      <span className="text-[10px] text-slate-400">Auto-détection {diarization.confidence > 0.6 ? 'active' : 'calibrage...'}</span>
                    </div>
                  </div>
                )}

                {/* Capture errors */}
                {visualizer.captureError && (
                  <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{visualizer.captureError}</div>
                )}
                {!stt.isSupported && recordingState === 'idle' && (
                  <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    La reconnaissance vocale n&apos;est pas supportée. Utilisez Chrome ou Edge.
                  </div>
                )}
              </div>

              {/* Live transcription */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Transcription en direct
                  </span>
                  {segments.length > 0 && (
                    <div className="flex items-center gap-3">
                      {Object.entries(speakerStats.counts).map(([sp, count]) => (
                        <span key={sp} className={cn('text-[10px] flex items-center gap-1', getSpeakerColor(sp).text)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', getSpeakerColor(sp).dot)} />
                          {Math.round((count / speakerStats.total) * 100)}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="max-h-[55vh] overflow-y-auto p-4 space-y-1">
                  {segments.length === 0 ? (
                    <div className="text-center py-16">
                      <Mic className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">
                        {recordingState === 'idle' ? 'Cliquez sur Démarrer pour commencer' : 'En attente de parole...'}
                      </p>
                    </div>
                  ) : (
                    segments.map((seg, i) => {
                      const color = getSpeakerColor(seg.speaker)
                      const isSameAsPrevious = i > 0 && segments[i - 1].speaker === seg.speaker
                      return (
                        <div key={seg.id} className={cn('flex items-start gap-2', isSameAsPrevious ? 'mt-0.5' : 'mt-3')}>
                          <div className="shrink-0 w-16 pt-0.5 text-right">
                            {!isSameAsPrevious && <span className={cn('text-[11px] font-medium', color.text)}>{SPEAKER_LABELS[seg.speaker] || seg.speaker}</span>}
                          </div>
                          <div className="shrink-0 flex flex-col items-center pt-1.5">
                            <span className={cn('w-2 h-2 rounded-full', color.dot, isSameAsPrevious && 'w-1.5 h-1.5 opacity-40')} />
                          </div>
                          <div className={cn('flex-1 rounded-lg px-3 py-1.5', color.light)}>
                            <p className="text-sm text-slate-800 leading-relaxed">{seg.text}</p>
                            <span className="text-[10px] text-slate-400 tabular-nums">{formatTime(seg.timestamp)}</span>
                            {seg.confidence < 0.7 && <span className="text-[10px] text-amber-500 ml-2">⚠ conf. faible</span>}
                          </div>
                        </div>
                      )
                    })
                  )}
                  {stt.interimTranscript && (
                    <div className="flex items-start gap-2 mt-1 animate-pulse">
                      <div className="shrink-0 w-16" />
                      <div className="shrink-0 flex flex-col items-center pt-1.5">
                        <span className={cn('w-2 h-2 rounded-full opacity-50', getSpeakerColor(diarization.currentSpeaker).dot)} />
                      </div>
                      <div className={cn('flex-1 rounded-lg px-3 py-1.5 opacity-50', getSpeakerColor(diarization.currentSpeaker).light)}>
                        <p className="text-sm text-slate-600 italic">{stt.interimTranscript}...</p>
                      </div>
                    </div>
                  )}
                  <div ref={transcriptionEndRef} />
                </div>
              </div>

              {/* Notes + Checklist toggles */}
              <div className="flex gap-2">
                <button onClick={() => { setShowNotes(!showNotes); setShowChecklist(false) }} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors', showNotes ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </button>
                <button onClick={() => { setShowChecklist(!showChecklist); setShowNotes(false) }} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors', showChecklist ? 'bg-[#7373FF]/10 text-[#5c5ce6]' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
                  <ClipboardList className="h-3.5 w-3.5" /> Checklist <span className="tabular-nums">{checklistDone.size}/{checklistItems.length}</span>
                </button>
              </div>

              {showNotes && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <Textarea value={notesConseiller} onChange={(e) => setNotesConseiller(e.target.value)} placeholder="Notez vos observations..." rows={3} className="text-sm border-none shadow-none focus-visible:ring-0 p-0 resize-none" />
                </div>
              )}
              {showChecklist && checklistItems.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {checklistItems.map((item, i) => (
                      <button key={i} onClick={() => setChecklistDone(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })} className={cn('text-[11px] px-2.5 py-1 rounded-full transition-colors', checklistDone.has(i) ? 'bg-emerald-100 text-emerald-700 line-through' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                        {checklistDone.has(i) && <Check className="h-3 w-3 inline mr-0.5" />}{item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Colonne droite : Aide à la découverte ── */}
            {recordingState !== 'idle' && (
              <div className="w-72 shrink-0 sticky top-20 space-y-3">
                <div className="bg-white rounded-xl border border-[#7373FF]/20 overflow-hidden">
                  <div className="px-3 py-2.5 bg-gradient-to-r from-[#7373FF]/5 to-transparent border-b border-[#7373FF]/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5c5ce6] flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" /> Aide à la découverte
                    </span>
                    <button onClick={() => aiSuggestions.refresh()} disabled={aiSuggestions.isLoading} className="text-slate-400 hover:text-[#5c5ce6] transition-colors">
                      <RefreshCw className={cn('h-3 w-3', aiSuggestions.isLoading && 'animate-spin')} />
                    </button>
                  </div>
                  {/* Score de complétude RAG */}
                  {aiSuggestions.completenessScore > 0 && (
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500">Complétude découverte</span>
                        <span className="text-[10px] font-bold" style={{ color: aiSuggestions.completenessScore >= 70 ? '#10b981' : aiSuggestions.completenessScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                          {aiSuggestions.completenessScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${aiSuggestions.completenessScore}%`,
                            backgroundColor: aiSuggestions.completenessScore >= 70 ? '#10b981' : aiSuggestions.completenessScore >= 40 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Alertes RAG */}
                  {aiSuggestions.ragAlerts.length > 0 && (
                    <div className="px-3 py-1.5 border-b border-amber-100 bg-amber-50/50">
                      {aiSuggestions.ragAlerts.slice(0, 2).map((alert, i) => (
                        <p key={i} className="text-[10px] text-amber-700 flex items-start gap-1 py-0.5">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                          <span>{alert}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="p-2 space-y-1.5 max-h-[40vh] overflow-y-auto">
                    {aiSuggestions.isLoading && aiSuggestions.suggestions.length === 0 && (
                      <div className="text-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-[#7373FF] mx-auto mb-2" />
                        <p className="text-[11px] text-slate-400">Analyse en cours...</p>
                      </div>
                    )}
                    {aiSuggestions.suggestions.length === 0 && !aiSuggestions.isLoading && (
                      <div className="text-center py-6">
                        <MessageSquare className="h-5 w-5 text-slate-300 mx-auto mb-2" />
                        <p className="text-[11px] text-slate-400">Les suggestions apparaîtront au fil de la conversation</p>
                      </div>
                    )}
                    {aiSuggestions.suggestions.map((sug) => (
                      <SuggestionCard key={sug.id} suggestion={sug} onDismiss={() => aiSuggestions.dismiss(sug.id)} />
                    ))}
                  </div>
                </div>

                {brief?.client && (
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <span className="text-[10px] font-medium text-slate-500 uppercase block mb-1.5">Rappel client</span>
                    <div className="space-y-1 text-[11px] text-slate-600">
                      {brief.client.patrimoineNet != null && <p>Patrimoine : <span className="font-semibold">{Number(brief.client.patrimoineNet).toLocaleString('fr-FR')} €</span></p>}
                      {brief.client.profession && <p>Profession : {brief.client.profession}</p>}
                      {brief.client.maritalStatus && <p>Situation : {brief.client.maritalStatus}</p>}
                      {brief.client.riskProfile && <p>Risque : {brief.client.riskProfile}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 4: REVISION ═══ */}
        {step === 'revision' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-[#5c5ce6]" /> Révision de la transcription
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{segments.length} segments · {formatTime(elapsedMs)} · Cliquez sur un locuteur pour le changer</p>
              </div>
              {segments.length > 0 && (
                <div className="flex items-center gap-2">
                  {Object.entries(speakerStats.counts).map(([sp, count]) => (
                    <span key={sp} className={cn('text-xs flex items-center gap-1', getSpeakerColor(sp).text)}>
                      <span className={cn('w-2 h-2 rounded-full', getSpeakerColor(sp).dot)} />
                      {SPEAKER_LABELS[sp]} {Math.round((count / speakerStats.total) * 100)}%
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
                {segments.map((seg, i) => {
                  const color = getSpeakerColor(seg.speaker)
                  const canMerge = i > 0 && segments[i - 1].speaker === seg.speaker
                  return (
                    <div key={seg.id} className="group flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                      <button onClick={() => handleChangeSpeaker(seg.id)} className={cn('shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-colors mt-0.5', color.bg, color.text, 'hover:ring-2 hover:ring-offset-1', color.border)} title="Cliquer pour changer le locuteur">
                        <span className={cn('w-1.5 h-1.5 rounded-full', color.dot)} />
                        {SPEAKER_LABELS[seg.speaker] || seg.speaker}
                      </button>
                      <span className="shrink-0 text-[11px] text-slate-400 mt-1 w-12 tabular-nums text-right">{formatTime(seg.timestamp)}</span>
                      {editingSegmentId === seg.id ? (
                        <div className="flex-1 flex gap-2">
                          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 text-sm min-h-[36px]" rows={2} autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit() } }} />
                          <div className="flex flex-col gap-1">
                            <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 w-7 p-0 text-emerald-600"><Check className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingSegmentId(null)} className="h-7 w-7 p-0"><X className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      ) : (
                        <p className="flex-1 text-sm text-slate-800 leading-relaxed cursor-pointer hover:bg-slate-100 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors" onClick={() => handleEditSegment(seg)}>
                          {seg.text}
                          {seg.edited && <span className="ml-1.5 text-[10px] text-slate-400 italic">modifié</span>}
                        </p>
                      )}
                      {editingSegmentId !== seg.id && (
                        <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canMerge && <Button size="sm" variant="ghost" onClick={() => handleMergeWithPrevious(seg.id)} title="Fusionner" className="h-7 w-7 p-0 text-slate-400 hover:text-[#5c5ce6]"><ChevronUp className="h-3.5 w-3.5" /></Button>}
                          <Button size="sm" variant="ghost" onClick={() => handleEditSegment(seg)} title="Modifier" className="h-7 w-7 p-0 text-slate-400 hover:text-[#5c5ce6]"><Pencil className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteSegment(seg.id)} title="Supprimer" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {segments.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">Aucun segment de transcription.</p>}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('enregistrement')}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
              <Button onClick={() => setStep('traitement')} disabled={segments.length === 0} className="bg-[#7373FF] hover:bg-[#5c5ce6]">Analyser avec l&apos;IA <Sparkles className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* ═══ STEP 5: TRAITEMENT IA ═══ */}
        {step === 'traitement' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!traitementResult ? (
              <>
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#7373FF]/10 mb-3"><Sparkles className="h-6 w-6 text-[#5c5ce6]" /></div>
                  <h2 className="text-lg font-semibold text-slate-900">Analyse IA</h2>
                  <p className="text-sm text-slate-500 mt-1">{segments.length} segments · {formatTime(elapsedMs)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTraitementType('RESUME')} className={cn('p-5 rounded-xl border-2 text-left transition-all', traitementType === 'RESUME' ? 'border-[#7373FF] bg-[#7373FF]/5 shadow-md' : 'border-slate-200 hover:border-[#7373FF]/40 bg-white')}>
                    <div className={cn('p-2 rounded-lg inline-block mb-2', traitementType === 'RESUME' ? 'bg-[#7373FF] text-white' : 'bg-[#7373FF]/10 text-[#5c5ce6]')}><FileText className="h-5 w-5" /></div>
                    <h3 className="font-semibold text-slate-900">Résumé structuré</h3>
                    <p className="text-xs text-slate-500 mt-1">Points clés, décisions, actions à suivre</p>
                  </button>
                  <button onClick={() => setTraitementType('BILAN_PATRIMONIAL')} className={cn('p-5 rounded-xl border-2 text-left transition-all', traitementType === 'BILAN_PATRIMONIAL' ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 hover:border-emerald-300 bg-white')}>
                    <div className={cn('p-2 rounded-lg inline-block mb-2', traitementType === 'BILAN_PATRIMONIAL' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600')}><BarChart3 className="h-5 w-5" /></div>
                    <h3 className="font-semibold text-slate-900">Bilan patrimonial</h3>
                    <p className="text-xs text-slate-500 mt-1">Patrimoine, fiscalité, objectifs, préconisations</p>
                  </button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="lg" onClick={handleTraiter} disabled={!traitementType || isProcessing || segments.length === 0} className="gap-2 px-8 bg-[#7373FF] hover:bg-[#5c5ce6]">
                    {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> {processingStep || 'Analyse en cours...'}</> : <><Sparkles className="h-4 w-4" /> Lancer l&apos;analyse</>}
                  </Button>
                  {isProcessing && processingStep && (
                    <p className="text-xs text-slate-500 animate-pulse">{processingStep}</p>
                  )}
                  {!isProcessing && entretienId && (
                    <p className="text-[10px] text-slate-400">Entretien #{entretienId.slice(0, 8)}</p>
                  )}
                </div>
                <div className="flex justify-start">
                  <Button variant="outline" onClick={() => setStep('revision')}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-emerald-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-emerald-100"><Check className="h-4 w-4 text-emerald-600" /></div>
                    <h3 className="font-semibold text-slate-900">{traitementType === 'RESUME' ? 'Résumé de l\'entretien' : 'Bilan patrimonial'}</h3>
                  </div>

                  {traitementType === 'RESUME' && traitementResult && (
                    <div className="space-y-4">
                      {traitementResult.objet && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Objet</h4><p className="text-sm bg-slate-50 p-3 rounded-lg">{traitementResult.objet}</p></div>}
                      {traitementResult.pointsCles?.length > 0 && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Points clés</h4><ul className="space-y-1">{traitementResult.pointsCles.map((p: string, i: number) => <li key={i} className="text-sm bg-[#7373FF]/5 p-2.5 rounded-lg flex items-start gap-2"><span className="text-[#5c5ce6] font-bold shrink-0">•</span>{p}</li>)}</ul></div>}
                      {traitementResult.decisions?.length > 0 && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Décisions</h4><ul className="space-y-1">{traitementResult.decisions.map((d: string, i: number) => <li key={i} className="text-sm bg-emerald-50 p-2.5 rounded-lg flex items-start gap-2"><Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />{d}</li>)}</ul></div>}
                      {traitementResult.actionsASuivre?.length > 0 && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Actions à suivre</h4><div className="space-y-1">{traitementResult.actionsASuivre.map((a: any, i: number) => <div key={i} className="text-sm bg-amber-50 p-2.5 rounded-lg flex items-center gap-2"><Badge variant="outline" className="text-[10px] shrink-0">{a.responsable}</Badge><span className="flex-1">{a.action}</span>{a.echeance && <span className="text-[11px] text-slate-500">{a.echeance}</span>}</div>)}</div></div>}
                      {traitementResult.synthese && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Synthèse</h4><p className="text-sm bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">{traitementResult.synthese}</p></div>}
                    </div>
                  )}

                  {traitementType === 'BILAN_PATRIMONIAL' && traitementResult && (
                    <div className="space-y-4">
                      {traitementResult.situationFamiliale && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Situation familiale</h4><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries(traitementResult.situationFamiliale).filter(([, v]) => v != null).map(([k, v]) => <div key={k} className="bg-slate-50 p-2 rounded-lg"><span className="text-slate-500 text-[11px]">{k}</span><p className="font-medium">{String(v)}</p></div>)}</div></div>}
                      {traitementResult.patrimoine && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Patrimoine</h4><div className="grid grid-cols-3 gap-2">{traitementResult.patrimoine.totalBrut != null && <div className="bg-[#7373FF]/5 p-2.5 rounded-lg text-center"><span className="text-[10px] text-[#5c5ce6] uppercase">Brut</span><p className="font-bold text-[#5c5ce6]">{Number(traitementResult.patrimoine.totalBrut).toLocaleString('fr-FR')} €</p></div>}{traitementResult.patrimoine.totalDettes != null && <div className="bg-red-50 p-2.5 rounded-lg text-center"><span className="text-[10px] text-red-600 uppercase">Dettes</span><p className="font-bold text-red-700">{Number(traitementResult.patrimoine.totalDettes).toLocaleString('fr-FR')} €</p></div>}{traitementResult.patrimoine.totalNet != null && <div className="bg-emerald-50 p-2.5 rounded-lg text-center"><span className="text-[10px] text-emerald-600 uppercase">Net</span><p className="font-bold text-emerald-700">{Number(traitementResult.patrimoine.totalNet).toLocaleString('fr-FR')} €</p></div>}</div></div>}
                      {traitementResult.objectifs?.priorites?.length > 0 && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Objectifs</h4><ul className="space-y-1">{traitementResult.objectifs.priorites.map((o: string, i: number) => <li key={i} className="text-sm bg-[#7373FF]/5 p-2 rounded-lg">{o}</li>)}</ul></div>}
                      {traitementResult.preconisationsPreliminaires?.length > 0 && <div><h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Préconisations</h4><div className="space-y-1.5">{traitementResult.preconisationsPreliminaires.map((p: any, i: number) => <div key={i} className="bg-amber-50 border border-amber-200 p-3 rounded-lg"><div className="flex items-center gap-2 mb-0.5"><Badge variant="outline" className="text-[10px]">{p.priorite || 'moyenne'}</Badge><Badge variant="secondary" className="text-[10px]">{p.categorie}</Badge></div><p className="font-medium text-sm">{p.titre}</p><p className="text-xs text-slate-600 mt-0.5">{p.description}</p></div>)}</div></div>}
                      {traitementResult.scoreCompletude != null && <div className="bg-slate-50 p-3 rounded-lg text-center"><span className="text-[11px] text-slate-500">Complétude du bilan</span><p className="text-2xl font-bold text-[#5c5ce6]">{traitementResult.scoreCompletude}/100</p></div>}
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => { setTraitementResult(null); setTraitementType(null) }}><RotateCcw className="h-4 w-4 mr-2" /> Relancer</Button>
                  <div className="flex gap-2">
                    {entretienId && <Button variant="outline" onClick={() => router.push(`/dashboard/entretiens/${entretienId}`)}><Eye className="h-4 w-4 mr-2" /> Voir le détail</Button>}
                    <Button onClick={() => router.push('/dashboard/entretiens')} className="bg-[#7373FF] hover:bg-[#5c5ce6]"><Check className="h-4 w-4 mr-2" /> Terminer</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

function SuggestionCard({ suggestion, onDismiss }: { suggestion: AISuggestion; onDismiss: () => void }) {
  const priorityColors = {
    haute: 'border-l-red-400 bg-red-50/30',
    moyenne: 'border-l-[#7373FF] bg-[#7373FF]/5',
    basse: 'border-l-slate-300 bg-slate-50/50',
  }
  const categorieIcons = {
    relance: <MessageSquare className="h-3 w-3" />,
    checklist: <ClipboardList className="h-3 w-3" />,
    alerte: <AlertTriangle className="h-3 w-3" />,
    approfondissement: <Lightbulb className="h-3 w-3" />,
  }
  return (
    <div className={cn('relative rounded-lg border border-slate-100 border-l-[3px] p-2.5 transition-all hover:shadow-sm', priorityColors[suggestion.priorite])}>
      <button onClick={onDismiss} className="absolute top-1.5 right-1.5 text-slate-300 hover:text-slate-500 transition-colors"><X className="h-3 w-3" /></button>
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 text-[#5c5ce6] shrink-0">{categorieIcons[suggestion.categorie]}</span>
        <div>
          <p className="text-xs font-medium text-slate-800 leading-snug pr-4">{suggestion.question}</p>
          {suggestion.raison && <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{suggestion.raison}</p>}
        </div>
      </div>
    </div>
  )
}
