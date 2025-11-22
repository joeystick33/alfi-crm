'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Keyboard shortcuts configuration
 */
export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  search: { keys: ['cmd+k', 'ctrl+k'], description: 'Recherche globale' },
  commandPalette: { keys: ['cmd+p', 'ctrl+p'], description: 'Palette de commandes' },
  newAction: { keys: ['cmd+n', 'ctrl+n'], description: 'Nouvelle action' },
  
  // Navigation shortcuts (G + key)
  goHome: { keys: ['g+h'], description: 'Aller au tableau de bord' },
  goClients: { keys: ['g+c'], description: 'Aller aux clients' },
  goCalendar: { keys: ['g+a'], description: 'Aller à l\'agenda' },
  goTasks: { keys: ['g+t'], description: 'Aller aux tâches' },
  goDocuments: { keys: ['g+d'], description: 'Aller aux documents' },
  goEmails: { keys: ['g+e'], description: 'Aller aux emails' },
  goOpportunities: { keys: ['g+o'], description: 'Aller aux opportunités' },
  goActivity: { keys: ['g+m'], description: 'Aller à mon activité' },
  goSettings: { keys: ['g+s'], description: 'Aller aux paramètres' },
  
  // Create shortcuts (N + key)
  newClient: { keys: ['n+c'], description: 'Nouveau client' },
  newProspect: { keys: ['n+p'], description: 'Nouveau prospect' },
  newAppointment: { keys: ['n+r'], description: 'Nouveau rendez-vous' },
  newTask: { keys: ['n+t'], description: 'Nouvelle tâche' },
  newDocument: { keys: ['n+d'], description: 'Nouveau document' },
  newOpportunity: { keys: ['n+o'], description: 'Nouvelle opportunité' },
  newProject: { keys: ['n+f'], description: 'Nouveau dossier' },
  newEmail: { keys: ['n+e'], description: 'Nouvel email' },
  
  // UI shortcuts
  toggleSidebar: { keys: ['cmd+b', 'ctrl+b'], description: 'Basculer la sidebar' },
  toggleTheme: { keys: ['cmd+shift+l', 'ctrl+shift+l'], description: 'Changer le thème' },
  presentationMode: { keys: ['cmd+h', 'ctrl+h'], description: 'Mode présentation' },
  
  // Help
  showHelp: { keys: ['?'], description: 'Afficher l\'aide' }
};

/**
 * Hook to register and handle keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
  const router = useRouter();
  const { enabled = true, preventDefault = true } = options;
  const sequenceRef = useRef({ key: null, timeout: null });

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Ignore shortcuts when typing in inputs
    const target = event.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Build shortcut string
    let shortcut = '';
    if (ctrl) shortcut += 'ctrl+';
    if (shift) shortcut += 'shift+';
    if (alt) shortcut += 'alt+';
    shortcut += key;

    // Check for sequence shortcuts (e.g., g+c)
    if (sequenceRef.current.key) {
      const sequenceShortcut = `${sequenceRef.current.key}+${key}`;
      
      // Clear timeout
      if (sequenceRef.current.timeout) {
        clearTimeout(sequenceRef.current.timeout);
      }
      
      // Reset sequence
      sequenceRef.current = { key: null, timeout: null };
      
      // Execute shortcut if registered
      if (shortcuts[sequenceShortcut]) {
        if (preventDefault) event.preventDefault();
        shortcuts[sequenceShortcut]();
        return;
      }
    }

    // Check if this is the start of a sequence (g or n key)
    if ((key === 'g' || key === 'n') && !ctrl && !shift && !alt) {
      sequenceRef.current.key = key;
      
      // Set timeout to reset sequence after 1 second
      sequenceRef.current.timeout = setTimeout(() => {
        sequenceRef.current = { key: null, timeout: null };
      }, 1000);
      
      return;
    }

    // Execute shortcut if registered
    if (shortcuts[shortcut]) {
      if (preventDefault) event.preventDefault();
      shortcuts[shortcut]();
    }
  }, [enabled, preventDefault, shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Clear any pending timeout
      if (sequenceRef.current.timeout) {
        clearTimeout(sequenceRef.current.timeout);
      }
    };
  }, [handleKeyDown]);
}

/**
 * Hook to get default navigation shortcuts
 */
