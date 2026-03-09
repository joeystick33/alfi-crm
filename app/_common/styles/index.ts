/**
 * Aura Design System — Unified Entry Point
 *
 * This file serves as the single source of truth for all design tokens.
 * Import from '@/app/_common/styles' instead of individual files.
 *
 * The V2 design system (Tailwind utility classes) is the canonical source.
 * Premium tokens are available for cases requiring raw CSS values.
 */

// ── Primary: Tailwind utility class tokens (use in components) ──
export {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  animations,
  components,
  layouts,
  helpers,
} from './design-system-v2'

export { default as ds } from './design-system-v2'

// ── Secondary: Raw CSS value tokens (use for custom styles, charts, etc.) ──
export {
  colors as rawColors,
  typography as rawTypography,
  spacing as rawSpacing,
  shadows as rawShadows,
  borderRadius as rawBorderRadius,
  animations as rawAnimations,
} from './premium-design-tokens'
