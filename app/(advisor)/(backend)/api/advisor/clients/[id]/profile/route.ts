 
/**
 * API Route: /api/advisor/clients/[id]/profile
 * Returns profile data for Client 360 Profile & Family tab
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { 
  calculateProfileData,
  updateClientIdentity,
  updateClientLegalRights
} from '@/app/_common/lib/services/profile-service'

/**
 * GET /api/advisor/clients/[id]/profile
 * Returns complete profile data including identity, family, legal rights, and fiscal info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId, isSuperAdmin } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    const prisma = getPrismaClient(cabinetId, isSuperAdmin)

    // Fetch client with family members
    const client = await prisma.client.findFirst({
      where: { id, cabinetId },
      include: {
        familyMembers: {
          orderBy: [
            { relationship: 'asc' },
            { firstName: 'asc' }
          ]
        }
      }
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Calculate profile data
    const profileData = await calculateProfileData(client, prisma, cabinetId)

    return createSuccessResponse(profileData)
  } catch (error: any) {
    console.error('Get client profile error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/advisor/clients/[id]/profile
 * Updates client profile information (identity and legal rights)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId, isSuperAdmin } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    const body = await request.json()
    const prisma = getPrismaClient(cabinetId, isSuperAdmin)

    // Verify client exists and belongs to cabinet
    const client = await prisma.client.findFirst({
      where: { id, cabinetId }
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Update identity if provided
    if (body.identity) {
      await updateClientIdentity(id, body.identity, prisma, cabinetId)
    }

    // Update legal rights if provided
    if (body.legalRights) {
      await updateClientLegalRights(id, body.legalRights, prisma, cabinetId)
    }

    // Fetch updated client data
    const updatedClient = await prisma.client.findFirst({
      where: { id, cabinetId },
      include: {
        familyMembers: {
          orderBy: [
            { relationship: 'asc' },
            { firstName: 'asc' }
          ]
        }
      }
    })

    // Return updated profile data
    const profileData = await calculateProfileData(updatedClient, prisma, cabinetId)

    return createSuccessResponse(profileData)
  } catch (error: any) {
    console.error('Update client profile error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
