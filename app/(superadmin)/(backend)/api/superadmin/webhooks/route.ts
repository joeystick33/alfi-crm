import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Webhooks
 * GET /api/superadmin/webhooks - Liste des webhooks configurés
 * POST /api/superadmin/webhooks - Créer un webhook
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

    // Récupérer les webhooks depuis la base
    const webhookConfigs = await prisma.systemConfig.findMany({
      where: { category: 'webhooks' },
    })

    // Parser les webhooks depuis la config
    const webhooksMap = new Map<string, Record<string, unknown>>()
    
    for (const config of webhookConfigs) {
      const [webhookId, field] = config.key.split('_', 2)
      if (!webhooksMap.has(webhookId)) {
        webhooksMap.set(webhookId, { id: webhookId })
      }
      webhooksMap.get(webhookId)![field] = config.value
    }

    const webhooks = Array.from(webhooksMap.values()).map(wh => ({
      id: wh.id as string,
      url: wh.url as string || '',
      events: (wh.events as string || '').split(',').filter(Boolean),
      status: (wh.status as string) || 'active',
      secret: maskSecret(wh.secret as string),
      createdAt: wh.createdAt as string || new Date().toISOString(),
      lastTriggered: wh.lastTriggered as string || null,
      successCount: parseInt(wh.successCount as string || '0', 10),
      failureCount: parseInt(wh.failureCount as string || '0', 10),
    }))

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('Erreur webhooks:', error)
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
    const { url, events } = body

    if (!url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'URL et événements requis' },
        { status: 400 }
      )
    }

    // Générer un ID et secret
    const webhookId = `wh_${Date.now()}`
    const secret = `whsec_${generateSecret(24)}`

    // Sauvegarder les configs du webhook
    const configs = [
      { key: `${webhookId}_url`, value: url },
      { key: `${webhookId}_events`, value: events.join(',') },
      { key: `${webhookId}_secret`, value: secret },
      { key: `${webhookId}_status`, value: 'active' },
      { key: `${webhookId}_createdAt`, value: new Date().toISOString() },
      { key: `${webhookId}_successCount`, value: '0' },
      { key: `${webhookId}_failureCount`, value: '0' },
    ]

    for (const config of configs) {
      await prisma.systemConfig.create({
        data: {
          key: config.key,
          value: config.value,
          category: 'webhooks',
          updatedById: superAdmin.id,
        },
      })
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'CREATION',
        entityType: 'Webhook',
        entityId: webhookId,
        changes: { url, events },
      },
    })

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhookId,
        url,
        events,
        status: 'active',
        secret,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Erreur création webhook:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function generateSecret(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function maskSecret(secret: string | undefined): string {
  if (!secret) return ''
  return secret.substring(0, 8) + '*'.repeat(8)
}
