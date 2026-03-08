'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  Phone,
  Building,
  ArrowRight,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { apiCall } from '@/app/_common/lib/api-client'
import { useRouter } from 'next/navigation'

interface Appointment {
  id: string
  type: string
  locationType?: string
  startTime?: string
  dateDebut?: string
  endTime?: string
  dateFin?: string
  clientName?: string
  clientId?: { firstName?: string; lastName?: string } | string
  titre?: string
  location?: string
  lieu?: string
  videoLink?: string
  description?: string
}

interface TypeConfig {
  label: string
  color: string
  icon: LucideIcon
}

interface LocationConfig {
  label: string
  icon: LucideIcon
  color: string
}

interface TodayWidgetProps {
  date?: Date
}

const TYPE_CONFIGS: Record<string, TypeConfig> = {
  'BILAN': { label: 'Bilan', color: 'bg-blue-100 text-blue-700', icon: User },
  'SUIVI': { label: 'Suivi', color: 'bg-green-100 text-green-700', icon: User },
  'SIGNATURE': { label: 'Signature', color: 'bg-purple-100 text-purple-700', icon: User },
  'PROSPECTION': { label: 'Prospection', color: 'bg-orange-100 text-orange-700', icon: User },
  'INTERNE': { label: 'Interne', color: 'bg-slate-100 text-slate-700', icon: Building },
  'AUTRE': { label: 'Autre', color: 'bg-gray-100 text-gray-700', icon: User },
}

const LOCATION_CONFIGS: Record<string, LocationConfig> = {
  'BUREAU': { label: 'Bureau', icon: Building, color: 'text-slate-600' },
  'CLIENT': { label: 'Chez le client', icon: MapPin, color: 'text-blue-600' },
  'VISIO': { label: 'Visioconférence', icon: Video, color: 'text-purple-600' },
  'TELEPHONE': { label: 'Téléphone', icon: Phone, color: 'text-green-600' },
}

function getTypeConfig(type: string): TypeConfig {
  return TYPE_CONFIGS[type] || TYPE_CONFIGS.AUTRE
}

function getLocationConfig(locationType: string | undefined): LocationConfig {
  return LOCATION_CONFIGS[locationType || 'BUREAU'] || LOCATION_CONFIGS.BUREAU
}

function formatTime(dateTime: string | undefined): string {
  if (!dateTime) return ''
  const d = new Date(dateTime)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getTimeUntil(dateTime: string): string | null {
  const now = new Date()
  const appointmentTime = new Date(dateTime)
  const diffMs = appointmentTime.getTime() - now.getTime()

  if (diffMs < 0) return null

  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 60) return `Dans ${diffMins} min`
  if (diffHours < 24) return `Dans ${diffHours}h`
  return null
}

function isPast(dateTime: string): boolean {
  return new Date(dateTime) < new Date()
}

function getClientName(appointment: Appointment): string {
  if (appointment.clientName) return appointment.clientName
  const cid = appointment.clientId
  if (cid && typeof cid === 'object' && cid.firstName && cid.lastName) {
    return `${cid.firstName} ${cid.lastName}`
  }
  return appointment.titre || 'Rendez-vous'
}

