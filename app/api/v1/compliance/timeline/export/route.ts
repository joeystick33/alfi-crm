/**
 * API Route for Timeline Export
 * 
 * GET /api/v1/compliance/timeline/export - Export timeline as PDF
 * 
 * @requirements 11.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  prepareTimelineExport,
  generateTimelineHTML,
} from '@/lib/compliance/services/timeline-service'
import { timelineFiltersSchema } from '@/lib/compliance/schemas'
import { z } from 'zod'

/**
 * GET /api/v1/compliance/timeline/export
 * Export timeline as HTML (for PDF generation)
 * 
 * @requirements 11.5 - THE Compliance_Timeline SHALL be exportable as PDF for audit purposes
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    
    const clientId = searchParams.get('clientId')
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId est requis pour l\'export' },
        { status: 400 }
      )
    }

    const filters: Record<string, unknown> = {}

    const type = searchParams.getAll('type')
    if (type.length > 0) {
      filters.type = type
    }

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom)
    }

    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      filters.dateTo = new Date(dateTo)
    }

    // Validate filters
    const validatedFilters = Object.keys(filters).length > 0
      ? timelineFiltersSchema.parse(filters)
      : undefined

    // Prepare export data
    const result = await prepareTimelineExport(
      cabinetId,
      clientId,
      user.id,
      validatedFilters
    )

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Check format parameter
    const format = searchParams.get('format') || 'html'

    if (format === 'json') {
      // Return raw data for client-side PDF generation
      return NextResponse.json({ data: result.data })
    }

    // Generate HTML for PDF conversion
    const html = generateTimelineHTML(result.data)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="timeline-${clientId}-${new Date().toISOString().split('T')[0]}.html"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.issues },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
