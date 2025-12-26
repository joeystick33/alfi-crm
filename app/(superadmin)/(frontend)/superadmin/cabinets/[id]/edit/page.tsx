'use client'

/**
 * Page SuperAdmin - Éditer Cabinet
 * 
 * Permet de modifier:
 * - Plan d'abonnement
 * - Quotas (utilisateurs, clients, stockage, simulations)
 * - Features actives
 * - Statut du cabinet
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Switch } from '@/app/_common/components/ui/Switch'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  ArrowLeft,
  Save,
  Loader2,
  CreditCard,
  Gauge,
  Sparkles,
  Settings,
  Users,
  Database,
  HardDrive,
  Activity,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'

interface CabinetData {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  plan: string
  status: string
  quotas: {
    maxUsers: number
    maxClients: number
    maxStorage: number
    maxSimulations: number
  }
  features: Record<string, boolean>
}

// STARTER: CRM | BUSINESS: CRM + Calculateurs | PREMIUM: Tout
const PLANS = [
  { id: 'TRIAL', name: 'Essai', price: 0, description: '14 jours gratuits' },
  { id: 'STARTER', name: 'Starter', price: 59, description: 'CRM complet' },
  { id: 'BUSINESS', name: 'Business', price: 99, description: 'CRM + Calculateurs' },
  { id: 'PREMIUM', name: 'Premium', price: 199, description: 'CRM + Calculateurs + Simulateurs' },
]

// STARTER: CRM | BUSINESS: CRM + Calculateurs | PREMIUM: CRM + Calculateurs + Simulateurs
const PLAN_DEFAULTS: Record<string, { quotas: typeof defaultQuotas; features: typeof defaultFeatures }> = {
  TRIAL: {
    quotas: { maxUsers: 2, maxClients: 50, maxStorage: 1, maxSimulations: 0 },
    features: { SIM_RETIREMENT: false, SIM_EPARGNE: false, SIM_IMMOBILIER: false, SIM_SUCCESSION: false, CALC_INCOME_TAX: false, CALC_IFI: false, MOD_DOCUMENTS: true, MOD_EMAIL_SYNC: false, API_ACCESS: false, WHITE_LABEL: false },
  },
  STARTER: {
    // CRM uniquement - Aucun simulateur ni calculateur
    quotas: { maxUsers: 3, maxClients: 150, maxStorage: 5, maxSimulations: 0 },
    features: { SIM_RETIREMENT: false, SIM_EPARGNE: false, SIM_IMMOBILIER: false, SIM_SUCCESSION: false, CALC_INCOME_TAX: false, CALC_IFI: false, MOD_DOCUMENTS: true, MOD_EMAIL_SYNC: true, API_ACCESS: false, WHITE_LABEL: false },
  },
  BUSINESS: {
    // CRM + Tous les calculateurs - Aucun simulateur
    quotas: { maxUsers: 10, maxClients: 500, maxStorage: 20, maxSimulations: 0 },
    features: { SIM_RETIREMENT: false, SIM_EPARGNE: false, SIM_IMMOBILIER: false, SIM_SUCCESSION: false, CALC_INCOME_TAX: true, CALC_IFI: true, MOD_DOCUMENTS: true, MOD_EMAIL_SYNC: true, API_ACCESS: false, WHITE_LABEL: false },
  },
  PREMIUM: {
    // Tout inclus : CRM + Calculateurs + Simulateurs
    quotas: { maxUsers: -1, maxClients: -1, maxStorage: 100, maxSimulations: -1 },
    features: { SIM_RETIREMENT: true, SIM_EPARGNE: true, SIM_IMMOBILIER: true, SIM_SUCCESSION: true, CALC_INCOME_TAX: true, CALC_IFI: true, MOD_DOCUMENTS: true, MOD_EMAIL_SYNC: true, API_ACCESS: true, WHITE_LABEL: true },
  },
}

const defaultQuotas = { maxUsers: 10, maxClients: 500, maxStorage: 10, maxSimulations: 1000 }
const defaultFeatures = {
  SIM_RETIREMENT: true,
  SIM_EPARGNE: true,
  SIM_IMMOBILIER: false,
  SIM_SUCCESSION: false,
  CALC_INCOME_TAX: true,
  CALC_IFI: false,
  MOD_DOCUMENTS: true,
  MOD_EMAIL_SYNC: false,
  API_ACCESS: false,
  WHITE_LABEL: false,
}

const FEATURE_LABELS: Record<string, { label: string; description: string; category: string }> = {
  SIM_RETIREMENT: { label: 'Simulation Retraite', description: 'Calcul des droits à la retraite', category: 'Simulateurs' },
  SIM_EPARGNE: { label: 'Simulation Épargne', description: 'Projection d\'épargne et PER', category: 'Simulateurs' },
  SIM_IMMOBILIER: { label: 'Simulation Immobilier', description: 'Crédit et investissement locatif', category: 'Simulateurs' },
  SIM_SUCCESSION: { label: 'Simulation Succession', description: 'Calcul des droits de succession', category: 'Simulateurs' },
  CALC_INCOME_TAX: { label: 'Calculateur IR', description: 'Impôt sur le revenu', category: 'Calculateurs' },
  CALC_IFI: { label: 'Calculateur IFI', description: 'Impôt sur la fortune immobilière', category: 'Calculateurs' },
  MOD_DOCUMENTS: { label: 'Gestion Documents', description: 'Stockage et partage de documents', category: 'Modules' },
  MOD_EMAIL_SYNC: { label: 'Synchronisation Email', description: 'Intégration Gmail/Outlook', category: 'Modules' },
  API_ACCESS: { label: 'Accès API', description: 'API REST pour intégrations', category: 'Avancé' },
  WHITE_LABEL: { label: 'White Label', description: 'Personnalisation complète de la marque', category: 'Avancé' },
}

export default function EditCabinetPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const cabinetId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cabinet, setCabinet] = useState<CabinetData | null>(null)
  
  const [selectedPlan, setSelectedPlan] = useState('BUSINESS')
  const [quotas, setQuotas] = useState(defaultQuotas)
  const [features, setFeatures] = useState<Record<string, boolean>>(defaultFeatures)
  const [customQuotas, setCustomQuotas] = useState(false)

  useEffect(() => {
    loadCabinet()
  }, [cabinetId])

  const loadCabinet = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/superadmin/cabinets/${cabinetId}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        const cab = data.cabinet
        setCabinet(cab)
        setSelectedPlan(cab.plan)
        setQuotas(cab.quotas || defaultQuotas)
        setFeatures(cab.features || defaultFeatures)
      } else {
        // Données de démo
        const demoCabinet: CabinetData = {
          id: cabinetId,
          name: 'Cabinet Finance Pro',
          slug: 'cabinet-finance-pro',
          email: 'contact@financepro.fr',
          phone: '+33 1 23 45 67 89',
          plan: 'BUSINESS',
          status: 'ACTIVE',
          quotas: { maxUsers: 15, maxClients: 1000, maxStorage: 20, maxSimulations: 2000 },
          features: PLAN_DEFAULTS.BUSINESS.features,
        }
        setCabinet(demoCabinet)
        setSelectedPlan(demoCabinet.plan)
        setQuotas(demoCabinet.quotas)
        setFeatures(demoCabinet.features)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId)
    if (!customQuotas) {
      const planDefaults = PLAN_DEFAULTS[planId]
      if (planDefaults) {
        setQuotas(planDefaults.quotas)
        setFeatures(planDefaults.features)
      }
    }
  }

  const handleQuotaChange = (key: keyof typeof quotas, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10)
    setQuotas(prev => ({ ...prev, [key]: isNaN(numValue) ? prev[key] : numValue }))
  }

  const handleFeatureToggle = (featureKey: string) => {
    setFeatures(prev => ({ ...prev, [featureKey]: !prev[featureKey] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/superadmin/cabinets/${cabinetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan: selectedPlan,
          quotas,
          features,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Cabinet mis à jour',
          description: 'Les modifications ont été enregistrées',
        })
        router.push(`/superadmin/cabinets/${cabinetId}`)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!cabinet) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Cabinet non trouvé</h2>
      </div>
    )
  }

  const featuresByCategory = Object.entries(FEATURE_LABELS).reduce((acc, [key, value]) => {
    if (!acc[value.category]) acc[value.category] = []
    acc[value.category].push({ key, ...value })
    return acc
  }, {} as Record<string, Array<{ key: string; label: string; description: string; category: string }>>)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/superadmin/cabinets/${cabinetId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Modifier {cabinet.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Plan actuel: {cabinet.plan}</p>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="plan">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="quotas">Quotas</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* Onglet Plan */}
        <TabsContent value="plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Changer de plan
              </CardTitle>
              <CardDescription>
                Le changement de plan modifiera automatiquement les quotas et features (sauf si personnalisés)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanChange(plan.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{plan.name}</span>
                      {selectedPlan === plan.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-1">
                      {plan.price === 0 ? 'Gratuit' : `${plan.price}€/mois`}
                    </p>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Quotas */}
        <TabsContent value="quotas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Quotas
              </CardTitle>
              <CardDescription>
                Définir les limites pour ce cabinet. -1 = illimité.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Switch
                  checked={customQuotas}
                  onCheckedChange={setCustomQuotas}
                />
                <div>
                  <p className="font-medium text-amber-800">Quotas personnalisés</p>
                  <p className="text-sm text-amber-600">
                    Activer pour définir des quotas différents du plan
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Utilisateurs max
                  </Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={quotas.maxUsers}
                    onChange={(e) => handleQuotaChange('maxUsers', e.target.value)}
                    min="-1"
                    disabled={!customQuotas}
                  />
                  <p className="text-xs text-gray-500">Nombre maximum d'utilisateurs</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxClients" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Clients max
                  </Label>
                  <Input
                    id="maxClients"
                    type="number"
                    value={quotas.maxClients}
                    onChange={(e) => handleQuotaChange('maxClients', e.target.value)}
                    min="-1"
                    disabled={!customQuotas}
                  />
                  <p className="text-xs text-gray-500">Nombre maximum de clients</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStorage" className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Stockage max (GB)
                  </Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={quotas.maxStorage}
                    onChange={(e) => handleQuotaChange('maxStorage', e.target.value)}
                    min="-1"
                    disabled={!customQuotas}
                  />
                  <p className="text-xs text-gray-500">Stockage en gigaoctets</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSimulations" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Simulations/mois
                  </Label>
                  <Input
                    id="maxSimulations"
                    type="number"
                    value={quotas.maxSimulations}
                    onChange={(e) => handleQuotaChange('maxSimulations', e.target.value)}
                    min="-1"
                    disabled={!customQuotas}
                  />
                  <p className="text-xs text-gray-500">Simulations par mois</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Features */}
        <TabsContent value="features" className="mt-6 space-y-4">
          {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryFeatures.map(feature => (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{feature.label}</p>
                        <p className="text-sm text-gray-500">{feature.description}</p>
                      </div>
                      <Switch
                        checked={features[feature.key] || false}
                        onCheckedChange={() => handleFeatureToggle(feature.key)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
