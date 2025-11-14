/**
 * useMobileLayout Hook Tests
 * 
 * Tests for the mobile layout hook including:
 * - Device detection
 * - Breakpoint detection
 * - Touch support
 * - Orientation detection
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useBreakpoint,
  useDeviceType,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useTouchSupport,
  useOrientation,
  useViewport,
  useMobileLayout,
  useSwipeGesture,
  BREAKPOINTS,
  DEVICE_TYPES
} from '../useMobileLayout';

describe('useMobileLayout Hooks', () => {
  let originalInnerWidth;
  let originalInnerHeight;
  
  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });
  
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
  });

  describe('useBreakpoint', () => {
    it('should return xs for width < 640px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('xs');
    });

    it('should return sm for width 640-767px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640
      });
      
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('sm');
    });

    it('should return md for width 768-1023px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('md');
    });

    it('should return lg for width 1024-1279px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('lg');
    });

    it('should update on window resize', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('xs');
      
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024
        });
        window.dispatchEvent(new Event('resize'));
      });
      
      expect(result.current).toBe('lg');
    });
  });

  describe('useDeviceType', () => {
    it('should return mobile for width < 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe(DEVICE_TYPES.MOBILE);
    });

    it('should return tablet for width 768-1023px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe(DEVICE_TYPES.TABLET);
    });

    it('should return desktop for width >= 1024px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe(DEVICE_TYPES.DESKTOP);
    });
  });

  describe('useIsMobile', () => {
    it('should return true for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('should return true for tablet width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return false for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop', () => {
    it('should return true for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return false for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });
  });

  describe('useTouchSupport', () => {
    it('should detect touch support', () => {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {}
      });
      
      const { result } = renderHook(() => useTouchSupport());
      expect(result.current).toBe(true);
    });
  });

  describe('useOrientation', () => {
    it('should return portrait by default', () => {
      const { result } = renderHook(() => useOrientation());
      expect(result.current).toBe('portrait');
    });
  });

  describe('useViewport', () => {
    it('should return viewport dimensions', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      });
      
      const { result } = renderHook(() => useViewport());
      expect(result.current.width).toBe(375);
      expect(result.current.height).toBe(667);
    });

    it('should update on window resize', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useViewport());
      expect(result.current.width).toBe(375);
      
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024
        });
        window.dispatchEvent(new Event('resize'));
      });
      
      expect(result.current.width).toBe(1024);
    });
  });

  describe('useMobileLayout', () => {
    it('should return comprehensive layout configuration', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.isMobile).toBe(true);
      expect(result.current.layoutMode).toBe('mobile');
      expect(result.current.shouldCollapseSidebar).toBe(true);
      expect(result.current.gridColumns).toBe(1);
      expect(result.current.showBottomNav).toBe(true);
      expect(result.current.stackWidgets).toBe(true);
    });

    it('should return desktop configuration for large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      
      const { result } = renderHook(() => useMobileLayout());
      
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.layoutMode).toBe('desktop');
      expect(result.current.shouldCollapseSidebar).toBe(false);
      expect(result.current.gridColumns).toBe(3);
      expect(result.current.showBottomNav).toBe(false);
    });
  });

  describe('useSwipeGesture', () => {
    it('should detect swipe left', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft }));
      
      const touchStart = { touches: [{ clientX: 200, clientY: 100 }] };
      const touchMove = { touches: [{ clientX: 100, clientY: 100 }] };
      
      act(() => {
        result.current.onTouchStart(touchStart);
        result.current.onTouchMove(touchMove);
        result.current.onTouchEnd();
      });
      
      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should detect swipe right', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() => useSwipeGesture({ onSwipeRight }));
      
      const touchStart = { touches: [{ clientX: 100, clientY: 100 }] };
      const touchMove = { touches: [{ clientX: 200, clientY: 100 }] };
      
      act(() => {
        result.current.onTouchStart(touchStart);
        result.current.onTouchMove(touchMove);
        result.current.onTouchEnd();
      });
      
      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should not trigger swipe if below threshold', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipeGesture({ 
        onSwipeLeft,
        threshold: 100
      }));
      
      const touchStart = { touches: [{ clientX: 100, clientY: 100 }] };
      const touchMove = { touches: [{ clientX: 80, clientY: 100 }] };
      
      act(() => {
        result.current.onTouchStart(touchStart);
        result.current.onTouchMove(touchMove);
        result.current.onTouchEnd();
      });
      
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });
});
