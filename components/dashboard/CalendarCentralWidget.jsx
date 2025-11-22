'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  UserCircle2,
  AlarmClock,
  Link2
} from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { apiCall } from '@/lib/api-client';
import styles from './CalendarCentralWidget.module.css';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/Tooltip';

// ============================================
// CONFIGURATION GLOBALE (hors composant)
// ============================================
moment.locale('fr');
const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Constantes en dehors du composant pour éviter recréation
const CALENDAR_MIN_TIME = new Date(2024, 0, 1, 8, 0);
const CALENDAR_MAX_TIME = new Date(2024, 0, 1, 20, 0);
const VIEWS = ['month', 'week', 'day'];

const CALENDAR_MESSAGES = {
  today: "Aujourd'hui",
  previous: 'Précédent',
  next: 'Suivant',
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun événement dans cette période.',
  showMore: (total) => `+ ${total} de plus`
};

const CALENDAR_FORMATS = {
  dayFormat: 'ddd DD/MM',
  monthHeaderFormat: 'MMMM YYYY',
  dayHeaderFormat: 'dddd DD MMMM',
  dayRangeHeaderFormat: ({ start, end }) =>
    `${moment(start).format('DD MMM')} - ${moment(end).format('DD MMM YYYY')}`
};

// Formats dynamiques selon la vue (mémorisés)
const getWeekdayFormat = (view) => (view === 'month' ? 'dd' : 'dddd');

// ============================================
// HELPERS (plain JavaScript)
// ============================================
const createCalendarEvent = (override = {}) => ({
  id: '',
  type: 'rdv',
  title: '',
  start: new Date(),
  end: new Date(),
  ...override
});

const createSummary = () => ({ rdvToday: 0, meetingsWeek: 0, overdue: 0 });

// ============================================
// COMPOSANTS MÉMORISÉS
// ============================================

// Composant événement mémorisé pour éviter re-renders inutiles
const EventContent = memo(({ event }) => {
  const startTime = moment(event.start).format('HH:mm');
  const endTime = moment(event.end).format('HH:mm');

  return (
    <div className={styles.eventContent}>
      <div className={styles.eventTitle}>{event.title}</div>
      <div className={styles.eventMeta}>
        <AlarmClock className="h-3.5 w-3.5" />
        {`${startTime} – ${endTime}`}
      </div>
      {event.client?.name && (
        <div className={styles.eventMeta}>
          <UserCircle2 className="h-3.5 w-3.5" />
          {event.client.name}
        </div>
      )}
      {event.lieu && (
        <div className={styles.eventMeta}>
          <MapPin className="h-3.5 w-3.5" />
          {event.lieu}
        </div>
      )}
    </div>
  );
});
EventContent.displayName = 'EventContent';

