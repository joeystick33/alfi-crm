import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaire pour merger les classes Tailwind
 * Évite les conflits de classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formater un montant en euros
 */
export function formatCurrency(amount, locale = 'fr-FR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Formater une date
 */
export function formatDate(date, format = 'short') {
  const formats = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' }
  };
  
  return new Intl.DateTimeFormat('fr-FR', formats[format]).format(new Date(date));
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
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
export function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Tronquer un texte
 */
export function truncate(text, length = 50) {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}
