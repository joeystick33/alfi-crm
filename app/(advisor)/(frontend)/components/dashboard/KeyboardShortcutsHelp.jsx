'use client';

import { useState, useEffect } from 'react';
import { X, Keyboard, Zap, Plus, Navigation } from 'lucide-react';
import { cn } from '@/app/_common/lib/utils';
import { getShortcutsByCategory } from '@/app/_common/hooks/useKeyboardShortcuts';

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  const [shortcuts, setShortcuts] = useState({});

  useEffect(() => {
    setShortcuts(getShortcutsByCategory());
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categoryIcons = {
    'Navigation': Navigation,
    'Création': Plus,
    'Global': Zap
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-10 bottom-10 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-3xl z-50 animate-in slide-in-from-bottom duration-300">
        <div className="h-full bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Keyboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Raccourcis clavier
                </h2>
                <p className="text-sm text-gray-600">
                  Gagnez du temps avec ces raccourcis
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {Object.entries(shortcuts).map(([category, items]) => {
                const Icon = categoryIcons[category] || Keyboard;
                
                return (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-gray-100 rounded">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category}
                      </h3>
                    </div>

                    {/* Shortcuts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                        >
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {item.name}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {item.shortcut.split(' + ').map((key, keyIndex) => (
                              <span key={keyIndex} className="flex items-center gap-1">
                                {keyIndex > 0 && (
                                  <span className="text-gray-400 text-xs">+</span>
                                )}
                                <kbd className={cn(
                                  'px-2 py-1 text-xs font-mono rounded border',
                                  'bg-white',
                                  'border-gray-300',
                                  'text-gray-700',
                                  'shadow-sm',
                                  'group-hover:border-blue-400',
                                  'transition-colors'
                                )}>
                                  {key}
                                </kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tips Section */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Astuces
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Les raccourcis avec <kbd className="px-1 py-0.5 bg-white rounded text-xs">G</kbd> sont pour la navigation</li>
                <li>• Les raccourcis avec <kbd className="px-1 py-0.5 bg-white rounded text-xs">N</kbd> sont pour créer de nouveaux éléments</li>
                <li>• Appuyez sur <kbd className="px-1 py-0.5 bg-white rounded text-xs">?</kbd> n'importe où pour afficher cette aide</li>
                <li>• Les raccourcis ne fonctionnent pas dans les champs de saisie</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Appuyez sur <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300 text-xs">ESC</kbd> pour fermer
              </p>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Compris !
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to manage keyboard shortcuts help modal
 */
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Show help on ? key
      if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
}

/**
 * Keyboard shortcut hint component
 */
export function ShortcutHint({ shortcut, className }) {
  return (
    <kbd className={cn(
      'inline-flex items-center gap-1 px-2 py-1 text-xs font-mono',
      'bg-gray-100 rounded border border-gray-300',
      'text-gray-600',
      className
    )}>
      {shortcut.split('+').map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-gray-400">+</span>}
          <span>{key.trim()}</span>
        </span>
      ))}
    </kbd>
  );
}
