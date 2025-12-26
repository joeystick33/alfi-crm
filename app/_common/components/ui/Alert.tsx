'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/app/_common/lib/utils'

import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive [&>svg]:text-destructive',
        error:
          'bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-600',
        success:
          'bg-green-50 border-green-200 text-green-900 [&>svg]:text-green-600',
        warning:
          'bg-yellow-50 border-yellow-200 text-yellow-900 [&>svg]:text-yellow-600',
        info:
          'bg-blue-50 border-blue-200 text-blue-900 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

interface SimpleAlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof alertVariants> {
  title?: React.ReactNode
  onClose?: () => void
}

export default function SimpleAlert({
  children,
  title,
  variant = 'info',
  onClose,
  className,
  ...props
}: SimpleAlertProps) {
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    destructive: AlertCircle,
    default: Info,
  }
  
  // Map 'error' to 'destructive' if needed, or keep separate. 
  // Since I added 'error' variant, I can use it.
  const Icon = icons[variant as keyof typeof icons] || Info

  return (
    <Alert variant={variant} className={className} {...props}>
      <Icon className="h-4 w-4" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription>{children}</AlertDescription>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  )
}

export { Alert, AlertTitle, AlertDescription }
