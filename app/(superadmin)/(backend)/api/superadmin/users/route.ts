import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Gestion des Utilisateurs
 * GET /api/superadmin/users - Liste tous les utilisateurs
 * POST /api/superadmin/users - Créer un utilisateur
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
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const cabinetId = url.searchParams.get('cabinetId')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('perPage') || '50')

    // Construire le filtre
     
    const where: any = {}

    if (role) {
      where.role = role
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (cabinetId) {
      where.cabinetId = cabinetId
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Compter le total
    const totalCount = await prisma.user.count({ where })

    // Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where,
      include: {
        cabinet: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    // Formater les données
     
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      cabinetId: user.cabinetId,
      cabinetName: user.cabinet?.name || 'N/A',
      cabinetPlan: user.cabinet?.plan || 'N/A',
    }))

    return NextResponse.json({
      users: formattedUsers,
      totalCount,
      page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    })
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { cabinetId, email, firstName, lastName, role, password } = body

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Vérifier que le cabinet existe
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
    })

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }

    // Hasher le mot de passe
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        cabinetId,
        email,
        firstName,
        lastName,
        role,
        password: hashedPassword,
        isActive: true,
      },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId,
        action: 'CREATION',
        entityType: 'User',
        entityId: user.id,
        changes: {
          created: {
            email,
            firstName,
            lastName,
            role,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Erreur création utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
