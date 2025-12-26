'use client'

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * COMPOSANT - INPUT ENTREPRISE AVEC AUTOCOMPLÉTION
 * Recherche par SIREN, SIRET ou nom via API Recherche d'Entreprises
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useEffect } from 'react'
import { Building2, X, Loader2, Users, MapPin, AlertCircle, CheckCircle2, Hash } from 'lucide-react'
import { useEntrepriseAutocomplete } from '../hooks/useEntrepriseAutocomplete'
import type { Entreprise, RechercheOptions } from '@/lib/services/entreprise/api-sirene'
import { cn } from '../lib/utils'

interface EntrepriseInputProps {
  /** Label du champ */
  label?: string
  /** Placeholder */
  placeholder?: string
  /** Valeur initiale (SIREN ou nom) */
  value?: string
  /** Champ requis */
  required?: boolean
  /** Champ désactivé */
  disabled?: boolean
  /** Message d'erreur */
  error?: string
  /** Texte d'aide */
  helpText?: string
  /** Afficher les détails de l'entreprise sélectionnée */
  showDetails?: boolean
  /** Afficher les dirigeants */
  showDirigeants?: boolean
  /** Afficher les données financières */
  showFinances?: boolean
  /** Filtres de recherche */
  filtres?: RechercheOptions
  /** Callback lors de la sélection */
  onSelect?: (entreprise: Entreprise) => void
  /** Callback lors de la suppression */
  onClear?: () => void
  /** Classes CSS additionnelles */
  className?: string
}

