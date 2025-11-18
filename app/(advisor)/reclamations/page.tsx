import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Plus } from 'lucide-react'

export default function ReclamationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réclamations</h1>
          <p className="text-muted-foreground">Gestion SLA et traçabilité</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réclamation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">En cours</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Résolues</p>
          <p className="text-2xl font-bold text-green-600">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Délai moyen</p>
          <p className="text-2xl font-bold">0j</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune réclamation</h3>
          <p className="text-muted-foreground">
            Les réclamations clients apparaîtront ici
          </p>
        </div>
      </Card>
    </div>
  )
}
