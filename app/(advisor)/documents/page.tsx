import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, Plus, Upload } from 'lucide-react'

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents & GED</h1>
          <p className="text-muted-foreground">Bibliothèque centralisée</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par importer vos documents
          </p>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Importer des documents
          </Button>
        </div>
      </Card>
    </div>
  )
}
