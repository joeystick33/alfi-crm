'use client'

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * HOOK - AUTOCOMPLÉTION ENTREPRISE (API SIRENE)
 * Recherche par SIREN, SIRET ou nom avec debounce
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Entreprise, RechercheOptions } from '@/lib/services/entreprise/api-sirene'

interface UseEntrepriseAutocompleteOptions {
  /** Délai de debounce en ms (défaut: 300) */
  debounceMs?: number
  /** Nombre minimum de caractères (défaut: 2) */
  minChars?: number
  /** Nombre max de résultats (défaut: 10) */
  maxResults?: number
  /** Filtrer seulement les entreprises actives (défaut: true) */
  activeOnly?: boolean
  /** Callback lors de la sélection */
  onSelect?: (entreprise: Entreprise) => void
  /** Options de filtrage supplémentaires */
  filtres?: RechercheOptions
}

interface UseEntrepriseAutocompleteReturn {
  /** Valeur actuelle de l'input */
  inputValue: string
  /** Setter pour la valeur de l'input */
  setInputValue: (value: string) => void
  /** Liste des suggestions */
  suggestions: Entreprise[]
  /** Chargement en cours */
  isLoading: boolean
  /** Erreur éventuelle */
  error: string | null
  /** Entreprise sélectionnée */
  selectedEntreprise: Entreprise | null
  /** Sélectionner une entreprise */
  selectEntreprise: (entreprise: Entreprise) => void
  /** Réinitialiser la sélection */
  clearSelection: () => void
  /** Afficher/masquer les suggestions */
  showSuggestions: boolean
  /** Fermer les suggestions */
  closeSuggestions: () => void
  /** Type de recherche détecté */
  searchType: 'siren' | 'siret' | 'texte' | null
}

export function useEntrepriseAutocomplete(
  options: UseEntrepriseAutocompleteOptions = {}
): UseEntrepriseAutocompleteReturn {
  const {
    debounceMs = 300,
    minChars = 2,
    maxResults = 10,
    activeOnly = true,
    onSelect,
    filtres,
  } = options

  // Stabiliser filtres pour éviter les re-renders infinis
  const stableFiltres = useMemo(() => filtres || {}, [
    filtres?.nature_juridique,
    filtres?.activite_principale,
    filtres?.section_activite_principale,
    filtres?.departement,
    filtres?.code_postal,
    filtres?.categorie_entreprise,
  ])

  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Entreprise[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchType, setSearchType] = useState<'siren' | 'siret' | 'texte' | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Détecter le type de recherche
  const detectType = useCallback((query: string): 'siren' | 'siret' | 'texte' | null => {
    if (!query) return null
    const clean = query.replace(/[\s-]/g, '')
    if (/^\d{14}$/.test(clean)) return 'siret'
    if (/^\d{9}$/.test(clean)) return 'siren'
    if (/^\d+$/.test(clean) && clean.length >= 2) return clean.length > 9 ? 'siret' : 'siren'
    return 'texte'
  }, [])

  // Effectuer la recherche
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < minChars) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('q', query)
      params.set('per_page', String(maxResults))
      
      if (activeOnly) {
        params.set('etat_administratif', 'A')
      }
      
      // Ajouter les filtres
      if (stableFiltres.nature_juridique) params.set('nature_juridique', stableFiltres.nature_juridique)
      if (stableFiltres.activite_principale) params.set('activite_principale', stableFiltres.activite_principale)
      if (stableFiltres.section_activite_principale) params.set('section_activite_principale', stableFiltres.section_activite_principale)
      if (stableFiltres.departement) params.set('departement', stableFiltres.departement)
      if (stableFiltres.code_postal) params.set('code_postal', stableFiltres.code_postal)
      if (stableFiltres.categorie_entreprise) params.set('categorie_entreprise', stableFiltres.categorie_entreprise)

      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const data = await response.json()
      setSuggestions(data.results || [])
      setShowSuggestions((data.results?.length || 0) > 0)
      setSearchType(detectType(query))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[Entreprise Autocomplete] Erreur:', err)
      setError('Erreur lors de la recherche')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [minChars, maxResults, activeOnly, stableFiltres, detectType])

  // Effect pour le debounce
  useEffect(() => {
    if (selectedEntreprise) return // Ne pas rechercher si déjà sélectionné

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!inputValue || inputValue.length < minChars) {
      setSuggestions([])
      setShowSuggestions(false)
      setSearchType(null)
      return
    }

    setSearchType(detectType(inputValue))

    debounceTimerRef.current = setTimeout(() => {
      performSearch(inputValue)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [inputValue, minChars, debounceMs, performSearch, selectedEntreprise, detectType])

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const selectEntreprise = useCallback((entreprise: Entreprise) => {
    setSelectedEntreprise(entreprise)
    setInputValue(entreprise.nom_complet || entreprise.nom_raison_sociale || '')
    setSuggestions([])
    setShowSuggestions(false)
    onSelect?.(entreprise)
  }, [onSelect])

  const clearSelection = useCallback(() => {
    setSelectedEntreprise(null)
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
    setSearchType(null)
  }, [])

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false)
  }, [])

  return {
    inputValue,
    setInputValue,
    suggestions,
    isLoading,
    error,
    selectedEntreprise,
    selectEntreprise,
    clearSelection,
    showSuggestions,
    closeSuggestions,
    searchType,
  }
}
