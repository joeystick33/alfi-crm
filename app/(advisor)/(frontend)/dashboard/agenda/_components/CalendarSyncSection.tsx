'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Badge } from '@/app/_common/components/ui/Badge';
import { useToast } from '@/app/_common/hooks/use-toast';
import {
  RefreshCw,
  Link2,
  Link2Off,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  configured: boolean;
  lastSync: string | null;
  status: string | null;
}

interface CalendarSyncStatus {
  providers: CalendarProvider[];
  currentProvider: string | null;
  syncEnabled: boolean;
  lastSyncAt: string | null;
}

export function CalendarSyncSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // Fetch sync status
  const { data: syncStatus, isLoading, refetch } = useQuery<CalendarSyncStatus>({
    queryKey: ['calendar-sync-status'],
    queryFn: async () => {
      const res = await fetch('/api/advisor/calendar/sync');
      if (!res.ok) throw new Error('Erreur chargement statut');
      return res.json();
    },
    staleTime: 30000,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/advisor/calendar/sync', { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur déconnexion');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Calendrier déconnecté',
        description: 'La synchronisation a été désactivée.',
      });
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-status'] });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de déconnecter le calendrier.',
        variant: 'destructive',
      });
    },
  });

  // Handle URL params for success/error messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'true' || success === 'outlook_connected') {
      toast({
        title: 'Calendrier connecté',
        description: 'Votre calendrier est maintenant synchronisé.',
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      refetch();
    }

    if (error) {
      let message = 'Une erreur est survenue.';
      if (error === 'google_not_configured') {
        message = 'Google Calendar n\'est pas configuré pour votre cabinet. Contactez votre administrateur.';
      } else if (error === 'outlook_not_configured') {
        message = 'Microsoft Outlook n\'est pas configuré pour votre cabinet. Contactez votre administrateur.';
      }
      toast({
        title: 'Erreur de connexion',
        description: message,
        variant: 'destructive',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, refetch]);

  const handleConnect = (providerId: string) => {
    setConnectingProvider(providerId);
    
    if (providerId === 'google') {
      window.location.href = '/api/auth/google';
    } else if (providerId === 'outlook') {
      window.location.href = '/api/auth/outlook?type=calendar';
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const getProviderIcon = (providerId: string) => {
    if (providerId === 'google') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      );
    }
    if (providerId === 'outlook') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.354.228-.586.228h-8.176v-6.451l1.615 1.18a.378.378 0 0 0 .461-.008l6.924-5.455v-.548zm-9 5.218v7.395H1.824c-.232 0-.428-.076-.586-.228A.768.768 0 0 1 1 19.196V4.804c0-.23.08-.424.238-.576.158-.152.354-.228.586-.228H15v8.605zm9-7.605v.548l-6.924 5.455a.378.378 0 0 1-.461.008L15 9.831V5h7.176c.232 0 .428.076.586.228.158.152.238.346.238.576v-.804zM9.5 8C7.015 8 5 10.015 5 12.5S7.015 17 9.5 17 14 14.985 14 12.5 11.985 8 9.5 8zm0 7.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
        </svg>
      );
    }
    return <Calendar className="w-5 h-5 text-slate-400" />;
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const connectedProvider = syncStatus?.providers?.find(p => p.connected);

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Synchronisation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {connectedProvider ? (
          // Connected state
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                {getProviderIcon(connectedProvider.id)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {connectedProvider.name}
                  </span>
                  <Badge variant="success" size="xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connecté
                  </Badge>
                </div>
                {syncStatus?.lastSyncAt && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dernière sync: {format(new Date(syncStatus.lastSyncAt), 'dd MMM à HH:mm', { locale: fr })}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2Off className="w-4 h-4 mr-2" />
              )}
              Déconnecter
            </Button>
          </div>
        ) : (
          // Not connected state
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-3">
              Synchronisez votre agenda avec Google Calendar ou Outlook pour centraliser vos rendez-vous.
            </p>
            {syncStatus?.providers?.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleConnect(provider.id)}
                disabled={!provider.configured || connectingProvider === provider.id}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                  provider.configured
                    ? 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer'
                    : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  {getProviderIcon(provider.id)}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-slate-900">
                    {provider.name}
                  </span>
                  {!provider.configured && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" />
                      Non configuré
                    </p>
                  )}
                </div>
                {connectingProvider === provider.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <Link2 className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
