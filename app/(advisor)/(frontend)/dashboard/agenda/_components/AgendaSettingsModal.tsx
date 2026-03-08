'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/_common/components/ui/Dialog';
import { Button } from '@/app/_common/components/ui/Button';
import { Input } from '@/app/_common/components/ui/Input';
import { Label } from '@/app/_common/components/ui/Label';
import { Switch } from '@/app/_common/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card';
import { useToast } from '@/app/_common/hooks/use-toast';
import {
  Clock,
  Palette,
  Flag,
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  Users,
  Phone,
  Video,
  CheckSquare,
  Bell,
  Coffee,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgendaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: AgendaConfig) => void;
}

export interface EventType {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface AgendaConfig {
  // Plages horaires
  workingHours: {
    start: string; // "08:00"
    end: string;   // "19:00"
  };
  slotDuration: number; // minutes (15, 30, 60)
  defaultEventDuration: number; // minutes
  
  // Jours de travail
  workingDays: number[]; // 0=dimanche, 1=lundi, etc.
  
  // Types d'événements
  eventTypes: EventType[];
  
  // Drapeaux/Priorités
  priorities: {
    id: string;
    name: string;
    color: string;
    icon: string;
  }[];
  
  // Affichage
  showWeekNumbers: boolean;
  firstDayOfWeek: number; // 0=dimanche, 1=lundi
  defaultView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
  
  // Rappels par défaut
  defaultReminders: number[]; // minutes avant l'événement
}

const DEFAULT_EVENT_TYPES: EventType[] = [
  { id: 'MEETING', name: 'Rendez-vous client', color: '#4f46e5', icon: 'Users', isDefault: true },
  { id: 'CALL', name: 'Appel téléphonique', color: '#0891b2', icon: 'Phone', isDefault: true },
  { id: 'VIDEO_CALL', name: 'Visioconférence', color: '#7c3aed', icon: 'Video', isDefault: true },
  { id: 'TASK', name: 'Tâche', color: '#f59e0b', icon: 'CheckSquare', isDefault: true },
  { id: 'REMINDER', name: 'Rappel', color: '#8b5cf6', icon: 'Bell', isDefault: true },
  { id: 'BREAK', name: 'Pause', color: '#6b7280', icon: 'Coffee', isDefault: false },
  { id: 'TRAINING', name: 'Formation', color: '#10b981', icon: 'GraduationCap', isDefault: false },
  { id: 'PERSONAL', name: 'Personnel', color: '#ec4899', icon: 'Heart', isDefault: false },
  { id: 'PROSPECTION', name: 'Prospection', color: '#f97316', icon: 'Briefcase', isDefault: false },
];

const DEFAULT_PRIORITIES = [
  { id: 'HIGH', name: 'Haute priorité', color: '#ef4444', icon: 'AlertTriangle' },
  { id: 'MEDIUM', name: 'Priorité moyenne', color: '#f59e0b', icon: 'Flag' },
  { id: 'LOW', name: 'Basse priorité', color: '#22c55e', icon: 'Flag' },
  { id: 'STARRED', name: 'Important', color: '#eab308', icon: 'Star' },
];

const DEFAULT_CONFIG: AgendaConfig = {
  workingHours: { start: '08:00', end: '19:00' },
  slotDuration: 30,
  defaultEventDuration: 60,
  workingDays: [1, 2, 3, 4, 5], // Lundi à vendredi
  eventTypes: DEFAULT_EVENT_TYPES,
  priorities: DEFAULT_PRIORITIES,
  showWeekNumbers: true,
  firstDayOfWeek: 1, // Lundi
  defaultView: 'timeGridWeek',
  defaultReminders: [15, 60], // 15min et 1h avant
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
  Star,
  AlertTriangle,
  Flag,
};

const AVAILABLE_COLORS = [
  '#4f46e5', '#7c3aed', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0891b2',
  '#0ea5e9', '#3b82f6', '#6366f1', '#6b7280',
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche', short: 'Dim' },
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
];

export function AgendaSettingsModal({ isOpen, onClose, onSettingsChange }: AgendaSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('horaires');

  // Charger la configuration
  const { data, isLoading } = useQuery({
    queryKey: ['agenda-settings'],
    queryFn: async () => {
      const res = await fetch('/api/advisor/agenda-settings');
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
    enabled: isOpen,
  });

  // Sauvegarder la configuration
  const saveMutation = useMutation({
    mutationFn: async (newConfig: AgendaConfig) => {
      const res = await fetch('/api/advisor/agenda-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Paramètres sauvegardés', description: 'Vos préférences ont été enregistrées.' });
      queryClient.invalidateQueries({ queryKey: ['agenda-settings'] });
      onSettingsChange?.(config);
      onClose();
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les paramètres.', variant: 'destructive' });
    },
  });

  // Charger la config depuis l'API
  useEffect(() => {
    if (data?.config) {
      setConfig({ ...DEFAULT_CONFIG, ...data.config });
    }
  }, [data]);

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  const updateConfig = <K extends keyof AgendaConfig>(key: K, value: AgendaConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleWorkingDay = (day: number) => {
    setConfig(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort(),
    }));
  };

