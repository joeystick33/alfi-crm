'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useInvoices, useInvoiceStats } from '@/app/_common/hooks/use-api'
import {
  Plus,
  Search,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/app/_common/lib/utils'

const STATUS_CONFIG = {
  DRAFT: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-700 border-green-200' },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700 border-red-200' },
  ANNULE: { label: 'Annulée', color: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export default function FacturationPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'ALL',
    search: '',
  })

  const apiFilters = useMemo(() => {
    const f: any = {}
    if (filters.status !== 'ALL') f.status = filters.status
    if (filters.search) f.search = filters.search
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useInvoices(apiFilters)
  const { data: statsData } = useInvoiceStats(apiFilters)

  // API returns { data: { data: invoices[], total, ... }, timestamp }
   
  const invoicesResponse = (data as any)?.data
  const invoices = Array.isArray(invoicesResponse?.data) ? invoicesResponse.data : []
  
  // Extract stats from API response wrapper { data: stats, timestamp }
   
  const statsResponse = (statsData as any)?.data || statsData
  const stats = statsResponse || {
    totalAmountTTC: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    total: 0,
    paid: 0,
    overdue: 0,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleResetFilters = () => {
    setFilters({ status: 'ALL', search: '' })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Facturation</h1>
          <p className="text-slate-600 mt-1">
            Historique des factures et paiements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => router.push('/dashboard/facturation/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total facturé</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalAmountTTC)}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">En attente</p>
              <p className="text-2xl font-bold mt-1 text-orange-600">{formatCurrency(stats.pendingAmount)}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Payé</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(stats.paidAmount)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">En retard</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(stats.overdueAmount)}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par numéro, client..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="DRAFT">Brouillons</SelectItem>
              <SelectItem value="SENT">Envoyées</SelectItem>
              <SelectItem value="PAID">Payées</SelectItem>
              <SelectItem value="OVERDUE">En retard</SelectItem>
              <SelectItem value="CANCELLED">Annulées</SelectItem>
            </SelectContent>
          </Select>

          {(filters.search || filters.status !== 'ALL') && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement des factures</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Réessayer
            </Button>
          </div>
        </Card>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune facture"
          description={
            filters.search || filters.status !== 'ALL'
              ? 'Aucune facture ne correspond à vos critères de recherche.'
              : 'Commencez par créer votre première facture.'
          }
          action={
            !filters.search && filters.status === 'ALL'
              ? {
                  label: 'Nouvelle facture',
                  onClick: () => router.push('/dashboard/facturation/new'),
                  icon: Plus,
                }
              : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">N° Facture</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Montant TTC</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((invoice: any) => {
                  const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || {
                    label: invoice.status || 'Inconnu',
                    color: 'bg-slate-100 text-slate-700 border-slate-200'
                  }
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {invoice.client.firstName} {invoice.client.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(new Date(invoice.issueDate))}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {formatCurrency(Number(invoice.amountTTC))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${statusConfig.color} text-xs border`}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/facturation/${invoice.id}`)}
                        >
                          Voir
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
