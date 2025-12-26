 
'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import { Badge } from '@/app/_common/components/ui/Badge'
import type { KanbanColumnData } from './KanbanBoard'

interface KanbanColumnProps<T = any> {
  column: KanbanColumnData<T>
  renderCard: (card: T, isDragging: boolean) => React.ReactNode
  getCardId: (card: T) => string
  onCardClick?: (card: T) => void
  onCardEdit?: (card: T) => void
  onCardDelete?: (cardId: string) => Promise<void>
  isDragging: boolean
}

export function KanbanColumn<T = any>({
  column,
  renderCard,
  getCardId,
  onCardClick,
  onCardEdit,
  onCardDelete,
  isDragging,
}: KanbanColumnProps<T>) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  // Extract card IDs for SortableContext
  const cardIds = column.items.map((item) => getCardId(item))

  return (
    <div className="flex flex-col min-w-[320px] w-80 flex-shrink-0">
      {/* Column Header */}
      <div className={`${column.headerColor} px-4 py-3 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-white/30 font-semibold"
          >
            {column.count}
          </Badge>
        </div>

        {/* Metadata (ex: valeur totale pour opportunités) */}
        {column.metadata && Object.keys(column.metadata).length > 0 && (
          <div className="mt-2 text-xs opacity-90">
            {Object.entries(column.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          ${column.color}
          flex-1 p-3 rounded-b-lg border-2 transition-all
          ${isOver ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'}
          min-h-[200px]
        `}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {column.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">Aucun élément</p>
              </div>
            ) : (
              column.items.map((item) => (
                <KanbanCard
                  key={getCardId(item)}
                  id={getCardId(item)}
                  item={item}
                  renderCard={renderCard}
                  onCardClick={onCardClick}
                  onCardEdit={onCardEdit}
                  onCardDelete={onCardDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
