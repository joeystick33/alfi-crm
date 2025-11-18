import { Card } from '@/components/ui/Card'
import { Archive } from 'lucide-react'

export default function DossiersArchivesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dossiers archivés</h1>
        <p className="text-muted-foreground">Historique et missions terminées</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Archive className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun dossier archivé</h3>
          <p className="text-muted-foreground">
            Les dossiers terminés apparaîtront ici
          </p>
        </div>
      </Card>
    </div>
  )
}
