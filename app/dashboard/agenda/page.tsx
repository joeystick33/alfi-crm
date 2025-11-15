'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isVirtual: boolean;
  meetingUrl?: string;
  status: string;
  type: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  clientName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ appointments: Appointment[] }>('/advisor/appointments?view=week');
      setAppointments(response.appointments || []);
    } catch (err) {
      console.error('Erreur chargement rendez-vous:', err);
      setError((err as Error).message || 'Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'info' | 'success' | 'destructive' | 'warning'> = {
      SCHEDULED: 'default',
      CONFIRMED: 'info',
      COMPLETED: 'success',
      CANCELLED: 'destructive',
      NO_SHOW: 'warning',
    };
    const labels: Record<string, string> = {
      SCHEDULED: 'Planifié',
      CONFIRMED: 'Confirmé',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
      NO_SHOW: 'Absent',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      FIRST_MEETING: 'Premier RDV',
      FOLLOW_UP: 'Suivi',
      ANNUAL_REVIEW: 'Bilan annuel',
      SIGNING: 'Signature',
      PHONE_CALL: 'Appel',
      VIDEO_CALL: 'Visio',
      OTHER: 'Autre',
    };
    return (
      <Badge variant="default">
        {labels[type] || type}
      </Badge>
    );
  };

  // Group appointments by date
  const groupedAppointments = appointments.reduce((acc, apt) => {
    const date = new Date(apt.startTime).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mon Agenda
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {appointments.length} rendez-vous cette semaine
            </p>
          </div>
        </div>

        <Button
          onClick={() => {/* TODO: Open modal */}}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" title="Erreur" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Appointments List */}
      {loading ? (
        <Card>
          <CardContent>
            <div className="space-y-3 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucun rendez-vous cette semaine
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments).map(([date, apts]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">{date}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apts.map(apt => (
                    <div
                      key={apt.id}
                      className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {apt.title}
                            </div>
                            {apt.clientName && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {apt.clientName}
                              </div>
                            )}
                            {apt.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {apt.description}
                              </div>
                            )}
                            {apt.location && !apt.isVirtual && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                📍 {apt.location}
                              </div>
                            )}
                            {apt.isVirtual && apt.meetingUrl && (
                              <div className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                                🎥 Visioconférence
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {getTypeBadge(apt.type)}
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(apt.startTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(apt.endTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
