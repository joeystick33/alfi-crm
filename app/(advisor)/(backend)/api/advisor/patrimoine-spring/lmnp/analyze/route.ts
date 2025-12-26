 
/**
 * Proxy API - LMNP Analyze
 * Redirige vers le backend Java: POST /api/lmnp/analyze
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToJavaBackend } from '../../proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await proxyToJavaBackend(
      '/api/lmnp/analyze',
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
    console.error('[LMNP Analyze] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
