import { useState, useCallback } from 'react';

/**
 * Custom hook for drag and drop functionality
 */
export function useDragAndDrop({ onDrop, onConflict }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((item, event) => {
    setDraggedItem(item);
    setIsDragging(true);
    
    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify(item));
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDropTarget(null);
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((target, event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    setDropTarget(target);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((target, event) => {
    event.preventDefault();
    
    if (!draggedItem) return;

    // Check for conflicts if callback provided
    if (onConflict) {
      const hasConflict = onConflict(draggedItem, target);
      if (hasConflict) {
        handleDragEnd();
        return;
      }
    }

    // Execute drop callback
    if (onDrop) {
      onDrop(draggedItem, target);
    }

    handleDragEnd();
  }, [draggedItem, onDrop, onConflict, handleDragEnd]);

  return {
    draggedItem,
    dropTarget,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}

/**
 * Check if two appointments conflict
 */
export function checkAppointmentConflict(appointment1, appointment2) {
  const start1 = new Date(appointment1.dateDebut);
  const end1 = new Date(appointment1.dateFin);
  const start2 = new Date(appointment2.dateDebut);
  const end2 = new Date(appointment2.dateFin);

  // Check if appointments overlap
  return (start1 < end2 && end1 > start2);
}

/**
 * Calculate new appointment time based on drop position
 */
export function calculateNewAppointmentTime(appointment, targetDate, targetHour) {
  const originalStart = new Date(appointment.dateDebut);
  const originalEnd = new Date(appointment.dateFin);
  const duration = originalEnd - originalStart;

  // Create new start time
  const newStart = new Date(targetDate);
  if (targetHour !== undefined) {
    newStart.setHours(targetHour, 0, 0, 0);
  } else {
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
  }

  // Calculate new end time
  const newEnd = new Date(newStart.getTime() + duration);

  return {
    dateDebut: newStart.toISOString(),
    dateFin: newEnd.toISOString()
  };
}
