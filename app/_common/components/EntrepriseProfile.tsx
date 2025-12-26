'use client'

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * COMPOSANT - PROFIL ENTREPRISE ENRICHI
 * Affiche le score financier, alertes, données SIRENE
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react'
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  Activity,
  Award,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Euro,
} from 'lucide-react'
import { cn } from '../lib/utils'
import type { Entreprise } from '@/lib/services/entreprise/api-sirene'
import {
  calculerScoreFinancier,
  detecterAlertes,
  analyserSecteur,
  extraireLabels,
} from '@/lib/services/entreprise/enrichissement'

interface EntrepriseProfileProps {
  /** SIREN de l'entreprise */
  siren?: string
  /** Données entreprise (si déjà chargées) */
  entreprise?: Entreprise
  /** Mode compact */
  compact?: boolean
  /** Afficher les alertes */
  showAlertes?: boolean
  /** Afficher le score */
  showScore?: boolean
  /** Afficher les finances */
  showFinances?: boolean
  /** Afficher les dirigeants */
  showDirigeants?: boolean
  /** Callback pour rafraîchir */
  onRefresh?: () => void
  /** Classes CSS */
  className?: string
}

export function EntrepriseProfile({
  siren,
  entreprise: entrepriseProp,
  compact = false,
  showAlertes = true,
  showScore = true,
  showFinances = true,
  showDirigeants = true,
  onRefresh,
  className,
}: EntrepriseProfileProps) {
  const [entreprise, setEntreprise] = useState<Entreprise | null>(entrepriseProp || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(!compact)
  
  // Charger les données si SIREN fourni
  useEffect(() => {
    if (siren && !entrepriseProp) {
      loadEntreprise(siren)
    }
  }, [siren, entrepriseProp])
  
  // Mettre à jour si prop change
  useEffect(() => {
    if (entrepriseProp) {
      setEntreprise(entrepriseProp)
    }
  }, [entrepriseProp])
  
  const loadEntreprise = async (sirenToLoad: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${sirenToLoad}&per_page=1`
      )
      
      if (!response.ok) {
        throw new Error('Entreprise non trouvée')
      }
      
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        setEntreprise(data.results[0])
      } else {
        throw new Error('Entreprise non trouvée')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRefresh = () => {
    if (siren) {
      loadEntreprise(siren)
    }
    onRefresh?.()
  }
  
  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Chargement des données SIRENE...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={cn('bg-red-50 rounded-lg border border-red-200 p-4', className)}>
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }
  
  if (!entreprise) {
    return null
  }
  
  const score = calculerScoreFinancier(entreprise)
  const alertes = detecterAlertes(entreprise)
  const analyse = analyserSecteur(entreprise)
  const labels = extraireLabels(entreprise)
  
  // Formateur monétaire
  const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0 
  }).format(n)
  
  // Formater SIREN
  const formatSiren = (s: string) => s.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
  const formatSiret = (s: string) => s.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
  
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* En-tête */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {entreprise.nom_complet || entreprise.nom_raison_sociale}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                <span className="font-mono">{formatSiren(entreprise.siren)}</span>
                {entreprise.etat_administratif === 'A' ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    Cessée
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Score */}
            {showScore && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold',
                score.niveau === 'excellent' && 'bg-green-100 text-green-700',
                score.niveau === 'bon' && 'bg-emerald-100 text-emerald-700',
                score.niveau === 'moyen' && 'bg-yellow-100 text-yellow-700',
                score.niveau === 'faible' && 'bg-orange-100 text-orange-700',
                score.niveau === 'critique' && 'bg-red-100 text-red-700',
              )}>
                <Activity className="w-4 h-4" />
                {score.score}/100
              </div>
            )}
            
            {/* Actions */}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <a
              href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${entreprise.siren}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Voir sur l'Annuaire des Entreprises"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            
            {compact && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
        
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {labels.map(label => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                <Award className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Alertes */}
      {showAlertes && alertes.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          {alertes.map((alerte, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 text-sm',
                i > 0 && 'mt-2'
              )}
            >
              <AlertTriangle className={cn(
                'w-4 h-4 mt-0.5 flex-shrink-0',
                alerte.niveau === 'danger' && 'text-red-500',
                alerte.niveau === 'warning' && 'text-amber-500',
                alerte.niveau === 'info' && 'text-blue-500',
              )} />
              <div>
                <span className="font-medium">{alerte.titre}</span>
                <span className="text-gray-600 ml-1">{alerte.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Contenu dépliable */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Informations générales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {entreprise.siege?.siret && (
              <div>
                <span className="text-gray-500">SIRET (siège)</span>
                <p className="font-mono text-gray-900">{formatSiret(entreprise.siege.siret)}</p>
              </div>
            )}
            {entreprise.nature_juridique && (
              <div>
                <span className="text-gray-500">Forme juridique</span>
                <p className="text-gray-900">{entreprise.nature_juridique}</p>
              </div>
            )}
            {entreprise.date_creation && (
              <div>
                <span className="text-gray-500">Création</span>
                <p className="text-gray-900">
                  {new Date(entreprise.date_creation).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {entreprise.categorie_entreprise && (
              <div>
                <span className="text-gray-500">Catégorie</span>
                <p className="text-gray-900">
                  {entreprise.categorie_entreprise === 'PME' && 'PME'}
                  {entreprise.categorie_entreprise === 'ETI' && 'ETI'}
                  {entreprise.categorie_entreprise === 'GE' && 'Grande Entreprise'}
                </p>
              </div>
            )}
          </div>
          
          {/* Activité */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4" />
              Activité
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Code APE</span>
                <p className="text-gray-900">{entreprise.activite_principale || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">Secteur</span>
                <p className="text-gray-900">{analyse.libelleSecteur}</p>
              </div>
              {entreprise.tranche_effectif_salarie && (
                <div>
                  <span className="text-gray-500">Effectifs</span>
                  <p className="text-gray-900">{entreprise.tranche_effectif_salarie}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Établissements</span>
                <p className="text-gray-900">
                  {entreprise.nombre_etablissements_ouverts || 0} ouvert(s) / {entreprise.nombre_etablissements || 0} total
                </p>
              </div>
            </div>
          </div>
          
          {/* Adresse */}
          {entreprise.siege?.adresse && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{entreprise.siege.adresse}</span>
              </div>
            </div>
          )}
          
          {/* Finances */}
          {showFinances && entreprise.finances && Object.keys(entreprise.finances).length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Euro className="w-4 h-4" />
                Données financières
              </div>
              <div className="space-y-2">
                {Object.entries(entreprise.finances)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 3)
                  .map(([annee, data]) => (
                    <div key={annee} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-700">{annee}</span>
                      <div className="flex items-center gap-4">
                        {data.ca !== undefined && (
                          <div className="text-right">
                            <span className="text-gray-500 text-xs">CA</span>
                            <p className="font-medium text-gray-900">{fmtEur(data.ca)}</p>
                          </div>
                        )}
                        {data.resultat_net !== undefined && (
                          <div className="text-right">
                            <span className="text-gray-500 text-xs">Résultat</span>
                            <p className={cn(
                              'font-medium',
                              data.resultat_net >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {fmtEur(data.resultat_net)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Dirigeants */}
          {showDirigeants && entreprise.dirigeants && entreprise.dirigeants.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4" />
                Dirigeants ({entreprise.dirigeants.length})
              </div>
              <div className="space-y-2">
                {entreprise.dirigeants.slice(0, 5).map((dir, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-900">
                      {dir.type_dirigeant === 'personne physique'
                        ? `${dir.prenoms} ${dir.nom}`
                        : dir.denomination}
                    </span>
                    <span className="text-gray-500 text-xs">{dir.qualite}</span>
                  </div>
                ))}
                {entreprise.dirigeants.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">
                    +{entreprise.dirigeants.length - 5} autres dirigeants
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Score détaillé */}
          {showScore && score.indicateurs.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Activity className="w-4 h-4" />
                  Analyse du score
                </div>
                <span className={cn('text-sm font-semibold', score.couleur)}>
                  {score.niveau.charAt(0).toUpperCase() + score.niveau.slice(1)}
                </span>
              </div>
              
              {/* Barre de progression */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    score.score >= 80 && 'bg-green-500',
                    score.score >= 65 && score.score < 80 && 'bg-emerald-500',
                    score.score >= 50 && score.score < 65 && 'bg-yellow-500',
                    score.score >= 30 && score.score < 50 && 'bg-orange-500',
                    score.score < 30 && 'bg-red-500',
                  )}
                  style={{ width: `${score.score}%` }}
                />
              </div>
              
              {/* Indicateurs */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {score.indicateurs.map((ind, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <span className="text-gray-600">{ind.label}</span>
                    <span className={cn(
                      'font-medium',
                      ind.statut === 'positif' && 'text-green-600',
                      ind.statut === 'neutre' && 'text-gray-700',
                      ind.statut === 'negatif' && 'text-red-600',
                    )}>
                      {ind.valeur}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Recommandations */}
              {score.recommandations.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-1">Points d'attention</p>
                  <ul className="text-xs text-amber-700 space-y-0.5">
                    {score.recommandations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EntrepriseProfile
