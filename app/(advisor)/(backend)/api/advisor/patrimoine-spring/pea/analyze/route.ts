 
/**
 * Proxy API - PEA Analyze
 * Redirige vers le backend Java: POST /api/pea/analyze
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToJavaBackend } from '../../proxy-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await proxyToJavaBackend(
      '/api/pea/analyze',
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
    console.error('[PEA Analyze] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
