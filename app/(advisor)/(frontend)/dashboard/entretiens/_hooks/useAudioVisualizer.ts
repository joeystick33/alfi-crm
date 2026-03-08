'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ============================================================================
// Hook Audio Visualizer — Waveform animée via Web Audio API
//
// Modes audio :
//   • presentiel : microphone standard (getUserMedia)
//   • visio : capture audio écran (getDisplayMedia) + mic mixé
//   • telephone : microphone avec suppression bruit (echoCancellation, noiseSuppression)
//
// Fonctionnalités additionnelles :
//   • Détection de silence (volume < seuil pendant X ms)
//   • Callback onSilence pour auto-diarisation
//   • Partage du MediaStream pour d'éventuels enregistrements
// ============================================================================

export type AudioCaptureMode = 'presentiel' | 'visio' | 'telephone'

interface AudioVisualizerOptions {
  barCount?: number
  smoothingTimeConstant?: number
  fftSize?: number
  /** Mode de capture audio */
  mode?: AudioCaptureMode
  /** Seuil de silence (0-1, défaut 0.02) */
  silenceThreshold?: number
  /** Durée de silence avant callback (ms, défaut 2000) */
  silenceDurationMs?: number
  /** Callback quand silence détecté */
  onSilenceStart?: () => void
  /** Callback quand parole reprend après silence */
  onSpeechResume?: () => void
}

export function useAudioVisualizer(options: AudioVisualizerOptions = {}) {
  const {
    barCount = 32,
    smoothingTimeConstant = 0.8,
    fftSize = 256,
    mode = 'presentiel',
    silenceThreshold = 0.02,
    silenceDurationMs = 2000,
    onSilenceStart,
    onSpeechResume,
  } = options

  const [isActive, setIsActive] = useState(false)
  const [levels, setLevels] = useState<number[]>(new Array(barCount).fill(0))
  const [volume, setVolume] = useState(0)
  const [isSilent, setIsSilent] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const displaySourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const displayStreamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  // Silence tracking
  const silenceStartRef = useRef<number | null>(null)
  const silenceNotifiedRef = useRef(false)

  const tick = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>)

    const data = dataArrayRef.current
    const step = Math.max(1, Math.floor(data.length / barCount))
    const newLevels: number[] = []

    let sum = 0
    for (let i = 0; i < barCount; i++) {
      const start = i * step
      let barSum = 0
      let count = 0
      for (let j = start; j < start + step && j < data.length; j++) {
        barSum += data[j]
        count++
      }
      const avg = count > 0 ? barSum / count / 255 : 0
      newLevels.push(avg)
      sum += avg
    }

    const currentVolume = sum / barCount
    setLevels(newLevels)
    setVolume(currentVolume)

    // Silence detection
    if (currentVolume < silenceThreshold) {
      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now()
      } else if (
        Date.now() - silenceStartRef.current >= silenceDurationMs &&
        !silenceNotifiedRef.current
      ) {
        silenceNotifiedRef.current = true
        setIsSilent(true)
        onSilenceStart?.()
      }
    } else {
      if (silenceNotifiedRef.current) {
        onSpeechResume?.()
      }
      silenceStartRef.current = null
      silenceNotifiedRef.current = false
      setIsSilent(false)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [barCount, silenceThreshold, silenceDurationMs, onSilenceStart, onSpeechResume])

  /**
   * Acquiert le micro avec des contraintes adaptées au mode
   */
  const getMicStream = useCallback(async (): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: mode === 'telephone'
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Favorise la bande vocale pour le téléphone
            sampleRate: 16000,
          }
        : mode === 'visio'
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              // Présentiel : qualité + suppression bruit pour environnement cabinet
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
    }
    return navigator.mediaDevices.getUserMedia(constraints)
  }, [mode])

  /**
   * En mode visio, capture aussi l'audio de l'écran partagé
   */
  const getDisplayStream = useCallback(async (): Promise<MediaStream | null> => {
    if (mode !== 'visio') return null
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Obligatoire pour getDisplayMedia
        audio: true, // Capture l'audio de l'onglet/écran
      })
      // On n'a besoin que des pistes audio
      stream.getVideoTracks().forEach(track => track.stop())
      return stream
    } catch {
      // L'utilisateur a annulé le partage d'écran ou audio non disponible
      console.warn('[AudioVisualizer] Pas de capture audio écran — mode micro seul')
      return null
    }
  }, [mode])

  const start = useCallback(async () => {
    setCaptureError(null)
    try {
      // 1. Microphone
      const micStream = await getMicStream()
      streamRef.current = micStream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.smoothingTimeConstant = smoothingTimeConstant
      analyser.fftSize = fftSize
      analyserRef.current = analyser

      // Créer un merger pour combiner mic + display audio
      const merger = audioContext.createChannelMerger(2)
      merger.connect(analyser)

      // Source micro
      const micSource = audioContext.createMediaStreamSource(micStream)
      micSource.connect(merger, 0, 0)
      sourceRef.current = micSource

      // 2. Display audio (visio uniquement)
      if (mode === 'visio') {
        const displayStream = await getDisplayStream()
        if (displayStream && displayStream.getAudioTracks().length > 0) {
          displayStreamRef.current = displayStream
          const displaySource = audioContext.createMediaStreamSource(displayStream)
          displaySource.connect(merger, 0, 1)
          displaySourceRef.current = displaySource
        }
      }

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
      silenceStartRef.current = null
      silenceNotifiedRef.current = false

      setIsActive(true)
      setIsSilent(false)
      rafRef.current = requestAnimationFrame(tick)
    } catch (error) {
      const msg = mode === 'visio'
        ? 'Impossible d\'accéder au micro ou à l\'audio de l\'écran. Vérifiez les autorisations.'
        : mode === 'telephone'
          ? 'Impossible d\'accéder au micro. Vérifiez que votre casque/micro est branché.'
          : 'Erreur d\'accès au microphone.'
      setCaptureError(msg)
      console.error('[AudioVisualizer] Erreur capture:', error)
    }
  }, [smoothingTimeConstant, fftSize, tick, mode, getMicStream, getDisplayStream])

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    sourceRef.current?.disconnect()
    sourceRef.current = null

    displaySourceRef.current?.disconnect()
    displaySourceRef.current = null

    analyserRef.current = null

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close()
    }
    audioContextRef.current = null

    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null

    displayStreamRef.current?.getTracks().forEach(track => track.stop())
    displayStreamRef.current = null

    silenceStartRef.current = null
    silenceNotifiedRef.current = false

    setIsActive(false)
    setIsSilent(false)
    setLevels(new Array(barCount).fill(0))
    setVolume(0)
  }, [barCount])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      sourceRef.current?.disconnect()
      displaySourceRef.current?.disconnect()
      if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close()
      streamRef.current?.getTracks().forEach(track => track.stop())
      displayStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  return {
    isActive,
    levels,
    volume,
    isSilent,
    captureError,
    start,
    stop,
    /** Le MediaStream micro brut (utile pour enregistrement) */
    micStream: streamRef.current,
  }
}
