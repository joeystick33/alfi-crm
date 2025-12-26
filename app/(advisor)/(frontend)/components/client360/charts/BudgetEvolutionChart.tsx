 
'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { formatCurrency } from '@/app/_common/lib/utils'

interface BudgetEvolutionPoint {
  date: string
  revenue: number
  expense: number
}

interface BudgetEvolutionChartProps {
  data: BudgetEvolutionPoint[]
}

/**
 * Custom tooltip for the budget evolution chart
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0
    const balance = revenue - expense

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground mb-2">{formatDate(label)}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-success">Revenus:</span>{' '}
            <span className="font-medium">{formatCurrency(revenue)}</span>
          </p>
          <p className="text-sm">
            <span className="text-destructive">Dépenses:</span>{' '}
            <span className="font-medium">{formatCurrency(expense)}</span>
          </p>
          <hr className="my-1" />
          <p className="text-sm">
            <span className={balance >= 0 ? 'text-success' : 'text-destructive'}>
              Solde:
            </span>{' '}
            <span className="font-medium">{formatCurrency(balance)}</span>
          </p>
        </div>
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
    month: 'long', 
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
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`
  }
  return `${value}€`
}

/**
 * Custom legend
 */
function CustomLegend() {
  return (
    <div className="flex justify-center gap-6 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-success" />
        <span className="text-sm text-muted-foreground">Revenus</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-destructive" />
        <span className="text-sm text-muted-foreground">Dépenses</span>
      </div>
    </div>
  )
}

/**
 * BudgetEvolutionChart Component
 * 
 * Displays revenue vs expenses evolution over time.
 * Requirements: 1.3 - Display revenue vs expenses evolution chart
 */
export function BudgetEvolutionChart({ data }: BudgetEvolutionChartProps) {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Aucune donnée budgétaire disponible
        </p>
      </div>
    )
  }

  return (
    <div className="h-60 min-w-[320px]">
      <ResponsiveContainer width={360} height={240}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
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
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Bar 
            dataKey="revenue" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]}
            name="Revenus"
          />
          <Bar 
            dataKey="expense" 
            fill="#EF4444" 
            radius={[4, 4, 0, 0]}
            name="Dépenses"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BudgetEvolutionChart
