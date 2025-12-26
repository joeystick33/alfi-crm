import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Clés API
 * GET /api/superadmin/api-keys - Liste des clés API
 * POST /api/superadmin/api-keys - Créer une clé API
 */

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Récupérer les clés API depuis la config
    const apiKeyConfigs = await prisma.systemConfig.findMany({
      where: { category: 'api-keys' },
    })

    // Parser les clés depuis la config
    const keysMap = new Map<string, Record<string, unknown>>()
    
    for (const config of apiKeyConfigs) {
      const parts = config.key.split('_')
      const keyId = parts.slice(0, 2).join('_')
      const field = parts.slice(2).join('_')
      if (!keysMap.has(keyId)) {
        keysMap.set(keyId, { id: keyId })
      }
      keysMap.get(keyId)![field] = config.value
    }

    const keys = Array.from(keysMap.values()).map(k => ({
      id: k.id as string,
      name: k.name as string || 'Clé API',
      key: maskKey(k.key as string),
      prefix: (k.key as string || '').substring(0, 8) + '_',
      permissions: ((k.permissions as string) || 'read:cabinets').split(','),
      createdAt: k.createdAt as string || new Date().toISOString(),
      lastUsed: k.lastUsed as string || null,
      expiresAt: k.expiresAt as string || null,
      isActive: k.isActive !== 'false',
      requestCount: parseInt(k.requestCount as string || '0', 10),
    }))

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Erreur clés API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const body = await request.json()
    const { name, permissions = ['read:cabinets'], expiresAt } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nom requis' },
        { status: 400 }
      )
    }

    // Générer une clé API
    const keyId = `ak_${Date.now()}`
    const apiKey = `ak_live_${generateApiKey(32)}`

    // Sauvegarder les configs de la clé
    const configs = [
      { key: `${keyId}_name`, value: name },
      { key: `${keyId}_key`, value: apiKey },
      { key: `${keyId}_permissions`, value: permissions.join(',') },
      { key: `${keyId}_createdAt`, value: new Date().toISOString() },
      { key: `${keyId}_isActive`, value: 'true' },
      { key: `${keyId}_requestCount`, value: '0' },
    ]

    if (expiresAt) {
      configs.push({ key: `${keyId}_expiresAt`, value: expiresAt })
    }

    for (const config of configs) {
      await prisma.systemConfig.create({
        data: {
          key: config.key,
          value: config.value,
          category: 'api-keys',
          updatedById: superAdmin.id,
        },
      })
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'CREATION',
        entityType: 'ApiKey',
        entityId: keyId,
        changes: { name, permissions },
      },
    })

    return NextResponse.json({
      success: true,
      apiKey: {
        id: keyId,
        name,
        key: apiKey,
        prefix: 'ak_live_',
        permissions,
        createdAt: new Date().toISOString(),
        isActive: true,
        requestCount: 0,
      },
    })
  } catch (error) {
    console.error('Erreur création clé API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function generateApiKey(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function maskKey(key: string | undefined): string {
  if (!key) return ''
  if (key.length <= 12) return '*'.repeat(key.length)
  return key.substring(0, 12) + '...' + key.substring(key.length - 4)
}
