
/**
 * Utilitaires proxy pour les backends Java/Node.js
 */

import { BackendConfig, getBackendConfig, BACKEND_CONFIGS } from './config'

export interface ProxyResult<T = any> {
  success: boolean
  data?: T
  error?: string
  backend?: {
    key: string
    name: string
    status: 'online' | 'offline'
    responseTime?: number
  }
}

export interface HealthCheckResult {
  backend: string
  status: 'online' | 'offline' | 'error'
  responseTime: number
  url: string
  type: 'java' | 'nodejs'
}

/**
 * Effectue un appel proxy vers un backend
 */

/**
 * Effectue un appel proxy vers un backend
 */
export async function proxyRequest<T = any>(
  backendKey: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'SUPPRESSION' = 'POST',
  body?: any,
  timeout: number = 30000
): Promise<ProxyResult<T>> {
  const config = getBackendConfig(backendKey)

  if (!config) {
    return {
      success: false,
      error: `Backend '${backendKey}' not found in configuration`,
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const startTime = Date.now()

  try {
    const url = `${config.baseUrl}${endpoint}`
    console.log(`[Proxy] ${method} ${url}`)

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Proxy] Error ${response.status}: ${errorText}`)
      return {
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`,
        backend: {
          key: config.key,
          name: config.name,
          status: 'online',
          responseTime,
        },
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      backend: {
        key: config.key,
        name: config.name,
        status: 'online',
        responseTime,
      },
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `Backend timeout after ${timeout}ms`,
        backend: {
          key: config.key,
          name: config.name,
          status: 'offline',
          responseTime,
        },
      }
    }

    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: `Backend '${config.name}' non disponible sur ${config.baseUrl}`,
        backend: {
          key: config.key,
          name: config.name,
          status: 'offline',
          responseTime,
        },
      }
    }

    return {
      success: false,
      error: error.message || 'Erreur inattendue',
      backend: {
        key: config.key,
        name: config.name,
        status: 'offline',
        responseTime,
      },
    }
  }
}

/**
 * Vérifie la santé d'un backend spécifique
 */
export async function checkBackendHealth(backendKey: string): Promise<HealthCheckResult> {
  const config = getBackendConfig(backendKey)

  if (!config) {
    return {
      backend: backendKey,
      status: 'error',
      responseTime: 0,
      url: 'unknown',
      type: 'java',
    }
  }

  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${config.baseUrl}${config.healthEndpoint}`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    return {
      backend: config.name,
      status: response.ok ? 'online' : 'offline',
      responseTime: Date.now() - startTime,
      url: config.baseUrl,
      type: config.type,
    }
  } catch {
    return {
      backend: config.name,
      status: 'offline',
      responseTime: Date.now() - startTime,
      url: config.baseUrl,
      type: config.type,
    }
  }
}

/**
 * Vérifie la santé de tous les backends
 */
export async function checkAllBackendsHealth(): Promise<HealthCheckResult[]> {
  const results = await Promise.all(
    BACKEND_CONFIGS.map(config => checkBackendHealth(config.key))
  )
  return results
}

/**
 * Génère les instructions de démarrage pour un backend
 */
export function getStartupInstructions(config: BackendConfig): string[] {
  if (config.type === 'java') {
    const folderMap: Record<string, string> = {
      'assurance-vie': 'simulateur-assurance-vie-spring',
      'patrimoine': 'simulateur-patrimonial-spring',
      'per-salaries': 'simulateur-per-salaries-spring',
      'immobilier': 'simulateur-immobilier-spring',
      'prevoyance-tns': 'simulateur-prevoyance-tns-spring',
    }
    const folder = folderMap[config.key] || config.key
    return [
      `cd app/(advisor)/simulateur-a-implementer/backend-simulators/${folder}`,
      'mvn clean install',
      'mvn spring-boot:run',
      `Le serveur sera disponible sur ${config.baseUrl}`,
    ]
  } else {
    const folderMap: Record<string, string> = {
      'capacite-emprunt': 'capacite-emprunt-node',
      'mensualite': 'mensualite-credit-node',
      'enveloppe-fiscale': 'enveloppe-fiscale-tns-node',
      'per-tns': 'per-tns-node',
      'ptz': 'ptz-2025-node',
      'epargne': 'epargne-flexible-node',
    }
    const folder = folderMap[config.key] || config.key
    return [
      `cd app/(advisor)/simulateur-a-implementer/backend-simulators/${folder}`,
      'npm install',
      'npm start',
      `Le serveur sera disponible sur ${config.baseUrl}`,
    ]
  }
}
