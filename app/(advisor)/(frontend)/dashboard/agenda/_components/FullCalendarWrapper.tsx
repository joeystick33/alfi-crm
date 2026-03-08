'use client';

import { useRef, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { Users, Phone, Video, CheckSquare, Bell, Coffee, Briefcase, GraduationCap, Heart, Calendar } from 'lucide-react';
import { useAgendaSettings, type AgendaConfig } from './AgendaSettingsModal';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: 'MEETING' | 'CALL' | 'VIDEO_CALL' | 'TASK' | 'REMINDER';
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  clientId?: string;
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  location?: string;
  isVirtual?: boolean;
  meetingUrl?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

interface FullCalendarWrapperProps {
  events: CalendarEvent[];
  currentView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  currentDate: Date;
  onDateSelect: (start: Date, end: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (eventId: string, start: Date, end: Date) => Promise<boolean>;
  onEventResize: (eventId: string, start: Date, end: Date) => Promise<boolean>;
  onDatesChange?: (start: Date) => void;
}

const DEFAULT_EVENT_COLORS: Record<string, { bg: string; border: string }> = {
  MEETING: { bg: '#4f46e5', border: '#4338ca' },
  CALL: { bg: '#0891b2', border: '#0e7490' },
  VIDEO_CALL: { bg: '#7c3aed', border: '#6d28d9' },
  TASK: { bg: '#f59e0b', border: '#d97706' },
  REMINDER: { bg: '#8b5cf6', border: '#7c3aed' },
  BREAK: { bg: '#6b7280', border: '#4b5563' },
  TRAINING: { bg: '#10b981', border: '#059669' },
  PERSONAL: { bg: '#ec4899', border: '#db2777' },
  PROSPECTION: { bg: '#f97316', border: '#ea580c' },
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Phone,
  Video,
  CheckSquare,
  Bell,
  Coffee,
  Briefcase,
  GraduationCap,
  Heart,
  Calendar,
};

export default function FullCalendarWrapper({
  events,
  currentView,
  currentDate,
  onDateSelect,
  onEventClick,
  onEventDrop,
  onEventResize,
  onDatesChange,
}: FullCalendarWrapperProps) {
  const calendarRef = useRef<FullCalendar>(null);
  
  // Charger les paramètres de l'agenda
  const { config: agendaConfig } = useAgendaSettings();
  
  // Construire le mapping des couleurs depuis les paramètres
  const eventColors = agendaConfig.eventTypes.reduce((acc, et) => {
    acc[et.id] = { bg: et.color, border: et.color };
    return acc;
  }, { ...DEFAULT_EVENT_COLORS } as Record<string, { bg: string; border: string }>);

  // Synchroniser la vue quand currentView change
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api && api.view.type !== currentView) {
      api.changeView(currentView);
    }
  }, [currentView]);

  // Synchroniser la date quand currentDate change
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      const calendarDate = api.getDate();
      // Comparer seulement la date (pas l'heure)
      if (calendarDate.toDateString() !== currentDate.toDateString()) {
        api.gotoDate(currentDate);
      }
    }
  }, [currentDate]);

  // Convertir les événements pour FullCalendar
  const fullCalendarEvents = events.map((event) => {
    const colors = eventColors[event.type] || eventColors.MEETING || DEFAULT_EVENT_COLORS.MEETING;
    return {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: '#ffffff',
      extendedProps: { ...event },
    };
  });
  
  // Trouver l'icône pour un type d'événement
  const getEventIcon = (type: string) => {
    const eventType = agendaConfig.eventTypes.find(et => et.id === type);
    if (eventType && ICON_MAP[eventType.icon]) {
      return ICON_MAP[eventType.icon];
    }
    // Fallback par défaut
    switch (type) {
      case 'CALL': return Phone;
      case 'VIDEO_CALL': return Video;
      case 'TASK': return CheckSquare;
      case 'REMINDER': return Bell;
      case 'BREAK': return Coffee;
      case 'TRAINING': return GraduationCap;
      case 'PERSONAL': return Heart;
      case 'PROSPECTION': return Briefcase;
      default: return Users;
    }
  };

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    onDateSelect(selectInfo.start, selectInfo.end);
    selectInfo.view.calendar.unselect();
  }, [onDateSelect]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps as CalendarEvent;
    onEventClick({
      ...event,
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start!,
      end: clickInfo.event.end || clickInfo.event.start!,
    });
  }, [onEventClick]);

  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const success = await onEventDrop(
      dropInfo.event.id,
      dropInfo.event.start!,
      dropInfo.event.end || dropInfo.event.start!
    );
    if (!success) {
      dropInfo.revert();
    }
  }, [onEventDrop]);

  const handleEventResize = useCallback(async (resizeInfo: EventResizeDoneArg) => {
    const success = await onEventResize(
      resizeInfo.event.id,
      resizeInfo.event.start!,
      resizeInfo.event.end || resizeInfo.event.start!
    );
    if (!success) {
      resizeInfo.revert();
    }
  }, [onEventResize]);

  // Exposer l'API du calendrier
  const getApi = () => calendarRef.current?.getApi();

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      initialView={currentView}
      initialDate={currentDate}
      locale={frLocale}
      headerToolbar={false}
      events={fullCalendarEvents}
      editable={true}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={4}
      weekends={true}
      nowIndicator={true}
      slotMinTime={`${agendaConfig.workingHours.start}:00`}
      slotMaxTime={`${agendaConfig.workingHours.end}:00`}
      slotDuration={`00:${agendaConfig.slotDuration.toString().padStart(2, '0')}:00`}
      snapDuration="00:15:00"
      scrollTime={`${agendaConfig.workingHours.start}:00`}
      firstDay={agendaConfig.firstDayOfWeek}
      weekNumbers={agendaConfig.showWeekNumbers}
      businessHours={{
        daysOfWeek: agendaConfig.workingDays,
        startTime: agendaConfig.workingHours.start,
        endTime: agendaConfig.workingHours.end,
      }}
      allDaySlot={true}
      allDayText="Journée"
      eventTimeFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }}
      slotLabelFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }}
      select={handleDateSelect}
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      datesSet={onDatesChange ? (dateInfo) => onDatesChange(dateInfo.start) : undefined}
      height="100%"
      eventContent={(eventInfo) => {
        const type = eventInfo.event.extendedProps.type;
        const Icon = getEventIcon(type);

        return (
          <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden">
            <Icon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate text-xs font-medium">
              {eventInfo.event.title}
            </span>
          </div>
        );
      }}
    />
  );
}

// Export pour accès à l'API
export function useCalendarApi(ref: React.RefObject<FullCalendar>) {
  return {
    today: () => ref.current?.getApi().today(),
    prev: () => ref.current?.getApi().prev(),
    next: () => ref.current?.getApi().next(),
    changeView: (view: string) => ref.current?.getApi().changeView(view),
    getDate: () => ref.current?.getApi().getDate(),
  };
}
