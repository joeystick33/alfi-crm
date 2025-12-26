'use client'
 

/**
 * Client Portal - Mes Contrats
 * 
 * Liste des contrats du client:
 * - Assurance vie, PER, PEA, etc.
 * - Détails et valeur actuelle
 * - Échéances à venir
 * 
 * UX Pédagogique:
 * - Explication des types de contrats
 * - Indicateurs visuels clairs
 * - Alertes sur les échéances
 */

import { useMemo, useState } from 'react'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientPortalContrats } from '@/app/_common/hooks/use-api'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import {
  FileText,
  TrendingUp,
  Building2,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle,
  Euro,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'

// Structures vides par défaut
const EMPTY_STATS = {
  total: 0,
  portfolioValue: 0,
  byType: [],
}

// Configuration des types de contrats avec explications pédagogiques
const CONTRACT_TYPE_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: any;
  explanation: string;
  benefits: string[];
}> = {
  ASSURANCE_VIE: { 
    label: 'Assurance Vie', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: Shield,
    explanation: 'Un placement qui combine épargne et transmission. Votre argent peut être investi sur différents supports.',
    benefits: ['Fiscalité avantageuse après 8 ans', 'Transmission facilitée', 'Disponibilité des fonds']
  },
  PER: { 
    label: 'Plan Épargne Retraite', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: TrendingUp,
    explanation: 'Une épargne bloquée jusqu\'à la retraite avec des avantages fiscaux immédiats.',
    benefits: ['Réduction d\'impôts à l\'entrée', 'Sortie en capital ou rente', 'Déblocages anticipés possibles']
  },
  PEA: { 
    label: 'Plan Épargne Actions', 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100',
    icon: TrendingUp,
    explanation: 'Un compte-titres pour investir en bourse avec une fiscalité allégée après 5 ans.',
    benefits: ['Exonération d\'impôts après 5 ans', 'Investissement en actions', 'Plafond de 150 000€']
  },
  PREVOYANCE: { 
    label: 'Prévoyance', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100',
    icon: Shield,
    explanation: 'Une protection pour vous et votre famille en cas d\'accident, maladie ou décès.',
    benefits: ['Protection du revenu', 'Capital décès', 'Garantie invalidité']
  },
  SCPI: { 
    label: 'SCPI', 
    color: 'text-cyan-700', 
    bgColor: 'bg-cyan-100',
    icon: Building2,
    explanation: 'Un investissement immobilier collectif : vous détenez des parts d\'un parc immobilier.',
    benefits: ['Revenus locatifs réguliers', 'Pas de gestion', 'Diversification']
  },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  CLOTURE: { label: 'Clôturé', color: 'bg-gray-100 text-gray-700' },
}

