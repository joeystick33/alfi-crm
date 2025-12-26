 
'use client'

/**
 * Client Portal - Mes Objectifs
 * 
 * Suivi des objectifs financiers du client:
 * - Vue d'ensemble des objectifs
 * - Progression avec visualisation
 * - Projets en cours
 * 
 * UX Pédagogique:
 * - Explications claires de ce qu'est un objectif
 * - Visualisation simple de la progression
 * - Conseils pour atteindre les objectifs
 * - Terminologie accessible
 */

import { useMemo, useState } from 'react'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientObjectifs } from '@/app/_common/hooks/use-api'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import {
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Info,
  HelpCircle,
  Calendar,
  Euro,
  Sparkles,
  Home,
  GraduationCap,
  Plane,
  Umbrella,
  PiggyBank,
  Heart,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

// Structure vide par défaut
const EMPTY_STATS = {
  total: 0,
  achieved: 0,
  inProgress: 0,
  totalTargetAmount: 0,
  totalCurrentAmount: 0,
  globalProgress: 0,
}

// Configuration des types d'objectifs avec icônes et explications pédagogiques
const OBJECTIF_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string; explanation: string }> = {
  RETRAITE: { 
    icon: Umbrella, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100', 
    label: 'Retraite',
    explanation: 'Un capital pour maintenir votre niveau de vie après votre carrière'
  },
  TRANSMISSION: { 
    icon: Heart, 
    color: 'text-pink-600', 
    bgColor: 'bg-pink-100', 
    label: 'Transmission',
    explanation: 'Préparer l\'avenir de vos proches (enfants, petits-enfants)'
  },
  PRECAUTION: { 
    icon: PiggyBank, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100', 
    label: 'Épargne de précaution',
    explanation: 'Une réserve d\'argent disponible en cas d\'imprévu'
  },
  IMMOBILIER: { 
    icon: Home, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100', 
    label: 'Projet immobilier',
    explanation: 'Acquisition d\'un bien immobilier (résidence, investissement)'
  },
  ETUDES: { 
    icon: GraduationCap, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100', 
    label: 'Études',
    explanation: 'Financer les études de vos enfants ou les vôtres'
  },
  VOYAGE: { 
    icon: Plane, 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-100', 
    label: 'Voyage',
    explanation: 'Réaliser un voyage important ou un projet de loisirs'
  },
}

const STATUS_CONFIG = {
  ACHIEVED: { label: 'Atteint 🎉', color: 'bg-green-100 text-green-700', description: 'Objectif réalisé' },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700', description: 'Progression régulière' },
  AT_RISK: { label: 'À surveiller', color: 'bg-orange-100 text-orange-700', description: 'Progression insuffisante' },
  NOT_STARTED: { label: 'À démarrer', color: 'bg-gray-100 text-gray-700', description: 'Pas encore commencé' },
}

