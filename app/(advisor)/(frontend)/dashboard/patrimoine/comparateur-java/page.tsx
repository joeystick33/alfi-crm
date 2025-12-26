 
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { 
  Calculator, 
  TrendingUp, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Server,
  Euro,
  Calendar,
  Target,
  PiggyBank,
  Building,
  Briefcase,
  Shield
} from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'

interface ProductResult {
  productType: string
  productName: string
  estimatedReturn: number
  riskLevel: string
  taxEfficiency: number
  liquidityScore: number
  recommendation: string
  projectedValue: number
  annualYield: number
  fees: number
}

interface ComparisonResult {
  investmentAmount: number
  horizonYears: number
  investorProfile: string
  products: ProductResult[]
  bestChoice: string
  analysis: string
}

interface BackendHealth {
  success: boolean
  status: 'online' | 'offline' | 'error'
  backend: string
  url: string
  instructions?: string[]
}

const INVESTOR_PROFILES = [
  { value: 'conservative', label: 'Prudent', description: 'Préservation du capital' },
  { value: 'balanced', label: 'Équilibré', description: 'Croissance modérée' },
  { value: 'dynamic', label: 'Dynamique', description: 'Croissance élevée' },
  { value: 'aggressive', label: 'Offensif', description: 'Maximum de croissance' },
]

const PRODUCT_ICONS: Record<string, any> = {
  'ASSURANCE_VIE': Shield,
  'PEA': TrendingUp,
  'CTO': Briefcase,
  'PER': PiggyBank,
  'LMNP': Building,
}

export default function ComparateurJavaPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(true)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  
  // Formulaire
  const [investmentAmount, setInvestmentAmount] = useState(50000)
  const [horizonYears, setHorizonYears] = useState(10)
  const [investorProfile, setInvestorProfile] = useState('balanced')

  // Vérifier le status du backend Java
  const checkHealth = useCallback(async () => {
    setCheckingHealth(true)
    try {
      const response = await fetch('/api/advisor/patrimoine-spring/health')
      const data = await response.json()
      setBackendHealth(data)
    } catch (error) {
      setBackendHealth({
        success: false,
        status: 'error',
        backend: 'Patrimonial Spring (Java)',
        url: process.env.NEXT_PUBLIC_PATRIMOINE_URL || 'Configuration requise',
      })
    } finally {
      setCheckingHealth(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  const handleCompare = useCallback(async () => {
    if (backendHealth?.status !== 'online') {
      toast({ 
        title: 'Backend indisponible', 
        description: 'Le serveur Java doit être démarré pour utiliser cette fonctionnalité', 
        variant: 'destructive' 
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/advisor/patrimoine-spring/comparator/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentAmount,
          horizonYears,
          investorProfile,
        }),
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la comparaison')
      }

      setResult(data.data)
    } catch (error) {
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Erreur inconnue', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [investmentAmount, horizonYears, investorProfile, backendHealth, toast])

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-orange-600 bg-orange-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Comparateur de Produits Patrimoniaux
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse comparative AV, PEA, CTO, PER, LMNP via le moteur Java
          </p>
        </div>
        <Button variant="outline" onClick={checkHealth} disabled={checkingHealth}>
          <RefreshCw className={`h-4 w-4 mr-2 ${checkingHealth ? 'animate-spin' : ''}`} />
          Vérifier le backend
        </Button>
      </div>

      {/* Backend Status */}
      <Card className={backendHealth?.status === 'online' ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className={`h-5 w-5 ${backendHealth?.status === 'online' ? 'text-green-600' : 'text-orange-600'}`} />
              <div>
                <p className="font-medium">{backendHealth?.backend || 'Backend Java'}</p>
                <p className="text-sm text-muted-foreground">{backendHealth?.url || 'URL non configurée'}</p>
              </div>
            </div>
            <Badge variant={backendHealth?.status === 'online' ? 'success' : 'warning'}>
              {backendHealth?.status === 'online' ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> En ligne</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Hors ligne</>
              )}
            </Badge>
          </div>
          
          {backendHealth?.status !== 'online' && backendHealth?.instructions && (
            <div className="mt-4 p-3 bg-white rounded border text-sm">
              <p className="font-medium mb-2">Pour démarrer le backend Java :</p>
              <ol className="space-y-1 text-muted-foreground font-mono text-xs">
                {backendHealth.instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Paramètres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Montant à investir</Label>
              <div className="relative mt-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  className="pl-9"
                  min={1000}
                  step={1000}
                />
              </div>
            </div>

            <div>
              <Label>Horizon d'investissement (années)</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(Number(e.target.value))}
                  className="pl-9"
                  min={1}
                  max={40}
                />
              </div>
            </div>

            <div>
              <Label>Profil investisseur</Label>
              <Select value={investorProfile} onValueChange={setInvestorProfile}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVESTOR_PROFILES.map((profile) => (
                    <SelectItem key={profile.value} value={profile.value}>
                      <div>
                        <span className="font-medium">{profile.label}</span>
                        <span className="text-muted-foreground text-xs ml-2">({profile.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCompare}
              disabled={loading || backendHealth?.status !== 'online'}
              className="w-full"
            >
              {loading ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Analyse en cours...</>
              ) : (
                <><Calculator className="h-4 w-4 mr-2" />Comparer les produits</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Résultats */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-64" />
            </div>
          ) : result ? (
            <>
              {/* Best Choice */}
              {result.bestChoice && (
                <Card className="border-primary bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recommandation</p>
                        <p className="font-bold text-lg text-primary">{result.bestChoice}</p>
                      </div>
                    </div>
                    {result.analysis && (
                      <p className="mt-3 text-sm text-muted-foreground">{result.analysis}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.products?.map((product, index) => {
                  const IconComponent = PRODUCT_ICONS[product.productType] || Calculator
                  return (
                    <Card key={index} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-muted rounded-lg">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{product.productName}</CardTitle>
                              <p className="text-xs text-muted-foreground">{product.productType}</p>
                            </div>
                          </div>
                          <Badge className={getRiskColor(product.riskLevel)}>
                            {product.riskLevel}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-muted-foreground text-xs">Valeur projetée</p>
                            <p className="font-bold text-primary">{formatCurrency(product.projectedValue)}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-muted-foreground text-xs">Rendement annuel</p>
                            <p className="font-bold">{formatPercent(product.annualYield)}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-muted-foreground text-xs">Efficacité fiscale</p>
                            <p className="font-bold text-green-600">{formatPercent(product.taxEfficiency)}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-muted-foreground text-xs">Frais</p>
                            <p className="font-bold text-orange-600">{formatPercent(product.fees)}</p>
                          </div>
                        </div>
                        {product.recommendation && (
                          <p className="text-xs text-muted-foreground border-t pt-2">
                            {product.recommendation}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comparez vos options d'investissement</h3>
                <p className="text-muted-foreground max-w-md">
                  {backendHealth?.status === 'online' 
                    ? 'Renseignez vos paramètres et cliquez sur "Comparer" pour analyser les différents produits patrimoniaux.'
                    : 'Démarrez le backend Java pour accéder au comparateur de produits patrimoniaux.'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
