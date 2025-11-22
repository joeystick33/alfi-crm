import * as React from 'react'
import { cn } from '@/lib/utils'
import { BentoCard, BentoCardProps } from './BentoCard'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface BentoKPIProps extends Omit<BentoCardProps, 'children'> {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down'
  }
  icon?: React.ReactNode
  description?: string
  loading?: boolean
}

const BentoKPI = React.forwardRef<HTMLDivElement, BentoKPIProps>(
  ({ title, value, change, icon, description, loading = false, className, ...props }, ref) => {
    return (
      <BentoCard 
        ref={ref} 
        className={cn('flex flex-col justify-between', className)} 
        aria-label={`KPI: ${title}`}
        role="article"
        {...props}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          {icon && (
            <div className="ml-2 text-muted-foreground opacity-60">
              {icon}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            {change && <div className="h-4 w-20 bg-muted animate-pulse rounded" />}
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
            </div>

            {change && (
              <div className="flex items-center gap-1 mt-2" role="status" aria-live="polite">
                {change.trend === 'up' ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" aria-hidden="true" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" aria-hidden="true" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    change.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  )}
                  aria-label={`${change.trend === 'up' ? 'Augmentation' : 'Diminution'} de ${Math.abs(change.value)} pourcent`}
                >
                  {Math.abs(change.value)}%
                </span>
                <span className="text-sm text-muted-foreground">vs période précédente</span>
              </div>
            )}

            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </>
        )}
      </BentoCard>
    )
  }
)
BentoKPI.displayName = 'BentoKPI'

export { BentoKPI }
export type { BentoKPIProps }
