'use client'

/**
 * ActivityTimelineTab - Timeline d'activité client
 * 
 * Design premium inspiré de Linear/Notion avec :
 * - Timeline verticale avec icônes colorées par type
 * - Filtres par type d'événement
 * - Possibilité d'ajouter des notes/événements
 * - Groupement par date (Aujourd'hui, Cette semaine, Ce mois)
 * - Animations fluides
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/_common/components/ui/Dialog'
import {
  FileText,
  Users,
  PiggyBank,
  Target,
  FileSignature,
  ShieldCheck,
  Share2,
  Mail,
  TrendingUp,
  MessageSquare,
  Plus,
  Filter,
  Clock,
  MoreHorizontal,
  Sparkles,
  Phone,
  Video,
} from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'

// =============================================================================
// Types
// =============================================================================

interface TimelineEvent {
  id: string
  type: string
  title: string
  description?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  createdAt: string
  createdBy?: string | null
}

interface ActivityTimelineTabProps {
  client: ClientDetail
}

type EventFilter = 'all' | 'meetings' | 'documents' | 'assets' | 'communications' | 'compliance'

// =============================================================================
// Configuration des types d'événements
// =============================================================================

const eventTypeConfig: Record<string, {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
  category: EventFilter
}> = {
  CLIENT_CREATED: {
    icon: Users,
    color: 'text-[#7373FF]',
    bgColor: 'bg-[#7373FF]/10',
    label: 'Client créé',
    category: 'all',
  },
  MEETING_HELD: {
    icon: Video,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    label: 'Rendez-vous',
    category: 'meetings',
  },
  DOCUMENT_SIGNED: {
    icon: FileSignature,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    label: 'Document signé',
    category: 'documents',
  },
  ASSET_ADDED: {
    icon: PiggyBank,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    label: 'Actif ajouté',
    category: 'assets',
  },
  GOAL_ACHIEVED: {
    icon: Target,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    label: 'Objectif atteint',
    category: 'all',
  },
  CONTRACT_SIGNED: {
    icon: FileText,
    color: 'text-[#7373FF]',
    bgColor: 'bg-[#7373FF]/10',
    label: 'Contrat signé',
    category: 'documents',
  },
  KYC_UPDATED: {
    icon: ShieldCheck,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50',
    label: 'KYC mis à jour',
    category: 'compliance',
  },
  SIMULATION_SHARED: {
    icon: Share2,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    label: 'Simulation partagée',
    category: 'communications',
  },
  EMAIL_SENT: {
    icon: Mail,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50',
    label: 'Email envoyé',
    category: 'communications',
  },
  OPPORTUNITY_CONVERTED: {
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    label: 'Opportunité convertie',
    category: 'all',
  },
  NOTE_ADDED: {
    icon: MessageSquare,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Note ajoutée',
    category: 'all',
  },
  PHONE_CALL: {
    icon: Phone,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Appel téléphonique',
    category: 'communications',
  },
  OTHER: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Autre',
    category: 'all',
  },
}

const filterOptions: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'Tous les événements' },
  { value: 'meetings', label: 'Rendez-vous' },
  { value: 'documents', label: 'Documents' },
  { value: 'assets', label: 'Patrimoine' },
  { value: 'communications', label: 'Communications' },
  { value: 'compliance', label: 'Conformité' },
]

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diffInDays === 1) {
    return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (diffInDays < 7) {
    return `${date.toLocaleDateString('fr-FR', { weekday: 'long' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  })
}

function groupEventsByDate(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  events.forEach(event => {
    const eventDate = new Date(event.createdAt)
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())

    let groupKey: string
    if (eventDay.getTime() === today.getTime()) {
      groupKey = "Aujourd'hui"
    } else if (eventDay.getTime() === yesterday.getTime()) {
      groupKey = 'Hier'
    } else if (eventDay >= thisWeekStart) {
      groupKey = 'Cette semaine'
    } else if (eventDay >= thisMonthStart) {
      groupKey = 'Ce mois'
    } else {
      groupKey = eventDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(event)
  })

  return groups
}

// =============================================================================
// Composant principal
// =============================================================================

export default function ActivityTimelineTab({ client }: ActivityTimelineTabProps) {
  const [filter, setFilter] = useState<EventFilter>('all')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', description: '' })
  const queryClient = useQueryClient()

  // Fetch timeline events
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-timeline', client.id],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/clients/${client.id}/timeline?limit=100`)
      if (!res.ok) throw new Error('Failed to fetch timeline')
      const json = await res.json()
      return json.data as { events: TimelineEvent[]; total: number }
    },
  })

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (note: { title: string; description: string }) => {
      const res = await fetch(`/api/advisor/clients/${client.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTE_ADDED',
          title: note.title,
          description: note.description,
        }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      const json = await res.json()
      return json?.data ?? json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-timeline', client.id] })
      queryClient.invalidateQueries({ queryKey: ['timeline', client.id] })
      setIsAddingNote(false)
      setNewNote({ title: '', description: '' })
    },
  })

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!data?.events) return []
    if (filter === 'all') return data.events
    return data.events.filter(event => {
      const config = eventTypeConfig[event.type] || eventTypeConfig.OTHER
      return config.category === filter
    })
  }, [data?.events, filter])

  // Group events by date
  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents])

  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Erreur lors du chargement de la timeline
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres et actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7373FF]/10 rounded-xl">
            <Clock className="h-5 w-5 text-[#7373FF]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Historique d'activité</h2>
            <p className="text-sm text-gray-500">{data?.total || 0} événements enregistrés</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtre */}
          <Select value={filter} onValueChange={(v) => setFilter(v as EventFilter)}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ajouter une note */}
          <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Titre</label>
                  <Input
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Ex: Appel de suivi effectué"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={newNote.description}
                    onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                    placeholder="Détails de l'interaction..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => addNoteMutation.mutate(newNote)}
                    disabled={!newNote.title || addNoteMutation.isPending}
                    loading={addNoteMutation.isPending}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun événement</h3>
            <p className="text-sm text-gray-500 mb-4">
              {filter === 'all' 
                ? "La timeline de ce client est vide pour le moment" 
                : "Aucun événement ne correspond à ce filtre"}
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsAddingNote(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la première note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              {/* Ligne verticale */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

              {/* Groupes d'événements */}
              {Array.from(groupedEvents.entries()).map(([groupLabel, events], groupIndex) => (
                <div key={groupLabel} className={cn(groupIndex > 0 && 'mt-8')}>
                  {/* Label du groupe */}
                  <div className="relative flex items-center mb-4">
                    <div className="absolute left-0 w-10 flex justify-center">
                      <div className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white shadow-sm" />
                    </div>
                    <span className="ml-14 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {groupLabel}
                    </span>
                  </div>

                  {/* Événements du groupe */}
                  <div className="space-y-4">
                    {events.map((event, eventIndex) => (
                      <TimelineEventItem 
                        key={event.id} 
                        event={event} 
                        isLast={eventIndex === events.length - 1 && groupIndex === groupedEvents.size - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights (placeholder) */}
      <Card className="border-[#7373FF]/20 bg-gradient-to-r from-[#7373FF]/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#7373FF]/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-[#7373FF]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Analyse IA</h4>
              <p className="text-sm text-gray-600">
                Ce client a eu {data?.total || 0} interactions. 
                {data?.events && data.events.length > 0 && (
                  <span> La dernière activité date de {formatRelativeDate(data.events[0].createdAt)}.</span>
                )}
                {data?.total === 0 && (
                  <span> Pensez à planifier un premier contact.</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Sous-composants
// =============================================================================

function TimelineEventItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const config = eventTypeConfig[event.type] || eventTypeConfig.OTHER
  const Icon = config.icon

  return (
    <div className="relative flex gap-4 group">
      {/* Icône */}
      <div className="relative z-10 flex-shrink-0">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110',
          config.bgColor
        )}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
      </div>

      {/* Contenu */}
      <div className={cn(
        'flex-1 pb-4',
        !isLast && 'border-b border-gray-100'
      )}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{event.title}</p>
            {event.description && (
              <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" size="xs">
                {config.label}
              </Badge>
              <span className="text-xs text-gray-400">
                {formatRelativeDate(event.createdAt)}
              </span>
            </div>
          </div>

          {/* Menu contextuel */}
          <button className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
