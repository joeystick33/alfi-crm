import { Card } from '@/components/ui/Card'
import { Shield } from 'lucide-react'

export default function AssuranceViePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Simulateur Assurance Vie</h1>
        <p className="text-muted-foreground">Allocation et bénéficiaires</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Simulateur en développement</h3>
          <p className="text-muted-foreground">
            Cette fonctionnalité sera bientôt disponible
          </p>
        </div>
      </Card>
    </div>
  )
}
