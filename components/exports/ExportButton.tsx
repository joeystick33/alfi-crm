'use client'

import * as React from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface ExportButtonProps {
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  loading?: boolean
  children?: React.ReactNode
}

/**
 * Bouton d'export simple qui ouvre le modal d'export
 */
export function ExportButton({
  onClick,
  variant = 'outline',
  size = 'md',
  className,
  disabled,
  loading,
  children = 'Exporter',
}: ExportButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className={cn('gap-2', className)}
    >
      <Download className="h-4 w-4" />
      {children}
    </Button>
  )
}
