import * as React from 'react'
import { cn } from '@/lib/utils'
import { BentoGrid } from '../BentoGrid'
import { BentoCard } from '../BentoCard'
import { BentoChart } from '../BentoChart'
import { BentoKPI, BentoKPIProps } from '../BentoKPI'

interface ChartHeroTemplateProps {
  mainChart: React.ReactNode
  chartTitle: string
  chartDescription?: string
  kpis: Array<Omit<BentoKPIProps, 'span'>>
  details?: React.ReactNode
  loading?: boolean
  className?: string
}

/**
 * ChartHeroTemplate - Template for simple calculators
 * 
 * Layout:
 * ┌─────────────┬───┐
 * │             │ K │
 * │   Chart     │ P │
 * │   (Hero)    │ I │
 * │             │ s │
 * ├─────────────┴───┤
 * │    Details      │
 * └─────────────────┘
 * 
 * Use for: IncomeTax, WealthTax, CapitalGainsTax, InheritanceTax, DonationTax calculators
 */
export function ChartHeroTemplate({
  mainChart,
  chartTitle,
  chartDescription,
  kpis,
  details,
  loading = false,
  className,
}: ChartHeroTemplateProps) {
  return (
    <div className={cn('w-full', className)}>
      <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
        {/* Main Chart - Hero (4x3) */}
        <BentoChart
          span={{ cols: 4, rows: 3 }}
          variant="hero"
          title={chartTitle}
          description={chartDescription}
          chart={mainChart}
          loading={loading}
        />

        {/* KPI Satellites - Vertical Stack (2x1 each) */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          {kpis.map((kpi: any, index: any) => (
            <BentoKPI
              key={index}
              span={{ cols: 2, rows: 1 }}
              loading={loading}
              {...kpi}
            />
          ))}
        </div>

        {/* Details Section - Full Width */}
        {details && (
          <BentoCard span={{ cols: 6, rows: 1 }} className="col-span-1 md:col-span-6">
            {details}
          </BentoCard>
        )}
      </BentoGrid>
    </div>
  )
}

export type { ChartHeroTemplateProps }
