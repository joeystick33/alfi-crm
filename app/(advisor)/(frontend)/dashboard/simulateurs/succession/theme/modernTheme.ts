import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * 🎨 MODERN THEME 2025 — Chakra v3 System
 * 
 * Design system moderne avec:
 * - Palette contemporaine (brand, accent, success, neutral)
 * - Typography scale
 */

const smpConfig = defineConfig({
  preflight: false,
  cssVarsRoot: '.smp-simulator',
  globalCss: {},
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#f0f4f8' },
          100: { value: '#d9e2ec' },
          200: { value: '#b0c4de' },
          300: { value: '#7a9cc6' },
          400: { value: '#4a7ba7' },
          500: { value: '#1e3a5f' },
          600: { value: '#18304f' },
          700: { value: '#12263f' },
          800: { value: '#0c1c2f' },
          900: { value: '#0a1628' },
        },
        accent: {
          50: { value: '#fefdf8' },
          100: { value: '#fef9e7' },
          200: { value: '#fef0c7' },
          300: { value: '#f8e5a0' },
          400: { value: '#e8d078' },
          500: { value: '#d4af37' },
          600: { value: '#b8972f' },
          700: { value: '#9c7f27' },
          800: { value: '#80671f' },
          900: { value: '#64501a' },
        },
        success: {
          50: { value: '#f0f9f4' },
          100: { value: '#d1f0df' },
          200: { value: '#a7e1bf' },
          300: { value: '#6fc99f' },
          400: { value: '#4caf7f' },
          500: { value: '#2d8659' },
          600: { value: '#256f4a' },
          700: { value: '#1d583b' },
          800: { value: '#15412c' },
          900: { value: '#0d2a1d' },
        },
        neutral: {
          50: { value: '#fafafa' },
          100: { value: '#f5f5f5' },
          200: { value: '#e5e5e5' },
          300: { value: '#d4d4d4' },
          400: { value: '#a3a3a3' },
          500: { value: '#737373' },
          600: { value: '#525252' },
          700: { value: '#404040' },
          800: { value: '#262626' },
          900: { value: '#171717' },
        },
      },
      fonts: {
        heading: { value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
        body: { value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
      },
    },
  },
});

const modernTheme = createSystem(defaultConfig, smpConfig);

export default modernTheme;