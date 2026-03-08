'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog';
import { Button } from '@/app/_common/components/ui/Button';
import { Input } from '@/app/_common/components/ui/Input';
import { Label } from '@/app/_common/components/ui/Label';
import { Textarea } from '@/app/_common/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select';
import { Switch } from '@/app/_common/components/ui/Switch';
import { useToast } from '@/app/_common/hooks/use-toast';
import { cn } from '@/lib/utils';
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
  Repeat,
} from 'lucide-react';
import type { CalendarEvent } from './FullCalendarWrapper';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  slot: { start: Date; end: Date } | null;
  onSave: (event: CalendarEvent) => void;
}

const EVENT_TYPES = [
  { value: 'MEETING', label: 'Rendez-vous', icon: Users, color: '#4f46e5' },
  { value: 'CALL', label: 'Appel téléphonique', icon: Phone, color: '#0891b2' },
  { value: 'VIDEO_CALL', label: 'Visioconférence', icon: Video, color: '#7c3aed' },
  { value: 'TASK', label: 'Tâche', icon: CheckSquare, color: '#f59e0b' },
  { value: 'REMINDER', label: 'Rappel', icon: Bell, color: '#8b5cf6' },
];

const RDV_TYPES = [
  { value: 'PREMIER_RDV', label: 'Premier rendez-vous' },
  { value: 'SUIVI', label: 'Suivi' },
  { value: 'BILAN_ANNUEL', label: 'Bilan annuel' },
  { value: 'SIGNATURE', label: 'Signature' },
  { value: 'AUTRE', label: 'Autre' },
];

const TASK_PRIORITIES = [
  { value: 'BASSE', label: 'Basse', color: 'bg-slate-100 text-slate-600' },
  { value: 'MOYENNE', label: 'Moyenne', color: 'bg-blue-100 text-blue-600' },
  { value: 'HAUTE', label: 'Haute', color: 'bg-orange-100 text-orange-600' },
  { value: 'URGENTE', label: 'Urgente', color: 'bg-red-100 text-red-600' },
];

