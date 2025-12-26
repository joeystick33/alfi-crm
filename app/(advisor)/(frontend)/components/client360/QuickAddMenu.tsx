'use client'

/**
 * Menu d'ajout rapide pour Client360
 * Permet d'ajouter des éléments patrimoniaux, revenus, charges, crédits
 */

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/app/_common/components/ui/DropdownMenu'
import {
  Plus,
  Home,
  Car,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  FileText,
  Target,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import { PatrimoineFormModal, type PatrimoineFormType } from './modals'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface QuickAddMenuProps {
  clientId: string
  client: ClientDetail
  onSuccess?: () => void
  variant?: 'default' | 'compact'
  className?: string
}

// Configuration des actions d'ajout
const ADD_ACTIONS = [
  {
    group: 'Patrimoine',
    items: [
      { id: 'bien_immobilier', label: 'Bien immobilier', icon: Home, color: 'text-blue-600' },
      { id: 'bien_mobilier', label: 'Bien mobilier', icon: Car, color: 'text-[#7373FF]' },
      { id: 'actif_financier', label: 'Actif financier', icon: PiggyBank, color: 'text-green-600' },
    ]
  },
  {
    group: 'Budget',
    items: [
      { id: 'revenu', label: 'Revenu', icon: TrendingUp, color: 'text-emerald-600' },
      { id: 'charge', label: 'Charge', icon: TrendingDown, color: 'text-amber-600' },
      { id: 'credit', label: 'Crédit', icon: CreditCard, color: 'text-rose-600' },
    ]
  },
  {
    group: 'Autres',
    items: [
      { id: 'document', label: 'Document', icon: FileText, color: 'text-gray-600' },
      { id: 'objectif', label: 'Objectif', icon: Target, color: 'text-[#7373FF]' },
      { id: 'rdv', label: 'Rendez-vous', icon: Calendar, color: 'text-purple-600' },
    ]
  },
]

export function QuickAddMenu({ 
  clientId, 
  client, 
  onSuccess, 
  variant = 'default',
  className 
}: QuickAddMenuProps) {
  const [activeModal, setActiveModal] = useState<PatrimoineFormType | null>(null)

  const handleAction = (actionId: string) => {
    // Actions patrimoine/budget ouvrent le modal
    if (['bien_immobilier', 'bien_mobilier', 'actif_financier', 'revenu', 'charge', 'credit'].includes(actionId)) {
      setActiveModal(actionId as PatrimoineFormType)
    } else if (actionId === 'document') {
      // Rediriger vers la page documents avec action d'upload
      window.location.href = `/dashboard/documents?clientId=${clientId}&action=upload`
    } else if (actionId === 'objectif') {
      // Rediriger vers les objectifs du client
      window.location.href = `/dashboard/clients/${clientId}?tab=objectifs&action=new`
    } else if (actionId === 'rdv') {
      // Rediriger vers l'agenda avec pré-remplissage client
      window.location.href = `/dashboard/agenda?clientId=${clientId}&action=new`
    }
  }

  const handleModalClose = () => {
    setActiveModal(null)
  }

  const handleModalSuccess = (_data: unknown) => {
    setActiveModal(null)
    onSuccess?.()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'compact' ? (
            <Button size="sm" className={className}>
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <Button className={className}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {ADD_ACTIONS.map((group, groupIndex) => (
            <div key={group.group}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                {group.group}
              </DropdownMenuLabel>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => handleAction(item.id)}
                    className="cursor-pointer"
                  >
                    <Icon className={`h-4 w-4 mr-3 ${item.color}`} />
                    {item.label}
                  </DropdownMenuItem>
                )
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals patrimoine */}
      {activeModal && (
        <PatrimoineFormModal
          isOpen={true}
          onClose={handleModalClose}
          formType={activeModal}
          clientId={clientId}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  )
}

export default QuickAddMenu
