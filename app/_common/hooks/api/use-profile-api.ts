 
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'ADVISOR' | 'ASSISTANT'
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: string
  lastLogin: string | null
  preferences: any
  cabinet: {
    id: string
    name: string
    plan: string
    status: string
  }
}

export interface NotificationPreferences {
  email: boolean
  tasks: boolean
  appointments: boolean
  clients: boolean
  marketing: boolean
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  preferences?: any
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  info: () => [...profileKeys.all, 'info'] as const,
  notifications: () => [...profileKeys.all, 'notifications'] as const,
}

// Récupérer le profil
export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: profileKeys.info(),
    queryFn: async () => {
      const response = await fetch('/api/advisor/profile', { credentials: 'include' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération du profil')
      }
      return response.json()
    },
  })
}

// Mettre à jour le profil
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.info() })
    },
  })
}

// Changer le mot de passe
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await fetch('/api/advisor/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du changement de mot de passe')
      }
      return response.json()
    },
  })
}

// Récupérer les préférences de notification
export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: profileKeys.notifications(),
    queryFn: async () => {
      const response = await fetch('/api/advisor/profile/notifications', { credentials: 'include' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération des préférences')
      }
      return response.json()
    },
  })
}

// Mettre à jour les préférences de notification
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const response = await fetch('/api/advisor/profile/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.notifications() })
    },
  })
}

// Upload avatar
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      const response = await fetch('/api/advisor/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'upload')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.info() })
    },
  })
}

// Supprimer l'avatar
export function useDeleteAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/advisor/profile/avatar', {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.info() })
    },
  })
}
