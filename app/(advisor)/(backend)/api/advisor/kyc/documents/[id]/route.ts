import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { KYCService } from '@/app/_common/lib/services/kyc-service'
import { z } from 'zod'

// Schéma de validation pour mettre à jour un document KYC
const updateKYCDocumentSchema = z.object({
  fileName: z.string().optional(),
  fileUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
})

/**
 * DELETE /api/advisor/kyc/documents/[id]
 * Supprime un document KYC
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user } = context
    const { id: kycDocumentId } = await params
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Note: Actuellement le service n'a pas de méthode deleteKYCDocument
    // On pourrait l'ajouter ou utiliser Prisma directement
    const prisma = await import('@/app/_common/lib/prisma').then(m => m.getPrismaClient(context.cabinetId, context.isSuperAdmin))
    
    await prisma.kYCDocument.delete({
      where: { id: kycDocumentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting KYC document:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
