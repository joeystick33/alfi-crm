'use client';

import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';

export default function ConflictWarningModal({
  isOpen,
  onClose,
  onConfirm,
  draggedAppointment,
  conflictingAppointments,
  newTime
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Conflit de rendez-vous détecté
            </h3>
            <p className="text-sm text-gray-600">
              Le créneau horaire sélectionné chevauche {conflictingAppointments?.length || 0} autre(s) rendez-vous.
            </p>
          </div>
        </div>

        {/* Dragged Appointment Info */}
        {draggedAppointment && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-medium text-blue-900 mb-1">
              Rendez-vous à déplacer:
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {draggedAppointment.titre}
            </p>
            {newTime && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>{format(parseISO(newTime.dateDebut), 'EEE d MMM', { locale: fr })}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>
                  {format(parseISO(newTime.dateDebut), 'HH:mm')} - {format(parseISO(newTime.dateFin), 'HH:mm')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Conflicting Appointments */}
        {conflictingAppointments && conflictingAppointments.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Rendez-vous en conflit:
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {conflictingAppointments.map((apt) => (
                <div 
                  key={apt._id} 
                  className="p-2 bg-red-50 rounded border border-red-200"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {apt.titre}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(parseISO(apt.dateDebut), 'HH:mm')} - {format(parseISO(apt.dateFin), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            Déplacer quand même
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Vous pouvez déplacer le rendez-vous malgré le conflit, mais vous devrez peut-être ajuster les horaires manuellement.
        </p>
      </div>
    </div>
  );
}
