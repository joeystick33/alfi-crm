import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * GET /api/superadmin/cabinets
 * Liste tous les cabinets (SuperAdmin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)

    const cabinets = await prisma.cabinet.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ cabinets })
  } catch (error: any) {
    console.error('List cabinets error:', error?.message)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    if (error.message === 'Forbidden: SuperAdmin access required') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
