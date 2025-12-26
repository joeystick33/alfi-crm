 'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Gift, Cake, Award, CalendarHeart, ChevronRight } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import { apiCall } from '@/app/_common/lib/api-client'
import { usePresentationMode } from '@/app/(advisor)/(frontend)/components/dashboard/PresentationModeContext'

function getIconAndColors(type) {
  switch (type) {
    case 'birthday':
      return { icon: Cake, color: 'text-pink-500', bgColor: 'bg-pink-100' }
    case 'contract':
      return { icon: Award, color: 'text-amber-500', bgColor: 'bg-amber-100' }
    default:
      return { icon: Gift, color: 'text-purple-500', bgColor: 'bg-purple-100' }
  }
}

function formatDateLabel(iso) {
  const d = new Date(iso)
  const today = new Date()
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Demain'
  if (diffDays < 0) return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  if (diffDays < 7) return `Dans ${diffDays} jours`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function CelebrationsWidget() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const presentationMode = usePresentationMode()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError(null)
        const data = await apiCall('/api/advisor/celebrations?rangeDays=30')
        const list = (data && (data.events || data.data?.events)) || []
        if (!cancelled) {
          setEvents(Array.isArray(list) ? list : [])
        }
      } catch (e) {
        console.error('Erreur chargement célébrations:', e)
        if (!cancelled) {
          setError(e?.message || 'Impossible de charger les célébrations')
          setEvents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => {
    const birthdays = events.filter((e) => e.type === 'birthday').length
    const contracts = events.filter((e) => e.type === 'contract').length
    return { birthdays, contracts }
  }, [events])

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarHeart className="h-5 w-5 text-rose-500" />
          Célébrations & Échéances
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600 text-center">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center">
            Aucune célébration à venir dans les 30 prochains jours.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {events.map((event) => {
                const { icon: Icon, color, bgColor } = getIconAndColors(event.type)
                const labelDate = formatDateLabel(event.date)

                const displayName = presentationMode ? 'Client' : event.clientName
                const displayDetail = presentationMode
                  ? event.type === 'birthday'
                    ? 'Anniversaire client'
                    : 'Échéance de contrat'
                  : event.detail

                return (
                  <div
                    key={event.id}
                    className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className={cn('p-2 rounded-xl shrink-0', bgColor)}>
                      <Icon className={cn('h-5 w-5', color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {displayName}
                        </p>
                        <Badge variant="outline" className="text-[10px] border-slate-200 bg-white/50">
                          {labelDate}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-0.5">
                        {displayDetail}
                      </p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-primary mt-1 flex items-center gap-1 hover:no-underline"
                      >
                        {event.type === 'birthday' ? 'Préparer une attention' : 'Planifier un point'}
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-3 bg-rose-50/30 border-t border-slate-100">
              <p className="text-xs text-center text-rose-600 font-medium">
                🎉 {summary.birthdays} anniversaires client • {summary.contracts} échéances de contrat
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
