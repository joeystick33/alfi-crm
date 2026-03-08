import { useState, useCallback } from 'react'

// ============================================================================
// Hook — Génération de narratifs enrichis par IA
// Appelle la route /api/advisor/ai/generate-narrative
// Backends supportés : Ollama (local, gratuit) → Mistral Cloud → Fallback
// ============================================================================

type NarrativeType = 'synthese' | 'budget' | 'fiscalite' | 'retraite' | 'succession' | 'preconisation' | 'immobilier' | 'financier'

interface NarrativeResult {
  narrative: string | null
  source: 'ollama' | 'mistral-cloud' | 'fallback' | 'error'
  model?: string
  message?: string
}

interface AIStatus {
  available: boolean
  backend: 'ollama' | 'mistral-cloud' | 'fallback'
  model: string
  ollama: { running: boolean; url: string; model: string }
  mistralCloud: { configured: boolean }
  instructions?: string
}

interface UseMistralNarrativeReturn {
  generateNarrative: (type: NarrativeType, context: Record<string, unknown>, clientName?: string) => Promise<string | null>
  generateBatch: (requests: Array<{ type: NarrativeType; context: Record<string, unknown> }>, clientName?: string) => Promise<Record<string, string | null>>
  checkAvailability: () => Promise<AIStatus | null>
  isGenerating: boolean
  error: string | null
  isAvailable: boolean | null
  aiBackend: string | null
}

export function useMistralNarrative(): UseMistralNarrativeReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [aiBackend, setAiBackend] = useState<string | null>(null)

  const checkAvailability = useCallback(async (): Promise<AIStatus | null> => {
    try {
      const res = await fetch('/api/advisor/ai/generate-narrative')
      if (!res.ok) return null
      const data: AIStatus = await res.json()
      setIsAvailable(data.available)
      setAiBackend(data.backend)
      return data
    } catch {
      setIsAvailable(false)
      return null
    }
  }, [])

  const generateNarrative = useCallback(async (
    type: NarrativeType,
    context: Record<string, unknown>,
    clientName?: string
  ): Promise<string | null> => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/advisor/ai/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context, clientName }),
      })

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`)
      }

      const data: NarrativeResult = await res.json()
      setIsAvailable(data.source === 'ollama' || data.source === 'mistral-cloud')
      if (data.source !== 'error' && data.source !== 'fallback') setAiBackend(data.source)

      if (data.source === 'error') {
        setError(data.message || 'Erreur IA')
        return null
      }

      return data.narrative
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau'
      setError(msg)
      setIsAvailable(false)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const generateBatch = useCallback(async (
    requests: Array<{ type: NarrativeType; context: Record<string, unknown> }>,
    clientName?: string
  ): Promise<Record<string, string | null>> => {
    setIsGenerating(true)
    setError(null)

    const results: Record<string, string | null> = {}

    try {
      // Exécuter en parallèle (max 3 simultanés pour respecter rate limits)
      const chunks: Array<typeof requests> = []
      for (let i = 0; i < requests.length; i += 3) {
        chunks.push(requests.slice(i, i + 3))
      }

      for (const chunk of chunks) {
        const promises = chunk.map(async (req) => {
          const narrative = await generateNarrative(req.type, req.context, clientName)
          return { type: req.type, narrative }
        })
        const chunkResults = await Promise.all(promises)
        chunkResults.forEach(r => { results[r.type] = r.narrative })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur batch'
      setError(msg)
    } finally {
      setIsGenerating(false)
    }

    return results
  }, [generateNarrative])

  return { generateNarrative, generateBatch, checkAvailability, isGenerating, error, isAvailable, aiBackend }
}