export function useNavigationShortcuts() {
  const router = useRouter();

  return {
    'g+h': () => router.push('/dashboard'),
    'g+c': () => router.push('/dashboard/clients'),
    'g+a': () => router.push('/dashboard/agenda'),
    'g+t': () => router.push('/dashboard/taches'),
    'g+d': () => router.push('/dashboard/documents'),
    'g+e': () => router.push('/dashboard/emails'),
    'g+o': () => router.push('/dashboard/opportunites'),
    'g+m': () => router.push('/dashboard/mon-activite'),
    'g+s': () => router.push('/dashboard/settings')
  };
}

/**
 * Hook to get default create shortcuts
 */
export function useCreateShortcuts(callbacks = {}) {
  const router = useRouter();

  return {
    'n+c': callbacks.newClient || (() => router.push('/dashboard/clients/nouveau')),
    'n+p': callbacks.newProspect || (() => router.push('/dashboard/prospects/nouveau')),
    'n+r': callbacks.newAppointment || (() => router.push('/dashboard/agenda/nouveau')),
    'n+t': callbacks.newTask || (() => router.push('/dashboard/taches/nouveau')),
    'n+d': callbacks.newDocument || (() => router.push('/dashboard/documents/upload')),
    'n+o': callbacks.newOpportunity || (() => router.push('/dashboard/opportunites/nouveau')),
    'n+f': callbacks.newProject || (() => router.push('/dashboard/dossiers/nouveau')),
    'n+e': callbacks.newEmail || (() => router.push('/dashboard/emails/compose'))
  };
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut) {
  return shortcut
    .replace('cmd', '⌘')
    .replace('ctrl', 'Ctrl')
    .replace('shift', '⇧')
    .replace('alt', '⌥')
    .replace('+', ' + ')
    .toUpperCase();
}

/**
 * Get all shortcuts grouped by category
 */
export function getShortcutsByCategory() {
  return {
    'Navigation': [
      { name: 'Tableau de bord', shortcut: 'G + H' },
      { name: 'Clients', shortcut: 'G + C' },
      { name: 'Agenda', shortcut: 'G + A' },
      { name: 'Tâches', shortcut: 'G + T' },
      { name: 'Documents', shortcut: 'G + D' },
      { name: 'Emails', shortcut: 'G + E' },
      { name: 'Opportunités', shortcut: 'G + O' },
      { name: 'Mon activité', shortcut: 'G + M' },
      { name: 'Paramètres', shortcut: 'G + S' }
    ],
    'Création': [
      { name: 'Nouveau client', shortcut: 'N + C' },
      { name: 'Nouveau prospect', shortcut: 'N + P' },
      { name: 'Nouveau rendez-vous', shortcut: 'N + R' },
      { name: 'Nouvelle tâche', shortcut: 'N + T' },
      { name: 'Nouveau document', shortcut: 'N + D' },
      { name: 'Nouvelle opportunité', shortcut: 'N + O' },
      { name: 'Nouveau dossier', shortcut: 'N + F' },
      { name: 'Nouvel email', shortcut: 'N + E' }
    ],
    'Global': [
      { name: 'Recherche globale', shortcut: '⌘ + K' },
      { name: 'Palette de commandes', shortcut: '⌘ + P' },
      { name: 'Nouvelle action', shortcut: '⌘ + N' },
      { name: 'Basculer sidebar', shortcut: '⌘ + B' },
      { name: 'Mode présentation', shortcut: '⌘ + H' },
      { name: 'Afficher l\'aide', shortcut: '?' }
    ]
  };
}
