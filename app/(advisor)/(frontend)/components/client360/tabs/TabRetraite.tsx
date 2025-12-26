 
'use client'

/**
 * TabRetraite - Simulation et analyse de la retraite
 * Visualisation premium style Finary
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Slider } from '@/app/_common/components/ui/Slider'
import { formatCurrency } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Clock, TrendingUp, Target, Calendar, PiggyBank, AlertTriangle, CheckCircle, ChevronRight,
  Wallet, Building2, Settings, Sparkles, Shield
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { KPICard } from '../../charts'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface TabRetraiteProps {
  clientId: string
  client: ClientDetail
}

interface RetraiteSimulation {
  // Informations client
  ageActuel: number
  ageDepart: number
  anneesRestantes: number
  
  // Revenus actuels
  revenuActuelMensuel: number
  revenuActuelAnnuel: number
  
  // Projections retraite
  pensionEstimee: number
  pensionPrivee: number
  revenuComplémentaire: number
  totalRetraite: number
  
  // Taux de remplacement
  tauxRemplacement: number
  tauxRemplacementCible: number
  ecartMensuel: number
  
  // Capital
  capitalActuel: number
  capitalCible: number
  capitalManquant: number
  effortEpargneMensuel: number
  
  // Projection année par année
  projection: ProjectionAnnuelle[]
}

interface ProjectionAnnuelle {
  annee: number
  age: number
  capitalDebut: number
  versements: number
  rendement: number
  capitalFin: number
  revenus?: number
  phase: 'CONSTITUTION' | 'RETRAITE'
}

// Paramètres de simulation par défaut
const DEFAULT_PARAMS = {
  ageDepart: 65,
  tauxRendement: 4, // %
  inflation: 2, // %
  tauxRemplacementCible: 70, // %
  esperanceVie: 85,
}

export function TabRetraite({ clientId, client }: TabRetraiteProps) {
  const { toast: _toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Paramètres de simulation
  const [params, setParams] = useState({
    ageDepart: DEFAULT_PARAMS.ageDepart,
    tauxRendement: DEFAULT_PARAMS.tauxRendement,
    tauxRemplacementCible: DEFAULT_PARAMS.tauxRemplacementCible,
    esperanceVie: DEFAULT_PARAMS.esperanceVie,
    versementMensuel: 0,
  })

  // Données du client
  const [clientData, setClientData] = useState({
    revenus: 0,
    capital: 0,
    contrats: [] as { type: string; currentValue?: number; monthlyIncome?: number }[],
  })

  // Charger les données du client
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [revenusRes, actifsRes, contratsRes] = await Promise.all([
          fetch(`/api/advisor/clients/${clientId}/revenues`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/advisor/clients/${clientId}/actifs`).then(r => r.json()).catch(() => ({ data: { actifs: [] } })),
          fetch(`/api/advisor/clients/${clientId}/contrats/data`).then(r => r.json()).catch(() => ({ data: [] })),
        ])

        const revenus = Array.isArray(revenusRes?.data) ? revenusRes.data : []
        const actifs = Array.isArray(actifsRes?.data?.actifs) ? actifsRes.data.actifs : (Array.isArray(actifsRes?.data) ? actifsRes.data : [])
        const contratsPayload = contratsRes?.data ?? contratsRes

        const contractsRaw =
          (Array.isArray(contratsPayload?.contracts) ? contratsPayload.contracts : null) ||
          (Array.isArray(contratsPayload?.contrats) ? contratsPayload.contrats : null) ||
          []

        const contrats = contractsRaw.map((c: { type?: string; value?: number }) => ({
          type: c.type || '',
          currentValue: Number(c.value || 0),
          monthlyIncome: 0,
        }))

        // Calculer les revenus mensuels totaux
        const revenusMensuels = revenus.reduce((sum: number, r: { montant?: number; frequence?: string }) => {
          const montant = Number(r.montant || 0)
          if (r.frequence === 'ANNUEL') return sum + montant / 12
          return sum + montant
        }, 0)

        // Calculer le capital (actifs financiers + épargne retraite)
        const capitalFinancier = actifs
          .filter((a: { type?: string }) => a.type === 'FINANCIER')
          .reduce((sum: number, a: { value?: number }) => sum + Number(a.value || 0), 0)

        // Contrats retraite spécifiques
        const contratsRetraite = contrats.filter((c: { type?: string }) => 
          ['PER', 'MADELIN'].includes(c.type || '')
        )
        const capitalRetraite = contratsRetraite.reduce((sum: number, c: { currentValue?: number }) => 
          sum + Number(c.currentValue || 0), 0
        )

        setClientData({
          revenus: revenusMensuels,
          capital: capitalFinancier + capitalRetraite,
          contrats: contratsRetraite,
        })
      } catch (error) {
        console.error('Erreur chargement données retraite:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  // Calcul de l'âge actuel
  const ageActuel = useMemo(() => {
    if (!client.dateOfBirth) return 45 // Défaut
    const birth = new Date(client.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }, [client.dateOfBirth])

  // Simulation complète
  const simulation = useMemo((): RetraiteSimulation => {
    const anneesRestantes = Math.max(0, params.ageDepart - ageActuel)
    const anneesPhasesRetraite = params.esperanceVie - params.ageDepart
    
    // Revenus
    const revenuActuelMensuel = clientData.revenus
    const revenuActuelAnnuel = revenuActuelMensuel * 12
    
    // Estimation pension (simplifiée - 50% du revenu)
    const pensionEstimee = revenuActuelMensuel * 0.5
    const pensionPrivee = clientData.contrats.reduce((sum, c) => sum + Number(c.monthlyIncome || 0), 0)
    const revenuComplémentaire = params.versementMensuel > 0 ? params.versementMensuel * 0.3 : 0 // Approximation
    const totalRetraite = pensionEstimee + pensionPrivee + revenuComplémentaire
    
    // Taux de remplacement
    const tauxRemplacement = revenuActuelMensuel > 0 ? (totalRetraite / revenuActuelMensuel) * 100 : 0
    const ecartMensuel = revenuActuelMensuel * (params.tauxRemplacementCible / 100) - totalRetraite
    
    // Capital cible pour générer le complément manquant
    // Règle des 4% : capital nécessaire = revenus annuels souhaités / 0.04
    const revenutAnnuelCible = revenuActuelAnnuel * (params.tauxRemplacementCible / 100)
    const capitalCible = (revenutAnnuelCible - (pensionEstimee * 12)) / 0.04
    const capitalManquant = Math.max(0, capitalCible - clientData.capital)
    
    // Effort d'épargne mensuel pour atteindre l'objectif
    // Formule: PMT = FV * r / ((1+r)^n - 1)
    const r = params.tauxRendement / 100 / 12
    const n = anneesRestantes * 12
    let effortEpargneMensuel = 0
    if (n > 0 && capitalManquant > 0) {
      effortEpargneMensuel = capitalManquant * r / (Math.pow(1 + r, n) - 1)
    }

    // Projection année par année
    const projection: ProjectionAnnuelle[] = []
    let capital = clientData.capital
    const versementAnnuel = params.versementMensuel * 12
    const rendementAnnuel = params.tauxRendement / 100

    // Phase de constitution
    for (let i = 0; i <= anneesRestantes; i++) {
      const age = ageActuel + i
      const capitalDebut = capital
      const versements = i > 0 ? versementAnnuel : 0
      const rendement = (capitalDebut + versements / 2) * rendementAnnuel
      capital = capitalDebut + versements + rendement

      projection.push({
        annee: new Date().getFullYear() + i,
        age,
        capitalDebut: Math.round(capitalDebut),
        versements: Math.round(versements),
        rendement: Math.round(rendement),
        capitalFin: Math.round(capital),
        phase: 'CONSTITUTION',
      })
    }

    // Phase de retraite (décumulation)
    const retraitAnnuel = totalRetraite * 12 * 0.3 // 30% du capital consommé annuellement
    for (let i = 1; i <= Math.min(anneesPhasesRetraite, 20); i++) {
      const age = params.ageDepart + i
      const capitalDebut = capital
      const rendement = capitalDebut * rendementAnnuel * 0.6 // Rendement plus conservateur
      capital = Math.max(0, capitalDebut + rendement - retraitAnnuel)

      projection.push({
        annee: new Date().getFullYear() + anneesRestantes + i,
        age,
        capitalDebut: Math.round(capitalDebut),
        versements: -Math.round(retraitAnnuel),
        rendement: Math.round(rendement),
        capitalFin: Math.round(capital),
        revenus: Math.round(totalRetraite),
        phase: 'RETRAITE',
      })
    }

    return {
      ageActuel,
      ageDepart: params.ageDepart,
      anneesRestantes,
      revenuActuelMensuel,
      revenuActuelAnnuel,
      pensionEstimee,
      pensionPrivee,
      revenuComplémentaire,
      totalRetraite,
      tauxRemplacement,
      tauxRemplacementCible: params.tauxRemplacementCible,
      ecartMensuel: Math.max(0, ecartMensuel),
      capitalActuel: clientData.capital,
      capitalCible,
      capitalManquant,
      effortEpargneMensuel,
      projection,
    }
  }, [ageActuel, clientData, params])

  // Statut du taux de remplacement
  const replacementStatus = useMemo(() => {
    if (simulation.tauxRemplacement >= simulation.tauxRemplacementCible) return 'success'
    if (simulation.tauxRemplacement >= simulation.tauxRemplacementCible * 0.8) return 'warning'
    return 'danger'
  }, [simulation])

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 min-w-[200px]">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {data.annee} • {data.age} ans
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Capital</span>
              <span className="font-semibold">{formatCurrency(data.capitalFin)}</span>
            </div>
            {data.versements !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{data.versements > 0 ? 'Versements' : 'Retraits'}</span>
                <span className={data.versements > 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(Math.abs(data.versements))}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rendement</span>
              <span className="text-emerald-600">+{formatCurrency(data.rendement)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <Badge variant={data.phase === 'CONSTITUTION' ? 'default' : 'secondary'}>
              {data.phase === 'CONSTITUTION' ? 'Constitution' : 'Retraite'}
            </Badge>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Simulation Retraite
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Projection et analyse de votre situation à la retraite
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Paramètres (collapsible) */}
      {showSettings && (
        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres de simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Âge de départ</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.ageDepart]}
                    onValueChange={([v]) => setParams(p => ({ ...p, ageDepart: v }))}
                    min={55}
                    max={70}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-12">{params.ageDepart} ans</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Taux de rendement (%)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.tauxRendement]}
                    onValueChange={([v]) => setParams(p => ({ ...p, tauxRendement: v }))}
                    min={1}
                    max={8}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-12">{params.tauxRendement}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Taux de remplacement cible (%)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[params.tauxRemplacementCible]}
                    onValueChange={([v]) => setParams(p => ({ ...p, tauxRemplacementCible: v }))}
                    min={50}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-12">{params.tauxRemplacementCible}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Versement mensuel</Label>
                <Input
                  type="number"
                  value={params.versementMensuel}
                  onChange={(e) => setParams(p => ({ ...p, versementMensuel: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Âge actuel"
          value={simulation.ageActuel}
          format="number"
          suffix=" ans"
          icon={<Calendar className="h-5 w-5" />}
          colorScheme="blue"
          description={`Départ prévu à ${params.ageDepart} ans`}
          trendLabel={`${simulation.anneesRestantes} ans restants`}
        />
        <KPICard
          title="Capital retraite"
          value={simulation.capitalActuel}
          format="currency"
          icon={<PiggyBank className="h-5 w-5" />}
          colorScheme="green"
          description="Épargne retraite actuelle"
          trendValue={simulation.capitalActuel > 0 ? 12 : 0}
          trendLabel="vs année précédente"
        />
        <KPICard
          title="Taux de remplacement"
          value={simulation.tauxRemplacement}
          format="percent"
          icon={<Target className="h-5 w-5" />}
          colorScheme={replacementStatus === 'success' ? 'green' : replacementStatus === 'warning' ? 'amber' : 'rose'}
          description={`Cible: ${params.tauxRemplacementCible}%`}
          trend={simulation.tauxRemplacement >= simulation.tauxRemplacementCible ? 'up' : 'down'}
        />
        <KPICard
          title="Revenus à la retraite"
          value={simulation.totalRetraite}
          format="currency"
          suffix="/mois"
          icon={<Wallet className="h-5 w-5" />}
          colorScheme="purple"
          description="Estimation mensuelle"
        />
      </div>

      {/* Graphique de projection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Projection du capital
              </CardTitle>
              <CardDescription>
                Évolution de votre patrimoine retraite jusqu'à {params.esperanceVie} ans
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                Constitution
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Retraite
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 min-w-[320px]">
            <ResponsiveContainer width={320} height={320}>
              <AreaChart data={simulation.projection}>
                <defs>
                  <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="age" 
                  tickFormatter={(v) => `${v} ans`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M€` : `${(v/1000).toFixed(0)}k€`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  x={params.ageDepart} 
                  stroke="#F59E0B" 
                  strokeDasharray="5 5"
                  label={{ value: 'Départ retraite', position: 'top', fill: '#F59E0B' }}
                />
                {simulation.capitalCible > 0 && (
                  <ReferenceLine 
                    y={simulation.capitalCible} 
                    stroke="#3B82F6" 
                    strokeDasharray="5 5"
                    label={{ value: 'Objectif', position: 'right', fill: '#3B82F6' }}
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="capitalFin" 
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#capitalGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Détail des revenus */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenus actuels vs retraite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Comparaison des revenus
            </CardTitle>
            <CardDescription>Revenus actuels vs revenus à la retraite</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenus actuels */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Revenus actuels</span>
                <span className="text-xl font-bold text-blue-900">
                  {formatCurrency(simulation.revenuActuelMensuel)}/mois
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            {/* Revenus retraite */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Revenus estimés retraite</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(simulation.totalRetraite)}/mois
                </span>
              </div>
              <Progress 
                value={simulation.tauxRemplacement} 
                className="h-2"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Taux de remplacement: {simulation.tauxRemplacement.toFixed(1)}%</span>
                <span>Cible: {params.tauxRemplacementCible}%</span>
              </div>
            </div>

            {/* Décomposition */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Décomposition des revenus retraite</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Pension de base (CNAV)</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(simulation.pensionEstimee)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Retraite complémentaire</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(simulation.pensionPrivee)}</span>
                </div>
                {simulation.revenuComplémentaire > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Épargne personnelle</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(simulation.revenuComplémentaire)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommandations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Recommandations
            </CardTitle>
            <CardDescription>Actions pour optimiser votre retraite</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Écart à combler */}
            {simulation.ecartMensuel > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Écart à combler</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Il manque <span className="font-bold">{formatCurrency(simulation.ecartMensuel)}/mois</span> pour 
                      atteindre votre objectif de {params.tauxRemplacementCible}% de remplacement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Effort d'épargne */}
            {simulation.effortEpargneMensuel > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <PiggyBank className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Effort d'épargne recommandé</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Épargnez <span className="font-bold">{formatCurrency(simulation.effortEpargneMensuel)}/mois</span> pour 
                      atteindre un capital de {formatCurrency(simulation.capitalCible)} à {params.ageDepart} ans.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contrats existants */}
            {clientData.contrats.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Contrats retraite actifs</p>
                    <p className="text-sm text-green-700 mt-1">
                      Vous disposez de {clientData.contrats.length} contrat(s) d'épargne retraite.
                    </p>
                    <div className="mt-2 space-y-1">
                      {clientData.contrats.slice(0, 3).map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <span>{c.name || c.type}</span>
                          <span className="font-medium">{formatCurrency(c.currentValue || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button className="w-full justify-between" variant="outline">
                Ouvrir un PER
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button className="w-full justify-between" variant="outline">
                Simuler un versement
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button className="w-full justify-between" variant="outline">
                Optimiser fiscalement
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TabRetraite
