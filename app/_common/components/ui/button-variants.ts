/**
 * Premium Button Variants
 * Inspired by Linear, Stripe, and Vercel
 * 
 * Features:
 * - Subtle gradients for primary actions
 * - Refined shadows and hover states
 * - Smooth 150ms transitions
 * - Proper focus rings
 */

import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
    // Base styles - refined typography and transitions
    [
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
        'text-sm font-medium leading-none',
        'rounded-lg',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'select-none',
    ],
    {
        variants: {
            variant: {
                // Primary - Gradient with glow (Linear-style)
                default: [
                    'bg-gradient-to-b from-gray-800 to-gray-900',
                    'text-white',
                    'shadow-sm shadow-gray-900/10',
                    'hover:from-gray-700 hover:to-gray-800',
                    'active:from-gray-900 active:to-gray-950',
                    'focus-visible:ring-gray-400',
                ],
                primary: [
                    'bg-gradient-to-b from-[#7373FF] to-[#5c5ce6]',
                    'text-white',
                    'shadow-sm shadow-[#7373FF]/25',
                    'hover:from-[#8b8bff] hover:to-[#7373FF] hover:shadow-md hover:shadow-[#7373FF]/30',
                    'active:from-[#5c5ce6] active:to-[#4a4abf]',
                    'focus-visible:ring-[#7373FF]',
                ],

                // Secondary - Subtle background
                secondary: [
                    'bg-[hsl(var(--secondary))]',
                    'text-[hsl(var(--secondary-foreground))]',
                    'hover:bg-[hsl(var(--secondary))]/80',
                    'active:bg-[hsl(var(--secondary))]/60',
                    'focus-visible:ring-[hsl(var(--ring))]',
                ],

                // Outline - Clean border
                outline: [
                    'border border-[hsl(var(--border))]',
                    'bg-transparent',
                    'text-[hsl(var(--foreground))]',
                    'shadow-sm',
                    'hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                    'active:bg-[hsl(var(--muted))]/80',
                    'focus-visible:ring-[hsl(var(--ring))]',
                ],

                // Ghost - Minimal
                ghost: [
                    'text-[hsl(var(--foreground))]',
                    'hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                    'active:bg-[hsl(var(--muted))]/80',
                    'focus-visible:ring-[hsl(var(--ring))]',
                ],

                // Destructive - Danger actions
                destructive: [
                    'bg-gradient-to-b from-rose-500 to-rose-600',
                    'text-white',
                    'shadow-sm shadow-rose-500/25',
                    'hover:from-rose-400 hover:to-rose-500 hover:shadow-md hover:shadow-rose-500/30',
                    'active:from-rose-600 active:to-rose-700',
                    'focus-visible:ring-rose-400',
                ],
                error: [
                    'bg-gradient-to-b from-rose-500 to-rose-600',
                    'text-white',
                    'shadow-sm shadow-rose-500/25',
                    'hover:from-rose-400 hover:to-rose-500',
                    'focus-visible:ring-rose-400',
                ],

                // Success - Positive actions
                success: [
                    'bg-gradient-to-b from-emerald-500 to-emerald-600',
                    'text-white',
                    'shadow-sm shadow-emerald-500/25',
                    'hover:from-emerald-400 hover:to-emerald-500 hover:shadow-md hover:shadow-emerald-500/30',
                    'active:from-emerald-600 active:to-emerald-700',
                    'focus-visible:ring-emerald-400',
                ],

                // Warning
                warning: [
                    'bg-gradient-to-b from-amber-500 to-amber-600',
                    'text-white',
                    'shadow-sm shadow-amber-500/25',
                    'hover:from-amber-400 hover:to-amber-500',
                    'focus-visible:ring-amber-400',
                ],

                // Link - Text only
                link: [
                    'text-[#7373FF]',
                    'underline-offset-4',
                    'hover:text-[#5c5ce6] hover:underline',
                    'focus-visible:ring-[#7373FF]',
                ],

                // Soft variants for subtle actions
                'soft-primary': [
                    'bg-[#7373FF]/10',
                    'text-[#5c5ce6]',
                    'hover:bg-[#7373FF]/15',
                    'active:bg-[#7373FF]/20',
                    'focus-visible:ring-[#7373FF]',
                ],
                'soft-success': [
                    'bg-emerald-50',
                    'text-emerald-700',
                    'hover:bg-emerald-100',
                    'active:bg-emerald-200',
                    'focus-visible:ring-emerald-400',
                ],
                'soft-danger': [
                    'bg-rose-50',
                    'text-rose-700',
                    'hover:bg-rose-100',
                    'active:bg-rose-200',
                    'focus-visible:ring-rose-400',
                ],
            },
            size: {
                xs: 'h-7 px-2.5 text-xs rounded-md',
                sm: 'h-8 px-3 text-xs',
                md: 'h-9 px-4',
                lg: 'h-10 px-5',
                xl: 'h-11 px-6 text-base',
                '2xl': 'h-12 px-8 text-base',
                icon: 'h-9 w-9 p-0',
                'icon-sm': 'h-8 w-8 p-0',
                'icon-lg': 'h-10 w-10 p-0',
            },
            fullWidth: {
                true: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            fullWidth: false,
        },
    }
)
