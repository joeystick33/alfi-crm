import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useClientTimeline(clientId: string) {
  return useQuery({
    queryKey: ['timeline', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/timeline`)
      if (!response.ok) throw new Error('Failed to fetch timeline')
      return response.json()
    },
  })
}

export function useCreateTimelineEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create timeline event')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}
