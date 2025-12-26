'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/app/_common/components/ui/Dialog';
import { Button } from '@/app/_common/components/ui/Button';
import { Input } from '@/app/_common/components/ui/Input';
import { Label } from '@/app/_common/components/ui/Label';
import { Switch } from '@/app/_common/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs';
import { useToast } from '@/app/_common/hooks/use-toast';
import { 
  Settings, 
  Clock, 
  Calendar, 
  Bell, 
  Repeat,
  Briefcase,
  Coffee,
  Palette,
  Save,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgendaSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WorkingHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface EventType {
  id: string;
  name: string;
  color: string;
  duration: number;
  icon: string;
}

interface RecurringBlock {
  id: string;
  name: string;
  type: 'administrative' | 'break' | 'meeting' | 'custom';
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
  color: string;
}

interface AgendaConfig {
  workingHours: {
    monday: WorkingHours;
    tuesday: WorkingHours;
    wednesday: WorkingHours;
    thursday: WorkingHours;
    friday: WorkingHours;
    saturday: WorkingHours;
    sunday: WorkingHours;
  };
  defaultEventDuration: number;
  defaultView: 'month' | 'week' | 'day' | 'agenda';
  weekStartsOn: 0 | 1;
  timeSlotDuration: number;
  showWeekends: boolean;
  eventTypes: EventType[];
  recurringBlocks: RecurringBlock[];
  notifications: {
    emailReminder: boolean;
    emailReminderTime: number;
    browserNotification: boolean;
    browserNotificationTime: number;
  };
}

const DEFAULT_CONFIG: AgendaConfig = {
  workingHours: {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: false, start: '09:00', end: '12:00' },
    sunday: { enabled: false, start: '09:00', end: '12:00' },
  },
  defaultEventDuration: 60,
  defaultView: 'week',
  weekStartsOn: 1,
  timeSlotDuration: 30,
  showWeekends: true,
  eventTypes: [
    { id: '1', name: 'Rendez-vous client', color: '#4f46e5', duration: 60, icon: 'users' },
    { id: '2', name: 'Appel téléphonique', color: '#0891b2', duration: 30, icon: 'phone' },
    { id: '3', name: 'Visioconférence', color: '#7c3aed', duration: 45, icon: 'video' },
    { id: '4', name: 'Administratif', color: '#d97706', duration: 60, icon: 'briefcase' },
    { id: '5', name: 'Formation', color: '#059669', duration: 120, icon: 'book' },
  ],
  recurringBlocks: [],
  notifications: {
    emailReminder: true,
    emailReminderTime: 60,
    browserNotification: true,
    browserNotificationTime: 15,
  },
};

const DAYS_FR = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const COLORS = [
  '#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', 
  '#dc2626', '#db2777', '#9333ea', '#2563eb', '#0d9488',
];

