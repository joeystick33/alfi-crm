 
/**
 * API Route: /api/superadmin/cabinets/[id]/features
 * 
 * Gestion des features d'un cabinet par le SuperAdmin
 * - GET: Récupérer les features actuelles
 * - PUT: Mettre à jour les features
 * - POST: Appliquer un preset de plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { requireSuperAdmin as requireSuperAdminAuth } from '@/app/_common/lib/auth-helpers'
import { z } from 'zod'
import { 
  createFeatureService,
  type CabinetFeatures,
} from '@/app/_common/lib/features'
import {
  getDefaultLimitsForPlan,
  type SubscriptionPlan,
  PLAN_PRESETS,
} from '@/app/_common/lib/features/plan-presets'
import {
  getAllFeatures,
} from '@/app/_common/lib/features/feature-config'

// =============================================================================
// Validation Schemas
// =============================================================================

const updateFeaturesSchema = z.object({
  simulators: z.record(z.string(), z.boolean()).optional(),
  calculators: z.record(z.string(), z.boolean()).optional(),
  modules: z.record(z.string(), z.boolean()).optional(),
  customLimits: z.object({
    maxSimulationsPerMonth: z.number().optional(),
    maxExportsPerMonth: z.number().optional(),
    maxClientsPortal: z.number().optional(),
  }).optional(),
})

const applyPresetSchema = z.object({
  plan: z.enum(['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM']),
  updateQuotas: z.boolean().default(true),
})

// =============================================================================
// Helper: Récupérer le SuperAdmin authentifié
// =============================================================================

async function getSuperAdmin(request: NextRequest) {
  const context = await requireSuperAdminAuth(request)
  
  // Récupérer les infos complètes du SuperAdmin depuis Prisma
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: context.user.email! },
  })
  
  if (!superAdmin || !superAdmin.isActive) {
    throw new Error('SuperAdmin non trouvé ou inactif')
  }
  
  return superAdmin
}

// =============================================================================
// GET /api/superadmin/cabinets/[id]/features
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getSuperAdmin(request)
    const { id: cabinetId } = await params
    
    // Récupérer le cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        features: true,
        quotas: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    
    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }
    
    // Récupérer les features
    const featureService = createFeatureService(cabinetId)
    const features = await featureService.getCabinetFeatures()
    const usage = await featureService.getUsageStats()
    const enabledList = await featureService.getEnabledFeaturesList()
    
    // Récupérer toutes les définitions de features
    const allFeatures = getAllFeatures()
    
    return NextResponse.json({
      success: true,
      cabinet: {
        id: cabinet.id,
        name: cabinet.name,
        plan: cabinet.plan,
        status: cabinet.status,
        createdAt: cabinet.createdAt,
        updatedAt: cabinet.updatedAt,
      },
      features,
      enabledList,
      usage,
      quotas: cabinet.quotas,
      allFeatureDefinitions: allFeatures,
      planPresets: PLAN_PRESETS,
    })
  } catch (error: any) {
    console.error('GET /api/superadmin/cabinets/[id]/features error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error.message === 'Forbidden: SuperAdmin access required' || error.message?.includes('SuperAdmin')) {
      return NextResponse.json({ error: 'Accès SuperAdmin requis' }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT /api/superadmin/cabinets/[id]/features
// Met à jour les features individuellement
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const superAdmin = await getSuperAdmin(request)
    const { id: cabinetId } = await params
    
    // Valider le body
    const body = await request.json()
    const validatedData = updateFeaturesSchema.parse(body)
    
    // Vérifier que le cabinet existe
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { id: true, plan: true, features: true },
    })
    
    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }
    
    // Mettre à jour les features
    const featureService = createFeatureService(cabinetId)
    const updatedFeatures = await featureService.updateCabinetFeatures(
      validatedData as Partial<CabinetFeatures>,
      superAdmin.email
    )
    
    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId: cabinetId,
        action: 'MODIFICATION',
        entityType: 'CabinetFeatures',
        entityId: cabinetId,
        changes: {
          type: 'features_update',
          updatedFields: Object.keys(validatedData),
          timestamp: new Date().toISOString(),
        },
      },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Features mises à jour',
      features: updatedFeatures,
    })
  } catch (error: any) {
    console.error('PUT /api/superadmin/cabinets/[id]/features error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error.message === 'Forbidden: SuperAdmin access required' || error.message?.includes('SuperAdmin')) {
      return NextResponse.json({ error: 'Accès SuperAdmin requis' }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/superadmin/cabinets/[id]/features
// Applique un preset de plan
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const superAdmin = await getSuperAdmin(request)
    const { id: cabinetId } = await params
    
    // Valider le body
    const body = await request.json()
    const validatedData = applyPresetSchema.parse(body)
    
    // Vérifier que le cabinet existe
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { id: true, plan: true },
    })
    
    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }
    
    // Appliquer le preset
    const featureService = createFeatureService(cabinetId)
    const newFeatures = await featureService.applyPlanPreset(
      validatedData.plan as SubscriptionPlan,
      superAdmin.email
    )
    
    // Mettre à jour les quotas si demandé
    if (validatedData.updateQuotas) {
      const limits = getDefaultLimitsForPlan(validatedData.plan as SubscriptionPlan)
      
      await prisma.cabinet.update({
        where: { id: cabinetId },
        data: {
          quotas: limits,
          updatedAt: new Date(),
        },
      })
    }
    
    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId: cabinetId,
        action: 'MODIFICATION',
        entityType: 'CabinetFeatures',
        entityId: cabinetId,
        changes: {
          type: 'preset_applied',
          plan: validatedData.plan,
          quotasUpdated: validatedData.updateQuotas,
          timestamp: new Date().toISOString(),
        },
      },
    })
    
    return NextResponse.json({
      success: true,
      message: `Preset ${validatedData.plan} appliqué`,
      features: newFeatures,
    })
  } catch (error: any) {
    console.error('POST /api/superadmin/cabinets/[id]/features error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error.message === 'Forbidden: SuperAdmin access required' || error.message?.includes('SuperAdmin')) {
      return NextResponse.json({ error: 'Accès SuperAdmin requis' }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