export default function TodayWidget({ date: propDate }: TodayWidgetProps) {
  const router = useRouter()
  const date = useMemo(() => propDate || new Date(), [propDate])

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = useCallback(async () => {
    try {
      setError(null)
      const dateStr = date.toISOString().split('T')[0]
      const data = await apiCall(`/api/advisor/appointments?date=${dateStr}`) as Record<string, unknown>
      const appointmentsList = Array.isArray((data as any)?.appointments) ? (data as any).appointments :
        Array.isArray((data as any)?.data) ? (data as any).data :
          Array.isArray(data) ? data : []
      setAppointments(appointmentsList)
    } catch {
      setError('Impossible de charger les rendez-vous')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  return (
    <Card
      className="group relative overflow-hidden border border-slate-200 bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:scale-[1.01]"
      role="region"
      aria-label={`Rendez-vous du ${isToday ? "jour" : date.toLocaleDateString('fr-FR')}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
              <Calendar className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 group-hover:bg-gradient-to-r group-hover:from-blue-700 group-hover:to-blue-900 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500" id="today-widget-title">
                {isToday ? "Aujourd'hui" : date.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </CardTitle>
              <p className="text-xs text-slate-500">Vue consolidée de vos rendez-vous confirmés</p>
            </div>
          </div>
          {appointments.length > 0 && (
            <Badge variant="default" className="bg-blue-100 text-blue-700" aria-label={`${appointments.length} rendez-vous`}>
              {appointments.length} RDV
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {loading ? (
          <div className="space-y-3" role="status" aria-label="Chargement des rendez-vous" aria-live="polite">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            ))}
            <span className="sr-only">Chargement en cours...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8" role="alert" aria-live="assertive">
            <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={loadAppointments}
              aria-label="Réessayer le chargement des rendez-vous"
            >
              Réessayer
            </Button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8" role="status">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-600 font-medium">
              Aucun rendez-vous {isToday ? "aujourd'hui" : "ce jour"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Profitez-en pour planifier vos prochains rendez-vous
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/dashboard/calendar')}
              aria-label="Voir le calendrier complet"
            >
              Voir le calendrier
            </Button>
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Liste des rendez-vous">
            {appointments.map((appointment, index) => {
              const typeConfig = getTypeConfig(appointment.type)
              const locationConfig = getLocationConfig(appointment.locationType)
              const TypeIcon = typeConfig.icon
              const LocationIcon = locationConfig.icon
              const isNext = index === 0 && new Date(appointment.startTime || appointment.dateDebut || '') > new Date()
              const startTimeStr = appointment.startTime || appointment.dateDebut || ''
              const timeUntil = isNext ? getTimeUntil(startTimeStr) : null
              const past = isPast(startTimeStr)
              const clientName = getClientName(appointment)
              const appointmentLabel = `${isNext ? 'Prochain rendez-vous: ' : ''}${formatTime(startTimeStr)} avec ${clientName}, ${typeConfig.label}, ${locationConfig.label}${past ? ', passé' : ''}`

              return (
                <div
                  key={appointment.id}
                  className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-lg hover:shadow-slate-200/40 ${isNext
                      ? 'border-blue-200 bg-blue-50 ring-2 ring-blue-200'
                      : past
                        ? 'border-slate-200 bg-slate-50 opacity-70'
                        : 'border-slate-200 bg-white'
                    }`}
                  onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                  role="listitem"
                  aria-label={appointmentLabel}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/dashboard/appointments/${appointment.id}`)
                    }
                  }}
                >
                  {/* Time and Next Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isNext ? 'text-blue-600' : 'text-slate-600'}`} />
                      <span className={`text-sm font-semibold ${isNext ? 'text-blue-900' : 'text-slate-900'}`}>
                        {formatTime(startTimeStr)}
                        {(appointment.endTime || appointment.dateFin) ? (
                          <span className="text-slate-500 font-normal">
                            {' - '}{formatTime(appointment.endTime || appointment.dateFin)}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNext && timeUntil && (
                        <Badge variant="default" className="bg-blue-600 text-white text-xs">
                          {timeUntil}
                        </Badge>
                      )}
                      {past && (
                        <Badge variant="secondary" className="text-xs">
                          Passé
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Client Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className="h-4 w-4 text-slate-600 flex-shrink-0" />
                    <p className={`text-sm font-medium ${isNext ? 'text-blue-900' : 'text-slate-900'}`}>
                      {clientName}
                    </p>
                  </div>

                  {/* Type and Location */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                      {typeConfig.label}
                    </Badge>
                    <div className={`flex items-center gap-1 text-xs ${locationConfig.color}`}>
                      <LocationIcon className="h-3 w-3" />
                      <span>{locationConfig.label}</span>
                    </div>
                    {appointment.location && appointment.locationType !== 'VISIO' && (
                      <span className="text-xs text-slate-500 truncate">
                        • {appointment.location || appointment.lieu}
                      </span>
                    )}
                  </div>

                  {/* Video Link for Visio */}
                  {appointment.locationType === 'VISIO' && appointment.videoLink && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <a
                        href={appointment.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video className="h-3 w-3" />
                        Rejoindre la visio
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Description */}
                  {appointment.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {appointment.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* View All Button */}
        {!loading && !error && appointments.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => router.push('/dashboard/calendar')}
          >
            Voir tous les rendez-vous
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
