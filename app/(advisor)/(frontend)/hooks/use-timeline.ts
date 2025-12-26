import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateTimelineEventParams {
  clientId: string
  type: string
  title: string
  description?: string
  relatedEntityType?: string
  relatedEntityId?: string
}

export function useClientTimeline(clientId: string) {
  return useQuery({
    queryKey: ['timeline', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/advisor/clients/${clientId}/timeline`)
      if (!response.ok) throw new Error('Failed to fetch timeline')
      const json = await response.json()
      const data = json?.data
      if (data?.events && Array.isArray(data.events)) {
        return data.events
      }
      if (Array.isArray(data)) {
        return data
      }
      return []
    },
  })
}

export function useCreateTimelineEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ clientId, ...data }: CreateTimelineEventParams) => {
      const response = await fetch(`/api/advisor/clients/${clientId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create timeline event')
      const json = await response.json()
      return json?.data ?? json
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.clientId] })
      queryClient.invalidateQueries({ queryKey: ['client-timeline', variables.clientId] })
    },
  })
}
