/**
 * Composants pédagogiques du portail client
 * 
 * Ces composants sont conçus pour aider les clients non-professionnels
 * à comprendre les concepts financiers et naviguer dans leur espace.
 */

// Carte d'explication contextuelle
export { ExplainerCard } from './ExplainerCard'
export type { ExplainerCardProps, ExplainerVariant } from './ExplainerCard'

// Tooltip pour termes techniques
export { TermTooltip, FinancialTerm, FINANCIAL_TERMS } from './TermTooltip'
export type { TermTooltipProps } from './TermTooltip'

// Barre de progression avec jalons et encouragements
export { ProgressMilestone } from './ProgressMilestone'
export type { ProgressMilestoneProps, Milestone } from './ProgressMilestone'

// Tour guidé pour nouveaux utilisateurs
export { GuidedTour, DEFAULT_CLIENT_PORTAL_TOUR } from './GuidedTour'
export type { GuidedTourProps, TourStep } from './GuidedTour'
