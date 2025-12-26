'use client'

/**
 * useClient360Keyboard Hook
 * 
 * Provides keyboard navigation and shortcuts for Client360 tabs.
 * Supports tab navigation, common actions, and accessibility.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 15.5**
 */

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  description: string
  action: () => void
}

interface UseClient360KeyboardOptions {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  shortcuts?: KeyboardShortcut[]
  enabled?: boolean
}

// Default keyboard shortcuts
const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  { key: 'ArrowLeft', alt: true, description: 'Onglet précédent' },
  { key: 'ArrowRight', alt: true, description: 'Onglet suivant' },
  { key: 'Home', alt: true, description: 'Premier onglet' },
  { key: 'End', alt: true, description: 'Dernier onglet' },
  { key: '1', alt: true, description: 'Onglet 1' },
  { key: '2', alt: true, description: 'Onglet 2' },
  { key: '3', alt: true, description: 'Onglet 3' },
  { key: '4', alt: true, description: 'Onglet 4' },
  { key: '5', alt: true, description: 'Onglet 5' },
  { key: '6', alt: true, description: 'Onglet 6' },
  { key: '7', alt: true, description: 'Onglet 7' },
  { key: '8', alt: true, description: 'Onglet 8' },
  { key: '9', alt: true, description: 'Onglet 9' },
  { key: '?', shift: true, description: 'Afficher les raccourcis' },
]


export function useClient360Keyboard({
  tabs,
  activeTab,
  onTabChange,
  shortcuts = [],
  enabled = true,
}: UseClient360KeyboardOptions) {
  const showShortcutsRef = useRef<(() => void) | null>(null)

  // Navigate to previous tab
  const goToPreviousTab = useCallback(() => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1])
    } else {
      // Wrap to last tab
      onTabChange(tabs[tabs.length - 1])
    }
  }, [tabs, activeTab, onTabChange])

  // Navigate to next tab
  const goToNextTab = useCallback(() => {
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1])
    } else {
      // Wrap to first tab
      onTabChange(tabs[0])
    }
  }, [tabs, activeTab, onTabChange])

  // Navigate to first tab
  const goToFirstTab = useCallback(() => {
    onTabChange(tabs[0])
  }, [tabs, onTabChange])

  // Navigate to last tab
  const goToLastTab = useCallback(() => {
    onTabChange(tabs[tabs.length - 1])
  }, [tabs, onTabChange])

  // Navigate to specific tab by number (1-9)
  const goToTabByNumber = useCallback((num: number) => {
    if (num >= 1 && num <= tabs.length) {
      onTabChange(tabs[num - 1])
    }
  }, [tabs, onTabChange])

  // Set the show shortcuts callback
  const setShowShortcuts = useCallback((callback: () => void) => {
    showShortcutsRef.current = callback
  }, [])

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const { key, altKey, ctrlKey, shiftKey, metaKey } = event

      // Tab navigation with Alt + Arrow keys
      if (altKey && !ctrlKey && !metaKey) {
        switch (key) {
          case 'ArrowLeft':
            event.preventDefault()
            goToPreviousTab()
            return
          case 'ArrowRight':
            event.preventDefault()
            goToNextTab()
            return
          case 'Home':
            event.preventDefault()
            goToFirstTab()
            return
          case 'End':
            event.preventDefault()
            goToLastTab()
            return
        }

        // Number keys 1-9 for direct tab access
        const num = parseInt(key, 10)
        if (num >= 1 && num <= 9) {
          event.preventDefault()
          goToTabByNumber(num)
          return
        }
      }

      // Show shortcuts with Shift + ?
      if (shiftKey && key === '?') {
        event.preventDefault()
        showShortcutsRef.current?.()
        return
      }

      // Custom shortcuts
      for (const shortcut of shortcuts) {
        const matches =
          shortcut.key.toLowerCase() === key.toLowerCase() &&
          !!shortcut.ctrl === ctrlKey &&
          !!shortcut.alt === altKey &&
          !!shortcut.shift === shiftKey &&
          !!shortcut.meta === metaKey

        if (matches) {
          event.preventDefault()
          shortcut.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enabled,
    goToPreviousTab,
    goToNextTab,
    goToFirstTab,
    goToLastTab,
    goToTabByNumber,
    shortcuts,
  ])

  return {
    goToPreviousTab,
    goToNextTab,
    goToFirstTab,
    goToLastTab,
    goToTabByNumber,
    setShowShortcuts,
    shortcuts: DEFAULT_SHORTCUTS,
  }
}

/**
 * Get all available keyboard shortcuts for display
 */
export function getKeyboardShortcuts(tabLabels: string[]): { key: string; description: string }[] {
  const shortcuts = [
    { key: 'Alt + ←', description: 'Onglet précédent' },
    { key: 'Alt + →', description: 'Onglet suivant' },
    { key: 'Alt + Home', description: 'Premier onglet' },
    { key: 'Alt + End', description: 'Dernier onglet' },
    { key: 'Shift + ?', description: 'Afficher les raccourcis' },
  ]

  // Add numbered shortcuts for first 9 tabs
  tabLabels.slice(0, 9).forEach((label, index) => {
    shortcuts.push({
      key: `Alt + ${index + 1}`,
      description: label,
    })
  })

  return shortcuts
}

export default useClient360Keyboard
