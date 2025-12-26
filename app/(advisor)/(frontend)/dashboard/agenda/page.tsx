'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, NavigateAction } from 'react-big-calendar';
import { 
  format, 
  parse, 
  startOfWeek, 
  getDay, 
  isToday, 
  isTomorrow, 
  isThisWeek, 
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/app/_common/styles/calendar.css';

import { Card, CardHeader, CardTitle, CardContent } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/_common/components/ui/Dialog';
import { Input } from '@/app/_common/components/ui/Input';
import { Label } from '@/app/_common/components/ui/Label';
import { Switch } from '@/app/_common/components/ui/Switch';
import { Textarea } from '@/app/_common/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select';
import { useToast } from '@/app/_common/hooks/use-toast';
import { serializeRRule } from '@/app/_common/lib/services/recurrence-helper';
import {
  Plus,
  RefreshCw,
  Calendar as CalendarIcon,
  Loader2,
  Clock,
  Users,
  Phone,
  Bell,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  CheckSquare,
  Video,
  MapPin,
  Settings,
} from 'lucide-react';
import { SyncCenter } from './_components/SyncCenter';
import { AgendaSettings } from './_components/AgendaSettings';
import { cn } from '@/lib/utils';

// Setup Localizer
const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Type couleurs pour les événements
const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  rdv: { bg: '#4f46e5', border: '#4338ca', text: 'Rendez-vous' },
  MEETING: { bg: '#4f46e5', border: '#4338ca', text: 'Rendez-vous' },
  task: { bg: '#f59e0b', border: '#d97706', text: 'Tâche' },
  CALL: { bg: '#0891b2', border: '#0e7490', text: 'Appel' },
  REMINDER: { bg: '#8b5cf6', border: '#7c3aed', text: 'Rappel' },
};

