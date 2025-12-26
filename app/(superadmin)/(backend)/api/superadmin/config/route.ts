import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Configuration Système
 * GET /api/superadmin/config - Récupérer la configuration
 * PUT /api/superadmin/config - Modifier la configuration
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

    // Récupérer toutes les configurations
    const configs = await prisma.systemConfig.findMany({
      orderBy: { category: 'asc' },
    })

    // Organiser par catégorie
     
    const configByCategory: Record<string, Record<string, any>> = {
      general: {},
      email: {},
      security: {},
      limits: {},
      notifications: {},
    }

    configs.forEach((config: { category: string; key: string; value: unknown }) => {
      if (!configByCategory[config.category]) {
        configByCategory[config.category] = {}
      }
      configByCategory[config.category][config.key] = config.value
    })

    // Valeurs par défaut si pas de config existante
    const defaults = getDefaultConfig()
    
    // Fusionner avec les valeurs par défaut
    for (const category of Object.keys(defaults)) {
       
      const categoryDefaults = defaults[category as keyof typeof defaults] as Record<string, any>
      for (const key of Object.keys(categoryDefaults)) {
        if (!configByCategory[category]) {
          configByCategory[category] = {}
        }
        if (configByCategory[category][key] === undefined) {
          configByCategory[category][key] = categoryDefaults[key]
        }
      }
    }

    return NextResponse.json({ config: configByCategory })
  } catch (error) {
    console.error('Erreur config:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Vérifier permissions
     
    const permissions = superAdmin.permissions as any
    if (superAdmin.role !== 'OWNER' && !permissions?.canManageConfig) {
      return createErrorResponse('Permission insuffisante', 403)
    }

    const body = await request.json()
    
    // Support pour les deux formats: objet complet ou clé/valeur individuelle
    if (body.category && body.key) {
      // Format individuel: { category, key, value }
      const { category, key, value } = body
      await upsertConfig(superAdmin.id, category, key, value)
    } else {
      // Format complet: { general: {...}, email: {...}, ... }
      for (const [category, values] of Object.entries(body)) {
        if (typeof values === 'object' && values !== null) {
          for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
            await upsertConfig(superAdmin.id, category, key, value)
          }
        }
      }
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'MODIFICATION',
        entityType: 'SystemConfig',
        entityId: 'bulk-update',
        changes: body,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur modification config:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

async function upsertConfig(superAdminId: string, category: string, key: string, value: unknown) {
  const existingConfig = await prisma.systemConfig.findFirst({
    where: { key },
  })

  // Cast value to JSON compatible type
  const jsonValue = value as string | number | boolean | object | null

  if (existingConfig) {
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: {
        value: jsonValue,
        category,
        updatedById: superAdminId,
      },
    })
  } else {
    await prisma.systemConfig.create({
      data: {
        key,
        value: jsonValue,
        category,
        updatedById: superAdminId,
      },
    })
  }
}

function getDefaultConfig() {
  return {
    general: {
      platformName: 'Aura CRM',
      supportEmail: 'support@aura.fr',
      defaultLanguage: 'fr',
      defaultTimezone: 'Europe/Paris',
      maintenanceMode: false,
    },
    email: {
      provider: 'sendgrid',
      fromEmail: 'noreply@aura.fr',
      fromName: 'Aura CRM',
      replyTo: 'support@aura.fr',
      enableTracking: true,
    },
    security: {
      sessionTimeout: 24, // heures
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      requireMFA: false,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumber: true,
      passwordRequireSpecial: false,
    },
    limits: {
      maxFileSize: 10, // MB
      maxUploadPerDay: 100,
      apiRateLimit: 1000, // requêtes/heure
      exportRateLimit: 10, // exports/jour
    },
    notifications: {
      enableEmailNotifications: true,
      enablePushNotifications: false,
      enableSlackIntegration: false,
      alertOnNewCabinet: true,
      alertOnPaymentFailed: true,
      dailyReportEnabled: true,
      dailyReportTime: '08:00',
    },
  }
}
