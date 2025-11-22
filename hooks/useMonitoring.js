/**
 * useMonitoring Hook
 * 
 * React hook for integrating monitoring into components
 */

'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import performanceMonitor from '@/lib/monitoring/performance-monitor';
import errorTracker from '@/lib/monitoring/error-tracker';
import userAnalytics from '@/lib/monitoring/user-analytics';

export function useMonitoring(options = {}) {
  const {
    trackPageViews = true,
    trackPerformance = true,
    trackErrors = true,
    userId = null,
    userProperties = {}
  } = options;

  const pathname = usePathname();

  // Initialize monitoring
  useEffect(() => {
    if (trackPerformance) {
      performanceMonitor.init();
    }

    if (trackErrors) {
      errorTracker.init();
    }

    if (trackPageViews) {
      userAnalytics.init(userId, userProperties);
    }

    return () => {
      performanceMonitor.destroy();
    };
  }, [trackPerformance, trackErrors, trackPageViews, userId]);

  // Track page views on route change
  useEffect(() => {
    if (trackPageViews && pathname) {
      userAnalytics.trackPageView(pathname);
    }
  }, [pathname, trackPageViews]);

  // Update user info
  useEffect(() => {
    if (userId) {
      userAnalytics.setUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (Object.keys(userProperties).length > 0) {
      userAnalytics.setUserProperties(userProperties);
    }
  }, [userProperties]);

  // Tracking functions
  const trackEvent = useCallback((eventName, properties) => {
    userAnalytics.trackEvent(eventName, properties);
  }, []);

  const trackClick = useCallback((elementName, properties) => {
    userAnalytics.trackClick(elementName, properties);
  }, []);

  const trackFeature = useCallback((featureName, properties) => {
    userAnalytics.trackFeatureUsage(featureName, properties);
  }, []);

  const trackWidget = useCallback((widgetType, action, properties) => {
    userAnalytics.trackWidgetInteraction(widgetType, action, properties);
  }, []);

  const trackError = useCallback((error, context) => {
    errorTracker.captureError(error, context);
  }, []);

  const measurePerformance = useCallback((name, fn) => {
    performanceMonitor.mark(name);
    const result = fn();
    performanceMonitor.measure(name);
    return result;
  }, []);

  const measureAsync = useCallback(async (name, fn) => {
    performanceMonitor.mark(name);
    const result = await fn();
    performanceMonitor.measure(name);
    return result;
  }, []);

  return {
    trackEvent,
    trackClick,
    trackFeature,
    trackWidget,
    trackError,
    measurePerformance,
    measureAsync
  };
}

/**
 * usePerformanceTracking Hook
 * 
 * Track component render performance
 */
export function usePerformanceTracking(componentName) {
  useEffect(() => {
    performanceMonitor.mark(`${componentName}-mount`);
    
    return () => {
      performanceMonitor.measure(`${componentName}-mount`);
    };
  }, [componentName]);

  const trackRender = useCallback(() => {
    performanceMonitor.recordMetric(`${componentName}-render`, {
      timestamp: Date.now()
    });
  }, [componentName]);

  return { trackRender };
}

/**
 * useErrorBoundary Hook
 * 
 * Track errors in components
 */
export function useErrorBoundary(componentName) {
  const handleError = useCallback((error, errorInfo) => {
    errorTracker.captureComponentError(error, {
      ...errorInfo,
      component: componentName
    });
  }, [componentName]);

  return { handleError };
}
