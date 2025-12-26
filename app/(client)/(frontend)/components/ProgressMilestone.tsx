'use client'

/**
 * ProgressMilestone - Composant pédagogique
 * 
 * Barre de progression avec jalons et encouragements
 * pour motiver les clients dans l'atteinte de leurs objectifs.
 * 
 * Affiche des messages d'encouragement personnalisés selon la progression.
 */

import React, { useMemo } from 'react'
import { 
  Star, 
  Trophy, 
  Target,
  Sparkles,
  PartyPopper,
  TrendingUp,
  Flag,
  CheckCircle,
} from 'lucide-react'

export interface Milestone {
  /** Pourcentage du jalon (0-100) */
  percentage: number
  /** Label du jalon */
  label: string
  /** Icône optionnelle */
  icon?: typeof Star
}

export interface ProgressMilestoneProps {
  /** Valeur actuelle (pourcentage 0-100) */
  value: number
  /** Montant actuel (optionnel, pour affichage) */
  currentAmount?: number
  /** Montant cible (optionnel, pour affichage) */
  targetAmount?: number
  /** Jalons personnalisés (utilise les défauts si non fourni) */
  milestones?: Milestone[]
  /** Afficher le message d'encouragement */
  showEncouragement?: boolean
  /** Afficher les jalons visuellement */
  showMilestones?: boolean
  /** Couleur de la barre de progression */
  color?: 'blue' | 'green' | 'purple' | 'amber'
  /** Taille de la barre */
  size?: 'sm' | 'md' | 'lg'
  /** Classes CSS additionnelles */
  className?: string
  /** Formatter pour les montants */
  formatAmount?: (amount: number) => string
}

// Jalons par défaut avec encouragements
const DEFAULT_MILESTONES: Milestone[] = [
  { percentage: 0, label: 'Départ', icon: Flag },
  { percentage: 25, label: 'Premier quart', icon: Star },
  { percentage: 50, label: 'Mi-parcours', icon: TrendingUp },
  { percentage: 75, label: 'Trois quarts', icon: Target },
  { percentage: 100, label: 'Objectif atteint !', icon: Trophy },
]

// Messages d'encouragement selon la progression
const ENCOURAGEMENT_MESSAGES: Array<{
  minPercent: number
  maxPercent: number
  message: string
  emoji: string
  icon: typeof Star
}> = [
  { minPercent: 0, maxPercent: 0, message: "C'est parti ! Le premier pas est le plus important.", emoji: '🚀', icon: Flag },
  { minPercent: 1, maxPercent: 10, message: "Bon début ! Chaque euro compte.", emoji: '💪', icon: Star },
  { minPercent: 11, maxPercent: 24, message: "Vous progressez bien ! Continuez ainsi.", emoji: '📈', icon: TrendingUp },
  { minPercent: 25, maxPercent: 49, message: "Premier quart franchi ! Vous êtes sur la bonne voie.", emoji: '⭐', icon: Star },
  { minPercent: 50, maxPercent: 74, message: "Mi-parcours atteint ! Plus de la moitié est faite.", emoji: '🎯', icon: Target },
  { minPercent: 75, maxPercent: 89, message: "Excellente progression ! L'objectif est en vue.", emoji: '🏃', icon: Sparkles },
  { minPercent: 90, maxPercent: 99, message: "Presque là ! Encore un petit effort.", emoji: '🔥', icon: Trophy },
  { minPercent: 100, maxPercent: 100, message: "Félicitations ! Objectif atteint !", emoji: '🎉', icon: PartyPopper },
  { minPercent: 101, maxPercent: 1000, message: "Bravo ! Vous avez dépassé votre objectif !", emoji: '🏆', icon: Trophy },
]

const COLOR_CONFIG = {
  blue: {
    bg: 'bg-blue-100',
    fill: 'bg-blue-600',
    text: 'text-blue-600',
    milestone: 'bg-blue-200 border-blue-600',
    milestoneReached: 'bg-blue-600',
  },
  green: {
    bg: 'bg-green-100',
    fill: 'bg-green-600',
    text: 'text-green-600',
    milestone: 'bg-green-200 border-green-600',
    milestoneReached: 'bg-green-600',
  },
  purple: {
    bg: 'bg-purple-100',
    fill: 'bg-purple-600',
    text: 'text-purple-600',
    milestone: 'bg-purple-200 border-purple-600',
    milestoneReached: 'bg-purple-600',
  },
  amber: {
    bg: 'bg-amber-100',
    fill: 'bg-amber-600',
    text: 'text-amber-600',
    milestone: 'bg-amber-200 border-amber-600',
    milestoneReached: 'bg-amber-600',
  },
}

