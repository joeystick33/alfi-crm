/**
 * Mobile Layout Hook
 * 
 * Provides utilities for responsive mobile layout management
 * including breakpoint detection, touch support, and orientation handling
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoints following Tailwind CSS conventions
 */
export const BREAKPOINTS = {
  xs: 0,      // Extra small devices
  sm: 640,    // Small devices (phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (desktops)
  xl: 1280,   // Extra large devices
  '2xl': 1536 // 2X Extra large devices
};

/**
 * Device types based on screen width
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',      // < 768px
  TABLET: 'tablet',      // 768px - 1024px
  DESKTOP: 'desktop'     // > 1024px
};

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('lg');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.sm) {
        setBreakpoint('xs');
      } else if (width < BREAKPOINTS.md) {
        setBreakpoint('sm');
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint('md');
      } else if (width < BREAKPOINTS.xl) {
        setBreakpoint('lg');
      } else if (width < BREAKPOINTS['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
}

/**
 * Hook to detect device type
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState(DEVICE_TYPES.DESKTOP);
  
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.md) {
        setDeviceType(DEVICE_TYPES.MOBILE);
      } else if (width < BREAKPOINTS.lg) {
        setDeviceType(DEVICE_TYPES.TABLET);
      } else {
        setDeviceType(DEVICE_TYPES.DESKTOP);
      }
    };
    
    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);
  
  return deviceType;
}

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile() {
  const deviceType = useDeviceType();
  return deviceType === DEVICE_TYPES.MOBILE;
}

/**
 * Hook to detect if device is tablet
 */
export function useIsTablet() {
  const deviceType = useDeviceType();
  return deviceType === DEVICE_TYPES.TABLET;
}

/**
 * Hook to detect if device is desktop
 */
export function useIsDesktop() {
  const deviceType = useDeviceType();
  return deviceType === DEVICE_TYPES.DESKTOP;
}

/**
 * Hook to detect touch support
 */
export function useTouchSupport() {
  const [hasTouch, setHasTouch] = useState(false);
  
  useEffect(() => {
    const checkTouch = () => {
      setHasTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
    
    checkTouch();
  }, []);
  
  return hasTouch;
}

/**
 * Hook to detect screen orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');
  
  useEffect(() => {
    const updateOrientation = () => {
      if (window.matchMedia('(orientation: portrait)').matches) {
        setOrientation('portrait');
      } else {
        setOrientation('landscape');
      }
    };
    
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);
  
  return orientation;
}

/**
 * Hook to detect viewport dimensions
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    return () => window.removeEventListener('resize', updateViewport);
  }, []);
  
  return viewport;
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);
  
  return matches;
}

/**
 * Comprehensive mobile layout hook
 */
export function useMobileLayout() {
  const breakpoint = useBreakpoint();
  const deviceType = useDeviceType();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const hasTouch = useTouchSupport();
  const orientation = useOrientation();
  const viewport = useViewport();
  
  // Determine layout mode
  const layoutMode = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  
  // Determine if sidebar should be collapsed
  const shouldCollapseSidebar = isMobile || (isTablet && orientation === 'portrait');
  
  // Determine number of columns for grid layouts
  const gridColumns = isMobile ? 1 : isTablet ? 2 : 3;
  
  // Determine if bottom navigation should be shown
  const showBottomNav = isMobile;
  
  // Determine if widgets should be stacked
  const stackWidgets = isMobile;
  
  return {
    // Device detection
    breakpoint,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    hasTouch,
    orientation,
    viewport,
    
    // Layout configuration
    layoutMode,
    shouldCollapseSidebar,
    gridColumns,
    showBottomNav,
    stackWidgets,
    
    // Utility functions
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isSmallScreen: viewport.width < BREAKPOINTS.md,
    isMediumScreen: viewport.width >= BREAKPOINTS.md && viewport.width < BREAKPOINTS.lg,
    isLargeScreen: viewport.width >= BREAKPOINTS.lg
  };
}

/**
 * Hook for swipe gesture detection
 */
export function useSwipeGesture(options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    timeout = 300
  } = options;
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchTime, setTouchTime] = useState(null);
  
  const handleTouchStart = useCallback((e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setTouchTime(Date.now());
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const deltaTime = Date.now() - touchTime;
    
    // Check if swipe was fast enough
    if (deltaTime > timeout) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    
    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      // Horizontal swipe
      if (absX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, touchTime, threshold, timeout, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * Hook for pull-to-refresh gesture
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 80,
    resistance = 2.5
  } = options;
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  
  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (startY === 0 || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = (currentY - startY) / resistance;
    
    if (distance > 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
      e.preventDefault();
    }
  }, [startY, threshold, resistance]);
  
  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);
  
  return {
    pullDistance,
    isRefreshing,
    isPulling: pullDistance > 0,
    shouldRefresh: pullDistance >= threshold,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

export default useMobileLayout;
