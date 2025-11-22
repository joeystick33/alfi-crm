import { createClient as createServerClient } from './server'
import { prisma } from '../prisma'
import { NextResponse } from 'next/server'

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  cabinetId: string | null
  cabinetName?: string
  cabinetSlug?: string
  isSuperAdmin: boolean
}

/**
 * Get the authenticated user with full profile from database
 * Works for both SuperAdmin and regular Users
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient()
  
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  if (!supabaseUser) {
    return null
  }

  // Check if user is SuperAdmin
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: supabaseUser.email!.toLowerCase() },
  })

  if (superAdmin) {
    if (!superAdmin.isActive) {
      console.log('getAuthUser: SuperAdmin inactive')
      return null
    }

    return {
      id: superAdmin.id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      role: superAdmin.role,
      cabinetId: null,
      isSuperAdmin: true,
    }
  }

  // Check if regular User
  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email!.toLowerCase() },
    include: { cabinet: true },
  })

  if (!user) {
    console.log('getAuthUser: User not found')
    return null
  }

  console.log('getAuthUser: Regular user found', user.email, user.role)

  if (!user.isActive) {
    console.log('getAuthUser: User inactive')
    return null
  }

  // Check cabinet status
  if (user.cabinet.status === 'SUSPENDED' || user.cabinet.status === 'TERMINATED') {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    cabinetId: user.cabinetId,
    cabinetName: user.cabinet.name,
    cabinetSlug: user.cabinet.slug,
    isSuperAdmin: false,
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser()
  return user !== null
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Check if user is SuperAdmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getAuthUser()
  return user?.isSuperAdmin === true
}

/**
 * Require SuperAdmin role - throws error if not SuperAdmin
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (!user.isSuperAdmin) {
    throw new Error('Forbidden: SuperAdmin access required')
  }
  return user
}

/**
 * Get user's cabinet ID - throws error if no cabinet
 */
export async function requireCabinetId(): Promise<string> {
  const user = await requireAuth()
  if (!user.cabinetId) {
    throw new Error('No cabinet associated with user')
  }
  return user.cabinetId
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: unknown, status = 500) {
  console.error('API Error:', error)
  const message = error instanceof Error ? error.message : 'Internal Server Error'
  return NextResponse.json({ success: false, error: message }, { status })
}
