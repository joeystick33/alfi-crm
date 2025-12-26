/**
 * Settings Hook
 * 
 * React Query hooks for fetching and managing client settings.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ParametresData,
  CommunicationPreference,
  ReportingFrequency,
  BankAccount,
  NotificationSetting,
} from '@/app/_common/types/client360'

export interface SettingsResponse {
  success: boolean
  data: ParametresData
}

export interface UpdateSettingsParams {
  communication?: CommunicationPreference
  reportingFrequency?: ReportingFrequency
  language?: string
  taxYear?: number
  selectedRegime?: string
  bankAccounts?: BankAccount[]
  notifications?: NotificationSetting[]
  dataConsent?: boolean
  marketingConsent?: boolean
}

/**
 * Hook to fetch client settings
 */
export function useClientSettings(clientId: string) {
  return useQuery<SettingsResponse>({
    queryKey: ['settings', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/advisor/clients/${clientId}/settings`)
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to update client settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      ...updates
    }: UpdateSettingsParams & { clientId: string }) => {
      const response = await fetch(`/api/advisor/clients/${clientId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', variables.clientId] })
    },
  })
}

/**
 * Hook to update preferences only
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      communication,
      reportingFrequency,
      language,
    }: {
      clientId: string
      communication?: CommunicationPreference
      reportingFrequency?: ReportingFrequency
      language?: string
    }) => {
      const response = await fetch(`/api/advisor/clients/${clientId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communication, reportingFrequency, language }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update preferences')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', variables.clientId] })
    },
  })
}

/**
 * Hook to update fiscal parameters
 */
export function useUpdateFiscalParams() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      taxYear,
      selectedRegime,
    }: {
      clientId: string
      taxYear?: number
      selectedRegime?: string
    }) => {
      const response = await fetch(`/api/advisor/clients/${clientId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxYear, selectedRegime }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update fiscal parameters')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', variables.clientId] })
    },
  })
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      notifications,
    }: {
      clientId: string
      notifications: NotificationSetting[]
    }) => {
      const response = await fetch(`/api/advisor/clients/${clientId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update notifications')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', variables.clientId] })
    },
  })
}

/**
 * Hook to update privacy/consent settings
 */
export function useUpdatePrivacy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientId,
      dataConsent,
      marketingConsent,
    }: {
      clientId: string
      dataConsent?: boolean
      marketingConsent?: boolean
    }) => {
      const response = await fetch(`/api/advisor/clients/${clientId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataConsent, marketingConsent }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update privacy settings')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', variables.clientId] })
    },
  })
}
