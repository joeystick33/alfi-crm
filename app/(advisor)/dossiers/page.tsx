import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FolderOpen, Plus, Kanban } from 'lucide-react'
import Link from 'next/link'

export default function DossiersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes dossiers</h1>
          <p className="text-muted-foreground">Vue liste - Tous les dossiers actifs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/dossiers/kanban">
              <Kanban className="h-4 w-4 mr-2" />
              Vue Kanban
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun dossier actif</h3>
          <p className="text-muted-foreground mb-4">
            Créez votre premier dossier client
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer un dossier
          </Button>
        </div>
      </Card>
    </div>
  )
}
