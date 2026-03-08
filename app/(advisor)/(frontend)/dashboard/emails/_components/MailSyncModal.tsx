'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog';
import { Button } from '@/app/_common/components/ui/Button';
import { useToast } from '@/app/_common/hooks/use-toast';
import { Loader2, Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MailSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

export function MailSyncModal({ open, onOpenChange, onSyncComplete }: MailSyncModalProps) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('syncing');
    setSyncMessage('Synchronisation en cours...');

    try {
      const res = await fetch('/api/advisor/emails/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Erreur de synchronisation');
      }

      const data = await res.json();
      
      setSyncStatus('success');
      setSyncMessage(`${data.newEmails || 0} nouveaux emails synchronisés`);
      
      toast({
        title: 'Synchronisation réussie',
        description: `${data.newEmails || 0} nouveaux emails`,
      });

      onSyncComplete?.();
      
      setTimeout(() => {
        onOpenChange(false);
        setSyncStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('Erreur sync:', err);
      setSyncStatus('error');
      setSyncMessage('Impossible de synchroniser les emails');
      
      toast({
        title: 'Erreur',
        description: 'La synchronisation a échoué',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            Synchroniser les emails
          </DialogTitle>
          <DialogDescription>
            Récupérer les nouveaux emails depuis votre boîte de réception
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className={cn(
            'flex flex-col items-center justify-center p-6 rounded-xl transition-colors',
            syncStatus === 'idle' && 'bg-slate-50',
            syncStatus === 'syncing' && 'bg-indigo-50',
            syncStatus === 'success' && 'bg-emerald-50',
            syncStatus === 'error' && 'bg-red-50'
          )}>
            {syncStatus === 'idle' && (
              <>
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-sm text-slate-600 text-center">
                  Cliquez sur synchroniser pour récupérer vos derniers emails
                </p>
              </>
            )}
            
            {syncStatus === 'syncing' && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm text-indigo-600 font-medium">{syncMessage}</p>
              </>
            )}
            
            {syncStatus === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm text-emerald-600 font-medium">{syncMessage}</p>
              </>
            )}
            
            {syncStatus === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-sm text-red-600 font-medium">{syncMessage}</p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={syncing}
          >
            Fermer
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Synchroniser
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
