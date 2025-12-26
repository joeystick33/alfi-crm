import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getRealtimeService } from '@/lib/realtime-appointments';
import { useAppointments } from './useAppointments';

/**
 * Enhanced hook for appointments with real-time updates
 * Combines caching with real-time polling for live updates
 * 
 * @param {Object} options - Configuration options (same as useAppointments)
 * @param {boolean} options.enableRealtime - Enable real-time updates (default: true)
 * @param {number} options.realtimeInterval - Polling interval for real-time updates in ms (default: 30000)
 * 
 * @returns {Object} - { appointments, loading, error, refetch, mutate, isRealtime }
 */
export function useRealtimeAppointments(options = {}) {
  const {
    enableRealtime = true,
    realtimeInterval = 30000, // 30 seconds
    ...appointmentOptions
  } = options;

  const { data: session } = useSession();
  const [isRealtime, setIsRealtime] = useState(false);
  const unsubscribeRef = useRef(null);

  // Use base appointments hook
  const {
    appointments,
    loading,
    error,
    refetch,
    mutate,
    lastFetch
  } = useAppointments(appointmentOptions);

  // Handle real-time updates
  useEffect(() => {
    if (!enableRealtime || !session?.user?.id) {
      return;
    }

    const realtimeService = getRealtimeService();
    if (!realtimeService) {
      return;
    }

    // Subscribe to real-time updates
    const unsubscribe = realtimeService.subscribe(
      session.user.id,
      (event) => {
        if (event.type === 'update' && event.data) {
          // Merge updates with existing appointments
          mutate(current => {
            const updatedIds = new Set(event.data.map(apt => apt._id));
            const filtered = current.filter(apt => !updatedIds.has(apt._id));
            return [...filtered, ...event.data].sort((a, b) => 
              new Date(a.startTime) - new Date(b.startTime)
            );
          });
          setIsRealtime(true);
        } else if (event.type === 'create') {
          // Add new appointment
          mutate(current => {
            const exists = current.some(apt => apt._id === event.data._id);
            if (exists) return current;
            return [...current, event.data].sort((a, b) => 
              new Date(a.startTime) - new Date(b.startTime)
            );
          });
        } else if (event.type === 'delete') {
          // Remove deleted appointment
          mutate(current => 
            current.filter(apt => apt._id !== event.data._id)
          );
        } else if (event.type === 'error') {
          console.error('Real-time update error:', event.error);
          setIsRealtime(false);
        }
      },
      {
        pollInterval: realtimeInterval,
        immediate: false // Don't fetch immediately, let useAppointments handle initial load
      }
    );

    unsubscribeRef.current = unsubscribe;
    setIsRealtime(true);

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsRealtime(false);
    };
  }, [enableRealtime, session?.user?.id, realtimeInterval, mutate]);

  // Enhanced mutate that notifies real-time service
  const enhancedMutate = useCallback((updater, action = 'update') => {
    const result = mutate(updater);
    
    // Notify real-time service of local changes
    if (enableRealtime && session?.user?.id) {
      const realtimeService = getRealtimeService();
      if (realtimeService) {
        const data = typeof updater === 'function' ? null : updater;
        if (data) {
          realtimeService.notifyUpdate(session.user.id, data, action);
        }
      }
    }
    
    return result;
  }, [mutate, enableRealtime, session?.user?.id]);

  return {
    appointments,
    loading,
    error,
    refetch,
    mutate: enhancedMutate,
    lastFetch,
    isRealtime
  };
}

export default useRealtimeAppointments;