// Tooltip mémorisé
const EventTooltip = memo(({ event }) => (
  <TooltipContent side="top" className="max-w-xs text-left">
    <p className="font-semibold mb-1">{event.title}</p>
    <div className="space-y-1 text-[11px] leading-relaxed">
      <div className="flex items-center gap-1">
        <AlarmClock className="h-3 w-3" />
        {moment(event.start).format('dddd DD MMMM YYYY – HH:mm')} →{' '}
        {moment(event.end).format('HH:mm')}
      </div>
      {event.client?.name && (
        <div className="flex items-center gap-1">
          <UserCircle2 className="h-3 w-3" />
          {event.client.name}
        </div>
      )}
      {event.lieu && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {event.lieu}
        </div>
      )}
      {event.link && (
        <div className="flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          Lien visio disponible
        </div>
      )}
      {event.notes && <p className="pt-1 text-slate-100/90">{event.notes}</p>}
    </div>
  </TooltipContent>
));
EventTooltip.displayName = 'EventTooltip';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function CalendarCentralWidget() {
  const router = useRouter();
  const [view, setView] = useState('week');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [updating, setUpdating] = useState(false);

  // ============================================
  // CHARGEMENT DONNÉES
  // ============================================
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiCall('/api/advisor/events');
      const formattedEvents = (data.events || []).map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLERS (callbacks stables)
  // ============================================
  const handleSelectSlot = useCallback((slotInfo) => {
    console.log('Créer événement:', slotInfo);
    router.push('/dashboard/agenda');
  }, [router]);

  const handleSelectEvent = useCallback((event) => {
    console.log('Ouvrir détails:', event);
    // TODO: Ouvrir modal détails événement
  }, []);

  // Check for conflicts with other appointments
  const checkConflict = useCallback((eventId, start, end) => {
    return events.find(e => 
      e.id !== eventId && 
      e.type === 'rdv' &&
      ((start >= e.start && start < e.end) ||
       (end > e.start && end <= e.end) ||
       (start <= e.start && end >= e.end))
    );
  }, [events]);

  const handleEventDrop = useCallback(
    async ({ event, start, end }) => {
      console.log('Déplacer événement:', event, start, end);
      
      // Check for conflicts
      const conflict = checkConflict(event.id, start, end);
      if (conflict) {
        setConflictWarning({
          message: `Conflit avec "${conflict.title}" (${moment(conflict.start).format('HH:mm')} - ${moment(conflict.end).format('HH:mm')})`,
          event,
          newStart: start,
          newEnd: end
        });
        return;
      }

      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, start, end } : e))
      );

      // API update
      try {
        setUpdating(true);
        await apiCall(`/api/advisor/appointments/${event.id}`, {
          method: 'PUT',
          body: {
            startTime: start.toISOString(),
            endTime: end.toISOString()
          }
        });
      } catch (error) {
        console.error('Erreur mise à jour rendez-vous:', error);
        // Revert on error
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? event : e))
        );
      } finally {
        setUpdating(false);
      }
    },
    [checkConflict]
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }) => {
      console.log('Redimensionner événement:', event, start, end);
      
      // Check for conflicts
      const conflict = checkConflict(event.id, start, end);
      if (conflict) {
        setConflictWarning({
          message: `Conflit avec "${conflict.title}" (${moment(conflict.start).format('HH:mm')} - ${moment(conflict.end).format('HH:mm')})`,
          event,
          newStart: start,
          newEnd: end
        });
        return;
      }

      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, start, end } : e))
      );

      // API update
      try {
        setUpdating(true);
        await apiCall(`/api/advisor/appointments/${event.id}`, {
          method: 'PUT',
          body: {
            startTime: start.toISOString(),
            endTime: end.toISOString()
          }
        });
      } catch (error) {
        console.error('Erreur mise à jour rendez-vous:', error);
        // Revert on error
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? event : e))
        );
      } finally {
        setUpdating(false);
      }
    },
    [checkConflict]
  );

  const handleDragStart = useCallback((event) => {
    setDraggedEvent(event);
  }, []);

  const confirmConflictMove = useCallback(async () => {
    if (!conflictWarning) return;

    const { event, newStart, newEnd } = conflictWarning;

    // Update with conflict override
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
    );

    try {
      setUpdating(true);
      await apiCall(`/api/advisor/appointments/${event.id}`, {
        method: 'PUT',
        body: {
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour rendez-vous:', error);
      // Revert on error
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? event : e))
      );
    } finally {
      setUpdating(false);
      setConflictWarning(null);
    }
  }, [conflictWarning]);

  const cancelConflictMove = useCallback(() => {
    setConflictWarning(null);
  }, []);

  // ============================================
  // NAVIGATION
  // ============================================
  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
      return moment(prev).subtract(1, unit).toDate();
    });
  }, [view]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
      return moment(prev).add(1, unit).toDate();
    });
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleViewChange = useCallback((mode) => {
    setView(mode);
  }, []);

  // ============================================
  // CALCULS MÉMORISÉS
  // ============================================
  
  // Summary optimisé avec dépendances précises
  const summary = useMemo(() => {
    const startOfDay = moment(currentDate).startOf('day');
    const startOfWeek = moment(currentDate).startOf('week');
    const endOfWeek = moment(currentDate).endOf('week');

    let rdvToday = 0;
    let meetingsWeek = 0;
    let overdue = 0;

    // Une seule itération sur les événements
    events.forEach((event) => {
      const eventMoment = moment(event.start);
      
      if (event.type === 'rdv') {
        if (eventMoment.isSame(startOfDay, 'day')) {
          rdvToday++;
        }
        if (eventMoment.isBetween(startOfWeek, endOfWeek, null, '[]')) {
          meetingsWeek++;
        }
      }
      
      if (
        event.type === 'task' &&
        event.priority === 'high' &&
        eventMoment.isBefore(startOfDay)
      ) {
        overdue++;
      }
    });

    return { rdvToday, meetingsWeek, overdue };
  }, [events, currentDate]);

  // Range label optimisé
  const rangeLabel = useMemo(() => {
    const current = moment(currentDate);
    
    if (view === 'month') {
      return current.format('MMMM YYYY');
    }
    if (view === 'week') {
      const start = current.clone().startOf('week');
      const end = current.clone().endOf('week');
      return `${start.format('DD MMM')} – ${end.format('DD MMM YYYY')}`;
    }
    return current.format('dddd DD MMMM YYYY');
  }, [view, currentDate]);

  // ============================================
  // STYLE GETTERS (fonctions stables)
  // ============================================
  const eventStyleGetter = useCallback(
    (event) => ({
      className: cn(
        styles.eventCard,
        event.priority === 'high' && styles.eventCardUrgent,
        event.type !== 'rdv' && styles.eventCardTask
      )
    }),
    []
  );

  const dayPropGetter = useCallback((date) => {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      return { className: 'fin3-weekend' };
    }
    return {};
  }, []);

  // ============================================
  // RENDER EVENT (optimisé avec TooltipProvider global)
  // ============================================
  const renderEvent = useCallback(({ event }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <EventContent event={event} />
        </div>
      </TooltipTrigger>
      <EventTooltip event={event} />
    </Tooltip>
  ), []);

  // Formats dynamiques mémorisés
  const calendarFormats = useMemo(
    () => ({
      ...CALENDAR_FORMATS,
      weekdayFormat: getWeekdayFormat(view)
    }),
    [view]
  );

  // Components config stable
  const calendarComponents = useMemo(
    () => ({
      event: renderEvent,
      toolbar: () => null
    }),
    [renderEvent]
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <TooltipProvider delayDuration={100}>
      <Card className={cn(styles.card, 'border-0 h-full')}>
        <CardHeader className={styles.header}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Agenda
            </CardTitle>
            <div className={styles.controls}>
              <div className={styles.navGroup}>
                <Button
                  size="icon"
                  variant="ghost"
                  className={styles.navButton}
                  onClick={goToPrevious}
                  aria-label="Période précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className={styles.rangeLabel}>{rangeLabel}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className={styles.navButton}
                  onClick={goToNext}
                  aria-label="Période suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className={styles.controlGroup}>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    styles.viewButton,
                    view === 'day' && styles.viewButtonActive
                  )}
                  onClick={() => handleViewChange('day')}
                >
                  Jour
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    styles.viewButton,
                    view === 'week' && styles.viewButtonActive
                  )}
                  onClick={() => handleViewChange('week')}
                >
                  Semaine
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    styles.viewButton,
                    view === 'month' && styles.viewButtonActive
                  )}
                  onClick={() => handleViewChange('month')}
                >
                  Mois
                </Button>
              </div>
              <Button size="sm" onClick={goToToday} className={styles.todayButton}>
                Aujourd'hui
              </Button>
            </div>
          </div>

          <div className={styles.summaryChips}>
            <span className={styles.summaryChip}>
              <span role="img" aria-label="rdv">
                🤝
              </span>
              {summary.rdvToday} RDV aujourd'hui
            </span>
            <span className={styles.summaryChip}>
              <span role="img" aria-label="week">
                📅
              </span>
              {summary.meetingsWeek} rendez-vous cette semaine
            </span>
            <span className={styles.summaryChip}>
              <span role="img" aria-label="urgent">
                ⚠️
              </span>
              {summary.overdue} urgences en retard
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="h-[600px] bg-gray-200 rounded animate-pulse" />
          ) : (
            <>
              <div className={styles.calendarShell}>
                <div className={cn(styles.calendar, draggedEvent && styles.calendarDragging)}>
                  <DragAndDropCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    onView={setView}
                    date={currentDate}
                    onNavigate={setCurrentDate}
                    views={VIEWS}
                    selectable
                    resizable
                    draggableAccessor={(event) => event.type === 'rdv'}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    onDragStart={handleDragStart}
                    eventPropGetter={eventStyleGetter}
                    dayPropGetter={dayPropGetter}
                    messages={CALENDAR_MESSAGES}
                    step={30}
                    timeslots={2}
                    min={CALENDAR_MIN_TIME}
                    max={CALENDAR_MAX_TIME}
                    formats={calendarFormats}
                    components={calendarComponents}
                    culture="fr"
                    style={{ minHeight: view === 'month' ? 640 : 560 }}
                  />
                </div>
              </div>

              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: '#3b82f6' }}
                  />
                  Rendez-vous clients
                </span>
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: '#6366f1' }}
                  />
                  Tâches & suivis
                </span>
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: '#ef4444' }}
                  />
                  Urgences prioritaires
                </span>
                <span className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: '#cbd5f5' }}
                  />
                  Week-end
                </span>
              </div>

              <div className={styles.actionBar}>
                <Button
                  onClick={() => router.push('/dashboard/agenda')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Voir l'agenda
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Conflict Warning Modal */}
      {conflictWarning && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
            onClick={cancelConflictMove}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Conflit de rendez-vous
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {conflictWarning.message}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Voulez-vous quand même déplacer ce rendez-vous ?
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={cancelConflictMove}
                  disabled={updating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmConflictMove}
                  disabled={updating}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {updating ? 'Déplacement...' : 'Confirmer'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading Overlay */}
      {updating && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Mise à jour en cours...
            </span>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}