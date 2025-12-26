import { useState, useEffect, useCallback, useRef } from 'react';
import { cache } from '@/lib/cache';

/**
 * Custom hook for fetching and managing appointments with caching and real-time updates
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.date - Specific date (YYYY-MM-DD) or 'today'/'tomorrow'
 * @param {string} options.start - Start date for range
 * @param {string} options.end - End date for range
 * @param {string} options.view - Calendar view ('day', 'week', 'month')
 * @param {string} options.status - Filter by status
 * @param {string} options.clientId - Filter by client
 * @param {string} options.type - Filter by appointment type
 * @param {number} options.limit - Maximum number of results
 * @param {boolean} options.includeCompleted - Include completed appointments
 * @param {number} options.refreshInterval - Auto-refresh interval in ms (0 to disable)
 * @param {boolean} options.enableCache - Enable client-side caching
 * 
 * @returns {Object} - { appointments, loading, error, refetch, mutate }
 */
export function useAppointments(options = {}) {
  const {
    date,
    start,
    end,
    view,
    status,
    clientId,
    type,
    limit,
    includeCompleted = true,
    refreshInterval = 0,
    enableCache = true
  } = options;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const refreshTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Generate cache key based on query parameters
  const getCacheKey = useCallback(() => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (view) params.append('view', view);
    if (status) params.append('status', status);
    if (clientId) params.append('clientId', clientId);
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit.toString());
    if (!includeCompleted) params.append('includeCompleted', 'false');
    
    return `appointments:${params.toString()}`;
  }, [date, start, end, view, status, clientId, type, limit, includeCompleted]);

  // Fetch appointments from API
  const fetchAppointments = useCallback(async (skipCache = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cacheKey = getCacheKey();

    // Check cache first
    if (enableCache && !skipCache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setAppointments(cached);
        setLoading(false);
        setError(null);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Build query string
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      if (view) params.append('view', view);
      if (status) params.append('status', status);
      if (clientId) params.append('clientId', clientId);
      if (type) params.append('type', type);
      if (limit) params.append('limit', limit.toString());
      if (!includeCompleted) params.append('includeCompleted', 'false');

      const response = await fetch(`/api/advisor/appointments?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des rendez-vous');
      }

      const data = result.data || [];
      
      // Update state
      setAppointments(data);
      setLastFetch(new Date());
      setError(null);

      // Cache the result
      if (enableCache) {
        const cacheTTL = result.meta?.cacheTTL || 120;
        cache.set(cacheKey, data, cacheTTL * 1000);
      }

      return data;

    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }

      console.error('Error fetching appointments:', err);
      setError(err.message);
      setAppointments([]);
      return null;

    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [getCacheKey, date, start, end, view, status, clientId, type, limit, includeCompleted, enableCache]);

  // Refetch function (bypasses cache)
  const refetch = useCallback(() => {
    return fetchAppointments(true);
  }, [fetchAppointments]);

  // Optimistic update function
  const mutate = useCallback((updater) => {
    setAppointments(current => {
      const updated = typeof updater === 'function' ? updater(current) : updater;
      
      // Update cache
      if (enableCache) {
        const cacheKey = getCacheKey();
        cache.set(cacheKey, updated, 120 * 1000);
      }
      
      return updated;
    });
  }, [enableCache, getCacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Setup auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        fetchAppointments(true);
      }, refreshInterval);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [refreshInterval, fetchAppointments]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    appointments,
    loading,
    error,
    refetch,
    mutate,
    lastFetch
  };
}

export default useAppointments;
