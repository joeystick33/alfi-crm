import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Gestion des Clients (Maintenance)
 * GET /api/superadmin/clients - Liste tous les clients de la plateforme
 */

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)

    // Paramètres de requête
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const cabinetId = url.searchParams.get('cabinetId')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('perPage') || '20')

    // Construire le filtre
    const where: any = {}

    if (type) {
      where.clientType = type
    }

    if (status) {
      where.status = status
    }

    if (cabinetId) {
      where.cabinetId = cabinetId
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Compter le total
    const totalCount = await prisma.client.count({ where })

    // Récupérer les clients
    const clients = await prisma.client.findMany({
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
    const formattedClients = clients.map((client) => {
      // Extraire la ville du champ address JSON
      const address = client.address as { city?: string } | null
      return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        type: client.clientType,
        status: client.status,
        createdAt: client.createdAt,
        cabinetId: client.cabinetId,
        cabinetName: client.cabinet?.name || 'N/A',
        cabinetPlan: client.cabinet?.plan || 'N/A',
        city: address?.city || null,
      }
    })

    return NextResponse.json({
      clients: formattedClients,
      totalCount,
      page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    })
  } catch (error: any) {
    console.error('Erreur liste clients:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