export default function ContratsPage() {
  const { user } = useAuth()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedContract, setExpandedContract] = useState<string | null>(null)

  const { data: apiData, isLoading, refetch } = useClientPortalContrats(user?.id || '')

  const contrats = useMemo(() => {
    if (apiData?.contrats) return apiData.contrats
    return []
  }, [apiData])

  const stats = useMemo(() => {
    if (apiData?.stats) return apiData.stats as unknown as { total: number; portfolioValue: number; byType: unknown[] }
    return EMPTY_STATS as unknown as { total: number; portfolioValue: number; byType: unknown[] }
  }, [apiData])

  const upcomingRenewals = useMemo(() => {
    if (apiData?.upcomingRenewals) return apiData.upcomingRenewals
    return []
  }, [apiData])

  const hasData = apiData !== null && apiData !== undefined

  const filteredContrats = useMemo(() => {
    if (typeFilter === 'all') return contrats
    return contrats.filter((c: any) => c.type === typeFilter)
  }, [contrats, typeFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getPerformance = (montant: number, currentValue: number | null) => {
    if (!currentValue || !montant) return null
    const perf = ((currentValue - montant) / montant) * 100
    return perf
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Contrats</h1>
        <p className="text-gray-500 mt-1">
          Consultez vos contrats d'assurance, d'épargne et de prévoyance
        </p>
      </div>

      {/* Info Box - Pédagogique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Comment lire cette page ?</p>
            <p className="text-blue-700 mt-1">
              Vous trouverez ici tous vos <strong>contrats financiers</strong> : assurance vie, PER, PEA, prévoyance...
              Pour chaque contrat, vous voyez la <strong>valeur actuelle</strong> de votre épargne 
              et sa <strong>performance</strong> depuis l'ouverture.
              Cliquez sur un contrat pour en savoir plus.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Renewals Alert */}
      {upcomingRenewals.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Échéances à venir</p>
              <p className="text-sm text-amber-700 mt-1">
                {upcomingRenewals.length} contrat(s) arrivent à échéance dans les 3 prochains mois.
                Contactez votre conseiller pour renouveler ou ajuster vos garanties.
              </p>
              <div className="mt-2 space-y-1">
                {upcomingRenewals.map((renewal: any) => (
                  <p key={renewal.id} className="text-xs text-amber-600">
                    • {CONTRACT_TYPE_CONFIG[renewal.type]?.label || renewal.type} ({renewal.compagnie}) - Échéance: {formatDate(renewal.dateEcheance)}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Contrats actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Valeur totale de votre épargne</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.portfolioValue)}</p>
              </div>
              <Euro className="h-12 w-12 text-blue-300 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Filtrer par type :</span>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(CONTRACT_TYPE_CONFIG).map(([type, config]) => (
              <SelectItem key={type} value={type}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContrats.map((contrat: any) => {
          const typeConfig = CONTRACT_TYPE_CONFIG[contrat.type] || CONTRACT_TYPE_CONFIG.ASSURANCE_VIE
          const statusConfig = STATUS_CONFIG[contrat.status] || STATUS_CONFIG.ACTIVE
          const Icon = typeConfig.icon
          const performance = getPerformance(contrat.montant, contrat.currentValue)
          const isExpanded = expandedContract === contrat.id

          return (
            <Card key={contrat.id}>
              <CardContent className="p-0">
                {/* Main Row */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedContract(isExpanded ? null : contrat.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon & Type */}
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 ${typeConfig.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${typeConfig.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={typeConfig.bgColor + ' ' + typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </div>
                        <p className="font-semibold text-gray-900 mt-1">{contrat.produit}</p>
                        <p className="text-sm text-gray-500">{contrat.compagnie} • {contrat.reference}</p>
                      </div>
                    </div>

                    {/* Value & Performance */}
                    <div className="md:ml-auto flex items-center gap-8">
                      {contrat.currentValue && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Valeur actuelle</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(contrat.currentValue)}
                          </p>
                          {performance !== null && (
                            <p className={`text-sm ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {performance >= 0 ? '+' : ''}{performance.toFixed(1)}% depuis l'ouverture
                            </p>
                          )}
                        </div>
                      )}
                      <div className="hidden md:block">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Contract Details */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Détails du contrat</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Versement initial</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(contrat.montant)}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Date d'ouverture</p>
                            <p className="font-semibold text-gray-900">{formatDate(contrat.dateSignature)}</p>
                          </div>
                          {contrat.frequenceVersement && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">Fréquence versement</p>
                              <p className="font-semibold text-gray-900">
                                {contrat.frequenceVersement === 'MENSUEL' ? 'Mensuel' : 
                                 contrat.frequenceVersement === 'ANNUEL' ? 'Annuel' : 
                                 contrat.frequenceVersement}
                              </p>
                            </div>
                          )}
                          {contrat.dateEcheance && (
                            <div className="p-3 bg-amber-50 rounded-lg">
                              <p className="text-amber-600">Échéance</p>
                              <p className="font-semibold text-amber-900">{formatDate(contrat.dateEcheance)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Educational Card */}
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Comprendre ce type de contrat
                        </h4>
                        <p className="text-sm text-blue-700 mt-2">{typeConfig.explanation}</p>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-blue-900">Avantages :</p>
                          <ul className="mt-1 space-y-1">
                            {typeConfig.benefits.map((benefit, i) => (
                              <li key={i} className="text-xs text-blue-700 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-blue-600" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredContrats.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">Aucun contrat trouvé</p>
            <p className="text-gray-500 text-sm mt-1">
              {typeFilter !== 'all' 
                ? 'Aucun contrat de ce type'
                : 'Vous n\'avez pas encore de contrat enregistré'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