export default function ObjectifsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('objectifs')
  const [selectedObjectif, setSelectedObjectif] = useState<string | null>(null)

  const { data: apiData, isLoading, refetch } = useClientObjectifs(user?.id || '')

  const objectifs = useMemo(() => {
    if (apiData?.objectifs) return apiData.objectifs
    return []
  }, [apiData])

  const projets = useMemo(() => {
    if (apiData?.projets) return apiData.projets
    return []
  }, [apiData])

  const stats = useMemo(() => {
    if (apiData?.stats) return apiData.stats
    return EMPTY_STATS
  }, [apiData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
    })
  }

  const getYearsRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const years = Math.ceil((target.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return years > 0 ? years : 0
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Objectifs</h1>
        <p className="text-gray-500 mt-1">
          Suivez la progression vers vos objectifs de vie
        </p>
      </div>

      {/* Info Box - Pédagogique */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Qu'est-ce qu'un objectif patrimonial ?</p>
            <p className="text-blue-700 mt-1">
              Un objectif, c'est un <strong>projet de vie chiffré</strong> : épargner pour la retraite, 
              financer les études de vos enfants, constituer un apport immobilier... 
              Votre conseiller vous aide à définir le montant et la stratégie pour l'atteindre.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Objectifs définis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.achieved}</p>
                <p className="text-sm text-gray-500">Objectifs atteints</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-sm text-gray-500">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-4">
            <div>
              <p className="text-blue-100 text-sm">Progression globale</p>
              <p className="text-2xl font-bold mt-1">{stats.globalProgress}%</p>
              <Progress value={stats.globalProgress} className="h-2 mt-2 bg-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="objectifs">Mes Objectifs</TabsTrigger>
          <TabsTrigger value="projets">Mes Projets</TabsTrigger>
        </TabsList>

        {/* Objectifs Tab */}
        <TabsContent value="objectifs" className="space-y-4">
          {objectifs.map((obj: any) => {
            const typeConfig = OBJECTIF_TYPE_CONFIG[obj.type] || OBJECTIF_TYPE_CONFIG.PRECAUTION
            const statusConfig = STATUS_CONFIG[obj.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.EN_COURS
            const Icon = typeConfig.icon
            const yearsRemaining = getYearsRemaining(obj.targetDate)

            return (
              <Card key={obj.id} className={selectedObjectif === obj.id ? 'ring-2 ring-blue-500' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left: Icon and Main Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-14 w-14 ${typeConfig.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-7 w-7 ${typeConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">{obj.label}</h3>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                        
                        {/* Progress Bar with Labels */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">
                              <strong className="text-gray-900">{formatCurrency(obj.currentAmount)}</strong> épargnés
                            </span>
                            <span className="text-gray-500">
                              Objectif: {formatCurrency(obj.targetAmount)}
                            </span>
                          </div>
                          <Progress 
                            value={obj.progress} 
                            className={`h-3 ${obj.progress >= 100 ? 'bg-green-100' : ''}`} 
                          />
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {obj.progress}% atteint
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {yearsRemaining > 0 ? `${yearsRemaining} ans restants` : 'Échéance atteinte'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Details Card */}
                    <div className="lg:w-64 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Versement mensuel</span>
                        <span className="font-semibold text-gray-900">
                          {obj.monthlyContribution > 0 ? formatCurrency(obj.monthlyContribution) : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Il vous reste</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(obj.targetAmount - obj.currentAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Horizon</span>
                        <span className="font-medium text-gray-900">{formatDate(obj.targetDate)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => setSelectedObjectif(selectedObjectif === obj.id ? null : obj.id)}
                      >
                        {selectedObjectif === obj.id ? 'Masquer' : 'Plus de détails'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedObjectif === obj.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Explanation Card */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Comprendre cet objectif
                          </h4>
                          <p className="text-sm text-blue-700 mt-2">
                            {typeConfig.explanation}
                          </p>
                        </div>

                        {/* Tips Card */}
                        <div className="p-4 bg-amber-50 rounded-lg">
                          <h4 className="font-medium text-amber-900 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Conseil pour atteindre cet objectif
                          </h4>
                          <p className="text-sm text-amber-700 mt-2">
                            {obj.progress < 50 
                              ? 'Augmenter légèrement vos versements mensuels pourrait accélérer votre progression.'
                              : obj.progress < 80
                              ? 'Vous êtes sur la bonne voie ! Maintenez ce rythme d\'épargne.'
                              : 'Excellent travail ! Votre objectif est presque atteint.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {objectifs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">Aucun objectif défini</p>
                <p className="text-gray-500 text-sm mt-1">
                  Contactez votre conseiller pour définir vos objectifs patrimoniaux
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Projets Tab */}
        <TabsContent value="projets" className="space-y-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Quelle différence entre objectif et projet ?</p>
                <p className="text-amber-700 mt-1">
                  Un <strong>objectif</strong> est un montant précis à atteindre avec un suivi régulier. 
                  Un <strong>projet</strong> est une idée en cours d'étude qui deviendra peut-être un objectif.
                </p>
              </div>
            </CardContent>
          </Card>

          {projets.map((projet: any) => {
            const typeConfig = OBJECTIF_TYPE_CONFIG[projet.type] || OBJECTIF_TYPE_CONFIG.IMMOBILIER
            const Icon = typeConfig.icon

            return (
              <Card key={projet.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 ${typeConfig.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{projet.label}</h3>
                        <Badge variant="outline">{projet.status === 'EN_ETUDE' ? 'En étude' : projet.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{projet.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          Budget estimé: {formatCurrency(projet.budget)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Horizon: {projet.horizon}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {projets.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">Aucun projet en cours</p>
                <p className="text-gray-500 text-sm mt-1">
                  Parlez de vos projets à votre conseiller lors de votre prochain rendez-vous
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