export default function AgendaPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createKind, setCreateKind] = useState<'rdv' | 'task'>('rdv');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createClientId, setCreateClientId] = useState<string | null>(null);
  const [createDate, setCreateDate] = useState('');
  const [createTime, setCreateTime] = useState('');
  const [createDurationMinutes, setCreateDurationMinutes] = useState(60);
  const [createRdvType, setCreateRdvType] = useState<'PREMIER_RDV' | 'SUIVI' | 'BILAN_ANNUEL' | 'SIGNATURE' | 'APPEL_TEL' | 'VISIO' | 'AUTRE'>('PREMIER_RDV');
  const [createLocation, setCreateLocation] = useState('');
  const [createMeetingUrl, setCreateMeetingUrl] = useState('');
  const [createIsRecurring, setCreateIsRecurring] = useState(false);
  const [createRecurrenceFreq, setCreateRecurrenceFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [createRecurrenceInterval, setCreateRecurrenceInterval] = useState(1);
  const [createRecurrenceByDay, setCreateRecurrenceByDay] = useState<string[]>([]);
  const [createRecurrenceUntil, setCreateRecurrenceUntil] = useState('');
  const [createTaskType, setCreateTaskType] = useState<'APPEL' | 'EMAIL' | 'REUNION' | 'REVUE_DOCUMENTS' | 'MISE_A_JOUR_KYC' | 'RENOUVELLEMENT_CONTRAT' | 'SUIVI' | 'ADMINISTRATIF' | 'AUTRE'>('SUIVI');
  const [createTaskPriority, setCreateTaskPriority] = useState<'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'>('MOYENNE');
  const [createReminderDate, setCreateReminderDate] = useState('');
  const [createReminderTime, setCreateReminderTime] = useState('');
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const res = await fetch('/api/advisor/clients?limit=50');
      const json = await res.json();
      const data = json.data || [];
      const formatted = (Array.isArray(data) ? data : []).map((c: any) => ({
        id: c.id,
        name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email || 'Client',
      }));
      setClients(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      loadClients();
    }
  }, [isModalOpen, loadClients]);

  // Navigation handlers
  const handleNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    setCurrentDate(prevDate => {
      if (action === 'TODAY') return new Date();
      
      if (currentView === 'month') {
        return action === 'PREV' ? subMonths(prevDate, 1) : addMonths(prevDate, 1);
      } else if (currentView === 'week') {
        return action === 'PREV' ? subWeeks(prevDate, 1) : addWeeks(prevDate, 1);
      } else {
        return action === 'PREV' ? addDays(prevDate, -1) : addDays(prevDate, 1);
      }
    });
  }, [currentView]);

  // Load Events from API (includes tasks)
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfMonth(subMonths(currentDate, 1));
      const end = endOfMonth(addMonths(currentDate, 1));
      
      const res = await fetch(`/api/advisor/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      const json = await res.json();
      
      // API returns { data: { events: [...] } }
      const eventsData = json.data?.events || json.events || [];
      
      if (eventsData.length > 0) {
        const formattedEvents = eventsData.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setEvents(formattedEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger l'agenda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [currentDate, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Stats calculées
  const stats = useMemo(() => {
    const todayEvents = events.filter((e) => isToday(e.start));
    const tomorrowEvents = events.filter((e) => isTomorrow(e.start));
    const weekEvents = events.filter((e) => isThisWeek(e.start, { weekStartsOn: 1 }));
    const rdvCount = events.filter((e) => e.type === 'rdv' || e.type === 'MEETING').length;
    const tasksCount = events.filter((e) => e.type === 'task').length;
    const callsCount = events.filter((e) => e.type === 'CALL').length;

    return { todayEvents, tomorrowEvents, weekEvents, rdvCount, tasksCount, callsCount };
  }, [events]);

  // Prochains événements (7 jours)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekLater = addDays(now, 7);
    return events
      .filter((e) => e.start >= now && e.start <= weekLater)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 6);
  }, [events]);

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    return events
      .filter((e) => isSameDay(e.start, currentDate))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, currentDate]);

  const calendarMinTime = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const calendarMaxTime = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentDate]);

  const calendarScrollToTime = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(8, 0, 0, 0);
    return d;
  }, [currentDate]);

  // 2. Handle Slot Selection (Create)
  const handleSelectSlot = (slotInfo: any) => {
    const start = new Date(slotInfo.start);
    const end = new Date(slotInfo.end);
    setSelectedSlot(slotInfo);
    setCreateKind('rdv');
    setCreateTitle('');
    setCreateDescription('');
    setCreateClientId(null);
    setCreateDate(format(start, 'yyyy-MM-dd'));
    setCreateTime(format(start, 'HH:mm'));
    const diff = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
    setCreateDurationMinutes(diff);
    setCreateRdvType('PREMIER_RDV');
    setCreateLocation('');
    setCreateMeetingUrl('');
    setCreateIsRecurring(false);
    setCreateRecurrenceFreq('WEEKLY');
    setCreateRecurrenceInterval(1);
    setCreateRecurrenceByDay([]);
    setCreateRecurrenceUntil('');
    setCreateTaskType('SUIVI');
    setCreateTaskPriority('MOYENNE');
    setCreateReminderDate('');
    setCreateReminderTime('');
    setIsModalOpen(true);
  };

  // 3. Handle Event Creation (POST)
  const handleCreateEvent = async () => {
    if (!createTitle || !selectedSlot) return;

    if (!createDate || !createTime) {
      toast({ title: 'Erreur', description: "Veuillez sélectionner une date et une heure.", variant: 'destructive' });
      return;
    }

    const start = new Date(`${createDate}T${createTime}:00`);
    if (Number.isNaN(start.getTime())) {
      toast({ title: 'Erreur', description: "Date/heure invalide.", variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (createKind === 'task') {
        const reminderDateTime = createReminderDate && createReminderTime
          ? new Date(`${createReminderDate}T${createReminderTime}:00`)
          : null;

        const res = await fetch('/api/advisor/taches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: createTaskType,
            title: createTitle,
            description: createDescription || undefined,
            priority: createTaskPriority,
            dueDate: start.toISOString(),
            reminderDate: reminderDateTime && !Number.isNaN(reminderDateTime.getTime()) ? reminderDateTime.toISOString() : undefined,
            clientId: createClientId || undefined,
          }),
        });

        if (!res.ok) throw new Error('Erreur lors de la création');
        toast({ title: 'Succès', description: 'Tâche créée.' });
      } else {
        const end = new Date(start.getTime() + Math.max(15, createDurationMinutes) * 60000);
        const isVirtual = createRdvType === 'VISIO';

        if (isVirtual && !createMeetingUrl.trim()) {
          toast({ title: 'Erreur', description: 'Le lien de visioconférence est requis.', variant: 'destructive' });
          return;
        }

        let recurrenceRule: string | undefined = undefined;
        let recurrenceEndDate: string | undefined = undefined;

        if (createIsRecurring) {
          const byDay = createRecurrenceFreq === 'WEEKLY'
            ? (createRecurrenceByDay.length > 0 ? createRecurrenceByDay : [(['SU','MO','TU','WE','TH','FR','SA'] as const)[start.getDay()]])
            : undefined;

          const until = createRecurrenceUntil
            ? new Date(`${createRecurrenceUntil}T23:59:59`)
            : undefined;

          if (until && Number.isNaN(until.getTime())) {
            toast({ title: 'Erreur', description: 'Date de fin de récurrence invalide.', variant: 'destructive' });
            return;
          }

          recurrenceRule = serializeRRule({
            freq: createRecurrenceFreq,
            interval: Math.max(1, createRecurrenceInterval || 1),
            byDay,
            until,
          } as any);
          recurrenceEndDate = until ? until.toISOString() : undefined;
        }

        const res = await fetch('/api/advisor/rendez-vous', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: createRdvType,
            title: createTitle,
            description: createDescription || undefined,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            location: !isVirtual ? (createLocation || undefined) : undefined,
            meetingUrl: isVirtual ? (createMeetingUrl || undefined) : undefined,
            isVirtual,
            clientId: createClientId || undefined,
            isRecurring: createIsRecurring,
            recurrenceRule,
            recurrenceEndDate,
          }),
        });

        if (!res.ok) throw new Error('Erreur lors de la création');
        toast({ title: 'Succès', description: 'Rendez-vous créé.' });
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de créer.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Ouvrir modal sans slot (nouveau rdv manuel)
  const handleNewEvent = () => {
    const now = new Date();
    const start = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setSelectedSlot({ start, end });
    setCreateKind('rdv');
    setCreateTitle('');
    setCreateDescription('');
    setCreateClientId(null);
    setCreateDate(format(start, 'yyyy-MM-dd'));
    setCreateTime(format(start, 'HH:mm'));
    setCreateDurationMinutes(60);
    setCreateRdvType('PREMIER_RDV');
    setCreateLocation('');
    setCreateMeetingUrl('');
    setCreateIsRecurring(false);
    setCreateRecurrenceFreq('WEEKLY');
    setCreateRecurrenceInterval(1);
    setCreateRecurrenceByDay([]);
    setCreateRecurrenceUntil('');
    setCreateTaskType('SUIVI');
    setCreateTaskPriority('MOYENNE');
    setCreateReminderDate('');
    setCreateReminderTime('');
    setIsModalOpen(true);
  };

  // Custom Event Style
  const eventStyleGetter = (event: any) => {
    const colors = EVENT_COLORS[event.type] || EVENT_COLORS.MEETING;
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '6px',
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-6 bg-slate-50/50">
      {/* LEFT: Calendar Area */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
            <p className="text-sm text-slate-500">Gérez vos rendez-vous et événements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
            <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Actualiser
            </Button>
            <Button size="sm" onClick={handleNewEvent} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-3">
          <div 
            className={cn(
              "bg-white rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md",
              isToday(currentDate) ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"
            )}
            onClick={() => setCurrentDate(new Date())}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.todayEvents.length}</span>
            </div>
            <p className="text-xs text-slate-500">Aujourd'hui</p>
          </div>
          <div 
            className="bg-white rounded-xl border border-slate-200 p-3 cursor-pointer transition-all hover:shadow-md hover:border-emerald-200"
            onClick={() => setCurrentDate(addDays(new Date(), 1))}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.tomorrowEvents.length}</span>
            </div>
            <p className="text-xs text-slate-500">Demain</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.rdvCount}</span>
            </div>
            <p className="text-xs text-slate-500">Rendez-vous</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.tasksCount}</span>
            </div>
            <p className="text-xs text-slate-500">Tâches</p>
          </div>
        </div>

        {/* Calendrier avec toolbar personnalisée */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Custom Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('TODAY')}
                className={cn(
                  "text-sm",
                  isToday(currentDate) && "bg-indigo-50 border-indigo-200 text-indigo-600"
                )}
              >
                Aujourd'hui
              </Button>
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate('PREV')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate('NEXT')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 ml-2">
                {format(currentDate, currentView === 'day' ? 'EEEE d MMMM yyyy' : 'MMMM yyyy', { locale: fr })}
              </h2>
            </div>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              {(['month', 'week', 'day', 'agenda'] as const).map((view) => (
                <Button
                  key={view}
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView(view)}
                  className={cn(
                    "text-sm px-4 rounded-lg",
                    currentView === view 
                      ? "bg-white shadow-sm text-indigo-600 font-medium" 
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {view === 'month' ? 'Mois' : view === 'week' ? 'Semaine' : view === 'day' ? 'Jour' : 'Liste'}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar Content */}
          <div 
            className={cn(
              'flex-1 p-2',
              currentView === 'day' || currentView === 'week' ? 'overflow-hidden' : 'overflow-auto'
            )}
            style={
              currentView === 'month'
                ? {
                    height: 'calc(100% - 60px)',
                  }
                : undefined
            }
          >
            {loading ? (
              <div className="h-full flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ 
                  height: '100%',
                }}
                views={['month', 'week', 'day', 'agenda']}
                view={currentView}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                onView={(view) => setCurrentView(view as any)}
                culture="fr"
                selectable
                step={30}
                timeslots={2}
                min={calendarMinTime}
                max={calendarMaxTime}
                scrollToTime={calendarScrollToTime}
                getNow={() => new Date()}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={(event) => {
                  setSelectedEvent(event);
                  toast({ 
                    title: event.title, 
                    description: event.client?.name 
                      ? `${event.client.name} - ${format(event.start, 'HH:mm', { locale: fr })}` 
                      : format(event.start, 'HH:mm', { locale: fr })
                  });
                }}
                eventPropGetter={eventStyleGetter}
                toolbar={false}
                dayLayoutAlgorithm="no-overlap"
                messages={{
                  next: "Suivant",
                  previous: "Précédent",
                  today: "Aujourd'hui",
                  month: "Mois",
                  week: "Semaine",
                  day: "Jour",
                  agenda: "Liste",
                  date: "Date",
                  time: "Heure",
                  event: "Événement",
                  noEventsInRange: "Aucun événement dans cette période.",
                  allDay: "Journée entière",
                  showMore: (count) => `+${count} autres`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Sidebar */}
      <div className="w-[320px] space-y-4 flex flex-col">
        {/* Calendar Sync Center */}
        <SyncCenter />

        {/* Prochains événements */}
        <Card className="flex-1 border border-slate-200 bg-white overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Prochains événements
              </div>
              <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                {upcomingEvents.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[400px]">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">Aucun événement prévu</p>
                <p className="text-xs text-slate-500 mb-4">
                  Commencez par créer votre premier rendez-vous
                </p>
                <Button
                  size="sm"
                  onClick={handleNewEvent}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nouveau RDV
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingEvents.map((event) => {
                  const colors = EVENT_COLORS[event.type] || EVENT_COLORS.MEETING;
                  const isTask = event.type === 'task';
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setCurrentDate(event.start);
                        setCurrentView('day');
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${colors.bg}15` }}
                      >
                        {isTask ? (
                          <CheckSquare className="w-5 h-5" style={{ color: colors.bg }} />
                        ) : event.type === 'CALL' ? (
                          <Phone className="w-5 h-5" style={{ color: colors.bg }} />
                        ) : (
                          <Users className="w-5 h-5" style={{ color: colors.bg }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-slate-900 truncate">
                            {event.title}
                          </h4>
                          <span 
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `${colors.bg}15`, color: colors.bg }}
                          >
                            {isTask ? 'Tâche' : colors.text}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {isToday(event.start)
                            ? `Aujourd'hui, ${format(event.start, "HH:mm", { locale: fr })}`
                            : isTomorrow(event.start)
                            ? `Demain, ${format(event.start, "HH:mm", { locale: fr })}`
                            : format(event.start, "EEE d MMM, HH:mm", { locale: fr })}
                        </p>
                        {event.client?.name && (
                          <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.client.name}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-slate-500 transition-colors" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createKind === 'task' ? 'Nouvelle tâche' : 'Nouveau rendez-vous'}</DialogTitle>
            <DialogDescription>
              {selectedSlot ? `Le ${format(selectedSlot.start, 'dd MMMM yyyy à HH:mm', { locale: fr })}` : 'Planifier un événement'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  createKind === 'rdv' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                )}
                onClick={() => setCreateKind('rdv')}
              >
                Rendez-vous
              </button>
              <button
                type="button"
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  createKind === 'task' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                )}
                onClick={() => setCreateKind('task')}
              >
                Tâche
              </button>
            </div>

            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                placeholder="Ex: RDV Client M. Dupont"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Client (optionnel)</Label>
              <Select
                value={createClientId ?? 'none'}
                onValueChange={(val) => setCreateClientId(val === 'none' ? null : val)}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? 'Chargement...' : 'Sélectionner un client'} />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{createKind === 'task' ? 'Date (échéance)' : 'Date'}</Label>
                <Input
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{createKind === 'task' ? 'Heure (échéance)' : 'Heure'}</Label>
                <Input
                  type="time"
                  value={createTime}
                  onChange={(e) => setCreateTime(e.target.value)}
                />
              </div>
            </div>

            {createKind === 'rdv' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={createRdvType} onValueChange={(val) => setCreateRdvType(val as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PREMIER_RDV">Premier RDV</SelectItem>
                        <SelectItem value="SUIVI">Suivi</SelectItem>
                        <SelectItem value="BILAN_ANNUEL">Bilan annuel</SelectItem>
                        <SelectItem value="SIGNATURE">Signature</SelectItem>
                        <SelectItem value="APPEL_TEL">Appel téléphonique</SelectItem>
                        <SelectItem value="VISIO">Visioconférence</SelectItem>
                        <SelectItem value="AUTRE">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Durée (minutes)</Label>
                    <Select value={String(createDurationMinutes)} onValueChange={(val) => setCreateDurationMinutes(parseInt(val, 10))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="90">90</SelectItem>
                        <SelectItem value="120">120</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {createRdvType === 'VISIO' ? (
                  <div className="space-y-2">
                    <Label>Lien visio</Label>
                    <Input
                      placeholder="https://meet..."
                      value={createMeetingUrl}
                      onChange={(e) => setCreateMeetingUrl(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Lieu (optionnel)</Label>
                    <Input
                      placeholder="Cabinet, adresse, etc."
                      value={createLocation}
                      onChange={(e) => setCreateLocation(e.target.value)}
                      disabled={createRdvType === 'APPEL_TEL'}
                    />
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Récurrence</Label>
                      <p className="text-xs text-slate-500">Planifier un rendez-vous récurrent</p>
                    </div>
                    <Switch checked={createIsRecurring} onCheckedChange={setCreateIsRecurring} />
                  </div>

                  {createIsRecurring && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Fréquence</Label>
                          <Select value={createRecurrenceFreq} onValueChange={(val) => setCreateRecurrenceFreq(val as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DAILY">Quotidienne</SelectItem>
                              <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                              <SelectItem value="MONTHLY">Mensuelle</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Intervalle</Label>
                          <Input
                            type="number"
                            min={1}
                            value={createRecurrenceInterval}
                            onChange={(e) => setCreateRecurrenceInterval(Math.max(1, parseInt(e.target.value || '1', 10)))}
                          />
                        </div>
                      </div>

                      {createRecurrenceFreq === 'WEEKLY' && (
                        <div className="space-y-2">
                          <Label>Jours</Label>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { code: 'MO', label: 'L' },
                              { code: 'TU', label: 'M' },
                              { code: 'WE', label: 'Me' },
                              { code: 'TH', label: 'J' },
                              { code: 'FR', label: 'V' },
                              { code: 'SA', label: 'S' },
                              { code: 'SU', label: 'D' },
                            ].map((d) => (
                              <button
                                key={d.code}
                                type="button"
                                className={cn(
                                  'w-9 h-9 rounded-lg text-xs font-medium transition-all',
                                  createRecurrenceByDay.includes(d.code)
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                )}
                                onClick={() => {
                                  setCreateRecurrenceByDay((prev) =>
                                    prev.includes(d.code)
                                      ? prev.filter((x) => x !== d.code)
                                      : [...prev, d.code]
                                  );
                                }}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Fin</Label>
                        <Input
                          type="date"
                          value={createRecurrenceUntil}
                          onChange={(e) => setCreateRecurrenceUntil(e.target.value)}
                        />
                        <p className="text-xs text-slate-500">Optionnel (sinon récurrence sans fin)</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {createKind === 'task' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={createTaskType} onValueChange={(val) => setCreateTaskType(val as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPEL">Appel</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="REUNION">Réunion</SelectItem>
                        <SelectItem value="SUIVI">Suivi</SelectItem>
                        <SelectItem value="ADMINISTRATIF">Administratif</SelectItem>
                        <SelectItem value="REVUE_DOCUMENTS">Revue documents</SelectItem>
                        <SelectItem value="MISE_A_JOUR_KYC">Mise à jour KYC</SelectItem>
                        <SelectItem value="RENOUVELLEMENT_CONTRAT">Renouvellement contrat</SelectItem>
                        <SelectItem value="AUTRE">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priorité</Label>
                    <Select value={createTaskPriority} onValueChange={(val) => setCreateTaskPriority(val as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASSE">Basse</SelectItem>
                        <SelectItem value="MOYENNE">Moyenne</SelectItem>
                        <SelectItem value="HAUTE">Haute</SelectItem>
                        <SelectItem value="URGENTE">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Rappel (date)</Label>
                    <Input type="date" value={createReminderDate} onChange={(e) => setCreateReminderDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rappel (heure)</Label>
                    <Input type="time" value={createReminderTime} onChange={(e) => setCreateReminderTime(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Notes, ordre du jour..."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateEvent} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SETTINGS MODAL */}
      <AgendaSettings open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