const SIZE_CONFIG = {
  sm: { height: 'h-2', text: 'text-xs', milestone: 'w-3 h-3' },
  md: { height: 'h-3', text: 'text-sm', milestone: 'w-4 h-4' },
  lg: { height: 'h-4', text: 'text-base', milestone: 'w-5 h-5' },
}

export function ProgressMilestone({
  value,
  currentAmount,
  targetAmount,
  milestones = DEFAULT_MILESTONES,
  showEncouragement = true,
  showMilestones = true,
  color = 'blue',
  size = 'md',
  className = '',
  formatAmount = (amount) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 0 
  }).format(amount),
}: ProgressMilestoneProps) {
  const colorConfig = COLOR_CONFIG[color]
  const sizeConfig = SIZE_CONFIG[size]
  const clampedValue = Math.min(Math.max(value, 0), 100)

  // Trouver le message d'encouragement approprié
  const encouragement = useMemo(() => {
    return ENCOURAGEMENT_MESSAGES.find(
      (msg) => value >= msg.minPercent && value <= msg.maxPercent
    ) || ENCOURAGEMENT_MESSAGES[0]
  }, [value])

  // Jalons atteints
  const reachedMilestones = useMemo(() => {
    return milestones.filter((m) => value >= m.percentage)
  }, [milestones, value])

  // Prochain jalon
  const nextMilestone = useMemo(() => {
    return milestones.find((m) => m.percentage > value)
  }, [milestones, value])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Bar with Milestones */}
      <div className="relative">
        {/* Background Bar */}
        <div className={`relative ${sizeConfig.height} ${colorConfig.bg} rounded-full overflow-hidden`}>
          {/* Filled Bar */}
          <div
            className={`absolute inset-y-0 left-0 ${colorConfig.fill} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${clampedValue}%` }}
          />
        </div>

        {/* Milestone Markers */}
        {showMilestones && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            {milestones.map((milestone) => {
              const isReached = value >= milestone.percentage
              const Icon = milestone.icon || Star

              return (
                <div
                  key={milestone.percentage}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${milestone.percentage}%` }}
                  title={milestone.label}
                >
                  <div
                    className={`${sizeConfig.milestone} rounded-full border-2 flex items-center justify-center transition-all ${
                      isReached
                        ? `${colorConfig.milestoneReached} border-white text-white`
                        : `${colorConfig.milestone} bg-white`
                    }`}
                  >
                    {milestone.percentage === 100 && isReached && (
                      <Icon className="h-2.5 w-2.5" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        {/* Current Amount */}
        <div className={sizeConfig.text}>
          {currentAmount !== undefined ? (
            <span className={`font-semibold ${colorConfig.text}`}>
              {formatAmount(currentAmount)}
            </span>
          ) : (
            <span className={`font-semibold ${colorConfig.text}`}>
              {clampedValue}%
            </span>
          )}
          <span className="text-gray-500 ml-1">épargnés</span>
        </div>

        {/* Target Amount */}
        {targetAmount !== undefined && (
          <div className={`${sizeConfig.text} text-gray-500`}>
            Objectif : <span className="font-medium text-gray-700">{formatAmount(targetAmount)}</span>
          </div>
        )}
      </div>

      {/* Encouragement Message */}
      {showEncouragement && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          value >= 100 ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <span className="text-xl" role="img" aria-hidden="true">
            {encouragement.emoji}
          </span>
          <div className="flex-1">
            <p className={`${sizeConfig.text} font-medium ${
              value >= 100 ? 'text-green-700' : 'text-gray-700'
            }`}>
              {encouragement.message}
            </p>
            {nextMilestone && value < 100 && (
              <p className="text-xs text-gray-500 mt-0.5">
                Prochain palier : {nextMilestone.label} à {nextMilestone.percentage}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Milestone Legend (optional, for detailed view) */}
      {showMilestones && value < 100 && (
        <div className="flex flex-wrap gap-2">
          {milestones.slice(1).map((milestone) => {
            const isReached = value >= milestone.percentage
            const Icon = milestone.icon || Star

            return (
              <div
                key={milestone.percentage}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  isReached
                    ? `${colorConfig.bg} ${colorConfig.text}`
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{milestone.percentage}%</span>
                {isReached && <CheckCircle className="h-3 w-3" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProgressMilestone
