import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Intégrations
 * GET /api/superadmin/integrations - Liste des intégrations
 * POST /api/superadmin/integrations - Créer une intégration
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

    // Récupérer les intégrations depuis la config système
    const integrationConfigs = await prisma.systemConfig.findMany({
      where: { category: 'integrations' },
    })

    // Construire la liste des intégrations avec leurs statuts
    const integrations = [
      {
        id: 'stripe',
        name: 'Stripe',
        category: 'payment',
        description: 'Gestion des paiements et abonnements',
        icon: '💳',
        status: getIntegrationStatus(integrationConfigs, 'stripe'),
        lastSync: getIntegrationValue(integrationConfigs, 'stripe_lastSync'),
        config: {
          apiKey: maskValue(getIntegrationValue(integrationConfigs, 'stripe_apiKey')),
          secretKey: maskValue(getIntegrationValue(integrationConfigs, 'stripe_secretKey')),
          webhookUrl: getIntegrationValue(integrationConfigs, 'stripe_webhookUrl') || 'https://aura.fr/api/webhooks/stripe',
        },
        features: ['Paiements par carte', 'Abonnements récurrents', 'Facturation automatique', 'Webhooks'],
        docsUrl: 'https://stripe.com/docs',
      },
      {
        id: 'sendgrid',
        name: 'SendGrid',
        category: 'email',
        description: 'Envoi d\'emails transactionnels et marketing',
        icon: '📧',
        status: getIntegrationStatus(integrationConfigs, 'sendgrid'),
        lastSync: getIntegrationValue(integrationConfigs, 'sendgrid_lastSync'),
        config: {
          apiKey: maskValue(getIntegrationValue(integrationConfigs, 'sendgrid_apiKey')),
          fromEmail: getIntegrationValue(integrationConfigs, 'sendgrid_fromEmail') || 'noreply@aura.fr',
          fromName: getIntegrationValue(integrationConfigs, 'sendgrid_fromName') || 'Aura',
        },
        features: ['Emails transactionnels', 'Templates', 'Analytics', 'Webhooks'],
        docsUrl: 'https://sendgrid.com/docs',
      },
      {
        id: 's3',
        name: 'Amazon S3',
        category: 'storage',
        description: 'Stockage de fichiers et documents',
        icon: '☁️',
        status: getIntegrationStatus(integrationConfigs, 's3'),
        config: {
          accessKeyId: maskValue(getIntegrationValue(integrationConfigs, 's3_accessKeyId')),
          bucket: getIntegrationValue(integrationConfigs, 's3_bucket') || 'aura-documents',
          region: getIntegrationValue(integrationConfigs, 's3_region') || 'eu-west-3',
        },
        features: ['Stockage illimité', 'CDN', 'Versioning', 'Encryption'],
        docsUrl: 'https://aws.amazon.com/s3/',
      },
      {
        id: 'slack',
        name: 'Slack',
        category: 'communication',
        description: 'Notifications et alertes',
        icon: '💬',
        status: getIntegrationStatus(integrationConfigs, 'slack'),
        config: {
          webhookUrl: getIntegrationValue(integrationConfigs, 'slack_webhookUrl') || '',
        },
        features: ['Notifications temps réel', 'Alertes système', 'Rapports automatiques'],
        docsUrl: 'https://api.slack.com/',
      },
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        category: 'calendar',
        description: 'Synchronisation des rendez-vous',
        icon: '📅',
        status: getIntegrationStatus(integrationConfigs, 'google-calendar'),
        config: {
          clientId: getIntegrationValue(integrationConfigs, 'gcal_clientId') || '',
          clientSecret: maskValue(getIntegrationValue(integrationConfigs, 'gcal_clientSecret')),
        },
        features: ['Sync bidirectionnelle', 'Invitations automatiques', 'Rappels'],
        docsUrl: 'https://developers.google.com/calendar',
      },
      {
        id: 'supabase',
        name: 'Supabase',
        category: 'security',
        description: 'Authentification et base de données',
        icon: '🔐',
        status: 'connected' as const,
        config: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configuré' : 'Non configuré',
        },
        features: ['Auth', 'Base de données', 'Storage', 'Realtime'],
        docsUrl: 'https://supabase.com/docs',
      },
    ]

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Erreur intégrations:', error)
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

    const body = await request.json()
    const { integrationId, config } = body

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Sauvegarder la config de l'intégration
    for (const [key, value] of Object.entries(config)) {
      const configKey = `${integrationId}_${key}`
      const existing = await prisma.systemConfig.findFirst({
        where: { key: configKey },
      })

      if (existing) {
        await prisma.systemConfig.update({
          where: { id: existing.id },
          data: { value: value as string, updatedById: superAdmin.id },
        })
      } else {
        await prisma.systemConfig.create({
          data: {
            key: configKey,
            value: value as string,
            category: 'integrations',
            updatedById: superAdmin.id,
          },
        })
      }
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'MODIFICATION',
        entityType: 'Integration',
        entityId: integrationId,
        changes: { integrationId, configKeys: Object.keys(config) },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur sauvegarde intégration:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Helpers
function getIntegrationValue(configs: { key: string; value: unknown }[], key: string): string | null {
  const config = configs.find(c => c.key === key)
  return config?.value as string | null
}

function getIntegrationStatus(configs: { key: string; value: unknown }[], integrationId: string): 'connected' | 'disconnected' | 'error' {
  const apiKey = configs.find(c => c.key === `${integrationId}_apiKey` || c.key === `${integrationId}_accessKeyId`)
  if (apiKey && apiKey.value) return 'connected'
  return 'disconnected'
}

function maskValue(value: string | null): string {
  if (!value) return ''
  if (value.length <= 8) return '*'.repeat(value.length)
  return value.substring(0, 4) + '*'.repeat(Math.min(value.length - 8, 20)) + value.substring(value.length - 4)
}
