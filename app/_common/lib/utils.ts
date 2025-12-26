import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaire pour merger les classes Tailwind
 * Évite les conflits de classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formater un montant en euros
 */
export function formatCurrency(amount: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Format currency for chart tooltips with edge case handling
 * Handles null, undefined, NaN, and formats as French currency (e.g., "1 234,56 €")
 * 
 * **Validates: Requirements 7.5**
 * WHEN hovering over chart elements THEN the System SHALL display formatted tooltips with currency values
 * 
 * @param value - The numeric value to format (can be null, undefined, or number)
 * @param locale - The locale to use for formatting (defaults to 'fr-FR')
 * @returns Formatted currency string in French format
 */
export function formatCurrencyForTooltip(
  value: number | null | undefined,
  locale = 'fr-FR'
): string {
  // Handle null, undefined, NaN, and non-finite numbers
  // Use 0 as fallback and let the formatter handle it consistently
  const safeValue = (value === null || value === undefined || !Number.isFinite(value)) ? 0 : value;
  
  // Format the number using French locale
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeValue);
}

/**
 * Formater une date
 */
export function formatDate(date: Date | string | null | undefined, format: 'short' | 'long' | 'time' = 'short'): string {
  // Gérer les valeurs nulles/undefined
  if (!date) {
    return '-';
  }
  
  const formats = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' } as const,
    long: { day: 'numeric', month: 'long', year: 'numeric' } as const,
    time: { hour: '2-digit', minute: '2-digit' } as const
  };
  
  try {
    const dateObj = new Date(date);
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    return new Intl.DateTimeFormat('fr-FR', formats[format]).format(dateObj);
  } catch {
    return '-';
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Générer des initiales à partir d'un nom
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  // Valeur par défaut si aucun nom n'est fourni
  if (!firstName && !lastName) {
    return '??';
  }
  
  // Si on a les deux noms
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  
  // Si on a seulement le prénom
  if (firstName) {
    return firstName
      .split(' ')
      .map(word => word[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  // Si on a seulement le nom de famille
  if (lastName) {
    return lastName
      .split(' ')
      .map(word => word[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  return '??';
}

/**
 * Tronquer un texte
 */
export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Formater un pourcentage
 */
export function formatPercentage(value?: number | null, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formater un nombre avec séparateurs
 */
export function formatNumber(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Calculer la différence en jours entre deux dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Vérifier si une date est dans le passé
 */
export function isPast(date: Date | string): boolean {
  return new Date(date) < new Date();
}

/**
 * Obtenir le temps relatif (il y a X minutes/heures/jours)
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'À l\'instant';
  } else if (diffMin < 60) {
    return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  } else if (diffHour < 24) {
    return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  } else if (diffDay < 7) {
    return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
  } else if (diffWeek < 4) {
    return `Il y a ${diffWeek} semaine${diffWeek > 1 ? 's' : ''}`;
  } else if (diffMonth < 12) {
    return `Il y a ${diffMonth} mois`;
  } else {
    return `Il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`;
  }
}

/**
 * Vérifier si une date est dans le futur
 */
export function isFuture(date: Date | string): boolean {
  return new Date(date) > new Date();
}

/**
 * Capitaliser la première lettre
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Générer un ID aléatoire
 */
export function generateId(prefix = ''): string {
  const random = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${random}` : random;
}
