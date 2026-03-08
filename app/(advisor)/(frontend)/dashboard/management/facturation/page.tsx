'use client'

/**
 * Facturation Cabinet - Vue Admin
 * 
 * Gestion de la facturation globale:
 * - Vue d'ensemble des factures
 * - Facturation par conseiller
 * - Commissions et honoraires
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import {
  ArrowLeft,
  Euro,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  PieChart,
  Plus,
  Eye,
  Send,
  Printer,
} from 'lucide-react'

interface FactureData {
  id: string
  numero: string
  client: { id: string; firstName: string; lastName: string }
  conseiller: { id: string; firstName: string; lastName: string }
  montant: number
  type: 'HONORAIRES' | 'COMMISSION' | 'FRAIS'
  status: 'BROUILLON' | 'ENVOYE' | 'PAYEE' | 'EN_RETARD'
  dateEmission: string
  dateEcheance: string
  datePaiement?: string
}

interface ConseillerFacturation {
  id: string
  firstName: string
  lastName: string
  totalFacture: number
  totalPaye: number
  totalEnAttente: number
  nbFactures: number
}

interface FacturationStats {
  totalCA: number
  totalPaye: number
  totalEnAttente: number
  totalEnRetard: number
  nbFactures: number
  nbPayees: number
  nbEnAttente: number
  nbEnRetard: number
  trendCA: number
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700', icon: Send },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export default function FacturationPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState<FacturationStats | null>(null)
  const [factures, setFactures] = useState<FactureData[]>([])
  const [conseillers, setConseillers] = useState<ConseillerFacturation[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/advisor/management/facturation?period=${period}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `Erreur ${response.status}`)
      }

      const result = await response.json()
      const data = result.data || result

      // Map API stats to local format
      setStats({
        totalCA: data.stats?.totalCA || 0,
        totalPaye: data.stats?.paidAmount || 0,
        totalEnAttente: data.stats?.pendingAmount || 0,
        totalEnRetard: data.stats?.overdueAmount || 0,
        nbFactures: data.stats?.invoiceCount || 0,
        nbPayees: data.stats?.paidCount || 0,
        nbEnAttente: data.stats?.pendingCount || 0,
        nbEnRetard: 0,
        trendCA: 0,
      })

      // Map API invoices to local format
      const apiInvoices = data.invoices || []
      setFactures(apiInvoices.map((inv: any) => {
        const clientParts = inv.client?.split(' ') || []
        const conseillerParts = inv.conseiller?.split(' ') || []
        return {
          id: inv.id,
          numero: inv.invoiceNumber,
          client: {
            id: inv.clientId || '',
            firstName: clientParts[0] || '',
            lastName: clientParts.slice(1).join(' ') || '',
          },
          conseiller: {
            id: inv.conseillerId || '',
            firstName: conseillerParts[0] || '',
            lastName: conseillerParts.slice(1).join(' ') || '',
          },
          montant: inv.amountTTC || 0,
          type: 'HONORAIRES' as const,
          status: inv.status,
          dateEmission: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : '',
          dateEcheance: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
          datePaiement: inv.paidDate ? new Date(inv.paidDate).toISOString().split('T')[0] : undefined,
        }
      }))

      // Map conseillers
      const apiConseillers = data.facturationParConseiller || []
      setConseillers(apiConseillers.map((c: any) => {
        const nameParts = c.name?.split(' ') || []
        return {
          id: c.id,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          totalFacture: c.totalCA || 0,
          totalPaye: c.paid || 0,
          totalEnAttente: c.pending || 0,
          nbFactures: c.count || 0,
        }
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les données')
      setStats(null)
      setFactures([])
      setConseillers([])
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const filteredFactures = factures.filter(f => {
    const matchesSearch = searchQuery === '' || 
      f.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${f.client.firstName} ${f.client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Euro className="h-7 w-7 text-green-600" />
              Facturation
            </h1>
            <p className="text-gray-500 mt-1">Gestion des factures et commissions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">CA Total</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalCA)}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${stats.trendCA >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trendCA >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {stats.trendCA >= 0 ? '+' : ''}{stats.trendCA}% vs période précédente
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Euro className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Encaissé</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(stats.totalPaye)}</p>
                  <p className="text-sm text-gray-500 mt-2">{stats.nbPayees} factures</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En attente</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(stats.totalEnAttente)}</p>
                  <p className="text-sm text-gray-500 mt-2">{stats.nbEnAttente} factures</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En retard</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(stats.totalEnRetard)}</p>
                  <p className="text-sm text-gray-500 mt-2">{stats.nbEnRetard} factures</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="factures">Factures ({factures.length})</TabsTrigger>
          <TabsTrigger value="conseillers">Par conseiller</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Répartition par Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      <span>Honoraires</span>
                    </div>
                    <span className="font-medium">{formatCurrency(250000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded" />
                      <span>Commissions</span>
                    </div>
                    <span className="font-medium">{formatCurrency(200000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded" />
                      <span>Frais</span>
                    </div>
                    <span className="font-medium">{formatCurrency(37500)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Factures en retard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Factures en Retard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {factures.filter(f => f.status === 'EN_RETARD').map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{f.numero}</p>
                        <p className="text-sm text-gray-500">{f.client.firstName} {f.client.lastName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">{formatCurrency(f.montant)}</p>
                        <p className="text-xs text-red-500">Échue le {formatDate(f.dateEcheance)}</p>
                      </div>
                    </div>
                  ))}
                  {factures.filter(f => f.status === 'EN_RETARD').length === 0 && (
                    <p className="text-center text-gray-500 py-4">Aucune facture en retard</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="factures" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Toutes les Factures</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="DRAFT">Brouillons</SelectItem>
                      <SelectItem value="SENT">Envoyées</SelectItem>
                      <SelectItem value="PAID">Payées</SelectItem>
                      <SelectItem value="OVERDUE">En retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredFactures.map(facture => {
                  const StatusIcon = STATUS_CONFIG[facture.status].icon
                  return (
                    <div key={facture.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{facture.numero}</p>
                          <p className="text-sm text-gray-500">
                            {facture.client.firstName} {facture.client.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(facture.montant)}</p>
                          <p className="text-xs text-gray-500">
                            {facture.conseiller.firstName} {facture.conseiller.lastName}
                          </p>
                        </div>
                        <Badge className={STATUS_CONFIG[facture.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_CONFIG[facture.status].label}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conseillers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Facturation par Conseiller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conseillers.map(c => (
                  <div key={c.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{c.firstName} {c.lastName}</p>
                          <p className="text-sm text-gray-500">{c.nbFactures} factures</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(c.totalFacture)}</p>
                        <p className="text-sm text-gray-500">CA total</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-sm text-gray-500">Encaissé</p>
                        <p className="font-medium text-green-600">{formatCurrency(c.totalPaye)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">En attente</p>
                        <p className="font-medium text-blue-600">{formatCurrency(c.totalEnAttente)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Taux encaissement</p>
                        <p className="font-medium">{Math.round((c.totalPaye / c.totalFacture) * 100)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
