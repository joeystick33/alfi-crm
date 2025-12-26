/**
 * Activities Hook
 * 
 * React Query hooks for fetching and managing client activities.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ActivityType, Activity, ActivityFilter } from '@/app/_common/types/client360'

export interface ActivitiesFilters {
  types?: ActivityType[]
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
  offset?: number
}

export interface ActivitiesResponse {
  success: boolean
  data: {
    activities: Activity[]
    filters: ActivityFilter
    stats: {
      totalActivities: number
      byType: Record<string, number>
      recentCount: number
      financialLogsCount: number
      fiscalLogsCount: number
    }
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

/**
 * Hook to fetch client activities with filtering
 */
export function useClientActivities(clientId: string, filters?: ActivitiesFilters) {
  const queryParams = new URLSearchParams()
  
  if (filters?.types?.length) {
    queryParams.set('types', filters.types.join(','))
  }
  if (filters?.startDate) {
    queryParams.set('startDate', filters.startDate)
  }
  if (filters?.endDate) {
    queryParams.set('endDate', filters.endDate)
  }
  if (filters?.search) {
    queryParams.set('search', filters.search)
  }
  if (filters?.limit) {
    queryParams.set('limit', filters.limit.toString())
  }
  if (filters?.offset) {
    queryParams.set('offset', filters.offset.toString())
  }

  const queryString = queryParams.toString()
  const url = `/api/advisor/clients/${clientId}/activities${queryString ? `?${queryString}` : ''}`

  return useQuery<ActivitiesResponse>({
    queryKey: ['activities', clientId, filters],
    queryFn: async () => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      return response.json()
    },
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to create a new activity
 */
export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      type,
      title,
      description,
      linkedDocuments,
    }: {
      clientId: string
      type: ActivityType
      title: string
      description?: string
      linkedDocuments?: string[]
    }) => {
      const response = await fetch(`/api/advisor/clients/${clientId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description, linkedDocuments }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create activity')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate activities queries for this client
      queryClient.invalidateQueries({ queryKey: ['activities', variables.clientId] })
      // Also invalidate timeline queries for consistency
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.clientId] })
    },
  })
}
