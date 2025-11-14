/**
 * Widget Loader Hook
 * React hook for managing lazy-loaded widgets
 */

import { useEffect, useRef, useState } from 'react';
import { 
  preloadWidget, 
  preloadCriticalWidgets,
  WidgetLazyLoader 
} from '@/lib/dashboard/widget-loader';

/**
 * Hook to preload critical widgets on mount
 */
export function usePreloadCriticalWidgets() {
  useEffect(() => {
    // Preload critical widgets after initial render
    const timer = setTimeout(() => {
      preloadCriticalWidgets();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
}

/**
 * Hook to preload widget on hover
 */
export function usePreloadOnHover(widgetType) {
  const hasPreloaded = useRef(false);
  
  const handleMouseEnter = () => {
    if (!hasPreloaded.current) {
      preloadWidget(widgetType);
      hasPreloaded.current = true;
    }
  };
  
  return { onMouseEnter: handleMouseEnter };
}

/**
 * Hook for intersection observer based lazy loading
 */
export function useWidgetIntersectionObserver(widgetType, options = {}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          preloadWidget(widgetType);
          setHasLoaded(true);
        }
      },
      {
        rootMargin: options.rootMargin || '200px',
        threshold: options.threshold || 0.01
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [widgetType, hasLoaded, options.rootMargin, options.threshold]);
  
  return { elementRef, isVisible, hasLoaded };
}

/**
 * Hook for progressive widget loading
 */
export function useProgressiveWidgetLoading(widgets, options = {}) {
  const {
    batchSize = 3,
    delayBetweenBatches = 500,
    priorityWidgets = ['quick-stats', 'today', 'tasks']
  } = options;
  
  const [loadedWidgets, setLoadedWidgets] = useState(new Set(priorityWidgets));
  const [currentBatch, setCurrentBatch] = useState(0);
  
  useEffect(() => {
    // Load priority widgets immediately
    priorityWidgets.forEach(type => preloadWidget(type));
    
    // Load remaining widgets in batches
    const remainingWidgets = widgets.filter(
      w => w.enabled && !priorityWidgets.includes(w.type)
    );
    
    const totalBatches = Math.ceil(remainingWidgets.length / batchSize);
    
    if (currentBatch >= totalBatches) return;
    
    const timer = setTimeout(() => {
      const startIdx = currentBatch * batchSize;
      const endIdx = startIdx + batchSize;
      const batch = remainingWidgets.slice(startIdx, endIdx);
      
      batch.forEach(widget => {
        preloadWidget(widget.type);
        setLoadedWidgets(prev => new Set([...prev, widget.type]));
      });
      
      setCurrentBatch(prev => prev + 1);
    }, delayBetweenBatches);
    
    return () => clearTimeout(timer);
  }, [widgets, currentBatch, batchSize, delayBetweenBatches, priorityWidgets]);
  
  return {
    loadedWidgets,
    isWidgetLoaded: (widgetType) => loadedWidgets.has(widgetType),
    loadingProgress: (currentBatch / Math.ceil(widgets.length / batchSize)) * 100
  };
}

/**
 * Hook for managing widget lazy loader instance
 */
export function useWidgetLazyLoaderInstance() {
  const loaderRef = useRef(null);
  
  useEffect(() => {
    loaderRef.current = new WidgetLazyLoader();
    loaderRef.current.init();
    
    return () => {
      loaderRef.current?.disconnect();
    };
  }, []);
  
  const observe = (element, widgetType) => {
    loaderRef.current?.observe(element, widgetType);
  };
  
  const unobserve = (element) => {
    loaderRef.current?.unobserve(element);
  };
  
  return { observe, unobserve };
}

/**
 * Hook for conditional widget loading based on viewport
 */
export function useConditionalWidgetLoad(widgetType, condition = true) {
  const [shouldLoad, setShouldLoad] = useState(false);
  
  useEffect(() => {
    if (!condition) return;
    
    // Check if widget is in viewport or close to it
    const checkViewport = () => {
      if (typeof window === 'undefined') return;
      
      // Load if page is scrolled or after a delay
      const scrolled = window.scrollY > 100;
      const timer = setTimeout(() => {
        setShouldLoad(true);
        preloadWidget(widgetType);
      }, scrolled ? 0 : 1000);
      
      return () => clearTimeout(timer);
    };
    
    return checkViewport();
  }, [widgetType, condition]);
  
  return shouldLoad;
}

/**
 * Hook for tracking widget load performance
 */
export function useWidgetLoadPerformance(widgetType) {
  const [metrics, setMetrics] = useState({
    loadStartTime: null,
    loadEndTime: null,
    loadDuration: null,
    renderStartTime: null,
    renderEndTime: null,
    renderDuration: null
  });
  
  useEffect(() => {
    const loadStartTime = performance.now();
    setMetrics(prev => ({ ...prev, loadStartTime }));
    
    // Mark load end when component mounts
    const loadEndTime = performance.now();
    const loadDuration = loadEndTime - loadStartTime;
    
    setMetrics(prev => ({
      ...prev,
      loadEndTime,
      loadDuration,
      renderStartTime: loadEndTime
    }));
    
    // Mark render end after paint
    requestAnimationFrame(() => {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - loadEndTime;
      
      setMetrics(prev => ({
        ...prev,
        renderEndTime,
        renderDuration
      }));
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Widget ${widgetType} performance:`, {
          loadDuration: `${loadDuration.toFixed(2)}ms`,
          renderDuration: `${renderDuration.toFixed(2)}ms`,
          totalTime: `${(loadDuration + renderDuration).toFixed(2)}ms`
        });
      }
    });
  }, [widgetType]);
  
  return metrics;
}

/**
 * Hook for prefetching widget data
 */
export function usePrefetchWidgetData(widgetType, prefetchFn, enabled = true) {
  useEffect(() => {
    if (!enabled || !prefetchFn) return;
    
    const timer = setTimeout(() => {
      prefetchFn();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [widgetType, prefetchFn, enabled]);
}
