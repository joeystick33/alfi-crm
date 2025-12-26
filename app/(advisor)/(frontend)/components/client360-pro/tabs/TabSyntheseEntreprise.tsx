'use client'

/**
 * TabSyntheseEntreprise - Vue d'ensemble entreprise
 * 
 * Affiche les informations clés de l'entreprise :
 * - Identité (SIREN, SIRET, forme juridique)
 * - Données SIRENE enrichies (effectifs, activité, dirigeants)
 * - KPIs financiers (si disponibles)
 * - Alertes et opportunités
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

// =============================================================================
// Types
// =============================================================================

interface TabSyntheseEntrepriseProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

interface EntrepriseData {
  siren: string
  siret_siege: string
  denomination: string
  forme_juridique: string
  date_creation?: string
  date_creation_formate?: string
  entreprise_cessee: boolean
  tranche_effectif?: string
  effectif_estime?: number
  categorie_entreprise?: string
  code_naf?: string
  libelle_naf?: string
  siege: {
    adresse_complete?: string
    adresse_ligne_1?: string
    code_postal?: string
    ville?: string
  }
  dirigeants?: Array<{
    nom: string
    prenom?: string
    qualite: string
  }>
  derniers_chiffres?: {
    chiffre_affaires?: number
    resultat_net?: number
    annee?: number
  }
  ratios?: {
    marge_nette?: number
    croissance_ca?: number
  }
  liens?: {
    pappers: string
    infogreffe: string
    bodacc: string
  }
  source?: string
}

// =============================================================================
// Composant Principal
// =============================================================================

export default function TabSyntheseEntreprise({
  clientId,
  client,
  wealthSummary,
}: TabSyntheseEntrepriseProps) {
  const { toast } = useToast()
  const [entreprise, setEntreprise] = useState<EntrepriseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les données SIRENE
  const fetchEntrepriseData = async () => {
    const siren = client.siren || client.siret?.slice(0, 9)
    if (!siren) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/advisor/entreprise/pappers?siren=${siren}`)
      const result = await response.json()

      if (result.success && result.data) {
        setEntreprise(result.data)
      } else {
        setError(result.error || 'Erreur lors de la récupération des données')
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('[TabSyntheseEntreprise] Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (client.siren || client.siret) {
      fetchEntrepriseData()
    }
  }, [client.siren, client.siret])

  // Formater les montants
  const formatMontant = (montant?: number) => {
    if (!montant) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(montant)
  }

  // Formater le SIRET avec espaces
  const formatSiret = (siret?: string) => {
    if (!siret) return '-'
    return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {entreprise?.denomination || client.companyName || 'Entreprise'}
            </h2>
            <p className="text-sm text-gray-500">
              {entreprise?.forme_juridique || client.legalForm || 'Forme juridique non renseignée'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {entreprise?.entreprise_cessee ? (
            <Badge className="bg-red-100 text-red-700 border-red-200">
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Cessée
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Active
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEntrepriseData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">{error}</p>
            <p className="text-xs text-amber-600 mt-1">
              Les données affichées proviennent du dossier client.
            </p>
          </div>
        </div>
      )}

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identité entreprise */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Identité de l'entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="SIREN" value={entreprise?.siren || client.siren || '-'} mono />
                <InfoRow label="SIRET siège" value={formatSiret(entreprise?.siret_siege || client.siret)} mono />
                <InfoRow label="Forme juridique" value={entreprise?.forme_juridique || client.legalForm} />
                <InfoRow label="Date création" value={entreprise?.date_creation_formate || '-'} />
                <InfoRow
                  label="Code NAF"
                  value={
                    entreprise?.code_naf ||
                    (typeof (client as unknown as { codeNAF?: unknown }).codeNAF === 'string'
                      ? (client as unknown as { codeNAF?: string }).codeNAF
                      : undefined) ||
                    '-'
                  }
                  mono
                />
                <InfoRow label="Activité" value={entreprise?.libelle_naf || client.activitySector || '-'} />
                <InfoRow label="Effectifs" value={entreprise?.tranche_effectif || `${client.numberOfEmployees || '-'} salariés`} />
                <InfoRow label="Catégorie" value={entreprise?.categorie_entreprise || '-'} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Siège social */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Siège social
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  {entreprise?.siege?.adresse_complete || 
                   entreprise?.siege?.adresse_ligne_1 ||
                   client.address?.street || 
                   'Adresse non renseignée'}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {entreprise?.siege?.code_postal || client.address?.postalCode} {' '}
                  {entreprise?.siege?.ville || client.address?.city}
                </p>
                {entreprise?.liens?.pappers && (
                  <a
                    href={entreprise.liens.pappers}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Voir sur Pappers
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPIs & Dirigeants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chiffres clés */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Chiffres clés
              {entreprise?.derniers_chiffres?.annee && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {entreprise.derniers_chiffres.annee}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : entreprise?.derniers_chiffres ? (
              <div className="grid grid-cols-2 gap-4">
                <KPICard
                  label="Chiffre d'affaires"
                  value={formatMontant(entreprise.derniers_chiffres.chiffre_affaires)}
                  trend={entreprise.ratios?.croissance_ca}
                />
                <KPICard
                  label="Résultat net"
                  value={formatMontant(entreprise.derniers_chiffres.resultat_net)}
                  trend={entreprise.ratios?.marge_nette}
                  trendLabel="Marge"
                />
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Données financières non disponibles</p>
                <p className="text-xs text-gray-400 mt-1">
                  Source: API recherche-entreprises.api.gouv.fr
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dirigeants */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Dirigeants
              {entreprise?.dirigeants && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {entreprise.dirigeants.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : entreprise?.dirigeants && entreprise.dirigeants.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {entreprise.dirigeants.slice(0, 5).map((dirigeant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dirigeant.prenom} {dirigeant.nom}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {dirigeant.qualite}
                      </p>
                    </div>
                  </div>
                ))}
                {entreprise.dirigeants.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    + {entreprise.dirigeants.length - 5} autres dirigeants
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucun dirigeant trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liens externes */}
      {entreprise?.liens && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <ExternalLinkButton href={entreprise.liens.pappers} label="Pappers" />
              <ExternalLinkButton href={entreprise.liens.infogreffe} label="Infogreffe" />
              <ExternalLinkButton href={entreprise.liens.bodacc} label="BODACC" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source des données */}
      <p className="text-xs text-gray-400 text-center">
        Source : {entreprise?.source === 'api-gouv+inpi' ? 'API recherche-entreprises + INPI' : 'API recherche-entreprises.api.gouv.fr'}
      </p>
    </div>
  )
}

// =============================================================================
// Composants utilitaires
// =============================================================================

function InfoRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>
        {value || '-'}
      </p>
    </div>
  )
}

function KPICard({ 
  label, 
  value, 
  trend, 
  trendLabel = 'Croissance' 
}: { 
  label: string
  value: string
  trend?: number
  trendLabel?: string
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% {trendLabel}
        </p>
      )}
    </div>
  )
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {label}
    </a>
  )
}
