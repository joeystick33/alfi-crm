/**
 * Hook générique pour les simulateurs immobiliers
 * Gère les appels API, le loading state, les erreurs et le cache
 */

import { useState, useCallback } from 'react'

// Types génériques pour les simulateurs
export interface SimulatorState<TInput, TResult> {
  input: TInput
  result: TResult | null
  isLoading: boolean
  error: string | null
  hasSimulated: boolean
}

export interface SimulatorActions<TInput> {
  setInput: (input: Partial<TInput>) => void
  resetInput: () => void
  simulate: () => Promise<void>
  reset: () => void
}

export interface UseSimulatorOptions<TInput, TResult> {
  endpoint: string
  defaultInput: TInput
  validateInput?: (input: TInput) => string | null
  onSuccess?: (result: TResult) => void
  onError?: (error: string) => void
}

export interface SimulatorMetadata {
  description: string
  parametresDefaut: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Hook personnalisé pour gérer un simulateur immobilier
 * @param options Configuration du simulateur
 * @returns State et actions du simulateur
 */
export function useSimulator<TInput extends Record<string, unknown>, TResult>(
  options: UseSimulatorOptions<TInput, TResult>
): [SimulatorState<TInput, TResult>, SimulatorActions<TInput>] {
  const { endpoint, defaultInput, validateInput, onSuccess, onError } = options

  const [state, setState] = useState<SimulatorState<TInput, TResult>>({
    input: defaultInput,
    result: null,
    isLoading: false,
    error: null,
    hasSimulated: false,
  })

  // Met à jour partiellement l'input
  const setInput = useCallback((partialInput: Partial<TInput>) => {
    setState(prev => ({
      ...prev,
      input: { ...prev.input, ...partialInput },
      // Reset l'erreur quand l'utilisateur modifie les inputs
      error: null,
    }))
  }, [])

  // Réinitialise l'input aux valeurs par défaut
  const resetInput = useCallback(() => {
    setState(prev => ({
      ...prev,
      input: defaultInput,
      error: null,
    }))
  }, [defaultInput])

  // Lance la simulation
  const simulate = useCallback(async () => {
    // Validation côté client (optionnelle)
    if (validateInput) {
      const validationError = validateInput(state.input)
      if (validationError) {
        setState(prev => ({ ...prev, error: validationError }))
        onError?.(validationError)
        return
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(state.input),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Erreur lors de la simulation'
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          hasSimulated: true,
        }))
        onError?.(errorMessage)
        return
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        result: data.data,
        error: null,
        hasSimulated: true,
      }))
      onSuccess?.(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur réseau'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        hasSimulated: true,
      }))
      onError?.(errorMessage)
    }
  }, [endpoint, state.input, validateInput, onSuccess, onError])

  // Réinitialise complètement le simulateur
  const reset = useCallback(() => {
    setState({
      input: defaultInput,
      result: null,
      isLoading: false,
      error: null,
      hasSimulated: false,
    })
  }, [defaultInput])

  return [
    state,
    { setInput, resetInput, simulate, reset },
  ]
}

/**
 * Hook pour récupérer les métadonnées d'un simulateur (GET)
 */
export function useSimulatorMetadata(endpoint: string) {
  const [metadata, setMetadata] = useState<SimulatorMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetadata = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la récupération des métadonnées')
        return
      }

      setMetadata(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }, [endpoint])

  return { metadata, isLoading, error, fetchMetadata }
}

/**
 * Helper pour formater les nombres en français
 */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Helper pour formater les montants en euros
 */
export function formatCurrency(value: number): string {
  return `${formatNumber(value)} €`
}

/**
 * Helper pour formater les pourcentages
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)} %`
}

/**
 * Helper pour déterminer la couleur selon la valeur
 */
export function getValueColor(value: number, inverse = false): string {
  if (value === 0) return 'text-slate-600'
  const isPositive = inverse ? value < 0 : value > 0
  return isPositive ? 'text-emerald-600' : 'text-red-600'
}

/**
 * Helper pour le badge de variation
 */
export function getVariationBadge(value: number, inverse = false): { text: string; className: string } {
  const isPositive = inverse ? value < 0 : value > 0
  const sign = value > 0 ? '+' : ''
  return {
    text: `${sign}${formatNumber(value)} €`,
    className: isPositive 
      ? 'bg-emerald-100 text-emerald-800' 
      : value === 0 
        ? 'bg-slate-100 text-slate-600'
        : 'bg-red-100 text-red-800',
  }
}
