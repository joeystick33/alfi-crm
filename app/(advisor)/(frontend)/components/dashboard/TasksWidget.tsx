'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  User,
  ChevronRight,
  Loader2,
  Flag
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import { apiCall } from '@/app/_common/lib/api-client'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types
type TaskPriority = 'URGENTE' | 'HAUTE' | 'MOYENNE' | 'BASSE'
type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | Date
  type?: string
  completedAt?: Date | null
  relatedParticulierId?: {
    prenom: string
    nom: string
  }
}

type ApiTaskStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
type ApiTaskPriority = 'URGENTE' | 'HAUTE' | 'MOYENNE' | 'BASSE'

type ApiTask = {
  id: string
  title: string
  description: string | null
  status: ApiTaskStatus
  priority: ApiTaskPriority
  dueDate: string | Date | null
  type?: string
  completedAt: string | Date | null
  client?: { id: string; firstName: string; lastName: string } | null
}

const toTaskStatus = (value: string): TaskStatus => {
  if (value === 'A_FAIRE' || value === 'EN_COURS' || value === 'TERMINE' || value === 'ANNULE') return value
  if (value === 'TODO') return 'A_FAIRE'
  if (value === 'IN_PROGRESS') return 'EN_COURS'
  if (value === 'DONE') return 'TERMINE'
  return 'A_FAIRE'
}

const toTaskPriority = (value: string): TaskPriority => {
  if (value === 'URGENTE' || value === 'HAUTE' || value === 'MOYENNE' || value === 'BASSE') return value
  return 'MOYENNE'
}

const toDateOrNull = (value: unknown): Date | null => {
  if (value === null || value === undefined) return null
  const d = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

const mapApiTaskToTask = (t: ApiTask): Task => {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    status: toTaskStatus(t.status),
    priority: toTaskPriority(t.priority),
    dueDate: t.dueDate ?? undefined,
    type: t.type,
    completedAt: toDateOrNull(t.completedAt),
    relatedParticulierId: t.client ? { prenom: t.client.firstName, nom: t.client.lastName } : undefined,
  }
}

interface TasksWidgetProps {
  maxTasks?: number
  className?: string
  onTaskUpdate?: (task: Task) => void
}

interface PriorityConfig {
  label: string
  color: string
  icon: string
  order: number
}

interface StatusConfig {
  label: string
  color: string
}

const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  URGENTE: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-700',
    icon: '🔥',
    order: 4
  },
  HAUTE: {
    label: 'Haute',
    color: 'bg-orange-100 text-orange-700',
    icon: '⚡',
    order: 3
  },
  MOYENNE: {
    label: 'Normale',
    color: 'bg-blue-100 text-blue-700',
    icon: '📋',
    order: 2
  },
  BASSE: {
    label: 'Basse',
    color: 'bg-gray-100 text-gray-700',
    icon: '📝',
    order: 1
  }
}

const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  A_FAIRE: { label: 'À faire', color: 'text-gray-600' },
  EN_COURS: { label: 'En cours', color: 'text-blue-600' },
  TERMINE: { label: 'Terminée', color: 'text-green-600' },
  ANNULE: { label: 'Annulée', color: 'text-red-600' }
}

