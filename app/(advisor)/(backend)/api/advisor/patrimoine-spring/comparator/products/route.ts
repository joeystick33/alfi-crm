 
/**
 * Proxy API - Product Comparator
 * Redirige vers le backend Java: POST /api/comparator/products
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToJavaBackend } from '../../proxy-utils'
import { logger } from '@/app/_common/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    if (!body.investmentAmount || body.investmentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le montant d\'investissement est requis et doit être positif' },
        { status: 400 }
      )
    }

    if (!body.horizonYears || body.horizonYears < 1) {
      return NextResponse.json(
        { success: false, error: 'L\'horizon d\'investissement est requis (minimum 1 an)' },
        { status: 400 }
      )
    }

    const result = await proxyToJavaBackend(
      '/api/comparator/products',
      'POST',
      body
    )

    if (!result.success) {
      return NextResponse.json(result, { 
        status: result.javaBackendStatus === 'offline' ? 503 : 500 
      })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('[Comparator Products] Error:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
