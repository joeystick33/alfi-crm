import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/supabase/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!isRegularUser(user) || !user.cabinetId) {
      return NextResponse.json({ error: 'Invalid user or cabinet' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    const where: any = {
      cabinetId: user.cabinetId,
      userId: user.id,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const emails = await prisma.syncedEmail.findMany({
      where,
      orderBy: { receivedAt: order },
      take: limit,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json({ emails })
  } catch (error) {
    console.error('Error fetching advisor emails:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
