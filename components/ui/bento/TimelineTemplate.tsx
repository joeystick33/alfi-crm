import * as React from 'react'
import { cn } from '@/lib/utils'
import { BentoGrid } from '../BentoGrid'
import { BentoCard } from '../BentoCard'
import { BentoChart } from '../BentoChart'
import { BentoKPI, BentoKPIProps } from '../BentoKPI'

interface TimelineTemplateProps {
  timeline: React.ReactNode
  timelineTitle: string
  timelineDescription?: string
  kpis: Array<Omit<BentoKPIProps, 'span'>>
  feasibility?: {
    status: 'FEASIBLE' | 'CHALLENGING' | 'NOT_FEASIBLE'
    message: string
  }
  recommendations?: React.ReactNode
  loading?: boolean
  className?: string
}

/**
 * TimelineTemplate - Template for simulators with long-term projections
 * 
 * Layout:
 * ┌─────────────────┐
 * │ Feasibility     │
 * ├─────────┬───────┤
 * │         │ KPIs  │
 * │Timeline │ (vert)│
 * │ (Hero)  │       │
 * ├─────────┴───────┤
 * │ Recommendations │
 * └─────────────────┘
 * 
 * Use for: RetirementSimulator, PensionEstimator, SuccessionSimulator, long-term projections
 */
export function TimelineTemplate({
  timeline,
  timelineTitle,
  timelineDescription,
  kpis,
  feasibility,
  recommendations,
  loading = false,
  className,
}: TimelineTemplateProps) {
  const feasibilityColors = {
    FEASIBLE: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
    CHALLENGING: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    NOT_FEASIBLE: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
  }

  const feasibilityIcons = {
    FEASIBLE: '✓',
    CHALLENGING: '⚠',
    NOT_FEASIBLE: '✗',
  }

  return (
    <div className={cn('w-full', className)}>
      <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
        {/* Feasibility Indicator - Full Width Hero */}
        {feasibility && (
          <BentoCard 
            span={{ cols: 6, rows: 1 }} 
            variant="hero"
            className={cn(
              'col-span-1 md:col-span-6',
              feasibilityColors[feasibility.status]
            )}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">
                {feasibilityIcons[feasibility.status]}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {feasibility.status === 'FEASIBLE' && 'Objectif Atteignable'}
                  {feasibility.status === 'CHALLENGING' && 'Objectif Difficile'}
                  {feasibility.status === 'NOT_FEASIBLE' && 'Objectif Non Atteignable'}
                </h3>
                <p className="text-sm opacity-90">{feasibility.message}</p>
              </div>
            </div>
          </BentoCard>
        )}

        {/* Timeline Chart - Large Hero (4x4) */}
        <BentoChart
          span={{ cols: 4, rows: 4 }}
          variant="hero"
          title={timelineTitle}
          description={timelineDescription}
          chart={timeline}
          loading={loading}
          className="col-span-1 md:col-span-4"
        />

        {/* KPI Sidebar - Vertical Stack (2x2 each) */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          {kpis.map((kpi: any, index: any) => (
            <BentoKPI
              key={index}
              span={{ cols: 2, rows: 2 }}
              loading={loading}
              variant={index === 0 ? 'hero' : 'default'}
              {...kpi}
            />
          ))}
        </div>

        {/* Recommendations - Full Width */}
        {recommendations && (
          <BentoCard 
            span={{ cols: 6, rows: 1 }}
            className="col-span-1 md:col-span-6"
          >
            {recommendations}
          </BentoCard>
        )}
      </BentoGrid>
    </div>
  )
}

export type { TimelineTemplateProps }
