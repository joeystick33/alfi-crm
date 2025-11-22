import { Card } from '@/components/ui/Card'
import { FileSignature } from 'lucide-react'

export default function DocumentsSignaturePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents à signer</h1>
        <p className="text-muted-foreground">Signature électronique en attente</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileSignature className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun document en attente</h3>
          <p className="text-muted-foreground">
            Les documents nécessitant une signature apparaîtront ici
          </p>
        </div>
      </Card>
    </div>
  )
}
