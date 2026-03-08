 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CampaignService } from '@/app/_common/lib/services/campaign-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Schéma validation mise à jour
const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(['EMAIL', 'SMS', 'POSTAL', 'MULTI_CANAL']).optional(),
  subject: z.string().max(200).optional(),
  previewText: z.string().max(200).optional(),
  htmlContent: z.string().optional(),
  plainContent: z.string().optional(),
  emailTemplateId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  targetSegment: z.any().optional(),
  targetClientIds: z.array(z.string()).optional(),
  excludeClientIds: z.array(z.string()).optional(),
  fromName: z.string().max(100).optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/advisor/campaigns/[id]
 * Obtenir une campagne par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let campaignId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    campaignId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const campaign = await service.getCampaignById(campaignId)

    return NextResponse.json(campaign)
  } catch (error: any) {
    logger.error(`Erreur GET /api/advisor/campaigns/${campaignId}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Campagne non trouvée') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/advisor/campaigns/[id]
 * Mettre à jour une campagne
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let campaignId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    campaignId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = UpdateCampaignSchema.parse(body)

    // Conversion date
    const input: any = { ...validated }
    if (input.scheduledAt) {
      input.scheduledAt = new Date(input.scheduledAt)
    }

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const campaign = await service.updateCampaign(campaignId, input)

    return NextResponse.json(campaign)
  } catch (error: any) {
    logger.error(`Erreur PATCH /api/advisor/campaigns/${campaignId}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    if (error.message === 'Campagne non trouvée') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/advisor/campaigns/[id]
 * Supprimer une campagne
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let campaignId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    campaignId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    await service.deleteCampaign(campaignId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error(`Erreur DELETE /api/advisor/campaigns/${campaignId}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Campagne non trouvée') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 400 }
    )
  }
}
