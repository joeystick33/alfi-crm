"use client"
 

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useCabinetInfo, 
  useBillingInfo, 
  useChangePlan, 
  useCancelSubscription,
  type Invoice,
} from '@/app/_common/hooks/api/use-cabinet-api'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Label } from '@/app/_common/components/ui/Label'
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalDescription,
} from '@/app/_common/components/ui/Modal'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  CreditCard, 
  Users, 
  FileText, 
  HardDrive, 
  Building2,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  Crown,
  ArrowRight,
  ChevronRight,
  Loader2,
  Download,
  Calendar,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Star,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabType = 'overview' | 'plans' | 'billing'

interface Plan {
  id: string
  name: string
  price: number
  yearlyPrice: number
  description: string
  features: string[]
  highlighted: boolean
  icon: React.ElementType
  color: string
  quotas: {
    users: number
    clients: number
    storage: number
    documents: number
  }
}

// STARTER: CRM uniquement | BUSINESS: CRM + Calculateurs | PREMIUM: CRM + Calculateurs + Simulateurs
const PLANS: Plan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 59,
    yearlyPrice: 590,
    description: 'CRM complet pour débuter',
    features: [
      '3 utilisateurs',
      '150 clients',
      '5 Go stockage',
      '500 documents',
      'CRM complet',
      'Fiche client 360°',
      'Gestion patrimoine',
      'Export PDF',
      'Support email',
    ],
    highlighted: false,
    icon: Star,
    color: 'blue',
    quotas: { users: 3, clients: 150, storage: 5, documents: 500 },
  },
  {
    id: 'BUSINESS',
    name: 'Business',
    price: 99,
    yearlyPrice: 990,
    description: 'CRM + Calculateurs fiscaux',
    features: [
      '10 utilisateurs',
      '500 clients',
      '20 Go stockage',
      '2 000 documents',
      'Tout Starter +',
      'Calculateur IR',
      'Calculateur IFI',
      'Calculateur Plus-Values',
      'Calculateur Succession',
      'Export Excel',
      'Portail client',
      'Support prioritaire',
    ],
    highlighted: true,
    icon: TrendingUp,
    color: 'blue',
    quotas: { users: 10, clients: 500, storage: 20, documents: 2000 },
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 199,
    yearlyPrice: 1990,
    description: 'Accès complet : CRM + Calculateurs + Simulateurs',
    features: [
      'Utilisateurs illimités',
      'Clients illimités',
      '100 Go stockage',
      'Documents illimités',
      'Tout Business +',
      'Simulateur Retraite',
      'Simulateur PER',
      'Simulateur Immobilier',
      'Simulateur Succession',
      'Tous les simulateurs',
      'API Access',
      'Marque blanche',
      'Support dédié',
    ],
    highlighted: false,
    icon: Crown,
    color: 'amber',
    quotas: { users: -1, clients: -1, storage: 100, documents: -1 },
  },
]

const CANCELLATION_REASONS = [
  { id: 'too_expensive', label: 'Trop cher' },
  { id: 'missing_features', label: 'Fonctionnalités manquantes' },
  { id: 'switching_competitor', label: 'Je passe à un concurrent' },
  { id: 'closing_business', label: 'Je ferme mon activité' },
  { id: 'temporary', label: 'Pause temporaire' },
  { id: 'other', label: 'Autre raison' },
]

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const formatDateShort = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const getInvoiceStatusBadge = (status: Invoice['status']) => {
  switch (status) {
    case 'paid':
      return <Badge variant="success" size="xs" className="gap-1"><CheckCircle className="h-3 w-3" />Payée</Badge>
    case 'pending':
      return <Badge variant="warning" size="xs" className="gap-1"><Clock className="h-3 w-3" />En attente</Badge>
    case 'failed':
      return <Badge variant="destructive" size="xs" className="gap-1"><XCircle className="h-3 w-3" />Échouée</Badge>
    case 'refunded':
      return <Badge variant="info" size="xs" className="gap-1"><RefreshCw className="h-3 w-3" />Remboursée</Badge>
    default:
      return <Badge variant="default" size="xs">{status}</Badge>
  }
}

