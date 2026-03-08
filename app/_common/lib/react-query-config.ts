import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default options for React Query
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache time: 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 3 times (except rate limit)
    retry: (failureCount, error) => {
      const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error
          ? Number((error as { status?: unknown }).status)
          : undefined

      if (status === 429) return false
      return failureCount < 3
    },
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
  },
  mutations: {
    // Retry failed mutations once
    retry: 1,
  },
}

/**
 * Create a new QueryClient instance with default options
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions,
  })
}

/**
 * Singleton QueryClient instance for the app
 */
export const queryClient = createQueryClient()
