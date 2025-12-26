 
'use client'

/**
 * BudgetBarChart - Graphique en barres pour le budget et la capacité d'épargne
 * Style Finary avec couleurs dégradées et animations
 */

import { useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine, LabelList
} from 'recharts'
import { formatCurrency, cn } from '@/app/_common/lib/utils'

interface BudgetItem {
  name: string
  value: number
  budget?: number
  color?: string
  category?: string
  [key: string]: any
}

interface BudgetBarChartProps {
  data: BudgetItem[]
  title?: string
  type?: 'horizontal' | 'vertical'
  showBudgetLine?: boolean
  budgetValue?: number
  height?: number
  showValues?: boolean
  colorScheme?: 'green' | 'blue' | 'gradient'
  className?: string
}

// Tooltip personnalisé
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 min-w-[160px]">
        <p className="text-sm font-medium text-gray-900 mb-1">{data.name}</p>
        <p className="text-lg font-bold text-gray-900 tabular-nums">
          {formatCurrency(data.value)}
        </p>
        {data.budget && (
          <p className="text-xs text-gray-500 mt-1">
            Budget: {formatCurrency(data.budget)}
          </p>
        )}
        {data.category && (
          <p className="text-xs text-gray-400 mt-0.5">{data.category}</p>
        )}
      </div>
    )
  }
  return null
}

export function BudgetBarChart({
  data,
  title,
  type = 'vertical',
  showBudgetLine = false,
  budgetValue,
  height = 300,
  showValues = true,
  colorScheme = 'gradient',
  className,
}: BudgetBarChartProps) {
  // Couleurs selon le schéma
  const getBarColor = (index: number, value: number, max: number) => {
    if (colorScheme === 'green') {
      return '#10B981'
    } else if (colorScheme === 'blue') {
      return '#3B82F6'
    } else {
      // Gradient de couleurs basé sur la position
      const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF']
      return colors[index % colors.length]
    }
  }

  // Calculer le max pour le domaine Y
  const maxValue = useMemo(() => {
    const dataMax = Math.max(...data.map(d => d.value))
    return budgetValue ? Math.max(dataMax, budgetValue) * 1.1 : dataMax * 1.1
  }, [data, budgetValue])

  // Formateur d'axe Y
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`
    return `${value}€`
  }

  if (type === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        {title && (
          <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
        )}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
            <XAxis 
              type="number" 
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#374151', fontSize: 13 }}
              width={95}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
            <Bar 
              dataKey="value" 
              radius={[0, 6, 6, 0]}
              maxBarSize={32}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || getBarColor(index, entry.value, maxValue)}
                />
              ))}
              {showValues && (
                <LabelList 
                  dataKey="value" 
                  position="right"
                  formatter={(value: any) => formatCurrency(Number(value))}
                  style={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            domain={[0, maxValue]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
          {showBudgetLine && budgetValue && (
            <ReferenceLine 
              y={budgetValue} 
              stroke="#EF4444" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: `Budget: ${formatCurrency(budgetValue)}`, 
                position: 'insideTopRight',
                fill: '#EF4444',
                fontSize: 12,
              }}
            />
          )}
          <Bar 
            dataKey="value" 
            radius={[6, 6, 0, 0]}
            maxBarSize={50}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || getBarColor(index, entry.value, maxValue)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BudgetBarChart