export default function TasksWidget({ 
  maxTasks = 5,
  className,
  onTaskUpdate
}: TasksWidgetProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiCall<ApiTask[]>(
        `/api/advisor/taches?limit=${maxTasks}&status=A_FAIRE,EN_COURS&sort=priority,dueDate`
      )

      setTasks(Array.isArray(response) ? response.map(mapApiTaskToTask) : [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tâches')
    } finally {
      setLoading(false)
    }
  }, [maxTasks])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Toggle task status
  const toggleTaskStatus = useCallback(async (taskId: string, currentStatus: TaskStatus) => {
    try {
      setUpdating(taskId)

      const newStatus: TaskStatus = currentStatus === 'TERMINE' ? 'A_FAIRE' : 'TERMINE'

      const updatedTask = await apiCall<ApiTask>(`/api/advisor/taches/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })

      // Optimistic update
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, completedAt: newStatus === 'TERMINE' ? new Date() : null }
            : task
        )
      )

      onTaskUpdate?.(mapApiTaskToTask(updatedTask))

      // Refetch to get updated list
      setTimeout(fetchTasks, 500)
    } catch (err) {
      console.error('Error updating task:', err)
    } finally {
      setUpdating(null)
    }
  }, [fetchTasks, onTaskUpdate])

  // Navigate to task details
  const handleTaskClick = useCallback((taskId: string) => {
    router.push(`/dashboard/taches/${taskId}`)
  }, [router])

  // Navigate to all tasks
  const handleViewAll = useCallback(() => {
    router.push('/dashboard/taches')
  }, [router])

  // Get due date display
  const getDueDateDisplay = (dueDate?: string | Date) => {
    if (!dueDate) return null

    const date = new Date(dueDate)
    const isOverdue = isPast(date) && !isToday(date)
    const daysDiff = differenceInDays(date, new Date())

    let label = ''
    let color = ''

    if (isOverdue) {
      const daysOverdue = Math.abs(daysDiff)
      label = daysOverdue === 1 ? 'En retard de 1 jour' : `En retard de ${daysOverdue} jours`
      color = 'text-red-600'
    } else if (isToday(date)) {
      label = "Aujourd'hui"
      color = 'text-orange-600'
    } else if (isTomorrow(date)) {
      label = 'Demain'
      color = 'text-yellow-600'
    } else if (daysDiff <= 7) {
      label = format(date, 'EEEE', { locale: fr })
      color = 'text-blue-600'
    } else {
      label = format(date, 'd MMM', { locale: fr })
      color = 'text-gray-600'
    }

    return { label, color, isOverdue }
  }

  // Sort tasks by priority and due date
  const sortedTasks = [...tasks].sort((a, b) => {
    // First by priority
    const priorityA = PRIORITY_CONFIG[a.priority]?.order || 0
    const priorityB = PRIORITY_CONFIG[b.priority]?.order || 0
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA
    }

    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (a.dueDate) return -1
    if (b.dueDate) return 1

    return 0
  })

  if (loading) {
    return (
      <div className={cn(
        'bg-white rounded-lg border border-gray-200 p-6',
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Mes tâches</h3>
          </div>
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn(
        'bg-white rounded-lg border border-gray-200 p-6',
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Mes tâches</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTasks}>
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 overflow-hidden',
      className
    )}
    role="region"
    aria-label="Widget des tâches"
    aria-busy={loading}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900" id="tasks-widget-title">Mes tâches</h3>
            {tasks.length > 0 && (
              <Badge variant="secondary" className="ml-2" aria-label={`${tasks.length} tâches`}>
                {tasks.length}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-blue-600 hover:text-blue-700"
            aria-label="Voir toutes les tâches"
          >
            Voir tout
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="divide-y divide-gray-200" role="list" aria-labelledby="tasks-widget-title">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 px-6" role="status">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-500 text-sm">
              Aucune tâche en cours
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Vous êtes à jour ! 🎉
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const dueDateInfo = getDueDateDisplay(task.dueDate)
            const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MOYENNE
            const isCompleted = task.status === 'TERMINE'

            const taskAriaLabel = `${task.title}, priorité ${priorityConfig.label}${dueDateInfo ? `, échéance ${dueDateInfo.label}` : ''}${isCompleted ? ', terminée' : ', à faire'}`

            return (
              <div
                key={task.id}
                className={cn(
                  'px-6 py-4 hover:bg-gray-50 transition-colors',
                  dueDateInfo?.isOverdue && !isCompleted && 'bg-red-50/50'
                )}
                role="listitem"
                aria-label={taskAriaLabel}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    disabled={updating === task.id}
                    className={cn(
                      'flex-shrink-0 mt-0.5 transition-all',
                      updating === task.id && 'opacity-50 cursor-not-allowed'
                    )}
                    aria-label={isCompleted ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                    aria-pressed={isCompleted}
                  >
                    {updating === task.id ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <button
                        onClick={() => handleTaskClick(task.id)}
                        className={cn(
                          'text-sm font-medium text-left hover:text-blue-600 transition-colors',
                          isCompleted 
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        )}
                        aria-label={`Voir les détails de la tâche: ${task.title}`}
                      >
                        {task.title}
                      </button>

                      {/* Priority Badge */}
                      <Badge className={cn('flex-shrink-0', priorityConfig.color)}>
                        <span className="mr-1">{priorityConfig.icon}</span>
                        {priorityConfig.label}
                      </Badge>
                    </div>

                    {/* Task Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {/* Due Date */}
                      {dueDateInfo && (
                        <span className={cn(
                          'flex items-center gap-1 font-medium',
                          dueDateInfo.color
                        )}>
                          {dueDateInfo.isOverdue ? (
                            <AlertCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {dueDateInfo.label}
                        </span>
                      )}

                      {/* Client */}
                      {task.relatedParticulierId && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {task.relatedParticulierId.prenom} {task.relatedParticulierId.nom}
                        </span>
                      )}

                      {/* Type */}
                      {task.type && task.type !== 'AUTRE' && (
                        <span className="flex items-center gap-1">
                          <Flag className="h-3.5 w-3.5" />
                          {task.type}
                        </span>
                      )}
                    </div>

                    {/* Description Preview */}
                    {task.description && !isCompleted && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {sortedTasks.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Voir toutes les tâches
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
