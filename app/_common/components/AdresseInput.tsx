/**
 * ══════════════════════════════════════════════════════════════════════════════
 * COMPOSANT INPUT ADRESSE AVEC AUTOCOMPLÉTION
 * Utilise l'API BAN + enrichissement zone PTZ / aides locales
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X, AlertCircle, Building, Home } from 'lucide-react'
import { useAdresseAutocomplete } from '../hooks/useAdresseAutocomplete'
import type { AdresseResult } from '@/lib/services/adresse/api-ban'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface AdresseInputProps {
  /** Valeur initiale */
  value?: string
  /** Label du champ */
  label?: string
  /** Placeholder */
  placeholder?: string
  /** Requis */
  required?: boolean
  /** Désactivé */
  disabled?: boolean
  /** Erreur externe */
  error?: string
  /** Message d'aide */
  helpText?: string
  /** Type de recherche (rue, commune, etc.) */
  type?: 'housenumber' | 'street' | 'locality' | 'municipality'
  /** Afficher la zone PTZ */
  showZonePTZ?: boolean
  /** Afficher les aides locales */
  showAidesLocales?: boolean
  /** Callback quand une adresse est sélectionnée */
  onSelect?: (adresse: AdresseResult & { zonePTZ?: string }) => void
  /** Callback quand la valeur change */
  onChange?: (value: string) => void
  /** Callback quand l'adresse est effacée */
  onClear?: () => void
  /** Classes CSS additionnelles */
  className?: string
}

// ══════════════════════════════════════════════════════════════════════════════
// ZONES PTZ - Mapping simplifié par département
// ══════════════════════════════════════════════════════════════════════════════

const ZONES_PAR_DEPT: Record<string, 'A_bis' | 'A' | 'B1' | 'B2' | 'C'> = {
  '75': 'A_bis', '92': 'A', '93': 'A', '94': 'A', '78': 'A', '91': 'A', '95': 'A',
  '77': 'B1', '06': 'A', '74': 'A', '13': 'B1', '31': 'B1', '33': 'B1', '34': 'B1',
  '35': 'B1', '38': 'B1', '44': 'B1', '59': 'B1', '67': 'B1', '69': 'B1',
}

function getZonePTZ(citycode: string): 'A_bis' | 'A' | 'B1' | 'B2' | 'C' {
  const dept = citycode?.substring(0, 2)
  return ZONES_PAR_DEPT[dept] || 'C'
}

function getZoneColor(zone: string): string {
  switch (zone) {
    case 'A_bis': return 'bg-red-100 text-red-800'
    case 'A': return 'bg-orange-100 text-orange-800'
    case 'B1': return 'bg-yellow-100 text-yellow-800'
    case 'B2': return 'bg-blue-100 text-blue-800'
    case 'C': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getZoneLabel(zone: string): string {
  switch (zone) {
    case 'A_bis': return 'Zone A bis (très tendue)'
    case 'A': return 'Zone A (tendue)'
    case 'B1': return 'Zone B1 (intermédiaire)'
    case 'B2': return 'Zone B2 (modérée)'
    case 'C': return 'Zone C (détendue)'
    default: return zone
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT
// ══════════════════════════════════════════════════════════════════════════════

export function AdresseInput({
  value = '',
  label = 'Adresse',
  placeholder = 'Saisissez une adresse...',
  required = false,
  disabled = false,
  error,
  helpText,
  type,
  showZonePTZ = true,
  showAidesLocales = false,
  onSelect,
  onChange,
  onClear,
  className = '',
}: AdresseInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [zonePTZ, setZonePTZ] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    inputValue,
    setInputValue,
    suggestions,
    isLoading,
    error: searchError,
    selectedAdresse,
    selectAdresse,
    clearSelection,
    showSuggestions,
    closeSuggestions,
    openSuggestions,
  } = useAdresseAutocomplete({
    type,
    minChars: 3,
    maxSuggestions: 8,
    debounceMs: 300,
    onSelect: (adresse) => {
      const zone = getZonePTZ(adresse.citycode)
      setZonePTZ(zone)
      onSelect?.({ ...adresse, zonePTZ: zone })
    },
  })

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value && value !== inputValue) {
      setInputValue(value)
    }
  }, [value])

  // Notifier le parent des changements
  useEffect(() => {
    onChange?.(inputValue)
  }, [inputValue, onChange])

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeSuggestions()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeSuggestions])

  // Gestion du clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSuggestions()
    }
  }, [closeSuggestions])

  // Effacer
  const handleClear = useCallback(() => {
    clearSelection()
    setZonePTZ(null)
    onClear?.()
    inputRef.current?.focus()
  }, [clearSelection, onClear])

  // Icône de type
  const TypeIcon = type === 'municipality' ? Building : Home

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icône gauche */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            openSuggestions()
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full pl-10 pr-10 py-2.5 
            border rounded-lg shadow-sm
            text-sm text-gray-900 placeholder-gray-400
            transition-colors duration-200
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${error || searchError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : selectedAdresse
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : isFocused
                  ? 'border-blue-300 ring-1 ring-blue-500'
                  : 'border-gray-300 hover:border-gray-400'
            }
          `}
        />

        {/* Icône droite (effacer ou validé) */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {selectedAdresse ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Effacer"
            >
              <X className="h-5 w-5" />
            </button>
          ) : inputValue.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Effacer"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Zone PTZ badge */}
      {showZonePTZ && selectedAdresse && zonePTZ && (
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getZoneColor(zonePTZ)}`}>
            {zonePTZ.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-500">{getZoneLabel(zonePTZ)}</span>
          {selectedAdresse && (
            <span className="text-xs text-gray-400">
              • {selectedAdresse.city} ({selectedAdresse.postcode})
            </span>
          )}
        </div>
      )}

      {/* Liste des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {suggestions.map((suggestion, index) => {
            const zone = getZonePTZ(suggestion.citycode)
            return (
              <li
                key={`${suggestion.citycode}-${index}`}
                onClick={() => selectAdresse(suggestion)}
                className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <TypeIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {suggestion.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {suggestion.context}
                      </div>
                    </div>
                  </div>
                  {showZonePTZ && (
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getZoneColor(zone)}`}>
                      {zone.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Message d'erreur */}
      {(error || searchError) && (
        <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error || searchError}</span>
        </div>
      )}

      {/* Message d'aide */}
      {helpText && !error && !searchError && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  )
}

export default AdresseInput
