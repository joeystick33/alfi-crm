'use client'

/**
 * KPICard - Carte KPI premium avec mini-graphique optionnel
 * Style Finary avec animations et indicateurs de tendance
 */

import { useMemo } from 'react'
import { Minus, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, cn } from '@/app/_common/lib/utils'

interface KPICardProps {
  title: string
  value: number
  previousValue?: number
  format?: 'currency' | 'percent' | 'number'
  suffix?: string
  prefix?: string
  icon?: React.ReactNode
  iconBg?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  trendLabel?: string
  sparkline?: number[]
  description?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient' | 'outlined'
  colorScheme?: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'gray'
  onClick?: () => void
  className?: string
}

// Mini sparkline component
const MiniSparkline = ({ data, color = '#3B82F6' }: { data: number[]; color?: string }) => {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const height = 32
  const width = 80

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg 
      width={width} 
      height={height} 
      className="opacity-60"
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        fill="url(#sparkline-gradient)"
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  )
}

// Couleurs par schéma
const COLOR_SCHEMES = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-100',
    gradient: 'from-blue-500 to-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-100',
    gradient: 'from-purple-500 to-purple-600',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-100',
    gradient: 'from-amber-500 to-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-100',
    text: 'text-rose-600',
    border: 'border-rose-100',
    gradient: 'from-rose-500 to-rose-600',
  },
  gray: {
    bg: 'bg-gray-50',
    iconBg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-100',
    gradient: 'from-gray-500 to-gray-600',
  },
}

export function KPICard({
  title,
  value,
  previousValue,
  format = 'currency',
  suffix,
  prefix,
  icon,
  iconBg,
  trend,
  trendValue,
  trendLabel,
  sparkline,
  description,
  size = 'md',
  variant = 'default',
  colorScheme = 'blue',
  onClick,
  className,
}: KPICardProps) {
  // Formater la valeur
  const formattedValue = useMemo(() => {
    let formatted = ''
    if (format === 'currency') {
      formatted = formatCurrency(value)
    } else if (format === 'percent') {
      formatted = `${value.toFixed(1)}%`
    } else {
      formatted = value.toLocaleString('fr-FR')
    }
    return `${prefix || ''}${formatted}${suffix || ''}`
  }, [value, format, prefix, suffix])

  // Calculer la tendance automatiquement si non fournie
  const calculatedTrend = useMemo(() => {
    if (trend) return trend
    if (previousValue !== undefined) {
      if (value > previousValue) return 'up'
      if (value < previousValue) return 'down'
    }
    return 'neutral'
  }, [trend, value, previousValue])

  // Calculer le pourcentage de variation
  const variationPercent = useMemo(() => {
    if (trendValue !== undefined) return trendValue
    if (previousValue !== undefined && previousValue !== 0) {
      return ((value - previousValue) / Math.abs(previousValue)) * 100
    }
    return undefined
  }, [trendValue, value, previousValue])

  const colors = COLOR_SCHEMES[colorScheme]

  // Tailles
  const sizeClasses = {
    sm: {
      padding: 'p-3',
      titleSize: 'text-xs',
      valueSize: 'text-lg',
      iconSize: 'w-8 h-8',
      iconInner: 'w-4 h-4',
    },
    md: {
      padding: 'p-4',
      titleSize: 'text-sm',
      valueSize: 'text-2xl',
      iconSize: 'w-10 h-10',
      iconInner: 'w-5 h-5',
    },
    lg: {
      padding: 'p-5',
      titleSize: 'text-base',
      valueSize: 'text-3xl',
      iconSize: 'w-12 h-12',
      iconInner: 'w-6 h-6',
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border transition-all duration-200',
        variant === 'default' && 'border-gray-100 hover:border-gray-200 hover:shadow-md',
        variant === 'outlined' && `border-2 ${colors.border}`,
        variant === 'gradient' && 'border-0 bg-gradient-to-br text-white',
        variant === 'gradient' && colors.gradient,
        onClick && 'cursor-pointer',
        sizes.padding,
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          {/* Titre avec info tooltip */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={cn(
              'font-medium truncate',
              sizes.titleSize,
              variant === 'gradient' ? 'text-white/80' : 'text-gray-500'
            )}>
              {title}
            </span>
            {description && (
              <span title={description}>
                <Info className={cn(
                  'w-3.5 h-3.5 flex-shrink-0 cursor-help',
                  variant === 'gradient' ? 'text-white/60' : 'text-gray-400'
                )} />
              </span>
            )}
          </div>

          {/* Valeur principale */}
          <div className={cn(
            'font-bold tabular-nums tracking-tight',
            sizes.valueSize,
            variant === 'gradient' ? 'text-white' : 'text-gray-900'
          )}>
            {formattedValue}
          </div>

          {/* Tendance */}
          {(variationPercent !== undefined || trendLabel) && (
            <div className="flex items-center gap-1.5 mt-2">
              {calculatedTrend === 'up' && (
                <div className="flex items-center gap-0.5 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  {variationPercent !== undefined && (
                    <span className="text-sm font-medium">
                      +{Math.abs(variationPercent).toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
              {calculatedTrend === 'down' && (
                <div className="flex items-center gap-0.5 text-rose-600">
                  <ArrowDownRight className="w-4 h-4" />
                  {variationPercent !== undefined && (
                    <span className="text-sm font-medium">
                      -{Math.abs(variationPercent).toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
              {calculatedTrend === 'neutral' && variationPercent !== undefined && (
                <div className="flex items-center gap-0.5 text-gray-500">
                  <Minus className="w-4 h-4" />
                  <span className="text-sm font-medium">0%</span>
                </div>
              )}
              {trendLabel && (
                <span className={cn(
                  'text-xs',
                  variant === 'gradient' ? 'text-white/70' : 'text-gray-400'
                )}>
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icône ou Sparkline */}
        <div className="flex-shrink-0">
          {sparkline && sparkline.length > 0 ? (
            <MiniSparkline 
              data={sparkline} 
              color={variant === 'gradient' ? '#ffffff' : colors.text.replace('text-', '#').replace('-600', '')} 
            />
          ) : icon ? (
            <div className={cn(
              'rounded-xl flex items-center justify-center',
              sizes.iconSize,
              variant === 'gradient' ? 'bg-white/20' : (iconBg || colors.iconBg)
            )}>
              <div className={cn(
                sizes.iconInner,
                variant === 'gradient' ? 'text-white' : colors.text
              )}>
                {icon}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default KPICard
