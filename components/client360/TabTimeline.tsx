import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ClientDetail } from '@/lib/api-types'

interface TabTimelineProps {
  clientId: string
  client: ClientDetail
}

export function TabTimeline({ clientId, client }: TabTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité & Historique</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Onglet Timeline - À implémenter (Événements chronologiques)
        </p>
      </CardContent>
    </Card>
  )
}
