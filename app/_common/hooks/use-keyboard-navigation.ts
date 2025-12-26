'use client'

import { useEffect, useCallback, useRef } from 'react'

/**
 * Hook for managing keyboard navigation in lists and grids
 * Implements roving tabindex pattern for accessibility
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[] | null,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
    onSelect?: (index: number) => void
    onEscape?: () => void
  } = {}
) {
  const { 
    orientation = 'vertical', 
    loop = true, 
    onSelect, 
    onEscape 
  } = options
  
  const currentIndexRef = useRef(0)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!items || items.length === 0) return

    const { key } = event
    let newIndex = currentIndexRef.current

    const isVertical = orientation === 'vertical' || orientation === 'both'
    const isHorizontal = orientation === 'horizontal' || orientation === 'both'

    switch (key) {
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault()
          newIndex = loop 
            ? (currentIndexRef.current + 1) % items.length
            : Math.min(currentIndexRef.current + 1, items.length - 1)
        }
        break
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault()
          newIndex = loop
            ? (currentIndexRef.current - 1 + items.length) % items.length
            : Math.max(currentIndexRef.current - 1, 0)
        }
        break
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault()
          newIndex = loop
            ? (currentIndexRef.current + 1) % items.length
            : Math.min(currentIndexRef.current + 1, items.length - 1)
        }
        break
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault()
          newIndex = loop
            ? (currentIndexRef.current - 1 + items.length) % items.length
            : Math.max(currentIndexRef.current - 1, 0)
        }
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect?.(currentIndexRef.current)
        return
      case 'Escape':
        event.preventDefault()
        onEscape?.()
        return
      default:
        return
    }

    if (newIndex !== currentIndexRef.current) {
      currentIndexRef.current = newIndex
      items[newIndex]?.focus()
    }
  }, [items, orientation, loop, onSelect, onEscape])

  return {
    currentIndex: currentIndexRef.current,
    setCurrentIndex: (index: number) => {
      currentIndexRef.current = index
    },
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: index === currentIndexRef.current ? 0 : -1,
      onKeyDown: handleKeyDown as unknown as React.KeyboardEventHandler,
      onFocus: () => {
        currentIndexRef.current = index
      },
    }),
  }
}

/**
 * Hook to detect keyboard navigation mode
 * Adds 'keyboard-navigation' class to body when user is navigating with keyboard
 */
export function useKeyboardNavigationMode() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation')
      }
    }

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])
}

/**
 * Hook for focus trap within a container (useful for modals)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element when trap becomes active
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, isActive])
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
