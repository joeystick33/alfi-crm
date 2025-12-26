import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { createAdminClient } from '@/app/_common/lib/supabase/server'
import {
  parseConseillerFilters,
  normalizeConseillerCreatePayload,
  generateTemporaryPassword,
  type ConseillerFilters,
} from './utils'
import { hash } from 'bcryptjs'

/**
 * GET /api/advisor/conseillers
 * List all conseillers (advisors, assistants, managers) in cabinet
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse filters
    const { searchParams } = new URL(request.url)
    const filters: ConseillerFilters = parseConseillerFilters(searchParams)

    // Get Prisma client
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Build where clause for Prisma
    const where: any = {
      cabinetId: context.cabinetId,
    }

    if (filters.role) {
      where.role = filters.role
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Get conseillers with stats
    const conseillers = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            clientsPrincipaux: true,
            clientsRemplacants: true,
            taches: true,
            rendezvous: true,
            opportunites: true,
          },
        },
      },
      orderBy: filters.sortBy
        ? { [filters.sortBy]: filters.sortOrder || 'asc' }
        : { firstName: 'asc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    })

    // Get total count
    const total = await prisma.user.count({ where })

    // Format response
    const formatted = conseillers.map((c) => ({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      avatar: c.avatar,
      role: c.role,
      permissions: c.permissions,
      isActive: c.isActive,
      lastLogin: c.lastLogin,
      createdAt: c.createdAt,
      stats: {
        totalClients: c._count.clientsPrincipaux + c._count.clientsRemplacants,
        clientsPrincipaux: c._count.clientsPrincipaux,
        clientsRemplacants: c._count.clientsRemplacants,
        totalTasks: c._count.taches,
        totalAppointments: c._count.rendezvous,
        totalOpportunities: c._count.opportunites,
      },
    }))

    return createSuccessResponse({
      data: formatted,
      pagination: {
        total,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/advisor/conseillers:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/conseillers
 * Create a new conseiller
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Only ADMIN can create conseillers
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Seuls les administrateurs peuvent créer des conseillers', 403)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeConseillerCreatePayload(body)

    // Get Prisma client
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Check if email already exists
    const existing = await prisma.user.findFirst({
      where: {
        cabinetId: context.cabinetId,
        email: payload.email,
      },
    })

    if (existing) {
      return createErrorResponse('Un conseiller avec cet email existe déjà', 409)
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword()
    const hashedPassword = await hash(tempPassword, 12)

    // Create user
    const conseiller = await prisma.user.create({
      data: {
        cabinetId: context.cabinetId,
        email: payload.email,
        password: hashedPassword,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone || null,
        avatar: payload.avatar || null,
        role: payload.role as any, // Cast needed for UserRole enum
        permissions: payload.permissions ? JSON.parse(JSON.stringify(payload.permissions)) : null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Créer l'utilisateur dans Supabase Auth pour les emails de reset password
    try {
      const supabase = createAdminClient()
      const { error: authError } = await supabase.auth.admin.createUser({
        email: payload.email.toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          role: payload.role,
          cabinetId: context.cabinetId,
          isSuperAdmin: false,
          prismaUserId: conseiller.id,
        },
      })

      if (authError && !authError.message.includes('already')) {
        console.error('Erreur Supabase Auth:', authError)
      }
    } catch (supabaseError) {
      console.error('Erreur création Supabase:', supabaseError)
    }

    // TODO: Send welcome email with temporary password
    // This will be implemented in Phase 4 (Email provider)
    // SECURITY: Ne jamais logger les mots de passe en production
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV ONLY] Temporary password for ${conseiller.email}: ${tempPassword}`)
    }

    return createSuccessResponse({
      ...conseiller,
      tempPassword, // Include in response for now (remove when email is implemented)
    }, 201)
  } catch (error) {
    console.error('Error in POST /api/advisor/conseillers:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('Validation')) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
