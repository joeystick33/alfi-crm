import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserCog, Plus } from 'lucide-react'

export default function ConseillersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des conseillers</h1>
          <p className="text-muted-foreground">Créer et gérer les accès des conseillers</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau conseiller
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun conseiller</h3>
          <p className="text-muted-foreground mb-4">
            Ajoutez des conseillers à votre cabinet
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un conseiller
          </Button>
        </div>
      </Card>
    </div>
  )
}
