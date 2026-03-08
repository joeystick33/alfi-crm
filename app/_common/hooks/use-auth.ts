'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/app/_common/lib/auth-helpers'

let cachedSessionUser: AuthUser | null | undefined
let inflightSessionRequest: Promise<AuthUser | null> | null = null

async function requestSession(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/session', { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`Session request failed (${response.status})`)
  }

  const data = (await response.json()) as { user?: AuthUser | null }
  return data.user ?? null
}

async function loadSession(options?: { force?: boolean }): Promise<AuthUser | null> {
  const force = options?.force === true

  if (!force && cachedSessionUser !== undefined) {
    return cachedSessionUser
  }

  if (!force && inflightSessionRequest) {
    return inflightSessionRequest
  }

  inflightSessionRequest = requestSession()
    .then(user => {
      cachedSessionUser = user
      return user
    })
    .catch(error => {
      cachedSessionUser = null
      throw error
    })
    .finally(() => {
      inflightSessionRequest = null
    })

  return inflightSessionRequest
}

function clearSessionCache(nextUser?: AuthUser | null) {
  cachedSessionUser = nextUser
  inflightSessionRequest = null
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => cachedSessionUser ?? null)
  const [isLoading, setIsLoading] = useState(() => cachedSessionUser === undefined)
  const router = useRouter()

  const syncSession = useCallback(async (force = false) => {
    setIsLoading(true)
    try {
      const nextUser = await loadSession({ force })
      setUser(nextUser)
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (cachedSessionUser !== undefined) return
    void syncSession()
  }, [syncSession])

  const isAuthenticated = !!user
  const isSuperAdmin = user && 'isSuperAdmin' in user ? (user.isSuperAdmin as boolean) : false
  const cabinetId = user && 'cabinetId' in user ? (user.cabinetId as string) : null

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
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      clearSessionCache(null)
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshSession = () => {
    clearSessionCache()
    void syncSession(true)
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
