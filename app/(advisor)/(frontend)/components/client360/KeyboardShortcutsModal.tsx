'use client'

/**
 * KeyboardShortcutsModal Component
 * 
 * Displays available keyboard shortcuts for Client360 navigation.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 15.5**
 */

import { useEffect, useCallback } from 'react'
import { X, Keyboard } from 'lucide-react'
import { Button } from '@/app/_common/components/ui/Button'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  tabLabels: string[]
}

export function KeyboardShortcutsModal({ isOpen, onClose, tabLabels }: KeyboardShortcutsModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const navigationShortcuts = [
    { key: 'Alt + ←', description: 'Onglet précédent' },
    { key: 'Alt + →', description: 'Onglet suivant' },
    { key: 'Alt + Home', description: 'Premier onglet' },
    { key: 'Alt + End', description: 'Dernier onglet' },
  ]

  const tabShortcuts = tabLabels.slice(0, 9).map((label, index) => ({
    key: `Alt + ${index + 1}`,
    description: label,
  }))

  const generalShortcuts = [
    { key: 'Shift + ?', description: 'Afficher cette aide' },
    { key: 'Escape', description: 'Fermer les modales' },
  ]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Raccourcis clavier</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Navigation</h3>
            <div className="space-y-2">
              {navigationShortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.key} {...shortcut} />
              ))}
            </div>
          </div>

          {/* Tab Access */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Accès direct aux onglets</h3>
            <div className="grid grid-cols-2 gap-2">
              {tabShortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.key} {...shortcut} compact />
              ))}
            </div>
          </div>

          {/* General */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Général</h3>
            <div className="space-y-2">
              {generalShortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.key} {...shortcut} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Escape</kbd> pour fermer
          </p>
        </div>
      </div>
    </div>
  )
}

function ShortcutRow({ 
  key: shortcutKey, 
  description, 
  compact = false 
}: { 
  key: string
  description: string
  compact?: boolean 
}) {
  return (
    <div className={`flex items-center justify-between ${compact ? 'py-1' : 'py-2'}`}>
      <span className={`text-foreground ${compact ? 'text-sm' : ''}`}>{description}</span>
      <kbd className={`px-2 py-1 bg-muted border rounded font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
        {shortcutKey}
      </kbd>
    </div>
  )
}

export default KeyboardShortcutsModal
