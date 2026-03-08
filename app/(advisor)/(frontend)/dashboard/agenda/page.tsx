'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { format, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';

import '@/app/_common/styles/fullcalendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Badge } from '@/app/_common/components/ui/Badge';
import { useToast } from '@/app/_common/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Plus,
  RefreshCw,
  Calendar as CalendarIcon,
  Loader2,
  Clock,
  Users,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Settings,
} from 'lucide-react';
import { EventModal } from './_components/EventModal';
import { EventDetailModal } from './_components/EventDetailModal';
import { AgendaSidebar } from './_components/AgendaSidebar';
import { AgendaSettingsModal, useAgendaSettings } from './_components/AgendaSettingsModal';
import type { CalendarEvent } from './_components/FullCalendarWrapper';

// Import dynamique de FullCalendar (désactive le SSR)
const FullCalendarWrapper = dynamic(
  () => import('./_components/FullCalendarWrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    ),
  }
);

// Couleurs par type d'événement
const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  MEETING: { bg: '#4f46e5', border: '#4338ca', text: 'Rendez-vous' },
  CALL: { bg: '#0891b2', border: '#0e7490', text: 'Appel' },
  VIDEO_CALL: { bg: '#7c3aed', border: '#6d28d9', text: 'Visioconférence' },
  TASK: { bg: '#f59e0b', border: '#d97706', text: 'Tâche' },
  REMINDER: { bg: '#8b5cf6', border: '#7c3aed', text: 'Rappel' },
};

