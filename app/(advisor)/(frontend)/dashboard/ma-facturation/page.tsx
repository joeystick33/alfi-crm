'use client'

/**
 * Ma Facturation - Vue Conseiller
 * 
 * Gestion des factures personnelles:
 * - Mes honoraires et commissions
 * - Soumettre une facture au cabinet
 * - Historique de facturation
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useMaFacturation, useCreateMaFacture, useSubmitMaFacture } from '@/app/_common/hooks/use-api'
import type { ManagementStatsFilters } from '@/app/_common/lib/api-types'
import {
  Euro,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Eye,
  TrendingUp,
  Wallet,
  X,
  Save,
  Printer,
} from 'lucide-react'

interface MaFacture {
  id: string
  numero: string
  type: 'HONORAIRES' | 'COMMISSION'
  montant: number
  status: 'BROUILLON' | 'SUBMITTED' | 'APPROUVEE' | 'PAYEE' | 'REJETEE'
  client?: string | { id: string; firstName: string; lastName: string }
  description: string
  dateCreation: string
  dateSoumission?: string
  datePaiement?: string
}

interface MesStats {
  totalCA: number
  totalPaye: number
  totalEnAttente: number
  nbFactures: number
  nbPayees: number
  nbEnAttente: number
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SUBMITTED: { label: 'Soumise', color: 'bg-blue-100 text-blue-700', icon: Send },
  APPROVED: { label: 'Approuvée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PAID: { label: 'Payée', color: 'bg-emerald-100 text-emerald-700', icon: Euro },
  REJECTED: { label: 'Rejetée', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

const TYPE_CONFIG = {
  HONORAIRES: { label: 'Honoraires', color: 'bg-purple-100 text-purple-700' },
  COMMISSION: { label: 'Commission', color: 'bg-blue-100 text-blue-700' },
}


export default function MaFacturationPage() {
  const [period, setPeriod] = useState<ManagementStatsFilters['period']>('month')
  const [activeTab, setActiveTab] = useState('all')
  const [showNewForm, setShowNewForm] = useState(false)

  // New facture form state
  const [newType, setNewType] = useState<'COMMISSION' | 'HONORAIRES'>('COMMISSION')
  const [newClientId, setNewClientId] = useState('')
  const [newMontant, setNewMontant] = useState('')
  const [newDescription, setNewDescription] = useState('')

  // Fetch data from API
  const { data: apiData, isLoading, refetch } = useMaFacturation({
    period,
    status: activeTab !== 'all' ? activeTab : undefined
  })
  const createFactureMutation = useCreateMaFacture()

  // Map API data with fallback
  const stats: MesStats = useMemo(() => {
    if (apiData?.stats) {
      const s = apiData.stats as any
      return {
        totalCA: s.totalCA || 0,
        totalPaye: s.totalPaye || 0,
        totalEnAttente: s.totalEnAttente || 0,
        nbFactures: s.nbFactures || 0,
        nbPayees: s.nbPayees || 0,
        nbEnAttente: s.nbEnAttente || 0,
      }
    }
    return { totalCA: 0, totalPaye: 0, totalEnAttente: 0, nbFactures: 0, nbPayees: 0, nbEnAttente: 0 }
  }, [apiData])

  const factures: MaFacture[] = useMemo(() => {
    if (apiData?.factures && apiData.factures.length > 0) {
      return apiData.factures.map((f: any) => ({
        id: f.id,
        numero: f.numero,
        type: f.type as MaFacture['type'],
        montant: f.montant,
        status: f.status as MaFacture['status'],
        client: f.client,
        description: f.description,
        dateCreation: f.dateCreation,
        dateSoumission: f.dateSoumission,
        datePaiement: f.datePaiement,
      }))
    }
    return []
  }, [apiData])

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

  const filteredFactures = activeTab === 'all'
    ? factures
    : factures.filter(f => f.status === activeTab)

  const submitMutation = useSubmitMaFacture()

  const handleSubmitFacture = async (factureId: string) => {
    submitMutation.mutate({ factureId, action: 'submit' })
  }

  const handleCancelFacture = async (factureId: string) => {
    submitMutation.mutate({ factureId, action: 'cancel' })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Euro className="h-7 w-7 text-green-600" />
            Ma Facturation
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos honoraires et commissions</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as ManagementStatsFilters['period'])}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Encaissé</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalPaye)}</p>
                  <p className="text-sm text-white/60 mt-2">{stats.nbPayees} factures payées</p>
                </div>
                <Wallet className="h-12 w-12 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En attente</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(stats.totalEnAttente)}</p>
                  <p className="text-sm text-gray-500 mt-2">{stats.nbEnAttente} factures</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">CA Total</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalCA)}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    +12% vs mois dernier
                  </div>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Euro className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({factures.length})</TabsTrigger>
          <TabsTrigger value="DRAFT">Brouillons ({factures.filter(f => f.status === 'BROUILLON').length})</TabsTrigger>
          <TabsTrigger value="SUBMITTED">Soumises ({factures.filter(f => f.status === 'SUBMITTED').length})</TabsTrigger>
          <TabsTrigger value="PAID">Payées ({factures.filter(f => f.status === 'PAYEE').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredFactures.map(facture => {
                  const StatusIcon = STATUS_CONFIG[facture.status].icon

                  return (
                    <div key={facture.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{facture.numero}</span>
                              <Badge className={TYPE_CONFIG[facture.type].color}>
                                {TYPE_CONFIG[facture.type].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{facture.description}</p>
                            {facture.client && (
                              <p className="text-sm text-gray-500 mt-1">
                                Client: {typeof facture.client === 'string'
                                  ? facture.client
                                  : `${facture.client.firstName} ${facture.client.lastName}`}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xl font-bold">{formatCurrency(facture.montant)}</p>
                            <p className="text-xs text-gray-500">
                              Créée le {formatDate(facture.dateCreation)}
                            </p>
                          </div>

                          <Badge className={STATUS_CONFIG[facture.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[facture.status].label}
                          </Badge>

                          <div className="flex items-center gap-1">
                            {facture.status === 'BROUILLON' && (
                              <Button
                                size="sm"
                                onClick={() => handleSubmitFacture(facture.id)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Soumettre
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredFactures.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune facture dans cette catégorie</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nouvelle Facture */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nouvelle Facture</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Créez une facture qui sera soumise au cabinet pour validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!newMontant) return
                await createFactureMutation.mutateAsync({
                  type: newType,
                  clientId: newClientId || undefined,
                  montant: parseFloat(newMontant),
                  description: newDescription.trim(),
                })
                setNewType('COMMISSION')
                setNewClientId('')
                setNewMontant('')
                setNewDescription('')
                setShowNewForm(false)
                refetch()
              }} className="space-y-4">
                <div>
                  <Label>Type de facturation</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as typeof newType)}
                  >
                    <option value="COMMISSION">Commission</option>
                    <option value="HONORAIRES">Honoraires</option>
                  </select>
                </div>

                <div>
                  <Label>Client concerné</Label>
                  <Input
                    placeholder="Nom du client"
                    className="mt-1"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Montant (€) *</Label>
                  <Input
                    type="number"
                    placeholder="1500"
                    className="mt-1"
                    value={newMontant}
                    onChange={(e) => setNewMontant(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Ex: Commission placement assurance vie 100 000€"
                    rows={3}
                    className="mt-1"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> La facture sera créée en brouillon.
                    Vous pourrez la soumettre au cabinet une fois prête.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowNewForm(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createFactureMutation.isPending || !newMontant}>
                    {createFactureMutation.isPending ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Créer brouillon
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
