'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Clock, FileText } from 'lucide-react';
import { apiCall } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export default function AlertsWidget() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await apiCall('/api/advisor/alerts?urgent=true&limit=3');
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'sla':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (severity) => {
    // WCAG AA compliant colors (4.5:1 contrast ratio)
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
      case 'medium':
        return 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
    }
  };

  return (
    <Card className="border-slate-200" role="region" aria-label="Widget des alertes" aria-live="polite">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900" id="alerts-widget-title">
            <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden="true" />
            Alertes
          </CardTitle>
          <Badge variant="destructive" aria-label={`${alerts.length} alertes`}>{alerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Chargement des alertes">
            <div className="h-12 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            <span className="sr-only">Chargement en cours...</span>
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4" role="status">Aucune alerte</p>
        ) : (
          <div className="space-y-2" role="list" aria-labelledby="alerts-widget-title">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              const clientName = alert.particulierId?.firstName && alert.particulierId?.lastName
                ? `${alert.particulierId.firstName} ${alert.particulierId.lastName}`
                : null;
              
              const severityLabel = alert.severity === 'urgent' ? 'urgente' : alert.severity === 'high' ? 'haute priorité' : alert.severity === 'medium' ? 'priorité moyenne' : 'priorité basse';
              const alertAriaLabel = `Alerte ${severityLabel}: ${alert.title}${clientName ? `, concernant ${clientName}` : ''}`;

              return (
                <div
                  key={alert._id}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getAlertColor(alert.severity)}`}
                  onClick={() => {
                    if (alert.type === 'sla' && alert.reclamationId) {
                      router.push(`/dashboard/reclamations/${alert.reclamationId._id}`);
                    } else if (alert.type === 'deadline' && alert.projectId) {
                      router.push(`/dashboard/projets/${alert.projectId._id}`);
                    } else if (alert.actions?.[0]?.url) {
                      router.push(alert.actions[0].url);
                    }
                  }}
                  role="listitem"
                  aria-label={alertAriaLabel}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (alert.type === 'sla' && alert.reclamationId) {
                        router.push(`/dashboard/reclamations/${alert.reclamationId._id}`);
                      } else if (alert.type === 'deadline' && alert.projectId) {
                        router.push(`/dashboard/projets/${alert.projectId._id}`);
                      } else if (alert.actions?.[0]?.url) {
                        router.push(alert.actions[0].url);
                      }
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1">
                        {alert.title}
                      </p>
                      <p className="text-xs opacity-75 leading-tight">
                        {alert.message}
                      </p>
                      {clientName && (
                        <p className="text-xs opacity-60 mt-1">
                          {clientName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
