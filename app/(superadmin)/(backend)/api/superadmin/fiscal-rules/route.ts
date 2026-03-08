/**
 * API SuperAdmin — Gestion des Règles Fiscales Centralisées
 * 
 * GET  /api/superadmin/fiscal-rules          — Lire toutes les règles (défauts + surcharges)
 * PUT  /api/superadmin/fiscal-rules          — Appliquer des surcharges
 * DELETE /api/superadmin/fiscal-rules        — Réinitialiser toutes les surcharges
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import {
  getCurrentRules,
  applyOverrides,
  resetOverrides,
  getRulesSchema,
  getRulesSections,
} from '@/app/_common/lib/rules/fiscal-rules-admin'

// ============================================================================
// GET — Lire les règles actuelles
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé — accès SuperAdmin requis', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const schemaOnly = searchParams.get('schema') === 'true'
    const sectionsOnly = searchParams.get('sections') === 'true'

    // Mode sections uniquement (pour la navigation)
    if (sectionsOnly) {
      const sections = getRulesSections()
      return NextResponse.json({ sections })
    }

    // Mode schema uniquement (pour l'auto-génération de formulaire)
    if (schemaOnly) {
      const schema = getRulesSchema()
      return NextResponse.json({ schema })
    }

    // Lecture complète ou par section
    const { rules, overrides, hasOverrides } = getCurrentRules()

    if (section) {
      const sectionData = (rules as unknown as Record<string, unknown>)[section]
      if (sectionData === undefined) {
        return createErrorResponse(`Section '${section}' introuvable`, 404)
      }
      return NextResponse.json({
        section,
        data: sectionData,
        hasOverrides,
        meta: overrides._meta,
      })
    }

    return NextResponse.json({
      rules,
      hasOverrides,
      meta: overrides._meta,
      sections: getRulesSections(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'Unauthorized') {
      return createErrorResponse('Non authentifié', 401)
    }
    return createErrorResponse(`Erreur serveur: ${message}`, 500)
  }
}

// ============================================================================
// PUT — Appliquer des surcharges
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé — accès SuperAdmin requis', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const body = await request.json()

    // Validation du corps de la requête
    if (!body.changes || !Array.isArray(body.changes) || body.changes.length === 0) {
      return createErrorResponse(
        'Format attendu: { changes: [{ path: "ir.bareme.0.max", value: 12000 }, ...] }',
        400
      )
    }

    // Validation de chaque changement
    for (const change of body.changes) {
      if (!change.path || typeof change.path !== 'string') {
        return createErrorResponse(`Chaque changement doit avoir un 'path' string`, 400)
      }
      if (change.value === undefined) {
        return createErrorResponse(`Le changement '${change.path}' doit avoir une 'value'`, 400)
      }
    }

    const changedBy = superAdmin.email
    const result = applyOverrides(body.changes, changedBy)

    return NextResponse.json({
      success: result.success,
      changelog: result.changelog,
      message: `${result.changelog.length} règle(s) modifiée(s) avec succès.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'Unauthorized') {
      return createErrorResponse('Non authentifié', 401)
    }
    return createErrorResponse(`Erreur serveur: ${message}`, 500)
  }
}

// ============================================================================
// DELETE — Réinitialiser toutes les surcharges
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé — accès SuperAdmin requis', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const result = resetOverrides(superAdmin.email)

    return NextResponse.json({
      success: result.success,
      message: 'Toutes les surcharges ont été réinitialisées. Les valeurs par défaut sont restaurées.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'Unauthorized') {
      return createErrorResponse('Non authentifié', 401)
    }
    return createErrorResponse(`Erreur serveur: ${message}`, 500)
  }
}
