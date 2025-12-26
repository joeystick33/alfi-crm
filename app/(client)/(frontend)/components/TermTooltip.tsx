'use client'

/**
 * TermTooltip - Composant pédagogique
 * 
 * Affiche une infobulle explicative au survol d'un terme technique.
 * Permet aux clients non-professionnels de comprendre le jargon financier.
 * 
 * Usage:
 * <TermTooltip term="PER">
 *   Plan d'Épargne Retraite : une épargne pour votre retraite avec avantages fiscaux
 * </TermTooltip>
 */

import React, { useState, useRef, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

export interface TermTooltipProps {
  /** Le terme technique à afficher */
  term: string
  /** L'explication du terme */
  children: React.ReactNode
  /** Position du tooltip (défaut: top) */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Afficher l'icône d'aide */
  showIcon?: boolean
  /** Style du terme (défaut: underline dashed) */
  termStyle?: 'underline' | 'highlight' | 'plain'
  /** Largeur max du tooltip en pixels */
  maxWidth?: number
}

// Dictionnaire de termes financiers courants avec définitions
export const FINANCIAL_TERMS: Record<string, string> = {
  // Types de contrats
  'Assurance vie': 'Un placement qui combine épargne et transmission. Votre argent peut être investi sur différents supports avec une fiscalité avantageuse.',
  'PER': 'Plan d\'Épargne Retraite : une épargne bloquée jusqu\'à la retraite avec des avantages fiscaux immédiats.',
  'PEA': 'Plan d\'Épargne en Actions : un compte-titres pour investir en bourse avec une fiscalité allégée après 5 ans.',
  'SCPI': 'Société Civile de Placement Immobilier : un investissement immobilier collectif où vous détenez des parts d\'un parc immobilier.',
  
  // Termes patrimoniaux
  'Actifs': 'Ce que vous possédez : immobilier, épargne, placements, véhicules...',
  'Passifs': 'Ce que vous devez : crédits immobiliers, crédits à la consommation...',
  'Patrimoine net': 'La différence entre vos actifs (ce que vous possédez) et vos passifs (ce que vous devez).',
  'Diversification': 'Répartir vos placements sur différents types d\'investissements pour réduire les risques.',
  
  // Fiscalité
  'Avantage fiscal': 'Une réduction d\'impôt accordée par l\'État pour encourager certains placements.',
  'Plus-value': 'Le gain réalisé lors de la vente d\'un bien ou d\'un placement (différence entre prix de vente et prix d\'achat).',
  'Prélèvements sociaux': 'Des cotisations prélevées sur certains revenus (épargne, placements) au taux de 17,2%.',
  
  // Objectifs
  'Horizon de placement': 'La durée pendant laquelle vous prévoyez de garder votre argent investi.',
  'Profil de risque': 'Votre capacité et votre tolérance à accepter des fluctuations de valeur de vos placements.',
  'Rendement': 'Le gain généré par un placement, généralement exprimé en pourcentage annuel.',
}

export function TermTooltip({
  term,
  children,
  position = 'top',
  showIcon = true,
  termStyle = 'underline',
  maxWidth = 300,
}: TermTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fermer le tooltip en cliquant ailleurs (mobile)
  useEffect(() => {
    if (!isMobile || !isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isVisible])

  const handleInteraction = () => {
    if (isMobile) {
      setIsVisible(!isVisible)
    }
  }

  // Styles pour le terme
  const termStyleClasses = {
    underline: 'underline decoration-dotted decoration-blue-400 underline-offset-2',
    highlight: 'bg-blue-100 px-1 rounded',
    plain: '',
  }

  // Position du tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  // Arrow position
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent',
  }

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center gap-1 cursor-help ${termStyleClasses[termStyle]}`}
      onMouseEnter={() => !isMobile && setIsVisible(true)}
      onMouseLeave={() => !isMobile && setIsVisible(false)}
      onClick={handleInteraction}
      role="button"
      aria-describedby={isVisible ? `tooltip-${term.replace(/\s/g, '-')}` : undefined}
    >
      <span className="text-blue-700 font-medium">{term}</span>
      {showIcon && (
        <HelpCircle className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
      )}

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={`tooltip-${term.replace(/\s/g, '-')}`}
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]}`}
          style={{ maxWidth }}
        >
          <div className="relative bg-gray-800 text-white text-sm rounded-lg p-3 shadow-lg">
            {/* Header with term */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-blue-300">{term}</span>
              {isMobile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsVisible(false)
                  }}
                  className="text-gray-400 hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Definition */}
            <div className="text-gray-200 leading-relaxed">
              {children}
            </div>

            {/* Arrow */}
            <span
              className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </span>
  )
}

/**
 * Helper pour créer un TermTooltip à partir du dictionnaire
 */
export function FinancialTerm({ term }: { term: keyof typeof FINANCIAL_TERMS }) {
  const definition = FINANCIAL_TERMS[term]
  if (!definition) {
    console.warn(`Term "${term}" not found in FINANCIAL_TERMS dictionary`)
    return <span>{term}</span>
  }
  return <TermTooltip term={term}>{definition}</TermTooltip>
}

export default TermTooltip
