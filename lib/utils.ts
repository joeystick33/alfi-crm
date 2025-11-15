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
 * Formater une date
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const formats = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' } as const,
    long: { day: 'numeric', month: 'long', year: 'numeric' } as const,
    time: { hour: '2-digit', minute: '2-digit' } as const
  };
  
  return new Intl.DateTimeFormat('fr-FR', formats[format]).format(new Date(date));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
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
export function getInitials(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return firstName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
export function formatPercentage(value: number, decimals = 1): string {
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
