 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/management/reunions
 * Récupère les réunions et points 1-to-1 du cabinet
 * Accessible uniquement par les ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const upcoming = searchParams.get('upcoming') === 'true'

    const now = new Date()

    // Get all cabinet users for participant info
    const cabinetUsers = await prisma.user.findMany({
      where: {
        cabinetId: context.cabinetId,
        role: { in: ['ADVISOR', 'ASSISTANT', 'ADMIN'] },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true }
    })

    // Build where clause for rendez-vous
    const whereClause: any = {
      cabinetId: context.cabinetId,
      type: { in: ['REUNION', 'ONE_TO_ONE', 'FORMATION'] },
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    if (upcoming) {
      whereClause.startDate = { gte: now }
    }

    // Get rendez-vous as reunions
    const rdvs = await prisma.rendezVous.findMany({
      where: whereClause,
      include: {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { startDate: upcoming ? 'asc' : 'desc' },
      take: 50,
    })

    // Map to reunion format
    const reunions = rdvs.map((rdv: any) => {
      const startDate = new Date(rdv.startDate)
      const endDate = rdv.endDate ? new Date(rdv.endDate) : null
      const duration = endDate 
        ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)) 
        : 60

      // Determine participants
      const participants = []
      if (rdv.conseiller) {
        participants.push({
          id: rdv.conseiller.id,
          firstName: rdv.conseiller.firstName,
          lastName: rdv.conseiller.lastName,
        })
      }

      // Determine status
      let status = 'PLANIFIE'
      if (startDate < now && (!endDate || endDate < now)) {
        status = 'TERMINE'
      } else if (startDate <= now && endDate && endDate > now) {
        status = 'EN_COURS'
      }

      return {
        id: rdv.id,
        title: rdv.titre || `Réunion ${rdv.type}`,
        type: mapRdvType(rdv.type),
        status,
        date: startDate.toISOString().split('T')[0],
        time: startDate.toTimeString().slice(0, 5),
        duration,
        location: rdv.lieu || null,
        videoLink: rdv.lienVisio || null,
        participants,
        agenda: rdv.description ? rdv.description.split('\n').filter((l: string) => l.trim()) : [],
        notes: rdv.notes || null,
        recurring: null, // Would need additional field in schema
        createdAt: rdv.createdAt.toISOString().split('T')[0],
      }
    })

    return createSuccessResponse({ reunions })
  } catch (error) {
    logger.error('Error in GET /api/advisor/management/reunions:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/management/reunions
 * Créer une nouvelle réunion
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    const body = await request.json()

    const { title, type, date, time, duration, location, videoLink, agenda, participantIds, recurring } = body

    if (!title || !date || !time) {
      return createErrorResponse('Champs requis: title, date, time', 400)
    }

    // Parse date and time
    const [hours, minutes] = time.split(':').map(Number)
    const startDate = new Date(date)
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + (duration || 60))

    // Create rendez-vous for the admin first
    const rdv = await prisma.rendezVous.create({
      data: {
        cabinetId: context.cabinetId,
        conseillerId: user.id,
        title: title,
        type: reverseMapType(type) as any,
        startDate: startDate,
        endDate: endDate,
        location: location || null,
        meetingUrl: videoLink || null,
        description: Array.isArray(agenda) ? agenda.join('\n') : agenda || '',
        status: 'PLANIFIE',
      }
    })

    // If there are other participants, create linked rendez-vous for them
    if (participantIds && participantIds.length > 0) {
      for (const participantId of participantIds) {
        if (participantId !== user.id) {
          await prisma.rendezVous.create({
            data: {
              cabinetId: context.cabinetId,
              conseillerId: participantId,
              title: title,
              type: reverseMapType(type) as any,
              startDate: startDate,
              endDate: endDate,
              location: location || null,
              meetingUrl: videoLink || null,
              description: Array.isArray(agenda) ? agenda.join('\n') : agenda || '',
              status: 'PLANIFIE',
              // Could link to parent rdv if schema supports it
            }
          })
        }
      }
    }

    return createSuccessResponse({
      id: rdv.id,
      title,
      type,
      status: 'PLANIFIE',
      date: startDate.toISOString().split('T')[0],
      time,
      duration: duration || 60,
      location,
      videoLink,
      recurring,
      createdAt: rdv.createdAt.toISOString().split('T')[0],
    }, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/management/reunions:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

// Helper functions
function mapRdvType(type: string): string {
  const mapping: Record<string, string> = {
    'REUNION': 'TEAM',
    'ONE_TO_ONE': 'ONE_TO_ONE',
    'FORMATION': 'TRAINING',
    'AUTRE': 'AUTRE',
  }
  return mapping[type] || 'AUTRE'
}

function reverseMapType(type: string): string {
  const mapping: Record<string, string> = {
    'TEAM': 'REUNION',
    'ONE_TO_ONE': 'ONE_TO_ONE',
    'TRAINING': 'FORMATION',
    'AUTRE': 'AUTRE',
  }
  return mapping[type] || 'AUTRE'
}
