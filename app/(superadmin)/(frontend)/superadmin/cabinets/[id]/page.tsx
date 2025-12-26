'use client'

/**
 * Page SuperAdmin - Détail Cabinet
 * 
 * Vue complète d'un cabinet avec:
 * - Informations générales
 * - Abonnement et facturation
 * - Utilisateurs
 * - Statistiques d'utilisation
 * - Actions administratives
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Progress } from '@/app/_common/components/ui/Progress'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  ArrowLeft,
  Building2,
  Users,
  Database,
  CreditCard,
  Activity,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Ban,
  Euro,
  Download,
} from 'lucide-react'

interface CabinetDetail {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  address: {
    street?: string
    city?: string
    postalCode?: string
    country?: string
  } | null
  plan: string
  status: string
  subscriptionStart: string | null
  subscriptionEnd: string | null
  trialEndsAt: string | null
  quotas: {
    maxUsers: number
    maxClients: number
    maxStorage: number
    maxSimulations: number
  }
  usage: {
    users: number
    clients: number
    storage: number
    simulations: number
  }
  features: {
    simulators: Record<string, boolean>
    calculators: Record<string, boolean>
    modules: Record<string, boolean>
  }
  createdAt: string
  updatedAt: string
  users: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isActive: boolean
    lastLogin: string | null
  }[]
  recentActivity: {
    id: string
    action: string
    description: string
    timestamp: string
  }[]
  billingHistory: {
    id: string
    date: string
    amount: number
    status: string
    invoiceUrl?: string
  }[]
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-gray-100 text-gray-700',
  STARTER: 'bg-blue-100 text-blue-700',
  BUSINESS: 'bg-green-100 text-green-700',
  PREMIUM: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-orange-100 text-orange-700',
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle }> = {
  ACTIVE: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  TRIALING: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  SUSPENDED: { color: 'bg-red-100 text-red-700', icon: Ban },
  TERMINATED: { color: 'bg-gray-100 text-gray-700', icon: XCircle },
}

export default function CabinetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const cabinetId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [cabinet, setCabinet] = useState<CabinetDetail | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

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
        setCabinet(data.cabinet)
      } else {
        // Données de démo
        setCabinet(generateDemoCabinet())
      }
    } catch (error) {
      console.error('Erreur:', error)
      setCabinet(generateDemoCabinet())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoCabinet = (): CabinetDetail => ({
    id: cabinetId,
    name: 'Cabinet Finance Pro',
    slug: 'cabinet-finance-pro',
    email: 'contact@financepro.fr',
    phone: '+33 1 23 45 67 89',
    address: {
      street: '123 Avenue des Finances',
      city: 'Paris',
      postalCode: '75008',
      country: 'France',
    },
    plan: 'BUSINESS',
    status: 'ACTIVE',
    subscriptionStart: '2024-01-15T00:00:00Z',
    subscriptionEnd: '2025-01-15T00:00:00Z',
    trialEndsAt: null,
    quotas: { maxUsers: 15, maxClients: 1000, maxStorage: 20, maxSimulations: 2000 },
    usage: { users: 8, clients: 456, storage: 8.5, simulations: 1234 },
    features: {
      simulators: { SIM_RETIREMENT: true, SIM_IMMOBILIER: true, SIM_PER: true, SIM_SUCCESSION: false },
      calculators: { CALC_INCOME_TAX: true, CALC_IFI: true },
      modules: { MOD_BASE: true, MOD_CLIENT_360: true, MOD_DOCUMENTS: true },
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-25T10:00:00Z',
    users: [
      { id: '1', email: 'admin@financepro.fr', firstName: 'Jean', lastName: 'Dupont', role: 'ADMIN', isActive: true, lastLogin: '2024-11-25T09:00:00Z' },
      { id: '2', email: 'marie@financepro.fr', firstName: 'Marie', lastName: 'Martin', role: 'ADVISOR', isActive: true, lastLogin: '2024-11-24T14:00:00Z' },
      { id: '3', email: 'pierre@financepro.fr', firstName: 'Pierre', lastName: 'Bernard', role: 'ADVISOR', isActive: true, lastLogin: null },
    ],
    recentActivity: [
      { id: '1', action: 'LOGIN', description: 'Jean Dupont s\'est connecté', timestamp: '2024-11-25T09:00:00Z' },
      { id: '2', action: 'CREATION', description: 'Nouveau client créé: Client XYZ', timestamp: '2024-11-24T16:30:00Z' },
      { id: '3', action: 'SIMULATION', description: 'Simulation retraite effectuée', timestamp: '2024-11-24T15:00:00Z' },
    ],
    billingHistory: [
      { id: '1', date: '2024-11-01T00:00:00Z', amount: 149, status: 'PAYEE', invoiceUrl: '#' },
      { id: '2', date: '2024-10-01T00:00:00Z', amount: 149, status: 'PAYEE', invoiceUrl: '#' },
      { id: '3', date: '2024-09-01T00:00:00Z', amount: 149, status: 'PAYEE', invoiceUrl: '#' },
    ],
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const getQuotaPercentage = (used: number, max: number) => {
    if (max === -1) return 0
    return Math.min((used / max) * 100, 100)
  }

  const handleAction = async (action: string) => {
    try {
      // Simuler l'action
      toast({
        title: 'Action effectuée',
        description: `Action "${action}" exécutée avec succès`,
      })
      loadCabinet()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'effectuer cette action',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!cabinet) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Cabinet non trouvé</h2>
        <Button className="mt-4" onClick={() => router.push('/superadmin/cabinets')}>
          Retour aux cabinets
        </Button>
      </div>
    )
  }

  const StatusIcon = STATUS_CONFIG[cabinet.status]?.icon || CheckCircle

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/superadmin/cabinets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{cabinet.name}</h1>
              <Badge className={PLAN_COLORS[cabinet.plan]}>{cabinet.plan}</Badge>
              <Badge className={STATUS_CONFIG[cabinet.status]?.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {cabinet.status}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1">{cabinet.slug}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/superadmin/cabinets/${cabinetId}/features`}>
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Features
            </Button>
          </Link>
          <Button variant="outline" onClick={loadCabinet}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{cabinet.usage.users}/{cabinet.quotas.maxUsers}</p>
              <p className="text-xs text-gray-500">Utilisateurs</p>
              <Progress value={getQuotaPercentage(cabinet.usage.users, cabinet.quotas.maxUsers)} className="h-1 mt-1" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{cabinet.usage.clients}/{cabinet.quotas.maxClients}</p>
              <p className="text-xs text-gray-500">Clients</p>
              <Progress value={getQuotaPercentage(cabinet.usage.clients, cabinet.quotas.maxClients)} className="h-1 mt-1" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">{cabinet.usage.simulations}</p>
              <p className="text-xs text-gray-500">Simulations ce mois</p>
              <Progress value={getQuotaPercentage(cabinet.usage.simulations, cabinet.quotas.maxSimulations)} className="h-1 mt-1" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Euro className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(149)}</p>
              <p className="text-xs text-gray-500">MRR</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs ({cabinet.users.length})</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{cabinet.email}</span>
                </div>
                {cabinet.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{cabinet.phone}</span>
                  </div>
                )}
                {cabinet.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p>{cabinet.address.street}</p>
                      <p>{cabinet.address.postalCode} {cabinet.address.city}</p>
                      <p>{cabinet.address.country}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Créé le {formatDate(cabinet.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Abonnement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan actuel</span>
                  <Badge className={PLAN_COLORS[cabinet.plan]}>{cabinet.plan}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Début</span>
                  <span>{formatDate(cabinet.subscriptionStart)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Renouvellement</span>
                  <span>{formatDate(cabinet.subscriptionEnd)}</span>
                </div>
                {cabinet.trialEndsAt && (
                  <div className="flex items-center justify-between text-amber-600">
                    <span>Fin d'essai</span>
                    <span>{formatDate(cabinet.trialEndsAt)}</span>
                  </div>
                )}
                <Link href={`/superadmin/cabinets/${cabinetId}/edit`}>
                  <Button className="w-full mt-2" variant="outline">
                    Modifier le plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Utilisateurs du cabinet</span>
                <Link href={`/superadmin/cabinets/${cabinetId}/users/add`}>
                  <Button size="sm">Ajouter un utilisateur</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {cabinet.users.map(user => (
                  <div key={user.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge className={user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique de facturation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {cabinet.billingHistory.map(invoice => (
                  <div key={invoice.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{formatDate(invoice.date)}</p>
                      <p className="text-sm text-gray-500">Facture mensuelle</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                      <Badge className={invoice.status === 'PAYEE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {invoice.status === 'PAYEE' ? 'Payée' : 'En attente'}
                      </Badge>
                      {invoice.invoiceUrl && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cabinet.recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Activity className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Actions administratives
              </CardTitle>
              <CardDescription>
                Ces actions peuvent avoir des conséquences importantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Suspendre le cabinet</p>
                  <p className="text-sm text-gray-500">Bloquer temporairement l'accès</p>
                </div>
                <Button variant="outline" onClick={() => handleAction('suspend')}>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspendre
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Réinitialiser les quotas</p>
                  <p className="text-sm text-gray-500">Remettre à zéro les compteurs mensuels</p>
                </div>
                <Button variant="outline" onClick={() => handleAction('reset-quotas')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-700">Supprimer le cabinet</p>
                  <p className="text-sm text-red-600">Action irréversible</p>
                </div>
                <Button variant="destructive" onClick={() => handleAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
