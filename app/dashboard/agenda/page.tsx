'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState, getErrorVariant } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')

  // TODO: Replace with real API call
  const isLoading = false
  const isError = false
  const error = null
  const rendezvous: any[] = []
  const refetch = () => {}

  const statusConfig = {
    SCHEDULED: { label: 'Planifié', variant: 'outline' as const },
    CONFIRMED: { label: 'Confirmé', variant: 'info' as const },
    COMPLETED: { label: 'Terminé', variant: 'success' as const },
    CANCELLED: { label: 'Annulé', variant: 'destructive' as const },
    NO_SHOW: { label: 'Absent', variant: 'warning' as const },
  }

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const stats = {
    total: rendezvous.length,
    today: rendezvous.filter(
      (r) => new Date(r.startDate) >= today && new Date(r.startDate) < tomorrow
    ).length,
    thisWeek: rendezvous.filter(
      (r) => new Date(r.startDate) >= today && new Date(r.startDate) < nextWeek
    ).length,
    confirmed: rendezvous.filter((r) => r.status === 'CONFIRMED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos rendez-vous et votre planning
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rendez-vous
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.thisWeek}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.confirmed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>

            <div className="flex gap-2">
              <Button
                variant={view === 'day' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Jour
              </Button>
              <Button
                variant={view === 'week' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semaine
              </Button>
              <Button
                variant={view === 'month' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mois
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous à venir</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState variant="list" count={5} />
          ) : isError ? (
            <ErrorState
              error={error as Error}
              variant={getErrorVariant(error as Error)}
              onRetry={refetch}
            />
          ) : rendezvous.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="Aucun rendez-vous"
              description="Vous n'avez aucun rendez-vous prévu. Créez votre premier rendez-vous pour organiser votre agenda."
              action={{
                label: 'Créer un rendez-vous',
                onClick: () => {
                  // TODO: Open create appointment modal
                  console.log('Create appointment')
                },
                icon: Plus,
              }}
            />
          ) : rendezvous.length > 0 ? (
            <div className="space-y-4">
              {rendezvous.map((rdv) => {
                const statusConf = statusConfig[rdv.status as keyof typeof statusConfig]
                
                return (
                  <div
                    key={rdv.id}
                    className="rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{rdv.title}</h4>
                        {rdv.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rdv.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDateTime(rdv.startDate)}</span>
                      </div>

                      {rdv.isVirtual ? (
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          <span>Visioconférence</span>
                        </div>
                      ) : rdv.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{rdv.location}</span>
                        </div>
                      ) : null}

                      {rdv.client && (
                        <span>
                          Client: {rdv.client.firstName} {rdv.client.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun rendez-vous planifié
              </p>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier rendez-vous
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
