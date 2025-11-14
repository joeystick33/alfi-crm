import { useState, useCallback } from 'react';
import { apiCall } from '@/lib/api';

/**
 * Custom hook for optimistic task updates
 * Provides instant UI feedback while API call is in progress
 */
export function useOptimisticTasks(initialTasks = []) {
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingUpdates, setPendingUpdates] = useState(new Map());
  const [errors, setErrors] = useState(new Map());

  /**
   * Update a task optimistically
   */
  const updateTask = useCallback(async (taskId, updates) => {
    // Store original task for rollback
    const originalTask = tasks.find(t => t._id === taskId);
    if (!originalTask) return;

    // Mark as pending
    setPendingUpdates(prev => new Map(prev).set(taskId, true));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(taskId);
      return newErrors;
    });

    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task._id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );

    try {
      // Make API call
      const response = await apiCall(`/advisor/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      // Update with server response
      if (response.success && response.data) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId ? { ...task, ...response.data } : task
          )
        );
      }

      return response;
    } catch (error) {
      console.error('Error updating task:', error);

      // Rollback on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId ? originalTask : task
        )
      );

      // Store error
      setErrors(prev => new Map(prev).set(taskId, error.message || 'Erreur de mise à jour'));

      throw error;
    } finally {
      // Remove from pending
      setPendingUpdates(prev => {
        const newPending = new Map(prev);
        newPending.delete(taskId);
        return newPending;
      });
    }
  }, [tasks]);

  /**
   * Toggle task status (A_FAIRE <-> TERMINEE)
   */
  const toggleTaskStatus = useCallback(async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const newStatus = task.status === 'TERMINEE' ? 'A_FAIRE' : 'TERMINEE';
    return updateTask(taskId, { status: newStatus });
  }, [tasks, updateTask]);

  /**
   * Update task priority
   */
  const updateTaskPriority = useCallback(async (taskId, priority) => {
    return updateTask(taskId, { priority });
  }, [updateTask]);

  /**
   * Update task due date
   */
  const updateTaskDueDate = useCallback(async (taskId, dueDate) => {
    return updateTask(taskId, { dueDate });
  }, [updateTask]);

  /**
   * Delete task (set status to ANNULEE)
   */
  const deleteTask = useCallback(async (taskId) => {
    return updateTask(taskId, { status: 'ANNULEE' });
  }, [updateTask]);

  /**
   * Add a new task optimistically
   */
  const addTask = useCallback(async (taskData) => {
    // Generate temporary ID
    const tempId = `temp_${Date.now()}`;
    const optimisticTask = {
      _id: tempId,
      ...taskData,
      status: 'A_FAIRE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add optimistically
    setTasks(prevTasks => [optimisticTask, ...prevTasks]);
    setPendingUpdates(prev => new Map(prev).set(tempId, true));

    try {
      // Make API call
      const response = await apiCall('/advisor/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      if (response.success && response.data) {
        // Replace temp task with real one
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === tempId ? response.data : task
          )
        );
      }

      return response;
    } catch (error) {
      console.error('Error creating task:', error);

      // Remove optimistic task on error
      setTasks(prevTasks => prevTasks.filter(task => task._id !== tempId));
      setErrors(prev => new Map(prev).set(tempId, error.message || 'Erreur de création'));

      throw error;
    } finally {
      setPendingUpdates(prev => {
        const newPending = new Map(prev);
        newPending.delete(tempId);
        return newPending;
      });
    }
  }, []);

  /**
   * Bulk update tasks
   */
  const bulkUpdateTasks = useCallback(async (taskIds, updates) => {
    // Store original tasks for rollback
    const originalTasks = tasks.filter(t => taskIds.includes(t._id));

    // Mark all as pending
    taskIds.forEach(id => {
      setPendingUpdates(prev => new Map(prev).set(id, true));
    });

    // Optimistic update
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task._id)
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );

    try {
      // Make API call
      const response = await apiCall('/advisor/tasks/bulk', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update',
          taskIds,
          updates
        })
      });

      return response;
    } catch (error) {
      console.error('Error bulk updating tasks:', error);

      // Rollback on error
      setTasks(prevTasks =>
        prevTasks.map(task => {
          const original = originalTasks.find(t => t._id === task._id);
          return original || task;
        })
      );

      throw error;
    } finally {
      // Remove from pending
      taskIds.forEach(id => {
        setPendingUpdates(prev => {
          const newPending = new Map(prev);
          newPending.delete(id);
          return newPending;
        });
      });
    }
  }, [tasks]);

  /**
   * Refresh tasks from server
   */
  const refreshTasks = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiCall(`/advisor/tasks?${params.toString()}`);

      if (response.success && response.data) {
        setTasks(response.data);
      }

      return response;
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      throw error;
    }
  }, []);

  /**
   * Check if a task is pending update
   */
  const isPending = useCallback((taskId) => {
    return pendingUpdates.has(taskId);
  }, [pendingUpdates]);

  /**
   * Get error for a task
   */
  const getError = useCallback((taskId) => {
    return errors.get(taskId);
  }, [errors]);

  /**
   * Clear error for a task
   */
  const clearError = useCallback((taskId) => {
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(taskId);
      return newErrors;
    });
  }, []);

  return {
    tasks,
    setTasks,
    updateTask,
    toggleTaskStatus,
    updateTaskPriority,
    updateTaskDueDate,
    deleteTask,
    addTask,
    bulkUpdateTasks,
    refreshTasks,
    isPending,
    getError,
    clearError,
    hasPendingUpdates: pendingUpdates.size > 0
  };
}
