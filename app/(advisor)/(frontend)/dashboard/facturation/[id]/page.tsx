'use client'

import { useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/_common/components/ui/DropdownMenu'
import { useInvoice } from '@/app/_common/hooks/use-api'
import { ArrowLeft, FileText, Download, Printer, AlertCircle, ChevronDown } from 'lucide-react'
import { formatDate } from '@/app/_common/lib/utils'
import {
  exportInvoiceToPDF,
  exportInvoiceToWord,
  exportInvoiceToExcel,
  prepareInvoiceForExport,
} from '@/app/_common/lib/invoice-export'

const STATUS_CONFIG = {
  DRAFT: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-700 border-green-200' },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700 border-red-200' },
  ANNULE: { label: 'Annulée', color: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: invoiceId } = use(params)
  const { data, isLoading, error, refetch } = useInvoice(invoiceId)

  // API retourne { data: invoice, timestamp }
   
  const invoice = (data as any)?.data

  const totals = useMemo(() => {
    if (!invoice) {
      return { amountHT: 0, tva: 0, amountTTC: 0 }
    }
    return {
      amountHT: Number(invoice.amountHT || 0),
      tva: Number(invoice.tva || 0),
      amountTTC: Number(invoice.amountTTC || 0),
    }
  }, [invoice])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  if (!invoiceId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Facture introuvable"
          description="Identifiant manquant. Revenez à la liste pour sélectionner une facture."
          action={{ label: 'Retour', onClick: () => router.push('/dashboard/facturation'), icon: ArrowLeft }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 print:p-0 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/facturation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Détail de la facture</h1>
            <p className="text-slate-600">#{invoice?.invoiceNumber || invoiceId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!invoice}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (invoice) {
                    const exportData = prepareInvoiceForExport(invoice)
                    exportInvoiceToPDF(exportData)
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exporter en PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (invoice) {
                    const exportData = prepareInvoiceForExport(invoice)
                    exportInvoiceToWord(exportData)
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exporter en Word (.doc)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (invoice) {
                    const exportData = prepareInvoiceForExport(invoice)
                    exportInvoiceToExcel(exportData)
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exporter en Excel (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 print:hidden">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-red-600 print:hidden">
          <p>Erreur lors du chargement de la facture.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      ) : !invoice ? (
        <EmptyState
          className="print:hidden"
          icon={FileText}
          title="Facture introuvable"
          description="Cette facture n'existe pas ou a été supprimée."
          action={{ label: 'Retour', onClick: () => router.push('/dashboard/facturation'), icon: ArrowLeft }}
        />
      ) : (
        <div className="space-y-6 print:space-y-4">
          <Card className="print:shadow-none print:border-0">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:flex-row print:items-center">
              <div>
                <CardTitle className="text-xl">Facture #{invoice.invoiceNumber}</CardTitle>
                <p className="text-sm text-slate-500">Émise le {formatDate(new Date(invoice.issueDate))}</p>
              </div>
              <Badge className={`${STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG]?.color || 'bg-slate-100'} text-xs border print:border-gray-300 print:bg-white print:text-black`}>
                {STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG]?.label || invoice.status}
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Client</p>
                <p className="font-medium text-slate-900">
                  {invoice.client?.firstName} {invoice.client?.lastName}
                </p>
                <p className="text-sm text-slate-600">{invoice.client?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Conseiller</p>
                <p className="font-medium text-slate-900">
                  {invoice.conseiller?.firstName} {invoice.conseiller?.lastName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Échéance</p>
                <p className="font-medium text-slate-900">
                  {invoice.dueDate ? formatDate(new Date(invoice.dueDate)) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-0">
            <CardHeader>
              <CardTitle>Lignes de facture</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 print:bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2">Description</th>
                    <th className="text-right px-4 py-2">Quantité</th>
                    <th className="text-right px-4 py-2">Prix unitaire</th>
                    <th className="text-right px-4 py-2">TVA</th>
                    <th className="text-right px-4 py-2">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items?.length ? (
                    invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                        <td className="px-4 py-2 font-medium text-slate-900">{item.description}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                        <td className="px-4 py-2 text-right">{item.tva}%</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(Number(item.totalTTC))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-4 text-center text-slate-500" colSpan={5}>
                        Aucune ligne de facture
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
            <Card className="print:shadow-none print:border-0">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {invoice.notes ? (
                  <p className="text-sm text-slate-700 whitespace-pre-line">{invoice.notes}</p>
                ) : (
                  <p className="text-sm text-slate-400">Aucune note interne</p>
                )}
              </CardContent>
            </Card>

            <Card className="print:shadow-none print:border-0">
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Montant HT</span>
                    <span className="font-medium">{formatCurrency(totals.amountHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">TVA</span>
                    <span className="font-medium">{formatCurrency(totals.amountHT * (totals.tva / 100))}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2 print:border-gray-300">
                    <span>Total TTC</span>
                    <span>{formatCurrency(totals.amountTTC)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
