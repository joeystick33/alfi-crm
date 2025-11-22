import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserPlus, Plus, Filter } from 'lucide-react'

export default function ProspectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes prospects</h1>
          <p className="text-muted-foreground">Pipeline prospects et conversions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau prospect
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total prospects</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">En qualification</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">En négociation</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Taux conversion</p>
          <p className="text-2xl font-bold">0%</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun prospect</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter vos premiers prospects
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un prospect
          </Button>
        </div>
      </Card>
    </div>
  )
}
