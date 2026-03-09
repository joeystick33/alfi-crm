'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/_common/components/ui/Dialog';
import { Button } from '@/app/_common/components/ui/Button';
import { Badge } from '@/app/_common/components/ui/Badge';
import { useToast } from '@/app/_common/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedAccount {
  id: string;
  provider: 'GMAIL' | 'OUTLOOK';
  email: string;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

interface AccountsResponse {
  accounts: ConnectedAccount[];
  message?: string;
}

// ─── Provider SVG icons ────────────────────────────────────────────────────────

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 24.5C44 34.165 35.941 42 26 42H22C12.059 42 4 34.165 4 24.5C4 14.835 12.059 7 22 7H26C35.941 7 44 14.835 44 24.5Z" fill="#F3F4F6" />
      <path d="M8 12L24 25L40 12" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="12" width="36" height="26" rx="2" stroke="#4285F4" strokeWidth="2.5" fill="none" />
      <path d="M6 12L24 26L42 12" stroke="#EA4335" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="22" height="32" rx="3" fill="#0078D4" />
      <path d="M26 16H44V32H26V16Z" fill="#50E6FF" opacity="0.8" />
      <path d="M26 16L44 16L35 24L26 16Z" fill="#0078D4" />
      <rect x="4" y="8" width="22" height="32" rx="3" fill="#0078D4" opacity="0.9" />
      <ellipse cx="15" cy="24" rx="6" ry="8" fill="white" opacity="0.9" />
    </svg>
  );
}

// ─── Tab types ─────────────────────────────────────────────────────────────────

type TabId = 'accounts' | 'gmail' | 'outlook';

const TABS: { id: TabId; label: string }[] = [
  { id: 'accounts', label: 'Comptes connectés' },
  { id: 'gmail', label: 'Connecter Gmail' },
  { id: 'outlook', label: 'Connecter Outlook' },
];

// ─── Main component ────────────────────────────────────────────────────────────

interface MailSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

export function MailSyncModal({ open, onOpenChange, onSyncComplete }: MailSyncModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('accounts');
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<'gmail' | 'outlook' | null>(null);

  // ── Load accounts ────────────────────────────────────────────────────────────

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch('/api/advisor/emails/accounts');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data: AccountsResponse = await res.json();
      setAccounts(data.accounts ?? []);
    } catch (err) {
      console.error('Erreur chargement comptes email:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les comptes email',
        variant: 'destructive',
      });
    } finally {
      setLoadingAccounts(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open, loadAccounts]);

  // ── Disconnect account ────────────────────────────────────────────────────────

  const handleDisconnect = async (account: ConnectedAccount) => {
    setDisconnecting(account.id);
    try {
      const res = await fetch('/api/advisor/mail/sync', { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur déconnexion');
      toast({
        title: 'Compte déconnecté',
        description: `${account.email} a été déconnecté.`,
      });
      await loadAccounts();
      onSyncComplete?.();
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de déconnecter ce compte',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(null);
    }
  };

  // ── Connect Gmail / Outlook ───────────────────────────────────────────────────

  const handleConnectGmail = () => {
    setConnectingProvider('gmail');
    window.location.href = '/api/auth/google/mail';
  };

  const handleConnectOutlook = () => {
    setConnectingProvider('outlook');
    window.location.href = '/api/auth/outlook';
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const formatLastSync = (dateStr: string | null): string => {
    if (!dateStr) return 'Jamais synchronisé';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSyncStatusBadge = (status: string | null) => {
    if (!status || status === 'SUCCESS') {
      return <Badge variant="success" size="xs">Synchronisé</Badge>;
    }
    if (status === 'DISCONNECTED') {
      return <Badge variant="warning" size="xs">Déconnecté</Badge>;
    }
    return <Badge variant="danger" size="xs">{status}</Badge>;
  };

  // ── Render tabs content ───────────────────────────────────────────────────────

  const renderAccountsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gérez vos comptes email synchronisés avec Aura CRM.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadAccounts}
          disabled={loadingAccounts}
          className="gap-1.5"
        >
          {loadingAccounts ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Actualiser
        </Button>
      </div>

      {loadingAccounts ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted/50" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Aucun compte connecté</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connectez un compte Gmail ou Outlook pour commencer la synchronisation.
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveTab('gmail')}>
              Connecter Gmail
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('outlook')}>
              Connecter Outlook
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  {account.provider === 'GMAIL' ? (
                    <GmailIcon className="h-6 w-6" />
                  ) : (
                    <OutlookIcon className="h-6 w-6" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{account.email}</p>
                    <Badge
                      variant={account.provider === 'GMAIL' ? 'danger' : 'info'}
                      size="xs"
                      shape="pill"
                    >
                      {account.provider === 'GMAIL' ? 'Gmail' : 'Outlook'}
                    </Badge>
                    {account.syncEnabled && getSyncStatusBadge(account.lastSyncStatus)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span>Dernière sync : {formatLastSync(account.lastSyncAt)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(account)}
                disabled={disconnecting === account.id}
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                {disconnecting === account.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Déconnecter
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGmailTab = () => (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-red-50/50 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <GmailIcon className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Connexion Gmail</h3>
          <p className="text-sm text-muted-foreground">
            Connectez votre compte Gmail pour synchroniser vos emails clients directement dans Aura CRM.
          </p>
        </div>
        <ul className="w-full space-y-2 text-left text-sm text-muted-foreground">
          {[
            'Synchronisation automatique des emails entrants',
            'Association automatique aux fiches clients',
            'Classification IA des emails',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        <strong>Remarque :</strong> Vous serez redirigé vers Google pour autoriser l&apos;accès.
        Aura CRM ne stocke que les tokens d&apos;accès nécessaires à la synchronisation.
      </div>

      <Button
        fullWidth
        onClick={handleConnectGmail}
        disabled={connectingProvider === 'gmail'}
        className="gap-2 bg-[#EA4335] text-white hover:bg-[#c5372c]"
      >
        {connectingProvider === 'gmail' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        Se connecter avec Gmail
      </Button>
    </div>
  );

  const renderOutlookTab = () => (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-blue-50/50 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <OutlookIcon className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Connexion Microsoft Outlook</h3>
          <p className="text-sm text-muted-foreground">
            Connectez votre compte Outlook ou Microsoft 365 pour synchroniser vos échanges clients.
          </p>
        </div>
        <ul className="w-full space-y-2 text-left text-sm text-muted-foreground">
          {[
            'Compatible Outlook, Hotmail, Microsoft 365',
            'Synchronisation des emails entrants et sortants',
            'Détection automatique des opportunités',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        <strong>Remarque :</strong> Vous serez redirigé vers Microsoft pour autoriser l&apos;accès.
        Aura CRM ne stocke que les tokens d&apos;accès nécessaires à la synchronisation.
      </div>

      <Button
        fullWidth
        onClick={handleConnectOutlook}
        disabled={connectingProvider === 'outlook'}
        className="gap-2 bg-[#0078D4] text-white hover:bg-[#005ea3]"
      >
        {connectingProvider === 'outlook' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        Se connecter avec Microsoft
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connexion des comptes email</DialogTitle>
          <DialogDescription>
            Connectez vos comptes Gmail ou Outlook pour synchroniser vos emails clients.
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[300px]">
          {activeTab === 'accounts' && renderAccountsTab()}
          {activeTab === 'gmail' && renderGmailTab()}
          {activeTab === 'outlook' && renderOutlookTab()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
