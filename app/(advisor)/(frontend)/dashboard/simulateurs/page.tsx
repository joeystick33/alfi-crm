'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { 
  Calculator, 
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  Coffee,
  Hexagon,
  Shield,
  Building2,
  PiggyBank,
  Briefcase,
  CreditCard,
  Percent,
  Home,
  TrendingUp,
  Heart,
  ChevronRight,
  Lock,
  Users
} from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import { useFeatureAccess } from '@/app/_common/hooks/use-feature-access'

interface BackendStatus {
  backend: string
  status: 'online' | 'offline' | 'error'
  responseTime: number
  url: string
  type: 'java' | 'nodejs'
  endpoints?: { path: string; method: string; description: string }[]
}

interface HealthResponse {
  success: boolean
  summary: {
    total: number
    online: number
    offline: number
    java: number
    nodejs: number
  }
  backends: BackendStatus[]
}

interface SimulatorInfo {
  key: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  type: 'java' | 'nodejs' | 'typescript'
  port: number | null
  category: 'patrimoine' | 'credit' | 'fiscal' | 'prevoyance'
  href: string
  endpoints: string[]
  featureCode?: string // Code de la feature pour vérifier l'accès
}

const SIMULATORS: SimulatorInfo[] = [
  // Java Backends
  {
    key: 'assurance-vie',
    name: 'Assurance-Vie',
    description: 'Simulation et optimisation de contrats d\'assurance-vie, rachat, succession',
    icon: Shield,
    type: 'java',
    port: 8080,
    category: 'patrimoine',
    href: '/dashboard/simulateurs/assurance-vie',
    endpoints: ['/api/assurance-vie/simulate', '/api/assurance-vie/compare', '/api/assurance-vie/rachat'],
    featureCode: 'SIM_ASSURANCE_VIE',
  },
  {
    key: 'patrimoine',
    name: 'Patrimonial Spring',
    description: 'Analyse AV, PER, PEA, CTO, LMNP et comparaison produits',
    icon: Briefcase,
    type: 'java',
    port: 8081,
    category: 'patrimoine',
    href: '/dashboard/patrimoine/comparateur-java',
    endpoints: ['/api/lifeinsurance/analyze', '/api/per/simulate', '/api/pea/analyze', '/api/cto/analyze', '/api/lmnp/analyze'],
  },
  {
    key: 'per-salaries',
    name: 'PER Salariés',
    description: 'Simulation PER pour salariés avec optimisation des versements',
    icon: PiggyBank,
    type: 'java',
    port: 8082,
    category: 'patrimoine',
    href: '/dashboard/simulateurs/per-salaries',
    endpoints: ['/api/per-salaries/simulate', '/api/per-salaries/optimize'],
    featureCode: 'SIM_PER',
  },
  {
    key: 'immobilier',
    name: 'Investissement Immobilier',
    description: 'Rentabilité, cash-flow, fiscalité et simulation complète',
    icon: Building2,
    type: 'java',
    port: 8083,
    category: 'patrimoine',
    href: '/dashboard/simulateurs/immobilier',
    endpoints: ['/api/immobilier/simulate', '/api/immobilier/rentabilite', '/api/immobilier/cashflow'],
    featureCode: 'SIM_IMMOBILIER',
  },
  {
    key: 'prevoyance-tns',
    name: 'Prévoyance TNS',
    description: 'Analyse des gaps de couverture et optimisation prévoyance TNS',
    icon: Heart,
    type: 'java',
    port: 8084,
    category: 'prevoyance',
    href: '/dashboard/simulateurs/prevoyance-tns',
    endpoints: ['/api/prevoyance-tns/simulate', '/api/prevoyance-tns/gap-analysis'],
    featureCode: 'SIM_PREVOYANCE',
  },
  // Node.js Backends
  {
    key: 'capacite-emprunt',
    name: 'Capacité d\'Emprunt',
    description: 'Calcul de la capacité d\'emprunt maximale',
    icon: CreditCard,
    type: 'nodejs',
    port: 3001,
    category: 'credit',
    href: '/dashboard/simulateurs/capacite-emprunt',
    endpoints: ['/api/capacite-emprunt/calculate'],
  },
  {
    key: 'mensualite',
    name: 'Mensualité Crédit',
    description: 'Calcul des mensualités et tableau d\'amortissement',
    icon: Calculator,
    type: 'nodejs',
    port: 3002,
    category: 'credit',
    href: '/dashboard/simulateurs/mensualite',
    endpoints: ['/api/mensualite/calculate', '/api/mensualite/amortization'],
  },
  {
    key: 'enveloppe-fiscale',
    name: 'Enveloppe Fiscale TNS',
    description: 'Optimisation de l\'enveloppe fiscale pour TNS',
    icon: Percent,
    type: 'nodejs',
    port: 3003,
    category: 'fiscal',
    href: '/dashboard/simulateurs/enveloppe-fiscale',
    endpoints: ['/api/enveloppe-fiscale/calculate', '/api/enveloppe-fiscale/optimize'],
  },
  {
    key: 'per-tns',
    name: 'PER TNS',
    description: 'Simulation PER spécifique aux TNS avec déduction Madelin',
    icon: PiggyBank,
    type: 'nodejs',
    port: 3004,
    category: 'patrimoine',
    href: '/dashboard/simulateurs/per-tns',
    endpoints: ['/api/per-tns/simulate', '/api/per-tns/deduction'],
    featureCode: 'SIM_PER_TNS',
  },
  {
    key: 'ptz',
    name: 'PTZ 2025',
    description: 'Éligibilité et simulation Prêt à Taux Zéro 2025',
    icon: Home,
    type: 'nodejs',
    port: 3005,
    category: 'credit',
    href: '/dashboard/simulateurs/ptz',
    endpoints: ['/api/ptz/eligibility', '/api/ptz/simulate'],
    featureCode: 'SIM_PTZ',
  },
  {
    key: 'epargne',
    name: 'Épargne Flexible',
    description: 'Simulation et projection d\'épargne à long terme',
    icon: TrendingUp,
    type: 'nodejs',
    port: 3006,
    category: 'patrimoine',
    href: '/dashboard/simulateurs/epargne',
    endpoints: ['/api/epargne/simulate', '/api/epargne/project'],
    featureCode: 'SIM_EPARGNE',
  },
  {
    key: 'retraite',
    name: '🏖️ Retraite Complet',
    description: 'Estimation pension, analyse gap, projection épargne et scénarios en 4 étapes',
    icon: TrendingUp,
    type: 'typescript',
    port: null,
    category: 'patrimoine',
    href: '/dashboard/simulateurs/retraite',
    endpoints: ['/api/advisor/simulators/retirement/pension', '/api/advisor/simulators/retirement/simulate', '/api/advisor/simulators/retirement/compare'],
    featureCode: 'SIM_RETIREMENT',
  },
  {
    key: 'succession',
    name: 'Succession Complet',
    description: 'Simulateur successoral complet : dévolution légale, DDV, fiscalité, assurance-vie, donations',
    icon: Users,
    type: 'typescript',
    port: null,
    category: 'patrimoine',
    href: '/dashboard/simulateurs/succession',
    endpoints: ['/api/advisor/simulators/succession-smp'],
    featureCode: 'SIM_SUCCESSION',
  },
]

