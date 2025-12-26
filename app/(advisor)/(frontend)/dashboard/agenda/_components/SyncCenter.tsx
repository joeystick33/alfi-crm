"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_common/components/ui/Card";
import { Button } from "@/app/_common/components/ui/Button";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Settings,
  Loader2,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";
import { useToast } from "@/app/_common/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarSyncModal } from "./CalendarSyncModal";

interface Provider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  configured: boolean;
  lastSync: string | null;
  status: string | null;
}

export function SyncCenter() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // Fetch real status on mount
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/advisor/calendar/sync");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error("Error fetching sync status:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectedCount = providers.filter((p) => p.connected).length;

  const formatLastSync = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <>
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Synchronisation
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSyncStatus}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
          <CardDescription className="text-xs">
            {connectedCount > 0
              ? `${connectedCount} calendrier${connectedCount > 1 ? "s" : ""} connecté${connectedCount > 1 ? "s" : ""}`
              : "Aucun calendrier connecté"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    provider.connected
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold",
                        provider.id === "google"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      )}
                    >
                      {provider.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">
                        {provider.name}
                      </h4>
                      {provider.connected ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Connecté</span>
                          {provider.lastSync && (
                            <span className="text-slate-400 flex items-center gap-0.5 ml-1">
                              <Clock className="w-3 h-3" />
                              {formatLastSync(provider.lastSync)}
                            </span>
                          )}
                        </div>
                      ) : provider.configured ? (
                        <p className="text-xs text-slate-500">Prêt à connecter</p>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Config. requise</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Action button */}
              <Button
                onClick={() => setSyncModalOpen(true)}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Gérer les connexions
              </Button>

              {/* Quick stats */}
              {connectedCount > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Prochaine sync</span>
                    <span className="text-slate-700 font-medium">Dans ~15 min</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de synchronisation */}
      <CalendarSyncModal
        open={syncModalOpen}
        onOpenChange={setSyncModalOpen}
        onSyncComplete={fetchSyncStatus}
      />
    </>
  );
}
