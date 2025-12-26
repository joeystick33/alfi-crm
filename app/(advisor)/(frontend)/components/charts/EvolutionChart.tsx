'use client'

/**
 * EvolutionChart - Graphique d'évolution temporelle premium
 * Pour l'évolution du patrimoine, des revenus, etc.
 */

import { useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts'
import { formatCurrency, cn } from '@/app/_common/lib/utils'

interface EvolutionDataPoint {
  date: string
  label?: string
  [key: string]: string | number | undefined | null
}

interface EvolutionSeries {
  key: string
  name: string
  color: string
  gradientId?: string
}

interface EvolutionChartProps {
  data: EvolutionDataPoint[]
  series: EvolutionSeries[]
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  stacked?: boolean
  className?: string
}

// Tooltip personnalisé premium
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 min-w-[180px]">
        <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
        {payload.length > 1 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-sm font-bold text-gray-900 tabular-nums">
                {formatCurrency(payload.reduce((sum, item) => sum + item.value, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
  return null
}

// Légende personnalisée
const CustomLegend = ({ payload }: { payload?: Array<{ color: string; value: string }> }) => {
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function EvolutionChart({
  data,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  stacked = false,
  className,
}: EvolutionChartProps) {
  // Formateur d'axe Y
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`
    return `${value}€`
  }

  // Calculer le domaine Y
  const domain = useMemo(() => {
    let maxValue = 0
    data.forEach(point => {
      series.forEach(s => {
        const val = point[s.key]
        if (typeof val === 'number') {
          if (stacked) {
            // Pour le mode empilé, additionner les valeurs
            maxValue = Math.max(maxValue, series.reduce((sum, ser) => {
              const serVal = point[ser.key]
              return sum + (typeof serVal === 'number' ? serVal : 0)
            }, 0))
          } else {
            maxValue = Math.max(maxValue, val)
          }
        }
      })
    })
    return [0, Math.ceil(maxValue * 1.1)]
  }, [data, series, stacked])

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#E5E7EB" 
            />
          )}
          
          <XAxis 
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          
          <YAxis 
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            domain={domain}
            width={60}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {showLegend && <Legend content={<CustomLegend />} />}
          
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#gradient-${s.key})`}
              stackId={stacked ? 'stack' : undefined}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EvolutionChart
