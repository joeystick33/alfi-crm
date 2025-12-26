'use client'

/**
 * TabDiagnostic - Diagnostic financier et social de l'entreprise
 * 
 * Collecte et affiche les données clés pour l'analyse :
 * - Chiffre d'affaires
 * - Effectifs et masse salariale
 * - Résultat et rentabilité
 * - Indicateurs sociaux
 * - Convention collective et obligations
 * - Scoring commercial
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import {
  BarChart3,
  Euro,
  Users,
  TrendingUp,
  TrendingDown,
  Calculator,
  Edit,
  Save,
  X,
  PiggyBank,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Info,
  Shield,
  FileText,
  Zap,
  Target,
} from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'
import {
  genererProfilSocial,
  type ProfilSocialComplet
} from '@/lib/services/entreprise/conventions'
import { cn } from '@/app/_common/lib/utils'

interface DiagnosticData {
  // Données financières
  chiffreAffaires: number | null
  resultatNet: number | null
  capitauxPropres: number | null

  // Données sociales
  effectifTotal: number | null
  effectifCadres: number | null
  effectifNonCadres: number | null
  masseSalarialeBrute: number | null

  // Données contractuelles existantes
  hasPEE: boolean
  hasPERCO: boolean
  hasPERCollectif: boolean
  hasInteressement: boolean
  hasParticipation: boolean
  hasMutuelle: boolean
  hasPrevoyance: boolean
  hasRetraiteCollective: boolean

  // Notes
  notes: string
}

interface TabDiagnosticProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function TabDiagnostic({ clientId, client }: TabDiagnosticProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Extraire les données existantes du client professionnel
  const clientPro = client as Record<string, unknown>

  // Récupérer les contrats pour détecter les dispositifs existants
  const contrats = (client.contrats || []) as Array<Record<string, unknown>>
  const hasContratType = (types: string[]) => contrats.some(c => types.includes(String(c.type || '').toUpperCase()))

  // Données du diagnostic - pré-remplies depuis les données client
  const [data, setData] = useState<DiagnosticData>({
    // Données financières depuis le client
    chiffreAffaires: Number(client.annualRevenue) || Number(clientPro.chiffreAffaires) || null,
    resultatNet: Number(clientPro.resultatNet) || Number(clientPro.netIncome) || null,
    capitauxPropres: Number(clientPro.capitauxPropres) || Number(clientPro.equity) || null,

    // Données sociales depuis le client
    effectifTotal: Number(client.numberOfEmployees) || Number(clientPro.effectif) || null,
    effectifCadres: Number(clientPro.effectifCadres) || null,
    effectifNonCadres: Number(clientPro.effectifNonCadres) || null,
    masseSalarialeBrute: Number(clientPro.masseSalariale) || Number(clientPro.payroll) || null,

    // Dispositifs existants - détectés depuis les contrats
    hasPEE: hasContratType(['PEE', 'PEG']),
    hasPERCO: hasContratType(['PERCO', 'PERECO']),
    hasPERCollectif: hasContratType(['PER_COLLECTIF', 'PERE']),
    hasInteressement: hasContratType(['INTERESSEMENT']),
    hasParticipation: hasContratType(['PARTICIPATION']),
    hasMutuelle: hasContratType(['MUTUELLE', 'MUTUELLE_COLLECTIVE', 'HEALTH_INSURANCE']),
    hasPrevoyance: hasContratType(['PREVOYANCE', 'PREVOYANCE_COLLECTIVE']),
    hasRetraiteCollective: hasContratType(['ARTICLE_83', 'RETRAITE_COLLECTIVE']),

    notes: String(clientPro.diagnosticNotes || clientPro.notes || ''),
  })

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Sauvegarder via API
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    setIsEditing(false)
    toast({ title: 'Diagnostic sauvegardé' })
  }

  // Calculs automatiques
  const salaireMoyenBrut = data.effectifTotal && data.masseSalarialeBrute
    ? data.masseSalarialeBrute / data.effectifTotal / 12
    : null

  const margeNette = data.chiffreAffaires && data.resultatNet
    ? (data.resultatNet / data.chiffreAffaires) * 100
    : null

  // Score d'équipement
  const equipements = [
    data.hasPEE,
    data.hasPERCO || data.hasPERCollectif,
    data.hasInteressement,
    data.hasParticipation,
    data.hasMutuelle,
    data.hasPrevoyance,
    data.hasRetraiteCollective,
  ]
  const scoreEquipement = equipements.filter(Boolean).length
  const scoreEquipementPct = Math.round((scoreEquipement / equipements.length) * 100)

  // Analyse des obligations sociales via le service conventions
  const profilSocial = useMemo<ProfilSocialComplet | null>(() => {
    // Récupérer le code NAF du client (à adapter selon votre modèle de données)
    const codeNAF = (client as unknown as { codeNAF?: string })?.codeNAF ||
      (client as unknown as { activite_principale?: string })?.activite_principale ||
      '62.01Z' // fallback pour test

    const effectif = data.effectifTotal || 0

    if (!codeNAF) return null

    return genererProfilSocial(codeNAF, effectif, {
      hasPrevoyance: data.hasPrevoyance,
      hasMutuelle: data.hasMutuelle,
      hasEpargneSalariale: data.hasPEE || data.hasPERCO || data.hasPERCollectif || data.hasParticipation,
      hasRetraite: data.hasRetraiteCollective
    })
  }, [client, data.effectifTotal, data.hasPrevoyance, data.hasMutuelle, data.hasPEE, data.hasPERCO, data.hasPERCollectif, data.hasParticipation, data.hasRetraiteCollective])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Diagnostic</h2>
            <p className="text-sm text-gray-500">Analyse financière et sociale de l'entreprise</p>
          </div>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        )}
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Chiffre d'affaires</span>
              <Euro className="w-5 h-5 text-gray-400" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={data.chiffreAffaires || ''}
                onChange={(e) => setData({ ...data, chiffreAffaires: e.target.value ? Number(e.target.value) : null })}
                placeholder="CA annuel"
                className="mt-2"
              />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.chiffreAffaires)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Résultat net</span>
              {data.resultatNet !== null && data.resultatNet >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={data.resultatNet || ''}
                onChange={(e) => setData({ ...data, resultatNet: e.target.value ? Number(e.target.value) : null })}
                placeholder="Résultat"
                className="mt-2"
              />
            ) : (
              <p className={`text-2xl font-bold ${data.resultatNet !== null && data.resultatNet < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(data.resultatNet)}
              </p>
            )}
            {margeNette !== null && (
              <p className="text-sm text-gray-500">Marge: {margeNette.toFixed(1)}%</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Effectif total</span>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={data.effectifTotal || ''}
                onChange={(e) => setData({ ...data, effectifTotal: e.target.value ? Number(e.target.value) : null })}
                placeholder="Nb salariés"
                className="mt-2"
              />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {data.effectifTotal !== null ? data.effectifTotal : '-'}
              </p>
            )}
            {data.effectifTotal !== null && (
              <p className="text-sm text-gray-500">salariés</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Masse salariale</span>
              <Calculator className="w-5 h-5 text-gray-400" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={data.masseSalarialeBrute || ''}
                onChange={(e) => setData({ ...data, masseSalarialeBrute: e.target.value ? Number(e.target.value) : null })}
                placeholder="Masse salariale brute"
                className="mt-2"
              />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.masseSalarialeBrute)}
              </p>
            )}
            {salaireMoyenBrut !== null && (
              <p className="text-sm text-gray-500">
                Moy: {formatCurrency(salaireMoyenBrut)}/mois
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Détail effectifs */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Détail des effectifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Cadres</label>
                <Input
                  type="number"
                  value={data.effectifCadres || ''}
                  onChange={(e) => setData({ ...data, effectifCadres: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Nombre de cadres"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Non-cadres</label>
                <Input
                  type="number"
                  value={data.effectifNonCadres || ''}
                  onChange={(e) => setData({ ...data, effectifNonCadres: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Nombre de non-cadres"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Équipements existants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#7373FF]" />
                Dispositifs en place
              </CardTitle>
              <CardDescription>
                Équipements sociaux actuels de l'entreprise
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{scoreEquipement}/7</div>
              <Badge className={
                scoreEquipementPct >= 70 ? 'bg-green-100 text-green-800' :
                  scoreEquipementPct >= 40 ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
              }>
                {scoreEquipementPct}% équipé
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Épargne salariale */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-green-600" />
                Épargne salariale
              </h4>
              <div className="space-y-2">
                {[
                  { key: 'hasPEE', label: 'PEE' },
                  { key: 'hasPERCO', label: 'PERCO' },
                  { key: 'hasPERCollectif', label: 'PER Collectif' },
                  { key: 'hasInteressement', label: 'Intéressement' },
                  { key: 'hasParticipation', label: 'Participation' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data[item.key as keyof DiagnosticData] as boolean}
                      onChange={(e) => setData({ ...data, [item.key]: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300"
                    />
                    <span className={data[item.key as keyof DiagnosticData] ? 'text-gray-900' : 'text-gray-500'}>
                      {item.label}
                    </span>
                    {data[item.key as keyof DiagnosticData] ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-300 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Protection sociale */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Protection sociale
              </h4>
              <div className="space-y-2">
                {[
                  { key: 'hasMutuelle', label: 'Mutuelle collective' },
                  { key: 'hasPrevoyance', label: 'Prévoyance collective' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data[item.key as keyof DiagnosticData] as boolean}
                      onChange={(e) => setData({ ...data, [item.key]: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300"
                    />
                    <span className={data[item.key as keyof DiagnosticData] ? 'text-gray-900' : 'text-gray-500'}>
                      {item.label}
                    </span>
                    {data[item.key as keyof DiagnosticData] ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-300 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Retraite */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-600" />
                Retraite
              </h4>
              <div className="space-y-2">
                {[
                  { key: 'hasRetraiteCollective', label: 'Retraite supplémentaire' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data[item.key as keyof DiagnosticData] as boolean}
                      onChange={(e) => setData({ ...data, [item.key]: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300"
                    />
                    <span className={data[item.key as keyof DiagnosticData] ? 'text-gray-900' : 'text-gray-500'}>
                      {item.label}
                    </span>
                    {data[item.key as keyof DiagnosticData] ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-300 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Convention collective et obligations */}
      {profilSocial && (
        <Card className="border-[#7373FF]/30 bg-[#7373FF]/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <FileText className="w-5 h-5" />
                Convention & Obligations
              </CardTitle>
              {profilSocial.convention && (
                <Badge className="bg-[#7373FF]/15 text-indigo-800">
                  IDCC {profilSocial.convention.idcc}
                </Badge>
              )}
            </div>
            {profilSocial.convention && (
              <CardDescription className="text-[#5c5ce6]">
                {profilSocial.convention.titreCourt} - {profilSocial.convention.titre.substring(0, 80)}...
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {/* Prévoyance */}
              <div className={`p-4 rounded-lg border ${profilSocial.obligations.prevoyance.obligatoire
                ? 'bg-white border-[#7373FF]/30'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#7373FF]" />
                  <span className="font-medium">Prévoyance</span>
                </div>
                <Badge className={profilSocial.obligations.prevoyance.niveau === 'conventionnel'
                  ? 'bg-[#7373FF]/15 text-indigo-800'
                  : profilSocial.obligations.prevoyance.niveau === 'legal'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }>
                  {profilSocial.obligations.prevoyance.niveau.toUpperCase()}
                </Badge>
                <p className="text-xs text-gray-600 mt-2">
                  {profilSocial.obligations.prevoyance.description.substring(0, 60)}...
                </p>
              </div>

              {/* Santé */}
              <div className="p-4 rounded-lg bg-white border border-[#7373FF]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Mutuelle</span>
                </div>
                <Badge className="bg-red-100 text-red-800">OBLIGATOIRE</Badge>
                <p className="text-xs text-gray-600 mt-2">
                  ANI 2016 - Panier minimum obligatoire
                </p>
              </div>

              {/* Épargne */}
              <div className={`p-4 rounded-lg border ${profilSocial.obligations.epargneSalariale.obligatoire
                ? 'bg-white border-amber-200'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Épargne</span>
                </div>
                <Badge className={profilSocial.obligations.epargneSalariale.obligatoire
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-600'
                }>
                  {profilSocial.obligations.epargneSalariale.obligatoire ? 'OBLIGATOIRE' : 'FACULTATIF'}
                </Badge>
                <p className="text-xs text-gray-600 mt-2">
                  {profilSocial.obligations.epargneSalariale.description.substring(0, 60)}...
                </p>
              </div>

              {/* Retraite */}
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Retraite sup.</span>
                </div>
                <Badge className="bg-gray-100 text-gray-600">FACULTATIF</Badge>
                <p className="text-xs text-gray-600 mt-2">
                  PER Collectif ou Article 83
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score commercial et opportunités - Version Épurée */}
      {profilSocial && (
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">Analyse commerciale</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    {profilSocial.analyse.pitch}
                  </CardDescription>
                </div>
              </div>

              {/* Score Discret */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-500">Score opportunité</div>
                  <div className={cn(
                    "text-lg font-bold tabular-nums",
                    profilSocial.analyse.qualification === 'HOT' ? 'text-emerald-600' :
                      profilSocial.analyse.qualification === 'WARM' ? 'text-amber-600' :
                        'text-slate-600'
                  )}>
                    {profilSocial.analyse.score}/100
                  </div>
                </div>
                <div className={cn(
                  "h-10 w-1 rounded-full",
                  profilSocial.analyse.qualification === 'HOT' ? 'bg-emerald-500' :
                    profilSocial.analyse.qualification === 'WARM' ? 'bg-amber-500' :
                      'bg-slate-300'
                )} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

              {/* Colonne Alertes */}
              <div className="p-5 space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  Points de vigilance
                </h4>

                {profilSocial.analyse.alertes.length > 0 ? (
                  <div className="space-y-3">
                    {profilSocial.analyse.alertes.map((alerte, idx) => (
                      <div key={idx} className="flex gap-3 items-start group">
                        <div className={cn(
                          "mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0",
                          alerte.niveau === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-amber-500'
                        )} />
                        <div>
                          <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                            {alerte.titre}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {alerte.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Aucune alerte détectée.</p>
                )}
              </div>

              {/* Colonne Opportunités */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Opportunités ({profilSocial.analyse.opportunites.length})
                  </h4>
                </div>

                <div className="space-y-3">
                  {profilSocial.analyse.opportunites.map((opp, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="p-1.5 bg-white border border-slate-100 rounded shadow-sm text-indigo-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-medium text-slate-700 truncate">{opp.titre}</p>
                          {opp.potentielEstime && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {formatCurrency(opp.potentielEstime)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {opp.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunités classiques (fallback si pas de profil social) */}
      {!profilSocial && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Info className="w-5 h-5" />
              Opportunités détectées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!data.hasPEE && !data.hasPERCollectif && (
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <p className="font-medium text-gray-900">Épargne salariale</p>
                  <p className="text-sm text-gray-600">
                    L'entreprise ne dispose pas de PEE ni de PER Collectif.
                    Opportunité de mise en place avec avantages fiscaux et sociaux.
                  </p>
                </div>
              )}
              {!data.hasInteressement && data.effectifTotal !== null && data.effectifTotal > 0 && (
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <p className="font-medium text-gray-900">Intéressement</p>
                  <p className="text-sm text-gray-600">
                    Pas d'accord d'intéressement. Possibilité de motiver les salariés
                    avec une prime défiscalisée.
                  </p>
                </div>
              )}
              {data.hasMutuelle && !data.hasPrevoyance && (
                <div className="p-3 bg-white rounded-lg border border-amber-200">
                  <p className="font-medium text-gray-900">Prévoyance collective</p>
                  <p className="text-sm text-gray-600">
                    Mutuelle en place mais pas de prévoyance.
                    Protection incomplète des salariés.
                  </p>
                </div>
              )}
              {scoreEquipement >= 6 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-800">Entreprise bien équipée</p>
                  <p className="text-sm text-green-600">
                    Cette entreprise dispose déjà de la plupart des dispositifs.
                    Rechercher des optimisations ou renouvellements.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="Notes sur le diagnostic, points d'attention, historique..."
              className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-600 whitespace-pre-wrap">
              {data.notes || 'Aucune note'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TabDiagnostic
