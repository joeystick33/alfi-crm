import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { api, buildQueryString } from '@/app/_common/lib/api-client'
import type { TacheFilters, CreateTacheRequest } from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { queryKeys } from './query-keys'

// ============================================================================
// Task Hooks
// ============================================================================

export function useTasks(
  filters?: TacheFilters,
  options?: Omit<UseQueryOptions<Record<string, unknown>[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.taskList(filters),
    queryFn: () => api.get<Record<string, unknown>[]>(`/advisor/taches${buildQueryString(filters || {})}`),
    ...options,
  })
}

/**
 * Update task with optimistic update
 */
export function useUpdateTask(
  options?: UseMutationOptions<Record<string, unknown>, Error, { id: string; data: Partial<CreateTacheRequest> }, { previousTasks: [unknown, unknown][] }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => api.patch(`/advisor/taches/${id}`, data),
    // Optimistic update
    onMutate: async ({ id, data }): Promise<{ previousTasks: [unknown, unknown][] }> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks })

      // Snapshot previous values
      const previousTasks = queryClient.getQueriesData({ queryKey: queryKeys.tasks })

      // Optimistically update task in all queries
      queryClient.setQueriesData<Record<string, unknown> | Record<string, unknown>[]>(
        { queryKey: queryKeys.tasks },
        (old) => {
          if (!old) return old
          if (Array.isArray(old)) {
            return old.map((task) =>
              (task as Record<string, unknown>).id === id ? { ...task, ...data } : task
            )
          }
          const oldRecord = old as Record<string, unknown>
          if (oldRecord.data && Array.isArray(oldRecord.data)) {
            return {
              ...oldRecord,
              data: (oldRecord.data as Record<string, unknown>[]).map((task) =>
                task.id === id ? { ...task, ...data } : task
              ),
            }
          }
          return old
        }
      )

      return { previousTasks }
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey as string[], data)
        })
      }

      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la tâche.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
    ...options,
  })
}

/**
 * Create task with optimistic update
 */
export function useCreateTask(
  options?: UseMutationOptions<Record<string, unknown>, Error, CreateTacheRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTacheRequest) => api.post('/advisor/taches', data),
    onSuccess: () => {
      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      // Invalidate dashboard counters
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardCounters })

      toast({
        title: 'Tâche créée',
        description: 'La tâche a été créée avec succès.',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la tâche.',
        variant: 'destructive',
      })
    },
    ...options,
  })
}
