'use client'

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { formatCurrency } from '@/app/_common/lib/utils'

interface EvolutionPoint {
  date: string
  value: number
}

interface EvolutionChartProps {
  data: EvolutionPoint[]
  viewMode: 'monthly' | 'yearly'
}

/**
 * Custom tooltip for the evolution chart
 */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground">{formatDate(label)}</p>
        <p className="font-medium text-primary">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { 
    month: 'short', 
    year: 'numeric' 
  })
}

/**
 * Format date for X-axis tick
 */
function formatXAxisTick(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { month: 'short' })
}

/**
 * Format value for Y-axis tick
 */
function formatYAxisTick(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`
  }
  return `${value}€`
}

/**
 * EvolutionChart Component
 * 
 * Displays patrimony evolution over time with monthly/yearly toggle.
 * Requirements: 1.2 - Display evolution chart showing patrimony changes over time
 */
export function EvolutionChart({ data, viewMode }: EvolutionChartProps) {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Aucune donnée d'évolution disponible
        </p>
      </div>
    )
  }

  // Filter data based on view mode
  const filteredData = viewMode === 'yearly' 
    ? aggregateToYearly(data)
    : data

  return (
    <div className="h-48 min-w-[320px]">
      <ResponsiveContainer width={360} height={192}>
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisTick}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tickFormatter={formatYAxisTick}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Aggregate monthly data to yearly
 */
function aggregateToYearly(data: EvolutionPoint[]): EvolutionPoint[] {
  const yearlyMap = new Map<string, { total: number; count: number }>()
  
  for (const point of data) {
    const year = new Date(point.date).getFullYear().toString()
    const existing = yearlyMap.get(year) || { total: 0, count: 0 }
    yearlyMap.set(year, {
      total: existing.total + point.value,
      count: existing.count + 1
    })
  }

  return Array.from(yearlyMap.entries()).map(([year, { total, count }]) => ({
    date: `${year}-12-31`,
    value: Math.round(total / count) // Average for the year
  }))
}

export default EvolutionChart