export default function AgendaPage() {
  const { toast } = useToast();
  
  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  
  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Charger les paramètres de l'agenda
  const { config: agendaConfig } = useAgendaSettings();

  // Ref pour éviter les appels multiples
  const lastFetchRef = useRef<string>('');
  const isMountedRef = useRef(false);

  // Charger les événements
  const fetchEvents = useCallback(async (forceRefresh = false) => {
    // Calculer la clé de cache basée sur le mois
    const cacheKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    
    // Éviter les appels redondants sauf si forceRefresh
    if (!forceRefresh && lastFetchRef.current === cacheKey) {
      return;
    }
    
    lastFetchRef.current = cacheKey;
    setLoading(true);
    
    try {
      const start = new Date(currentDate);
      start.setMonth(start.getMonth() - 1);
      const end = new Date(currentDate);
      end.setMonth(end.getMonth() + 2);
      
      const res = await fetch(
        `/api/advisor/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      const json = await res.json();
      
      const eventsData = json.data?.events || json.events || [];
      const formattedEvents = eventsData.map((e: Record<string, unknown>) => ({
        ...e,
        start: new Date(e.start as string),
        end: new Date(e.end as string),
        type: e.type || 'MEETING',
        status: e.status || 'SCHEDULED',
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Erreur chargement événements:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de charger l'agenda.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, toast]);

  // Charger les événements au montage et quand currentDate change de mois
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchEvents();
    } else {
      // Ne recharger que si on change de mois
      fetchEvents();
    }
  }, [fetchEvents]);

  // Filtrer les événements
  const filteredEvents = events.filter((e) => {
    if (typeFilter.length > 0 && !typeFilter.includes(e.type)) return false;
    return true;
  });

  // Handlers
  const handleDateSelect = useCallback((start: Date, end: Date) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setIsCreateModalOpen(true);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  }, []);

  const handleEventDrop = useCallback(async (eventId: string, start: Date, end: Date): Promise<boolean> => {
    try {
      const res = await fetch(`/api/advisor/rendez-vous/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Erreur mise à jour');

      toast({
        title: 'Événement déplacé',
        description: `Déplacé au ${format(start, 'PPP à HH:mm', { locale: fr })}`,
      });

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, start, end } : e))
      );
      return true;
    } catch (err) {
      console.error('Erreur déplacement:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de déplacer l'événement.",
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const handleEventResize = useCallback(async (eventId: string, start: Date, end: Date): Promise<boolean> => {
    try {
      const res = await fetch(`/api/advisor/rendez-vous/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Erreur mise à jour');

      toast({
        title: 'Durée modifiée',
        description: 'Nouvelle durée enregistrée',
      });

      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, start, end } : e))
      );
      return true;
    } catch (err) {
      console.error('Erreur redimensionnement:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la durée.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Navigation
  const handleToday = () => setCurrentDate(new Date());
  
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'dayGridMonth') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'timeGridWeek' || currentView === 'listWeek') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'dayGridMonth') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'timeGridWeek' || currentView === 'listWeek') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Créer un nouvel événement
  const handleNewEvent = () => {
    const now = new Date();
    const start = new Date(now.setMinutes(0, 0, 0));
    start.setHours(start.getHours() + 1);
    const end = addHours(start, 1);
    
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setIsCreateModalOpen(true);
  };

  // Après création/modification d'événement
  const handleEventSaved = (newEvent: CalendarEvent) => {
    if (selectedEvent) {
      setEvents((prev) => prev.map((e) => (e.id === newEvent.id ? newEvent : e)));
    } else {
      setEvents((prev) => [...prev, newEvent]);
    }
    setIsCreateModalOpen(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
  };

  // Après suppression
  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setIsDetailModalOpen(false);
    setSelectedEvent(null);
  };

  // Éditer depuis le détail
  const handleEditEvent = () => {
    setIsDetailModalOpen(false);
    setIsCreateModalOpen(true);
  };

  // Stats
  const todayEvents = events.filter(
    (e) => format(e.start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  const weekEvents = events.filter((e) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return e.start >= weekStart && e.start <= weekEnd;
  });

  return (
    <div className="flex h-[calc(100vh-80px)] gap-6 p-6 bg-slate-50/50">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
            <p className="text-sm text-slate-500">
              Gérez vos rendez-vous et événements
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-indigo-50 border-indigo-200')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {typeFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {typeFilter.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEvents(true)}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
            <Button
              size="sm"
              onClick={handleNewEvent}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        {showFilters && (
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Type:</span>
                  <div className="flex gap-1">
                    {Object.entries(EVENT_COLORS).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() =>
                          setTypeFilter((prev) =>
                            prev.includes(type)
                              ? prev.filter((t) => t !== type)
                              : [...prev, type]
                          )
                        }
                        className={cn(
                          'px-2 py-1 rounded-md text-xs font-medium transition-all',
                          typeFilter.includes(type)
                            ? 'text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                        style={
                          typeFilter.includes(type)
                            ? { backgroundColor: config.bg }
                            : undefined
                        }
                      >
                        {config.text}
                      </button>
                    ))}
                  </div>
                </div>
                {typeFilter.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTypeFilter([])}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-md border',
              format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ? 'border-indigo-300 ring-2 ring-indigo-100'
                : 'border-slate-200'
            )}
            onClick={handleToday}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {todayEvents.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Aujourd'hui</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {weekEvents.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Cette semaine</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {events.filter((e) => e.type === 'MEETING').length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Rendez-vous</p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {events.filter((e) => e.type === 'TASK').length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Tâches</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="flex-1 border-slate-200 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Custom Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className={cn(
                    'text-sm',
                    format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                      'bg-indigo-50 border-indigo-200 text-indigo-600'
                  )}
                >
                  Aujourd'hui
                </Button>
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 ml-2">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </h2>
              </div>
              
              <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
                {[
                  { key: 'dayGridMonth', label: 'Mois' },
                  { key: 'timeGridWeek', label: 'Semaine' },
                  { key: 'timeGridDay', label: 'Jour' },
                  { key: 'listWeek', label: 'Liste' },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView(key as typeof currentView)}
                    className={cn(
                      'text-sm px-4 rounded-lg',
                      currentView === key
                        ? 'bg-white shadow-sm text-indigo-600 font-medium'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* FullCalendar */}
            <div className="flex-1 p-2 min-h-0">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <FullCalendarWrapper
                  events={filteredEvents}
                  currentView={currentView}
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                  onEventDrop={handleEventDrop}
                  onEventResize={handleEventResize}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <AgendaSidebar
        events={events}
        onEventClick={(event) => {
          setSelectedEvent(event);
          setIsDetailModalOpen(true);
        }}
        onNewEvent={handleNewEvent}
      />

      {/* Create/Edit Modal */}
      <EventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedEvent(null);
          setSelectedSlot(null);
        }}
        event={selectedEvent}
        slot={selectedSlot}
        onSave={handleEventSaved}
      />

      {/* Detail Modal */}
      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={handleEditEvent}
        onDelete={handleEventDeleted}
      />

      {/* Settings Modal */}
      <AgendaSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSettingsChange={() => fetchEvents(true)}
      />
    </div>
  );
}
