'use client'

/**
 * Client Portal - Mon Patrimoine
 * 
 * Vue détaillée du patrimoine client:
 * - Synthèse actifs/passifs
 * - Répartition par catégorie
 * - Liste des actifs
 * - Liste des passifs
 */

import { useMemo, useState } from 'react'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientPatrimoine } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Home,
  Wallet,
  Building2,
  Car,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'

// Structure vide par défaut
const EMPTY_DATA = {
  summary: {
    totalActifs: 0,
    totalPassifs: 0,
    netWealth: 0,
    evolution: null,
    lastCalculated: null,
  },
  actifs: {
    total: 0,
    count: 0,
    byCategory: [],
  },
  passifs: {
    total: 0,
    count: 0,
    byType: [],
  },
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  IMMOBILIER: { icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  FINANCIER: { icon: Wallet, color: 'text-green-600', bgColor: 'bg-green-100' },
  PROFESSIONNEL: { icon: Building2, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  AUTRES: { icon: Car, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

const PASSIF_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  CREDIT_IMMOBILIER: { label: 'Crédit immobilier', color: 'bg-blue-100 text-blue-700' },
  CREDIT_CONSO: { label: 'Crédit consommation', color: 'bg-orange-100 text-orange-700' },
  AUTRE: { label: 'Autre', color: 'bg-gray-100 text-gray-700' },
}

export default function PatrimoinePage() {
  const { user } = useAuth()
  const { data: apiData, isLoading, refetch } = useClientPatrimoine(user?.id || '')
  const [activeTab, setActiveTab] = useState('overview')

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
        <h1 className="text-2xl font-bold text-gray-900">Mon Patrimoine</h1>
        <p className="text-gray-500 mt-1">Vue d'ensemble de votre situation patrimoniale</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Actifs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Actifs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.summary.totalActifs)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.actifs.count} actifs
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passifs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Passifs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.summary.totalPassifs)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.passifs.count} crédits
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patrimoine Net */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Patrimoine Net</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(data.summary.netWealth)}
                </p>
                {data.summary.evolution && (
                  <div className="flex items-center gap-1 mt-1">
                    {data.summary.evolution.trend === 'UP' ? (
                      <TrendingUp className="h-4 w-4 text-green-300" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-300" />
                    )}
                    <span className="text-sm text-green-300">
                      +{data.summary.evolution.percentage}%
                    </span>
                  </div>
                )}
              </div>
              <Briefcase className="h-12 w-12 text-blue-300 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="actifs">Actifs</TabsTrigger>
          <TabsTrigger value="passifs">Passifs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Répartition Actifs */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.actifs.byCategory.map((cat: { category: string; total: number; count: number; percentage: number; items: Array<{ id: string; name: string; currentValue: number; category: string }> }) => {
                  const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.AUTRES
                  const Icon = config.icon

                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {cat.category.charAt(0) + cat.category.slice(1).toLowerCase()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {cat.count} actif(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(cat.total)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {cat.percentage}%
                          </p>
                        </div>
                      </div>
                      <Progress value={cat.percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actifs Tab */}
        <TabsContent value="actifs" className="space-y-6">
          {data.actifs.byCategory.map((cat: { category: string; total: number; count: number; percentage: number; items: Array<{ id: string; name: string; currentValue: number; category: string }> }) => {
            const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.AUTRES
            const Icon = config.icon

            return (
              <Card key={cat.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`h-8 w-8 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    {cat.category.charAt(0) + cat.category.slice(1).toLowerCase()}
                    <Badge variant="secondary" className="ml-2">
                      {formatCurrency(cat.total)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.currentValue)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Passifs Tab */}
        <TabsContent value="passifs" className="space-y-6">
          {data.passifs.byType.map((type: { type: string; total: number; items: Array<{ id: string; name: string; currentValue: number; type: string; monthlyPayment?: number }> }) => {
            const config = PASSIF_TYPE_CONFIG[type.type] || PASSIF_TYPE_CONFIG.AUTRE

            return (
              <Card key={type.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    {config.label}
                    <Badge className={config.color}>
                      {formatCurrency(type.total)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {type.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.monthlyPayment && (
                            <p className="text-sm text-gray-500">
                              Mensualité: {formatCurrency(item.monthlyPayment)}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold text-red-600">
                          -{formatCurrency(item.currentValue)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {data.passifs.count === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun passif enregistré</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