export function EventModal({ isOpen, onClose, event, slot, onSave }: EventModalProps) {
  const { toast } = useToast();
  const isEditing = !!event;

  // Form state
  const [eventType, setEventType] = useState<string>('MEETING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [rdvType, setRdvType] = useState('PREMIER_RDV');
  const [clientId, setClientId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState('WEEKLY');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceUntil, setRecurrenceUntil] = useState('');
  const [taskPriority, setTaskPriority] = useState('MOYENNE');

  // Clients
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Saving
  const [isSaving, setIsSaving] = useState(false);

  // Load clients
  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const res = await fetch('/api/advisor/clients?limit=100');
      const json = await res.json();
      const data = json.data || [];
      const formatted = (Array.isArray(data) ? data : []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || (c.email as string) || 'Client',
      }));
      setClients(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen, loadClients]);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode
        setEventType(event.type);
        setTitle(event.title);
        setDescription(event.description || '');
        setDate(format(event.start, 'yyyy-MM-dd'));
        setStartTime(format(event.start, 'HH:mm'));
        setEndTime(format(event.end, 'HH:mm'));
        setClientId(event.clientId || null);
        setLocation(event.location || '');
        setIsVirtual(event.isVirtual || false);
        setMeetingUrl(event.meetingUrl || '');
        setIsRecurring(event.isRecurring || false);
      } else if (slot) {
        // Create mode with slot
        setEventType('MEETING');
        setTitle('');
        setDescription('');
        setDate(format(slot.start, 'yyyy-MM-dd'));
        setStartTime(format(slot.start, 'HH:mm'));
        setEndTime(format(slot.end, 'HH:mm'));
        setClientId(null);
        setLocation('');
        setIsVirtual(false);
        setMeetingUrl('');
        setIsRecurring(false);
        setRdvType('PREMIER_RDV');
        setTaskPriority('MOYENNE');
      }
    }
  }, [isOpen, event, slot]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le titre est requis.',
        variant: 'destructive',
      });
      return;
    }

    if (!date || !startTime) {
      toast({
        title: 'Erreur',
        description: 'La date et l\'heure sont requises.',
        variant: 'destructive',
      });
      return;
    }

    const start = new Date(`${date}T${startTime}:00`);
    const end = endTime ? new Date(`${date}T${endTime}:00`) : new Date(start.getTime() + 60 * 60 * 1000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast({
        title: 'Erreur',
        description: 'Date ou heure invalide.',
        variant: 'destructive',
      });
      return;
    }

    if (isVirtual && eventType !== 'TASK' && !meetingUrl.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le lien de visioconférence est requis.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      let endpoint = '/api/advisor/rendez-vous';
      let method = 'POST';
      let body: Record<string, unknown> = {};

      if (eventType === 'TASK') {
        endpoint = '/api/advisor/taches';
        body = {
          type: 'SUIVI',
          title,
          description: description || undefined,
          priority: taskPriority,
          dueDate: start.toISOString(),
          clientId: clientId || undefined,
        };
      } else {
        body = {
          type: rdvType,
          title,
          description: description || undefined,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          location: !isVirtual ? location || undefined : undefined,
          meetingUrl: isVirtual ? meetingUrl || undefined : undefined,
          isVirtual,
          clientId: clientId || undefined,
          isRecurring,
        };

        if (isRecurring && recurrenceUntil) {
          body.recurrenceRule = `FREQ=${recurrenceFreq};INTERVAL=${recurrenceInterval}`;
          body.recurrenceEndDate = new Date(`${recurrenceUntil}T23:59:59`).toISOString();
        }
      }

      if (isEditing && event) {
        endpoint = eventType === 'TASK' 
          ? `/api/advisor/taches/${event.id}`
          : `/api/advisor/rendez-vous/${event.id}`;
        method = 'PATCH';
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const result = await res.json();
      const savedEvent: CalendarEvent = {
        id: result.data?.id || result.id || event?.id || crypto.randomUUID(),
        title,
        description,
        start,
        end,
        type: eventType as CalendarEvent['type'],
        status: 'SCHEDULED',
        clientId: clientId || undefined,
        location,
        isVirtual,
        meetingUrl,
        isRecurring,
      };

      toast({
        title: isEditing ? 'Événement modifié' : 'Événement créé',
        description: `${title} - ${format(start, 'PPP à HH:mm', { locale: fr })}`,
      });

      onSave(savedEvent);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de sauvegarder.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTypeConfig = EVENT_TYPES.find((t) => t.value === eventType);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedTypeConfig && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${selectedTypeConfig.color}15` }}
              >
                <selectedTypeConfig.icon
                  className="w-4 h-4"
                  style={{ color: selectedTypeConfig.color }}
                />
              </div>
            )}
            {isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}
          </DialogTitle>
          <DialogDescription>
            {slot
              ? `Le ${format(slot.start, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}`
              : 'Planifier un nouvel événement'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Type selector */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-xl">
            {EVENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setEventType(type.value)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-xs',
                  eventType === type.value
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/50'
                )}
              >
                <type.icon
                  className="w-4 h-4"
                  style={{ color: eventType === type.value ? type.color : '#64748b' }}
                />
                <span
                  className={cn(
                    'font-medium',
                    eventType === type.value ? 'text-slate-900' : 'text-slate-500'
                  )}
                >
                  {type.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              placeholder="Ex: RDV Client M. Dupont"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>Client (optionnel)</Label>
            <Select
              value={clientId ?? 'none'}
              onValueChange={(val) => setClientId(val === 'none' ? null : val)}
              disabled={loadingClients}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingClients ? 'Chargement...' : 'Sélectionner un client'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Début *
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Fin
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* RDV specific options */}
          {eventType !== 'TASK' && eventType !== 'REMINDER' && (
            <>
              <div className="space-y-2">
                <Label>Type de rendez-vous</Label>
                <Select value={rdvType} onValueChange={setRdvType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RDV_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Virtual meeting toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">Visioconférence</span>
                </div>
                <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
              </div>

              {isVirtual ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Lien de la réunion *
                  </Label>
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Lieu
                  </Label>
                  <Input
                    placeholder="Adresse ou lieu du rendez-vous"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              {/* Recurrence */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">Récurrent</span>
                </div>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>

              {isRecurring && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-xs">Fréquence</Label>
                    <Select value={recurrenceFreq} onValueChange={setRecurrenceFreq}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Quotidien</SelectItem>
                        <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                        <SelectItem value="MONTHLY">Mensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Intervalle</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Jusqu'au</Label>
                    <Input
                      type="date"
                      value={recurrenceUntil}
                      onChange={(e) => setRecurrenceUntil(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Task priority */}
          {eventType === 'TASK' && (
            <div className="space-y-2">
              <Label>Priorité</Label>
              <div className="grid grid-cols-4 gap-2">
                {TASK_PRIORITIES.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setTaskPriority(priority.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      taskPriority === priority.value
                        ? priority.color
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Notes ou détails supplémentaires..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : isEditing ? (
              'Modifier'
            ) : (
              'Créer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
