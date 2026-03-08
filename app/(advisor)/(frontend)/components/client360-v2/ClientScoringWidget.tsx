'use client'

/**
 * ClientScoringWidget - Widget de scoring client
 * 
 * Affiche le score global du client avec:
 * - Score numérique (0-100)
 * - Indicateur visuel (jauge)
 * - Détail par catégorie
 * - Évolution dans le temps
 */

import { useMemo } from 'react'
import { cn } from '@/app/_common/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Shield,
  Wallet,
  Target,
  Clock,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface ScoreCategory {
  id: string
  label: string
  score: number
  maxScore: number
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

interface ClientScoringWidgetProps {
  globalScore: number
  maxScore?: number
  evolution?: number // variation en points
  categories?: ScoreCategory[]
  lastUpdate?: Date
  className?: string
  variant?: 'compact' | 'detailed'
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CATEGORIES: ScoreCategory[] = [
  { id: 'kyc', label: 'KYC', score: 0, maxScore: 25, icon: Shield, description: 'Conformité documentaire' },
  { id: 'patrimoine', label: 'Patrimoine', score: 0, maxScore: 25, icon: Wallet, description: 'Diversification des actifs' },
  { id: 'objectifs', label: 'Objectifs', score: 0, maxScore: 25, icon: Target, description: 'Suivi des objectifs' },
  { id: 'engagement', label: 'Engagement', score: 0, maxScore: 25, icon: Star, description: 'Relation client' },
]

// =============================================================================
// Fonctions utilitaires
// =============================================================================

function getScoreColor(score: number, maxScore: number = 100): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'text-emerald-600'
  if (percentage >= 60) return 'text-blue-600'
  if (percentage >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBgColor(score: number, maxScore: number = 100): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'bg-emerald-500'
  if (percentage >= 60) return 'bg-blue-500'
  if (percentage >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreLabel(score: number, maxScore: number = 100): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'Excellent'
  if (percentage >= 60) return 'Bon'
  if (percentage >= 40) return 'Moyen'
  return 'À améliorer'
}

// =============================================================================
// Composants internes
// =============================================================================

function ScoreGauge({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  const circumference = 2 * Math.PI * 45 // rayon de 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Cercle de fond */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-100"
        />
        {/* Cercle de progression */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={getScoreBgColor(score, maxScore)}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      {/* Score au centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', getScoreColor(score, maxScore))}>
          {score}
        </span>
        <span className="text-xs text-gray-500">/{maxScore}</span>
      </div>
    </div>
  )
}

function CategoryBar({ category }: { category: ScoreCategory }) {
  const Icon = category.icon
  const percentage = (category.score / category.maxScore) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-medium text-gray-700">{category.label}</span>
        </div>
        <span className={cn('font-semibold', getScoreColor(category.score, category.maxScore))}>
          {category.score}/{category.maxScore}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', getScoreBgColor(category.score, category.maxScore))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// Composant Principal
// =============================================================================

export function ClientScoringWidget({
  globalScore,
  maxScore = 100,
  evolution,
  categories = DEFAULT_CATEGORIES,
  lastUpdate,
  className,
  variant = 'detailed',
}: ClientScoringWidgetProps) {
  const scoreLabel = useMemo(() => getScoreLabel(globalScore, maxScore), [globalScore, maxScore])

  // Version compacte
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200', className)}>
        <div className={cn('text-2xl font-bold', getScoreColor(globalScore, maxScore))}>
          {globalScore}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">Score Client</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{scoreLabel}</span>
            {evolution !== undefined && (
              <>
                <span className="mx-1">•</span>
                {evolution > 0 ? (
                  <span className="flex items-center text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-0.5" />+{evolution}
                  </span>
                ) : evolution < 0 ? (
                  <span className="flex items-center text-red-600">
                    <TrendingDown className="h-3 w-3 mr-0.5" />{evolution}
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500">
                    <Minus className="h-3 w-3 mr-0.5" />0
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Version détaillée
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      <div className="flex items-start gap-4">
        {/* Jauge de score */}
        <ScoreGauge score={globalScore} maxScore={maxScore} />

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">Score Client</h3>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              globalScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
              globalScore >= 60 ? 'bg-blue-100 text-blue-700' :
              globalScore >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            )}>
              {scoreLabel}
            </span>
          </div>

          {/* Évolution */}
          {evolution !== undefined && (
            <div className="flex items-center gap-1 text-sm mb-3">
              {evolution > 0 ? (
                <span className="flex items-center text-emerald-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{evolution} pts ce mois
                </span>
              ) : evolution < 0 ? (
                <span className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  {evolution} pts ce mois
                </span>
              ) : (
                <span className="flex items-center text-gray-500">
                  <Minus className="h-4 w-4 mr-1" />
                  Stable ce mois
                </span>
              )}
            </div>
          )}

          {/* Catégories */}
          <div className="space-y-2">
            {categories.map((category) => (
              <CategoryBar key={category.id} category={category} />
            ))}
          </div>

          {/* Dernière mise à jour */}
          {lastUpdate && (
            <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>
                Mis à jour le {lastUpdate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export type { ClientScoringWidgetProps, ScoreCategory }
export default ClientScoringWidget