export function AgendaSettings({ open, onOpenChange }: AgendaSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('hours');

  // Fetch config on mount
  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/advisor/agenda-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig({ ...DEFAULT_CONFIG, ...data.config });
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/advisor/agenda-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      
      if (res.ok) {
        toast({ title: 'Paramètres enregistrés', description: 'Vos préférences ont été sauvegardées.' });
        onOpenChange(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les paramètres.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHours = (day: keyof typeof config.workingHours, field: keyof WorkingHours, value: any) => {
    setConfig(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const addEventType = () => {
    const newType: EventType = {
      id: Date.now().toString(),
      name: 'Nouveau type',
      color: COLORS[config.eventTypes.length % COLORS.length],
      duration: 60,
      icon: 'calendar',
    };
    setConfig(prev => ({
      ...prev,
      eventTypes: [...prev.eventTypes, newType],
    }));
  };

  const updateEventType = (id: string, field: keyof EventType, value: any) => {
    setConfig(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.map(t => t.id === id ? { ...t, [field]: value } : t),
    }));
  };

  const removeEventType = (id: string) => {
    setConfig(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.filter(t => t.id !== id),
    }));
  };

  const addRecurringBlock = () => {
    const newBlock: RecurringBlock = {
      id: Date.now().toString(),
      name: 'Nouveau créneau',
      type: 'administrative',
      dayOfWeek: [1], // Monday
      startTime: '09:00',
      endTime: '10:00',
      color: '#d97706',
    };
    setConfig(prev => ({
      ...prev,
      recurringBlocks: [...prev.recurringBlocks, newBlock],
    }));
  };

  const updateRecurringBlock = (id: string, field: keyof RecurringBlock, value: any) => {
    setConfig(prev => ({
      ...prev,
      recurringBlocks: prev.recurringBlocks.map(b => b.id === id ? { ...b, [field]: value } : b),
    }));
  };

  const removeRecurringBlock = (id: string) => {
    setConfig(prev => ({
      ...prev,
      recurringBlocks: prev.recurringBlocks.filter(b => b.id !== id),
    }));
  };

  const toggleBlockDay = (blockId: string, day: number) => {
    const block = config.recurringBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    const newDays = block.dayOfWeek.includes(day)
      ? block.dayOfWeek.filter(d => d !== day)
      : [...block.dayOfWeek, day].sort();
    
    updateRecurringBlock(blockId, 'dayOfWeek', newDays);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Paramètres de l'agenda
          </DialogTitle>
          <DialogDescription>
            Configurez vos heures de travail, types d'événements et créneaux récurrents
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="hours" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horaires
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Types
              </TabsTrigger>
              <TabsTrigger value="recurring" className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Récurrents
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2">
              {/* Working Hours Tab */}
              <TabsContent value="hours" className="mt-0 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">Heures de travail</h3>
                  <div className="space-y-3">
                    {(Object.keys(config.workingHours) as Array<keyof typeof config.workingHours>).map((day) => (
                      <div key={day} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-100">
                        <div className="w-24">
                          <Switch
                            checked={config.workingHours[day].enabled}
                            onCheckedChange={(checked) => updateWorkingHours(day, 'enabled', checked)}
                          />
                        </div>
                        <span className={cn(
                          "w-24 text-sm font-medium",
                          config.workingHours[day].enabled ? "text-slate-900" : "text-slate-400"
                        )}>
                          {DAYS_FR[day]}
                        </span>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={config.workingHours[day].start}
                            onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                            disabled={!config.workingHours[day].enabled}
                            className="w-32"
                          />
                          <span className="text-slate-400">à</span>
                          <Input
                            type="time"
                            value={config.workingHours[day].end}
                            onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                            disabled={!config.workingHours[day].enabled}
                            className="w-32"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">Préférences d'affichage</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vue par défaut</Label>
                      <Select
                        value={config.defaultView}
                        onValueChange={(val) => setConfig(prev => ({ ...prev, defaultView: val as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Mois</SelectItem>
                          <SelectItem value="week">Semaine</SelectItem>
                          <SelectItem value="day">Jour</SelectItem>
                          <SelectItem value="agenda">Liste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Durée créneau (min)</Label>
                      <Select
                        value={config.timeSlotDuration.toString()}
                        onValueChange={(val) => setConfig(prev => ({ ...prev, timeSlotDuration: parseInt(val) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 heure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Début de semaine</Label>
                      <Select
                        value={config.weekStartsOn.toString()}
                        onValueChange={(val) => setConfig(prev => ({ ...prev, weekStartsOn: parseInt(val) as 0 | 1 }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Lundi</SelectItem>
                          <SelectItem value="0">Dimanche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Durée RDV par défaut</Label>
                      <Select
                        value={config.defaultEventDuration.toString()}
                        onValueChange={(val) => setConfig(prev => ({ ...prev, defaultEventDuration: parseInt(val) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 heure</SelectItem>
                          <SelectItem value="90">1h30</SelectItem>
                          <SelectItem value="120">2 heures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <div>
                      <Label>Afficher les week-ends</Label>
                      <p className="text-xs text-slate-500">Masquer samedi et dimanche si désactivé</p>
                    </div>
                    <Switch
                      checked={config.showWeekends}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showWeekends: checked }))}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Event Types Tab */}
              <TabsContent value="events" className="mt-0 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-900">Types d'événements</h3>
                    <Button size="sm" variant="outline" onClick={addEventType}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {config.eventTypes.map((eventType) => (
                      <div key={eventType.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                        <div 
                          className="w-4 h-10 rounded-full cursor-pointer"
                          style={{ backgroundColor: eventType.color }}
                          onClick={() => {
                            const currentIndex = COLORS.indexOf(eventType.color);
                            const nextIndex = (currentIndex + 1) % COLORS.length;
                            updateEventType(eventType.id, 'color', COLORS[nextIndex]);
                          }}
                        />
                        <Input
                          value={eventType.name}
                          onChange={(e) => updateEventType(eventType.id, 'name', e.target.value)}
                          className="flex-1"
                          placeholder="Nom du type"
                        />
                        <Select
                          value={eventType.duration.toString()}
                          onValueChange={(val) => updateEventType(eventType.id, 'duration', parseInt(val))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="45">45 min</SelectItem>
                            <SelectItem value="60">1h</SelectItem>
                            <SelectItem value="90">1h30</SelectItem>
                            <SelectItem value="120">2h</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEventType(eventType.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Recurring Blocks Tab */}
              <TabsContent value="recurring" className="mt-0 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-slate-900">Créneaux récurrents</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Bloquez des créneaux pour l'administratif, les pauses, etc.
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={addRecurringBlock}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  
                  {config.recurringBlocks.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-2">Aucun créneau récurrent</p>
                      <p className="text-xs text-slate-400">
                        Créez des créneaux pour bloquer du temps administratif, pauses déjeuner, etc.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {config.recurringBlocks.map((block) => (
                        <div key={block.id} className="p-4 bg-white rounded-lg border border-slate-100 space-y-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-10 rounded-full cursor-pointer"
                              style={{ backgroundColor: block.color }}
                              onClick={() => {
                                const currentIndex = COLORS.indexOf(block.color);
                                const nextIndex = (currentIndex + 1) % COLORS.length;
                                updateRecurringBlock(block.id, 'color', COLORS[nextIndex]);
                              }}
                            />
                            <Input
                              value={block.name}
                              onChange={(e) => updateRecurringBlock(block.id, 'name', e.target.value)}
                              className="flex-1"
                              placeholder="Nom du créneau"
                            />
                            <Select
                              value={block.type}
                              onValueChange={(val) => updateRecurringBlock(block.id, 'type', val)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="administrative">Administratif</SelectItem>
                                <SelectItem value="break">Pause</SelectItem>
                                <SelectItem value="meeting">Réunion interne</SelectItem>
                                <SelectItem value="custom">Personnalisé</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeRecurringBlock(block.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={block.startTime}
                                onChange={(e) => updateRecurringBlock(block.id, 'startTime', e.target.value)}
                                className="w-28"
                              />
                              <span className="text-slate-400">à</span>
                              <Input
                                type="time"
                                value={block.endTime}
                                onChange={(e) => updateRecurringBlock(block.id, 'endTime', e.target.value)}
                                className="w-28"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {[
                              { day: 1, label: 'L' },
                              { day: 2, label: 'M' },
                              { day: 3, label: 'Me' },
                              { day: 4, label: 'J' },
                              { day: 5, label: 'V' },
                              { day: 6, label: 'S' },
                              { day: 0, label: 'D' },
                            ].map(({ day, label }) => (
                              <button
                                key={day}
                                onClick={() => toggleBlockDay(block.id, day)}
                                className={cn(
                                  "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                                  block.dayOfWeek.includes(day)
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-0 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">Rappels par email</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                      <div>
                        <Label>Activer les rappels email</Label>
                        <p className="text-xs text-slate-500">Recevez un email avant chaque RDV</p>
                      </div>
                      <Switch
                        checked={config.notifications.emailReminder}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, emailReminder: checked }
                        }))}
                      />
                    </div>
                    {config.notifications.emailReminder && (
                      <div className="p-3 bg-white rounded-lg border border-slate-100">
                        <Label>Délai avant le RDV</Label>
                        <Select
                          value={config.notifications.emailReminderTime.toString()}
                          onValueChange={(val) => setConfig(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, emailReminderTime: parseInt(val) }
                          }))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes avant</SelectItem>
                            <SelectItem value="30">30 minutes avant</SelectItem>
                            <SelectItem value="60">1 heure avant</SelectItem>
                            <SelectItem value="120">2 heures avant</SelectItem>
                            <SelectItem value="1440">1 jour avant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">Notifications navigateur</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                      <div>
                        <Label>Activer les notifications</Label>
                        <p className="text-xs text-slate-500">Notifications push dans le navigateur</p>
                      </div>
                      <Switch
                        checked={config.notifications.browserNotification}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, browserNotification: checked }
                        }))}
                      />
                    </div>
                    {config.notifications.browserNotification && (
                      <div className="p-3 bg-white rounded-lg border border-slate-100">
                        <Label>Délai avant le RDV</Label>
                        <Select
                          value={config.notifications.browserNotificationTime.toString()}
                          onValueChange={(val) => setConfig(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, browserNotificationTime: parseInt(val) }
                          }))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes avant</SelectItem>
                            <SelectItem value="10">10 minutes avant</SelectItem>
                            <SelectItem value="15">15 minutes avant</SelectItem>
                            <SelectItem value="30">30 minutes avant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}

        <DialogFooter className="border-t border-slate-100 pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={saveConfig} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
