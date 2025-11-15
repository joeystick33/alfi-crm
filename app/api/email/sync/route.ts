import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailSyncService } from '@/lib/services/email-sync-service'

/**
 * POST /api/email/sync
 * Manually trigger email synchronization
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    const emailSyncService = new EmailSyncService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const result = await emailSyncService.syncEmails()

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('Error syncing emails:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/email/sync
 * Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    const emailSyncService = new EmailSyncService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const status = await emailSyncService.getIntegrationStatus()

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Error getting sync status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
