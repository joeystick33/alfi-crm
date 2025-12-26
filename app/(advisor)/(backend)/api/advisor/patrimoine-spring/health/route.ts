 
/**
 * Health Check API - Backend Java Patrimonial Spring
 * Vérifie la disponibilité du backend Java sur le port 8081
 */

import { NextResponse } from 'next/server'
import { checkJavaBackendHealth, JAVA_PATRIMONIAL_URL } from '../proxy-utils'

export async function GET(_request: Request) {
  try {
    const isHealthy = await checkJavaBackendHealth()
    
    const status = {
      backend: 'Patrimonial Spring (Java)',
      url: JAVA_PATRIMONIAL_URL,
      status: isHealthy ? 'online' : 'offline',
      timestamp: new Date().toISOString(),
      endpoints: [
        { path: '/api/lifeinsurance/analyze', method: 'POST', description: 'Analyse assurance-vie' },
        { path: '/api/per/simulate', method: 'POST', description: 'Simulation PER' },
        { path: '/api/pea/analyze', method: 'POST', description: 'Analyse PEA' },
        { path: '/api/cto/analyze', method: 'POST', description: 'Analyse CTO' },
        { path: '/api/lmnp/analyze', method: 'POST', description: 'Analyse LMNP' },
        { path: '/api/comparator/products', method: 'POST', description: 'Comparateur de produits' },
      ]
    }

    if (!isHealthy) {
      return NextResponse.json({
        success: false,
        error: 'Backend Java non disponible',
        ...status,
        instructions: [
          '1. Naviguez vers le dossier du backend Java:',
          '   cd app/(advisor)/simulateur-a-implementer/backend-simulators/simulateur-patrimonial-spring',
          '2. Compilez le projet:',
          '   mvn clean install',
          '3. Lancez le serveur:',
          '   mvn spring-boot:run',
          '4. Le serveur sera disponible sur http://localhost:8081'
        ]
      }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      ...status
    })
  } catch (error: any) {
    console.error('[Health Check] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la vérification',
        backend: 'Patrimonial Spring (Java)',
        status: 'error'
      },
      { status: 500 }
    )
  }
}
