 
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user) || !context.cabinetId) {
      return NextResponse.json({ error: 'Invalid user or cabinet' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'

    const where: any = {
      cabinetId: context.cabinetId,
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
