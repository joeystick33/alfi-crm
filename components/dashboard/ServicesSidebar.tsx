'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useDashboardCounters } from '@/hooks/use-api'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
} from 'lucide-react'

interface ServicesSidebarProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

export function ServicesSidebar({ expanded, onExpandedChange }: ServicesSidebarProps) {
  const { data: counters } = useDashboardCounters()

  return (
    <aside
      className={cn(
        'flex flex-col border-l bg-card transition-all duration-300',
        expanded ? 'w-80' : 'w-16'
      )}
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {expanded ? (
          <h2 className="font-semibold">Services</h2>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {expanded && (
          <>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau client
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle tâche
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau RDV
                </Button>
              </CardContent>
            </Card>

            {/* Alerts */}
            {counters && counters.alerts.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Alertes
                    <Badge variant="warning" className="ml-auto">
                      {counters.alerts.total}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {counters.alerts.kycExpiring > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">KYC à renouveler</span>
                      <Badge variant="outline">{counters.alerts.kycExpiring}</Badge>
                    </div>
                  )}
                  {counters.alerts.contractsRenewing > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contrats à renouveler</span>
                      <Badge variant="outline">{counters.alerts.contractsRenewing}</Badge>
                    </div>
                  )}
                  {counters.alerts.documentsExpiring > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Documents expirant</span>
                      <Badge variant="outline">{counters.alerts.documentsExpiring}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Today's Tasks */}
            {counters && counters.tasks.today > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-info" />
                    Aujourd'hui
                    <Badge variant="info" className="ml-auto">
                      {counters.tasks.today}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tâches</span>
                    <Badge variant="outline">{counters.tasks.today}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rendez-vous</span>
                    <Badge variant="outline">{counters.appointments.today}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overdue Tasks */}
            {counters && counters.tasks.overdue > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    En retard
                    <Badge variant="destructive" className="ml-auto">
                      {counters.tasks.overdue}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tâches en retard</span>
                    <Badge variant="outline">{counters.tasks.overdue}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">Client créé</p>
                  <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Document uploadé</p>
                  <p className="text-xs text-muted-foreground">Il y a 3 heures</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">RDV complété</p>
                  <p className="text-xs text-muted-foreground">Il y a 5 heures</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </aside>
  )
}
