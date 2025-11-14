/**
 * Infinite scroll hook for paginated lists
 * Automatically loads more data when user scrolls near the bottom
 */

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, type UseInfiniteQueryOptions } from '@tanstack/react-query'
import { api, type PaginatedResponse } from '@/lib/api-client'

interface UseInfiniteScrollOptions<T> {
  queryKey: readonly unknown[]
  endpoint: string
  pageSize?: number
  enabled?: boolean
  threshold?: number // Distance from bottom to trigger load (in pixels)
}

/**
 * Hook for infinite scroll with automatic pagination
 */
export function useInfiniteScroll<T>({
  queryKey,
  endpoint,
  pageSize = 20,
  enabled = true,
  threshold = 500,
}: UseInfiniteScrollOptions<T>) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const separator = endpoint.includes('?') ? '&' : '?'
      const url = `${endpoint}${separator}page=${pageParam}&pageSize=${pageSize}`
      return api.get<PaginatedResponse<T>>(url)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled,
  })

  // Flatten all pages into a single array
  const items = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.pagination.total ?? 0

  // Setup intersection observer for automatic loading
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold])

  useEffect(() => {
    setupObserver()
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [setupObserver])

  return {
    items,
    totalCount,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    loadMoreRef,
    refetch: () => fetchNextPage({ cancelRefetch: true }),
  }
}

/**
 * Hook for infinite scroll with manual trigger
 */
export function useInfiniteScrollManual<T>({
  queryKey,
  endpoint,
  pageSize = 20,
  enabled = true,
}: Omit<UseInfiniteScrollOptions<T>, 'threshold'>) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const separator = endpoint.includes('?') ? '&' : '?'
      const url = `${endpoint}${separator}page=${pageParam}&pageSize=${pageSize}`
      return api.get<PaginatedResponse<T>>(url)
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled,
  })

  const items = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.pagination.total ?? 0

  return {
    items,
    totalCount,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
  }
}
