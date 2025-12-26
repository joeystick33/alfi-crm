'use client'

import * as React from 'react'
import { cn } from '@/app/_common/lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Skip link component for keyboard navigation accessibility
 * Allows users to skip to main content
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white',
        'focus:rounded-md focus:shadow-lg focus:outline-none',
        'focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Main content landmark for skip link target
 */
export function MainContent({ 
  children, 
  id = 'main-content',
  className 
}: { 
  children: React.ReactNode
  id?: string
  className?: string 
}) {
  return (
    <main 
      id={id} 
      tabIndex={-1}
      className={cn('outline-none', className)}
      role="main"
      aria-label="Contenu principal"
    >
      {children}
    </main>
  )
}
