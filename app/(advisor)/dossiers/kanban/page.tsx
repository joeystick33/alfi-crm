import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Layers, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DossiersKanbanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes dossiers</h1>
          <p className="text-muted-foreground">Vue Kanban - Organisation visuelle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/dossiers">
              <Layers className="h-4 w-4 mr-2" />
              Vue liste
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['À faire', 'En cours', 'En attente', 'Terminé'].map((status) => (
          <Card key={status} className="p-4">
            <h3 className="font-semibold mb-4">{status}</h3>
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucun dossier
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
