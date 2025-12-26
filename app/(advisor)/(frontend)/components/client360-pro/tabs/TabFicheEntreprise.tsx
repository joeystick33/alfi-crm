'use client'

/**
 * TabFicheEntreprise - Données légales et SIRENE de l'entreprise
 * 
 * Affiche les informations enrichies via l'API SIRENE :
 * - Identification (SIREN, SIRET, forme juridique)
 * - Activité (code APE, secteur)
 * - Dirigeants
 * - Score financier et alertes
 * - Données financières (CA, résultat)
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { 
  Building2, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  User,
  MapPin,
  Calendar,
  Hash,
  Activity,
  Award,
  Euro,
  Briefcase,
  Copy,
} from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import type { ProfilEntreprise } from '@/lib/services/entreprise/enrichissement'

interface TabFicheEntrepriseProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function TabFicheEntreprise({ clientId: _clientId, client }: TabFicheEntrepriseProps) {
  const { toast } = useToast()
  const [profil, setProfil] = useState<ProfilEntreprise | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Charger les données SIRENE
  const loadSireneData = async () => {
    const siren = client.siret?.substring(0, 9) || client.siren
    if (!siren) {
      setError('Aucun SIREN/SIRET renseigné pour ce client')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/advisor/entreprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enrichir', siren }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données')
      }

      const data = await response.json()
      // L'API renvoie { success: true, data: profil }
      setProfil(data.data || data.profil)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSireneData()
  }, [client.siret, client.siren])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast({ title: `${label} copié` })
    setTimeout(() => setCopied(null), 2000)
  }

  // Fonction pour obtenir la couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excellente'
    if (score >= 50) return 'Bonne'
    if (score >= 30) return 'Moyenne'
    return 'Fragile'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Données SIRENE non disponibles</p>
                <p className="text-sm text-amber-700">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadSireneData} className="ml-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Afficher les données du client même sans SIRENE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#7373FF]" />
              Informations client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {client.companyName && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase mb-1">Raison sociale</p>
                  <p className="font-semibold">{client.companyName}</p>
                </div>
              )}
              {client.siret && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase mb-1">SIRET</p>
                  <p className="font-mono font-semibold">{client.siret}</p>
                </div>
              )}
              {client.legalForm && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase mb-1">Forme juridique</p>
                  <p className="font-semibold">{client.legalForm}</p>
                </div>
              )}
              {client.activitySector && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase mb-1">Secteur</p>
                  <p className="font-semibold">{client.activitySector}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profil) return null

  const entreprise = profil.entreprise
  const score = profil.score
  const alertes = profil.alertes

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7373FF]/15 rounded-lg">
            <Building2 className="h-6 w-6 text-[#7373FF]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fiche Entreprise</h2>
            <p className="text-sm text-gray-500">Données légales enrichies via l'API SIRENE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSireneData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(`https://annuaire-entreprises.data.gouv.fr/entreprise/${entreprise.siren}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Annuaire
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Score financier */}
        <Card className={`border ${getScoreColor(score.score)}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Score Financier</span>
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{score.score}</span>
              <span className="text-sm mb-1">/100</span>
            </div>
            <p className="text-sm mt-1">{getScoreLabel(score.score)}</p>
          </CardContent>
        </Card>

        {/* État administratif */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">État</span>
              {entreprise.etat_administratif === 'A' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-xl font-bold text-gray-900">
              {entreprise.etat_administratif === 'A' ? 'Active' : 'Cessée'}
            </p>
            {entreprise.date_creation && (
              <p className="text-sm text-gray-500">
                Depuis {new Date(entreprise.date_creation).getFullYear()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Effectifs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Effectifs</span>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {entreprise.tranche_effectif_salarie || '-'}
            </p>
            <p className="text-sm text-gray-500">salariés</p>
          </CardContent>
        </Card>

        {/* Catégorie */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Catégorie</span>
              <Briefcase className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-900">
              {entreprise.categorie_entreprise || '-'}
            </p>
            <p className="text-sm text-gray-500">
              {entreprise.categorie_entreprise === 'PME' ? 'Petite/Moyenne Entreprise' :
               entreprise.categorie_entreprise === 'ETI' ? 'Entreprise Taille Intermédiaire' :
               entreprise.categorie_entreprise === 'GE' ? 'Grande Entreprise' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertes ({alertes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertes.map((alerte, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg flex items-start gap-3 ${
                    alerte.type === 'cessation' ? 'bg-red-100 text-red-800' :
                    alerte.type === 'baisse_ca' || alerte.type === 'resultat_negatif' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{alerte.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-600" />
              Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between group">
                <div>
                  <p className="text-xs text-gray-500 uppercase">SIREN</p>
                  <p className="font-mono font-semibold">{entreprise.siren}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => copyToClipboard(entreprise.siren, 'SIREN')}
                >
                  {copied === 'SIREN' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              {entreprise.siege?.siret && (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between group">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">SIRET Siège</p>
                    <p className="font-mono font-semibold">
                      {entreprise.siege.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => copyToClipboard(entreprise.siege.siret, 'SIRET')}
                  >
                    {copied === 'SIRET' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Dénomination</p>
                <p className="font-semibold">{entreprise.nom_complet}</p>
                {entreprise.sigle && (
                  <p className="text-sm text-gray-600">Sigle : {entreprise.sigle}</p>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Forme juridique</p>
                <p className="font-semibold">{entreprise.nature_juridique}</p>
              </div>

              {entreprise.date_creation && (
                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Date de création</p>
                    <p className="font-semibold">
                      {new Date(entreprise.date_creation).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-600" />
              Activité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entreprise.activite_principale && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Code APE</p>
                <p className="font-mono font-semibold">{entreprise.activite_principale}</p>
              </div>
            )}

            {entreprise.section_activite_principale && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Secteur d'activité</p>
                <p className="font-semibold">{entreprise.section_activite_principale}</p>
              </div>
            )}

            {profil.analyse && (
              <div className={`p-3 rounded-lg border ${
                profil.analyse.risqueSectoriel === 'faible' ? 'bg-green-50 border-green-200' :
                profil.analyse.risqueSectoriel === 'moyen' ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200'
              }`}>
                <p className="text-xs uppercase mb-1">Risque sectoriel</p>
                <div className="flex items-center gap-2">
                  <Badge className={
                    profil.analyse.risqueSectoriel === 'faible' ? 'bg-green-100 text-green-800' :
                    profil.analyse.risqueSectoriel === 'moyen' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {profil.analyse.risqueSectoriel.toUpperCase()}
                  </Badge>
                  <span className="text-sm">{profil.analyse.secteur}</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Employeur</p>
              <p className="font-semibold">
                {entreprise.caractere_employeur === 'O' ? 'Oui' : 'Non'}
              </p>
            </div>

            {entreprise.nombre_etablissements && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Établissements</p>
                <p className="font-semibold">{entreprise.nombre_etablissements} établissement(s)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adresse siège */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Siège social
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entreprise.siege && (
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold">
                    {[
                      entreprise.siege.numero_voie,
                      entreprise.siege.type_voie,
                      entreprise.siege.libelle_voie
                    ].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-gray-600">
                    {entreprise.siege.code_postal} {entreprise.siege.libelle_commune}
                  </p>
                  {entreprise.siege.departement && (
                    <p className="text-sm text-gray-500 mt-1">
                      {entreprise.siege.departement} - {entreprise.siege.region}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dirigeants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Dirigeants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entreprise.dirigeants && entreprise.dirigeants.length > 0 ? (
              <div className="space-y-3">
                {entreprise.dirigeants.map((dirigeant, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {dirigeant.type_dirigeant === 'personne physique' 
                            ? `${dirigeant.prenoms} ${dirigeant.nom}`
                            : dirigeant.denomination}
                        </p>
                        <p className="text-sm text-gray-600">{dirigeant.qualite}</p>
                        {dirigeant.type_dirigeant === 'personne physique' && dirigeant.nationalite && (
                          <p className="text-xs text-gray-500">{dirigeant.nationalite}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun dirigeant renseigné</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Données financières */}
      {entreprise.finances && Object.keys(entreprise.finances).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="w-5 h-5 text-green-600" />
              Données financières
            </CardTitle>
            <CardDescription>
              Chiffre d'affaires et résultats publiés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Année</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Chiffre d'affaires</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Résultat net</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(entreprise.finances)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .slice(0, 5)
                    .map(([annee, data]) => {
                      const marge = data.ca && data.resultat_net 
                        ? ((data.resultat_net / data.ca) * 100).toFixed(1)
                        : null
                      return (
                        <tr key={annee} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3 font-medium">{annee}</td>
                          <td className="py-3 px-3 text-right font-mono">
                            {data.ca 
                              ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.ca)
                              : '-'}
                          </td>
                          <td className={`py-3 px-3 text-right font-mono ${
                            data.resultat_net && data.resultat_net < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {data.resultat_net
                              ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.resultat_net)
                              : '-'}
                          </td>
                          <td className={`py-3 px-3 text-right ${
                            marge && parseFloat(marge) < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {marge ? `${marge}%` : '-'}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labels et certifications */}
      {profil.labels && profil.labels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Labels & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profil.labels.map((label, idx) => (
                <Badge key={idx} className="bg-amber-100 text-amber-800 px-3 py-1">
                  <Award className="w-3 h-3 mr-1" />
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TabFicheEntreprise
