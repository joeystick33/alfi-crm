'use client'

/**
 * Premium Tabs Component
 * Inspired by Linear's tab navigation - clean, minimal, with subtle animations
 */

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/app/_common/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: 'default' | 'pills' | 'underline'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center',
      variant === 'default' && 'gap-1 p-1 bg-gray-50/80 rounded-xl border border-gray-100',
      variant === 'pills' && 'gap-2',
      variant === 'underline' && 'gap-6 border-b border-gray-200',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: 'default' | 'pills' | 'underline'
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium',
      'transition-all duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus-visible:ring-offset-0',
      'disabled:pointer-events-none disabled:opacity-50',
      
      // Default variant (Linear-style pills in container)
      variant === 'default' && [
        'px-3.5 py-2 rounded-lg',
        'text-gray-500',
        'hover:text-gray-700 hover:bg-white/60',
        'data-[state=active]:bg-white data-[state=active]:text-gray-900',
        'data-[state=active]:shadow-sm data-[state=active]:shadow-gray-200/50',
      ],
      
      // Pills variant (standalone pills)
      variant === 'pills' && [
        'px-4 py-2 rounded-full',
        'text-gray-500 bg-transparent',
        'hover:text-gray-700 hover:bg-gray-100',
        'data-[state=active]:bg-gray-900 data-[state=active]:text-white',
      ],
      
      // Underline variant (Notion-style)
      variant === 'underline' && [
        'px-1 py-3 relative',
        'text-gray-500',
        'hover:text-gray-900',
        'data-[state=active]:text-gray-900',
        // Animated underline
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
        'after:bg-gray-900 after:scale-x-0 after:origin-left',
        'after:transition-transform after:duration-200 after:ease-out',
        'data-[state=active]:after:scale-x-100',
      ],
      
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4',
      'focus-visible:outline-none',
      // Subtle fade-in animation
      'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1',
      'data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0',
      'duration-200 ease-out',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
