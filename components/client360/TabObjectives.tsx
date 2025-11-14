import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ClientDetail } from '@/lib/api-types'

interface TabObjectivesProps {
  clientId: string
  client: ClientDetail
}

export function TabObjectives({ clientId, client }: TabObjectivesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objectifs & Projets</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Onglet Objectifs - À implémenter (Objectifs, Projets, Progress)
        </p>
      </CardContent>
    </Card>
  )
}
