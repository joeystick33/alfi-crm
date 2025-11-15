import * as React from 'react'
import { cn } from '@/lib/utils'
import { BentoCard, BentoCardProps, BentoCardHeader, BentoCardTitle, BentoCardDescription, BentoCardContent } from './BentoCard'
import { Skeleton } from './Skeleton'

interface BentoChartProps extends Omit<BentoCardProps, 'children'> {
  title: string
  description?: string
  chart: React.ReactNode
  loading?: boolean
  actions?: React.ReactNode
}

const BentoChart = React.forwardRef<HTMLDivElement, BentoChartProps>(
  ({ title, description, chart, loading = false, actions, className, ...props }, ref) => {
    return (
      <BentoCard 
        ref={ref} 
        className={cn('flex flex-col', className)} 
        aria-label={`Chart: ${title}`}
        role="figure"
        {...props}
      >
        <BentoCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <BentoCardTitle>{title}</BentoCardTitle>
              {description && <BentoCardDescription>{description}</BentoCardDescription>}
            </div>
            {actions && <div className="ml-4">{actions}</div>}
          </div>
        </BentoCardHeader>

        <BentoCardContent className="flex-1 flex items-center justify-center">
          {loading ? (
            <div className="w-full h-full min-h-[200px] space-y-3" role="status" aria-label="Chargement du graphique">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-32 w-full mt-4" />
            </div>
          ) : (
            <div className="w-full h-full" role="img" aria-label={description || title}>
              {chart}
            </div>
          )}
        </BentoCardContent>
      </BentoCard>
    )
  }
)
BentoChart.displayName = 'BentoChart'

export { BentoChart }
export type { BentoChartProps }
