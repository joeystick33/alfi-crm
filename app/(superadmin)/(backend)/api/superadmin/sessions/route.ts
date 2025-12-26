import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Sessions Actives
 * GET /api/superadmin/sessions - Liste les sessions actives
 * DELETE /api/superadmin/sessions - Révoquer une session
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
    const cabinetId = url.searchParams.get('cabinetId')
    const userType = url.searchParams.get('userType') // user, superadmin
    const search = url.searchParams.get('search')

    // Construire le filtre
     
    const where: any = {
      isActive: true,
      expiresAt: { gt: new Date() },
    }

    if (cabinetId) {
      where.cabinetId = cabinetId
    }

    if (userType === 'superadmin') {
      where.superAdminId = { not: null }
      where.userId = null
    } else if (userType === 'user') {
      where.userId = { not: null }
      where.superAdminId = null
    }

    // Récupérer les sessions
    const sessions = await prisma.userSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        superAdmin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        cabinet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 100,
    })

    // Filtrer par recherche si nécessaire
    let filteredSessions = sessions
    if (search) {
      const q = search.toLowerCase()
       
      filteredSessions = sessions.filter((s: any) => {
        const email = s.user?.email || s.superAdmin?.email || ''
        const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 
                     s.superAdmin ? `${s.superAdmin.firstName} ${s.superAdmin.lastName}` : ''
        return email.toLowerCase().includes(q) || name.toLowerCase().includes(q)
      })
    }

    // Formater les données
     
    const formattedSessions = filteredSessions.map((session: any) => {
      const isUser = !!session.user
      const account = isUser ? session.user : session.superAdmin
      
      return {
        id: session.id,
        userType: isUser ? 'user' : 'superadmin',
        userId: account?.id,
        email: account?.email,
        name: account ? `${account.firstName} ${account.lastName}` : 'Inconnu',
        role: account?.role,
        cabinetId: session.cabinetId,
        cabinetName: session.cabinet?.name,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        location: session.location,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        isSuspicious: session.isSuspicious,
      }
    })

    // Statistiques
    interface FormattedSession { userType: string; isSuspicious: boolean }
    const stats = {
      total: formattedSessions.length,
      users: formattedSessions.filter((s: FormattedSession) => s.userType === 'user').length,
      superadmins: formattedSessions.filter((s: FormattedSession) => s.userType === 'superadmin').length,
      suspicious: formattedSessions.filter((s: FormattedSession) => s.isSuspicious).length,
    }

    return NextResponse.json({
      sessions: formattedSessions,
      stats,
    })
  } catch (error) {
    console.error('Erreur sessions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const body = await request.json()
    const { sessionId, revokeAll, userId, cabinetId } = body

    if (revokeAll && cabinetId) {
      // Révoquer toutes les sessions d'un cabinet
      await prisma.userSession.updateMany({
        where: { cabinetId, isActive: true },
        data: { isActive: false },
      })

      // Log d'audit
      await prisma.auditLog.create({
        data: {
          superAdminId: superAdmin.id,
          cabinetId,
          action: 'SUPPRESSION',
          entityType: 'Session',
          entityId: 'all',
          changes: { revokedAll: true, cabinetId },
        },
      })

      return NextResponse.json({ success: true, message: 'Toutes les sessions du cabinet révoquées' })
    }

    if (revokeAll && userId) {
      // Révoquer toutes les sessions d'un utilisateur
      await prisma.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      })

      await prisma.auditLog.create({
        data: {
          superAdminId: superAdmin.id,
          action: 'SUPPRESSION',
          entityType: 'Session',
          entityId: 'all',
          changes: { revokedAll: true, userId },
        },
      })

      return NextResponse.json({ success: true, message: 'Toutes les sessions de l\'utilisateur révoquées' })
    }

    if (sessionId) {
      // Révoquer une session spécifique
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        return NextResponse.json(
          { error: 'Session non trouvée' },
          { status: 404 }
        )
      }

      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false },
      })

      await prisma.auditLog.create({
        data: {
          superAdminId: superAdmin.id,
          cabinetId: session.cabinetId,
          action: 'SUPPRESSION',
          entityType: 'Session',
          entityId: sessionId,
          changes: { revoked: true },
        },
      })

      return NextResponse.json({ success: true, message: 'Session révoquée' })
    }

    return NextResponse.json(
      { error: 'Paramètres invalides' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erreur révocation session:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
