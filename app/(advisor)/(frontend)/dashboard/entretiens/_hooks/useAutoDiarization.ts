'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ============================================================================
// Hook Auto-Diarisation — Détection automatique des locuteurs
//
// Utilise le Web Audio API pour analyser les caractéristiques vocales :
//   • Détection de pitch (fréquence fondamentale) via autocorrélation
//   • Suivi d'énergie RMS
//   • Construction incrémentale de profils vocaux par locuteur
//   • Changement automatique de locuteur après silence + shift vocal
//
// Le premier locuteur est toujours "conseiller" (l'enregistrement est
// démarré par le conseiller). Le second locuteur détecté = "client".
// Jusqu'à 4 locuteurs supportés.
// ============================================================================

// ── Configuration ──
const PITCH_SAMPLE_INTERVAL_MS = 80
const SILENCE_RMS_THRESHOLD = 0.012
const SILENCE_GAP_FOR_SPEAKER_CHANGE_MS = 1000
const PROFILE_WARMUP_SAMPLES = 4
const SPEAKER_DISTANCE_THRESHOLD = 0.40
const MAX_PROFILE_HISTORY = 120
const SPEECH_CONFIRM_SAMPLES = 3

const SPEAKER_IDS = ['conseiller', 'client', 'interlocuteur_2', 'interlocuteur_3']

// ── Types ──

export interface VoiceProfile {
  id: string
  pitchSamples: number[]
  energySamples: number[]
  pitchMean: number
  pitchStd: number
  energyMean: number
  sampleCount: number
}

interface DiarizationState {
  currentSpeaker: string
  profiles: VoiceProfile[]
  confidence: number
  isSpeaking: boolean
}

// ── Autocorrelation Pitch Detection ──
// Détecte la fréquence fondamentale (F0) d'un signal audio
// Plage voix humaine : 75–350 Hz (homme grave → femme aiguë)

function detectPitch(buffer: Float32Array<ArrayBufferLike>, sampleRate: number): number | null {
  const SIZE = buffer.length
  const HALF = Math.floor(SIZE / 2)

  // Vérifier qu'il y a assez de signal
  let rms = 0
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i]
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.008) return null

  // Bornes de lag pour la plage vocale 75–350 Hz
  const minLag = Math.floor(sampleRate / 350)
  const maxLag = Math.min(Math.floor(sampleRate / 75), HALF)

  // Autocorrélation normalisée au lag 0
  let corr0 = 0
  for (let i = 0; i < HALF; i++) {
    corr0 += buffer[i] * buffer[i]
  }
  if (corr0 === 0) return null

  let bestCorrelation = -1
  let bestLag = -1
  let passedDip = false

  for (let lag = minLag; lag < maxLag; lag++) {
    let sum = 0
    for (let i = 0; i < HALF; i++) {
      sum += buffer[i] * buffer[i + lag]
    }
    const normalized = sum / corr0

    // Attendre le premier creux (dip < 0.5) avant de chercher le pic
    if (!passedDip && normalized < 0.5) {
      passedDip = true
    }

    if (passedDip && normalized > bestCorrelation) {
      bestCorrelation = normalized
      bestLag = lag
    }
  }

  if (bestLag === -1 || bestCorrelation < 0.25) return null

  // Interpolation parabolique pour précision sub-sample
  if (bestLag > minLag && bestLag < maxLag - 1) {
    let corrPrev = 0, corrNext = 0
    for (let i = 0; i < HALF; i++) {
      corrPrev += buffer[i] * buffer[i + bestLag - 1]
      corrNext += buffer[i] * buffer[i + bestLag + 1]
    }
    corrPrev /= corr0
    corrNext /= corr0

    const shift = (corrNext - corrPrev) / (2 * (2 * bestCorrelation - corrPrev - corrNext))
    if (isFinite(shift) && Math.abs(shift) < 1) {
      bestLag += shift
    }
  }

  const frequency = sampleRate / bestLag

  // Filtrer les valeurs hors plage vocale
  if (frequency < 75 || frequency > 350) return null

  return frequency
}

function computeRMS(buffer: Float32Array<ArrayBufferLike>): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  return Math.sqrt(sum / buffer.length)
}

// ── Speaker Profile Management ──

function createEmptyProfile(id: string): VoiceProfile {
  return {
    id,
    pitchSamples: [],
    energySamples: [],
    pitchMean: 0,
    pitchStd: 30,
    energyMean: 0,
    sampleCount: 0,
  }
}

