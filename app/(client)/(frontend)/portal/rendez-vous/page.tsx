'use client'

/**
 * Client Portal - Mes Rendez-vous
 * 
 * Gestion des rendez-vous client:
 * - Liste des RDV passés et à venir
 * - Formulaire de demande de RDV
 * - Détails du prochain RDV
 * 
 * UX Pédagogique:
 * - Explication claire des types de RDV disponibles
 * - Guide sur comment se préparer à un RDV
 * - Rappel des informations importantes
 */

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientRendezVous, useRequestClientRendezVous } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Lightbulb,
} from 'lucide-react'

// Demo data
const DEMO_APPOINTMENTS = [
  {
    id: '1',
    title: 'Bilan patrimonial annuel',
    description: 'Point annuel sur votre situation patrimoniale et vos objectifs',
    type: 'VIDEO',
    status: 'PLANIFIE',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    isVirtual: true,
    meetingUrl: 'https://meet.example.com/abc123',
    advisorName: 'Marie Martin',
  },
  {
    id: '2',
    title: 'Signature contrat PER',
    description: 'Finalisation de l\'ouverture de votre Plan d\'Épargne Retraite',
    type: 'IN_PERSON',
    status: 'TERMINE',
    startDate: '2024-11-15T14:00:00',
    endDate: '2024-11-15T15:00:00',
    isVirtual: false,
    location: 'Cabinet - 12 rue de la Paix, Paris',
    advisorName: 'Marie Martin',
  },
  {
    id: '3',
    title: 'Point rapide téléphonique',
    description: 'Réponse à vos questions sur votre assurance vie',
    type: 'PHONE',
    status: 'TERMINE',
    startDate: '2024-10-20T10:00:00',
    endDate: '2024-10-20T10:30:00',
    isVirtual: true,
    advisorName: 'Marie Martin',
  },
]

const DEMO_STATS = {
  total: 5,
  scheduled: 1,
  completed: 4,
  cancelled: 0,
}

