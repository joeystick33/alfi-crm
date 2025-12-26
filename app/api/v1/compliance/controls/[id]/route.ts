/**
 * API Routes for Single Compliance Control
 * 
 * GET /api/v1/compliance/controls/[id] - Get control by ID
 * PATCH /api/v1/compliance/controls/[id] - Update control
 * 
 * @requirements 4.2-4.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getControlById, startControl } from '@/lib/compliance/services/control-service'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/compliance/controls/[id]
 * Get a single control by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    const { id } = await params

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    const result = await getControlById(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    // Verify control belongs to cabinet
    if (result.data?.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Contrôle non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/v1/compliance/controls/[id]
 * Update a control (description, priority, dueDate, start)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    const { id } = await params

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Check control exists and belongs to cabinet
    const existingControl = await prisma.kYCCheck.findUnique({
      where: { id },
    })

    if (!existingControl || existingControl.cabinetId !== cabinetId) {
      return NextResponse.json(
        { error: 'Contrôle non trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Handle special action: start control
    if (body.action === 'start') {
      const result = await startControl(id)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json({ data: result.data })
    }

    // Only allow updating certain fields
    const updateSchema = z.object({
      description: z.string().max(2000).optional(),
      priority: z.enum(['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE']).optional(),
      dueDate: z.coerce.date().optional(),
      isACPRMandatory: z.boolean().optional(),
    })

    const validatedData = updateSchema.parse(body)

    const control = await prisma.kYCCheck.update({
      where: { id },
      data: validatedData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ data: control })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
