'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate, getRelativeTime } from '@/lib/utils'
import {
  Clock,
  User,
  FileText,
  Calendar,
  TrendingUp,
  CheckSquare,
  Mail,
  Shield,
  Filter,
} from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'

interface TabTimelineProps {
  clientId: string
  client: ClientDetail
}

const eventTypeConfig = {
  CLIENT_CREATED: { label: 'Client créé', icon: User, color: 'bg-blue-500' },
  MEETING: { label: 'Rendez-vous', icon: Calendar, color: 'bg-green-500' },
  DOCUMENT_SIGNED: { label: 'Document signé', icon: FileText, color: 'bg-purple-500' },
  ASSET_ADDED: { label: 'Actif ajouté', icon: TrendingUp, color: 'bg-emerald-500' },
  GOAL_ACHIEVED: { label: 'Objectif atteint', icon: CheckSquare, color: 'bg-yellow-500' },
  CONTRACT_SIGNED: { label: 'Contrat signé', icon: FileText, color: 'bg-indigo-500' },
  KYC_UPDATED: { label: 'KYC mis à jour', icon: Shield, color: 'bg-red-500' },
  SIMULATION_SHARED: { label: 'Simulation partagée', icon: TrendingUp, color: 'bg-cyan-500' },
  EMAIL_SENT: { label: 'Email envoyé', icon: Mail, color: 'bg-orange-500' },
  OPPORTUNITY_CONVERTED: { label: 'Opportunité convertie', icon: TrendingUp, color: 'bg-green-600' },
  OTHER: { label: 'Autre', icon: Clock, color: 'bg-gray-500' },
}

export function TabTimeline({ clientId, client }: TabTimelineProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const filteredEvents = selectedType
    ? client.timelineEvents?.filter((event: any) => event.type === selectedType)
    : client.timelineEvents

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrer par type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === null ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              Tous
              {client.timelineEvents && (
                <Badge variant="secondary" className="ml-2">
                  {client.timelineEvents.length}
                </Badge>
              )}
            </Button>
            {Object.entries(eventTypeConfig).map(([type, config]) => {
              const count = client.timelineEvents?.filter(
                (e: any) => e.type === type
              ).length || 0
              
              if (count === 0) return null

              return (
                <Button
                  key={type}
                  variant={selectedType === type ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {config.label}
                  <Badge variant="secondary" className="ml-2">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des événements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents && filteredEvents.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

              {/* Events */}
              <div className="space-y-6">
                {filteredEvents.map((event: any, index: number) => {
                  const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig] || eventTypeConfig.OTHER
                  const Icon = config.icon

                  return (
                    <div key={event.id} className="relative flex gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 rounded-lg border p-4 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <Badge variant="outline" className="mt-1">
                              {config.label}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(event.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(event.createdAt)}
                            </p>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {event.description}
                          </p>
                        )}

                        {event.metadata && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="grid gap-2 text-xs">
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.userId && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Par {event.userId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {selectedType
                  ? 'Aucun événement de ce type'
                  : 'Aucun événement enregistré'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
