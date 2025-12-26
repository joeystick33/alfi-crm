'use client'

/**
 * LockedFeatureCard - Carte affichée quand une feature premium n'est pas accessible
 * 
 * Affiche:
 * - Icône de la feature
 * - Nom et description
 * - Plan requis
 * - Bouton pour contacter / upgrader
 * 
 * Design: Thème light solid (pas de glassmorphism)
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import {
  Lock,
  Sparkles,
  ArrowRight,
  Crown,
  // Icons dynamiques
  Briefcase,
  PiggyBank,
  Shield,
  Home,
  Users,
  HeartPulse,
  Gift,
  TrendingUp,
  Key,
  Calculator,
  Calendar,
  Receipt,
  Building2,
  Wallet,
  FileText,
  Table,
  Code,
  Paintbrush,
  Bell,
  History,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface LockedFeatureCardProps {
  /** Code de la feature */
  featureCode: string
  
  /** Nom affiché de la feature */
  featureName: string
  
  /** Description de la feature */
  featureDescription?: string
  
  /** Plan minimum requis */
  requiredPlan: string
  
  /** Nom de l'icône Lucide */
  icon?: string
  
  /** Affichage minimal (sans description détaillée) */
  minimal?: boolean
  
  /** Callback au clic sur le bouton upgrade */
  onUpgradeClick?: () => void
  
  /** Classe CSS personnalisée */
  className?: string
}

// =============================================================================
// Mapping des icônes
// =============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  PiggyBank,
  Shield,
  Home,
  Users,
  HeartPulse,
  Gift,
  TrendingUp,
  Key,
  Calculator,
  Calendar,
  Receipt,
  Building2,
  Wallet,
  FileText,
  Table,
  Code,
  Paintbrush,
  Bell,
  History,
  Lock,
}

function getIcon(iconName?: string): LucideIcon {
  if (!iconName) return Lock
  return ICON_MAP[iconName] || Lock
}

// =============================================================================
// Mapping des couleurs par plan
// =============================================================================

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TRIAL: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  STARTER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  BUSINESS: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  PREMIUM: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  ENTERPRISE: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
}

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'Essai',
  STARTER: 'Starter',
  BUSINESS: 'Business',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
}

// =============================================================================
// Composant principal
// =============================================================================

export function LockedFeatureCard({
  featureCode,
  featureName,
  featureDescription,
  requiredPlan,
  icon,
  minimal = false,
  onUpgradeClick,
  className = '',
}: LockedFeatureCardProps) {
  const IconComponent = getIcon(icon)
  const planColors = PLAN_COLORS[requiredPlan] || PLAN_COLORS.PREMIUM
  const planLabel = PLAN_LABELS[requiredPlan] || requiredPlan
  
  // Version minimale
  if (minimal) {
    return (
      <div className={`
        flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50
        ${className}
      `}>
        <div className="p-2 rounded-lg bg-gray-100">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            {featureName}
          </p>
          <p className="text-xs text-gray-500">
            Disponible avec le plan {planLabel}
          </p>
        </div>
        <Badge variant="outline" className={`${planColors.bg} ${planColors.text} ${planColors.border}`}>
          {planLabel}
        </Badge>
      </div>
    )
  }
  
  // Version complète
  return (
    <Card className={`
      relative overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50
      ${className}
    `}>
      {/* Badge Premium en haut à droite */}
      <div className="absolute top-4 right-4">
        <Badge className={`${planColors.bg} ${planColors.text} ${planColors.border} gap-1`}>
          <Crown className="h-3 w-3" />
          {planLabel}
        </Badge>
      </div>
      
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Icône avec overlay lock */}
          <div className="relative">
            <div className={`p-3 rounded-xl ${planColors.bg}`}>
              <IconComponent className={`h-8 w-8 ${planColors.text}`} />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-sm border border-gray-200">
              <Lock className="h-3 w-3 text-gray-400" />
            </div>
          </div>
          
          <div className="flex-1 pt-1">
            <CardTitle className="text-lg text-gray-700">
              {featureName}
            </CardTitle>
            {featureDescription && (
              <CardDescription className="mt-1 text-gray-500">
                {featureDescription}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Message d'upgrade */}
        <div className="p-4 rounded-lg bg-white border border-gray-200">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                Débloquez cette fonctionnalité
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Cette fonctionnalité est disponible à partir du plan{' '}
                <span className={`font-medium ${planColors.text}`}>{planLabel}</span>.
                Contactez votre administrateur pour upgrader votre abonnement.
              </p>
            </div>
          </div>
          
          {/* Bouton d'action */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onUpgradeClick}
            >
              En savoir plus
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Avantages du plan */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Inclus dans {planLabel}
          </p>
          <ul className="space-y-1">
            {getPlanAdvantages(requiredPlan).map((advantage, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {advantage}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Avantages par plan
// =============================================================================

function getPlanAdvantages(plan: string): string[] {
  switch (plan) {
    case 'STARTER':
      return [
        'Simulateurs de base (Retraite, PER, Épargne)',
        'Calculateur IR et capacité d\'endettement',
        'Export PDF',
        '200 clients maximum',
      ]
    case 'BUSINESS':
      return [
        'Tous les simulateurs de base + avancés',
        'Calculateurs fiscaux complets',
        'Portail client',
        'Notifications proactives',
        'Historique des synthèses',
        '1000 clients maximum',
      ]
    case 'PREMIUM':
      return [
        'Tous les simulateurs et calculateurs',
        'Succession et donation avancés',
        'Export Excel',
        'Support prioritaire',
        '5000 clients maximum',
      ]
    case 'ENTERPRISE':
      return [
        'Toutes les fonctionnalités',
        'Accès API',
        'Marque blanche',
        'Clients illimités',
        'Support dédié',
      ]
    default:
      return [
        'Fonctionnalités premium',
        'Support prioritaire',
      ]
  }
}

// =============================================================================
// Composant pour liste de features verrouillées
// =============================================================================

export interface LockedFeaturesListProps {
  features: Array<{
    code: string
    name: string
    description?: string
    icon?: string
    requiredPlan: string
  }>
  onFeatureClick?: (featureCode: string) => void
}

export function LockedFeaturesList({
  features,
  onFeatureClick,
}: LockedFeaturesListProps) {
  if (features.length === 0) return null
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Lock className="h-4 w-4" />
        Fonctionnalités premium disponibles
      </h3>
      <div className="grid gap-2">
        {features.map((feature) => (
          <LockedFeatureCard
            key={feature.code}
            featureCode={feature.code}
            featureName={feature.name}
            featureDescription={feature.description}
            requiredPlan={feature.requiredPlan}
            icon={feature.icon}
            minimal
            onUpgradeClick={() => onFeatureClick?.(feature.code)}
          />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Export par défaut
// =============================================================================

export default LockedFeatureCard
