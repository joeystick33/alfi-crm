/**
 * Premium Avatar Component
 * Inspired by Linear, Notion, and N26
 * 
 * Features:
 * - Multiple size variants
 * - Status indicator
 * - Fallback initials with gradient backgrounds
 * - Group stacking
 * - Ring for focus/selection states
 */

'use client'

import * as React from 'react'
import { cn } from '@/app/_common/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { User } from 'lucide-react'

const avatarVariants = cva(
  [
    'relative inline-flex items-center justify-center',
    'rounded-full',
    'overflow-hidden',
    'flex-shrink-0',
    'select-none',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-14 w-14 text-lg',
        '2xl': 'h-16 w-16 text-xl',
      },
      variant: {
        default: 'bg-gray-100',
        primary: 'bg-indigo-100',
        gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

// Gradient backgrounds for initials (deterministic based on name)
const gradients = [
  'from-indigo-400 to-purple-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-teal-500',
  'from-fuchsia-400 to-pink-500',
]

function getGradientFromName(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /** Image source URL */
  src?: string | null
  /** Alt text for image */
  alt?: string
  /** Name for generating initials */
  name?: string
  /** Show status indicator */
  status?: 'online' | 'offline' | 'busy' | 'away'
  /** Show ring around avatar */
  ring?: boolean
  /** Ring color */
  ringColor?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
}

const ringColors = {
  default: 'ring-gray-200',
  primary: 'ring-indigo-200',
  success: 'ring-emerald-200',
  warning: 'ring-amber-200',
  danger: 'ring-rose-200',
}

export function Avatar({
  className,
  size,
  variant,
  src,
  alt,
  name,
  status,
  ring,
  ringColor = 'default',
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  const showImage = src && !imageError
  const initials = name ? getInitials(name) : null
  const gradient = name ? getGradientFromName(name) : null

  // Status indicator size based on avatar size
  const statusSizes = {
    xs: 'h-1.5 w-1.5 border',
    sm: 'h-2 w-2 border',
    md: 'h-2.5 w-2.5 border-2',
    lg: 'h-3 w-3 border-2',
    xl: 'h-3.5 w-3.5 border-2',
    '2xl': 'h-4 w-4 border-2',
  }

  return (
    <div
      className={cn(
        avatarVariants({ size, variant }),
        ring && `ring-2 ring-offset-2 ${ringColors[ringColor]}`,
        showImage ? '' : gradient ? `bg-gradient-to-br ${gradient}` : '',
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <span className="font-semibold text-white">{initials}</span>
      ) : (
        <User className="h-1/2 w-1/2 text-gray-400" />
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusColors[status],
            statusSizes[size || 'md']
          )}
        />
      )}
    </div>
  )
}

/**
 * Avatar group for stacking multiple avatars
 */
export interface AvatarGroupProps {
  children: React.ReactNode
  /** Maximum avatars to show before +N */
  max?: number
  /** Size of avatars */
  size?: AvatarProps['size']
  /** Spacing between avatars */
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

const spacingClasses = {
  tight: '-space-x-3',
  normal: '-space-x-2',
  loose: '-space-x-1',
}

export function AvatarGroup({
  children,
  max = 4,
  size = 'md',
  spacing = 'normal',
  className,
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children)
  const visibleChildren = childArray.slice(0, max)
  const remainingCount = childArray.length - max

  return (
    <div className={cn('flex items-center', spacingClasses[spacing], className)}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className="relative ring-2 ring-white rounded-full"
          style={{ zIndex: visibleChildren.length - index }}
        >
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size })
            : child}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'bg-gray-100 ring-2 ring-white'
          )}
          style={{ zIndex: 0 }}
        >
          <span className="font-medium text-gray-600">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}

export default Avatar
