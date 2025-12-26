'use client'

/**
 * CollapsibleSection - Section collapsible/dépliable pour formulaires
 * Permet d'harmoniser les formulaires longs avec des sections repliables
 * Mode accordéon : une seule section ouverte à la fois pour optimiser l'écran
 */

import { useState, ReactNode, createContext, useContext, useCallback } from 'react'
import { cn } from '@/app/_common/lib/utils'
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react'

// =============================================================================
// Context pour le mode accordéon
// =============================================================================

interface AccordionContextValue {
  openSectionId: string | null
  setOpenSection: (id: string | null) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

function useAccordion() {
  return useContext(AccordionContext)
}

// =============================================================================
// Types
// =============================================================================

interface CollapsibleSectionProps {
  /** ID unique de la section (requis pour le mode accordéon) */
  id?: string
  /** Titre de la section */
  title: string
  /** Description optionnelle */
  description?: string
  /** Icône optionnelle */
  icon?: LucideIcon
  /** Couleur de l'icône */
  iconColor?: string
  /** Enfants (contenu de la section) */
  children: ReactNode
  /** Section ouverte par défaut */
  defaultOpen?: boolean
  /** État contrôlé de l'ouverture */
  isOpen?: boolean
  /** Variante de style */
  variant?: 'default' | 'card' | 'outlined' | 'ghost'
  /** Badge optionnel (ex: "Obligatoire", nombre d'éléments) */
  badge?: string | number
  /** Couleur du badge */
  badgeColor?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray'
  /** Indicateur de champs requis dans la section */
  hasRequired?: boolean
  /** Indicateur d'erreur dans la section */
  hasError?: boolean
  /** Callback quand on ouvre/ferme */
  onToggle?: (isOpen: boolean) => void
  /** Classes additionnelles */
  className?: string
}

const badgeColors = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
}

const variantStyles = {
  default: {
    container: 'border rounded-lg bg-white shadow-sm',
    header: 'px-4 py-3 hover:bg-gray-50',
    content: 'px-4 pb-4',
  },
  card: {
    container: 'border rounded-xl bg-white shadow-md',
    header: 'px-5 py-4 hover:bg-gray-50/50',
    content: 'px-5 pb-5',
  },
  outlined: {
    container: 'border-2 rounded-lg bg-transparent',
    header: 'px-4 py-3 hover:bg-gray-50/50',
    content: 'px-4 pb-4',
  },
  ghost: {
    container: 'bg-gray-50/50 rounded-lg',
    header: 'px-4 py-3 hover:bg-gray-100/50',
    content: 'px-4 pb-4',
  },
}

export function CollapsibleSection({
  id,
  title,
  description,
  icon: Icon,
  iconColor = 'text-gray-600',
  children,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  variant = 'default',
  badge,
  badgeColor = 'gray',
  hasRequired = false,
  hasError = false,
  onToggle,
  className,
}: CollapsibleSectionProps) {
  const accordion = useAccordion()
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)
  
  // Determine if this section is open
  // Priority: accordion context > controlled prop > internal state
  const isOpen = accordion 
    ? accordion.openSectionId === id 
    : controlledIsOpen !== undefined 
      ? controlledIsOpen 
      : internalIsOpen
  
  const styles = variantStyles[variant]

  const handleToggle = () => {
    if (accordion && id) {
      // Mode accordéon: ferme si déjà ouvert, sinon ouvre cette section
      accordion.setOpenSection(isOpen ? null : id)
    } else {
      // Mode normal
      const newState = !isOpen
      setInternalIsOpen(newState)
      onToggle?.(newState)
    }
  }

  return (
    <div
      className={cn(
        styles.container,
        hasError && 'border-red-300 bg-red-50/30',
        className
      )}
    >
      {/* Header cliquable */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          styles.header,
          'w-full flex items-center justify-between cursor-pointer transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-t-lg'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Chevron */}
          <div className="flex-shrink-0 text-gray-400">
            {isOpen ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>

          {/* Icône optionnelle */}
          {Icon && (
            <div className={cn('flex-shrink-0', iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          )}

          {/* Titre et description */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{title}</span>
              {hasRequired && (
                <span className="text-red-500 text-xs">*</span>
              )}
              {hasError && (
                <span className="text-xs text-red-600 font-medium">Erreur</span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* Badge optionnel */}
        {badge !== undefined && badge !== null && (
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              badgeColors[badgeColor]
            )}
          >
            {badge}
          </span>
        )}
      </button>

      {/* Contenu collapsible */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}

/**
 * Groupe de sections collapsibles avec accordéon optionnel
 * Mode accordéon : une seule section ouverte à la fois pour optimiser l'écran
 */
interface CollapsibleGroupProps {
  children: ReactNode
  /** Mode accordéon : une seule section ouverte à la fois */
  accordion?: boolean
  /** ID de la section ouverte par défaut (mode accordéon) */
  defaultOpenId?: string
  /** Espacement entre sections */
  spacing?: 'sm' | 'md' | 'lg'
  /** Callback quand une section change */
  onSectionChange?: (sectionId: string | null) => void
  className?: string
}

export function CollapsibleGroup({
  children,
  accordion = false,
  defaultOpenId,
  spacing = 'md',
  onSectionChange,
  className,
}: CollapsibleGroupProps) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(defaultOpenId || null)
  
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
  }

  const handleSetOpenSection = useCallback((id: string | null) => {
    setOpenSectionId(id)
    onSectionChange?.(id)
  }, [onSectionChange])

  // Si mode accordéon, fournir le context
  if (accordion) {
    return (
      <AccordionContext.Provider value={{ openSectionId, setOpenSection: handleSetOpenSection }}>
        <div className={cn(spacingClasses[spacing], className)}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
  
  // Mode normal sans accordéon
  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}

export default CollapsibleSection
