import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ClientDetail } from '@/lib/api-types'

interface TabKYCProps {
  clientId: string
  client: ClientDetail
}

export function TabKYC({ clientId, client }: TabKYCProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC & Conformité</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Onglet KYC - À implémenter (Score, Documents, MIF II, LCB-FT)
        </p>
      </CardContent>
    </Card>
  )
}
