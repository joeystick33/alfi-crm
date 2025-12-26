'use client';

import { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  GripVertical,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/app/_common/lib/utils';
import { Badge } from '@/app/_common/components/ui/Badge';

const STATUS_COLORS = {
  PLANIFIE: 'bg-blue-100 text-blue-700 border-blue-200',
  CONFIRME: 'bg-green-100 text-green-700 border-green-200',
  ANNULE: 'bg-red-100 text-red-700 border-red-200',
  TERMINE: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function DraggableAppointment({
  appointment,
  onDragStart,
  onDragEnd,
  isDragging,
  isDropTarget,
  hasConflict,
  showDate = true,
  onClick
}) {
  const [isHovered, setIsHovered] = useState(false);
  const startDate = parseISO(appointment.dateDebut);
  const endDate = parseISO(appointment.dateFin);

  const handleDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) {
      onDragStart(appointment, e);
    }
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleClick = (_e) => {
    if (!isDragging && onClick) {
      onClick(appointment);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative p-3 rounded-lg border transition-all cursor-move',
        isDragging && 'opacity-50 scale-95',
        isDropTarget && 'ring-2 ring-blue-500 ring-offset-2',
        hasConflict && 'ring-2 ring-red-500 ring-offset-2',
        !isDragging && !hasConflict && 'hover:shadow-md hover:border-blue-300',
        STATUS_COLORS[appointment.statut] || 'bg-white border-gray-200'
      )}
    >
      {/* Drag Handle */}
      <div
        className={cn(
          'absolute left-1 top-1/2 -translate-y-1/2 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Conflict Warning */}
      {hasConflict && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
          <AlertTriangle className="h-3 w-3" />
        </div>
      )}

      <div className="flex items-start justify-between mb-2 pl-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
            {appointment.titre}
          </h4>
          
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {showDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(startDate, 'EEE d MMM', { locale: fr })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
            </span>
          </div>
        </div>

        <Badge 
          className={cn(
            'text-xs',
            STATUS_COLORS[appointment.statut] || STATUS_COLORS.PLANIFIE
          )}
        >
          {appointment.statut}
        </Badge>
      </div>

      {appointment.clientId && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1 pl-4">
          <User className="h-3 w-3" />
          <span className="truncate">
            {appointment.clientId.prenom} {appointment.clientId.nom}
          </span>
        </div>
      )}

      {appointment.lieu && (
        <div className="flex items-center gap-1 text-xs text-gray-600 pl-4">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{appointment.lieu}</span>
        </div>
      )}

      {/* Dragging Indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
          <p className="text-xs font-medium text-blue-700">Déplacement...</p>
        </div>
      )}
    </div>
  );
}