const getCardBrandIcon = (brand?: string) => {
  // En production, on utiliserait les vraies icônes des marques
  return CreditCard
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AbonnementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { data: cabinet, isLoading, error, refetch } = useCabinetInfo()
  const { data: billing, isLoading: billingLoading } = useBillingInfo()
  const changePlan = useChangePlan()
  const cancelSubscription = useCancelSubscription()

  // UI States
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelFeedback, setCancelFeedback] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  // Derived data
  const currentPlan = useMemo(() => {
    return PLANS.find(p => p.id === cabinet?.plan) || PLANS[0]
  }, [cabinet?.plan])

  const yearlySavings = useMemo(() => {
    if (!currentPlan) return 0
    return (currentPlan.price * 12) - currentPlan.yearlyPrice
  }, [currentPlan])

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === cabinet?.plan) return
    setSelectedPlan(plan)
    setShowUpgradeModal(true)
  }

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return

    try {
      await changePlan.mutateAsync({
        planId: selectedPlan.id,
        billingPeriod,
      })
      toast({
        title: 'Plan mis à jour',
        description: `Vous êtes maintenant sur le plan ${selectedPlan.name}`,
      })
      setShowUpgradeModal(false)
      setSelectedPlan(null)
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: (error as Error).message || 'Impossible de changer de plan',
        variant: 'destructive',
      })
    }
  }

  const handleCancelSubscription = async () => {
    if (!cancelReason) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une raison',
        variant: 'destructive',
      })
      return
    }

    try {
      await cancelSubscription.mutateAsync({
        reason: cancelReason,
        feedback: cancelFeedback || undefined,
      })
      toast({
        title: 'Abonnement annulé',
        description: 'Votre abonnement sera résilié à la fin de la période en cours',
      })
      setShowCancelModal(false)
      setCancelReason('')
      setCancelFeedback('')
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: (error as Error).message || 'Impossible d\'annuler l\'abonnement',
        variant: 'destructive',
      })
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Chargement de l'abonnement...</p>
        </div>
      </div>
    )
  }

  if (error || !cabinet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">Impossible de charger les informations du cabinet</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  // Non-admin view
  if (!isAdmin) {
    return (
      <div className="space-y-6 pb-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Abonnement</h1>
          <p className="text-sm text-gray-500 mt-1">Consultez les informations de votre abonnement</p>
        </header>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Accès limité</h3>
                <p className="text-sm text-amber-700 mt-1">
                  La gestion de l'abonnement est réservée aux administrateurs du cabinet.
                  Contactez votre administrateur pour toute modification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <CurrentPlanCard cabinet={cabinet} currentPlan={currentPlan} isAdmin={false} />
        <UsageStatsGrid cabinet={cabinet} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Abonnement & Facturation</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez votre abonnement, quotas et moyens de paiement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Building2 },
          { id: 'plans', label: 'Plans', icon: Crown },
          { id: 'billing', label: 'Facturation', icon: Receipt },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: OVERVIEW */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* Current Plan Card */}
          <CurrentPlanCard 
            cabinet={cabinet} 
            currentPlan={currentPlan} 
            isAdmin={isAdmin}
            onUpgrade={() => setActiveTab('plans')}
            onCancel={() => setShowCancelModal(true)}
          />

          {/* Usage Stats */}
          <UsageStatsGrid cabinet={cabinet} />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:border-blue-200 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/settings/users')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Gérer les utilisateurs</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{cabinet.usage.users} utilisateurs actifs</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>

            <Card className="hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setActiveTab('plans')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Crown className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Changer de plan</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Voir les options disponibles</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>

            <Card className="hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setActiveTab('billing')}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Receipt className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Voir les factures</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Historique de facturation</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <TeamMembersCard cabinet={cabinet} router={router} />
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: PLANS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'plans' && (
        <>
          {/* Billing Period Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Période de facturation</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Économisez jusqu'à 2 mois avec la facturation annuelle
                  </p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-all',
                      billingPeriod === 'monthly'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                      billingPeriod === 'yearly'
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Annuel
                    <Badge variant="success" size="xs">-17%</Badge>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={cabinet.plan === plan.id}
                billingPeriod={billingPeriod}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
          </div>

          {/* Enterprise CTA */}
          <Card className="bg-gradient-to-r from-violet-50 to-blue-50 border-violet-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-violet-100 rounded-xl">
                    <Sparkles className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Besoin d'une solution personnalisée ?</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Contactez notre équipe commerciale pour une offre sur-mesure adaptée à vos besoins.
                    </p>
                  </div>
                </div>
                <Button className="gap-2 whitespace-nowrap">
                  <ExternalLink className="h-4 w-4" />
                  Contacter les ventes
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: BILLING */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'billing' && (
        <>
          {/* Billing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Prochaine facture</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatDate(billing?.nextBillingDate || null)}</p>
                <p className="text-sm text-gray-500 mt-1">{formatAmount(currentPlan.price)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Moyen de paiement</span>
                </div>
                {billing?.paymentMethods?.[0] ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900 capitalize">
                      {billing.paymentMethods[0].brand || 'Carte'} •••• {billing.paymentMethods[0].last4}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Expire {billing.paymentMethods[0].expiryMonth}/{billing.paymentMethods[0].expiryYear}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Aucun moyen de paiement</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Receipt className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Email de facturation</span>
                </div>
                <p className="text-lg font-bold text-gray-900 truncate">{billing?.billingEmail || cabinet.email || '-'}</p>
                <Button variant="ghost" size="sm" className="mt-2 h-8 text-xs">
                  Modifier
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Invoices */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-400" />
                Historique des factures
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {billingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : billing?.invoices && billing.invoices.length > 0 ? (
                <div className="divide-y">
                  {billing.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{invoice.number}</p>
                          <p className="text-sm text-gray-500">{formatDateShort(invoice.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getInvoiceStatusBadge(invoice.status)}
                        <span className="font-semibold text-gray-900">{formatAmount(invoice.amount)}</span>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>Aucune facture disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Moyens de paiement
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Ajouter une carte
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {billing?.paymentMethods && billing.paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {billing.paymentMethods.map((pm) => (
                    <div key={pm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg border">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {pm.brand || 'Carte'} •••• {pm.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expire {pm.expiryMonth}/{pm.expiryYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pm.isDefault && (
                          <Badge variant="primary" size="xs">Par défaut</Badge>
                        )}
                        <Button variant="ghost" size="sm">Modifier</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>Aucun moyen de paiement enregistré</p>
                  <Button className="mt-4 gap-2">
                    <CreditCard className="h-4 w-4" />
                    Ajouter une carte
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cancel Subscription */}
          <Card className="border-rose-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Annuler l'abonnement</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Vous pouvez annuler à tout moment. Votre accès restera actif jusqu'à la fin de la période payée.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 whitespace-nowrap"
                  onClick={() => setShowCancelModal(true)}
                >
                  Annuler l'abonnement
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Upgrade Modal */}
      <Modal open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              {selectedPlan && PLANS.findIndex(p => p.id === selectedPlan.id) > PLANS.findIndex(p => p.id === cabinet.plan) 
                ? 'Passer au plan supérieur' 
                : 'Changer de plan'}
            </ModalTitle>
            <ModalDescription>
              {selectedPlan && `Vous allez passer au plan ${selectedPlan.name}`}
            </ModalDescription>
          </ModalHeader>

          {selectedPlan && (
            <div className="px-6 py-4 space-y-4">
              {/* Plan Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Plan actuel</p>
                  <p className="font-semibold text-gray-900">{currentPlan.name}</p>
                  <p className="text-sm text-gray-600">{formatAmount(currentPlan.price)}/mois</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Nouveau plan</p>
                  <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatAmount(billingPeriod === 'yearly' ? selectedPlan.yearlyPrice / 12 : selectedPlan.price)}/mois
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800 mb-2">Ce que vous gagnez :</p>
                <ul className="space-y-1">
                  {selectedPlan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                      <Check className="h-4 w-4" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Billing Period */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-700">Facturation</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={cn(
                      'px-3 py-1 rounded text-sm',
                      billingPeriod === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    )}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={cn(
                      'px-3 py-1 rounded text-sm',
                      billingPeriod === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    )}
                  >
                    Annuel (-17%)
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-medium text-gray-900">Total à payer</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatAmount(billingPeriod === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.price)}
                  <span className="text-sm font-normal text-gray-500">/{billingPeriod === 'yearly' ? 'an' : 'mois'}</span>
                </span>
              </div>
            </div>
          )}

          <ModalFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmPlanChange}
              disabled={changePlan.isPending}
              className="gap-2"
            >
              {changePlan.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmer le changement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Cancel Modal */}
      <Modal open={showCancelModal} onOpenChange={setShowCancelModal}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Annuler l'abonnement
            </ModalTitle>
          </ModalHeader>

          <div className="px-6 py-4 space-y-4">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-sm text-rose-800">
                Votre abonnement restera actif jusqu'au <strong>{formatDate(cabinet.subscriptionEnd)}</strong>.
                Après cette date, vous perdrez l'accès aux fonctionnalités premium.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Pourquoi souhaitez-vous partir ?</Label>
              <div className="grid grid-cols-2 gap-2">
                {CANCELLATION_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setCancelReason(reason.id)}
                    className={cn(
                      'p-3 text-sm text-left rounded-lg border transition-all',
                      cancelReason === reason.id
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-sm">Commentaire (optionnel)</Label>
              <textarea
                id="feedback"
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                placeholder="Dites-nous comment nous pourrions nous améliorer..."
                className="w-full h-24 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <ModalFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Conserver mon abonnement
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelSubscription.isPending || !cancelReason}
              className="gap-2"
            >
              {cancelSubscription.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmer l'annulation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CurrentPlanCardProps {
  cabinet: any
  currentPlan: Plan
  isAdmin: boolean
  onUpgrade?: () => void
  onCancel?: () => void
}

function CurrentPlanCard({ cabinet, currentPlan, isAdmin, onUpgrade, onCancel }: CurrentPlanCardProps) {
  const PlanIcon = currentPlan.icon

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600" />
        <div className="relative px-6 py-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <PlanIcon className="h-6 w-6" />
                <Badge variant="default" className="bg-white/20 text-white border-white/30">
                  {cabinet.status === 'TRIALING' ? 'Période d\'essai' : 'Actif'}
                </Badge>
              </div>
              <h2 className="text-3xl font-bold">{cabinet.planName}</h2>
              <p className="text-white/80 mt-1">
                {cabinet.status === 'TRIALING' && cabinet.trialDaysRemaining !== null ? (
                  <>Il vous reste <strong>{cabinet.trialDaysRemaining} jours</strong> d'essai gratuit</>
                ) : (
                  <>Votre abonnement est actif jusqu'au {formatDate(cabinet.subscriptionEnd)}</>
                )}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-bold">
                {cabinet.planPrice.monthly}€
                <span className="text-lg font-normal text-white/70">/mois</span>
              </div>
              <p className="text-sm text-white/70 mt-1">
                ou {cabinet.planPrice.yearly}€/an (2 mois offerts)
              </p>
              {isAdmin && cabinet.plan !== 'ENTERPRISE' && onUpgrade && (
                <Button 
                  className="mt-4 bg-white text-blue-600 hover:bg-white/90"
                  onClick={onUpgrade}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Passer au plan supérieur
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function UsageStatsGrid({ cabinet }: { cabinet: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <UsageCard
        icon={Users}
        label="Utilisateurs"
        used={cabinet.usage.users}
        max={cabinet.quotas.maxUsers}
        color="blue"
      />
      <UsageCard
        icon={Building2}
        label="Clients"
        used={cabinet.usage.clients}
        max={cabinet.quotas.maxClients}
        color="emerald"
      />
      <UsageCard
        icon={FileText}
        label="Documents"
        used={cabinet.usage.documents}
        max={cabinet.quotas.maxDocuments}
        color="violet"
      />
      <UsageCard
        icon={HardDrive}
        label="Stockage"
        used={cabinet.usage.storageGB}
        max={cabinet.quotas.maxStorageGB}
        unit="Go"
        color="amber"
      />
    </div>
  )
}

interface UsageCardProps {
  icon: React.ElementType
  label: string
  used: number
  max: number
  unit?: string
  color: 'blue' | 'emerald' | 'violet' | 'amber'
}

function UsageCard({ icon: Icon, label, used, max, unit = '', color }: UsageCardProps) {
  const safeUsed = typeof used === 'number' && !Number.isNaN(used) ? used : 0
  const safeMax = typeof max === 'number' && !Number.isNaN(max) ? max : -1

  const isUnlimited = safeMax === -1
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((safeUsed / safeMax) * 100))
  
  const colorClasses = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600', bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', bar: 'bg-emerald-500' },
    violet: { bg: 'bg-violet-100', icon: 'text-violet-600', bar: 'bg-violet-500' },
    amber: { bg: 'bg-amber-100', icon: 'text-amber-600', bar: 'bg-amber-500' },
  }
  
  const colors = colorClasses[color]
  
  const getBarColor = () => {
    if (isUnlimited) return colors.bar
    if (percentage >= 90) return 'bg-rose-500'
    if (percentage >= 70) return 'bg-amber-500'
    return colors.bar
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <Icon className={cn('h-4 w-4', colors.icon)} />
          </div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {safeUsed.toLocaleString('fr-FR')}
          </span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
          <span className="text-sm text-gray-400 ml-1">
            / {isUnlimited ? '∞' : safeMax.toLocaleString('fr-FR')}{unit ? ` ${unit}` : ''}
          </span>
        </div>
        
        {!isUnlimited && (
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn('h-full rounded-full transition-all', getBarColor())}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className={cn(
              'text-xs mt-1',
              percentage >= 90 ? 'text-rose-600' : percentage >= 70 ? 'text-amber-600' : 'text-gray-500'
            )}>
              {percentage}% utilisé
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PlanCardProps {
  plan: Plan
  isCurrentPlan: boolean
  billingPeriod: 'monthly' | 'yearly'
  onSelect: () => void
}

function PlanCard({ plan, isCurrentPlan, billingPeriod, onSelect }: PlanCardProps) {
  const PlanIcon = plan.icon
  const price = billingPeriod === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.price
  
  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all',
        plan.highlighted && 'ring-2 ring-blue-500 shadow-lg',
        isCurrentPlan && 'bg-blue-50 border-blue-200'
      )}
    >
      {plan.highlighted && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
          Populaire
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-br-lg">
          Actuel
        </div>
      )}
      <CardContent className="p-5 pt-8">
        <div className="flex items-center gap-2 mb-2">
          <PlanIcon className={cn('h-5 w-5', plan.highlighted ? 'text-blue-600' : 'text-gray-600')} />
          <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        </div>
        <p className="text-xs text-gray-500">{plan.description}</p>
        
        <div className="mt-4">
          <span className="text-3xl font-bold text-gray-900">{price}€</span>
          <span className="text-sm text-gray-500">/mois</span>
          {billingPeriod === 'yearly' && (
            <p className="text-xs text-emerald-600 mt-1">
              {plan.yearlyPrice}€/an (économisez {plan.price * 12 - plan.yearlyPrice}€)
            </p>
          )}
        </div>
        
        <ul className="mt-4 space-y-2">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className={cn('h-4 w-4 shrink-0', plan.highlighted ? 'text-blue-500' : 'text-emerald-500')} />
              {feature}
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full mt-6"
          variant={isCurrentPlan ? 'outline' : plan.highlighted ? 'default' : 'outline'}
          disabled={isCurrentPlan}
          onClick={onSelect}
        >
          {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
        </Button>
      </CardContent>
    </Card>
  )
}

function TeamMembersCard({ cabinet, router }: { cabinet: any; router: any }) {
  const formatQuota = (value: number) => value === -1 ? '∞' : value.toLocaleString('fr-FR')
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            Membres de l'équipe ({cabinet.usage.users}/{formatQuota(cabinet.quotas.maxUsers)})
          </h3>
          {cabinet.usage.users < cabinet.quotas.maxUsers && (
            <Button 
              size="sm" 
              onClick={() => router.push('/dashboard/settings/users')}
              className="gap-2"
            >
              Ajouter un membre
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {cabinet.users.slice(0, 5).map((member: any) => (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={member.role === 'ADMIN' ? 'primary' : 'default'} 
                  size="sm"
                >
                  {member.role === 'ADMIN' ? 'Admin' : member.role === 'ADVISOR' ? 'Conseiller' : 'Assistant'}
                </Badge>
                <Badge 
                  variant={member.isActive ? 'success' : 'default'} 
                  size="xs"
                >
                  {member.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {cabinet.users.length > 5 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-4"
            onClick={() => router.push('/dashboard/settings/users')}
          >
            Voir tous les membres ({cabinet.users.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        
        {cabinet.usage.users >= cabinet.quotas.maxUsers && cabinet.quotas.maxUsers !== -1 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Quota atteint</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Passez à un plan supérieur pour ajouter plus de membres.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
