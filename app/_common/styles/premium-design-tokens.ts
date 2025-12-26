/**
 * Premium Design Tokens
 * Inspired by: Notion, Linear, Stripe, Mercury, Finary, O2S, Revolut, N26
 * 
 * Philosophy:
 * - Notion: Clarity, whitespace, typography hierarchy
 * - Linear: Fluid animations, subtle gradients, keyboard-first
 * - Stripe: Data visualization, professional fintech aesthetic
 * - Mercury: Clean banking UX, trust-inspiring design
 * - Finary: Wealth visualization, modern French fintech
 * - O2S: CGP-focused, professional advisor tools
 * - Revolut/N26: Mobile-first, bold typography, card-centric
 */

// ============================================================================
// COLOR PALETTE - Refined & Professional
// ============================================================================

export const colors = {
  // Neutral Scale (Notion/Linear inspired - warmer grays)
  neutral: {
    0: '#FFFFFF',
    25: '#FCFCFD',
    50: '#F9FAFB',
    100: '#F3F4F6',
    150: '#EBEDF0',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Primary - Deep Indigo (Linear/Stripe inspired)
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Success - Emerald (Mercury/Finary inspired)
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning - Amber
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Danger - Rose
  danger: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },

  // Accent colors for data visualization (Stripe/Finary inspired)
  accent: {
    blue: '#3B82F6',
    cyan: '#06B6D4',
    teal: '#14B8A6',
    violet: '#8B5CF6',
    purple: '#A855F7',
    pink: '#EC4899',
    orange: '#F97316',
  },

  // Semantic wealth colors (Finary inspired)
  wealth: {
    positive: '#10B981',
    negative: '#F43F5E',
    neutral: '#6B7280',
    cash: '#3B82F6',
    stocks: '#8B5CF6',
    bonds: '#06B6D4',
    realEstate: '#F59E0B',
    crypto: '#F97316',
    insurance: '#14B8A6',
  },
} as const

// ============================================================================
// TYPOGRAPHY - Notion/Linear inspired
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    display: '"Cal Sans", Inter, -apple-system, sans-serif',
  },

  // Font sizes with optical sizing
  fontSize: {
    '2xs': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.02em' }],  // 10px
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],          // 12px
    sm: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0' }],          // 13px
    base: ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '-0.006em' }], // 14px
    md: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em' }],    // 15px
    lg: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em' }],         // 16px
    xl: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.014em' }],    // 18px
    '2xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.017em' }], // 20px
    '3xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.019em' }],      // 24px
    '4xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.021em' }], // 30px
    '5xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.022em' }],   // 36px
    '6xl': ['3rem', { lineHeight: '3rem', letterSpacing: '-0.022em' }],        // 48px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

// ============================================================================
// SPACING - 4px base grid
// ============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const

// ============================================================================
// SHADOWS - Layered depth system (Linear/Stripe inspired)
// ============================================================================

export const shadows = {
  // Subtle elevation
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  
  // Standard elevation
  md: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  
  // High elevation
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
  
  // Colored shadows for interactive elements
  primary: '0 4px 14px 0 rgb(79 70 229 / 0.25)',
  success: '0 4px 14px 0 rgb(16 185 129 / 0.25)',
  danger: '0 4px 14px 0 rgb(244 63 94 / 0.25)',
  
  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)',
  
  // Ring focus
  ring: '0 0 0 3px rgb(79 70 229 / 0.15)',
  ringSuccess: '0 0 0 3px rgb(16 185 129 / 0.15)',
  ringDanger: '0 0 0 3px rgb(244 63 94 / 0.15)',
} as const

// ============================================================================
// BORDER RADIUS - Refined corners
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  DEFAULT: '0.375rem', // 6px
  md: '0.5rem',     // 8px
  lg: '0.625rem',   // 10px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const

// ============================================================================
// ANIMATIONS - Linear/Stripe inspired micro-interactions
// ============================================================================

