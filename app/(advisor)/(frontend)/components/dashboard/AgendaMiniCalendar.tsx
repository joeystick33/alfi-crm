'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckSquare } from 'lucide-react'
import { apiCall } from '@/app/_common/lib/api-client'
import { cn } from '@/app/_common/lib/utils'

interface CalendarEvent {
  id: string
  title: string
  type: string
  start: string
  end?: string
  client?: { name?: string }
}

type ViewMode = 'day' | 'week' | 'month'

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function getMonthMatrix(currentDate: Date): Date[] {
  const first = startOfMonth(currentDate)
  const firstDay = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - firstDay)

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

function formatKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(dateString: string | undefined): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function AgendaMiniCalendar() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('day')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError(null)
        setLoading(true)
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)
        const params = new URLSearchParams({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        })
        const data = await apiCall(`/api/advisor/events?${params.toString()}`) as any
        const list = (data && (data.events || data.data?.events)) || []
        if (!cancelled) {
          setEvents(Array.isArray(list) ? list : [])
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Impossible de charger l'agenda")
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
  }, [currentMonth])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      const key = formatKey(new Date(event.start))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    })
    return map
  }, [events])

  const selectedKey = formatKey(selectedDate)

  const displayEvents = useMemo(() => {
    if (viewMode === 'day') {
      return eventsByDay.get(selectedKey) || []
    }
    if (viewMode === 'week') {
      const start = startOfWeek(selectedDate)
      const end = endOfWeek(selectedDate)
      return events.filter((event) => {
        const d = new Date(event.start)
        return d >= start && d <= end
      })
    }
    return events
  }, [viewMode, events, eventsByDay, selectedKey, selectedDate])

  const summary = useMemo(() => {
    let rdvCount = 0
    let taskCount = 0
    events.forEach((e) => {
      if (e.type === 'rdv') rdvCount++
      if (e.type === 'task') taskCount++
    })
    return { rdvCount, taskCount }
  }, [events])

  const monthLabel = currentMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  const days = getMonthMatrix(currentMonth)
  const today = new Date()

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const renderDayButton = (day: Date) => {
    const key = formatKey(day)
    const inMonth = day.getMonth() === currentMonth.getMonth()
    const hasEvents = eventsByDay.has(key)
    const isToday = sameDay(day, today)
    const isSelected = sameDay(day, selectedDate)

    return (
      <button
        key={key}
        type="button"
        onClick={() => setSelectedDate(day)}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors',
          inMonth ? 'text-slate-800' : 'text-slate-400',
          isSelected && 'bg-blue-600 text-white shadow-sm',
          !isSelected && isToday && 'ring-1 ring-blue-500',
          !isSelected && !isToday && 'hover:bg-slate-100'
        )}
      >
        {day.getDate()}
        {hasEvents && (
          <span className={cn(
            'absolute -bottom-1 h-1.5 w-1.5 rounded-full',
            isSelected ? 'bg-white' : 'bg-blue-500'
          )} />
        )}
      </button>
    )
  }

  return (
    <Card
      className="group relative overflow-hidden border border-slate-200/60 bg-white/70 backdrop-blur-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
      role="region"
      aria-label="Calendrier des rendez-vous et tâches"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden />
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-slate-900 text-sm group-hover:bg-gradient-to-r group-hover:from-blue-700 group-hover:to-blue-900 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            <span className="capitalize">{monthLabel}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth} aria-label="Mois précédent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth} aria-label="Mois suivant">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              {summary.rdvCount} RDV
            </span>
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3 text-emerald-500" />
              {summary.taskCount} tâches
            </span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 p-0.5">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px]',
                  viewMode === mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        {loading ? (
          <div className="space-y-2">
            <div className="h-6 bg-slate-100 rounded animate-pulse" />
            <div className="h-6 bg-slate-100 rounded animate-pulse" />
            <div className="h-6 bg-slate-100 rounded animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          <>
            {viewMode === 'month' && (
              <div className="mb-2">
                <div className="grid grid-cols-7 text-[10px] font-medium text-slate-400 mb-1">
                  {WEEK_DAYS.map((d, index) => (
                    <div key={`${d}-${index}`} className="text-center">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-[11px]">
                  {days.map(renderDayButton)}
                </div>
              </div>
            )}

            {viewMode === 'week' && (
              <div className="mb-2">
                <div className="grid grid-cols-7 text-[10px] font-medium text-slate-400 mb-1">
                  {WEEK_DAYS.map((d, index) => (
                    <div key={`${d}-${index}`} className="text-center">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-[11px]">
                  {Array.from({ length: 7 }).map((_, index) => {
                    const day = new Date(startOfWeek(selectedDate))
                    day.setDate(day.getDate() + index)
                    return renderDayButton(day)
                  })}
                </div>
              </div>
            )}

            {viewMode === 'day' && (
              <div className="mb-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 bg-slate-50/60">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.18em]">
                      {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end text-[10px] text-slate-500 gap-1">
                    <span>{(eventsByDay.get(selectedKey) || []).length} évènement(s)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(today)}
                      className="px-2 py-0.5 rounded-full border border-slate-200 text-[10px] hover:bg-slate-100"
                    >
                      Aujourd&apos;hui
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des événements */}
            <div className="mt-3 space-y-1 max-h-32 overflow-y-auto pr-1">
              {displayEvents.length === 0 ? (
                <p className="text-[11px] text-slate-400">Aucun événement ce jour.</p>
              ) : (
                displayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-md px-2 py-1 text-[11px] bg-slate-50/80 border border-slate-200/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-slate-700">{event.title}</p>
                      {event.client?.name && (
                        <p className="truncate text-[10px] text-slate-500">{event.client.name}</p>
                      )}
                    </div>
                    <div className="ml-2 text-[10px] text-slate-500 text-right">
                      {event.type === 'rdv' && (
                        <>
                          <div>{formatTime(event.start)} – {formatTime(event.end)}</div>
                          <div className="uppercase tracking-wide text-[9px] text-blue-500">RDV</div>
                        </>
                      )}
                      {event.type === 'task' && (
                        <div className="uppercase tracking-wide text-[9px] text-emerald-500">Tâche</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => router.push('/dashboard/agenda')}
              >
                Voir l&apos;agenda
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
