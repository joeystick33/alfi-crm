"use client"

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  useComplianceTimeline,
  useExportComplianceTimeline,
} from '@/app/_common/hooks/api/use-compliance-api'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Input } from '@/app/_common/components/ui/Input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { cn } from '@/app/_common/lib/utils'
import {
  History,
  Filter,
  ChevronDown,
  X,
  CheckCircle,
  ArrowLeft,
  Download,
  Calendar,
  FileText,
  FileCheck,
  FileX,
  Clock,
  Bell,
  ClipboardCheck,
  FileQuestion,
  MessageSquare,
  CheckCircle2,
  Plus,
  RefreshCw,
  Send,
  Signature,
  User,
} from 'lucide-react'
import {
  TIMELINE_EVENT_TYPES,
  TIMELINE_EVENT_TYPE_LABELS,
  type TimelineEvent,
  type TimelineEventType,
} from '@/lib/compliance/types'

// ============================================================================
// Types
// ============================================================================

interface TimelineFiltersState {
  types: TimelineEventType[]
  dateFrom: string
  dateTo: string
}

// ============================================================================
// Event Type Styling
// ============================================================================

const eventTypeConfig: Record<TimelineEventType, { 
  icon: React.ElementType
  bg: string
  iconColor: string
}> = {
  DOCUMENT_UPLOADED: {
    icon: FileText,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  DOCUMENT_VALIDATED: {
    icon: FileCheck,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  DOCUMENT_REJECTED: {
    icon: FileX,
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  DOCUMENT_EXPIRED: {
    icon: Clock,
    bg: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  REMINDER_SENT: {
    icon: Bell,
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  CONTROL_CREATED: {
    icon: ClipboardCheck,
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  CONTROL_COMPLETED: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  QUESTIONNAIRE_COMPLETED: {
    icon: FileQuestion,
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  RECLAMATION_CREATED: {
    icon: MessageSquare,
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  RECLAMATION_RESOLVED: {
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  OPERATION_CREATED: {
    icon: Plus,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  OPERATION_STATUS_CHANGED: {
    icon: RefreshCw,
    bg: 'bg-gray-50',
    iconColor: 'text-gray-600',
  },
  DOCUMENT_GENERATED: {
    icon: FileText,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  DOCUMENT_SIGNED: {
    icon: Signature,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  DOCUMENT_EXPORTED: {
    icon: Download,
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },
}

// ============================================================================
// Filter Dropdown Component
// ============================================================================

interface FilterDropdownProps {
  label: string
  options: readonly TimelineEventType[]
  selected: TimelineEventType[]
  onChange: (selected: TimelineEventType[]) => void
}

function FilterDropdown({ 
  label, 
  options, 
  selected, 
  onChange,
}: FilterDropdownProps) {
  const toggleOption = (option: TimelineEventType) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {label}
          {selected.length > 0 && (
            <Badge variant="primary" size="xs">{selected.length}</Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
        {options.map((option) => {
          const config = eventTypeConfig[option]
          const Icon = config.icon
          return (
            <DropdownMenuItem
              key={option}
              onClick={() => toggleOption(option)}
              className="flex items-center gap-2"
            >
              <div className={cn(
                'h-4 w-4 rounded border flex items-center justify-center',
                selected.includes(option) 
                  ? 'bg-[#7373FF] border-[#7373FF]' 
                  : 'border-gray-300'
              )}>
                {selected.includes(option) && (
                  <CheckCircle className="h-3 w-3 text-white" />
                )}
              </div>
              <div className={cn('p-1 rounded', config.bg)}>
                <Icon className={cn('h-3 w-3', config.iconColor)} />
              </div>
              <span className="text-sm truncate">{TIMELINE_EVENT_TYPE_LABELS[option]}</span>
            </DropdownMenuItem>
          )
        })}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange([])}>
              <X className="h-4 w-4 mr-2" />
              Effacer la sélection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Timeline Event Card Component
// ============================================================================

function TimelineEventCard({ 
  event, 
  isLast,
}: { 
  event: TimelineEvent
  isLast: boolean
}) {
  const config = eventTypeConfig[event.type]
  const Icon = config.icon

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0',
          config.bg
        )}>
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 mt-2 min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <Badge className={cn(config.bg, config.iconColor)} size="xs">
                    {TIMELINE_EVENT_TYPE_LABELS[event.type]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                
                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(event.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {event.userId && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Utilisateur #{event.userId.slice(0, 8)}
                    </span>
                  )}
                </div>

                {/* Additional metadata from event.metadata */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-1">Détails:</p>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-gray-400">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Timeline Skeleton
// ============================================================================

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            {i < 4 && <div className="w-0.5 flex-1 bg-gray-200 mt-2 min-h-[24px]" />}
          </div>
          <div className="flex-1 pb-6">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Date Group Header
// ============================================================================

function DateGroupHeader({ date }: { date: string }) {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-sm font-medium text-gray-500 capitalize">{formattedDate}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TimelinePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get clientId from URL params
  const clientId = searchParams.get('clientId') || ''
  
  const [filters, setFilters] = useState<TimelineFiltersState>({
    types: [],
    dateFrom: '',
    dateTo: '',
  })

  const { data: timelineData, isLoading, refetch } = useComplianceTimeline(
    clientId,
    {
      type: filters.types.length > 0 ? filters.types : undefined,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    },
    { enabled: !!clientId }
  )

  const exportMutation = useExportComplianceTimeline()

  const events = timelineData?.data || []

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {}
    
    events.forEach(event => {
      const dateKey = new Date(event.createdAt).toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })

    // Sort dates descending (newest first)
    const sortedDates = Object.keys(groups).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    )

    return sortedDates.map(date => ({
      date,
      events: groups[date].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }))
  }, [events])

  const handleExportPDF = async () => {
    if (!clientId) return
    
    try {
      const blob = await exportMutation.mutateAsync({
        clientId,
        filters: {
          type: filters.types.length > 0 ? filters.types : undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        },
      })
      
      // Download the blob
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timeline-conformite-${clientId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const clearFilters = () => {
    setFilters({
      types: [],
      dateFrom: '',
      dateTo: '',
    })
  }

  const hasActiveFilters = filters.types.length > 0 || filters.dateFrom || filters.dateTo

  // Show client selection prompt if no clientId
  if (!clientId) {
    return (
      <div className="space-y-6 pb-8">
        <header className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/conformite')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <History className="h-6 w-6 text-indigo-600" />
              </div>
              Timeline Conformité
            </h1>
          </div>
        </header>

        <div className="space-y-4">
          <EmptyState
            icon={User}
            title="Sélectionnez un client"
            description="Pour afficher la timeline conformité, veuillez sélectionner un client depuis la vue Client 360 ou ajouter ?clientId=xxx à l'URL."
          />
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/clients')}
            >
              Voir les clients
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/conformite')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <History className="h-6 w-6 text-indigo-600" />
              </div>
              Timeline Conformité
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Historique chronologique des événements conformité
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={handleExportPDF}
            loading={exportMutation.isPending}
            className="gap-2 bg-[#7373FF] hover:bg-[#5c5ce6]"
          >
            <Download className="h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              Filtres:
            </div>
            
            <FilterDropdown
              label="Type d'événement"
              options={TIMELINE_EVENT_TYPES}
              selected={filters.types}
              onChange={(types) => setFilters(prev => ({ ...prev, types }))}
            />
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Du:</span>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-40 h-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Au:</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-40 h-9"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 text-gray-500"
              >
                <X className="h-4 w-4" />
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {!isLoading && events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  <p className="text-xs text-gray-500">Événements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => e.type === 'DOCUMENT_VALIDATED').length}
                  </p>
                  <p className="text-xs text-gray-500">Documents validés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => e.type === 'CONTROL_COMPLETED').length}
                  </p>
                  <p className="text-xs text-gray-500">Contrôles terminés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{groupedEvents.length}</p>
                  <p className="text-xs text-gray-500">Jours d'activité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <TimelineSkeleton />
      ) : events.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={History}
            title="Aucun événement"
            description={
              hasActiveFilters
                ? "Aucun événement ne correspond à vos critères de recherche."
                : "Aucun événement conformité enregistré pour ce client."
            }
          />
          {hasActiveFilters && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {groupedEvents.map((group, groupIndex) => (
            <div key={group.date}>
              <DateGroupHeader date={group.date} />
              <div className="space-y-0">
                {group.events.map((event, eventIndex) => (
                  <TimelineEventCard
                    key={event.id}
                    event={event}
                    isLast={
                      groupIndex === groupedEvents.length - 1 && 
                      eventIndex === group.events.length - 1
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
