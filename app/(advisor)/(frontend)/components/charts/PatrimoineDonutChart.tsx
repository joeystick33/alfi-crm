'use client'
 

/**
 * PatrimoineDonutChart - Graphique donut premium pour la répartition du patrimoine
 * Style Finary avec animations et interactions
 */

import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import { formatCurrency, cn } from '@/app/_common/lib/utils'

interface PatrimoineItem {
  name: string
  value: number
  color: string
  icon?: React.ReactNode
  details?: string
  [key: string]: any // Allow index signature for Recharts compatibility
}

interface PatrimoineDonutChartProps {
  data: PatrimoineItem[]
  totalLabel?: string
  centerLabel?: string
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
  showPercentages?: boolean
  className?: string
  onSegmentClick?: (item: PatrimoineItem) => void
}

// Couleurs premium Finary-style
export const PATRIMOINE_COLORS = {
  immobilier: '#3B82F6',      // Blue
  financier: '#10B981',       // Emerald
  professionnel: '#8B5CF6',   // Purple
  liquidites: '#06B6D4',      // Cyan
  vehicules: '#F59E0B',       // Amber
  autres: '#6B7280',          // Gray
  // Sous-catégories
  residence_principale: '#2563EB',
  investissement_locatif: '#3B82F6',
  scpi: '#60A5FA',
  assurance_vie: '#059669',
  pea: '#10B981',
  compte_titres: '#34D399',
  epargne: '#06B6D4',
  retraite: '#8B5CF6',
}

// Rendu du secteur actif (hover/click)
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  )
}

export function PatrimoineDonutChart({
  data,
  totalLabel = 'Patrimoine total',
  centerLabel,
  size = 'md',
  showLegend = true,
  showPercentages = true,
  className,
  onSegmentClick,
}: PatrimoineDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Calculer le total
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  // Filtrer les données nulles
  const filteredData = useMemo(() => {
    return data.filter(item => item.value > 0)
  }, [data])

  // Dimensions selon la taille
  const dimensions = {
    sm: { width: 200, height: 200, innerRadius: 50, outerRadius: 80 },
    md: { width: 280, height: 280, innerRadius: 70, outerRadius: 110 },
    lg: { width: 360, height: 360, innerRadius: 90, outerRadius: 140 },
  }

  const dim = dimensions[size]

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  const handleClick = (entry: any, index: number) => {
    if (onSegmentClick && filteredData[index]) {
      onSegmentClick(filteredData[index])
    }
  }

  // Item actif ou total
  const activeItem = activeIndex !== null ? filteredData[activeIndex] : null
  const displayValue = activeItem ? activeItem.value : total
  const displayLabel = activeItem ? activeItem.name : centerLabel || totalLabel
  const displayPercent = activeItem ? ((activeItem.value / total) * 100).toFixed(1) : '100'

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Chart */}
      <div className="relative" style={{ width: dim.width, height: dim.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={dim.innerRadius}
              outerRadius={dim.outerRadius}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={handleClick as any}
              style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centre du donut */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            width: dim.innerRadius * 1.6,
            height: dim.innerRadius * 1.6,
          }}
        >
          <span className="text-xs text-gray-500 font-medium truncate max-w-full px-2">
            {displayLabel}
          </span>
          <span className={cn(
            'font-bold text-gray-900 tabular-nums',
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'
          )}>
            {formatCurrency(displayValue)}
          </span>
          {showPercentages && activeItem && (
            <span className="text-xs text-gray-400 mt-0.5">
              {displayPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Légende */}
      {showLegend && (
        <div className={cn(
          'grid gap-2 mt-4 w-full',
          filteredData.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
        )}>
          {filteredData.map((item, index) => {
            const percent = ((item.value / total) * 100).toFixed(1)
            const isActive = activeIndex === index
            
            return (
              <div
                key={item.name}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer',
                  isActive ? 'bg-gray-100 scale-[1.02]' : 'hover:bg-gray-50'
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => onSegmentClick?.(item)}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm text-gray-700 truncate">{item.name}</span>
                    <span className="text-xs text-gray-400 tabular-nums">{percent}%</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PatrimoineDonutChart
