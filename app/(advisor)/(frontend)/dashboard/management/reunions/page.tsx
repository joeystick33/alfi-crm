'use client'

/**
 * Réunions & Points 1-to-1 - Vue Admin
 * 
 * Gestion des réunions d'équipe et points individuels:
 * - Planning des réunions
 * - Points 1-to-1 avec chaque conseiller
 * - Notes et suivi
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { useManagementReunions, useCreateManagementReunion } from '@/app/_common/hooks/use-api'
import {
  ArrowLeft,
  Calendar,
  Plus,
  Users,
  User,
  Clock,
  Video,
  MapPin,
  FileText,
  MessageSquare,
  Edit,
  X,
  Save,
  ChevronRight,
  Repeat,
} from 'lucide-react'

interface Reunion {
  id: string
  title: string
  type: 'TEAM' | 'ONE_TO_ONE' | 'TRAINING' | 'AUTRE'
  status: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  date: string
  time: string
  duration: number // en minutes
  location?: string
  videoLink?: string
  participants: { id: string; firstName: string; lastName: string }[]
  agenda?: string[]
  notes?: string
  recurring?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  createdAt: string
}

const TYPE_CONFIG = {
  TEAM: { label: 'Réunion équipe', color: 'bg-blue-100 text-blue-700', icon: Users },
  ONE_TO_ONE: { label: '1-to-1', color: 'bg-purple-100 text-purple-700', icon: User },
  TRAINING: { label: 'Formation', color: 'bg-green-100 text-green-700', icon: FileText },
  OTHER: { label: 'Autre', color: 'bg-gray-100 text-gray-700', icon: Calendar },
}

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Planifiée', color: 'bg-blue-100 text-blue-700' },
  EN_COURS: { label: 'En cours', color: 'bg-orange-100 text-orange-700' },
  TERMINE: { label: 'Terminée', color: 'bg-green-100 text-green-700' },
  ANNULE: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
}

const DEMO_REUNIONS: Reunion[] = [
  {
    id: '1',
    title: 'Point Hebdo Équipe',
    type: 'TEAM',
    status: 'PLANIFIE',
    date: '2024-11-29',
    time: '10:00',
    duration: 60,
    location: 'Salle de réunion A',
    participants: [
      { id: '1', firstName: 'Marie', lastName: 'Dupont' },
      { id: '2', firstName: 'Pierre', lastName: 'Martin' },
      { id: '3', firstName: 'Lucas', lastName: 'Bernard' },
      { id: '4', firstName: 'Sophie', lastName: 'Laurent' },
    ],
    agenda: [
      'Revue des objectifs de la semaine',
      'Pipeline commercial',
      'Points bloquants',
      'Actions pour la semaine prochaine',
    ],
    recurring: 'WEEKLY',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    title: '1-to-1 Marie Dupont',
    type: 'ONE_TO_ONE',
    status: 'PLANIFIE',
    date: '2024-12-02',
    time: '14:00',
    duration: 45,
    videoLink: 'https://meet.google.com/xxx',
    participants: [{ id: '1', firstName: 'Marie', lastName: 'Dupont' }],
    agenda: [
      'Revue performances',
      'Objectifs du mois',
      'Formation produits',
      'Questions / Préoccupations',
    ],
    recurring: 'BIWEEKLY',
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    title: '1-to-1 Pierre Martin',
    type: 'ONE_TO_ONE',
    status: 'PLANIFIE',
    date: '2024-12-03',
    time: '11:00',
    duration: 45,
    location: 'Bureau',
    participants: [{ id: '2', firstName: 'Pierre', lastName: 'Martin' }],
    agenda: [
      'Point sur les clients difficiles',
      'Objectifs de fin d\'année',
    ],
    recurring: 'BIWEEKLY',
    createdAt: '2024-01-15',
  },
  {
    id: '4',
    title: 'Formation SCPI',
    type: 'TRAINING',
    status: 'TERMINE',
    date: '2024-11-20',
    time: '09:00',
    duration: 180,
    location: 'Salle de conférence',
    participants: [
      { id: '1', firstName: 'Marie', lastName: 'Dupont' },
      { id: '2', firstName: 'Pierre', lastName: 'Martin' },
    ],
    notes: 'Formation complète sur les nouveaux produits SCPI. Tous les participants ont validé les connaissances.',
    createdAt: '2024-11-01',
  },
  {
    id: '5',
    title: '1-to-1 Lucas Bernard',
    type: 'ONE_TO_ONE',
    status: 'TERMINE',
    date: '2024-11-22',
    time: '15:00',
    duration: 45,
    location: 'Bureau',
    participants: [{ id: '3', firstName: 'Lucas', lastName: 'Bernard' }],
    notes: 'Discussion sur les objectifs en retard. Plan d\'action défini pour rattraper le CA. Lucas doit se concentrer sur les clients premium.',
    createdAt: '2024-01-15',
  },
]

export default function ReunionsPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null)

  // Fetch reunions from API
  const { data: apiData, isLoading } = useManagementReunions({
    upcoming: activeTab === 'upcoming',
  })
  const createReunionMutation = useCreateManagementReunion()

  // Map API data to component format with fallback
  const reunions: Reunion[] = useMemo(() => {
    if (apiData?.reunions && apiData.reunions.length > 0) {
      return apiData.reunions.map((reunion) => ({
        id: reunion.id,
        title: reunion.title,
        type: reunion.type as Reunion['type'],
        status: reunion.status as Reunion['status'],
        date: reunion.date,
        time: reunion.time,
        duration: reunion.duration,
        location: reunion.location,
        videoLink: reunion.videoLink,
        participants: reunion.participants?.map((p: any) => ({
          id: p.id,
          firstName: p.firstName || '',
          lastName: p.lastName || ''
        })),
        agenda: Array.isArray(reunion.agenda) ? reunion.agenda : (reunion.agenda ? [reunion.agenda] : []),
        notes: reunion.notes,
        recurring: reunion.recurring as Reunion['recurring'],
        createdAt: reunion.createdAt,
      }))
    }
    return DEMO_REUNIONS
  }, [apiData])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const formatTime = (time: string) => {
    return time
  }

  const upcomingReunions = reunions
    .filter(r => r.status === 'PLANIFIE' || r.status === 'EN_COURS')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastReunions = reunions
    .filter(r => r.status === 'TERMINE' || r.status === 'ANNULE')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-7 w-7 text-orange-600" />
              Réunions & 1-to-1
            </h1>
            <p className="text-gray-500 mt-1">Planification et suivi des réunions d'équipe</p>
          </div>
        </div>

        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle réunion
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">À venir ({upcomingReunions.length})</TabsTrigger>
          <TabsTrigger value="past">Historique ({pastReunions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {upcomingReunions.map(reunion => {
              const TypeIcon = TYPE_CONFIG[reunion.type].icon

              return (
                <Card key={reunion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Date */}
                      <div className="text-center min-w-[80px]">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center mx-auto">
                          <span className="text-xs text-blue-600 uppercase">
                            {new Date(reunion.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </span>
                          <span className="text-2xl font-bold text-blue-700">
                            {new Date(reunion.date).getDate()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(reunion.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={TYPE_CONFIG[reunion.type].color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {TYPE_CONFIG[reunion.type].label}
                          </Badge>
                          {reunion.recurring && (
                            <Badge variant="outline" className="text-xs">
                              <Repeat className="h-3 w-3 mr-1" />
                              {reunion.recurring === 'WEEKLY' ? 'Hebdo' :
                                reunion.recurring === 'BIWEEKLY' ? 'Bi-hebdo' : 'Mensuel'}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-2">{reunion.title}</h3>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(reunion.time)} ({reunion.duration} min)
                          </span>
                          {reunion.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {reunion.location}
                            </span>
                          )}
                          {reunion.videoLink && (
                            <a href={reunion.videoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                              <Video className="h-4 w-4" />
                              Lien vidéo
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <div className="flex -space-x-2">
                            {reunion.participants.slice(0, 4).map((p, i) => (
                              <div
                                key={p.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                                title={`${p.firstName} ${p.lastName}`}
                              >
                                {p.firstName[0]}{p.lastName[0]}
                              </div>
                            ))}
                            {reunion.participants.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border-2 border-white">
                                +{reunion.participants.length - 4}
                              </div>
                            )}
                          </div>
                        </div>

                        {reunion.agenda && reunion.agenda.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-2">Ordre du jour:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {reunion.agenda.slice(0, 3).map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                  {item}
                                </li>
                              ))}
                              {reunion.agenda.length > 3 && (
                                <li className="text-gray-400">+{reunion.agenda.length - 3} autres points</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReunion(reunion)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Notes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {upcomingReunions.length === 0 && (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune réunion planifiée</p>
                <Button className="mt-4" onClick={() => setShowNewForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Planifier une réunion
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            {pastReunions.map(reunion => {
              const TypeIcon = TYPE_CONFIG[reunion.type].icon

              return (
                <Card key={reunion.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="text-center min-w-[80px]">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex flex-col items-center justify-center mx-auto">
                          <span className="text-xs text-gray-500 uppercase">
                            {new Date(reunion.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </span>
                          <span className="text-2xl font-bold text-gray-600">
                            {new Date(reunion.date).getDate()}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={TYPE_CONFIG[reunion.type].color}>
                            {TYPE_CONFIG[reunion.type].label}
                          </Badge>
                          <Badge className={STATUS_CONFIG[reunion.status].color}>
                            {STATUS_CONFIG[reunion.status].label}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">{reunion.title}</h3>

                        {reunion.notes && (
                          <div className="p-3 bg-gray-50 rounded-lg mt-2">
                            <p className="text-sm font-medium mb-1">Notes:</p>
                            <p className="text-sm text-gray-600">{reunion.notes}</p>
                          </div>
                        )}
                      </div>

                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nouvelle Réunion */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nouvelle Réunion</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Titre</Label>
                <Input placeholder="Ex: Point Hebdo Équipe" className="mt-1" />
              </div>

              <div>
                <Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="TEAM">Réunion équipe</option>
                  <option value="ONE_TO_ONE">1-to-1</option>
                  <option value="TRAINING">Formation</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <Label>Heure</Label>
                  <Input type="time" className="mt-1" />
                </div>
              </div>

              <div>
                <Label>Durée (minutes)</Label>
                <Input type="number" placeholder="45" defaultValue="45" className="mt-1" />
              </div>

              <div>
                <Label>Lieu / Lien visio</Label>
                <Input placeholder="Salle A ou lien Google Meet" className="mt-1" />
              </div>

              <div>
                <Label>Ordre du jour</Label>
                <Textarea
                  placeholder="Un point par ligne..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Récurrence</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Aucune</option>
                  <option value="WEEKLY">Hebdomadaire</option>
                  <option value="BIWEEKLY">Bi-hebdomadaire</option>
                  <option value="MONTHLY">Mensuelle</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNewForm(false)} className="flex-1">
                  Annuler
                </Button>
                <Button className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
