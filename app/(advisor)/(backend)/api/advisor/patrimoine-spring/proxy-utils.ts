 
/**
 * Proxy Utils pour le backend Java Patrimonial Spring
 * Backend: http://localhost:8081
 */

const JAVA_PATRIMONIAL_URL = process.env.JAVA_PATRIMOINE_URL || 'http://localhost:8081'

export interface ProxyResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  javaBackendStatus?: 'online' | 'offline'
}

/**
 * Proxy générique vers le backend Java
 */
export async function proxyToJavaBackend<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'SUPPRESSION' = 'POST',
  body?: any,
  timeout: number = 30000
): Promise<ProxyResponse<T>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const url = `${JAVA_PATRIMONIAL_URL}${endpoint}`
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Proxy] Error ${response.status}: ${errorText}`)
      return {
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`,
        javaBackendStatus: 'online',
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      javaBackendStatus: 'online',
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Backend timeout - le serveur Java ne répond pas',
        javaBackendStatus: 'offline',
      }
    }

    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Backend Java non disponible - vérifiez que le serveur Spring Boot est démarré sur le port 8081',
        javaBackendStatus: 'offline',
      }
    }

    console.error('[Proxy] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'Erreur inattendue',
      javaBackendStatus: 'offline',
    }
  }
}

/**
 * Vérifie si le backend Java est en ligne
 */
export async function checkJavaBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${JAVA_PATRIMONIAL_URL}/actuator/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })
    return response.ok
  } catch {
    return false
  }
}

export { JAVA_PATRIMONIAL_URL }