export const animations = {
  // Timing functions
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Durations
  duration: {
    instant: '50ms',
    fast: '100ms',
    normal: '150ms',
    moderate: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },

  // Keyframes
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
    slideUp: {
      from: { transform: 'translateY(4px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      from: { transform: 'translateY(-4px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
    shimmer: {
      from: { backgroundPosition: '-200% 0' },
      to: { backgroundPosition: '200% 0' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
  },
} as const

// ============================================================================
// COMPONENT TOKENS - Premium component styles
// ============================================================================

export const components = {
  // Card styles (Notion/Linear inspired)
  card: {
    base: {
      background: colors.neutral[0],
      border: `1px solid ${colors.neutral[150]}`,
      borderRadius: borderRadius.xl,
      shadow: shadows.sm,
    },
    hover: {
      border: `1px solid ${colors.neutral[200]}`,
      shadow: shadows.md,
    },
    elevated: {
      shadow: shadows.lg,
      border: 'none',
    },
    interactive: {
      cursor: 'pointer',
      transition: `all ${animations.duration.normal} ${animations.easing.default}`,
    },
  },

  // Button styles (Linear inspired)
  button: {
    base: {
      fontWeight: typography.fontWeight.medium,
      borderRadius: borderRadius.lg,
      transition: `all ${animations.duration.fast} ${animations.easing.default}`,
    },
    primary: {
      background: `linear-gradient(180deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
      color: colors.neutral[0],
      shadow: shadows.primary,
      hoverBackground: `linear-gradient(180deg, ${colors.primary[400]} 0%, ${colors.primary[500]} 100%)`,
    },
    secondary: {
      background: colors.neutral[0],
      border: `1px solid ${colors.neutral[200]}`,
      color: colors.neutral[700],
      hoverBackground: colors.neutral[50],
      hoverBorder: `1px solid ${colors.neutral[300]}`,
    },
    ghost: {
      background: 'transparent',
      color: colors.neutral[600],
      hoverBackground: colors.neutral[100],
    },
  },

  // Input styles (Stripe inspired)
  input: {
    base: {
      background: colors.neutral[0],
      border: `1px solid ${colors.neutral[200]}`,
      borderRadius: borderRadius.lg,
      fontSize: typography.fontSize.base[0],
      padding: `${spacing[2.5]} ${spacing[3]}`,
      transition: `all ${animations.duration.fast} ${animations.easing.default}`,
    },
    focus: {
      border: `1px solid ${colors.primary[500]}`,
      shadow: shadows.ring,
    },
    error: {
      border: `1px solid ${colors.danger[500]}`,
      shadow: shadows.ringDanger,
    },
  },

  // Badge styles (Finary/Revolut inspired)
  badge: {
    base: {
      fontWeight: typography.fontWeight.medium,
      fontSize: typography.fontSize.xs[0],
      borderRadius: borderRadius.md,
      padding: `${spacing[0.5]} ${spacing[2]}`,
    },
    variants: {
      default: {
        background: colors.neutral[100],
        color: colors.neutral[700],
      },
      primary: {
        background: colors.primary[50],
        color: colors.primary[700],
      },
      success: {
        background: colors.success[50],
        color: colors.success[700],
      },
      warning: {
        background: colors.warning[50],
        color: colors.warning[700],
      },
      danger: {
        background: colors.danger[50],
        color: colors.danger[700],
      },
    },
  },

  // Avatar styles (N26/Revolut inspired)
  avatar: {
    base: {
      borderRadius: borderRadius.full,
      fontWeight: typography.fontWeight.semibold,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sizes: {
      xs: { size: spacing[6], fontSize: typography.fontSize.xs[0] },
      sm: { size: spacing[8], fontSize: typography.fontSize.sm[0] },
      md: { size: spacing[10], fontSize: typography.fontSize.base[0] },
      lg: { size: spacing[12], fontSize: typography.fontSize.lg[0] },
      xl: { size: spacing[16], fontSize: typography.fontSize.xl[0] },
    },
  },

  // Tab styles (Linear inspired)
  tabs: {
    list: {
      background: colors.neutral[50],
      borderRadius: borderRadius.xl,
      padding: spacing[1],
      gap: spacing[0.5],
    },
    trigger: {
      base: {
        padding: `${spacing[2]} ${spacing[3]}`,
        borderRadius: borderRadius.lg,
        fontWeight: typography.fontWeight.medium,
        fontSize: typography.fontSize.sm[0],
        color: colors.neutral[500],
        transition: `all ${animations.duration.fast} ${animations.easing.default}`,
      },
      hover: {
        color: colors.neutral[700],
        background: colors.neutral[100],
      },
      active: {
        background: colors.neutral[0],
        color: colors.neutral[900],
        shadow: shadows.sm,
      },
    },
  },

  // Table styles (Stripe Dashboard inspired)
  table: {
    header: {
      background: colors.neutral[50],
      borderBottom: `1px solid ${colors.neutral[200]}`,
      fontWeight: typography.fontWeight.medium,
      fontSize: typography.fontSize.xs[0],
      color: colors.neutral[500],
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    row: {
      borderBottom: `1px solid ${colors.neutral[100]}`,
      transition: `background ${animations.duration.fast} ${animations.easing.default}`,
      hoverBackground: colors.neutral[25],
    },
    cell: {
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: typography.fontSize.sm[0],
      color: colors.neutral[700],
    },
  },

  // Stat/KPI card styles (Finary/Mercury inspired)
  stat: {
    container: {
      background: colors.neutral[0],
      borderRadius: borderRadius.xl,
      padding: spacing[5],
      border: `1px solid ${colors.neutral[150]}`,
    },
    label: {
      fontSize: typography.fontSize.xs[0],
      fontWeight: typography.fontWeight.medium,
      color: colors.neutral[500],
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    value: {
      fontSize: typography.fontSize['3xl'][0],
      fontWeight: typography.fontWeight.semibold,
      color: colors.neutral[900],
      letterSpacing: '-0.02em',
    },
    trend: {
      positive: {
        color: colors.success[600],
        background: colors.success[50],
      },
      negative: {
        color: colors.danger[600],
        background: colors.danger[50],
      },
    },
  },

  // Chart styles (Stripe/Finary inspired)
  chart: {
    colors: [
      colors.primary[500],
      colors.accent.teal,
      colors.accent.violet,
      colors.accent.orange,
      colors.accent.pink,
      colors.accent.cyan,
    ],
    grid: {
      stroke: colors.neutral[100],
      strokeDasharray: '4 4',
    },
    axis: {
      fontSize: typography.fontSize.xs[0],
      color: colors.neutral[400],
    },
    tooltip: {
      background: colors.neutral[900],
      color: colors.neutral[0],
      borderRadius: borderRadius.lg,
      shadow: shadows.xl,
    },
  },
} as const

// ============================================================================
// UTILITY CLASSES - Tailwind-compatible class strings
// ============================================================================

export const utilityClasses = {
  // Text styles
  textHeading: 'text-gray-900 font-semibold tracking-tight',
  textBody: 'text-gray-600 leading-relaxed',
  textMuted: 'text-gray-500',
  textLabel: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
  
  // Card styles
  cardBase: 'bg-white border border-gray-100 rounded-xl shadow-sm',
  cardHover: 'hover:border-gray-200 hover:shadow-md transition-all duration-150',
  cardInteractive: 'cursor-pointer hover:border-gray-200 hover:shadow-md transition-all duration-150',
  
  // Button styles
  btnPrimary: 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-sm hover:from-primary-400 hover:to-primary-500 transition-all duration-100',
  btnSecondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-100',
  btnGhost: 'text-gray-600 hover:bg-gray-100 transition-all duration-100',
  
  // Focus ring
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
  
  // Animations
  animateFadeIn: 'animate-in fade-in duration-200',
  animateSlideUp: 'animate-in slide-in-from-bottom-2 duration-200',
  animateScaleIn: 'animate-in zoom-in-95 duration-150',
} as const

export default {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  animations,
  components,
  utilityClasses,
}
