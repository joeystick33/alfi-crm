'use client'
 

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { LoadingState } from '@/app/_common/components/ui/LoadingState'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Inbox } from 'lucide-react'

export interface KanbanColumnData<T = any> {
  id: string
  title: string
  color: string
  headerColor: string
  items: T[]
  count: number
  metadata?: Record<string, any>
}

export interface KanbanBoardProps<T = any> {
  columns: KanbanColumnData<T>[]
  onCardMove: (cardId: string, fromColumnId: string, toColumnId: string) => Promise<void>
  onCardClick?: (card: T) => void
  onCardEdit?: (card: T) => void
  onCardDelete?: (cardId: string) => Promise<void>
  renderCard: (card: T, isDragging: boolean) => React.ReactNode
  getCardId: (card: T) => string
  isLoading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  className?: string
}

export function KanbanBoard<T = any>({
  columns,
  onCardMove,
  onCardClick,
  onCardEdit,
  onCardDelete,
  renderCard,
  getCardId,
  isLoading = false,
  emptyMessage = 'Aucun élément',
  emptyDescription = 'Commencez par créer votre premier élément.',
  className = '',
}: KanbanBoardProps<T>) {
  const [activeCard, setActiveCard] = useState<T | null>(null)
  const [dragging, setDragging] = useState(false)

  // Configure sensors pour drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum 8px de mouvement pour activer le drag
      },
    })
  )

  // Détecter début du drag
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const cardId = active.id as string

      // Trouver la carte active
      for (const column of columns) {
        const card = column.items.find((item) => getCardId(item) === cardId)
        if (card) {
          setActiveCard(card)
          setDragging(true)
          break
        }
      }
    },
    [columns, getCardId]
  )

  // Gérer fin du drag
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      setDragging(false)
      setActiveCard(null)

      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // Si dropped sur la même colonne, rien à faire
      if (activeId === overId) return

      // Trouver la colonne source
      const sourceColumn = columns.find((col) =>
        col.items.some((item) => getCardId(item) === activeId)
      )

      // Déterminer la colonne de destination
      // overId peut être un ID de colonne ou un ID de carte
      let targetColumn = columns.find((col) => col.id === overId)

      if (!targetColumn) {
        // Si overId est un ID de carte, trouver sa colonne
        targetColumn = columns.find((col) =>
          col.items.some((item) => getCardId(item) === overId)
        )
      }

      if (!sourceColumn || !targetColumn || sourceColumn.id === targetColumn.id) {
        return
      }

      // Appeler callback de déplacement
      try {
        await onCardMove(activeId, sourceColumn.id, targetColumn.id)
      } catch (error) {
        console.error('Erreur lors du déplacement de la carte:', error)
        // L'erreur est gérée par le parent (toast)
      }
    },
    [columns, getCardId, onCardMove]
  )

  // Calculer le total d'éléments
  const totalItems = columns.reduce((sum, col) => sum + col.count, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState />
      </div>
    )
  }

  if (totalItems === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyMessage}
        description={emptyDescription}
      />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`flex gap-6 overflow-x-auto pb-6 ${className}`}>
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            renderCard={renderCard}
            getCardId={getCardId}
            onCardClick={onCardClick}
            onCardEdit={onCardEdit}
            onCardDelete={onCardDelete}
            isDragging={dragging}
          />
        ))}
      </div>

      {/* Drag overlay pour preview de la carte en cours de drag */}
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 opacity-90 cursor-grabbing">
            {renderCard(activeCard, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
