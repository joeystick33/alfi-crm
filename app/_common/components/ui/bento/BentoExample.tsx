'use client'

import React from 'react'
import { BentoGrid } from '../BentoGrid'
import { BentoCard } from '../BentoCard'
import { BentoKPI } from '../BentoKPI'
import { BentoChart } from '../BentoChart'
import { BentoSkeleton } from '../BentoSkeleton'
import { TrendingUpIcon, UsersIcon, DollarSignIcon, CalendarIcon } from 'lucide-react'

/**
 * Example component demonstrating Bento Grid usage
 * This shows the basic patterns for using the Bento Grid design system
 */
export function BentoExample() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Bento Grid Example</h2>
        <p className="text-muted-foreground">
          Demonstration of the Bento Grid design system with various layouts
        </p>
      </div>

      {/* Example 1: Dashboard KPIs */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Dashboard KPIs Layout</h3>
        <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
          {/* Hero KPI - Larger */}
          <BentoKPI
            span={{ cols: 2, rows: 2 }}
            variant="hero"
            title="Clients Actifs"
            value="1,234"
            change={{ value: 12.5, trend: 'up' }}
            icon={<UsersIcon className="h-5 w-5" />}
          />

          {/* Regular KPIs */}
          <BentoKPI
            span={{ cols: 2, rows: 1 }}
            title="Nouveaux Clients"
            value="45"
            change={{ value: 8.2, trend: 'up' }}
            icon={<TrendingUpIcon className="h-5 w-5" />}
          />

          <BentoKPI
            span={{ cols: 2, rows: 1 }}
            title="Rendez-vous"
            value="23"
            change={{ value: 3.1, trend: 'down' }}
            icon={<CalendarIcon className="h-5 w-5" />}
          />

          <BentoKPI
            span={{ cols: 2, rows: 1 }}
            variant="accent"
            title="CA Mensuel"
            value="€125K"
            change={{ value: 15.3, trend: 'up' }}
            icon={<DollarSignIcon className="h-5 w-5" />}
          />

          <BentoKPI
            span={{ cols: 2, rows: 1 }}
            title="Taux Conversion"
            value="68%"
            change={{ value: 5.7, trend: 'up' }}
          />
        </BentoGrid>
      </section>

      {/* Example 2: Chart Hero Layout */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Chart Hero Layout</h3>
        <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
          {/* Main Chart - Hero */}
          <BentoChart
            span={{ cols: 4, rows: 3 }}
            variant="hero"
            title="Évolution du Patrimoine"
            description="Projection sur 12 mois"
            chart={
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
                <p className="text-muted-foreground">Chart Component Here</p>
              </div>
            }
          />

          {/* Satellite KPIs */}
          <BentoKPI
            span={{ cols: 2, rows: 1 }}
            title="Total Actifs"
            value="€2.5M"
            change={{ value: 8.5, trend: 'up' }}
          />

          <BentoKPI
            span={{ cols: 2, rows: 1 }}
            title="Total Passifs"
            value="€450K"
            change={{ value: 2.1, trend: 'down' }}
          />

          <BentoKPI
            span={{ cols: 2, rows: 1 }}
            variant="hero"
            title="Patrimoine Net"
            value="€2.05M"
            change={{ value: 12.3, trend: 'up' }}
          />
        </BentoGrid>
      </section>

      {/* Example 3: Dual Charts Layout */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Dual Charts Layout</h3>
        <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
          {/* Health Indicator - Full Width */}
          <BentoCard span={{ cols: 6, rows: 1 }} variant="gradient">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Santé Financière</h4>
                <p className="text-sm text-muted-foreground">Excellente - Score: 92/100</p>
              </div>
              <div className="text-3xl font-bold text-green-500">A+</div>
            </div>
          </BentoCard>

          {/* Two Charts Side by Side */}
          <BentoChart
            span={{ cols: 3, rows: 3 }}
            title="Répartition Actifs"
            chart={
              <div className="h-48 flex items-center justify-center bg-muted/20 rounded">
                <p className="text-muted-foreground">Pie Chart</p>
              </div>
            }
          />

          <BentoChart
            span={{ cols: 3, rows: 3 }}
            title="Évolution Mensuelle"
            chart={
              <div className="h-48 flex items-center justify-center bg-muted/20 rounded">
                <p className="text-muted-foreground">Bar Chart</p>
              </div>
            }
          />

          {/* Small KPIs */}
          <BentoKPI span={{ cols: 2, rows: 1 }} title="Liquidités" value="€350K" />
          <BentoKPI span={{ cols: 2, rows: 1 }} title="Immobilier" value="€1.2M" />
          <BentoKPI span={{ cols: 2, rows: 1 }} title="Placements" value="€950K" />
        </BentoGrid>
      </section>

      {/* Example 4: Loading States */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Loading States</h3>
        <BentoGrid cols={{ mobile: 1, tablet: 4, desktop: 6 }} gap={4}>
          <BentoSkeleton span={{ cols: 2, rows: 2 }} variant="kpi" />
          <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
          <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
          <BentoSkeleton span={{ cols: 4, rows: 3 }} variant="chart" />
          <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
          <BentoSkeleton span={{ cols: 2, rows: 1 }} variant="kpi" />
        </BentoGrid>
      </section>

      {/* Example 5: Variants */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Card Variants</h3>
        <BentoGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap={4}>
          <BentoCard variant="default">
            <h4 className="font-semibold mb-2">Default</h4>
            <p className="text-sm text-muted-foreground">Standard card style</p>
          </BentoCard>

          <BentoCard variant="hero">
            <h4 className="font-semibold mb-2">Hero</h4>
            <p className="text-sm text-muted-foreground">Highlighted with gradient</p>
          </BentoCard>

          <BentoCard variant="accent">
            <h4 className="font-semibold mb-2">Accent</h4>
            <p className="text-sm text-muted-foreground">Subtle accent color</p>
          </BentoCard>

          <BentoCard variant="gradient">
            <h4 className="font-semibold mb-2">Gradient</h4>
            <p className="text-sm text-muted-foreground">Colorful gradient</p>
          </BentoCard>
        </BentoGrid>
      </section>

      {/* Example 6: Hoverable Cards */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Interactive Cards</h3>
        <BentoGrid cols={{ mobile: 1, tablet: 3, desktop: 3 }} gap={4}>
          <BentoCard hoverable variant="default">
            <h4 className="font-semibold mb-2">Hoverable Card</h4>
            <p className="text-sm text-muted-foreground">
              Hover over me to see the effect
            </p>
          </BentoCard>

          <BentoCard hoverable variant="hero">
            <h4 className="font-semibold mb-2">Hero Hoverable</h4>
            <p className="text-sm text-muted-foreground">
              Interactive hero card
            </p>
          </BentoCard>

          <BentoCard hoverable variant="gradient">
            <h4 className="font-semibold mb-2">Gradient Hoverable</h4>
            <p className="text-sm text-muted-foreground">
              Gradient with hover
            </p>
          </BentoCard>
        </BentoGrid>
      </section>
    </div>
  )
}
