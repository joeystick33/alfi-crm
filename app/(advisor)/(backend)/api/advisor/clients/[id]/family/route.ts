/**
 * API Route: /api/advisor/clients/[id]/family
 * Gestion des membres de la famille (GET, POST)
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// Validation Schema
// ============================================================================

const familyMemberSchema = z.object({
  relationship: z.enum(['CONJOINT', 'ENFANT', 'PARENT', 'FRATRIE', 'PETIT_ENFANT', 'AUTRE', 'ASCENDANT']),
  civility: z.string().optional(),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  profession: z.string().optional(),
  annualIncome: z.number().optional(),
  isDependent: z.boolean().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================================================
// GET - Liste des membres de la famille
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Récupérer les membres de la famille
    const members = await prisma.familyMember.findMany({
      where: { clientId },
      orderBy: [
        { relationship: 'asc' },
        { firstName: 'asc' },
      ],
    })

    // Statistiques
    const stats = {
      total: members.length,
      dependents: members.filter(m => m.isDependent).length,
      byType: {
        CONJOINT: members.filter(m => m.relationship === 'CONJOINT').length,
        ENFANT: members.filter(m => m.relationship === 'ENFANT').length,
        PARENT: members.filter(m => m.relationship === 'PARENT').length,
        FRATRIE: members.filter(m => m.relationship === 'FRATRIE').length,
        PETIT_ENFANT: members.filter(m => m.relationship === 'PETIT_ENFANT').length,
        ASCENDANT: members.filter(m => m.relationship === 'ASCENDANT').length,
        AUTRE: members.filter(m => m.relationship === 'AUTRE').length,
      },
      totalIncome: members.reduce((sum, m) => sum + (m.annualIncome ? Number(m.annualIncome) : 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: members.map(m => ({
        ...m,
        annualIncome: m.annualIncome ? Number(m.annualIncome) : null,
        // Compatibilité avec le frontend qui utilise relationshipType
        relationshipType: m.relationship,
      })),
      stats,
    })

  } catch (error) {
    logger.error('Erreur GET /family:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Créer un membre de la famille
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const body = await request.json()
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Validation
    const validation = familyMemberSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // Vérifier que le client appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier qu'il n'y a pas déjà un conjoint si on ajoute un SPOUSE
    if (validation.data.relationship === 'CONJOINT') {
      const existingSpouse = await prisma.familyMember.findFirst({
        where: {
          clientId,
          relationship: 'CONJOINT',
        },
      })

      if (existingSpouse) {
        return NextResponse.json(
          { error: 'Un conjoint existe déjà', code: 'SPOUSE_EXISTS' },
          { status: 400 }
        )
      }
    }

    // Créer le membre
    const member = await prisma.familyMember.create({
      data: {
        clientId,
        ...validation.data,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...member,
        annualIncome: member.annualIncome ? Number(member.annualIncome) : null,
      },
      message: 'Membre ajouté avec succès',
    }, { status: 201 })

  } catch (error) {
    logger.error('Erreur POST /family:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
