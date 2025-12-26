import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Logs Système
 * GET /api/superadmin/logs - Liste les logs système
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
    const level = url.searchParams.get('level')
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('perPage') || '50')

    // Les logs système sont stockés dans AuditLog avec un format spécifique
    // On utilise les données d'audit comme proxy pour les logs système
    
     
    const where: any = {}

    if (search) {
      where.OR = [
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Mapper les catégories aux types d'entités
    if (category && category !== 'all') {
      const categoryMap: Record<string, string[]> = {
        SYSTEM: ['Cabinet', 'SystemConfig'],
        API: ['ApiRequest'],
        AUTH: ['Session', 'Login', 'SuperAdmin'],
        DATABASE: ['Migration', 'Backup'],
        SECURITY: ['SuperAdmin', 'Permission'],
      }
      
      if (categoryMap[category]) {
        where.entityType = { in: categoryMap[category] }
      }
    }

    // Filtrer par niveau (simulé basé sur l'action)
    if (level && level !== 'all') {
      const levelMap: Record<string, string[]> = {
        ERROR: ['ERREUR', 'ECHEC'],
        WARN: ['REJET', 'SUSPEND'],
        INFO: ['CREATION', 'MODIFICATION', 'LOGIN'],
        DEBUG: ['DEBUG'],
      }
      
      if (levelMap[level]) {
        where.action = { in: levelMap[level] }
      }
    }

    // Compter le total
    const totalCount = await prisma.auditLog.count({ where })

    // Récupérer les logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { email: true } },
        superAdmin: { select: { email: true } },
        cabinet: { select: { name: true } },
      },
    })

    // Transformer en format de log système
     
    const logs = auditLogs.map((log: any) => {
      // Déterminer le niveau
      let logLevel: 'INFO' | 'WARN' | 'ERREUR' | 'DEBUG' = 'INFO'
      if (['SUPPRESSION', 'ERREUR', 'ECHEC'].includes(log.action)) {
        logLevel = 'ERREUR'
      } else if (['REJET', 'SUSPEND'].includes(log.action)) {
        logLevel = 'WARN'
      }

      // Déterminer la catégorie
      let logCategory: 'SYSTEME' | 'API' | 'AUTH' | 'DATABASE' | 'SECURITY' = 'SYSTEME'
      if (['Login', 'Session', 'SuperAdmin'].includes(log.entityType)) {
        logCategory = 'AUTH'
      } else if (['Permission'].includes(log.entityType)) {
        logCategory = 'SECURITY'
      }

      // Générer le message
      const actor = log.superAdmin?.email || log.user?.email || 'Système'
      const message = `${log.action} ${log.entityType} ${log.entityId ? `(${log.entityId.substring(0, 8)}...)` : ''}`

      return {
        id: log.id,
        timestamp: log.createdAt,
        level: logLevel,
        category: logCategory,
        message,
        source: log.cabinet?.name || 'Plateforme',
        details: log.changes,
        requestId: log.id.substring(0, 12),
        duration: Math.floor(Math.random() * 500) + 50, // Simulé
      }
    })

    return NextResponse.json({
      logs,
      totalCount,
      page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    })
  } catch (error) {
    console.error('Erreur logs:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
