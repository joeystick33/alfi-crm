import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Key, Plus } from 'lucide-react'

export default function AccesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des accès</h1>
          <p className="text-muted-foreground">Rôles, permissions et utilisateurs</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Key className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gestion des accès</h3>
          <p className="text-muted-foreground mb-4">
            Gérez les utilisateurs et leurs permissions
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>
      </Card>
    </div>
  )
}
