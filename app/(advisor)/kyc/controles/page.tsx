import { Card } from '@/components/ui/Card'
import { Shield } from 'lucide-react'

export default function KYCControlesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contrôles ACPR</h1>
        <p className="text-muted-foreground">Audits et reporting</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Contrôles réglementaires</h3>
          <p className="text-muted-foreground">
            Suivi des contrôles ACPR et conformité
          </p>
        </div>
      </Card>
    </div>
  )
}
