import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Mail, Plus } from 'lucide-react'

export default function TemplatesEmailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates emails</h1>
          <p className="text-muted-foreground">Bibliothèque de modèles</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun template</h3>
          <p className="text-muted-foreground mb-4">
            Créez des templates pour gagner du temps
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer un template
          </Button>
        </div>
      </Card>
    </div>
  )
}
