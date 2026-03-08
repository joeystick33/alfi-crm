/**
 * API Route — AURA V2 : Gestion d'une connexion IA spécifique
 * 
 * GET    : Détails d'une connexion + health check
 * PATCH  : Modifier une connexion (label, modèle par défaut, limites)
 * DELETE : Supprimer/révoquer une connexion
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { ProviderAdapter } from '@/app/_common/lib/services/aura-v2/provider-adapter'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    const { connectionId } = await params
    const prisma = getPrismaClient(cabinetId, false)

    const connection = await prisma.aIConnection.findFirst({
      where: { id: connectionId, cabinetId },
      select: {
        id: true,
        provider: true,
        status: true,
        label: true,
        providerEmail: true,
        allowedModels: true,
        defaultModel: true,
        lastHealthCheck: true,
        lastError: true,
        consecutiveErrors: true,
        totalTokensUsed: true,
        totalCost: true,
        monthlyTokenLimit: true,
        monthlySpendLimit: true,
        tokenExpiresAt: true,
        scopes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { sessions: true, runs: true, toolCalls: true },
        },
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connexion non trouvée' }, { status: 404 })
    }

    // Health check si demandé
    const { searchParams } = new URL(req.url)
    let healthCheck = null
    if (searchParams.get('healthCheck') === 'true') {
      const adapter = new ProviderAdapter(cabinetId)
      healthCheck = await adapter.healthCheck(connectionId)
    }

    return NextResponse.json({
      connection: {
        ...connection,
        totalTokensUsed: connection.totalTokensUsed.toString(),
      },
      healthCheck,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Connection GET]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    const { connectionId } = await params
    const prisma = getPrismaClient(cabinetId, false)

    const existing = await prisma.aIConnection.findFirst({
      where: { id: connectionId, cabinetId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Connexion non trouvée' }, { status: 404 })
    }

    const body = await req.json()
    const allowedFields = ['label', 'defaultModel', 'allowedModels', 'monthlyTokenLimit', 'monthlySpendLimit']
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const updated = await prisma.aIConnection.update({
      where: { id: connectionId },
      data: updateData,
      select: {
        id: true,
        provider: true,
        status: true,
        label: true,
        defaultModel: true,
        allowedModels: true,
        monthlyTokenLimit: true,
        monthlySpendLimit: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ connection: updated, message: 'Connexion mise à jour' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Connection PATCH]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    const { connectionId } = await params
    const prisma = getPrismaClient(cabinetId, false)

    const existing = await prisma.aIConnection.findFirst({
      where: { id: connectionId, cabinetId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Connexion non trouvée' }, { status: 404 })
    }

    // Révoquer (soft delete) : on garde la trace mais on supprime les tokens
    await prisma.aIConnection.update({
      where: { id: connectionId },
      data: {
        status: 'REVOKED',
        accessTokenEnc: null,
        refreshTokenEnc: null,
        lastError: 'Connexion révoquée par l\'utilisateur',
      },
    })

    return NextResponse.json({ message: 'Connexion révoquée' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Connection DELETE]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
