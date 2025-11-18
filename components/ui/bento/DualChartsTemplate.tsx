import * as React from 'react'
import { cn } from '@/lib/utils'
import { BentoGrid } from '../BentoGrid'
import { BentoCard } from '../BentoCard'
import { BentoChart } from '../BentoChart'
import { BentoKPI, BentoKPIProps } from '../BentoKPI'

interface DualChartsTemplateProps {
  chart1: React.ReactNode
  chart1Title: string
  chart1Description?: string
  chart2: React.ReactNode
  chart2Title: string
  chart2Description?: string
  kpis: Array<Omit<BentoKPIProps, 'span'>>
  healthIndicator?: React.ReactNode
  loading?: boolean
  className?: string
}

/**
 * DualChartsTemplate - Template for complex calculators
 * 
 * Layout:
 * ┌─────────────────┐
 * │ Health (Hero)   │
 * ├────────┬────────┤
 * │ Chart1 │ Chart2 │
 * ├────────┴────────┤
 * │  KPIs (small)   │
 * └─────────────────┘
 * 
 * Use for: BudgetAnalyzer, DebtCapacityCalculator, complex financial calculators
 */
export function DualChartsTemplate({
  chart1,
  chart1Title,
  chart1Description,
  chart2,
  chart2Title,
  chart2Description,
  kpis,
  healthIndicator,
  loading = false,
  className,
}: DualChartsTemplateProps) {
  return (
    <div className={cn('w-full', className)}>
      <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
        {/* Health Indicator - Full Width Hero */}
        {healthIndicator && (
          <BentoCard 
            span={{ cols: 6, rows: 1 }} 
            variant="gradient"
            className="col-span-1 md:col-span-6"
          >
            {healthIndicator}
          </BentoCard>
        )}

        {/* Chart 1 - Left Side (3x3) */}
        <BentoChart
          span={{ cols: 3, rows: 3 }}
          title={chart1Title}
          description={chart1Description}
          chart={chart1}
          loading={loading}
          className="col-span-1 md:col-span-3"
        />

        {/* Chart 2 - Right Side (3x3) */}
        <BentoChart
          span={{ cols: 3, rows: 3 }}
          title={chart2Title}
          description={chart2Description}
          chart={chart2}
          loading={loading}
          className="col-span-1 md:col-span-3"
        />

        {/* KPIs - Small Cards Below Charts */}
        {kpis.map((kpi: any, index: any) => (
          <BentoKPI
            key={index}
            span={{ cols: 2, rows: 1 }}
            loading={loading}
            className="col-span-1 md:col-span-2"
            {...kpi}
          />
        ))}
      </BentoGrid>
    </div>
  )
}

export type { DualChartsTemplateProps }
