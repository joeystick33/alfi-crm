'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  Phone,
  Building,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { apiCall } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function TodayWidget({ date = new Date() }) {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [date]);

  const loadAppointments = async () => {
    try {
      setError(null);
      const dateStr = date.toISOString().split('T')[0];
      const data = await apiCall(`/advisor/appointments?date=${dateStr}`);
      setAppointments(data.appointments || data.data || []);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      setError('Impossible de charger les rendez-vous');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type) => {
    const configs = {
      'BILAN': {
        label: 'Bilan',
        color: 'bg-blue-100 text-blue-700',
        icon: User
      },
      'SUIVI': {
        label: 'Suivi',
        color: 'bg-green-100 text-green-700',
        icon: User
      },
      'SIGNATURE': {
        label: 'Signature',
        color: 'bg-purple-100 text-purple-700',
        icon: User
      },
      'PROSPECTION': {
        label: 'Prospection',
        color: 'bg-orange-100 text-orange-700',
        icon: User
      },
      'INTERNE': {
        label: 'Interne',
        color: 'bg-slate-100 text-slate-700',
        icon: Building
      },
      'AUTRE': {
        label: 'Autre',
        color: 'bg-gray-100 text-gray-700',
        icon: User
      }
    };
    return configs[type] || configs.AUTRE;
  };

  const getLocationConfig = (locationType) => {
    const configs = {
      'BUREAU': {
        label: 'Bureau',
        icon: Building,
        color: 'text-slate-600'
      },
      'CLIENT': {
        label: 'Chez le client',
        icon: MapPin,
        color: 'text-blue-600'
      },
      'VISIO': {
        label: 'Visioconférence',
        icon: Video,
        color: 'text-purple-600'
      },
      'TELEPHONE': {
        label: 'Téléphone',
        icon: Phone,
        color: 'text-green-600'
      }
    };
    return configs[locationType] || configs.BUREAU;
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    const d = new Date(dateTime);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isNextAppointment = (appointment, index) => {
    if (index !== 0) return false;
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime || appointment.dateDebut);
    return appointmentTime > now;
  };

  const getTimeUntil = (dateTime) => {
    const now = new Date();
    const appointmentTime = new Date(dateTime);
    const diffMs = appointmentTime - now;
    
    if (diffMs < 0) return null;
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `Dans ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Dans ${diffHours}h`;
    }
    
    return null;
  };

  const isPast = (dateTime) => {
    return new Date(dateTime) < new Date();
  };

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return (
    <Card className="border-slate-200" role="region" aria-label={`Rendez-vous du ${isToday ? "jour" : date.toLocaleDateString('fr-FR')}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900" id="today-widget-title">
            <Calendar className="h-5 w-5 text-blue-600" aria-hidden="true" />
            {isToday ? "Aujourd'hui" : date.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </CardTitle>
          {appointments.length > 0 && (
            <Badge variant="default" className="bg-blue-100 text-blue-700" aria-label={`${appointments.length} rendez-vous`}>
              {appointments.length} RDV
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3" role="status" aria-label="Chargement des rendez-vous" aria-live="polite">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            ))}
            <span className="sr-only">Chargement en cours...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8" role="alert" aria-live="assertive">
            <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={loadAppointments}
              aria-label="Réessayer le chargement des rendez-vous"
            >
              Réessayer
            </Button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8" role="status">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-600 font-medium">
              Aucun rendez-vous {isToday ? "aujourd'hui" : "ce jour"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Profitez-en pour planifier vos prochains rendez-vous
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/dashboard/calendar')}
              aria-label="Voir le calendrier complet"
            >
              Voir le calendrier
            </Button>
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Liste des rendez-vous">
            {appointments.map((appointment, index) => {
              const typeConfig = getTypeConfig(appointment.type);
              const locationConfig = getLocationConfig(appointment.locationType);
              const TypeIcon = typeConfig.icon;
              const LocationIcon = locationConfig.icon;
              const isNext = isNextAppointment(appointment, index);
              const timeUntil = isNext ? getTimeUntil(appointment.startTime || appointment.dateDebut) : null;
              const past = isPast(appointment.startTime || appointment.dateDebut);
              
              const clientName = appointment.clientName || 
                (appointment.clientId?.firstName && appointment.clientId?.lastName
                  ? `${appointment.clientId.firstName} ${appointment.clientId.lastName}`
                  : appointment.titre || 'Rendez-vous');

              const appointmentLabel = `${isNext ? 'Prochain rendez-vous: ' : ''}${formatTime(appointment.startTime || appointment.dateDebut)} avec ${clientName}, ${typeConfig.label}, ${locationConfig.label}${past ? ', passé' : ''}`;

              return (
                <div
                  key={appointment._id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    isNext 
                      ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' 
                      : past
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white'
                  }`}
                  onClick={() => router.push(`/dashboard/appointments/${appointment._id}`)}
                  role="listitem"
                  aria-label={appointmentLabel}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/dashboard/appointments/${appointment._id}`);
                    }
                  }}
                >
                  {/* Time and Next Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isNext ? 'text-blue-600' : 'text-slate-600'}`} />
                      <span className={`text-sm font-semibold ${isNext ? 'text-blue-900' : 'text-slate-900'}`}>
                        {formatTime(appointment.startTime || appointment.dateDebut)}
                        {appointment.endTime || appointment.dateFin ? (
                          <span className="text-slate-500 font-normal">
                            {' - '}{formatTime(appointment.endTime || appointment.dateFin)}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isNext && timeUntil && (
                        <Badge variant="default" className="bg-blue-600 text-white text-xs">
                          {timeUntil}
                        </Badge>
                      )}
                      {past && (
                        <Badge variant="secondary" className="text-xs">
                          Passé
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Client Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className="h-4 w-4 text-slate-600 flex-shrink-0" />
                    <p className={`text-sm font-medium ${isNext ? 'text-blue-900' : 'text-slate-900'}`}>
                      {clientName}
                    </p>
                  </div>

                  {/* Type and Location */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                      {typeConfig.label}
                    </Badge>
                    <div className={`flex items-center gap-1 text-xs ${locationConfig.color}`}>
                      <LocationIcon className="h-3 w-3" />
                      <span>{locationConfig.label}</span>
                    </div>
                    {appointment.location && appointment.locationType !== 'VISIO' && (
                      <span className="text-xs text-slate-500 truncate">
                        • {appointment.location || appointment.lieu}
                      </span>
                    )}
                  </div>

                  {/* Video Link for Visio */}
                  {appointment.locationType === 'VISIO' && appointment.videoLink && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <a
                        href={appointment.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video className="h-3 w-3" />
                        Rejoindre la visio
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Description */}
                  {appointment.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {appointment.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* View All Button */}
        {!loading && !error && appointments.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => router.push('/dashboard/calendar')}
          >
            Voir tous les rendez-vous
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
