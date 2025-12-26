import { useState, useEffect, useCallback, useRef } from 'react';
import { cache } from '@/lib/cache';

/**
 * Custom hook for fetching and managing tasks with caching and optimistic updates
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.status - Filter by status (comma-separated for multiple)
 * @param {string} options.priority - Filter by priority (comma-separated for multiple)
 * @param {string} options.type - Filter by type
 * @param {string} options.clientId - Filter by client
 * @param {boolean} options.overdue - Show only overdue tasks
 * @param {boolean} options.dueToday - Show only tasks due today
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.sort - Sort field (dueDate, priority, createdAt, updatedAt)
 * @param {string} options.order - Sort order (asc, desc)
 * @param {number} options.refreshInterval - Auto-refresh interval in ms (0 to disable)
 * @param {boolean} options.enableCache - Enable client-side caching
 * 
 * @returns {Object} - { tasks, stats, loading, error, refetch, updateTask, toggleTaskStatus, deleteTask }
 */
export function useTasks(options = {}) {
  const {
    status,
    priority,
    type,
    clientId,
    overdue = false,
    dueToday = false,
    limit = 50,
    sort = 'dueDate',
    order = 'asc',
    refreshInterval = 0,
    enableCache = true
  } = options;

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const refreshTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Generate cache key based on query parameters
  const getCacheKey = useCallback(() => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (type) params.append('type', type);
    if (clientId) params.append('clientId', clientId);
    if (overdue) params.append('overdue', 'true');
    if (dueToday) params.append('dueToday', 'true');
    if (limit) params.append('limit', limit.toString());
    if (sort) params.append('sort', sort);
    if (order) params.append('order', order);
    
    return `tasks:${params.toString()}`;
  }, [status, priority, type, clientId, overdue, dueToday, limit, sort, order]);

  // Fetch tasks from API
  const fetchTasks = useCallback(async (skipCache = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const cacheKey = getCacheKey();

    // Check cache first
    if (enableCache && !skipCache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setTasks(cached.tasks);
        setStats(cached.stats);
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
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (type) params.append('type', type);
      if (clientId) params.append('clientId', clientId);
      if (overdue) params.append('overdue', 'true');
      if (dueToday) params.append('dueToday', 'true');
      if (limit) params.append('limit', limit.toString());
      if (sort) params.append('sort', sort);
      if (order) params.append('order', order);

      const response = await fetch(`/api/advisor/tasks?${params.toString()}`, {
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
        throw new Error(result.error || 'Erreur lors du chargement des tâches');
      }

      const data = result.data || [];
      const statsData = result.stats || null;
      
      // Update state
      setTasks(data);
      setStats(statsData);
      setLastFetch(new Date());
      setError(null);

      // Cache the result
      if (enableCache) {
        cache.set(cacheKey, { tasks: data, stats: statsData }, 60 * 1000); // 1 minute cache
      }

      return { tasks: data, stats: statsData };

    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }

      console.error('Error fetching tasks:', err);
      setError(err.message);
      setTasks([]);
      setStats(null);
      return null;

    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [getCacheKey, status, priority, type, clientId, overdue, dueToday, limit, sort, order, enableCache]);

  // Refetch function (bypasses cache)
  const refetch = useCallback(() => {
    return fetchTasks(true);
  }, [fetchTasks]);

  // Optimistic update for task
  const updateTask = useCallback(async (taskId, updates) => {
    // Optimistic update
    setTasks(current => 
      current.map(task => 
        task._id === taskId ? { ...task, ...updates } : task
      )
    );

    try {
      const response = await fetch(`/api/advisor/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update task');
      }

      // Update with server response
      setTasks(current => 
        current.map(task => 
          task._id === taskId ? { ...task, ...result.data } : task
        )
      );

      // Invalidate cache
      if (enableCache) {
        const cacheKey = getCacheKey();
        cache.delete(cacheKey);
      }

      return result.data;

    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update
      await refetch();
      throw error;
    }
  }, [enableCache, getCacheKey, refetch]);

  // Toggle task status (optimistic)
  const toggleTaskStatus = useCallback(async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'TERMINEE' ? 'A_FAIRE' : 'TERMINEE';
    
    // Optimistic update
    setTasks(current => 
      current.map(task => 
        task._id === taskId 
          ? { 
              ...task, 
              status: newStatus,
              completedAt: newStatus === 'TERMINEE' ? new Date().toISOString() : null
            } 
          : task
      )
    );

    try {
      const response = await fetch(`/api/advisor/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle task status');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle task status');
      }

      // Update with server response
      setTasks(current => 
        current.map(task => 
          task._id === taskId ? { ...task, ...result.data } : task
        )
      );

      // Invalidate cache
      if (enableCache) {
        const cacheKey = getCacheKey();
        cache.delete(cacheKey);
      }

      return result.data;

    } catch (error) {
      console.error('Error toggling task status:', error);
      // Revert optimistic update
      await refetch();
      throw error;
    }
  }, [enableCache, getCacheKey, refetch]);

  // Delete task (soft delete)
  const deleteTask = useCallback(async (taskId) => {
    // Optimistic update
    setTasks(current => current.filter(task => task._id !== taskId));

    try {
      const response = await fetch(`/api/advisor/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete task');
      }

      // Invalidate cache
      if (enableCache) {
        const cacheKey = getCacheKey();
        cache.delete(cacheKey);
      }

      return true;

    } catch (error) {
      console.error('Error deleting task:', error);
      // Revert optimistic update
      await refetch();
      throw error;
    }
  }, [enableCache, getCacheKey, refetch]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Setup auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        fetchTasks(true);
      }, refreshInterval);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [refreshInterval, fetchTasks]);

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
    tasks,
    stats,
    loading,
    error,
    refetch,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    lastFetch
  };
}

export default useTasks;
