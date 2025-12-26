 
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency, formatPercentage } from '@/app/_common/lib/utils'
import { formatLabel } from '@/app/_common/lib/labels'

interface AllocationItem {
  category: string
  value: number
  percentage: number
  color?: string
}

interface PatrimonyDonutChartProps {
  allocation: AllocationItem[]
  totalGross: number
  totalNet: number
}

// Default colors for categories
const DEFAULT_COLORS: Record<string, string> = {
  IMMOBILIER: '#3B82F6',
  FINANCIER: '#10B981',
  EPARGNE_SALARIALE: '#6366F1',
  EPARGNE_RETRAITE: '#F97316',
  PROFESSIONNEL: '#F59E0B',
  MOBILIER: '#FBBF24',
  AUTRES: '#8B5CF6',
  AUTRE: '#8B5CF6'
}

/**
 * Custom tooltip for the donut chart
 */
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{formatLabel(data.category)}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.value)}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatPercentage(data.percentage)}
        </p>
      </div>
    )
  }
  return null
}

/**
 * Custom legend for the donut chart
 */
function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">
            {formatLabel(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * PatrimonyDonutChart Component
 * 
 * Displays a donut chart showing patrimony allocation by category.
 * Requirements: 1.1 - Display total patrimony value with donut chart showing global allocation
 */
export function PatrimonyDonutChart({ 
  allocation, 
  totalGross, 
  totalNet 
}: PatrimonyDonutChartProps) {
  // Prepare data with colors
  const chartData = allocation.map(item => ({
    ...item,
    color: item.color || DEFAULT_COLORS[item.category] || '#6B7280',
    name: formatLabel(item.category)
  }))

  // Handle empty state
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Aucune donnée de patrimoine disponible
        </p>
      </div>
    )
  }

  return (
    <div className="h-64 min-w-[260px]">
      <ResponsiveContainer width={260} height={256}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            nameKey="category"
          >
            {chartData.map((entry) => (
              <Cell 
                key={entry.category ?? entry.name} 
                fill={entry.color}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center label showing totals */}
      <div className="relative -mt-40 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Brut</p>
          <p className="text-lg font-semibold">{formatCurrency(totalGross)}</p>
        </div>
      </div>
    </div>
  )
}

export default PatrimonyDonutChart
