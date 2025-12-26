 
'use client'

/**
 * Client Portal Dashboard
 * 
 * Page d'accueil du portail client avec:
 * - Résumé patrimoine
 * - Prochains RDV
 * - Objectifs en cours
 * - Activité récente
 * - Documents récents
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientDashboard } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import {
  Briefcase,
  Target,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

// Structure des données vides par défaut
const EMPTY_DATA = {
  client: { firstName: '', lastName: '' },
  wealth: {
    total: 0,
    actifs: 0,
    passifs: 0,
    evolution: null,
    byCategory: [],
  },
  stats: {
    documents: { total: 0, recent: 0 },
    nextAppointment: null,
    objectifs: { total: 0, achieved: 0, inProgress: 0 },
  },
  objectifs: [],
  recentActivity: [],
}

export default function ClientPortalDashboard() {
  const { user } = useAuth()
  const { data: apiData, isLoading, error, refetch } = useClientDashboard(user?.id || '')

  // Utiliser les données API ou structure vide
  const data = useMemo(() => {
    if (apiData) return apiData
    return EMPTY_DATA
  }, [apiData])

  const hasData = apiData !== null && apiData !== undefined

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return FileText
      case 'OBJECTIF': return Target
      case 'RENDEZ_VOUS': return Calendar
      case 'MESSAGE': return MessageSquare
      default: return Clock
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // État d'erreur
  if (error || !hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {user?.firstName || 'Client'} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenue dans votre espace personnel
          </p>
        </div>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Données temporairement indisponibles
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Nous n'avons pas pu charger vos informations. Cela peut être dû à une connexion instable ou à une maintenance en cours.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {data.client.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Bienvenue dans votre espace personnel
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patrimoine Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Patrimoine net</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(data.wealth.total)}
                </p>
                {data.wealth.evolution && (
                  <div className="flex items-center gap-1 mt-2">
                    {data.wealth.evolution.trend === 'UP' ? (
                      <TrendingUp className="h-4 w-4 text-green-300" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-300" />
                    )}
                    <span className={`text-sm ${data.wealth.evolution.trend === 'UP' ? 'text-green-300' : 'text-red-300'}`}>
                      {data.wealth.evolution.percentage}%
                    </span>
                  </div>
                )}
              </div>
              <Briefcase className="h-12 w-12 text-blue-300 opacity-80" />
            </div>
            <Link href="/portal/patrimoine">
              <Button variant="ghost" className="w-full mt-4 text-white hover:bg-blue-500">
                Voir le détail <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Objectifs Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Objectifs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data.stats.objectifs.achieved}/{data.stats.objectifs.total}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.stats.objectifs.inProgress} en cours
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Link href="/portal/objectifs">
              <Button variant="outline" className="w-full mt-4">
                Voir mes objectifs <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data.stats.documents.total}
                </p>
                {data.stats.documents.recent > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {data.stats.documents.recent} nouveau(x)
                  </Badge>
                )}
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Link href="/portal/documents">
              <Button variant="outline" className="w-full mt-4">
                Mes documents <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Appointment */}
          {data.stats.nextAppointment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Prochain rendez-vous
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {data.stats.nextAppointment.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(data.stats.nextAppointment.startDate)} à {formatTime(data.stats.nextAppointment.startDate)}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {data.stats.nextAppointment.isVirtual ? '📹 Visioconférence' : '🏢 Présentiel'}
                    </Badge>
                  </div>
                  <Link href="/portal/rendez-vous">
                    <Button>Voir les détails</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Objectifs Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Progression des objectifs
              </CardTitle>
              <Link href="/portal/objectifs">
                <Button variant="ghost" size="sm">
                  Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.objectifs.slice(0, 3).map((objectif: any) => (
                <div key={objectif.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{objectif.label}</span>
                    <span className="text-gray-500">{objectif.progress}%</span>
                  </div>
                  <Progress value={objectif.progress} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {formatCurrency(objectif.currentAmount)} / {formatCurrency(objectif.targetAmount)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Patrimoine Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Répartition du patrimoine
              </CardTitle>
              <Link href="/portal/patrimoine">
                <Button variant="ghost" size="sm">
                  Détails <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.wealth.byCategory.map((category: any) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ 
                          backgroundColor: 
                            category.category === 'IMMOBILIER' ? '#3B82F6' :
                            category.category === 'FINANCIER' ? '#10B981' :
                            category.category === 'PROFESSIONNEL' ? '#F59E0B' :
                            '#6B7280'
                        }}
                      />
                      <span className="text-sm text-gray-700">
                        {category.category.charAt(0) + category.category.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(category.total)}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({category.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((activity: any) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/portal/rendez-vous?action=new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Demander un RDV
                </Button>
              </Link>
              <Link href="/portal/messages?action=new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Envoyer un message
                </Button>
              </Link>
              <Link href="/portal/documents" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Voir mes documents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
