'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  User,
  ChevronRight,
  Loader2,
  Calendar,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiCall } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const PRIORITY_CONFIG = {
  URGENT: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    icon: '🔥',
    order: 4
  },
  HIGH: {
    label: 'Haute',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    icon: '⚡',
    order: 3
  },
  MEDIUM: {
    label: 'Normale',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    icon: '📋',
    order: 2
  },
  LOW: {
    label: 'Basse',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    icon: '📝',
    order: 1
  }
};

const STATUS_CONFIG = {
  TODO: { label: 'À faire', color: 'text-gray-600 dark:text-gray-400' },
  IN_PROGRESS: { label: 'En cours', color: 'text-blue-600 dark:text-blue-400' },
  COMPLETED: { label: 'Terminée', color: 'text-green-600 dark:text-green-400' },
  CANCELLED: { label: 'Annulée', color: 'text-red-600 dark:text-red-400' }
};

export default function TasksWidget({ 
  maxTasks = 5,
  className,
  onTaskUpdate
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(
        `/api/advisor/tasks?limit=${maxTasks}&status=TODO,IN_PROGRESS&sort=priority,dueDate`
      );

      if (response.success) {
        // Handle API response format { tasks: [], stats: ... }
        const tasksList = response.data?.tasks || response.data || [];
        setTasks(Array.isArray(tasksList) ? tasksList : []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [maxTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Toggle task status
  const toggleTaskStatus = useCallback(async (taskId, currentStatus) => {
    try {
      setUpdating(taskId);

      const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';

      const response = await apiCall(`/api/advisor/tasks/${taskId}`, {
        method: 'PUT',
        body: { status: newStatus }
      });

      if (response.success) {
        // Optimistic update
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { ...task, status: newStatus, completedAt: newStatus === 'TERMINEE' ? new Date() : null }
              : task
          )
        );

        // Callback for parent component
        onTaskUpdate?.(response.data);

        // Refetch to get updated list
        setTimeout(fetchTasks, 500);
      }
    } catch (err) {
      console.error('Error updating task:', err);
    } finally {
      setUpdating(null);
    }
  }, [fetchTasks, onTaskUpdate]);

  // Navigate to task details
  const handleTaskClick = useCallback((taskId) => {
    router.push(`/dashboard/taches/${taskId}`);
  }, [router]);

  // Navigate to all tasks
  const handleViewAll = useCallback(() => {
    router.push('/dashboard/taches');
  }, [router]);

  // Get due date display
  const getDueDateDisplay = (dueDate) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    const daysDiff = differenceInDays(date, new Date());

    let label = '';
    let color = '';

    if (isOverdue) {
      const daysOverdue = Math.abs(daysDiff);
      label = daysOverdue === 1 ? 'En retard de 1 jour' : `En retard de ${daysOverdue} jours`;
      color = 'text-red-600 dark:text-red-400';
    } else if (isToday(date)) {
      label = "Aujourd'hui";
      color = 'text-orange-600 dark:text-orange-400';
    } else if (isTomorrow(date)) {
      label = 'Demain';
      color = 'text-yellow-600 dark:text-yellow-400';
    } else if (daysDiff <= 7) {
      label = format(date, 'EEEE', { locale: fr });
      color = 'text-blue-600 dark:text-blue-400';
    } else {
      label = format(date, 'd MMM', { locale: fr });
      color = 'text-gray-600 dark:text-gray-400';
    }

    return { label, color, isOverdue };
  };

  // Sort tasks by priority and due date
  const sortedTasks = [...tasks].sort((a, b) => {
    // First by priority
    const priorityA = PRIORITY_CONFIG[a.priority]?.order || 0;
    const priorityB = PRIORITY_CONFIG[b.priority]?.order || 0;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    return 0;
  });

  if (loading) {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Mes tâches</h3>
          </div>
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Mes tâches</h3>
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
    );
  }

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
      className
    )}
    role="region"
    aria-label="Widget des tâches"
    aria-busy={loading}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 dark:text-white" id="tasks-widget-title">Mes tâches</h3>
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
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            aria-label="Voir toutes les tâches"
          >
            Voir tout
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700" role="list" aria-labelledby="tasks-widget-title">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 px-6" role="status">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Aucune tâche en cours
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Vous êtes à jour ! 🎉
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const dueDateInfo = getDueDateDisplay(task.dueDate);
            const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMALE;
            const isCompleted = task.status === 'TERMINEE';

            const taskAriaLabel = `${task.title}, priorité ${priorityConfig.label}${dueDateInfo ? `, échéance ${dueDateInfo.label}` : ''}${isCompleted ? ', terminée' : ', à faire'}`;

            return (
              <div
                key={task.id}
                className={cn(
                  'px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                  dueDateInfo?.isOverdue && !isCompleted && 'bg-red-50/50 dark:bg-red-900/10'
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
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <button
                        onClick={() => handleTaskClick(task.id)}
                        className={cn(
                          'text-sm font-medium text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors',
                          isCompleted 
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-white'
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
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {sortedTasks.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Voir toutes les tâches
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
