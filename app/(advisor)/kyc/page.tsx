import { Card } from '@/components/ui/Card'
import { FileCheck } from 'lucide-react'

export default function KYCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC clients</h1>
        <p className="text-muted-foreground">Questionnaires et mises à jour</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">KYC à jour</p>
          <p className="text-2xl font-bold text-green-600">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">À renouveler</p>
          <p className="text-2xl font-bold text-orange-600">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Expirés</p>
          <p className="text-2xl font-bold text-red-600">0</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestion KYC</h3>
          <p className="text-muted-foreground">
            Suivez la conformité de vos clients
          </p>
        </div>
      </Card>
    </div>
  )
}
