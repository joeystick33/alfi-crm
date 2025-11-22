import { Card } from '@/components/ui/Card'
import { AlertTriangle } from 'lucide-react'

export default function KYCManquantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents manquants</h1>
        <p className="text-muted-foreground">Pièces à collecter</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun document manquant</h3>
          <p className="text-muted-foreground">
            Tous les documents requis sont à jour
          </p>
        </div>
      </Card>
    </div>
  )
}
