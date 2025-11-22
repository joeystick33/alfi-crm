import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Sparkles, Plus } from 'lucide-react'

export default function ScenariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scénarios automatiques</h1>
          <p className="text-muted-foreground">Workflows et automation</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau scénario
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun scénario configuré</h3>
          <p className="text-muted-foreground mb-4">
            Automatisez vos actions récurrentes avec des scénarios
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer un scénario
          </Button>
        </div>
      </Card>
    </div>
  )
}
