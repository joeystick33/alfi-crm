import { Card } from '@/components/ui/Card'
import { TrendingUpDown } from 'lucide-react'

export default function PatrimoineArbitragesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Arbitrages suggérés</h1>
        <p className="text-muted-foreground">Alertes et recommandations IA</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUpDown className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun arbitrage suggéré</h3>
          <p className="text-muted-foreground">
            Les recommandations d'arbitrage apparaîtront ici
          </p>
        </div>
      </Card>
    </div>
  )
}
