/**
 * API Route — AURA V2 : Gestion des connexions IA (OAuth 2.1)
 * 
 * GET  : Liste les connexions IA du cabinet
 * POST : Crée/initie une nouvelle connexion IA
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { PROVIDER_REGISTRY } from '@/app/_common/lib/services/aura-v2'
import type { AIProviderType } from '@/app/_common/lib/services/aura-v2'
import { encryptToken } from '@/app/_common/lib/services/aura-v2/encryption'

const globalForAIConnectionsPrisma = globalThis as unknown as {
  aiConnectionsPrisma: PrismaClient | undefined
}

const routePrisma = globalForAIConnectionsPrisma.aiConnectionsPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForAIConnectionsPrisma.aiConnectionsPrisma = routePrisma
}

export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(req)

    const connections = await routePrisma.aIConnection.findMany({
      where: { cabinetId },
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
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Enrichir avec les infos provider disponibles
    const enriched = connections.map(conn => {
      const provider = conn.provider as AIProviderType
      const providerDefinition = PROVIDER_REGISTRY[provider]

      return {
        ...conn,
        totalTokensUsed: conn.totalTokensUsed.toString(),
        totalCost: conn.totalCost ? Number(conn.totalCost.toString()) : null,
        monthlySpendLimit: conn.monthlySpendLimit ? Number(conn.monthlySpendLimit.toString()) : null,
        monthlyTokenLimit: conn.monthlyTokenLimit ? Number(conn.monthlyTokenLimit.toString()) : null,
        providerInfo: {
          name: conn.provider,
          models: providerDefinition?.models || [],
          supportsStreaming: providerDefinition?.supportsStreaming || false,
        },
      }
    })

    return NextResponse.json({ connections: enriched })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Connections GET]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(req)

    const body = await req.json()
    const { provider, apiKey, label, defaultModel } = body as {
      provider: AIProviderType
      apiKey?: string
      label?: string
      defaultModel?: string
    }

    // Valider le provider
    if (!provider || !PROVIDER_REGISTRY[provider]) {
      return NextResponse.json(
        { error: `Provider invalide. Providers supportés: ${Object.keys(PROVIDER_REGISTRY).join(', ')}` },
        { status: 400 },
      )
    }

    // Vérifier qu'une connexion n'existe pas déjà pour ce provider
    const existing = await routePrisma.aIConnection.findUnique({
      where: { cabinetId_provider: { cabinetId, provider: provider as import('@prisma/client').$Enums.AIProviderType } },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Une connexion ${provider} existe déjà pour ce cabinet` },
        { status: 409 },
      )
    }

    const config = PROVIDER_REGISTRY[provider]

    // Si une clé API est fournie directement (mode simplifié — pas OAuth)
    // Note: En production, on préfère le flux OAuth 2.1
    if (apiKey) {
      const accessTokenEnc = encryptToken(apiKey)

      const connection = await routePrisma.aIConnection.create({
        data: {
          cabinetId,
          provider: provider as import('@prisma/client').$Enums.AIProviderType,
          status: 'CONNECTED',
          label: label || `Connexion ${provider}`,
          accessTokenEnc,
          allowedModels: config.models.map(m => m.id),
          defaultModel: defaultModel || config.models.find(m => m.recommended)?.id || config.models[0]?.id,
          scopes: ['*'],
          createdBy: user.id,
        },
      })

      return NextResponse.json({
        connection: {
          id: connection.id,
          provider: connection.provider,
          status: connection.status,
          label: connection.label,
          allowedModels: connection.allowedModels,
          defaultModel: connection.defaultModel,
        },
        message: 'Connexion créée avec succès',
      }, { status: 201 })
    }

    // Mode OAuth 2.1 : initier le flux
    if (!config.oauthConfig) {
      return NextResponse.json(
        { error: `Le provider ${provider} ne supporte pas OAuth. Fournissez une clé API.` },
        { status: 400 },
      )
    }

    const clientId = process.env[config.oauthConfig.clientIdEnvVar]
    if (!clientId) {
      return NextResponse.json(
        { error: `Configuration OAuth manquante pour ${provider}. Contactez l'administrateur.` },
        { status: 500 },
      )
    }

    // Créer la connexion en état PENDING_OAUTH
    const connection = await routePrisma.aIConnection.create({
      data: {
        cabinetId,
        provider: provider as import('@prisma/client').$Enums.AIProviderType,
        status: 'PENDING_OAUTH',
        label: label || `Connexion ${provider}`,
        scopes: config.oauthConfig.scopes,
        createdBy: user.id,
      },
    })

    // Construire l'URL d'autorisation OAuth
    const state = Buffer.from(JSON.stringify({
      connectionId: connection.id,
      cabinetId,
      userId: user.id,
    })).toString('base64url')

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/advisor/ai/v2/connections/oauth/callback`

    const authUrl = new URL(config.oauthConfig.authorizationUrl)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', config.oauthConfig.scopes.join(' '))
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      connection: {
        id: connection.id,
        provider: connection.provider,
        status: connection.status,
      },
      oauthUrl: authUrl.toString(),
      message: 'Redirigez l\'utilisateur vers oauthUrl pour autoriser la connexion',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Connections POST]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
