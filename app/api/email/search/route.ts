import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailAdvancedService } from '@/lib/services/email-advanced-service'

/**
 * GET /api/email/search
 * Search emails with full-text search and advanced filters
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams

    const query = searchParams.get('q') || searchParams.get('query')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const filters = {
      clientId: searchParams.get('clientId') || undefined,
      isRead: searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    const emailAdvancedService = new EmailAdvancedService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const result = await emailAdvancedService.searchEmails(query, filters)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error searching emails:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
