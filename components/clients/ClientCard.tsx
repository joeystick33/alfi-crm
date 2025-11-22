import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { User, Building2, Mail, Phone, TrendingUp } from 'lucide-react'
import type { ClientListItem } from '@/lib/api-types'

interface ClientCardProps {
  client: ClientListItem
  onClick?: () => void
}

const clientTypeLabels = {
  PARTICULIER: 'Particulier',
  PROFESSIONNEL: 'Professionnel',
}

const clientStatusVariants = {
  PROSPECT: 'outline' as const,
  ACTIVE: 'success' as const,
  INACTIVE: 'warning' as const,
  ARCHIVED: 'destructive' as const,
  LOST: 'destructive' as const,
}

const clientStatusLabels = {
  PROSPECT: 'Prospect',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  ARCHIVED: 'Archivé',
  LOST: 'Perdu',
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const TypeIcon = client.clientType === 'PROFESSIONNEL' ? Building2 : User

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <TypeIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {client.firstName} {client.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {clientTypeLabels[client.clientType]}
              </p>
            </div>
          </div>
          <Badge variant={clientStatusVariants[client.status]}>
            {clientStatusLabels[client.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Info */}
        <div className="space-y-1.5 text-sm">
          {client.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>

        {/* Wealth Info */}
        {client.wealth && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <TrendingUp className="h-4 w-4 text-success" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {formatCurrency(client.wealth.patrimoineNet)}
              </p>
              <p className="text-xs text-muted-foreground">Patrimoine net</p>
            </div>
          </div>
        )}

        {/* Last Contact */}
        {client.lastContactDate && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Dernier contact: {formatDate(client.lastContactDate)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
