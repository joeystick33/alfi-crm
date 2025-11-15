'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const user = session?.user

  const isSuperAdmin = user?.isSuperAdmin || false
  const cabinetId = user?.cabinetId || null

  const hasRole = (role: string | string[]) => {
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.role)
  }

  const requireAuth = () => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login')
    }
  }

  const requireSuperAdmin = () => {
    if (!isSuperAdmin && !isLoading) {
      router.push('/dashboard')
    }
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    cabinetId,
    hasRole,
    requireAuth,
    requireSuperAdmin,
  }
}
