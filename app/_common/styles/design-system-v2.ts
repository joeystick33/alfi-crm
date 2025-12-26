/**
 * Design System V2 - Aura CRM
 * 
 * Tokens unifiés pour une expérience cohérente
 * Optimisé pour les CGP (lisibilité, densité d'information, actions rapides)
 */

// =============================================================================
// COULEURS
// =============================================================================

export const colors = {
  // Primaires
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Indigo principal
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Succès / Positif
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Emerald principal
    600: '#059669',
    700: '#047857',
  },
  
  // Avertissement
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Amber principal
    600: '#d97706',
    700: '#b45309',
  },
  
  // Erreur / Négatif
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Red principal
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  // Neutres
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Catégories Patrimoine (cohérentes dans toute l'app)
  patrimoine: {
    immobilier: '#6366f1',     // Indigo
    financier: '#10b981',      // Emerald
    professionnel: '#8b5cf6',  // Violet
    autres: '#f59e0b',         // Amber
    passifs: '#ef4444',        // Red
    liquidites: '#06b6d4',     // Cyan
  },
} as const

// =============================================================================
// ESPACEMENTS
// =============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
} as const

// =============================================================================
// TYPOGRAPHIE
// =============================================================================

export const typography = {
  // Titres
  h1: 'text-2xl font-bold tracking-tight text-gray-900',
  h2: 'text-xl font-semibold tracking-tight text-gray-900',
  h3: 'text-lg font-semibold text-gray-900',
  h4: 'text-base font-medium text-gray-900',
  
  // Corps
  body: 'text-sm text-gray-600',
  bodyLarge: 'text-base text-gray-600',
  bodySmall: 'text-xs text-gray-500',
  
  // Données financières (monospace pour alignement)
  money: 'font-mono tabular-nums text-gray-900',
  moneyLarge: 'text-2xl font-bold font-mono tabular-nums text-gray-900',
  percentage: 'font-mono tabular-nums',
  
  // Labels
  label: 'text-sm font-medium text-gray-700',
  labelSmall: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
} as const

// =============================================================================
// OMBRES
// =============================================================================

export const shadows = {
  sm: 'shadow-sm',
  DEFAULT: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  
  // Ombres colorées pour les cartes premium
  primary: 'shadow-lg shadow-indigo-500/10',
  success: 'shadow-lg shadow-emerald-500/10',
  warning: 'shadow-lg shadow-amber-500/10',
  error: 'shadow-lg shadow-red-500/10',
} as const

// =============================================================================
// BORDURES & ARRONDIS
// =============================================================================

export const borders = {
  radius: {
    sm: 'rounded-md',
    DEFAULT: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },
  
  colors: {
    light: 'border-gray-100',
    DEFAULT: 'border-gray-200',
    dark: 'border-gray-300',
    primary: 'border-indigo-200',
  },
} as const

// =============================================================================
// ANIMATIONS
// =============================================================================

export const animations = {
  fast: 'transition-all duration-150 ease-out',
  DEFAULT: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  
  hover: {
    lift: 'hover:-translate-y-0.5 hover:shadow-md',
    scale: 'hover:scale-[1.02]',
    glow: 'hover:shadow-lg hover:shadow-indigo-500/20',
  },
} as const

// =============================================================================
// COMPOSANTS - STYLES PRÉDÉFINIS
// =============================================================================

export const components = {
  // Cards
  card: {
    base: 'bg-white rounded-xl border border-gray-200/60 shadow-sm',
    hover: 'hover:shadow-md hover:border-gray-300/60 transition-all duration-200',
    interactive: 'cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200',
    premium: 'bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200/60 shadow-lg',
  },
  
  // KPI Cards
  kpi: {
    container: 'flex flex-col gap-1 p-4 bg-white rounded-xl border border-gray-200/60',
    label: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
    value: 'text-2xl font-bold font-mono tabular-nums text-gray-900',
    change: {
      positive: 'text-emerald-600 text-sm font-medium',
      negative: 'text-red-600 text-sm font-medium',
      neutral: 'text-gray-500 text-sm font-medium',
    },
  },
  
  // Badges
  badge: {
    base: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  },
  
  // Buttons
  button: {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition-colors',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg px-4 py-2 border border-gray-300 transition-colors',
    ghost: 'hover:bg-gray-100 text-gray-600 font-medium rounded-lg px-4 py-2 transition-colors',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 transition-colors',
  },
  
  // Inputs
  input: {
    base: 'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow',
    error: 'border-red-300 focus:ring-red-500',
  },
  
  // Tables
  table: {
    container: 'overflow-hidden rounded-xl border border-gray-200',
    header: 'bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider',
    row: 'border-b border-gray-100 hover:bg-gray-50 transition-colors',
    cell: 'px-4 py-3 text-sm text-gray-900',
  },
} as const

// =============================================================================
// LAYOUTS
// =============================================================================

export const layouts = {
  // Page
  page: {
    container: 'max-w-[1600px] mx-auto px-6 py-6',
    header: 'flex items-center justify-between mb-6',
    content: 'space-y-6',
  },
  
  // Grids
  grid: {
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    auto: 'grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4',
  },
  
  // Flex
  flex: {
    between: 'flex items-center justify-between',
    center: 'flex items-center justify-center',
    start: 'flex items-center gap-3',
    col: 'flex flex-col gap-4',
  },
} as const

// =============================================================================
// HELPERS
// =============================================================================

export const helpers = {
  // Format monétaire
  formatMoney: (value: number, compact = false) => {
    if (compact && Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`
    }
    if (compact && Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  },
  
  // Format pourcentage
  formatPercent: (value: number, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`
  },
  
  // Couleur selon variation
  getChangeColor: (value: number) => {
    if (value > 0) return 'text-emerald-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-500'
  },
  
  // Icône selon variation
  getChangeIcon: (value: number) => {
    if (value > 0) return '↑'
    if (value < 0) return '↓'
    return '→'
  },
}

export default {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  animations,
  components,
  layouts,
  helpers,
}
