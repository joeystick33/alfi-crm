/**
 * API Route: /api/advisor/family/[id]
 * Gestion individuelle d'un membre de la famille (GET, PATCH, DELETE)
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'

// ============================================================================
// Validation Schema
// ============================================================================

const updateFamilyMemberSchema = z.object({
  relationship: z.enum(['CONJOINT', 'ENFANT', 'PARENT', 'FRATRIE', 'PETIT_ENFANT', 'AUTRE', 'ASCENDANT']).optional(),
  civility: z.string().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  profession: z.string().optional(),
  annualIncome: z.number().optional(),
  isDependent: z.boolean().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================================================
// GET - Récupérer un membre
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const member = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        client: {
          select: { cabinetId: true },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Membre non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier l'appartenance au cabinet
    if (member.client.cabinetId !== context.cabinetId) {
      return NextResponse.json(
        { error: 'Non autorisé', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...member,
        annualIncome: member.annualIncome ? Number(member.annualIncome) : null,
        // Compatibilité avec le frontend qui utilise relationshipType
        relationshipType: member.relationship,
      },
    })

  } catch (error) {
    console.error('Erreur GET /family/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Modifier un membre
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Validation
    const validation = updateFamilyMemberSchema.safeParse(body)
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

    // Vérifier que le membre existe et appartient au cabinet
    const existing = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        client: {
          select: { cabinetId: true, id: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Membre non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (existing.client.cabinetId !== context.cabinetId) {
      return NextResponse.json(
        { error: 'Non autorisé', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Vérifier qu'on ne crée pas un doublon de SPOUSE
    if (validation.data.relationship === 'CONJOINT' && existing.relationship !== 'CONJOINT') {
      const existingSpouse = await prisma.familyMember.findFirst({
        where: {
          clientId: existing.client.id,
          relationship: 'CONJOINT',
          id: { not: id },
        },
      })

      if (existingSpouse) {
        return NextResponse.json(
          { error: 'Un conjoint existe déjà', code: 'SPOUSE_EXISTS' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour
    const member = await prisma.familyMember.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...member,
        annualIncome: member.annualIncome ? Number(member.annualIncome) : null,
        // Compatibilité avec le frontend qui utilise relationshipType
        relationshipType: member.relationship,
      },
      message: 'Membre mis à jour avec succès',
    })

  } catch (error) {
    console.error('Erreur PATCH /family/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Supprimer un membre
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le membre existe et appartient au cabinet
    const existing = await prisma.familyMember.findUnique({
      where: { id },
      include: {
        client: {
          select: { cabinetId: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Membre non trouvé', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (existing.client.cabinetId !== context.cabinetId) {
      return NextResponse.json(
        { error: 'Non autorisé', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Supprimer
    await prisma.familyMember.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      data: { id },
      message: 'Membre supprimé avec succès',
    })

  } catch (error) {
    console.error('Erreur DELETE /family/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
