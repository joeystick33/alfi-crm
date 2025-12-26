/**
 * Design System - Tokens de design centralisés pour Aura
 * 
 * Ce fichier définit les constantes de design pour garantir
 * une cohérence pixel perfect sur tout le CRM.
 * 
 * Inspiré de: Stripe Dashboard, Mercury Bank, Linear, Notion
 */

// =============================================================================
// SPACING - Multiples de 4px (système 4-point grid)
// =============================================================================
export const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// =============================================================================
// TYPOGRAPHY - Tailles et poids de police
// =============================================================================
export const typography = {
  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },
  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// =============================================================================
// COLORS - Palette de couleurs sémantiques
// =============================================================================
export const colors = {
  // Grays (pour texte, bordures, backgrounds)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Primary (bleu Aura)
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // Success (vert)
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  // Warning (ambre)
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  // Error (rouge)
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  // Info (bleu clair)
  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  },
} as const;

// =============================================================================
// BORDER RADIUS - Rayons de bordure
// =============================================================================
export const borderRadius = {
  none: '0',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// =============================================================================
// SHADOWS - Ombres portées
// =============================================================================
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// =============================================================================
// TRANSITIONS - Durées et easings
// =============================================================================
export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// =============================================================================
// Z-INDEX - Couches de superposition
// =============================================================================
export const zIndex = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
} as const;

// =============================================================================
// BREAKPOINTS - Points de rupture responsive
// =============================================================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// COMPONENT TOKENS - Tokens spécifiques aux composants
// =============================================================================
export const componentTokens = {
  // Cards
  card: {
    padding: spacing[6],        // 24px
    borderRadius: borderRadius.lg,
    borderColor: colors.gray[200],
    shadow: shadows.sm,
    hoverShadow: shadows.md,
  },
  // Buttons
  button: {
    heightSm: '32px',
    heightMd: '36px',
    heightLg: '40px',
    paddingX: spacing[4],
    borderRadius: borderRadius.md,
  },
  // Inputs
  input: {
    height: '40px',
    paddingX: spacing[3],
    borderRadius: borderRadius.md,
    borderColor: colors.gray[300],
    focusRing: colors.primary[500],
  },
  // Badges
  badge: {
    paddingX: spacing[2],
    paddingY: spacing[0.5],
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
  },
  // Avatars
  avatar: {
    sizeSm: '32px',
    sizeMd: '40px',
    sizeLg: '48px',
    sizeXl: '64px',
  },
  // Tables
  table: {
    headerBg: colors.gray[50],
    rowHeight: '52px',
    cellPadding: spacing[4],
    borderColor: colors.gray[200],
  },
} as const;

// =============================================================================
// SEMANTIC TOKENS - Tokens sémantiques pour le CRM
// =============================================================================
export const semanticTokens = {
  // Client status
  clientStatus: {
    actif: { bg: colors.success[50], text: colors.success[700], border: colors.success[100] },
    prospect: { bg: colors.info[50], text: colors.info[700], border: colors.info[100] },
    inactif: { bg: colors.gray[100], text: colors.gray[600], border: colors.gray[200] },
    vip: { bg: colors.warning[50], text: colors.warning[700], border: colors.warning[100] },
  },
  // Contract status
  contractStatus: {
    actif: { bg: colors.success[50], text: colors.success[700] },
    en_attente: { bg: colors.warning[50], text: colors.warning[700] },
    suspendu: { bg: colors.warning[50], text: colors.warning[700] },
    cloture: { bg: colors.gray[100], text: colors.gray[600] },
    expire: { bg: colors.error[50], text: colors.error[700] },
  },
  // Alert types
  alertTypes: {
    critical: { bg: colors.error[50], border: colors.error[100], icon: colors.error[600] },
    warning: { bg: colors.warning[50], border: colors.warning[100], icon: colors.warning[600] },
    info: { bg: colors.info[50], border: colors.info[100], icon: colors.info[600] },
    success: { bg: colors.success[50], border: colors.success[100], icon: colors.success[600] },
  },
  // Trend colors
  trends: {
    positive: colors.success[600],
    negative: colors.error[600],
    neutral: colors.gray[500],
  },
} as const;

// =============================================================================
// UTILITY CLASSES - Classes utilitaires prédéfinies
// =============================================================================
export const utilityClasses = {
  // Text styles
  textHeading1: 'text-2xl font-bold text-gray-900',
  textHeading2: 'text-xl font-semibold text-gray-900',
  textHeading3: 'text-lg font-semibold text-gray-900',
  textHeading4: 'text-base font-semibold text-gray-900',
  textBody: 'text-sm text-gray-600',
  textMuted: 'text-sm text-gray-500',
  textCaption: 'text-xs text-gray-400',
  textLabel: 'text-xs font-medium text-gray-500 uppercase tracking-wide',
  
  // Layout
  pageContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  sectionSpacing: 'space-y-6',
  cardGrid: 'grid gap-4 md:grid-cols-2 lg:grid-cols-3',
  
  // Interactive
  clickable: 'cursor-pointer transition-all hover:shadow-md',
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
} as const;
