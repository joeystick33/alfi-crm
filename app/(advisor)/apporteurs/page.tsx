import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Plus } from 'lucide-react'

export default function ApporteursPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Apporteurs d'affaires</h1>
          <p className="text-muted-foreground">Gestion des partenaires et commissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel apporteur
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun apporteur d'affaires</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter vos partenaires et apporteurs d'affaires
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un apporteur
          </Button>
        </div>
      </Card>
    </div>
  )
}
