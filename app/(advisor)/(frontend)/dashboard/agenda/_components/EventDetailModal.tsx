'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAI } from '@/app/(advisor)/(frontend)/hooks/useAI';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog';
import { Button } from '@/app/_common/components/ui/Button';
import { Badge } from '@/app/_common/components/ui/Badge';
import { useToast } from '@/app/_common/hooks/use-toast';
import {
  Loader2,
  Users,
  Phone,
  Video,
  CheckSquare,
  Bell,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Clock,
  Trash2,
  Edit,
  ExternalLink,
  User,
  Mail,
  Sparkles,
  Copy,
  Check as CheckIcon,
} from 'lucide-react';
import type { CalendarEvent } from './FullCalendarWrapper';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: () => void;
  onDelete: (eventId: string) => void;
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof Users; color: string }> = {
  MEETING: { label: 'Rendez-vous', icon: Users, color: '#4f46e5' },
  CALL: { label: 'Appel', icon: Phone, color: '#0891b2' },
  VIDEO_CALL: { label: 'Visioconférence', icon: Video, color: '#7c3aed' },
  TASK: { label: 'Tâche', icon: CheckSquare, color: '#f59e0b' },
  REMINDER: { label: 'Rappel', icon: Bell, color: '#8b5cf6' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' | 'outline' }> = {
  SCHEDULED: { label: 'Planifié', variant: 'default' },
  CONFIRMED: { label: 'Confirmé', variant: 'success' },
  COMPLETED: { label: 'Terminé', variant: 'outline' },
  CANCELLED: { label: 'Annulé', variant: 'destructive' },
};

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
}: EventDetailModalProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const ai = useAI();

  const typeConfig = event ? (EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.MEETING) : EVENT_TYPE_CONFIG.MEETING;

  const handleAISummarize = useCallback(async () => {
    if (!event?.description) return;
    const summary = await ai.summarizeAppointment(
      event.description,
      event.client?.name || 'Client',
      typeConfig?.label || 'Rendez-vous'
    );
    if (summary) {
      setAiSummary(summary);
      toast({ title: 'Résumé IA généré', description: 'Le compte rendu structuré a été créé.' });
    }
  }, [event, ai, toast, typeConfig]);

  const handleCopySummary = useCallback(() => {
    if (aiSummary) {
      navigator.clipboard.writeText(aiSummary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [aiSummary]);

  if (!event) return null;
  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.SCHEDULED;
  const Icon = typeConfig.icon;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const endpoint = event.type === 'TASK'
        ? `/api/advisor/taches/${event.id}`
        : `/api/advisor/rendez-vous/${event.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });

      if (!res.ok) throw new Error('Erreur suppression');

      toast({
        title: 'Supprimé',
        description: `${event.title} a été supprimé.`,
      });

      onDelete(event.id);
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'événement.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const duration = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
  const durationText = duration >= 60 
    ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}min` : ''}`
    : `${duration} min`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${typeConfig.color}15` }}
            >
              <Icon className="w-6 h-6" style={{ color: typeConfig.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-slate-900 pr-8">
                {event.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: typeConfig.color,
                    color: typeConfig.color,
                  }}
                >
                  {typeConfig.label}
                </Badge>
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900">
                {format(event.start, 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                <span className="text-slate-300">•</span>
                {durationText}
              </p>
            </div>
          </div>

          {/* Client */}
          {event.client && (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <User className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">{event.client.name}</p>
                {event.client.email && (
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {event.client.email}
                  </p>
                )}
                {event.client.phone && (
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {event.client.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Location or Meeting URL */}
          {event.isVirtual && event.meetingUrl ? (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <Video className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">Visioconférence</p>
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 truncate"
                >
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{event.meetingUrl}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>
          ) : event.location ? (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Lieu</p>
                <p className="text-sm text-slate-500">{event.location}</p>
              </div>
            </div>
          ) : null}

          {/* Description */}
          {event.description && (
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-slate-700">Description</p>
                {ai.isAvailable && (
                  <button
                    onClick={handleAISummarize}
                    disabled={ai.isLoading}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {ai.isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Résumer par IA
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* AI Summary */}
          {aiSummary && (
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Résumé IA
                </p>
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  {isCopied ? <CheckIcon className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {isCopied ? 'Copié' : 'Copier'}
                </button>
              </div>
              <p className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">
                {aiSummary}
              </p>
            </div>
          )}

          {/* Recurring indicator */}
          {event.isRecurring && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              Événement récurrent
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showDeleteConfirm ? (
            <>
              <p className="text-sm text-slate-500 mr-auto">Confirmer la suppression ?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirmer'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Fermer
                </Button>
                <Button
                  size="sm"
                  onClick={onEdit}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
