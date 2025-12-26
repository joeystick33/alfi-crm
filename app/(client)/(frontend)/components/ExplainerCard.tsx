'use client'

/**
 * ExplainerCard - Composant pédagogique
 * 
 * Carte d'explication contextuelle pour aider les clients
 * à comprendre les concepts financiers et les fonctionnalités.
 * 
 * Variants:
 * - info: Explication générale (bleu)
 * - tip: Conseil/astuce (ambre)
 * - success: Confirmation/encouragement (vert)
 * - warning: Attention/action requise (orange)
 */

import React from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import {
  Info,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  X,
} from 'lucide-react'

export type ExplainerVariant = 'info' | 'tip' | 'success' | 'warning'

export interface ExplainerCardProps {
  /** Titre de la carte */
  title: string
  /** Contenu explicatif */
  children: React.ReactNode
  /** Variante visuelle */
  variant?: ExplainerVariant
  /** Lien "En savoir plus" optionnel */
  learnMoreLink?: string
  /** Texte du lien (défaut: "En savoir plus") */
  learnMoreText?: string
  /** Callback au clic sur le lien */
  onLearnMore?: () => void
  /** Permettre de fermer la carte */
  dismissible?: boolean
  /** Callback à la fermeture */
  onDismiss?: () => void
  /** Afficher l'icône d'aide à côté du titre */
  showHelpIcon?: boolean
  /** Classes CSS additionnelles */
  className?: string
}

const VARIANT_CONFIG: Record<ExplainerVariant, {
  icon: typeof Info
  bgColor: string
  borderColor: string
  iconColor: string
  titleColor: string
  textColor: string
}> = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-700',
  },
  tip: {
    icon: Lightbulb,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-700',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    textColor: 'text-green-700',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
    titleColor: 'text-orange-900',
    textColor: 'text-orange-700',
  },
}

export function ExplainerCard({
  title,
  children,
  variant = 'info',
  learnMoreLink,
  learnMoreText = 'En savoir plus',
  onLearnMore,
  dismissible = false,
  onDismiss,
  showHelpIcon = false,
  className = '',
}: ExplainerCardProps) {
  const config = VARIANT_CONFIG[variant]
  const Icon = config.icon

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore()
    } else if (learnMoreLink) {
      window.open(learnMoreLink, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-center gap-2">
              <p className={`font-medium ${config.titleColor}`}>
                {title}
              </p>
              {showHelpIcon && (
                <HelpCircle className={`h-4 w-4 ${config.iconColor} opacity-60`} />
              )}
            </div>

            {/* Body */}
            <div className={`text-sm ${config.textColor} mt-1`}>
              {children}
            </div>

            {/* Learn More Link */}
            {(learnMoreLink || onLearnMore) && (
              <button
                onClick={handleLearnMore}
                className={`inline-flex items-center gap-1 text-sm font-medium ${config.iconColor} hover:underline mt-2`}
              >
                {learnMoreText}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dismiss Button */}
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={`${config.iconColor} hover:opacity-70 transition-opacity`}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ExplainerCard
