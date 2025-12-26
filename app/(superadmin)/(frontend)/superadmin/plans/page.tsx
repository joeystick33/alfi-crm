'use client'

/**
 * Page SuperAdmin - Plans d'Abonnement
 * 
 * Gestion des plans SaaS:
 * - Définition des plans et tarifs
 * - Configuration des quotas par plan
 * - Features incluses par plan
 * - Modification des prix
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import {
  Package,
  Euro,
  Users,
  Database,
  Zap,
  Sparkles,
  Edit,
  Save,
  X,
  Plus,
  Check,
  Minus,
  RefreshCw,
  TrendingUp,
  Building2,
} from 'lucide-react'

interface PlanDefinition {
  id: string
  code: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  isPopular: boolean
  isCustom: boolean
  quotas: {
    maxUsers: number
    maxClients: number
    maxStorage: number // en GB
    maxSimulations: number
  }
  features: {
    simulators: string[]
    calculators: string[]
    modules: string[]
  }
  cabinetsCount: number
}

// STARTER: CRM uniquement | BUSINESS: CRM + Calculateurs | PREMIUM: CRM + Calculateurs + Simulateurs
const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: 'trial',
    code: 'TRIAL',
    name: 'Essai Gratuit',
    description: '14 jours pour découvrir Aura CRM',
    monthlyPrice: 0,
    yearlyPrice: 0,
    isPopular: false,
    isCustom: false,
    quotas: { maxUsers: 2, maxClients: 50, maxStorage: 1, maxSimulations: 0 },
    features: {
      simulators: [],
      calculators: [],
      modules: ['MOD_BASE', 'MOD_CLIENT_360'],
    },
    cabinetsCount: 4,
  },
  {
    id: 'starter',
    code: 'STARTER',
    name: 'Starter',
    description: 'CRM complet pour démarrer',
    monthlyPrice: 59,
    yearlyPrice: 590,
    isPopular: false,
    isCustom: false,
    quotas: { maxUsers: 3, maxClients: 150, maxStorage: 5, maxSimulations: 0 },
    features: {
      simulators: [],
      calculators: [],
      modules: ['MOD_BASE', 'MOD_CLIENT_360', 'MOD_DOCUMENTS', 'MOD_EXPORT_PDF'],
    },
    cabinetsCount: 8,
  },
  {
    id: 'business',
    code: 'BUSINESS',
    name: 'Business',
    description: 'CRM + Calculateurs fiscaux',
    monthlyPrice: 99,
    yearlyPrice: 990,
    isPopular: true,
    isCustom: false,
    quotas: { maxUsers: 10, maxClients: 500, maxStorage: 20, maxSimulations: 0 },
    features: {
      simulators: [],
      calculators: ['CALC_INCOME_TAX', 'CALC_IFI', 'CALC_CAPITAL_GAINS', 'CALC_DONATION', 'CALC_INHERITANCE', 'CALC_DEBT_CAPACITY', 'CALC_BUDGET'],
      modules: ['MOD_BASE', 'MOD_CLIENT_360', 'MOD_DOCUMENTS', 'MOD_EXPORT_PDF', 'MOD_EXPORT_EXCEL', 'MOD_CLIENT_PORTAL'],
    },
    cabinetsCount: 5,
  },
  {
    id: 'premium',
    code: 'PREMIUM',
    name: 'Premium',
    description: 'Accès complet : CRM + Calculateurs + Simulateurs',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    isPopular: false,
    isCustom: false,
    quotas: { maxUsers: -1, maxClients: -1, maxStorage: 100, maxSimulations: -1 },
    features: {
      simulators: ['ALL'],
      calculators: ['ALL'],
      modules: ['ALL'],
    },
    cabinetsCount: 3,
  },
]

const PLAN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  TRIAL: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
  STARTER: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  BUSINESS: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  PREMIUM: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<PlanDefinition[]>([])
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<Partial<PlanDefinition>>({})

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/plans', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      } else {
        // Données par défaut
        setPlans(DEFAULT_PLANS)
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error)
      setPlans(DEFAULT_PLANS)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (plan: PlanDefinition) => {
    setEditingPlan(plan.id)
    setEditedData({
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      quotas: { ...plan.quotas },
    })
  }

  const cancelEditing = () => {
    setEditingPlan(null)
    setEditedData({})
  }

  const saveChanges = async (planId: string) => {
    try {
      // Appeler l'API pour sauvegarder
      // await fetch(`/api/superadmin/plans/${planId}`, { method: 'PUT', body: JSON.stringify(editedData) })
      
      // Mettre à jour localement
      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, ...editedData } : p
      ))
      
      setEditingPlan(null)
      setEditedData({})
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }

  const formatCurrency = (value: number) => {
    if (value === 0) return 'Gratuit'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const formatQuota = (value: number) => {
    if (value === -1) return 'Illimité'
    return value.toLocaleString('fr-FR')
  }

  // Stats
  const totalMRR = plans.reduce((sum, p) => sum + (p.monthlyPrice * p.cabinetsCount), 0)
  const totalCabinets = plans.reduce((sum, p) => sum + p.cabinetsCount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans d'Abonnement</h1>
          <p className="text-gray-500 mt-1">
            Configuration des plans et tarification SaaS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadPlans} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer un plan custom
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-200 rounded-lg">
                <Euro className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-800">{formatCurrency(totalMRR)}</p>
                <p className="text-sm text-green-600">MRR Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-200 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-800">{totalCabinets}</p>
                <p className="text-sm text-blue-600">Cabinets abonnés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-200 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-800">
                  {formatCurrency(totalMRR / (totalCabinets || 1))}
                </p>
                <p className="text-sm text-purple-600">ARPU moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const colors = PLAN_COLORS[plan.code] || PLAN_COLORS.TRIAL
          const isEditing = editingPlan === plan.id
          
          return (
            <Card
              key={plan.id}
              className={`relative ${colors.bg} ${colors.border} ${plan.isPopular ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Populaire
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
                    {plan.code}
                  </Badge>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => startEditing(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => saveChanges(plan.id)}>
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Prix */}
                <div className="text-center py-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Prix mensuel</Label>
                        <Input
                          type="number"
                          value={editedData.monthlyPrice ?? plan.monthlyPrice}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedData({
                            ...editedData,
                            monthlyPrice: Number(e.target.value)
                          })}
                          className="text-center"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-bold">
                        {formatCurrency(plan.monthlyPrice)}
                      </p>
                      <p className="text-xs text-gray-500">/mois</p>
                      {plan.yearlyPrice > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {formatCurrency(plan.yearlyPrice)}/an (-17%)
                        </p>
                      )}
                    </>
                  )}
                </div>
                
                {/* Quotas */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-medium text-gray-500 uppercase">Quotas</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Users className="h-3 w-3" /> Users
                    </span>
                    <span className="font-medium">{formatQuota(plan.quotas.maxUsers)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Database className="h-3 w-3" /> Clients
                    </span>
                    <span className="font-medium">{formatQuota(plan.quotas.maxClients)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Zap className="h-3 w-3" /> Simulations
                    </span>
                    <span className="font-medium">{formatQuota(plan.quotas.maxSimulations)}</span>
                  </div>
                </div>
                
                {/* Features count */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {plan.features.simulators[0] === 'ALL' ? '∞' : plan.features.simulators.length} Sim.
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {plan.features.calculators[0] === 'ALL' ? '∞' : plan.features.calculators.length} Calc.
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {plan.features.modules[0] === 'ALL' ? '∞' : plan.features.modules.length} Mod.
                    </Badge>
                  </div>
                </div>
                
                {/* Cabinets using */}
                <div className="pt-2 border-t text-center">
                  <p className="text-2xl font-bold text-gray-900">{plan.cabinetsCount}</p>
                  <p className="text-xs text-gray-500">cabinets</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Features Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Comparaison détaillée des plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Fonctionnalité</th>
                  {plans.map(p => (
                    <th key={p.id} className="text-center py-3 px-4">
                      <Badge className={`${PLAN_COLORS[p.code]?.bg} ${PLAN_COLORS[p.code]?.text}`}>
                        {p.code}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-3 px-4 font-medium">Utilisateurs</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center py-3 px-4">
                      {formatQuota(p.quotas.maxUsers)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Clients</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center py-3 px-4">
                      {formatQuota(p.quotas.maxClients)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Stockage</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center py-3 px-4">
                      {p.quotas.maxStorage === -1 ? 'Illimité' : `${p.quotas.maxStorage} GB`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Simulations/mois</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center py-3 px-4">
                      {formatQuota(p.quotas.maxSimulations)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Support prioritaire</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center py-3 px-4">
                      {['PREMIUM', 'ENTERPRISE'].includes(p.code) ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">API Access</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center py-3 px-4">
                      {['BUSINESS', 'PREMIUM', 'ENTERPRISE'].includes(p.code) ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">White Label</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center py-3 px-4">
                      {['ENTERPRISE'].includes(p.code) ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
