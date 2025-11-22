import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Zap, Plus } from 'lucide-react'

export default function CampagnesActivesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campagnes en cours</h1>
          <p className="text-muted-foreground">Suivi des actions actives</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune campagne active</h3>
          <p className="text-muted-foreground mb-4">
            Créez votre première campagne marketing
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer une campagne
          </Button>
        </div>
      </Card>
    </div>
  )
}
