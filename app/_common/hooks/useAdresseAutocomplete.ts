/**
 * ══════════════════════════════════════════════════════════════════════════════
 * HOOK AUTOCOMPLÉTION ADRESSE
 * Utilise l'API BAN (Base Adresse Nationale) pour l'autocomplétion
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AdresseResult } from '@/lib/services/adresse/api-ban'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface UseAdresseAutocompleteOptions {
  /** Délai de debounce en ms (défaut: 300) */
  debounceMs?: number
  /** Nombre minimum de caractères (défaut: 3) */
  minChars?: number
  /** Nombre max de suggestions (défaut: 8) */
  maxSuggestions?: number
  /** Type de recherche (défaut: tous) */
  type?: 'housenumber' | 'street' | 'locality' | 'municipality'
  /** Filtrer par code postal */
  postcode?: string
  /** Callback quand une adresse est sélectionnée */
  onSelect?: (adresse: AdresseResult) => void
}

export interface UseAdresseAutocompleteReturn {
  /** Valeur du champ de saisie */
  inputValue: string
  /** Met à jour la valeur du champ */
  setInputValue: (value: string) => void
  /** Liste des suggestions */
  suggestions: AdresseResult[]
  /** Chargement en cours */
  isLoading: boolean
  /** Erreur éventuelle */
  error: string | null
  /** Adresse sélectionnée */
  selectedAdresse: AdresseResult | null
  /** Sélectionne une adresse */
  selectAdresse: (adresse: AdresseResult) => void
  /** Efface la sélection */
  clearSelection: () => void
  /** Afficher les suggestions */
  showSuggestions: boolean
  /** Ferme les suggestions */
  closeSuggestions: () => void
  /** Ouvre les suggestions */
  openSuggestions: () => void
}

// ══════════════════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════════════════

export function useAdresseAutocomplete(
  options: UseAdresseAutocompleteOptions = {}
): UseAdresseAutocompleteReturn {
  const {
    debounceMs = 300,
    minChars = 3,
    maxSuggestions = 8,
    type,
    postcode,
    onSelect,
  } = options

  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<AdresseResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAdresse, setSelectedAdresse] = useState<AdresseResult | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Recherche d'adresses avec debounce
  const searchAdresses = useCallback(async (query: string) => {
    // Normaliser la requête (trim + espaces simples)
    const normalizedQuery = query.trim().replace(/\s+/g, ' ')

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (normalizedQuery.length < minChars) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    setError(null)
    abortControllerRef.current = new AbortController()

    try {
      const params = new URLSearchParams({
        q: normalizedQuery,
        limit: String(maxSuggestions),
        autocomplete: '1',
      })

      if (type) params.append('type', type)
      if (postcode) params.append('postcode', postcode)

      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?${params}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        // Certains inputs très courts peuvent retourner 400 côté BAN
        if (response.status === 400) {
          setSuggestions([])
          setShowSuggestions(false)
          return
        }
        throw new Error('Erreur API')
      }

      const data = await response.json()
      const results: AdresseResult[] = (data.features || []).map((feature: { properties: Record<string, string | number>; geometry: { coordinates: [number, number] } }) => {
        const props = feature.properties
        const coords = feature.geometry.coordinates
        const dept = typeof props.citycode === 'string' ? props.citycode.substring(0, 2) : ''

        return {
          label: props.label,
          score: props.score,
          type: props.type,
          housenumber: props.housenumber,
          street: props.street,
          city: props.city,
          postcode: props.postcode,
          citycode: props.citycode,
          coordinates: coords as [number, number],
          context: props.context,
          departement: dept,
          region: '',
        }
      })

      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Erreur lors de la recherche')
        console.error('[Adresse] Erreur recherche:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [minChars, maxSuggestions, type, postcode])

  // Debounce sur la saisie
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    setSelectedAdresse(null) // Effacer la sélection si l'utilisateur modifie

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchAdresses(value)
    }, debounceMs)
  }, [searchAdresses, debounceMs])

  // Sélection d'une adresse
  const selectAdresse = useCallback((adresse: AdresseResult) => {
    setSelectedAdresse(adresse)
    setInputValue(adresse.label)
    setSuggestions([])
    setShowSuggestions(false)
    onSelect?.(adresse)
  }, [onSelect])

  // Effacer la sélection
  const clearSelection = useCallback(() => {
    setSelectedAdresse(null)
    setInputValue('')
    setSuggestions([])
  }, [])

  // Fermer les suggestions
  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false)
  }, [])

  // Ouvrir les suggestions
  const openSuggestions = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [suggestions.length])

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    inputValue,
    setInputValue: handleInputChange,
    suggestions,
    isLoading,
    error,
    selectedAdresse,
    selectAdresse,
    clearSelection,
    showSuggestions,
    closeSuggestions,
    openSuggestions,
  }
}

export default useAdresseAutocomplete
