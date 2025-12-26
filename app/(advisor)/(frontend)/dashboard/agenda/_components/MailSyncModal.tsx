"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/_common/components/ui/Dialog";
import { Button } from "@/app/_common/components/ui/Button";
import { Input } from "@/app/_common/components/ui/Input";
import { Label } from "@/app/_common/components/ui/Label";
import { useToast } from "@/app/_common/hooks/use-toast";
import {
  Check,
  ExternalLink,
  Settings,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  Unlink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  connected: boolean;
  configured: boolean;
  lastSync: string | null;
  status: string | null;
  email: string | null;
  description: string;
  authUrl?: string;
}

interface MailSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete?: () => void;
}

export function MailSyncModal({
  open,
  onOpenChange,
  onSyncComplete,
}: MailSyncModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeTab, setActiveTab] = useState<"connect" | "settings">("connect");
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Google credentials form
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [savingGoogleCredentials, setSavingGoogleCredentials] = useState(false);
  const [hasGoogleCredentials, setHasGoogleCredentials] = useState(false);

  // Microsoft credentials form
  const [microsoftClientId, setMicrosoftClientId] = useState("");
  const [microsoftClientSecret, setMicrosoftClientSecret] = useState("");
  const [savingMicrosoftCredentials, setSavingMicrosoftCredentials] = useState(false);
  const [hasMicrosoftCredentials, setHasMicrosoftCredentials] = useState(false);

  // Fetch sync status on mount
  useEffect(() => {
    if (open) {
      fetchSyncStatus();
      fetchCredentialsStatus();
    }
  }, [open]);

  const fetchSyncStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/advisor/mail/sync");
      if (res.ok) {
        const data = await res.json();
        const mappedProviders: Provider[] = [
          {
            id: "gmail",
            name: "Gmail",
            icon: "G",
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            connected: data.providers.find((p: { id: string }) => p.id === "gmail")?.connected || false,
            configured: data.providers.find((p: { id: string }) => p.id === "gmail")?.configured || false,
            lastSync: data.providers.find((p: { id: string }) => p.id === "gmail")?.lastSync,
            status: data.providers.find((p: { id: string }) => p.id === "gmail")?.status,
            email: data.providers.find((p: { id: string }) => p.id === "gmail")?.email,
            description: "Synchronisez vos emails Gmail",
            authUrl: "/api/auth/google/mail",
          },
          {
            id: "outlook",
            name: "Microsoft Outlook",
            icon: "O",
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            connected: data.providers.find((p: { id: string }) => p.id === "outlook")?.connected || false,
            configured: data.providers.find((p: { id: string }) => p.id === "outlook")?.configured || false,
            lastSync: data.providers.find((p: { id: string }) => p.id === "outlook")?.lastSync,
            status: data.providers.find((p: { id: string }) => p.id === "outlook")?.status,
            email: data.providers.find((p: { id: string }) => p.id === "outlook")?.email,
            description: "Synchronisez vos emails Outlook",
            authUrl: "/api/auth/outlook?type=mail",
          },
        ];
        setProviders(mappedProviders);
      }
    } catch (error) {
      console.error("Error fetching mail sync status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentialsStatus = async () => {
    try {
      const [googleRes, microsoftRes] = await Promise.all([
        fetch("/api/settings/mail-credentials"),
        fetch("/api/settings/microsoft-credentials"),
      ]);
      
      if (googleRes.ok) {
        const data = await googleRes.json();
        setHasGoogleCredentials(data.hasClientId && data.hasClientSecret);
      }
      
      if (microsoftRes.ok) {
        const data = await microsoftRes.json();
        setHasMicrosoftCredentials(data.hasClientId && data.hasClientSecret);
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
    }
  };

  const handleConnect = (provider: Provider) => {
    if (!provider.configured) {
      setActiveTab("settings");
      toast({
        title: "Configuration requise",
        description: `Veuillez d'abord configurer vos identifiants ${provider.name}.`,
      });
      return;
    }

    if (provider.authUrl) {
      window.location.href = provider.authUrl;
    }
  };

  const handleDisconnect = async (providerId: string) => {
    setDisconnecting(providerId);
    try {
      const res = await fetch("/api/advisor/mail/sync", {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Déconnecté",
          description: "Votre messagerie a été déconnectée.",
        });
        fetchSyncStatus();
        onSyncComplete?.();
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter la messagerie.",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSaveGoogleCredentials = async () => {
    if (!googleClientId.trim() || !googleClientSecret.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setSavingGoogleCredentials(true);
    try {
      const res = await fetch("/api/settings/mail-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      });

      if (res.ok) {
        toast({
          title: "Enregistré",
          description: "Vos identifiants Google ont été sauvegardés.",
        });
        setHasGoogleCredentials(true);
        setGoogleClientId("");
        setGoogleClientSecret("");
        fetchSyncStatus();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'enregistrer les identifiants.",
        variant: "destructive",
      });
    } finally {
      setSavingGoogleCredentials(false);
    }
  };

  const handleSaveMicrosoftCredentials = async () => {
    if (!microsoftClientId.trim() || !microsoftClientSecret.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setSavingMicrosoftCredentials(true);
    try {
      const res = await fetch("/api/settings/microsoft-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: microsoftClientId,
          clientSecret: microsoftClientSecret,
        }),
      });

      if (res.ok) {
        toast({
          title: "Enregistré",
          description: "Vos identifiants Microsoft ont été sauvegardés.",
        });
        setHasMicrosoftCredentials(true);
        setMicrosoftClientId("");
        setMicrosoftClientSecret("");
        fetchSyncStatus();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'enregistrer les identifiants.",
        variant: "destructive",
      });
    } finally {
      setSavingMicrosoftCredentials(false);
    }
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            Synchronisation Email
          </DialogTitle>
          <DialogDescription>
            Connectez vos messageries pour synchroniser automatiquement vos emails avec vos clients.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab("connect")}
            className={cn(
              "flex-1 text-sm px-3 py-2 rounded-md transition-all font-medium",
              activeTab === "connect"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Connexions
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex-1 text-sm px-3 py-2 rounded-md transition-all font-medium",
              activeTab === "settings"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Settings className="w-4 h-4 inline mr-1" />
            Configuration
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "connect" ? (
            loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      provider.connected
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                          provider.iconBg,
                          provider.iconColor
                        )}
                      >
                        {provider.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {provider.name}
                        </h4>
                        {provider.connected ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Connecté</span>
                              {provider.lastSync && (
                                <span className="text-slate-400 ml-1">
                                  • {formatLastSync(provider.lastSync)}
                                </span>
                              )}
                            </div>
                            {provider.email && (
                              <span className="text-xs text-slate-500">{provider.email}</span>
                            )}
                          </div>
                        ) : provider.configured ? (
                          <p className="text-xs text-slate-500">
                            {provider.description}
                          </p>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Configuration requise</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {provider.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(provider.id)}
                        disabled={disconnecting === provider.id}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        {disconnecting === provider.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="w-4 h-4 mr-1" />
                            Déconnecter
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(provider)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Connecter
                      </Button>
                    )}
                  </div>
                ))}

                {/* Info box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mt-4">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-slate-700">
                        Synchronisation automatique
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Une fois connecté, vos emails seront synchronisés automatiquement
                        et associés à vos clients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* Google credentials config */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">G</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Gmail (Google)</h4>
                    <p className="text-xs text-slate-500">
                      {hasGoogleCredentials ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Configuré
                        </span>
                      ) : (
                        "Non configuré"
                      )}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4">
                  Pour activer la synchronisation Gmail, créez un projet sur
                  Google Cloud Console et configurez OAuth 2.0 avec le scope Gmail.
                </p>

                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mb-4"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ouvrir Google Cloud Console
                </a>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Client ID</Label>
                    <Input
                      type="password"
                      placeholder="xxx.apps.googleusercontent.com"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Client Secret</Label>
                    <Input
                      type="password"
                      placeholder="GOCSPX-..."
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSaveGoogleCredentials}
                    disabled={savingGoogleCredentials}
                    className="w-full"
                  >
                    {savingGoogleCredentials ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les identifiants"
                    )}
                  </Button>
                </div>
              </div>

              {/* Microsoft credentials config */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">O</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Microsoft Outlook</h4>
                    <p className="text-xs text-slate-500">
                      {hasMicrosoftCredentials ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Configuré
                        </span>
                      ) : (
                        "Non configuré"
                      )}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4">
                  Pour activer la synchronisation Outlook, créez une application sur
                  Azure Portal et configurez OAuth 2.0.
                </p>

                <a
                  href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mb-4"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ouvrir Azure Portal
                </a>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Application (client) ID</Label>
                    <Input
                      type="password"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={microsoftClientId}
                      onChange={(e) => setMicrosoftClientId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Client Secret</Label>
                    <Input
                      type="password"
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={microsoftClientSecret}
                      onChange={(e) => setMicrosoftClientSecret(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSaveMicrosoftCredentials}
                    disabled={savingMicrosoftCredentials}
                    className="w-full"
                  >
                    {savingMicrosoftCredentials ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les identifiants"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
