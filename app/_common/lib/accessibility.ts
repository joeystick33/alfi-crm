const baseFocus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

export const focusRing = {
  default: `${baseFocus} focus-visible:ring-primary-500 focus-visible:ring-offset-background`,
  subtle: `${baseFocus} focus-visible:ring-primary-300 focus-visible:ring-offset-transparent`,
  contrast: `${baseFocus} focus-visible:ring-white/80 focus-visible:ring-offset-black/40`,
}

/**
 * ARIA live region announcements
 */
export const ariaLive = {
  polite: 'aria-live="polite" aria-atomic="true"',
  assertive: 'aria-live="assertive" aria-atomic="true"',
}

/**
 * Common ARIA labels for French UI
 */
export const ariaLabels = {
  // Navigation
  mainNavigation: 'Navigation principale',
  breadcrumb: 'Fil d\'Ariane',
  pagination: 'Pagination',
  
  // Actions
  close: 'Fermer',
  open: 'Ouvrir',
  expand: 'Développer',
  collapse: 'Réduire',
  search: 'Rechercher',
  filter: 'Filtrer',
  sort: 'Trier',
  delete: 'Supprimer',
  edit: 'Modifier',
  save: 'Enregistrer',
  cancel: 'Annuler',
  confirm: 'Confirmer',
  
  // Status
  loading: 'Chargement en cours',
  error: 'Erreur',
  success: 'Succès',
  warning: 'Avertissement',
  info: 'Information',
  
  // Tables
  sortAscending: 'Trier par ordre croissant',
  sortDescending: 'Trier par ordre décroissant',
  selectRow: 'Sélectionner la ligne',
  selectAll: 'Tout sélectionner',
  
  // Forms
  required: 'Champ obligatoire',
  optional: 'Champ optionnel',
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
}

/**
 * Generate accessible description for form fields
 */
export function getFieldDescription(
  label: string,
  options: {
    required?: boolean
    error?: string
    hint?: string
  } = {}
): string {
  const parts: string[] = []
  
  if (options.required) {
    parts.push('Champ obligatoire')
  }
  
  if (options.hint) {
    parts.push(options.hint)
  }
  
  if (options.error) {
    parts.push(`Erreur: ${options.error}`)
  }
  
  return parts.join('. ')
}

/**
 * Generate accessible label for buttons with icons
 */
export function getIconButtonLabel(action: string, target?: string): string {
  return target ? `${action} ${target}` : action
}

/**
 * Screen reader only class
 */
export const srOnly = 'sr-only'

/**
 * Focus visible class for keyboard navigation
 */
export const focusVisible = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

export default focusRing
