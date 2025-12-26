import { useState, useCallback } from 'react'

/**
 * Hook réutilisable pour gérer l'état des simulateurs
 * Standardise la gestion du loading, erreurs et résultats
 */
export interface SimulationState<T> {
  isLoading: boolean
  error: string
  result: T | null
}

export interface UseSimulationReturn<T, P> {
  isLoading: boolean
  error: string
  result: T | null
  execute: (params: P) => Promise<void>
  reset: () => void
}

export interface UseSimulationOptions<T, P> {
  /**
   * URL de l'endpoint API
   */
  endpoint: string

  /**
   * Fonction de transformation du payload avant envoi (optionnel)
   */
  transformRequest?: (params: P) => unknown

  /**
   * Fonction de transformation de la réponse (optionnel)
   */
  transformResponse?: (data: unknown) => T

  /**
   * Fonction de validation des paramètres avant envoi (optionnel)
   */
  validate?: (params: P) => string | null

  /**
   * Message d'erreur par défaut si le serveur ne retourne pas de message
   */
  defaultErrorMessage?: string
}

/**
 * Hook générique pour gérer l'état et les appels API des simulateurs
 * 
 * @example
 * ```tsx
 * const { isLoading, error, result, execute, reset } = useSimulation<
 *   PensionResult,
 *   PensionParams
 * >({
 *   endpoint: '/api/advisor/simulators/retirement/pension',
 *   defaultErrorMessage: 'Erreur lors du calcul de la pension',
 * })
 * ```
 */
export function useSimulation<T = unknown, P = unknown>(
  options: UseSimulationOptions<T, P>
): UseSimulationReturn<T, P> {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<T | null>(null)

  const {
    endpoint,
    transformRequest,
    transformResponse,
    validate,
    defaultErrorMessage = 'Une erreur est survenue lors de la simulation'
  } = options

  const execute = useCallback(
    async (params: P) => {
      // Reset états précédents
      setError('')
      setResult(null)

      // Validation optionnelle avant appel
      if (validate) {
        const validationError = validate(params)
        if (validationError) {
          setError(validationError)
          return
        }
      }

      setIsLoading(true)

      try {
        // Transformation optionnelle du payload
        const body = transformRequest ? transformRequest(params) : params

        // Appel API
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        const payload = await response.json()

        // Gestion erreurs HTTP
        if (!response.ok) {
          const errorMessage =
            payload?.error ||
            payload?.message ||
            (response.status === 401
              ? 'Non autorisé'
              : response.status === 403
              ? 'Accès refusé'
              : response.status === 404
              ? 'Endpoint non trouvé'
              : response.status >= 500
              ? 'Erreur serveur'
              : defaultErrorMessage)

          throw new Error(errorMessage)
        }

        // Gestion erreurs métier (success: false)
        if (payload?.success === false) {
          throw new Error(payload?.error || payload?.message || defaultErrorMessage)
        }

        // Extraction et transformation du résultat
        const rawResult = payload.data || payload.result || payload
        const finalResult = transformResponse ? transformResponse(rawResult) : rawResult

        setResult(finalResult)
      } catch (err: unknown) {
        const errorMessage = (err as Error)?.message || defaultErrorMessage
        setError(errorMessage)
        console.error(`[useSimulation] Error calling ${endpoint}:`, err)
      } finally {
        setIsLoading(false)
      }
    },
    [endpoint, transformRequest, transformResponse, validate, defaultErrorMessage]
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setError('')
    setResult(null)
  }, [])

  return {
    isLoading,
    error,
    result,
    execute,
    reset,
  }
}

/**
 * Hook helper pour simulateurs avec pattern classique (params simples)
 */
export function useSimulationSimple<T = unknown>(
  endpoint: string,
  defaultErrorMessage?: string
) {
  return useSimulation<T, Record<string, unknown>>({
    endpoint,
    defaultErrorMessage,
  })
}
