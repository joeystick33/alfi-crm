import { Card } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'

export default function PatrimoinePerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance</h1>
        <p className="text-muted-foreground">Analyse vs benchmarks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Performance YTD</p>
          <p className="text-2xl font-bold text-green-600">+0%</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">vs Benchmark</p>
          <p className="text-2xl font-bold">+0%</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Volatilité</p>
          <p className="text-2xl font-bold">0%</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyse de performance</h3>
          <p className="text-muted-foreground">
            Fonctionnalité en cours de développement
          </p>
        </div>
      </Card>
    </div>
  )
}
