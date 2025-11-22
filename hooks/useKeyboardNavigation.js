/**
 * Keyboard Navigation Hooks
 * Custom hooks for implementing accessible keyboard navigation
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Keyboard shortcuts configuration
 */
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  NEXT_WIDGET: 'Tab',
  PREV_WIDGET: 'Shift+Tab',
  SKIP_TO_MAIN: 'Alt+M',
  SKIP_TO_NAV: 'Alt+N',
  
  // Actions
  OPEN_SEARCH: ['/', 'Meta+K', 'Control+K'],
  OPEN_QUICK_CREATE: 'N',
  OPEN_SETTINGS: ',',
  REFRESH_DASHBOARD: 'R',
  
  // Widget actions
  EXPAND_WIDGET: 'Enter',
  COLLAPSE_WIDGET: 'Escape',
  NEXT_ITEM: 'ArrowDown',
  PREV_ITEM: 'ArrowUp',
  SELECT_ITEM: 'Enter',
  
  // Calendar
  NEXT_DAY: 'ArrowRight',
  PREV_DAY: 'ArrowLeft',
  NEXT_WEEK: 'ArrowDown',
  PREV_WEEK: 'ArrowUp',
  TODAY: 'T',
  
  // Tasks
  MARK_COMPLETE: 'Space',
  
  // Help
  SHOW_SHORTCUTS: '?'
};

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (event) => {
      const key = event.key;
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;
      
      // Build key combination string
      let combination = '';
      if (ctrl) combination += 'Control+';
      if (alt) combination += 'Alt+';
      if (shift) combination += 'Shift+';
      if (event.metaKey) combination = combination.replace('Control+', 'Meta+');
      combination += key;
      
      // Check if any shortcut matches
      Object.entries(shortcuts).forEach(([action, shortcut]) => {
        const shortcutArray = Array.isArray(shortcut) ? shortcut : [shortcut];
        
        if (shortcutArray.includes(key) || shortcutArray.includes(combination)) {
          // Don't trigger if user is typing in an input
          if (
            event.target.tagName === 'INPUT' ||
            event.target.tagName === 'TEXTAREA' ||
            event.target.isContentEditable
          ) {
            // Allow some shortcuts even in inputs
            if (!['Meta+K', 'Control+K', 'Escape'].includes(combination)) {
              return;
            }
          }
          
          event.preventDefault();
          const handler = shortcuts[action];
          if (typeof handler === 'function') {
            handler(event);
          }
        }
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Hook for focus management
 */
export function useFocusManagement(containerRef, options = {}) {
  const {
    autoFocus = false,
    restoreFocus = true,
    trapFocus = false
  } = options;
  
  const previousFocusRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Store previous focus
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement;
    }
    
    // Auto focus first focusable element
    if (autoFocus) {
      const firstFocusable = getFocusableElements(containerRef.current)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
    
    // Trap focus within container
    if (trapFocus) {
      const handleKeyDown = (event) => {
        if (event.key !== 'Tab') return;
        
        const focusableElements = getFocusableElements(containerRef.current);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };
      
      containerRef.current.addEventListener('keydown', handleKeyDown);
      
      return () => {
        containerRef.current?.removeEventListener('keydown', handleKeyDown);
        
        // Restore previous focus
        if (restoreFocus && previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [containerRef, autoFocus, restoreFocus, trapFocus]);
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container) {
  if (!container) return [];
  
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * Hook for roving tabindex (for lists and grids)
 */
export function useRovingTabIndex(items, options = {}) {
  const {
    orientation = 'vertical', // 'vertical' | 'horizontal' | 'both'
    loop = true,
    defaultIndex = 0
  } = options;
  
  const currentIndexRef = useRef(defaultIndex);
  
  const handleKeyDown = useCallback((event, index) => {
    const { key } = event;
    let newIndex = index;
    
    // Vertical navigation
    if (orientation === 'vertical' || orientation === 'both') {
      if (key === 'ArrowDown') {
        event.preventDefault();
        newIndex = loop ? (index + 1) % items.length : Math.min(index + 1, items.length - 1);
      } else if (key === 'ArrowUp') {
        event.preventDefault();
        newIndex = loop ? (index - 1 + items.length) % items.length : Math.max(index - 1, 0);
      }
    }
    
    // Horizontal navigation
    if (orientation === 'horizontal' || orientation === 'both') {
      if (key === 'ArrowRight') {
        event.preventDefault();
        newIndex = loop ? (index + 1) % items.length : Math.min(index + 1, items.length - 1);
      } else if (key === 'ArrowLeft') {
        event.preventDefault();
        newIndex = loop ? (index - 1 + items.length) % items.length : Math.max(index - 1, 0);
      }
    }
    
    // Home/End keys
    if (key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (key === 'End') {
      event.preventDefault();
      newIndex = items.length - 1;
    }
    
    if (newIndex !== index) {
      currentIndexRef.current = newIndex;
      return newIndex;
    }
    
    return index;
  }, [items.length, orientation, loop]);
  
  const getTabIndex = useCallback((index) => {
    return index === currentIndexRef.current ? 0 : -1;
  }, []);
  
  const setCurrentIndex = useCallback((index) => {
    currentIndexRef.current = index;
  }, []);
  
  return {
    handleKeyDown,
    getTabIndex,
    setCurrentIndex,
    currentIndex: currentIndexRef.current
  };
}

/**
 * Hook for skip links
 */
export function useSkipLinks() {
  const skipToMain = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  const skipToNav = useCallback(() => {
    const navigation = document.getElementById('main-navigation');
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  const skipToWidget = useCallback((widgetId) => {
    const widget = document.getElementById(widgetId);
    if (widget) {
      widget.focus();
      widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  
  return {
    skipToMain,
    skipToNav,
    skipToWidget
  };
}

/**
 * Hook for focus visible (keyboard vs mouse)
 */
export function useFocusVisible() {
  useEffect(() => {
    let hadKeyboardEvent = false;
    
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        hadKeyboardEvent = true;
        document.body.classList.add('keyboard-navigation');
      }
    };
    
    const handleMouseDown = () => {
      hadKeyboardEvent = false;
      document.body.classList.remove('keyboard-navigation');
    };
    
    const handleFocus = (event) => {
      if (hadKeyboardEvent) {
        event.target.classList.add('focus-visible');
      }
    };
    
    const handleBlur = (event) => {
      event.target.classList.remove('focus-visible');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('blur', handleBlur, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, []);
}

/**
 * Hook for accessible modal
 */
export function useAccessibleModal(isOpen, onClose) {
  const modalRef = useRef(null);
  
  useFocusManagement(modalRef, {
    autoFocus: isOpen,
    restoreFocus: true,
    trapFocus: isOpen
  });
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  return modalRef;
}

/**
 * Hook for accessible dropdown
 */
export function useAccessibleDropdown() {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleTriggerKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setFocusedIndex(0);
    }
  };
  
  const handleMenuKeyDown = (event) => {
    const items = getFocusableElements(menuRef.current);
    
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const newIndex = (focusedIndex + 1) % items.length;
      setFocusedIndex(newIndex);
      items[newIndex]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const newIndex = (focusedIndex - 1 + items.length) % items.length;
      setFocusedIndex(newIndex);
      items[newIndex]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setFocusedIndex(0);
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      const lastIndex = items.length - 1;
      setFocusedIndex(lastIndex);
      items[lastIndex]?.focus();
    }
  };
  
  return {
    triggerRef,
    menuRef,
    isOpen,
    setIsOpen,
    handleTriggerKeyDown,
    handleMenuKeyDown
  };
}

/**
 * Hook for announcing changes to screen readers
 */
export function useAnnouncer() {
  const announcerRef = useRef(null);
  
  useEffect(() => {
    // Create live region if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }
    
    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);
  
  const announce = useCallback((message, priority = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);
  
  return announce;
}