const RDV_TYPE_CONFIG = {
  VIDEO: { icon: Video, label: 'Visioconférence', color: 'bg-blue-100 text-blue-700', description: 'Rendez-vous en ligne depuis chez vous' },
  PHONE: { icon: Phone, label: 'Téléphone', color: 'bg-green-100 text-green-700', description: 'Échange rapide par téléphone' },
  IN_PERSON: { icon: MapPin, label: 'En cabinet', color: 'bg-purple-100 text-purple-700', description: 'Rendez-vous en personne au cabinet' },
}

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Confirmé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  TERMINE: { label: 'Terminé', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
  NO_SHOW: { label: 'Non présenté', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
}

export default function RendezVousPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const showNewForm = searchParams.get('action') === 'new'

  const [isNewFormOpen, setIsNewFormOpen] = useState(showNewForm)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [newRdv, setNewRdv] = useState({
    type: 'VIDEO',
    subject: '',
    notes: '',
    preferredDate1: '',
    preferredDate2: '',
    preferredDate3: '',
    duration: 60,
  })

  const { data: apiData, isLoading, refetch } = useClientRendezVous(
    user?.id || '',
    { upcoming: activeTab === 'upcoming' }
  )

  const requestRdvMutation = useRequestClientRendezVous()

  const appointments = useMemo(() => {
    if (apiData?.appointments) return apiData.appointments
    return DEMO_APPOINTMENTS
  }, [apiData])

  const stats = useMemo(() => {
    if (apiData?.stats) return apiData.stats as unknown as typeof DEMO_STATS
    return DEMO_STATS
  }, [apiData])

  const nextAppointment = useMemo(() => {
    if (apiData?.nextAppointment) return apiData.nextAppointment
    return appointments.find((a: { status: string }) => a.status === 'PLANIFIE')
  }, [apiData, appointments])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleRequestRdv = async () => {
    if (!newRdv.subject.trim() || !newRdv.preferredDate1) return

    const preferredDates = [newRdv.preferredDate1]
    if (newRdv.preferredDate2) preferredDates.push(newRdv.preferredDate2)
    if (newRdv.preferredDate3) preferredDates.push(newRdv.preferredDate3)

    await requestRdvMutation.mutateAsync({
      clientId: user?.id || '',
      type: newRdv.type as 'VIDEO' | 'PHONE' | 'IN_PERSON',
      subject: newRdv.subject,
      notes: newRdv.notes,
      preferredDates,
      duration: newRdv.duration,
    })

    setNewRdv({ type: 'VIDEO', subject: '', notes: '', preferredDate1: '', preferredDate2: '', preferredDate3: '', duration: 60 })
    setIsNewFormOpen(false)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Rendez-vous</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos rendez-vous avec votre conseiller
          </p>
        </div>
        <Button onClick={() => setIsNewFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Demander un rendez-vous
        </Button>
      </div>

      {/* Next Appointment Highlight */}
      {nextAppointment && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-blue-100 text-sm font-medium">Prochain rendez-vous</p>
                <h3 className="text-xl font-bold mt-1">{nextAppointment.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-200" />
                    {formatDate(nextAppointment.startDate)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-200" />
                    {formatTime(nextAppointment.startDate)}
                  </span>
                  <Badge className={RDV_TYPE_CONFIG[nextAppointment.type as keyof typeof RDV_TYPE_CONFIG]?.color || 'bg-gray-100'}>
                    {RDV_TYPE_CONFIG[nextAppointment.type as keyof typeof RDV_TYPE_CONFIG]?.label}
                  </Badge>
                </div>
              </div>
              {nextAppointment.isVirtual && nextAppointment.meetingUrl && (
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Video className="h-4 w-4 mr-2" />
                  Rejoindre la réunion
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New RDV Form */}
      {isNewFormOpen && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Demander un rendez-vous
            </CardTitle>
            <CardDescription>
              Indiquez vos disponibilités et votre conseiller vous recontactera pour confirmer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type de RDV avec explications */}
            <div>
              <Label className="text-base font-medium">Type de rendez-vous</Label>
              <p className="text-sm text-gray-500 mb-3">Choisissez le format qui vous convient le mieux</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(RDV_TYPE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon
                  const isSelected = newRdv.type === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewRdv({ ...newRdv, type: key })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-gray-900">{config.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{config.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sujet */}
            <div>
              <Label htmlFor="subject">Motif du rendez-vous</Label>
              <Input
                id="subject"
                placeholder="Ex: Bilan patrimonial, Question sur mon épargne, Projet immobilier..."
                value={newRdv.subject}
                onChange={(e) => setNewRdv({ ...newRdv, subject: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Dates préférées avec aide */}
            <div>
              <Label className="flex items-center gap-2">
                Vos disponibilités
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </Label>
              <p className="text-sm text-gray-500 mb-3">
                Proposez jusqu'à 3 créneaux pour faciliter la prise de rendez-vous
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Option 1 (obligatoire)</Label>
                  <Input
                    type="datetime-local"
                    value={newRdv.preferredDate1}
                    onChange={(e) => setNewRdv({ ...newRdv, preferredDate1: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Option 2 (optionnel)</Label>
                  <Input
                    type="datetime-local"
                    value={newRdv.preferredDate2}
                    onChange={(e) => setNewRdv({ ...newRdv, preferredDate2: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Option 3 (optionnel)</Label>
                  <Input
                    type="datetime-local"
                    value={newRdv.preferredDate3}
                    onChange={(e) => setNewRdv({ ...newRdv, preferredDate3: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Informations complémentaires (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Précisez vos questions ou les sujets que vous souhaitez aborder..."
                value={newRdv.notes}
                onChange={(e) => setNewRdv({ ...newRdv, notes: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsNewFormOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleRequestRdv}
                disabled={!newRdv.subject.trim() || !newRdv.preferredDate1 || requestRdvMutation.isPending}
              >
                {requestRdvMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card - Pédagogique */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">Comment bien préparer votre rendez-vous ?</p>
            <ul className="text-amber-700 mt-2 space-y-1">
              <li>• Rassemblez vos questions à l'avance</li>
              <li>• Préparez les documents utiles (avis d'imposition, relevés...)</li>
              <li>• Notez vos projets et objectifs à court et long terme</li>
              <li>• Testez votre connexion si c'est en visioconférence</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">À venir ({stats.scheduled})</TabsTrigger>
          <TabsTrigger value="past">Passés ({stats.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {appointments.filter((a: { status: string }) => a.status === 'PLANIFIE').length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">Aucun rendez-vous à venir</p>
                <p className="text-gray-500 text-sm mt-1">
                  Planifiez votre prochain échange avec votre conseiller
                </p>
                <Button className="mt-4" onClick={() => setIsNewFormOpen(true)}>
                  Demander un rendez-vous
                </Button>
              </CardContent>
            </Card>
          ) : (
            appointments.filter((a: { status: string }) => a.status === 'PLANIFIE').map((apt: { id: string; status: string; title: string; type: string; startDate: string; endDate: string; isVirtual?: boolean; meetingUrl?: string; location?: string; description?: string }) => (
              <AppointmentCard key={apt.id} appointment={apt} formatDate={formatDate} formatTime={formatTime} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {appointments.filter((a: { status: string }) => a.status !== 'PLANIFIE').map((apt: { id: string; status: string; title: string; type: string; startDate: string; endDate: string; isVirtual?: boolean; meetingUrl?: string; location?: string; description?: string }) => (
            <AppointmentCard key={apt.id} appointment={apt} formatDate={formatDate} formatTime={formatTime} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Composant pour afficher un RDV
function AppointmentCard({ appointment, formatDate, formatTime }: { appointment: { id: string; status: string; title: string; type: string; startDate: string; endDate: string; isVirtual?: boolean; meetingUrl?: string; location?: string; description?: string }; formatDate: (d: string) => string; formatTime: (d: string) => string }) {
  const typeConfig = RDV_TYPE_CONFIG[appointment.type as keyof typeof RDV_TYPE_CONFIG]
  const statusConfig = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG]
  const Icon = typeConfig?.icon || Calendar

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${typeConfig?.color || 'bg-gray-100'}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-900">{appointment.title}</h3>
              <Badge className={statusConfig?.color}>{statusConfig?.label}</Badge>
            </div>
            {appointment.description && (
              <p className="text-sm text-gray-500 mt-1">{appointment.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(appointment.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(appointment.startDate)} - {formatTime(appointment.endDate)}
              </span>
              {appointment.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {appointment.location}
                </span>
              )}
            </div>
          </div>
          {appointment.status === 'PLANIFIE' && appointment.isVirtual && appointment.meetingUrl && (
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4 mr-1" />
              Rejoindre
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
