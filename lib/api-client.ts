/**
 * API Client for ALFI CRM
 * Handles all HTTP requests to Next.js API routes with error handling and retry logic
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiCallOptions extends RequestInit {
  retry?: boolean
  retryAttempts?: number
  retryDelay?: number
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main API call function
 * Handles GET, POST, PUT, PATCH, DELETE requests with automatic error handling
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const {
    retry = true,
    retryAttempts = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  // Ensure endpoint starts with /api
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`

  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  let lastError: Error | null = null
  let attempt = 0

  while (attempt < (retry ? retryAttempts : 1)) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // Important: include cookies for session
      })

      // Handle different status codes
      if (response.ok) {
        // Success (2xx)
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return await response.json()
        }
        return await response.text() as any
      }

      // Parse error response
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: await response.text() }
      }

      // Handle specific error codes
      switch (response.status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          throw new ApiError(
            errorData.message || 'Non autorisé',
            401,
            'UNAUTHORIZED'
          )

        case 403:
          // Forbidden - insufficient permissions
          throw new ApiError(
            errorData.message || 'Accès refusé',
            403,
            'FORBIDDEN',
            errorData
          )

        case 404:
          // Not found
          throw new ApiError(
            errorData.message || 'Ressource non trouvée',
            404,
            'NOT_FOUND'
          )

        case 422:
          // Validation error
          throw new ApiError(
            errorData.message || 'Erreur de validation',
            422,
            'VALIDATION_ERROR',
            errorData.errors || errorData
          )

        case 429:
          // Too many requests - retry with exponential backoff
          if (retry && attempt < retryAttempts - 1) {
            await sleep(retryDelay * Math.pow(2, attempt))
            attempt++
            continue
          }
          throw new ApiError(
            errorData.message || 'Trop de requêtes',
            429,
            'RATE_LIMIT'
          )

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors - retry
          if (retry && attempt < retryAttempts - 1) {
            await sleep(retryDelay * Math.pow(2, attempt))
            attempt++
            continue
          }
          throw new ApiError(
            errorData.message || 'Erreur serveur',
            response.status,
            'SERVER_ERROR',
            errorData
          )

        default:
          throw new ApiError(
            errorData.message || 'Une erreur est survenue',
            response.status,
            'UNKNOWN_ERROR',
            errorData
          )
      }
    } catch (error: any) {
      // Network errors or other fetch errors
      if (error instanceof ApiError) {
        throw error
      }

      lastError = error as Error

      // Retry on network errors
      if (retry && attempt < retryAttempts - 1) {
        await sleep(retryDelay * Math.pow(2, attempt))
        attempt++
        continue
      }

      throw new ApiError(
        'Erreur de connexion au serveur',
        0,
        'NETWORK_ERROR',
        { originalError: lastError?.message }
      )
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Unknown error')
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, options?: ApiCallOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, data?: any, options?: ApiCallOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, data?: any, options?: ApiCallOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T = any>(endpoint: string, data?: any, options?: ApiCallOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, options?: ApiCallOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}
