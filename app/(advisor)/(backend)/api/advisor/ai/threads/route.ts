import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

// ============================================================================
// API Route — AI Chat Threads CRUD
// GET  → Liste les threads (avec dernier message)
// POST → Crée un nouveau thread
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    if (!cabinetId) return NextResponse.json({ error: 'Cabinet requis' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const archived = searchParams.get('archived') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const threads = await prisma.aIChatThread.findMany({
      where: {
        cabinetId,
        userId: user.id,
        archived,
      },
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { messages: true } },
      },
    })

    const result = threads.map(t => ({
      id: t.id,
      title: t.title,
      summary: t.summary,
      pinned: t.pinned,
      archived: t.archived,
      clientId: t.clientId,
      clientName: t.client ? `${t.client.firstName} ${t.client.lastName}` : null,
      messageCount: t._count.messages,
      lastMessage: t.messages[0] ? {
        content: t.messages[0].content.slice(0, 120),
        role: t.messages[0].role,
        createdAt: t.messages[0].createdAt,
      } : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))

    return NextResponse.json({ threads: result })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    if (!cabinetId) return NextResponse.json({ error: 'Cabinet requis' }, { status: 400 })

    const body = await req.json()
    const { title, clientId } = body as { title?: string; clientId?: string }

    const thread = await prisma.aIChatThread.create({
      data: {
        cabinetId,
        userId: user.id,
        clientId: clientId || null,
        title: title || 'Nouvelle conversation',
      },
    })

    return NextResponse.json({ thread })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