function updateProfile(profile: VoiceProfile, pitch: number, energy: number): VoiceProfile {
  const pitches = [...profile.pitchSamples, pitch].slice(-MAX_PROFILE_HISTORY)
  const energies = [...profile.energySamples, energy].slice(-MAX_PROFILE_HISTORY)

  const pitchMean = pitches.reduce((a, b) => a + b, 0) / pitches.length
  const pitchVariance = pitches.reduce((a, b) => a + (b - pitchMean) ** 2, 0) / pitches.length
  const pitchStd = Math.sqrt(pitchVariance) || 15
  const energyMean = energies.reduce((a, b) => a + b, 0) / energies.length

  return {
    ...profile,
    pitchSamples: pitches,
    energySamples: energies,
    pitchMean,
    pitchStd,
    energyMean,
    sampleCount: profile.sampleCount + 1,
  }
}

function scoreSpeakerDistance(pitch: number, energy: number, profile: VoiceProfile): number {
  if (profile.sampleCount < PROFILE_WARMUP_SAMPLES) return 0.5

  // Distance pitch normalisée (le pitch est le discriminant principal)
  const pitchDist = Math.abs(pitch - profile.pitchMean) / Math.max(profile.pitchStd, 12)

  // Distance énergie normalisée (secondaire, moins fiable)
  const energyDist = profile.energyMean > 0.001
    ? Math.abs(energy - profile.energyMean) / profile.energyMean
    : 0

  // Pondération : pitch 75%, énergie 25%
  return pitchDist * 0.75 + energyDist * 0.25
}

// ── Hook Principal ──

interface UseAutoDiarizationOptions {
  /** MediaStream du micro (fourni par le visualizer) */
  mediaStream: MediaStream | null
  /** Activer la diarisation */
  enabled: boolean
  /** Nombre max de locuteurs (défaut 4) */
  maxSpeakers?: number
  /** Callback lors d'un changement de locuteur */
  onSpeakerChange?: (speaker: string) => void
}

