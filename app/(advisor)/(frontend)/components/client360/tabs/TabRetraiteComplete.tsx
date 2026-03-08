'use client'

/**
 * TabRetraiteComplete - Simulation Retraite Complète
 * Utilise le simulateur /api/advisor/simulators/retirement/pension
 * Calcule: Pension de base + Pension complémentaire (AGIRC-ARRCO, etc.)
 * Design sobre et professionnel (gris + indigo #7373FF)
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatCurrency } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Clock, TrendingUp, Target, Calendar, PiggyBank, AlertTriangle, CheckCircle,
  Wallet, Building2, Settings, Sparkles, Shield, RefreshCw, Loader2, 
  BarChart3, Calculator, Info, Users, Briefcase, GraduationCap
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from 'recharts'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface TabRetraiteCompleteProps {
  clientId: string
  client: ClientDetail
}

// Types pour la réponse du simulateur de pension
interface PensionResult {
  // Paramètres
  regime: string
  birthYear: number
  yearsWorked: number
  currentAge: number
  retirementAge: number
  fullRateAge: number
  legalRetirementAge: number
  
  // Trimestres
  quartersAlreadyValidated: number
  futureQuarters: number
  quartersValidated: number
  quartersRequired: number
  missingQuarters: number
  yearsUntilRetirement: number
  proratisationCoef: number
  
  // Taux
  pensionRate: number
  hasDiscount: boolean
  discountRate: number
  discountQuarters: number
  hasBonus: boolean
  bonusRate: number
  bonusQuarters: number
  
  // Salaires
  averageSalary: number
  referenceSalary: number
  salaryExceedsPASS: boolean
  passCurrent: number
  
  // Pensions
  monthlyBasePension: number
  monthlyComplementaryPension: number
  monthlyPension: number
  annualPension: number
  
  // Répartition
  basePercentage: number
  complementaryPercentage: number
  
  // Complémentaire détaillée
  complementaryDetails: {
    regime: string
    nomRegime: string
    points: {
      existants: number
      projetes: number
      gratuits: number
      total: number
    }
    valeurPoint: number
    coefficients: {
      solidarite: { valeur: number; explication: string; dureeAnnees: number }
      majorationFamille: number
      surcote: number
      decote: number
      total: number
    }
    pensionAnnuelleBrute: number
    pensionMensuelleBrute: number
  }
  
  // Indicateurs
  replacementRate: number
  replacementRatePercent: number
  
  // Recommandations
  recommendations: Array<{
    priorite: 'haute' | 'moyenne' | 'basse'
    type: string
    description: string
  }>
  
  // Projection par âge
  projectionByAge: Array<{
    age: number
    quartersAtAge: number
    missingAtAge: number
    pensionRate: number
    hasDiscount: boolean
    discountPercent: number
    hasBonus: boolean
    bonusPercent: number
    monthlyPension: number
    annualPension: number
    replacementRatePercent: number
    vsBaseline: number
  }>
  optimalAge: number
}

// Régimes disponibles
const REGIMES = [
  { value: 'general', label: 'Régime général (salarié privé)' },
  { value: 'public', label: 'Fonction publique' },
  { value: 'independent', label: 'Indépendant / TNS' },
  { value: 'agricultural', label: 'Agricole (MSA)' },
  { value: 'multiple', label: 'Poly-pensionné (plusieurs régimes)' },
]

export function TabRetraiteComplete({ clientId, client }: TabRetraiteCompleteProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('synthese')
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  
  // Résultat de la simulation pension
  const [pensionResult, setPensionResult] = useState<PensionResult | null>(null)
  
  // Calcul de l'âge actuel (doit être avant params)
  const currentAge = useMemo(() => {
    if (!client.dateOfBirth) return 45
    const birth = new Date(client.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }, [client.dateOfBirth])
  
  // Paramètres de simulation - initialiser avec les données client disponibles
  const clientAnnualIncomeInitial = Number(client.annualIncome) || 0
  const clientProfession = String(client.profession || client.occupation || '').toLowerCase()
  const [params, setParams] = useState({
    regime: 'general' as string,
    yearsWorked: Math.max(0, currentAge - 22),
    averageSalary: clientAnnualIncomeInitial,
    retirementAge: 64,
    fullRateAge: 67,
    nombreEnfants: Number(client.numberOfChildren) || 0,
    profession: clientProfession, // Pour le régime complémentaire
  })

  // Charger les données client pour estimer les paramètres
  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      
      // Valeurs par défaut depuis le client directement
      const clientAnnualIncome = Number(client.annualIncome) || 0
      const clientNumberOfChildren = Number(client.numberOfChildren) || 0
      const anneesEstimees = Math.max(0, currentAge - 22)
      
      // Déterminer le régime depuis le client
      let regime = 'general'
      const profession = String(client.profession || client.occupation || '').toLowerCase()
      if (profession.includes('fonctionnaire') || profession.includes('public')) {
        regime = 'public'
      } else if (profession.includes('indépendant') || profession.includes('tns') || profession.includes('libéral')) {
        regime = 'independent'
      } else if (profession.includes('agricole') || profession.includes('exploitant')) {
        regime = 'agricultural'
      }
      
      try {
        const [revenusRes, familyRes] = await Promise.all([
          fetch(`/api/advisor/clients/${clientId}/revenues`).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
          fetch(`/api/advisor/clients/${clientId}`).then(r => r.ok ? r.json() : { data: null }).catch(() => ({ data: null })),
        ])

        const revenus = Array.isArray(revenusRes?.data) ? revenusRes.data : []
        const clientData = familyRes?.data || client

        // Calculer le salaire annuel moyen (revenus professionnels)
        const revenusPro = revenus.filter((r: { category?: string; categorie?: string; type?: string }) => {
          const cat = (r.category || r.categorie || '').toUpperCase()
          return cat === 'SALAIRE' || cat === 'PROFESSIONNEL' || cat.includes('SALAIRE') ||
                 r.type === 'SALAIRE' || r.type === 'SALAIRE_NET' || r.type === 'REMUNERATION_GERANT'
        })
        
        const salaireBrut = revenusPro.reduce((sum: number, r: { montant?: number; amount?: number; frequence?: string; frequency?: string }) => {
          const montant = Number(r.montant || r.amount || 0)
          const freq = (r.frequence || r.frequency || 'MENSUEL').toUpperCase()
          if (freq === 'MENSUEL') return sum + montant * 12
          if (freq === 'TRIMESTRIEL') return sum + montant * 4
          if (freq === 'SEMESTRIEL') return sum + montant * 2
          return sum + montant
        }, 0)
        
        // Compter les enfants
        const familyMembers = clientData?.familyMembers || client.familyMembers || []
        const enfants = familyMembers.filter((m: { relationship?: string; relation?: string }) => {
          const rel = (m.relationship || m.relation || '').toUpperCase()
          return rel.includes('ENFANT') || rel.includes('CHILD')
        }).length

        // Utiliser les données calculées (pas de valeur fictive)
        const finalSalary = salaireBrut > 0 ? salaireBrut : clientAnnualIncome
        const finalEnfants = enfants > 0 ? enfants : clientNumberOfChildren

        setParams(p => ({
          ...p,
          regime,
          yearsWorked: anneesEstimees,
          averageSalary: finalSalary,
          nombreEnfants: finalEnfants,
          profession: profession, // Pour le régime complémentaire
        }))
      } catch (error) {
        console.error('Erreur chargement données retraite:', error)
        // Utiliser les données du client comme fallback (pas de valeur fictive)
        setParams(p => ({
          ...p,
          regime,
          yearsWorked: anneesEstimees,
          averageSalary: clientAnnualIncome,
          nombreEnfants: clientNumberOfChildren,
          profession: profession,
        }))
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId, client, currentAge])

  // Appeler le simulateur de pension backend
  const runPensionSimulation = useCallback(async () => {
    if (params.averageSalary <= 0) return
    
    setSimulating(true)
    try {
      const response = await fetch('/api/advisor/simulators/retirement/pension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regime: params.regime,
          yearsWorked: params.yearsWorked,
          averageSalary: params.averageSalary,
          currentAge,
          retirementAge: params.retirementAge,
          fullRateAge: params.fullRateAge,
          // Paramètres complémentaires identiques au simulateur autonome
          complementary: {
            profession: params.profession || undefined,
            nombreEnfants: params.nombreEnfants,
          }
        })
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        setPensionResult(result.data)
      } else {
        throw new Error(result.error || 'Erreur de simulation')
      }
    } catch (error) {
      console.error('Erreur simulation pension:', error)
      toast({
        title: 'Erreur de simulation',
        description: 'Impossible de calculer la pension. Vérifiez les paramètres.',
        variant: 'destructive'
      })
    } finally {
      setSimulating(false)
    }
  }, [currentAge, params, toast])

  // Lancer la simulation au chargement et lors des changements
  useEffect(() => {
    if (!loading && params.averageSalary > 0) {
      runPensionSimulation()
    }
  }, [loading, params, runPensionSimulation])

  // Tooltip personnalisé pour le graphique de projection
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: PensionResult['projectionByAge'][0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 min-w-[220px]">
          <p className="text-sm font-bold text-gray-900 mb-2">Départ à {data.age} ans</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pension mensuelle</span>
              <span className="font-bold text-[#7373FF]">{formatCurrency(data.monthlyPension)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taux de remplacement</span>
              <span className="font-semibold">{data.replacementRatePercent}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Trimestres</span>
              <span className="text-gray-700">{data.quartersAtAge} / {pensionResult?.quartersRequired}</span>
            </div>
            {data.hasDiscount && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Décote</span>
                <span>-{data.discountPercent}%</span>
              </div>
            )}
            {data.hasBonus && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Surcote</span>
                <span>+{data.bonusPercent}%</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Couleur des barres selon l'âge optimal
  const getBarColor = (age: number) => {
    if (!pensionResult) return '#9CA3AF'
    if (age === pensionResult.optimalAge) return '#7373FF'
    if (age < pensionResult.legalRetirementAge) return '#F59E0B'
    if (pensionResult.projectionByAge.find(p => p.age === age)?.hasDiscount) return '#EF4444'
    return '#10B981'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#7373FF]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
            <Clock className="h-6 w-6 text-[#7373FF]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Estimation Retraite
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Pension de base + complémentaire (régimes obligatoires)
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runPensionSimulation}
          disabled={simulating}
          className="border-gray-200"
        >
          {simulating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Recalculer
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100/80 p-1 rounded-xl">
          <TabsTrigger value="synthese" className="data-[state=active]:bg-white">
            <BarChart3 className="h-4 w-4 mr-2 text-[#7373FF]" />Synthèse
          </TabsTrigger>
          <TabsTrigger value="parametres" className="data-[state=active]:bg-white">
            <Settings className="h-4 w-4 mr-2 text-[#7373FF]" />Paramètres
          </TabsTrigger>
          <TabsTrigger value="projection" className="data-[state=active]:bg-white">
            <TrendingUp className="h-4 w-4 mr-2 text-[#7373FF]" />Projection
          </TabsTrigger>
          <TabsTrigger value="recommandations" className="data-[state=active]:bg-white">
            <Sparkles className="h-4 w-4 mr-2 text-[#7373FF]" />Conseils
          </TabsTrigger>
        </TabsList>

        {/* ============================================================= */}
        {/* ONGLET SYNTHÈSE */}
        {/* ============================================================= */}
        <TabsContent value="synthese" className="mt-4 space-y-6">
          {pensionResult ? (
            <>
              {/* KPIs principaux */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-gray-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Pension totale</p>
                        <p className="text-2xl font-bold text-[#7373FF] mt-1">
                          {formatCurrency(pensionResult.monthlyPension)}/mois
                        </p>
                      </div>
                      <div className="p-3 bg-[#7373FF]/10 rounded-xl">
                        <Wallet className="h-6 w-6 text-[#7373FF]" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      {formatCurrency(pensionResult.annualPension)}/an
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Taux de remplacement</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {pensionResult.replacementRatePercent}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-xl">
                        <Target className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      Du salaire brut actuel
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Trimestres validés</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {pensionResult.quartersValidated}/{pensionResult.quartersRequired}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-xl">
                        <Calendar className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <Progress 
                      value={(pensionResult.quartersValidated / pensionResult.quartersRequired) * 100} 
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>

                <Card className={`border ${pensionResult.hasDiscount ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${pensionResult.hasDiscount ? 'text-amber-700' : 'text-green-700'}`}>
                          {pensionResult.hasDiscount ? 'Décote' : pensionResult.hasBonus ? 'Surcote' : 'Taux plein'}
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${pensionResult.hasDiscount ? 'text-amber-800' : 'text-green-800'}`}>
                          {pensionResult.hasDiscount 
                            ? `-${Math.round(pensionResult.discountRate * 100)}%`
                            : pensionResult.hasBonus 
                              ? `+${Math.round(pensionResult.bonusRate * 100)}%`
                              : '50%'
                          }
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${pensionResult.hasDiscount ? 'bg-amber-100' : 'bg-green-100'}`}>
                        {pensionResult.hasDiscount ? (
                          <AlertTriangle className="h-6 w-6 text-amber-600" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${pensionResult.hasDiscount ? 'text-amber-600' : 'text-green-600'}`}>
                      {pensionResult.hasDiscount 
                        ? `${pensionResult.missingQuarters} trimestres manquants`
                        : pensionResult.hasBonus 
                          ? `${pensionResult.bonusQuarters} trimestres bonus`
                          : 'Conditions remplies'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Répartition Base / Complémentaire */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#7373FF]" />
                      Décomposition de la pension
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Pension de base */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Pension de base</span>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(pensionResult.monthlyBasePension)}/mois</span>
                      </div>
                      <Progress 
                        value={pensionResult.basePercentage} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {pensionResult.basePercentage}% de la pension totale • Régime {pensionResult.regime}
                      </p>
                    </div>

                    {/* Pension complémentaire */}
                    <div className="p-4 bg-[#7373FF]/5 rounded-xl border border-[#7373FF]/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="h-4 w-4 text-[#7373FF]" />
                          <span className="text-sm font-medium text-[#5c5ce6]">Pension complémentaire</span>
                        </div>
                        <span className="font-bold text-[#7373FF]">{formatCurrency(pensionResult.monthlyComplementaryPension)}/mois</span>
                      </div>
                      <Progress 
                        value={pensionResult.complementaryPercentage} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {pensionResult.complementaryPercentage}% • {pensionResult.complementaryDetails?.nomRegime || 'AGIRC-ARRCO'}
                      </p>
                    </div>

                    {/* Détail complémentaire */}
                    {pensionResult.complementaryDetails && (
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <p className="text-xs font-medium text-gray-600">Détail retraite complémentaire</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Points acquis</span>
                            <span className="font-medium">{pensionResult.complementaryDetails.points.total.toLocaleString('fr-FR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Valeur du point</span>
                            <span className="font-medium">{pensionResult.complementaryDetails.valeurPoint.toFixed(4)}€</span>
                          </div>
                          {pensionResult.complementaryDetails.coefficients.majorationFamille > 1 && (
                            <div className="col-span-2 flex justify-between text-green-600">
                              <span>Majoration famille ({params.nombreEnfants}+ enfants)</span>
                              <span className="font-medium">+10%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informations clés */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-5 w-5 text-[#7373FF]" />
                      Informations clés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Âge actuel</span>
                        <span className="font-bold text-gray-800">{currentAge} ans</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Âge légal de départ</span>
                        <span className="font-bold text-gray-800">{pensionResult.legalRetirementAge} ans</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Âge du taux plein</span>
                        <span className="font-bold text-gray-800">{pensionResult.fullRateAge} ans</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#7373FF]/5 rounded-lg border border-[#7373FF]/20">
                        <span className="text-sm text-[#5c5ce6]">Âge optimal de départ</span>
                        <span className="font-bold text-[#7373FF]">{pensionResult.optimalAge} ans</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">SAM (25 meilleures années)</span>
                        <span className="font-bold text-gray-800">{formatCurrency(pensionResult.referenceSalary)}/an</span>
                      </div>
                      {pensionResult.salaryExceedsPASS && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs text-amber-700">
                            ⚠️ Votre salaire dépasse le PASS ({formatCurrency(pensionResult.passCurrent)}). 
                            La partie excédentaire n'est pas couverte par le régime de base.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Lancez une simulation pour voir les résultats</p>
            </div>
          )}
        </TabsContent>

        {/* ============================================================= */}
        {/* ONGLET PARAMÈTRES */}
        {/* ============================================================= */}
        <TabsContent value="parametres" className="mt-4 space-y-6">
          <Card className="border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
                    <Settings className="h-5 w-5 text-[#7373FF]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Paramètres de simulation</CardTitle>
                    <CardDescription className="text-gray-500">Ajustez les données pour affiner votre estimation de pension</CardDescription>
                  </div>
                </div>
                {pensionResult && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Simulation à jour
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Section: Situation professionnelle */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#7373FF]"></div>
                  Situation professionnelle
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Régime de retraite
                    </Label>
                    <Select value={params.regime} onValueChange={(v) => setParams(p => ({ ...p, regime: v }))}>
                      <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF] focus:ring-[#7373FF]/20">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {REGIMES.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Années travaillées
                    </Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={params.yearsWorked}
                        onChange={(e) => setParams(p => ({ ...p, yearsWorked: Number(e.target.value) }))}
                        min={0}
                        max={50}
                        className="h-11 pl-10 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF] focus:ring-[#7373FF]/20"
                      />
                    </div>
                    <p className="text-xs text-gray-500 pl-1">Soit {params.yearsWorked * 4} trimestres cotisés</p>
                  </div>
                </div>
              </div>

              {/* Section: Revenus */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#7373FF]"></div>
                  Revenus et situation familiale
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Salaire brut annuel moyen
                    </Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={params.averageSalary}
                        onChange={(e) => setParams(p => ({ ...p, averageSalary: Number(e.target.value) }))}
                        min={0}
                        step={1000}
                        className="h-11 pl-10 pr-10 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF] focus:ring-[#7373FF]/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                    </div>
                    <p className="text-xs text-gray-500 pl-1">Moyenne des 25 meilleures années</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Nombre d'enfants
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={params.nombreEnfants}
                        onChange={(e) => setParams(p => ({ ...p, nombreEnfants: Number(e.target.value) }))}
                        min={0}
                        max={10}
                        className="h-11 pl-10 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF] focus:ring-[#7373FF]/20"
                      />
                    </div>
                    <p className="text-xs text-gray-500 pl-1">3+ enfants = majoration +10%</p>
                  </div>
                </div>
              </div>

              {/* Section: Objectifs de départ */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#7373FF]"></div>
                  Objectifs de départ
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Âge de départ souhaité
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={params.retirementAge}
                        onChange={(e) => setParams(p => ({ ...p, retirementAge: Number(e.target.value) }))}
                        min={60}
                        max={70}
                        className="h-11 pl-10 pr-12 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF] focus:ring-[#7373FF]/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">ans</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Âge du taux plein automatique
                    </Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        value={params.fullRateAge}
                        onChange={(e) => setParams(p => ({ ...p, fullRateAge: Number(e.target.value) }))}
                        min={65}
                        max={70}
                        className="h-11 pl-10 pr-12 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF] focus:ring-[#7373FF]/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">ans</span>
                    </div>
                    <p className="text-xs text-gray-500 pl-1">67 ans = taux plein automatique</p>
                  </div>
                </div>
              </div>

              {/* Bouton enregistrer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  La simulation se met à jour automatiquement
                </p>
                <Button 
                  onClick={runPensionSimulation} 
                  disabled={simulating}
                  variant="outline"
                  className="border-[#7373FF] text-[#7373FF] hover:bg-[#7373FF]/5"
                >
                  {simulating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Recalculer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ONGLET PROJECTION */}
        {/* ============================================================= */}
        <TabsContent value="projection" className="mt-4 space-y-6">
          {pensionResult?.projectionByAge && (
            <>
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-[#7373FF]" />
                    </div>
                    <div>
                      <CardTitle>Projection selon l'âge de départ</CardTitle>
                      <CardDescription>Impact du choix de l'âge sur votre pension mensuelle</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={pensionResult.projectionByAge}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="age" 
                          tickFormatter={(v) => `${v} ans`}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(v) => `${(v/1000).toFixed(1)}k€`}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine 
                          x={pensionResult.legalRetirementAge} 
                          stroke="#F59E0B" 
                          strokeDasharray="5 5"
                          label={{ value: 'Âge légal', position: 'top', fill: '#F59E0B', fontSize: 10 }}
                        />
                        <Bar dataKey="monthlyPension" radius={[4, 4, 0, 0]}>
                          {pensionResult.projectionByAge.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.age)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Légende */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-[#7373FF]" />
                      <span className="text-gray-600">Âge optimal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-[#10B981]" />
                      <span className="text-gray-600">Taux plein</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-[#F59E0B]" />
                      <span className="text-gray-600">Avant âge légal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-[#EF4444]" />
                      <span className="text-gray-600">Avec décote</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tableau détaillé */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tableau comparatif par âge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 px-3 text-left font-medium text-gray-600">Âge</th>
                          <th className="py-2 px-3 text-right font-medium text-gray-600">Trimestres</th>
                          <th className="py-2 px-3 text-right font-medium text-gray-600">Taux</th>
                          <th className="py-2 px-3 text-right font-medium text-gray-600">Pension/mois</th>
                          <th className="py-2 px-3 text-right font-medium text-gray-600">Taux rempl.</th>
                          <th className="py-2 px-3 text-center font-medium text-gray-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pensionResult.projectionByAge.map((proj) => (
                          <tr 
                            key={proj.age} 
                            className={`border-b border-gray-100 ${proj.age === pensionResult.optimalAge ? 'bg-[#7373FF]/5' : ''}`}
                          >
                            <td className="py-2 px-3 font-medium">
                              {proj.age} ans
                              {proj.age === pensionResult.optimalAge && (
                                <Badge className="ml-2 bg-[#7373FF] text-white text-xs">Optimal</Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">{proj.quartersAtAge}</td>
                            <td className="py-2 px-3 text-right">{(proj.pensionRate * 100).toFixed(1)}%</td>
                            <td className="py-2 px-3 text-right font-bold">{formatCurrency(proj.monthlyPension)}</td>
                            <td className="py-2 px-3 text-right">{proj.replacementRatePercent}%</td>
                            <td className="py-2 px-3 text-center">
                              {proj.hasDiscount ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                  Décote -{proj.discountPercent}%
                                </Badge>
                              ) : proj.hasBonus ? (
                                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                  Surcote +{proj.bonusPercent}%
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600 border-gray-300 text-xs">
                                  Taux plein
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ============================================================= */}
        {/* ONGLET RECOMMANDATIONS */}
        {/* ============================================================= */}
        <TabsContent value="recommandations" className="mt-4 space-y-6">
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#7373FF]/10 rounded-xl">
                  <Sparkles className="h-5 w-5 text-[#7373FF]" />
                </div>
                <div>
                  <CardTitle>Recommandations personnalisées</CardTitle>
                  <CardDescription>Conseils pour optimiser votre retraite</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {pensionResult?.recommendations && pensionResult.recommendations.length > 0 ? (
                pensionResult.recommendations.map((reco, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border ${
                      reco.priorite === 'haute' 
                        ? 'bg-[#7373FF]/5 border-[#7373FF]/20' 
                        : reco.priorite === 'moyenne' 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-gray-50/50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        reco.priorite === 'haute' ? 'bg-[#7373FF]/10' : 'bg-gray-100'
                      }`}>
                        {reco.type === 'trimestres' || reco.type === 'rachat' ? (
                          <Calendar className={`h-5 w-5 ${reco.priorite === 'haute' ? 'text-[#7373FF]' : 'text-gray-600'}`} />
                        ) : reco.type === 'decote' || reco.type === 'age_legal' ? (
                          <AlertTriangle className={`h-5 w-5 ${reco.priorite === 'haute' ? 'text-amber-600' : 'text-gray-600'}`} />
                        ) : reco.type === 'complement' || reco.type === 'plafond' ? (
                          <PiggyBank className={`h-5 w-5 ${reco.priorite === 'haute' ? 'text-[#7373FF]' : 'text-gray-600'}`} />
                        ) : reco.type === 'surcote' || reco.type === 'info' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : reco.type === 'majoration' ? (
                          <Users className="h-5 w-5 text-green-600" />
                        ) : (
                          <Info className={`h-5 w-5 ${reco.priorite === 'haute' ? 'text-[#7373FF]' : 'text-gray-600'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={
                              reco.priorite === 'haute' 
                                ? 'text-[#5c5ce6] border-[#7373FF]/30' 
                                : reco.priorite === 'moyenne' 
                                  ? 'text-gray-600 border-gray-300' 
                                  : 'text-gray-500 border-gray-200'
                            }
                          >
                            {reco.priorite === 'haute' ? 'Important' : 
                             reco.priorite === 'moyenne' ? 'À considérer' : 'Information'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{reco.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">Situation favorable</p>
                  <p className="text-sm text-gray-500 mt-1">Pas de recommandation particulière</p>
                </div>
              )}

              {/* Liens utiles */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Ressources utiles</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <a 
                    href="https://www.info-retraite.fr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Shield className="h-4 w-4 text-[#7373FF]" />
                    <span className="text-sm">info-retraite.fr - Relevé de carrière</span>
                  </a>
                  <a 
                    href="https://www.lassuranceretraite.fr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-[#7373FF]" />
                    <span className="text-sm">L'Assurance Retraite - CNAV</span>
                  </a>
                  <a 
                    href="https://www.agirc-arrco.fr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <PiggyBank className="h-4 w-4 text-[#7373FF]" />
                    <span className="text-sm">AGIRC-ARRCO - Points complémentaires</span>
                  </a>
                  <a 
                    href="https://www.service-public.fr/particuliers/vosdroits/N381" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Info className="h-4 w-4 text-[#7373FF]" />
                    <span className="text-sm">Service-public.fr - Retraite</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TabRetraiteComplete
