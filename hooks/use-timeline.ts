import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { TimelineEventType } from '@prisma/client'

export interface TimelineEvent {
  id: string
  clientId: string
  type: TimelineEventType
  title: string
  description?: string
  relatedEntityType?: string
  relatedEntityId?: string
  createdAt: string
  createdBy?: string
}

export interface CreateTimelineEventInput {
  type: TimelineEventType
  title: string
  description?: string
  relatedEntityType?: string
  relatedEntityId?: string
}

/**
 * Hook pour récupérer la timeline d'un client
 */
export function useClientTimeline(clientId: string, limit: number = 50) {
  return useQuery<TimelineEvent[]>({
    queryKey: ['clients', clientId, 'timeline', limit],
    queryFn: async () => {
      const response = await apiClient.get(`/clients/${clientId}/timeline?limit=${limit}`)
      return response.data
    },
    enabled: !!clientId,
  })
}

/**
 * Hook pour créer un événement dans la timeline
 */
export function useCreateTimelineEvent(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTimelineEventInput) => {
      const response = await apiClient.post(`/clients/${clientId}/timeline`, data)
      return response.data
    },
    onSuccess: () => {
      // Invalider le cache de la timeline
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'timeline'] })
    },
  })
}
