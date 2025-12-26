import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadLayout,
  saveLayout,
  getCachedLayout,
  cacheLayout,
  syncLayout,
  startAutoSync,
  OptimisticLayoutManager
} from '@/lib/dashboard/layout-persistence';
import { getPresetById } from '@/lib/dashboard/layout-presets';

/**
 * Hook for managing dashboard layout with persistence and optimistic updates
 */
export function useDashboardLayout(options = {}) {
  const {
    autoSync = true,
    syncInterval = 60000, // 1 minute
    enableOptimistic = true,
    onSyncConflict = null
  } = options;

  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const optimisticManager = useRef(new OptimisticLayoutManager());
  const autoSyncCleanup = useRef(null);
  const saveTimeout = useRef(null);

  /**
   * Load initial layout
   */
  useEffect(() => {
    loadInitialLayout();
  }, []);

  /**
   * Setup auto-sync
   */
  useEffect(() => {
    if (!autoSync || !layout) return;

    autoSyncCleanup.current = startAutoSync((syncedLayout) => {
      if (onSyncConflict) {
        onSyncConflict(syncedLayout, layout);
      }
      setLayout(syncedLayout);
      optimisticManager.current.setLayout(syncedLayout);
    }, syncInterval);

    return () => {
      if (autoSyncCleanup.current) {
        autoSyncCleanup.current();
      }
    };
  }, [autoSync, syncInterval, layout, onSyncConflict]);

  /**
   * Load initial layout from cache or server
   */
  const loadInitialLayout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try cache first for instant load
      const cached = getCachedLayout();
      if (cached) {
        setLayout(cached);
        optimisticManager.current.setLayout(cached);
        setLoading(false);

        // Sync in background
        syncLayout(cached).then(result => {
          if (result.synced && result.hadConflict) {
            setLayout(result.layout);
            optimisticManager.current.setLayout(result.layout);
          }
        });
        return;
      }

      // Load from server
      const serverLayout = await loadLayout();
      
      if (serverLayout) {
        setLayout(serverLayout);
        optimisticManager.current.setLayout(serverLayout);
        cacheLayout(serverLayout);
      } else {
        // Use default preset
        const defaultPreset = getPresetById('default');
        if (defaultPreset) {
          const defaultLayout = {
            widgets: defaultPreset.widgets,
            columns: { desktop: 12, tablet: 8, mobile: 4 },
            autoRefresh: true,
            refreshInterval: 5
          };
          setLayout(defaultLayout);
          optimisticManager.current.setLayout(defaultLayout);
        }
      }

    } catch (err) {
      console.error('Error loading layout:', err);
      setError('Erreur lors du chargement du layout');
      
      // Fallback to default
      const defaultPreset = getPresetById('default');
      if (defaultPreset) {
        const defaultLayout = {
          widgets: defaultPreset.widgets,
          columns: { desktop: 12, tablet: 8, mobile: 4 },
          autoRefresh: true,
          refreshInterval: 5
        };
        setLayout(defaultLayout);
        optimisticManager.current.setLayout(defaultLayout);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update layout with optimistic update
   */
  const updateLayout = useCallback((updateFn, options = {}) => {
    const { immediate = false, debounce = 1000 } = options;

    if (enableOptimistic) {
      // Apply optimistic update
      const { updateId, layout: newLayout } = optimisticManager.current.applyOptimistic(updateFn);
      setLayout(newLayout);
      setHasUnsavedChanges(true);

      // Clear existing timeout
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      // Save to server
      const performSave = async () => {
        try {
          setSaving(true);
          await saveLayout(newLayout);
          optimisticManager.current.confirmUpdate(updateId);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          cacheLayout(newLayout);
        } catch (err) {
          console.error('Error saving layout:', err);
          // Rollback on error
          optimisticManager.current.rollbackUpdate(updateId);
          const rolledBackLayout = optimisticManager.current.getLayout();
          setLayout(rolledBackLayout);
          setError('Erreur lors de la sauvegarde');
        } finally {
          setSaving(false);
        }
      };

      if (immediate) {
        performSave();
      } else {
        // Debounce save
        saveTimeout.current = setTimeout(performSave, debounce);
      }
    } else {
      // Direct update without optimistic
      const newLayout = updateFn(layout);
      setLayout(newLayout);
      setHasUnsavedChanges(true);
    }
  }, [layout, enableOptimistic]);

  /**
   * Save layout immediately
   */
  const save = useCallback(async (layoutToSave = null) => {
    try {
      setSaving(true);
      setError(null);

      const dataToSave = layoutToSave || layout;
      const result = await saveLayout(dataToSave);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      cacheLayout(result.data || result);
      
      return { success: true };
    } catch (err) {
      console.error('Error saving layout:', err);
      setError('Erreur lors de la sauvegarde');
      return { success: false, error: err };
    } finally {
      setSaving(false);
    }
  }, [layout]);

  /**
   * Reset to default layout
   */
  const reset = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      const defaultPreset = getPresetById('default');
      if (!defaultPreset) {
        throw new Error('Default preset not found');
      }

      const defaultLayout = {
        widgets: defaultPreset.widgets,
        columns: { desktop: 12, tablet: 8, mobile: 4 },
        autoRefresh: true,
        refreshInterval: 5
      };

      await saveLayout(defaultLayout);
      setLayout(defaultLayout);
      optimisticManager.current.setLayout(defaultLayout);
      cacheLayout(defaultLayout);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      return { success: true };
    } catch (err) {
      console.error('Error resetting layout:', err);
      setError('Erreur lors de la réinitialisation');
      return { success: false, error: err };
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Apply preset
   */
  const applyPreset = useCallback(async (presetId) => {
    try {
      setSaving(true);
      setError(null);

      const preset = getPresetById(presetId);
      if (!preset) {
        throw new Error('Preset not found');
      }

      const presetLayout = {
        widgets: preset.widgets,
        columns: { desktop: 12, tablet: 8, mobile: 4 },
        autoRefresh: true,
        refreshInterval: 5
      };

      await saveLayout(presetLayout);
      setLayout(presetLayout);
      optimisticManager.current.setLayout(presetLayout);
      cacheLayout(presetLayout);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      return { success: true };
    } catch (err) {
      console.error('Error applying preset:', err);
      setError('Erreur lors de l\'application du preset');
      return { success: false, error: err };
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Sync with server
   */
  const sync = useCallback(async () => {
    try {
      const result = await syncLayout(layout);
      
      if (result.synced && result.hadConflict) {
        setLayout(result.layout);
        optimisticManager.current.setLayout(result.layout);
        cacheLayout(result.layout);
      }
      
      return result;
    } catch (err) {
      console.error('Error syncing layout:', err);
      return { synced: false, error: err };
    }
  }, [layout]);

  /**
   * Update widget settings
   */
  const updateWidgetSettings = useCallback((widgetType, settings) => {
    updateLayout((currentLayout) => ({
      ...currentLayout,
      widgets: currentLayout.widgets.map(w =>
        w.type === widgetType
          ? { ...w, settings: { ...w.settings, ...settings } }
          : w
      )
    }));
  }, [updateLayout]);

  /**
   * Toggle widget visibility
   */
  const toggleWidget = useCallback((widgetType) => {
    updateLayout((currentLayout) => ({
      ...currentLayout,
      widgets: currentLayout.widgets.map(w =>
        w.type === widgetType
          ? { ...w, enabled: !w.enabled }
          : w
      )
    }));
  }, [updateLayout]);

  /**
   * Update widget position
   */
  const updateWidgetPosition = useCallback((widgetId, position) => {
    updateLayout((currentLayout) => ({
      ...currentLayout,
      widgets: currentLayout.widgets.map(w =>
        w.id === widgetId
          ? { ...w, position }
          : w
      )
    }), { debounce: 500 });
  }, [updateLayout]);

  return {
    layout,
    loading,
    saving,
    error,
    lastSaved,
    hasUnsavedChanges,
    updateLayout,
    save,
    reset,
    applyPreset,
    sync,
    updateWidgetSettings,
    toggleWidget,
    updateWidgetPosition
  };
}