  const updateEventType = (id: string, updates: Partial<EventType>) => {
    setConfig(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.map(et => et.id === id ? { ...et, ...updates } : et),
    }));
  };

  const addEventType = () => {
    const newId = `CUSTOM_${Date.now()}`;
    setConfig(prev => ({
      ...prev,
      eventTypes: [...prev.eventTypes, {
        id: newId,
        name: 'Nouveau type',
        color: AVAILABLE_COLORS[prev.eventTypes.length % AVAILABLE_COLORS.length],
        icon: 'Calendar',
        isDefault: false,
      }],
    }));
  };

  const removeEventType = (id: string) => {
    setConfig(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.filter(et => et.id !== id),
    }));
  };

  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = ICON_MAP[iconName] || Calendar;
    return <IconComponent className={className} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Paramètres de l'agenda
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="horaires" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horaires
              </TabsTrigger>
              <TabsTrigger value="types" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Types & Couleurs
              </TabsTrigger>
              <TabsTrigger value="priorites" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Priorités
              </TabsTrigger>
              <TabsTrigger value="affichage" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Affichage
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2">
              {/* Onglet Horaires */}
              <TabsContent value="horaires" className="space-y-6 mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Plages horaires de travail</CardTitle>
                    <CardDescription>Définissez vos heures de disponibilité</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Heure de début</Label>
                        <Input
                          type="time"
                          value={config.workingHours.start}
                          onChange={(e) => updateConfig('workingHours', { ...config.workingHours, start: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Heure de fin</Label>
                        <Input
                          type="time"
                          value={config.workingHours.end}
                          onChange={(e) => updateConfig('workingHours', { ...config.workingHours, end: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Durée des créneaux</Label>
                      <div className="flex gap-2 mt-2">
                        {[15, 30, 45, 60].map((duration) => (
                          <Button
                            key={duration}
                            type="button"
                            variant={config.slotDuration === duration ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => updateConfig('slotDuration', duration)}
                          >
                            {duration} min
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Durée par défaut des événements</Label>
                      <div className="flex gap-2 mt-2">
                        {[15, 30, 45, 60, 90, 120].map((duration) => (
                          <Button
                            key={duration}
                            type="button"
                            variant={config.defaultEventDuration === duration ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => updateConfig('defaultEventDuration', duration)}
                          >
                            {duration >= 60 ? `${duration / 60}h` : `${duration}min`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Jours de travail</CardTitle>
                    <CardDescription>Sélectionnez vos jours ouvrés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={config.workingDays.includes(day.value) ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => toggleWorkingDay(day.value)}
                          className="flex-1"
                        >
                          {day.short}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Rappels par défaut</CardTitle>
                    <CardDescription>Notifications avant chaque événement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15, 30, 60, 120, 1440].map((minutes) => {
                        const isSelected = config.defaultReminders.includes(minutes);
                        const label = minutes >= 1440 
                          ? `${minutes / 1440}j` 
                          : minutes >= 60 
                            ? `${minutes / 60}h` 
                            : `${minutes}min`;
                        return (
                          <Button
                            key={minutes}
                            type="button"
                            variant={isSelected ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => {
                              updateConfig('defaultReminders', 
                                isSelected 
                                  ? config.defaultReminders.filter(r => r !== minutes)
                                  : [...config.defaultReminders, minutes].sort((a, b) => a - b)
                              );
                            }}
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Types & Couleurs */}
              <TabsContent value="types" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Types d'événements</CardTitle>
                        <CardDescription>Personnalisez les catégories et couleurs</CardDescription>
                      </div>
                      <Button size="sm" onClick={addEventType}>
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.eventTypes.map((eventType) => (
                      <div
                        key={eventType.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                      >
                        {/* Icône avec couleur */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${eventType.color}20` }}
                        >
                          {renderIcon(eventType.icon, 'w-5 h-5')}
                        </div>

                        {/* Nom */}
                        <Input
                          value={eventType.name}
                          onChange={(e) => updateEventType(eventType.id, { name: e.target.value })}
                          className="flex-1"
                          placeholder="Nom du type"
                        />

                        {/* Sélecteur de couleur */}
                        <div className="relative">
                          <input
                            type="color"
                            value={eventType.color}
                            onChange={(e) => updateEventType(eventType.id, { color: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                            style={{ backgroundColor: eventType.color }}
                          />
                        </div>

                        {/* Sélecteur d'icône */}
                        <select
                          value={eventType.icon}
                          onChange={(e) => updateEventType(eventType.id, { icon: e.target.value })}
                          className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                        >
                          {Object.keys(ICON_MAP).map((iconName) => (
                            <option key={iconName} value={iconName}>{iconName}</option>
                          ))}
                        </select>

                        {/* Supprimer (sauf défauts) */}
                        {!eventType.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEventType(eventType.id)}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Palette de couleurs rapide */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Palette de couleurs</CardTitle>
                    <CardDescription>Couleurs disponibles pour vos événements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <div
                          key={color}
                          className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Priorités */}
              <TabsContent value="priorites" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Niveaux de priorité</CardTitle>
                    <CardDescription>Drapeaux et indicateurs d'importance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.priorities.map((priority, index) => (
                      <div
                        key={priority.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                      >
                        {/* Icône avec couleur */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${priority.color}20` }}
                        >
                          {renderIcon(priority.icon, 'w-5 h-5')}
                        </div>

                        {/* Nom */}
                        <Input
                          value={priority.name}
                          onChange={(e) => {
                            const newPriorities = [...config.priorities];
                            newPriorities[index] = { ...priority, name: e.target.value };
                            updateConfig('priorities', newPriorities);
                          }}
                          className="flex-1"
                        />

                        {/* Couleur */}
                        <input
                          type="color"
                          value={priority.color}
                          onChange={(e) => {
                            const newPriorities = [...config.priorities];
                            newPriorities[index] = { ...priority, color: e.target.value };
                            updateConfig('priorities', newPriorities);
                          }}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Affichage */}
              <TabsContent value="affichage" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Préférences d'affichage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Vue par défaut</Label>
                      <div className="flex gap-2 mt-2">
                        {[
                          { value: 'dayGridMonth', label: 'Mois' },
                          { value: 'timeGridWeek', label: 'Semaine' },
                          { value: 'timeGridDay', label: 'Jour' },
                          { value: 'listWeek', label: 'Liste' },
                        ].map((view) => (
                          <Button
                            key={view.value}
                            type="button"
                            variant={config.defaultView === view.value ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => updateConfig('defaultView', view.value as AgendaConfig['defaultView'])}
                          >
                            {view.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Premier jour de la semaine</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant={config.firstDayOfWeek === 1 ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => updateConfig('firstDayOfWeek', 1)}
                        >
                          Lundi
                        </Button>
                        <Button
                          type="button"
                          variant={config.firstDayOfWeek === 0 ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => updateConfig('firstDayOfWeek', 0)}
                        >
                          Dimanche
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <Label>Afficher les numéros de semaine</Label>
                        <p className="text-xs text-slate-500">Affiche le numéro de semaine dans la vue mois</p>
                      </div>
                      <Switch
                        checked={config.showWeekNumbers}
                        onCheckedChange={(checked) => updateConfig('showWeekNumbers', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Footer avec boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook pour utiliser les paramètres de l'agenda
export function useAgendaSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['agenda-settings'],
    queryFn: async () => {
      const res = await fetch('/api/advisor/agenda-settings');
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const config: AgendaConfig = data?.config ? { ...DEFAULT_CONFIG, ...data.config } : DEFAULT_CONFIG;

  return { config, isLoading };
}