export function EntrepriseInput({
  label,
  placeholder = 'Rechercher par nom, SIREN ou SIRET...',
  value,
  required = false,
  disabled = false,
  error,
  helpText,
  showDetails = true,
  showDirigeants = false,
  showFinances = false,
  filtres,
  onSelect,
  onClear,
  className,
}: EntrepriseInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    inputValue,
    setInputValue,
    suggestions,
    isLoading,
    error: searchError,
    selectedEntreprise,
    selectEntreprise,
    clearSelection,
    showSuggestions,
    closeSuggestions,
    searchType,
  } = useEntrepriseAutocomplete({
    onSelect,
    filtres,
  })

  // Initialiser avec la valeur
  useEffect(() => {
    if (value && !inputValue) {
      setInputValue(value)
    }
  }, [value, inputValue, setInputValue])

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

  const handleClear = () => {
    clearSelection()
    onClear?.()
  }

  // Formater le SIREN/SIRET
  const formatNumber = (num: string, type: 'siren' | 'siret') => {
    const clean = num.replace(/\D/g, '')
    if (type === 'siren') {
      return clean.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
    }
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
  }

  // Obtenir le badge de catégorie
  const getCategorieLabel = (cat?: string) => {
    switch (cat) {
      case 'PME': return { label: 'PME', color: 'bg-blue-100 text-blue-800' }
      case 'ETI': return { label: 'ETI', color: 'bg-purple-100 text-purple-800' }
      case 'GE': return { label: 'Grande Entreprise', color: 'bg-indigo-100 text-indigo-800' }
      default: return null
    }
  }

  // Obtenir l'état administratif
  const getEtatLabel = (etat?: string) => {
    return etat === 'A' 
      ? { label: 'Active', color: 'text-green-600', icon: CheckCircle2 }
      : { label: 'Cessée', color: 'text-red-600', icon: AlertCircle }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input avec icône */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error || searchError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
            disabled && 'bg-gray-50 cursor-not-allowed',
            selectedEntreprise && 'bg-green-50 border-green-300'
          )}
        />

        {/* Badge type de recherche */}
        {searchType && !selectedEntreprise && inputValue.length >= 2 && (
          <div className="absolute inset-y-0 right-10 flex items-center">
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              searchType === 'siren' && 'bg-blue-100 text-blue-700',
              searchType === 'siret' && 'bg-purple-100 text-purple-700',
              searchType === 'texte' && 'bg-gray-100 text-gray-700'
            )}>
              {searchType === 'siren' && 'SIREN'}
              {searchType === 'siret' && 'SIRET'}
              {searchType === 'texte' && 'Nom'}
            </span>
          </div>
        )}

        {/* Bouton clear */}
        {(inputValue || selectedEntreprise) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Message d'aide ou erreur */}
      {(helpText || error || searchError) && (
        <p className={cn(
          'mt-1 text-xs',
          error || searchError ? 'text-red-600' : 'text-gray-500'
        )}>
          {error || searchError || helpText}
        </p>
      )}

      {/* Dropdown suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
          {suggestions.map((entreprise) => {
            const categorie = getCategorieLabel(entreprise.categorie_entreprise)
            const etat = getEtatLabel(entreprise.etat_administratif)
            
            return (
              <button
                key={entreprise.siren}
                type="button"
                onClick={() => selectEntreprise(entreprise)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Nom entreprise */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {entreprise.nom_complet || entreprise.nom_raison_sociale}
                      </span>
                      {entreprise.sigle && (
                        <span className="text-xs text-gray-500">({entreprise.sigle})</span>
                      )}
                    </div>
                    
                    {/* SIREN + Adresse */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {formatNumber(entreprise.siren, 'siren')}
                      </span>
                      {entreprise.siege?.libelle_commune && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {entreprise.siege.libelle_commune}
                          {entreprise.siege.code_postal && ` (${entreprise.siege.code_postal})`}
                        </span>
                      )}
                    </div>
                    
                    {/* Activité */}
                    {entreprise.activite_principale && (
                      <div className="mt-1 text-xs text-gray-400 truncate">
                        {entreprise.activite_principale}
                      </div>
                    )}
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1">
                    {categorie && (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', categorie.color)}>
                        {categorie.label}
                      </span>
                    )}
                    <span className={cn('flex items-center gap-1 text-xs', etat.color)}>
                      <etat.icon className="w-3 h-3" />
                      {etat.label}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Détails de l'entreprise sélectionnée */}
      {selectedEntreprise && showDetails && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">
                {selectedEntreprise.nom_complet || selectedEntreprise.nom_raison_sociale}
              </h4>
              {selectedEntreprise.sigle && (
                <span className="text-sm text-gray-500">({selectedEntreprise.sigle})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getCategorieLabel(selectedEntreprise.categorie_entreprise) && (
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  getCategorieLabel(selectedEntreprise.categorie_entreprise)?.color
                )}>
                  {getCategorieLabel(selectedEntreprise.categorie_entreprise)?.label}
                </span>
              )}
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">SIREN</span>
              <p className="font-mono text-gray-900">{formatNumber(selectedEntreprise.siren, 'siren')}</p>
            </div>
            {selectedEntreprise.siege?.siret && (
              <div>
                <span className="text-gray-500">SIRET (siège)</span>
                <p className="font-mono text-gray-900">{formatNumber(selectedEntreprise.siege.siret, 'siret')}</p>
              </div>
            )}
            {selectedEntreprise.nature_juridique && (
              <div>
                <span className="text-gray-500">Forme juridique</span>
                <p className="text-gray-900">{selectedEntreprise.nature_juridique}</p>
              </div>
            )}
            {selectedEntreprise.activite_principale && (
              <div>
                <span className="text-gray-500">Code APE</span>
                <p className="text-gray-900">{selectedEntreprise.activite_principale}</p>
              </div>
            )}
            {selectedEntreprise.date_creation && (
              <div>
                <span className="text-gray-500">Date de création</span>
                <p className="text-gray-900">
                  {new Date(selectedEntreprise.date_creation).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {selectedEntreprise.tranche_effectif_salarie && (
              <div>
                <span className="text-gray-500">Effectifs</span>
                <p className="text-gray-900">{selectedEntreprise.tranche_effectif_salarie}</p>
              </div>
            )}
          </div>

          {/* Adresse */}
          {selectedEntreprise.siege?.adresse && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{selectedEntreprise.siege.adresse}</span>
              </div>
            </div>
          )}

          {/* Dirigeants */}
          {showDirigeants && selectedEntreprise.dirigeants && selectedEntreprise.dirigeants.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Dirigeants
              </h5>
              <div className="space-y-1">
                {selectedEntreprise.dirigeants.slice(0, 3).map((dir, i) => (
                  <div key={i} className="text-sm text-gray-600">
                    {dir.type_dirigeant === 'personne physique' ? (
                      <span>{dir.prenoms} {dir.nom} - {dir.qualite}</span>
                    ) : (
                      <span>{dir.denomination} - {dir.qualite}</span>
                    )}
                  </div>
                ))}
                {selectedEntreprise.dirigeants.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{selectedEntreprise.dirigeants.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Finances */}
          {showFinances && selectedEntreprise.finances && Object.keys(selectedEntreprise.finances).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Données financières</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(selectedEntreprise.finances)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 1)
                  .map(([annee, data]) => (
                    <div key={annee} className="col-span-2 flex justify-between">
                      <span className="text-gray-500">{annee}</span>
                      <div className="text-right">
                        {data.ca && (
                          <p className="text-gray-900">
                            CA: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.ca)}
                          </p>
                        )}
                        {data.resultat_net && (
                          <p className={data.resultat_net >= 0 ? 'text-green-600' : 'text-red-600'}>
                            Résultat: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.resultat_net)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Compléments (labels) */}
          {selectedEntreprise.complements && (
            <div className="mt-3 flex flex-wrap gap-1">
              {selectedEntreprise.complements.est_ess && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">ESS</span>
              )}
              {selectedEntreprise.complements.est_rge && (
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">RGE</span>
              )}
              {selectedEntreprise.complements.est_qualiopi && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Qualiopi</span>
              )}
              {selectedEntreprise.complements.est_bio && (
                <span className="text-xs px-2 py-0.5 bg-lime-100 text-lime-800 rounded-full">Bio</span>
              )}
              {selectedEntreprise.complements.est_societe_mission && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">Société à mission</span>
              )}
              {selectedEntreprise.complements.est_association && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">Association</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EntrepriseInput
