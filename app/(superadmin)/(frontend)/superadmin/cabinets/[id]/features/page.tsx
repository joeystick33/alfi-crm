 
'use client'

/**
 * Page SuperAdmin - Gestion des Features d'un Cabinet
 * 
 * Permet de:
 * - Voir les features activées/désactivées
 * - Activer/désactiver individuellement
 * - Appliquer des presets par plan
 * - Voir les statistiques d'utilisation
 * 
 * Design: Thème light solid
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import Switch from '@/app/_common/components/ui/Switch'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Crown,
  Briefcase,
  Calculator,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Sparkles,
  Settings,
  BarChart3,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface FeatureDefinition {
  code: string
  name: string
  description: string
  category: 'simulators' | 'calculators' | 'modules'
  icon: string
  requiredPlan: string
}

interface CabinetFeatures {
  simulators: Record<string, boolean>
  calculators: Record<string, boolean>
  modules: Record<string, boolean>
  customLimits?: {
    maxSimulationsPerMonth?: number
    maxExportsPerMonth?: number
    maxClientsPortal?: number
  }
}

interface CabinetData {
  id: string
  name: string
  plan: string
  status: string
}

interface UsageStats {
  simulationsThisMonth: number
  exportsThisMonth: number
  clientsInPortal: number
}

// =============================================================================
// Constantes
// =============================================================================

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-gray-100 text-gray-700 border-gray-200',
  STARTER: 'bg-blue-50 text-blue-700 border-blue-200',
  BUSINESS: 'bg-green-50 text-green-700 border-green-200',
  PREMIUM: 'bg-purple-50 text-purple-700 border-purple-200',
  ENTERPRISE: 'bg-orange-50 text-orange-700 border-orange-200',
  CUSTOM: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const CATEGORY_CONFIG = {
  simulators: {
    title: 'Simulateurs',
    description: 'Outils de simulation financière et patrimoniale',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  calculators: {
    title: 'Calculateurs',
    description: 'Calculateurs fiscaux et financiers',
    icon: Calculator,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  modules: {
    title: 'Modules',
    description: 'Fonctionnalités additionnelles',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
}

// =============================================================================
// Composant principal
// =============================================================================

export default function CabinetFeaturesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const cabinetId = params.id as string
  
  // États
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cabinet, setCabinet] = useState<CabinetData | null>(null)
  const [features, setFeatures] = useState<CabinetFeatures | null>(null)
  const [originalFeatures, setOriginalFeatures] = useState<CabinetFeatures | null>(null)
  const [allFeatureDefinitions, setAllFeatureDefinitions] = useState<Record<string, Record<string, FeatureDefinition>>>({})
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Charger les données
  useEffect(() => {
    loadData()
  }, [cabinetId])
  
  // Détecter les changements
  useEffect(() => {
    if (features && originalFeatures) {
      const changed = JSON.stringify(features) !== JSON.stringify(originalFeatures)
      setHasChanges(changed)
    }
  }, [features, originalFeatures])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/superadmin/cabinets/${cabinetId}/features`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }
      
      const data = await response.json()
      
      setCabinet(data.cabinet)
      setFeatures(data.features)
      setOriginalFeatures(JSON.parse(JSON.stringify(data.features)))
      setAllFeatureDefinitions(data.allFeatureDefinitions || {})
      setUsage(data.usage)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Toggle une feature
  const toggleFeature = (category: 'simulators' | 'calculators' | 'modules', code: string) => {
    if (!features) return
    
    setFeatures(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [code]: !prev[category][code],
        },
      }
    })
  }
  
  // Sauvegarder les modifications
  const saveChanges = async () => {
    if (!features) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/superadmin/cabinets/${cabinetId}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(features),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }
      
      const data = await response.json()
      
      setOriginalFeatures(JSON.parse(JSON.stringify(data.features)))
      setFeatures(data.features)
      setHasChanges(false)
      
      toast({
        title: 'Succès',
        description: 'Features mises à jour',
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Appliquer un preset
  const applyPreset = async (plan: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/superadmin/cabinets/${cabinetId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan, updateQuotas: true }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'application du preset')
      }
      
      const data = await response.json()
      
      setFeatures(data.features)
      setOriginalFeatures(JSON.parse(JSON.stringify(data.features)))
      setHasChanges(false)
      
      toast({
        title: 'Succès',
        description: `Preset ${plan} appliqué`,
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Annuler les modifications
  const cancelChanges = () => {
    setFeatures(JSON.parse(JSON.stringify(originalFeatures)))
    setHasChanges(false)
  }
  
  // Compter les features activées
  const countEnabled = (category: 'simulators' | 'calculators' | 'modules') => {
    if (!features) return { enabled: 0, total: 0 }
    const categoryFeatures = features[category]
    const enabled = Object.values(categoryFeatures).filter(Boolean).length
    const total = Object.keys(categoryFeatures).length
    return { enabled, total }
  }
  
  // Chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!cabinet || !features) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Cabinet non trouvé</h2>
          <p className="text-gray-500 mt-2">Ce cabinet n'existe pas ou vous n'y avez pas accès.</p>
          <Button className="mt-4" onClick={() => router.push('/superadmin/cabinets')}>
            Retour aux cabinets
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/superadmin/cabinets`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{cabinet.name}</h1>
              <Badge className={PLAN_COLORS[cabinet.plan]}>
                <Crown className="h-3 w-3 mr-1" />
                {cabinet.plan}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Gestion des fonctionnalités premium
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={cancelChanges} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={saveChanges} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </>
          )}
          <Button variant="outline" onClick={loadData} disabled={loading || saving}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Alerte modifications non sauvegardées */}
      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">
            Vous avez des modifications non sauvegardées
          </span>
        </div>
      )}
      
      {/* Presets rapides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Presets rapides
          </CardTitle>
          <CardDescription>
            Appliquer rapidement une configuration prédéfinie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM', 'ENTERPRISE'].map((plan) => (
              <Button
                key={plan}
                variant={cabinet.plan === plan ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyPreset(plan)}
                disabled={saving}
              >
                {plan}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Statistiques d'utilisation */}
      {usage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Utilisation ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{usage.simulationsThisMonth}</p>
                <p className="text-sm text-gray-500">Simulations</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{usage.exportsThisMonth}</p>
                <p className="text-sm text-gray-500">Exports</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{usage.clientsInPortal}</p>
                <p className="text-sm text-gray-500">Clients portail</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Features par catégorie */}
      {(['simulators', 'calculators', 'modules'] as const).map((category) => {
        const config = CATEGORY_CONFIG[category]
        const CategoryIcon = config.icon
        const counts = countEnabled(category)
        const categoryDefs = allFeatureDefinitions[category] || {}
        
        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <CategoryIcon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{config.title}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm">
                  {counts.enabled} / {counts.total} activées
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(features[category]).map(([code, enabled]) => {
                  const def = categoryDefs[code]
                  
                  return (
                    <div
                      key={code}
                      className={`
                        flex items-center justify-between p-4 rounded-lg border
                        ${enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-lg
                          ${enabled ? config.bgColor : 'bg-gray-100'}
                        `}>
                          {enabled ? (
                            <CheckCircle2 className={`h-4 w-4 ${config.color}`} />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                            {def?.name || code}
                          </p>
                          {def?.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {def.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {def?.requiredPlan && (
                          <Badge variant="outline" className="text-xs">
                            {def.requiredPlan}+
                          </Badge>
                        )}
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => toggleFeature(category, code)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {/* Actions rapides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!features) return
                const newFeatures = { ...features }
                Object.keys(newFeatures.simulators).forEach(k => {
                  newFeatures.simulators[k] = true
                })
                setFeatures(newFeatures)
              }}
            >
              Activer tous les simulateurs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!features) return
                const newFeatures = { ...features }
                Object.keys(newFeatures.calculators).forEach(k => {
                  newFeatures.calculators[k] = true
                })
                setFeatures(newFeatures)
              }}
            >
              Activer tous les calculateurs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!features) return
                const newFeatures = { ...features }
                Object.keys(newFeatures.simulators).forEach(k => {
                  newFeatures.simulators[k] = false
                })
                Object.keys(newFeatures.calculators).forEach(k => {
                  newFeatures.calculators[k] = false
                })
                // Garder les modules de base
                setFeatures(newFeatures)
              }}
            >
              Désactiver tout (sauf base)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
