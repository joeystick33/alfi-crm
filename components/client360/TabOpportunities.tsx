import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ClientDetail } from '@/lib/api-types'

interface TabOpportunitiesProps {
  clientId: string
  client: ClientDetail
}

export function TabOpportunities({ clientId, client }: TabOpportunitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunités</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Onglet Opportunités - À implémenter (Pipeline, Score, Conversion)
        </p>
      </CardContent>
    </Card>
  )
}
