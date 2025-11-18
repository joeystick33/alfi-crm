import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DollarSign, Plus, Download } from 'lucide-react'

export default function FacturationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturation</h1>
          <p className="text-muted-foreground">Historique des factures et paiements</p>
        </div>
        <div className="flex gap-2">
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total facturé</p>
          <p className="text-2xl font-bold">0 €</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="text-2xl font-bold">0 €</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Payé</p>
          <p className="text-2xl font-bold text-green-600">0 €</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
          <p className="text-muted-foreground">
            Vos factures apparaîtront ici
          </p>
        </div>
      </Card>
    </div>
  )
}
