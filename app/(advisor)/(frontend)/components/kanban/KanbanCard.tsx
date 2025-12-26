 
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface KanbanCardProps<T = any> {
  id: string
  item: T
  renderCard: (card: T, isDragging: boolean) => React.ReactNode
  onCardClick?: (card: T) => void
  onCardEdit?: (card: T) => void
  onCardDelete?: (cardId: string) => Promise<void>
}

export function KanbanCard<T = any>({
  id,
  item,
  renderCard,
  onCardClick,
}: KanbanCardProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onCardClick?.(item)}
      className="touch-none"
    >
      {renderCard(item, isDragging)}
    </div>
  )
}
