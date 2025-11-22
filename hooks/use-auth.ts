'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/lib/supabase/auth-helpers'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        setUser(data.user || null)
      } catch (error) {
        console.error('Failed to fetch session:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [])

  const isAuthenticated = !!user
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

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshSession = () => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        setUser(data.user || null)
      } catch (error) {
        console.error('Failed to fetch session:', error)
        setUser(null)
      }
    }
    fetchSession()
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    cabinetId,
    hasRole,
    requireAuth,
    requireSuperAdmin,
    logout,
    refreshSession,
  }
}
