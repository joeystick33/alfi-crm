import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ClientDetail } from '@/lib/api-types'

interface TabDocumentsProps {
  clientId: string
  client: ClientDetail
}

export function TabDocuments({ clientId, client }: TabDocumentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Onglet Documents - À implémenter (GED, Upload, Catégories)
        </p>
      </CardContent>
    </Card>
  )
}
