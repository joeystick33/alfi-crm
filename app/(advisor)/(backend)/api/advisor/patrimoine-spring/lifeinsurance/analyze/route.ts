 
/**
 * Proxy API - Life Insurance Analyze
 * Redirige vers le backend Java: POST /api/lifeinsurance/analyze
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToJavaBackend } from '../../proxy-utils'
import { logger } from '@/app/_common/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation basique
    if (!body.contract) {
      return NextResponse.json(
        { success: false, error: 'Le contrat d\'assurance-vie est requis' },
        { status: 400 }
      )
    }

    const result = await proxyToJavaBackend(
      '/api/lifeinsurance/analyze',
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
    logger.error('[LifeInsurance Analyze] Error:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
