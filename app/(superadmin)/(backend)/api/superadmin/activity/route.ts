import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Logs d'Activité
 * GET /api/superadmin/activity - Liste les logs d'audit
 */

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Paramètres de requête
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const entityType = url.searchParams.get('entityType')
    const cabinetId = url.searchParams.get('cabinetId')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('perPage') || '50')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Construire le filtre
     
    const where: any = {}

    if (action) {
      where.action = action
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (cabinetId) {
      where.cabinetId = cabinetId
    }

    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate),
      }
    }

    if (search) {
      where.OR = [
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Compter le total
    const totalCount = await prisma.auditLog.count({ where })

    // Récupérer les logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        superAdmin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        cabinet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    // Formater les données
     
    const formattedLogs = logs.map((log: any) => {
      // Déterminer l'acteur
      let actorName = 'Système'
      let actorEmail = ''
      let actorType: 'user' | 'superadmin' | 'system' = 'system'
      
      if (log.superAdmin) {
        actorName = `${log.superAdmin.firstName} ${log.superAdmin.lastName}`
        actorEmail = log.superAdmin.email
        actorType = 'superadmin'
      } else if (log.user) {
        actorName = `${log.user.firstName} ${log.user.lastName}`
        actorEmail = log.user.email
        actorType = 'user'
      }

      // Générer une description lisible
      const description = generateDescription(log.action, log.entityType, log.changes)

      return {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description,
        actorName,
        actorEmail,
        actorType,
        cabinetId: log.cabinetId,
        cabinetName: log.cabinet?.name || null,
        changes: log.changes,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      }
    })

    return NextResponse.json({
      logs: formattedLogs,
      totalCount,
      page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    })
  } catch (error) {
    console.error('Erreur liste activity:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Générer une description lisible pour le log
 
function generateDescription(action: string, entityType: string, changes: any): string {
  const actionLabels: Record<string, string> = {
    CREATE: 'Création',
    UPDATE: 'Modification',
    DELETE: 'Suppression',
    LOGIN: 'Connexion',
    LOGOUT: 'Déconnexion',
    EXPORT: 'Export',
    IMPORT: 'Import',
    ARCHIVE: 'Archivage',
  }

  const entityLabels: Record<string, string> = {
    User: 'utilisateur',
    Client: 'client',
    Cabinet: 'cabinet',
    SuperAdmin: 'superadmin',
    Simulation: 'simulation',
    Document: 'document',
    Invoice: 'facture',
  }

  const actionLabel = actionLabels[action] || action
  const entityLabel = entityLabels[entityType] || entityType

  let description = `${actionLabel} d'un ${entityLabel}`

  if (changes) {
    if (changes.name) {
      description += ` "${changes.name}"`
    } else if (changes.email) {
      description += ` (${changes.email})`
    } else if (changes.created?.email) {
      description += ` (${changes.created.email})`
    }
  }

  return description
}