const CATEGORIES = [
  { key: 'all', label: 'Tous', count: SIMULATORS.length },
  { key: 'patrimoine', label: 'Patrimoine', count: SIMULATORS.filter(s => s.category === 'patrimoine').length },
  { key: 'credit', label: 'Crédit', count: SIMULATORS.filter(s => s.category === 'credit').length },
  { key: 'fiscal', label: 'Fiscal', count: SIMULATORS.filter(s => s.category === 'fiscal').length },
  { key: 'prevoyance', label: 'Prévoyance', count: SIMULATORS.filter(s => s.category === 'prevoyance').length },
]

export default function SimulateursHubPage() {
  const { toast } = useToast()
  const { hasAccess } = useFeatureAccess()
  const [loading, setLoading] = useState(true)
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const checkHealth = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/advisor/simulators-proxy/health')
      const data = await response.json()
      setHealthData(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de vérifier les backends', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const getBackendStatus = (key: string): BackendStatus | undefined => {
    const simulator = SIMULATORS.find(s => s.key === key)
    if (!simulator) return undefined
    return healthData?.backends?.find(b => b.backend.toLowerCase().includes(simulator.name.toLowerCase().split(' ')[0]))
  }

  const filteredSimulators = activeCategory === 'all' 
    ? SIMULATORS 
    : SIMULATORS.filter(s => s.category === activeCategory)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'java': return <Coffee className="h-3 w-3" />
      case 'nodejs': return <Hexagon className="h-3 w-3" />
      default: return <Server className="h-3 w-3" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'java': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'nodejs': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Simulateurs Patrimoniaux
          </h1>
          <p className="text-muted-foreground mt-1">
            11 simulateurs Java et Node.js pour l'analyse patrimoniale complète
          </p>
        </div>
        <Button variant="outline" onClick={checkHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : healthData ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-slate-700">{healthData.summary.total}</div>
              <div className="text-xs text-slate-500">Total Backends</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{healthData.summary.online}</div>
              <div className="text-xs text-green-600">En ligne</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-700">{healthData.summary.offline}</div>
              <div className="text-xs text-red-600">Hors ligne</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-700 flex items-center justify-center gap-1">
                <Coffee className="h-5 w-5" />
                {healthData.summary.java}
              </div>
              <div className="text-xs text-orange-600">Java Spring</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-700 flex items-center justify-center gap-1">
                <Hexagon className="h-5 w-5" />
                {healthData.summary.nodejs}
              </div>
              <div className="text-xs text-emerald-600">Node.js</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key}>
              {cat.label} ({cat.count})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSimulators.map(simulator => {
              const IconComponent = simulator.icon
              const status = getBackendStatus(simulator.key)
              const isOnline = status?.status === 'online'
              const hasFeatureAccess = simulator.featureCode ? hasAccess(simulator.featureCode) : true
              // Permettre l'accès si la feature est autorisée (les APIs Next.js fonctionnent toujours)
              const isAccessible = hasFeatureAccess

              return (
                <Card 
                  key={simulator.key} 
                  className={`group hover:shadow-lg transition-all ${
                    isAccessible ? 'hover:border-primary/50' : 'opacity-75'
                  } ${!hasFeatureAccess ? 'border-dashed' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${
                        simulator.type === 'java' ? 'bg-orange-100' : 'bg-green-100'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          simulator.type === 'java' ? 'text-orange-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasFeatureAccess && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1">
                            <Lock className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                        <Badge className={getTypeColor(simulator.type)}>
                          {getTypeIcon(simulator.type)}
                          <span className="ml-1">{simulator.port}</span>
                        </Badge>
                        {isOnline ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            En ligne
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Hors ligne
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                      {simulator.name}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {simulator.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {simulator.endpoints.slice(0, 3).map(ep => (
                        <Badge key={ep} variant="outline" className="text-xs font-mono">
                          {ep.split('/').pop()}
                        </Badge>
                      ))}
                      {simulator.endpoints.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{simulator.endpoints.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={isAccessible ? simulator.href : '#'} className="flex-1">
                        <Button 
                          variant={isAccessible ? 'primary' : 'outline'} 
                          className="w-full"
                          disabled={!isAccessible}
                        >
                          {!hasFeatureAccess ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              Verrouillé
                            </>
                          ) : isOnline ? (
                            <>
                              Ouvrir
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          ) : 'Indisponible'}
                        </Button>
                      </Link>
                    </div>
                    {status?.responseTime && isOnline && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Temps de réponse: {status.responseTime}ms
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accès Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/calculateurs">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <Calculator className="h-6 w-6 mb-2" />
                <span>Calculateurs</span>
                <span className="text-xs text-muted-foreground">7 outils TypeScript</span>
              </Button>
            </Link>
            <Link href="/dashboard/simulators/retraite">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <PiggyBank className="h-6 w-6 mb-2" />
                <span>Retraite</span>
                <span className="text-xs text-muted-foreground">Simulation complète</span>
              </Button>
            </Link>
            <Link href="/dashboard/simulateurs/succession">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <Users className="h-6 w-6 mb-2" />
                <span>Succession</span>
                <span className="text-xs text-muted-foreground">Simulateur complet</span>
              </Button>
            </Link>
            <Link href="/dashboard/simulators/fiscalite">
              <Button variant="outline" className="w-full h-auto py-4 flex-col">
                <Percent className="h-6 w-6 mb-2" />
                <span>Fiscalité</span>
                <span className="text-xs text-muted-foreground">Projections fiscales</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Backend Details */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Détails des Backends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.backends.map((backend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      backend.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{backend.backend}</div>
                      <div className="text-xs text-muted-foreground">{backend.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backend.status === 'online' && (
                      <span className="text-xs text-muted-foreground">{backend.responseTime}ms</span>
                    )}
                    <Badge className={getTypeColor(backend.type)}>
                      {backend.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
