import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ClientDetail, WealthSummary } from '@/lib/api-types'

interface TabWealthProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
}

export function TabWealth({ clientId, client, wealth }: TabWealthProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patrimoine</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Onglet Patrimoine - À implémenter (Actifs, Passifs, Contrats, Synthèse)
        </p>
      </CardContent>
    </Card>
  )
}