export function useAutoDiarization(options: UseAutoDiarizationOptions) {
  const {
    mediaStream,
    enabled,
    maxSpeakers = 4,
    onSpeakerChange,
  } = options

  const [state, setState] = useState<DiarizationState>({
    currentSpeaker: 'conseiller',
    profiles: [],
    confidence: 1.0,
    isSpeaking: false,
  })

  // Refs pour l'audio pipeline
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const bufferRef = useRef<Float32Array | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refs pour l'état de tracking (pas de re-render)
  const currentSpeakerRef = useRef<string>('conseiller')
  const profilesRef = useRef<VoiceProfile[]>([])
  const pendingPitchesRef = useRef<number[]>([])
  const pendingEnergiesRef = useRef<number[]>([])
  const silenceStartRef = useRef<number | null>(null)
  const wasSilentRef = useRef(false)
  const onSpeakerChangeRef = useRef(onSpeakerChange)

  // Garder le callback à jour sans re-trigger l'effet
  useEffect(() => {
    onSpeakerChangeRef.current = onSpeakerChange
  }, [onSpeakerChange])

  // ── Construire le pipeline audio quand le stream est disponible ──
  useEffect(() => {
    if (!mediaStream || !enabled) return

    let cancelled = false

    const setup = async () => {
      try {
        const audioCtx = new AudioContext()
        if (cancelled) { audioCtx.close(); return }

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.3

        const source = audioCtx.createMediaStreamSource(mediaStream)
        source.connect(analyser)

        audioCtxRef.current = audioCtx
        analyserRef.current = analyser
        sourceRef.current = source
        bufferRef.current = new Float32Array(analyser.fftSize)

        // Initialiser le profil "conseiller" (premier locuteur)
        if (profilesRef.current.length === 0) {
          profilesRef.current = [createEmptyProfile('conseiller')]
        }
      } catch (err) {
        console.error('[AutoDiarization] Erreur setup audio:', err)
      }
    }

    setup()

    return () => {
      cancelled = true
      try { sourceRef.current?.disconnect() } catch { /* ignore */ }
      try {
        if (audioCtxRef.current?.state !== 'closed') {
          audioCtxRef.current?.close()
        }
      } catch { /* ignore */ }
      audioCtxRef.current = null
      analyserRef.current = null
      sourceRef.current = null
      bufferRef.current = null
    }
  }, [mediaStream, enabled])

  // ── Boucle d'analyse pitch/énergie ──
  useEffect(() => {
    if (!enabled || !analyserRef.current || !bufferRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      const analyser = analyserRef.current
      const buffer = bufferRef.current
      const audioCtx = audioCtxRef.current
      if (!analyser || !buffer || !audioCtx) return

      // Récupérer les données temporelles
      analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>)
      const rms = computeRMS(buffer)
      const isSpeaking = rms > SILENCE_RMS_THRESHOLD

      if (isSpeaking) {
        // ── Parole détectée ──
        const pitch = detectPitch(buffer, audioCtx.sampleRate)

        if (pitch !== null) {
          pendingPitchesRef.current.push(pitch)
          pendingEnergiesRef.current.push(rms)

          // Après un silence significatif + assez d'échantillons → identifier le locuteur
          if (wasSilentRef.current && pendingPitchesRef.current.length >= SPEECH_CONFIRM_SAMPLES) {
            wasSilentRef.current = false

            const avgPitch = pendingPitchesRef.current.reduce((a, b) => a + b, 0) / pendingPitchesRef.current.length
            const avgEnergy = pendingEnergiesRef.current.reduce((a, b) => a + b, 0) / pendingEnergiesRef.current.length

            // Scorer chaque profil connu
            const profiles = profilesRef.current
            let bestMatch = currentSpeakerRef.current
            let bestScore = Infinity

            for (const profile of profiles) {
              const score = scoreSpeakerDistance(avgPitch, avgEnergy, profile)
              if (score < bestScore) {
                bestScore = score
                bestMatch = profile.id
              }
            }

            // Si trop loin de tous les profils ET on n'a pas atteint le max → nouveau locuteur
            if (bestScore > SPEAKER_DISTANCE_THRESHOLD && profiles.length < maxSpeakers) {
              const newId = SPEAKER_IDS[profiles.length] || `interlocuteur_${profiles.length}`
              const newProfile = createEmptyProfile(newId)
              const updated = updateProfile(newProfile, avgPitch, avgEnergy)
              profilesRef.current = [...profiles, updated]
              bestMatch = newId
              bestScore = 0
            }

            // Changement de locuteur détecté
            if (bestMatch !== currentSpeakerRef.current) {
              currentSpeakerRef.current = bestMatch
              onSpeakerChangeRef.current?.(bestMatch)

              setState(prev => ({
                ...prev,
                currentSpeaker: bestMatch,
                profiles: profilesRef.current.map(p => ({ ...p })),
                confidence: Math.max(0, Math.min(1, 1 - bestScore)),
                isSpeaking: true,
              }))
            }

            pendingPitchesRef.current = []
            pendingEnergiesRef.current = []
          }

          // Enrichir le profil du locuteur courant
          const currentProfile = profilesRef.current.find(p => p.id === currentSpeakerRef.current)
          if (currentProfile) {
            const updated = updateProfile(currentProfile, pitch, rms)
            profilesRef.current = profilesRef.current.map(p =>
              p.id === updated.id ? updated : p
            )
          }
        }

        // Reset silence tracking
        if (silenceStartRef.current) {
          silenceStartRef.current = null
        }
      } else {
        // ── Silence détecté ──
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now()
        } else if (
          Date.now() - silenceStartRef.current >= SILENCE_GAP_FOR_SPEAKER_CHANGE_MS &&
          !wasSilentRef.current
        ) {
          wasSilentRef.current = true
          pendingPitchesRef.current = []
          pendingEnergiesRef.current = []
        }
      }

      // Mettre à jour l'état de parole (minimal re-renders)
      setState(prev => {
        if (prev.isSpeaking !== isSpeaking) {
          return { ...prev, isSpeaking }
        }
        return prev
      })
    }, PITCH_SAMPLE_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, maxSpeakers])

  // ── Reset quand désactivé ──
  useEffect(() => {
    if (!enabled) {
      currentSpeakerRef.current = 'conseiller'
      profilesRef.current = []
      pendingPitchesRef.current = []
      pendingEnergiesRef.current = []
      wasSilentRef.current = false
      silenceStartRef.current = null
      setState({
        currentSpeaker: 'conseiller',
        profiles: [],
        confidence: 1.0,
        isSpeaking: false,
      })
    }
  }, [enabled])

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return {
    /** Locuteur actuellement détecté (React state — pour le rendu) */
    currentSpeaker: state.currentSpeaker,
    /** Ref synchrone du locuteur courant (pour les callbacks STT) */
    currentSpeakerRef,
    /** Profils vocaux construits */
    profiles: state.profiles,
    /** Confiance de la dernière détection (0–1) */
    confidence: state.confidence,
    /** Parole en cours ? */
    isSpeaking: state.isSpeaking,
  }
}
