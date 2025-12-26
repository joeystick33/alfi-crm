'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface SuperAdminProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string | null
  role: string
  permissions?: string[]
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

const superAdminProfileKeys = {
  info: () => ['superadmin-profile'] as const,
}

export function useSuperAdminProfile() {
  return useQuery<SuperAdminProfile>({
    queryKey: superAdminProfileKeys.info(),
    queryFn: async () => {
      const response = await fetch('/api/superadmin/profile', { credentials: 'include' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la récupération du profil')
      }
      return response.json()
    },
  })
}

export function useUploadSuperAdminAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      const response = await fetch('/api/superadmin/profile/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l’upload')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superAdminProfileKeys.info() })
    },
  })
}

export function useDeleteSuperAdminAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/superadmin/profile/avatar', {
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
      queryClient.invalidateQueries({ queryKey: superAdminProfileKeys.info() })
    },
  })
}
