'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import {
  Clock,
  Users,
  Phone,
  Video,
  CheckSquare,
  Bell,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { CalendarEvent } from './FullCalendarWrapper';
import { CalendarSyncSection } from './CalendarSyncSection';

interface AgendaSidebarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onNewEvent: () => void;
}

const EVENT_ICONS: Record<string, typeof Users> = {
  MEETING: Users,
  CALL: Phone,
  VIDEO_CALL: Video,
  TASK: CheckSquare,
  REMINDER: Bell,
};

const EVENT_COLORS: Record<string, string> = {
  MEETING: '#4f46e5',
  CALL: '#0891b2',
  VIDEO_CALL: '#7c3aed',
  TASK: '#f59e0b',
  REMINDER: '#8b5cf6',
};

export function AgendaSidebar({ events, onEventClick, onNewEvent }: AgendaSidebarProps) {
  // Prochains événements (7 jours)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekLater = addDays(now, 7);
    return events
      .filter((e) => e.start >= now && e.start <= weekLater)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 8);
  }, [events]);

  // Grouper par jour
  const groupedEvents = useMemo(() => {
    const groups: { date: Date; label: string; events: CalendarEvent[] }[] = [];
    
    upcomingEvents.forEach((event) => {
      const dateKey = format(event.start, 'yyyy-MM-dd');
      let group = groups.find((g) => format(g.date, 'yyyy-MM-dd') === dateKey);
      
      if (!group) {
        let label = format(event.start, 'EEEE d MMMM', { locale: fr });
        if (isToday(event.start)) label = "Aujourd'hui";
        else if (isTomorrow(event.start)) label = 'Demain';
        
        group = { date: event.start, label, events: [] };
        groups.push(group);
      }
      
      group.events.push(event);
    });
    
    return groups;
  }, [upcomingEvents]);

  return (
    <div className="w-[320px] space-y-4 flex flex-col">
      {/* Mini Calendar Widget - Placeholder for future date picker */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">
              {format(new Date(), 'd')}
            </p>
            <p className="text-sm text-slate-500">
              {format(new Date(), 'MMMM yyyy', { locale: fr })}
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              {format(new Date(), 'EEEE', { locale: fr })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="flex-1 border-slate-200 bg-white overflow-hidden">
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
        <CardContent className="p-0 overflow-y-auto max-h-[500px]">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                Aucun événement prévu
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Les 7 prochains jours sont libres
              </p>
              <Button
                size="sm"
                onClick={onNewEvent}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nouveau RDV
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groupedEvents.map((group) => (
                <div key={group.label}>
                  {/* Day header */}
                  <div className="px-4 py-2 bg-slate-50 sticky top-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {group.label}
                    </p>
                  </div>
                  {/* Events */}
                  {group.events.map((event) => {
                    const Icon = EVENT_ICONS[event.type] || Users;
                    const color = EVENT_COLORS[event.type] || '#4f46e5';
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => onEventClick(event)}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-slate-900 truncate">
                              {event.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(event.start, 'HH:mm', { locale: fr })}
                            {' - '}
                            {format(event.end, 'HH:mm', { locale: fr })}
                          </p>
                          {event.client?.name && (
                            <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.client.name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 group-hover:text-slate-500 transition-colors mt-3" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-3">
          <Button
            onClick={onNewEvent}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau rendez-vous
          </Button>
        </CardContent>
      </Card>

      {/* Calendar Sync */}
      <CalendarSyncSection />
    </div>
  );
}
